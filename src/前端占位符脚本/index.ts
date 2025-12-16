/**
 * 前端占位符检查与插入脚本
 * 功能：检查当前楼层消息中是否包含【前端占位符】，如果没有则自动插入
 */

import { z } from 'zod';

// 脚本设置
const ScriptSettings = z.object({
  enabled: z.boolean().default(true),
  placeholder_text: z.string().default('【前端占位符】'),
  auto_insert: z.boolean().default(true),
  show_notification: z.boolean().default(true),
  keep_cross_chat: z.boolean().default(true), // 是否跨聊天共享店铺缓存
});

const settings = ScriptSettings.parse(getVariables({ type: 'script', script_id: getScriptId() }));

// ================== 店铺持久化 ==================
type StoredShop = Record<string, any> & { id: string; packages?: any[]; __savedAt?: number };
const SHOP_STORE_KEY = 'shop_store_cache';
const MAX_IMPORT_ITEMS = 200;

function emitShopEvent(event: 'shop:cache:updated', payload: any) {
  try {
    window.dispatchEvent(new CustomEvent(event, { detail: payload }));
  } catch (e) {
    console.warn('[ShopStore] 事件派发失败', e);
  }
}

function hashKey(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return hash.toString(16);
}

function checksumPayload(str: string) {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum = (sum + str.charCodeAt(i)) % 65536;
  }
  return sum.toString(16);
}

function buildShopId(s: any) {
  if (s?.id) return String(s.id);
  if (s?.shop_id) return String(s.shop_id);
  const basis = [s?.name, s?.address, s?.city].filter(Boolean).join('|');
  return `shop_${hashKey(basis || JSON.stringify(s || {}))}`;
}

function getStoreScope() {
  // 根据开关决定是全局还是当前聊天作用域
  if (settings.keep_cross_chat) return { type: 'global' as const };
  const chatId = SillyTavern.getCurrentChatId?.();
  return chatId ? ({ type: 'chat' as const, chat_id: chatId } satisfies any) : ({ type: 'global' as const });
}

function readShopStore(): StoredShop[] {
  try {
    const vars = getVariables(getStoreScope()) || {};
    const list = (vars as any)[SHOP_STORE_KEY];
    console.log('[ShopStore] 读取全局缓存:', list);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn('[ShopStore] 读取失败', e);
    return [];
  }
}

function writeShopStore(shops: StoredShop[]) {
  try {
    console.log('[ShopStore] 写入全局缓存:', shops);
    replaceVariables({ [SHOP_STORE_KEY]: shops }, getStoreScope());
    emitShopEvent('shop:cache:updated', { scope: getStoreScope(), count: shops.length, op: 'write' });
  } catch (e) {
    console.warn('[ShopStore] 写入失败', e);
  }
}

function normalizeShops(raw: any[]): StoredShop[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(s => !!s)
    .slice(0, MAX_IMPORT_ITEMS)
    .map(s => {
      const id = buildShopId(s);
      return {
        ...s,
        id,
        __savedAt: Date.now(),
      };
    });
}

function saveShopsToStore(newShops: any[]) {
  const existing = readShopStore();
  const incoming = normalizeShops(newShops);
  if (incoming.length === 0) return existing;

  // 使用 Map 进行合并，支持更新现有 ID 的数据
  const shopMap = new Map<string, StoredShop>();
  existing.forEach(s => shopMap.set(s.id, s));
  incoming.forEach(s => shopMap.set(s.id, s));

  const merged = Array.from(shopMap.values());
  writeShopStore(merged);
  return merged;
}

function deleteShopFromStore(shopId: string) {
  const existing = readShopStore();
  const filtered = existing.filter(s => s.id !== shopId);
  writeShopStore(filtered);
  emitShopEvent('shop:cache:updated', { scope: getStoreScope(), count: filtered.length, op: 'delete', id: shopId });
  return filtered;
}

function getStoreApi() {
  return {
    getShops: () => readShopStore(),
    saveShops: (shops: any[]) => saveShopsToStore(shops),
    deleteShop: (id: string) => deleteShopFromStore(id),
    clear: () => {
      writeShopStore([]);
      emitShopEvent('shop:cache:updated', { scope: getStoreScope(), count: 0, op: 'clear' });
    },
  };
}

/**
 * 检查消息中是否包含占位符
 */
function containsPlaceholder(message: string): boolean {
  return message.includes(settings.placeholder_text);
}

/**
 * 在消息内容中插入占位符
 */
function insertPlaceholder(content: string): string {
  // 如果已经是最后一行，直接追加
  if (content.endsWith('\n')) {
    return content + settings.placeholder_text + '\n';
  }

  // 否则另起一行插入
  return content + '\n' + settings.placeholder_text + '\n';
}

/**
 * 获取并解析当前楼层的所有消息
 */
function getCurrentFloorMessages(): Array<{ role: string; content: string; id: string }> {
  const messageId = getCurrentMessageId();
  const messages = getChatMessages(messageId);

  if (!messages || messages.length === 0) {
    return [];
  }

  return messages.map(msg => ({
    role: msg.role,
    content: msg.message || '',
    id: (msg as any).id || '', // 类型断言绕过检查
  }));
}

/**
 * 检查当前楼层是否已有占位符
 */
function checkAndInsertPlaceholder(options: { silent?: boolean } = {}): boolean {
  const { silent = false } = options;
  try {
    const messages = getCurrentFloorMessages();

    if (messages.length === 0) {
      console.log('[前端占位符] 当前楼层无消息内容');
      return false;
    }

    // 检查所有消息是否都包含占位符
    const allHavePlaceholder = messages.every(msg => containsPlaceholder(msg.content));

    if (allHavePlaceholder) {
      console.log('[前端占位符] 当前楼层已包含占位符，跳过插入');
      return false;
    }

    // 如果没有占位符，则插入
    if (settings.auto_insert) {
      const updatedMessages = messages.map(msg => ({
        ...msg,
        content: containsPlaceholder(msg.content) ? msg.content : insertPlaceholder(msg.content),
      }));

      // 发送更新消息（使用第一个消息的ID作为基础）
      const baseMessageId = messages[0].id;

      // 构建完整消息内容
      const fullContent = updatedMessages
        .map(msg => `${msg.role === 'user' ? '你' : msg.role}: ${msg.content}`)
        .join('\n\n');

      // 使用triggerSlash发送更新命令
      triggerSlash(`/chat u ${baseMessageId} ${fullContent}`);

      if (settings.show_notification && !silent) {
        toastr.success('[前端占位符] 已自动插入占位符', '脚本提示');
      }

      console.log('[前端占位符] 已插入占位符到当前楼层');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[前端占位符] 执行失败:', error);
    if (!silent) {
      toastr.error('前端占位符插入失败，请查看控制台', '脚本错误');
    }
    return false;
  }
}

/**
 * 手动触发占位符检查
 */
function manualCheck(): void {
  const result = checkAndInsertPlaceholder();

  if (!result && settings.show_notification) {
    toastr.info('当前楼层已包含占位符，无需插入', '脚本提示');
  }
}

// =============================================================================
// 脚本初始化
// =============================================================================

$(() => {
  console.log('[前端占位符] 脚本已加载');

  // 注册手动检查按钮
  if (settings.show_notification) {
    toastr.info('点击下方"检查占位符"按钮手动执行，或启用自动插入模式', '脚本提示');
  }

  // 暴露店铺存储接口
  try {
    initializeGlobal('ShopStore', getStoreApi());
    console.log('[ShopStore] 已共享全局接口');
  } catch (e) {
    console.warn('[ShopStore] 共享全局接口失败', e);
  }
});

// =============================================================================
// 事件监听
// =============================================================================

// 监听脚本按钮点击事件
eventOn(getButtonEvent('检查占位符'), () => {
  console.log('[前端占位符] 手动检查触发');
  manualCheck();
});

// 店铺存储快捷按钮
eventOn(getButtonEvent('查看已存店铺'), () => {
  const api = getStoreApi();
  if (!api) {
    toastr.warning('ShopStore 未初始化', '店铺存储');
    return;
  }
  const list = api.getShops();
  console.log('[ShopStore] 当前店铺列表:', list);
  toastr.info(`已存 ${list.length} 个店铺`, '店铺存储');
});

eventOn(getButtonEvent('清空店铺缓存'), () => {
  const api = getStoreApi();
  if (!api) {
    toastr.warning('ShopStore 未初始化', '店铺存储');
    return;
  }
  api.clear();
  toastr.success('店铺缓存已清空', '店铺存储');
});

eventOn(getButtonEvent('导出店铺JSON'), () => {
  const api = getStoreApi();
  if (!api) {
    toastr.warning('ShopStore 未初始化', '店铺存储');
    return;
  }
  const list = api.getShops();
  const payload = {
    version: 'v1',
    generatedAt: new Date().toISOString(),
    checksum: checksumPayload(JSON.stringify(list)),
    shops: list,
  };
  const json = JSON.stringify(payload, null, 2);
  console.log('[ShopStore] 导出 JSON:', json);

  // 生成下载文件（浏览器端）
  try {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const topDoc = (window.top || window).document;
    const a = topDoc.createElement('a');
    const ts = new Date();
    const pad = (n: number) => `${n}`.padStart(2, '0');
    const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(
      ts.getMinutes(),
    )}${pad(ts.getSeconds())}`;
    a.href = url;
    a.download = `shops_${stamp}.json`;
    topDoc.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    toastr.success(`已保存 ${list.length} 家店铺为文件 shops_${stamp}.json`, '店铺存储');
  } catch (e) {
    try {
      // 部分 iframe 环境禁止 download，退回 data URL 方式
      const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
      window.open(dataUrl, '_blank');
      toastr.info(`已在新标签页打开 JSON（共 ${list.length} 家）`, '店铺存储');
    } catch (err) {
      console.warn('[ShopStore] 文件导出失败，已退回控制台输出', err);
      toastr.warning('文件导出失败，已在控制台输出 JSON', '店铺存储');
    }
  }
});

// 切换跨聊天共享开关
eventOn(getButtonEvent('切换店铺跨聊天保留'), () => {
  const newSetting = { ...settings, keep_cross_chat: !settings.keep_cross_chat };
  replaceVariables(newSetting, { type: 'script', script_id: getScriptId() });
  settings.keep_cross_chat = newSetting.keep_cross_chat;
  // 清理当前存储，防止作用域切换时旧数据混入
  writeShopStore([]);
  toastr.success(`跨聊天保留店铺：${newSetting.keep_cross_chat ? '开启' : '关闭'}`, '店铺存储');
});

// 监听消息发送完成事件，在新消息产生后自动检查
eventOn(tavern_events.MESSAGE_SENT, (_messageId: number) => {
  if (settings.auto_insert && settings.enabled) {
    console.log('[前端占位符] 消息发送完成，自动检查');
    // 延迟执行，确保消息已保存
    setTimeout(() => {
      // 静默模式，避免订单类系统消息触发提示/报错
      checkAndInsertPlaceholder({ silent: true });
    }, 100);
  }
});

// 监听聊天切换事件
eventOn(tavern_events.CHAT_CHANGED, (newChatId: string) => {
  console.log('[前端占位符] 聊天切换到:', newChatId);
});

// =============================================================================
// 导出设置更新函数
// =============================================================================

type ScriptSettingsType = z.infer<typeof ScriptSettings>;

/**
 * 更新设置
 */
export function updateSettings(newSettings: Partial<ScriptSettingsType>): void {
  const updated = { ...settings, ...newSettings };
  replaceVariables(updated, { type: 'script', script_id: getScriptId() });

  if (settings.show_notification) {
    toastr.success('设置已更新', '脚本提示');
  }
}

/**
 * 获取当前设置
 */
export function getSettings(): ScriptSettingsType {
  return ScriptSettings.parse(getVariables({ type: 'script', script_id: getScriptId() }));
}

// =============================================================================
// 页面卸载清理
// =============================================================================

$(window).on('pagehide', () => {
  console.log('[前端占位符] 脚本已卸载');
});

// =============================================================================
// 主动执行一次检查（可选，注释掉以禁用）
// =============================================================================

// 在脚本加载时主动检查一次
// checkAndInsertPlaceholder();
