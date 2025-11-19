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
});

const settings = ScriptSettings.parse(getVariables({ type: 'script', script_id: getScriptId() }));

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
    id: msg.id,
  }));
}

/**
 * 检查当前楼层是否已有占位符
 */
function checkAndInsertPlaceholder(): boolean {
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

      if (settings.show_notification) {
        toastr.success('[前端占位符] 已自动插入占位符', '脚本提示');
      }

      console.log('[前端占位符] 已插入占位符到当前楼层');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[前端占位符] 执行失败:', error);
    toastr.error('前端占位符插入失败，请查看控制台', '脚本错误');
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
});

// =============================================================================
// 事件监听
// =============================================================================

// 监听脚本按钮点击事件
eventOn(getButtonEvent('检查占位符'), () => {
  console.log('[前端占位符] 手动检查触发');
  manualCheck();
});

// 监听消息发送完成事件，在新消息产生后自动检查
eventOn(tavern_events.MESSAGE_SENT, (messageId: string) => {
  if (settings.auto_insert && settings.enabled) {
    console.log('[前端占位符] 消息发送完成，自动检查');
    // 延迟执行，确保消息已保存
    setTimeout(() => {
      checkAndInsertPlaceholder();
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

/**
 * 更新设置
 */
export function updateSettings(newSettings: Partial<ScriptSettings>): void {
  const updated = { ...settings, ...newSettings };
  replaceVariables(updated, { type: 'script', script_id: getScriptId() });

  if (settings.show_notification) {
    toastr.success('设置已更新', '脚本提示');
  }
}

/**
 * 获取当前设置
 */
export function getSettings(): ScriptSettings {
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
