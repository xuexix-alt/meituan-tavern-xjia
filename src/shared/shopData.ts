/**
 * 数据解析工具模块（共享）
 * - 从酒馆消息中提取店铺 / 套餐数据
 * - 可被前端 APP 与脚本共享调用
 */

import { z } from 'zod';

const JSON_NORM_ANCHOR = 'json规范格式';
const MSG_SCAN_LIMIT = 10; // 向上扫描最近 10 楼

// 规范化方括号标签，允许行首空格的写法，例如 "  [套餐]"
function normalizeBracketTags(text: string) {
  return text.replace(/^\s*\[(\/?店铺|\/?套餐)\]\s*$/gm, (_m, tag) => `[${tag}]`);
}

// 容错子弹行：去掉常见前缀（- * · • 1. ①等）和包裹引号
function normalizeBullet(line: string) {
  return line
    .replace(/^\s*[-*?·•‧‒–—‐−－\d一二三四五六七八九十()（）.]+/u, '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();
}

// ================= 数据模型 & 错误码 =================
export const PackageSchema = z.object({
  id: z.string().min(1).optional(), // 允许后续注入
  shop_id: z.string().optional(),
  shop_name: z.string().optional(),
  name: z.string().min(1, '套餐必须包含名称'),
  price: z.union([z.number(), z.string()]).default('N/A'),
  stars: z.number().min(0).max(5).default(0),
  tags: z.array(z.string()).default([]),
  icon: z.string().nullable().optional(),
  image1: z.string().default(''),
  image2: z.string().default(''),
  image3: z.string().default(''),
  description: z.string().default(''),
  content: z.array(z.string()).default([]),
  reviews: z.array(z.string()).default([]),
});

export const ShopSchema = z.object({
  id: z.string().min(1).optional(), // 允许后续生成
  shop_id: z.string().optional(),
  name: z.string().min(1).optional(), // 缺失时后续兜底为“未命名店铺”
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  shoptags: z.array(z.string()).default([]),
  slogan: z.string().default('优质服务'),
  theme: z.string().default('默认'),
  packages: z.array(PackageSchema).default([]),
});

type ShopType = z.infer<typeof ShopSchema>;
type PackageType = z.infer<typeof PackageSchema>;

type ParseErrorCode = 'P001' | 'P002' | 'P003' | 'D001' | 'D002';

const PARSE_CODES: Record<ParseErrorCode, string> = {
  P001: 'JSON 解析失败',
  P002: 'YAML 解析失败',
  P003: '文本标签解析失败',
  D001: '必填字段缺失',
  D002: '去重冲突',
};

function logParse(step: string, ok: boolean, detail?: unknown) {
  const prefix = `[parse][${step}]`;
  if (ok) {
    console.log(`${prefix}[success]`, detail ?? '');
  } else {
    console.warn(`${prefix}[fail]`, detail ?? '');
  }
}

// ================ 裁剪 & 预处理 ================
function slicePhoneContent(text: string) {
  // 不再裁剪范围，而是直接移除标签本身，防止干扰解析
  // 这样无论数据在标签内还是标签外，都能被保留下来送入解析
  return text
    .replace(/\[\/?手机界面(开始|结束)[^\]]*\]/g, '')
    .replace(/\[\/?推荐标签[^\]]*\]/g, '')
    .replace(/^\s*\[(推荐标签)\]\s*$/gm, '');
}

function extractJsonNorm(text: string): string | null {
  const anchor = text.indexOf(JSON_NORM_ANCHOR);
  if (anchor === -1) return null;
  const after = text.slice(anchor);
  const braceStart = after.indexOf('{');
  if (braceStart === -1) return null;
  const globalStart = anchor + braceStart;
  const content = text.slice(globalStart);
  const end = findMatchingBrace(content, 0);
  if (end === -1) return null;
  return content.slice(0, end + 1);
}

// 简单缓存，避免同一会话内重复解析
let lastParsedData: { shops: any[]; packages: any[] } | null = null;
let lastParsedMessageId: string | null = null;

function emitParseEvent(event: 'shop:parse:requested' | 'shop:parse:done', detail: any) {
  try {
    window.dispatchEvent(new CustomEvent(event, { detail }));
  } catch (e) {
    // 安静失败，避免影响解析
  }
}

// 确定性 ID 生成器：仅用于兜底，确保无 ID 数据能渲染
function createIdFactory(prefix: string) {
  let counter = 0;
  return () => `${prefix}_auto_${counter++}`;
}

function getShopStoreApi() {
  const api = (window as any).ShopStore;
  return api && typeof api.getShops === 'function' ? api : null;
}

function rememberData(data: { shops: any[]; packages: any[] }, messageId: string) {
  lastParsedData = data;
  lastParsedMessageId = messageId;
}

function fetchMessagePayload(range?: string | number): { messageId: string; text: string } | null {
  const tried = new Set<string | number>();
  const pushCandidate = (c: string | number) => {
    if (typeof c === 'number' && c < 0) return;
    tried.add(c);
  };

  if (typeof range !== 'undefined') pushCandidate(range);
  try {
    const current = getCurrentMessageId();
    if (typeof current === 'number' && !Number.isNaN(current)) pushCandidate(current);
  } catch (err) {
    console.warn('[fetchMessagePayload] getCurrentMessageId failed', err);
  }
  // 关键候选：最后一条消息(-1) 和 开场白(0)
  // 由于 ShopStore 已经负责了持久化缓存，不再需要盲目向上扫描 10 楼
  // 且原有的扫描逻辑存在 Bug (遇到第一条非空文本就停止，无论是否包含店铺)，因此移除无效的扫描循环
  pushCandidate(-1);
  pushCandidate(0);

  for (const candidate of Array.from(tried)) {
    try {
      let entries: any[] = [];
      if (typeof candidate === 'number' && candidate < 0) {
        entries = getChatMessages(candidate, { include_swipes: true, role: 'all', hide_state: 'all' } as any);
      } else if (candidate === -1) {
        entries = getChatMessages(-1, { include_swipes: true, role: 'all', hide_state: 'all' } as any);
      } else {
        entries = getChatMessages(candidate, { include_swipes: true, role: 'all', hide_state: 'all' } as any);
      }
      if (!entries || entries.length === 0) continue;
      const parts: string[] = [];
      entries.forEach(entry => {
        // 优先获取当前显示的消息内容
        let content = (entry as any).message;
        // 如果是 ChatMessageSwiped 类型（没有 message 字段），则根据 swipe_id 获取当前选中的 swipe
        if (!content && Array.isArray((entry as any).swipes)) {
          const swipeId = (entry as any).swipe_id || 0;
          content = (entry as any).swipes[swipeId];
        }
        if (content) parts.push(String(content));
      });
      const text = parts.join('\n\n').trim();
      if (!text) continue;
      const messageId = String(entries[0]?.message_id ?? candidate ?? 'latest');
      console.log(
        '[fetchMessagePayload] hit candidate=',
        candidate,
        'messageId=',
        messageId,
        'snippet=',
        text.slice(0, 80),
      );
      return { messageId, text };
    } catch (err) {
      console.warn('[fetchMessagePayload] failed at candidate', candidate, err);
    }
  }
  console.warn('[fetchMessagePayload] no payload found after scanning');
  return null;
}

function hashKey(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

function generateShopId(shop: Partial<ShopType>) {
  const explicit = shop.id || (shop as any).shop_id;
  if (explicit) return String(explicit);
  const basis = [shop.name, shop.address, shop.city].filter(Boolean).join('|');
  if (basis) return `shop_${hashKey(basis)}`;
  return `shop_${hashKey(JSON.stringify(shop))}`;
}

function generatePkgId(pkg: Partial<PackageType>, shopId: string, makePkgId: () => string) {
  if (pkg.id) return String(pkg.id);
  const basis = `${shopId}|${pkg.name || ''}|${pkg.price || ''}`;
  return `pkg_${hashKey(basis) || makePkgId()}`;
}

function flattenPackagesFromShops(shops: any[]) {
  return shops
    .flatMap(shop => shop?.packages || [])
    .map((pkg: any, idx: number) => ({
      ...pkg,
      id: String(pkg.id || `pkg_${idx}`),
      shop_id: String(
        pkg.shop_id ||
          (pkg.shopId ?? (pkg.shop || {}).id) ||
          shops.find(s => (s.packages || []).includes(pkg))?.id ||
          '',
      ),
    }));
}

// 纯文本标签解析（[店铺]/[套餐]），可复用在不同分支
function parseTextOnly(src: string, makeShopId: () => string, makePkgId: () => string) {
  const shops: any[] = [];
  const packages: any[] = [];
  let pkgNameCounter = 1;

  const splitArrayValues = (val: string): string[] =>
    val
      .split(/[,，/、|]/)
      .map(s => s.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);

  // 增强分割逻辑：不仅按 [店铺] 分割，还要处理店铺之间的无关文本
  // 策略：先按 [店铺] 分割，然后对每一块，只取到 [/店铺] 或下一个 [店铺] 之前的内容
  // 如果没有 [店铺] 标签，则尝试把整段当作一个店铺（兼容旧逻辑）
  let rawShopSections: string[] = [];
  if (src.includes('[店铺]')) {
    // 使用正则捕获 [店铺]...[/店铺] 之间的内容，或者 [店铺]... 到下一个 [店铺] 之前
    // 注意：JS正则不支持 dotAll 模式直到 ES2018，这里用 [\s\S] 代替 .
    // 贪婪匹配可能导致问题，所以我们手动 split
    const parts = src.split('[店铺]');
    // parts[0] 是第一个 [店铺] 之前的内容，忽略
    rawShopSections = parts.slice(1).map(part => {
      // 尝试找到闭合标签
      const closeIndex = part.indexOf('[/店铺]');
      if (closeIndex !== -1) {
        return part.slice(0, closeIndex);
      }
      // 如果没有闭合标签，则假定到下一个 [店铺] 之前都是（即整个 part，因为我们已经 split 了）
      return part;
    });
  } else {
    rawShopSections = ['[店铺]\n[套餐]\n' + src];
  }

  rawShopSections.forEach(rawSection => {
    // 再次清理，确保没有残留的 [/店铺] (虽然上面处理过，但为了保险)
    const section = rawSection.split('[/店铺]')[0];

    const [shopHeader = '', ...packageSectionsRaw] = section.split('[套餐]');
    const shopLines = shopHeader
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    const shop: any = {
      id: '',
      name: '未命名店铺',
      shoptags: [],
      slogan: '优质服务',
      theme: '默认',
      packages: [],
    };
    const nameLine = shopLines.find(line => /^name[:：]/i.test(line));
    if (nameLine) {
      // 改进店铺名称提取：只取第一个[套餐]之前的内容
      const rawName = nameLine.replace(/^name[:：]/i, '').trim();
      const bracketIndex = rawName.indexOf('[套餐]');
      if (bracketIndex !== -1) {
        shop.name = rawName.substring(0, bracketIndex).trim();
      } else {
        shop.name = rawName;
      }
    } else if (!section.includes('[店铺]')) {
      shop.name = '默认店铺';
    }
    const idLine = shopLines.find(line => /^(id|shop_id)[:：]/i.test(line));
    if (idLine) {
      shop.id = idLine.replace(/^(id|shop_id)[:：]/i, '').trim();
    }
    const shoptagsIndex = shopLines.findIndex(line => /^shoptags[:：]/i.test(line));
    if (shoptagsIndex !== -1) {
      const firstVal = shopLines[shoptagsIndex].replace(/^shoptags[:：]/i, '').trim();
      if (firstVal) shop.shoptags.push(...splitArrayValues(firstVal));
      for (let i = shoptagsIndex + 1; i < shopLines.length; i++) {
        if (shopLines[i].match(/^[-*?·－]/)) {
          shop.shoptags.push(shopLines[i].replace(/^[-*?·－]\s*/, '').trim());
        } else if (shopLines[i].startsWith("'") || shopLines[i].startsWith('"')) {
          shop.shoptags.push(shopLines[i].replace(/^["']|["']$/g, '').trim());
        } else if (shopLines[i].includes(':') || shopLines[i].includes('：')) {
          break;
        } else {
          const val = shopLines[i].trim();
          if (val) shop.shoptags.push(...splitArrayValues(val));
        }
      }
    }
    if (shoptagsIndex !== -1 && shop.shoptags.length === 0) {
      for (let i = shoptagsIndex + 1; i < shopLines.length; i++) {
        if (shopLines[i].includes(':')) break;
        const val = shopLines[i].replace(/^["']|["']$/g, '').trim();
        if (val) shop.shoptags.push(val);
      }
    }
    if (!shop.id) shop.id = makeShopId();
    if (shop.shoptags.length > 0) {
      shop.slogan = shop.shoptags.join(' / ');
      shop.theme = shop.shoptags[0] || '默认';
    }

    packageSectionsRaw.forEach(pkgSectionRaw => {
      // 处理套餐闭合标签 [/套餐]
      const pkgLines = (pkgSectionRaw.split('[/套餐]')[0] ?? pkgSectionRaw)
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
      if (pkgLines.length === 0) return;
      const pkg: any = {
        id: makePkgId(),
        shop_id: shop.id,
        shop_name: shop.name,
        name: '',
        price: 'N/A',
        stars: 0,
        tags: [],
        icon: null,
        image1: '',
        image2: '',
        image3: '',
        description: '',
        content: [],
        reviews: [],
      };
      let currentArrayField: string | null = null;
      let currentScalarField: string | null = null;

      pkgLines.forEach(line => {
        const match = line.match(/^([^:：]+)[:：](.*)$/);
        let isKnownField = false;

        if (match) {
          const keyRaw = match[1].trim().toLowerCase();
          if (
            [
              'name',
              'price',
              'stars',
              'icon',
              'image1',
              'image2',
              'image3',
              'description',
              'tags',
              'content',
              'reviews',
            ].includes(keyRaw)
          ) {
            isKnownField = true;
          }
        }

        if (isKnownField && match) {
          const fieldName = match[1].trim().toLowerCase();
          const value = match[2].trim();
          if (['name', 'price', 'stars', 'icon', 'image1', 'image2', 'image3', 'description'].includes(fieldName)) {
            const key = fieldName as keyof typeof pkg;
            pkg[key] = fieldName === 'stars' ? parseFloat(value) || 0 : value;
            currentArrayField = null;
            if (['description', 'image1', 'image2', 'image3'].includes(fieldName)) {
              currentScalarField = fieldName;
            } else {
              currentScalarField = null;
            }
          } else if (['tags', 'content', 'reviews'].includes(fieldName)) {
            currentArrayField = fieldName;
            currentScalarField = null;
            if (value) {
              const items = value.startsWith('-') ? [value.replace(/^-/, '').trim()] : splitArrayValues(value);
              items.forEach(v => {
                const cleaned = v.replace(/^["']|["']$/g, '').trim();
                if (cleaned) pkg[fieldName].push(cleaned);
              });
            }
          }
        } else if (['tags', 'content', 'reviews'].includes(line.toLowerCase())) {
          currentArrayField = line.toLowerCase();
          currentScalarField = null;
        } else if (currentArrayField) {
          const val = normalizeBullet(line);
          if (val) pkg[currentArrayField].push(val);
        } else if (currentScalarField) {
          pkg[currentScalarField] += '\n' + line;
        }
      });
      if (!pkg.name && (pkg.content.length > 0 || pkg.reviews.length > 0 || pkg.tags.length > 0)) {
        pkg.name = `套餐${pkgNameCounter++}`;
      }
      if (pkg.name) {
        shop.packages.push(pkg);
        packages.push(pkg);
      }
    });

    shops.push(shop);
  });

  return { shops, packages };
}

function sanitizeShops(shops: any[]) {
  const map = new Map<string, any>();
  (shops || []).forEach(s => {
    if (!s) return;
    const firstPkgName = Array.isArray(s?.packages) && s.packages[0]?.name ? s.packages[0].name : '';
    const base = {
      ...s,
      name: s?.name || (firstPkgName ? `默认店铺·${firstPkgName}` : '未命名店铺'),
      packages: Array.isArray(s?.packages) ? s.packages : [],
      id: generateShopId(s),
    };
    let parsed: ShopType | null = null;
    try {
      parsed = ShopSchema.parse(base);
    } catch (e) {
      logParse('sanitize_shop', false, e);
      // 兜底：不再丢弃，保留简化结构
      parsed = {
        id: String(base.id || generateShopId(base)),
        name: base.name || '未命名店铺',
        shoptags: Array.isArray(base.shoptags) ? base.shoptags : [],
        slogan: base.slogan || '优质服务',
        theme: base.theme || '默认',
        packages: Array.isArray(base.packages) ? base.packages : [],
      } as ShopType;
    }
    if (!parsed) return;
    const dedupeKey =
      (parsed as any).shop_id && String((parsed as any).shop_id)
        ? `id:${String((parsed as any).shop_id)}`
        : parsed.name
          ? `name:${parsed.name}`
          : `auto:${generateShopId(parsed)}`;
    if (!map.has(dedupeKey)) {
      map.set(dedupeKey, parsed);
    }
  });
  return Array.from(map.values());
}

/**
 * 从酒馆消息提取数据
 * @returns 包含店铺和套餐数据的对象
 */
export function extractDataFromMessage(): { shops: any[]; packages: any[] } {
  try {
    const storeApi = getShopStoreApi();
    const payload = fetchMessagePayload();
    if (payload) {
      emitParseEvent('shop:parse:requested', { messageId: payload.messageId });
      const parsed = parseShopData(payload.text);
      if (parsed.shops.length > 0 || parsed.packages.length > 0) {
        rememberData(parsed, payload.messageId);
        emitParseEvent('shop:parse:done', { messageId: payload.messageId, parsed: parsed.shops.length, errors: [] });
        return parsed;
      }
      emitParseEvent('shop:parse:done', { messageId: payload.messageId, parsed: 0, errors: ['empty result'] });
    } else {
      console.warn('[extractDataFromMessage] no payload, fallback store cache');
    }

    if (storeApi) {
      const storedShops = sanitizeShops(storeApi.getShops() || []);
      if (storedShops.length > 0) {
        const pkgs = flattenPackagesFromShops(storedShops);
        return { shops: storedShops, packages: pkgs };
      }
    }

    return { shops: [], packages: [] };
  } catch (e) {
    console.warn('[extractDataFromMessage] failed', e);
    return { shops: [], packages: [] };
  }
}

/**
 * 从指定楼层提取数据
 * @param messageId 消息楼层ID
 * @returns 包含店铺和套餐数据的对象，如果失败返回null
 */
export function extractDataFromSpecificMessage(messageId: string): { shops: any[]; packages: any[] } | null {
  const payload = fetchMessagePayload(messageId);
  if (!payload) return null;
  emitParseEvent('shop:parse:requested', { messageId: payload.messageId });
  const parsed = parseShopData(payload.text);
  emitParseEvent('shop:parse:done', { messageId: payload.messageId, parsed: parsed.shops.length, errors: [] });
  rememberData(parsed, payload.messageId);
  return parsed;
}

/**
 * 解析店铺数据
 * 设计目标：
 * - 仅依赖 [店铺] ... [/店铺]（或文本结尾）作为店铺边界
 * - 即使 AI 输出被截断，只要出现了部分店铺内容，也尽量保留已输出的字段
 * - 套餐同样支持缺少 [/套餐] 的容错
 */
export function parseShopData(text: string): { shops: any[]; packages: any[] } {
  const makeShopId = createIdFactory('shop');
  const makePkgId = createIdFactory('pkg');
  const pkgNameCounter = 1;
  const finalizeResult = (raw: { shops: any[]; packages: any[] }) => {
    const sanitizedShops = sanitizeShops(raw.shops);
    // 重新铺平套餐，确保 ID / shop_id 一致
    const flatPkgs = flattenPackagesFromShops(sanitizedShops).map(pkg => ({
      ...pkg,
      id: pkg.id || generatePkgId(pkg, pkg.shop_id || 'unknown', makePkgId),
    }));
    return { shops: sanitizedShops, packages: flatPkgs };
  };

  // 预切手机界面范围，减小噪音
  text = normalizeBracketTags(slicePhoneContent(text));
  if (!text.trim()) {
    logParse('input', false, 'empty text');
    return { shops: [], packages: [] };
  }

  // 0.0 若存在“json规范格式”锚点，优先尝试规范 JSON
  const jsonNorm = extractJsonNorm(text);
  if (jsonNorm) {
    try {
      const parsed = JSON.parse(jsonNorm.replace(/，/g, ','));
      const normalized = normalizeJsonData(parsed);
      logParse('json_norm', true, { shops: normalized.shops.length });
      return finalizeResult(normalized);
    } catch (e) {
      logParse('json_norm', false, e);
    }
  }

  // 0. 优先尝试 JS 模板格式（json_template.js 的写法）
  const jsParsed = tryParseJsTemplate(text);
  if (jsParsed) {
    // 只有当解析出有效套餐，或者店铺有明确名称（非默认）时，才认为是成功的 JS 模板解析
    // 避免把无关的 { ... } 文本误判为有效店铺
    const hasValidContent =
      jsParsed.packages.length > 0 ||
      jsParsed.shops.some(s => s.name && s.name !== '未命名店铺' && s.name !== '默认店铺');

    if (hasValidContent) {
      logParse('js_template', true, { shops: jsParsed.shops.length });
      return finalizeResult(jsParsed);
    } else {
      logParse('js_template', false, 'empty or invalid result, continue fallback');
    }
  }

  // 0.25 优先尝试显式标签的文本解析
  if (text.includes('[店铺]')) {
    const textParsed = parseTextOnly(text, makeShopId, makePkgId);
    if (textParsed && textParsed.shops.length > 0) {
      logParse('text_tags_priority', true, { shops: textParsed.shops.length });
      return finalizeResult(textParsed);
    }
  }

  // 0.5 尝试解析 YAML 格式 (依赖 window.YAML)
  // 特征：包含 "shops:" 或 "- name:"，或者包含 "[店铺]" 且内容看起来像 YAML
  if ((window as any).YAML && (text.includes('shops:') || text.includes('- name:') || text.includes('[店铺]'))) {
    // 策略 A: 如果包含 [店铺] 标签，优先按标签分割解析 (针对用户提供的多店铺 YAML 案例)
    if (text.includes('[店铺]')) {
      const sections = text.split('[店铺]').slice(1);
      const combinedShops: any[] = [];

      for (const section of sections) {
        // 去除可能的结束标签和干扰文本
        const cleanSection = section.split('[/店铺]')[0].trim();

        if (!cleanSection) continue;

        // 如果片段里包含 [套餐]，优先走文本解析，避免 YAML.parse 因标签报错
        if (cleanSection.includes('[套餐]')) {
          const viaText = parseShopData(`[店铺]\n${cleanSection}\n[/店铺]`);
          if (viaText.shops.length > 0) {
            combinedShops.push(...viaText.shops);
            continue;
          }
        }

        try {
          const parsedShop = (window as any).YAML.parse(cleanSection);
          // console.log('[shopData] YAML 片段解析结果:', parsedShop);
          if (parsedShop && typeof parsedShop === 'object') {
            // 简单的有效性检查
            if (parsedShop.name || parsedShop.packages || parsedShop.shop_id) {
              combinedShops.push(parsedShop);
            }
          }
        } catch (e) {
          console.warn('[shopData] YAML 片段解析失败，尝试正则兜底:', e);
          // 正则兜底解析 (针对 window.YAML 失败或格式微瑕疵的情况)
          const fallbackShop = parseYamlShopByRegex(cleanSection);
          if (fallbackShop) {
            combinedShops.push(fallbackShop);
          }
        }
      }

      if (combinedShops.length > 0) {
        console.log('[shopData] YAML 分段解析成功，共提取店铺:', combinedShops.length);
        logParse('yaml_segments', true, { shops: combinedShops.length });
        return finalizeResult(normalizeJsonData({ shops: combinedShops }));
      }
    }

    // 策略 B: 尝试整体解析 (针对无标签的纯 YAML 或单体结构)
    try {
      const parsed = (window as any).YAML.parse(text);
      const normalized = normalizeJsonData(parsed);
      if (normalized.shops.length > 0) {
        logParse('yaml_full', true, { shops: normalized.shops.length });
        return finalizeResult(normalized);
      }
    } catch (e) {
      // 忽略
    }
  }

  // 辅助函数：判断是否为无效的空结果（无套餐且店铺名为默认）
  const isInvalidEmptyResult = (res: { shops: any[]; packages: any[] }) => {
    if (res.packages.length > 0) return false;
    const hasNamed = res.shops.some(
      s => s.name && s.name !== '未命名店铺' && s.name !== '默认店铺' && !s.name.startsWith('默认店铺·'),
    );
    return !hasNamed;
  };

  // 1. 尝试解析 JSON 格式
  try {
    // 移除可能的 Markdown 代码块标记
    let jsonText = text.trim();
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }

    // 若前缀有说明文字（如 "const template ="），提取首个大括号开始的内容
    if (!jsonText.startsWith('{') && !jsonText.startsWith('[')) {
      const braceIndex = jsonText.indexOf('{');
      if (braceIndex !== -1) {
        jsonText = jsonText.slice(braceIndex);
      }
    }

    // 简单的启发式检查：如果以 { 或 [ 开头，尝试作为 JSON 解析
    if (jsonText.startsWith('{') || jsonText.startsWith('[')) {
      const parsed = JSON.parse(jsonText);
      const normalized = normalizeJsonData(parsed);
      const finalRes = finalizeResult(normalized);
      // 只有当结果有效时才返回
      if (!isInvalidEmptyResult(finalRes)) {
        logParse('json', true, { shops: finalRes.shops.length });
        return finalRes;
      }
    }
  } catch (e) {
    // 忽略直接解析错误，尝试后续的容错解析
  }

  // 1.1 容错：截断/掺杂文本时，提取最大可解析 JSON 子串
  // 专门针对用户提供的混合格式：文本中包含 { shops: [...] }
  const tolerant = tryParseLargestJsonChunk(text);
  if (tolerant) {
    const finalRes = finalizeResult(tolerant);
    // 同样进行有效性检查
    if (!isInvalidEmptyResult(finalRes)) {
      logParse('json_tolerant', true, { shops: tolerant.shops.length });
      return finalRes;
    }
  }

  // 2. 原有的文本解析逻辑（并允许直接是套餐块，此时构造一个虚拟店铺承载）
  const textParsed = parseTextOnly(text, makeShopId, makePkgId);
  let { shops, packages } = textParsed;

  // 兜底：如果未解析出任何套餐，尝试把整段文本当作单个套餐块再解析一次
  if (packages.length === 0) {
    const fallbackShop = shops[0] || {
      id: makeShopId(),
      name: '默认店铺',
      shoptags: [],
      slogan: '优质服务',
      theme: '默认',
      packages: [],
    };
    if (shops.length === 0) shops.push(fallbackShop);

    const singlePkg = parseLoosePackage(text, fallbackShop, makePkgId);
    if (singlePkg) {
      fallbackShop.packages.push(singlePkg);
      packages.push(singlePkg);
      shops = [fallbackShop];
    } else {
      const bulletPkg = parseContentBulletsOnly(text, fallbackShop, makePkgId);
      if (bulletPkg) {
        fallbackShop.packages.push(bulletPkg);
        packages.push(bulletPkg);
        shops = [fallbackShop];
      } else if (!text.includes('[店铺]')) {
        // 如果没解析出套餐，且原文不包含显式店铺标签，则认为是纯剧情，丢弃自动生成的兜底店铺
        shops = [];
      }
      // 如果原文包含 [店铺]，则保留该店铺（可能是仅有店铺定义而无套餐的情况）
    }
  }

  const result = finalizeResult({ shops, packages });

  // 3. 严格过滤：如果是文本解析模式（非 JSON/YAML），且没有显式店铺标签，且最终没有有效套餐
  // 则视为解析失败，丢弃自动生成的空店铺。
  // 这里的 text 已经是经过 slicePhoneContent 和 normalizeBracketTags 处理过的
  const hasExplicitTag = text.includes('[店铺]');
  // 简单的 YAML 特征检查（虽然前面有 YAML 解析块，但可能 fall through 到这里）
  const hasYamlFeature = (window as any).YAML && (text.includes('shops:') || text.includes('- name:'));

  if (!jsonNorm && !jsParsed && !hasExplicitTag && !hasYamlFeature && result.packages.length === 0) {
    // 允许例外：如果原解析结果中有店铺明确被命名了（不是默认的未命名/默认店铺），则保留
    // 这对应 "name: 某某店" 但没有套餐的情况
    const hasNamedShop = result.shops.some(
      s => s.name && s.name !== '未命名店铺' && s.name !== '默认店铺' && !s.name.startsWith('默认店铺·'),
    );

    if (!hasNamedShop) {
      logParse('text_strict_filter', false, 'no packages and no explicit shop tag, discard empty shop');
      return { shops: [], packages: [] };
    }
  }

  logParse('text', true, { shops: result.shops.length, packages: result.packages.length });
  return result;
}

/**
 * 解析类似 json_template.js 的 JS 对象格式
 * 支持：
 * - 带有 "const template = {...};" 或 "export default template;" 的写法
 * - 单独的对象字面量（含注释、末尾逗号）
 */
function tryParseJsTemplate(text: string): { shops: any[]; packages: any[] } | null {
  try {
    const objectLiteral = extractTemplateObject(text);
    if (!objectLiteral) return null;

    const cleaned = objectLiteral
      // 去掉块注释和行注释
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n\r]*/g, '')
      // 去掉对象/数组末尾多余逗号
      .replace(/,\s*([}\]])/g, '$1')
      .trim();

    // 对可能截断的内容做简单括号补全
    const balanced = balanceBraces(cleaned);

    try {
      const parsed = JSON.parse(balanced);
      return normalizeJsonData(parsed);
    } catch (_) {
      // 允许更宽松的 JS 字面量（未加引号的键、尾随逗号）
      const looseParsed = tryParseLooseJsLiteral(balanced);
      if (looseParsed) return normalizeJsonData(looseParsed);
      throw _;
    }
  } catch (e) {
    return null;
  }
}

/**
 * 从文本中提取模板对象字面量（含首尾大括号）
 * 优先匹配 "const template ="，否则匹配第一个 '{' 到平衡的 '}'。
 */
function extractTemplateObject(text: string): string | null {
  const source = text.trim();

  // 先尝试匹配典型写法：const template = { ... };
  const tplIndex = source.search(/const\s+template\s*=/);
  if (tplIndex !== -1) {
    const braceStart = source.indexOf('{', tplIndex);
    if (braceStart !== -1) {
      const braceEnd = findMatchingBrace(source, braceStart);
      if (braceEnd !== -1) {
        return source.slice(braceStart, braceEnd + 1);
      }
    }
  }

  // 兜底：找到第一个 '{'，向后寻找匹配的 '}'
  const firstBrace = source.indexOf('{');
  if (firstBrace === -1) return null;
  const end = findMatchingBrace(source, firstBrace);

  // 如果找到匹配的 }，正常返回；如果没找到（可能被截断），则提取到末尾，依靠后续 balanceBraces 补全
  if (end !== -1) {
    return source.slice(firstBrace, end + 1);
  } else {
    // 激进模式：假设从 firstBrace 到末尾是尚未闭合的对象
    return source.slice(firstBrace);
  }
}

/**
 * 智能的括号配对查找，能够识别并跳过字符串内部的括号
 * 返回与 startIndex 的 '{' 对应的 '}' 位置
 */
function findMatchingBrace(str: string, startIndex: number): number {
  let depth = 0;
  let inString: false | "'" | '"' = false;
  let isEscaped = false;

  for (let i = startIndex; i < str.length; i++) {
    const ch = str[i];

    // 处理转义字符
    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (ch === '\\') {
      isEscaped = true;
      continue;
    }

    // 处理字符串边界
    if (inString) {
      if (ch === inString) {
        inString = false;
      }
    } else if (ch === '"' || ch === "'") {
      inString = ch;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * 在对象文本可能被截断时，按未闭合的层级补齐右花括号
 */
function balanceBraces(str: string): string {
  let depth = 0;
  for (const ch of str) {
    if (ch === '{') depth += 1;
    else if (ch === '}') depth = Math.max(0, depth - 1);
  }
  return depth > 0 ? str + '}'.repeat(depth) : str;
}

/**
 * 尝试以极简安全方式解析宽松 JS 对象字面量
 * 支持：未加引号的键、尾随逗号
 * 安全措施：阻止 function / => / import / export 等关键字，以避免执行代码
 */
function tryParseLooseJsLiteral(str: string): any | null {
  // 1. 预处理：修复非标准 {content} 字符串 (无冒号内容视为字符串)
  const processing = str.replace(/([:,[]\s*)\{([^:{}]+)\}/g, (match, prefix, content) => {
    if (content.trim().startsWith('"') || content.trim().startsWith("'")) return match;
    return `${prefix}"${content.trim()}"`;
  });

  // 2. 抽离所有字符串，避免干扰结构解析和安全检查
  const stringStore: string[] = [];
  const strSkeleton = processing.replace(/"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g, match => {
    // 关键修复：将字符串内的物理换行符转义，否则 new Function 会报错
    const safeStr = match.replace(/\r?\n/g, '\\n');
    stringStore.push(safeStr);
    return `__STR_${stringStore.length - 1}__`;
  });

  // 3. 安全检查
  const unsafeKeyword = /(function\b|=>|\bclass\b|\bwhile\b|\bfor\b|\bimport\b|\bexport\b|\beval\b|\brequire\b)/;
  if (unsafeKeyword.test(strSkeleton)) return null;

  // 4. 给键加引号 (仅处理无引号键)
  // 注意：如果原数据是标准 JSON (键已有引号)，这里不会匹配到，因为它们变成了 __STR_
  let cleaned = strSkeleton.replace(/(^|[{\s,])([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');

  // 5. 移除尾随逗号
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  // 6. 还原字符串
  const finalStr = cleaned.replace(/__STR_(\d+)__/g, (_, idx) => stringStore[parseInt(idx)] || '""');

  try {
    const fn = new Function(`return (${finalStr});`);
    return fn();
  } catch (e) {
    return null;
  }
}

/**
 * 从文本中截取最大可被 JSON.parse 的子串
 * 适用于：前后有杂质，或尾部被截断但仍有若干完整对象/数组。
 */
function tryParseLargestJsonChunk(text: string): { shops: any[]; packages: any[] } | null {
  const src = text.trim();

  // 增强查找策略：不仅查找第一个 {，还要查找可能的特征字段，以应对多重嵌套或混合文本
  // 优先查找 "shops" 关键字附近的 {
  let startCandidates = [src.indexOf('{'), src.indexOf('[')].filter(i => i !== -1).sort((a, b) => a - b);

  // 如果有 "shops" 关键字，尝试定位其所属的对象开始
  const shopsKeywordIndex = src.search(/["']?shops["']?\s*:/);
  if (shopsKeywordIndex !== -1) {
    // 向前寻找最近的 {
    const braceBeforeShops = src.lastIndexOf('{', shopsKeywordIndex);
    if (braceBeforeShops !== -1) {
      startCandidates.unshift(braceBeforeShops);
    }
  }

  // 去重
  startCandidates = [...new Set(startCandidates)];

  for (const start of startCandidates) {
    // 从文本尾部向前寻找可解析的末尾
    // 优化：先找 }，再找 ]
    const endCandidates = [];
    let lastBrace = src.lastIndexOf('}');
    while (lastBrace >= start) {
      endCandidates.push(lastBrace);
      lastBrace = src.lastIndexOf('}', lastBrace - 1);
      // 限制搜索深度，避免性能问题
      if (endCandidates.length > 20) break;
    }

    let lastBracket = src.lastIndexOf(']');
    while (lastBracket >= start) {
      endCandidates.push(lastBracket);
      lastBracket = src.lastIndexOf(']', lastBracket - 1);
      if (endCandidates.length > 40) break;
    }

    // 按位置倒序尝试
    endCandidates.sort((a, b) => b - a);

    for (const end of endCandidates) {
      const slice = src.slice(start, end + 1);

      // 1. 尝试标准 JSON 解析
      try {
        const parsed = JSON.parse(slice);
        const normalized = normalizeJsonData(parsed);
        if (normalized.shops.length > 0 || normalized.packages.length > 0) {
          return normalized;
        }
      } catch (_) {
        // 忽略
      }

      // 2. 尝试去除注释后解析 (针对用户提供的带注释 JSON)
      try {
        // 简单的去注释正则 (注意：可能会误伤 URL 中的 //，但在 JSON 结构中 URL 通常在引号内，
        // 为了安全起见，这里仅去除行尾注释，且尽量避开引号)
        // 更稳妥的方式是使用 tryParseLooseJsLiteral，它使用 new Function 原生支持注释

        // 但为了应对 JSON.parse 无法处理注释的问题，我们先尝试清理一下常见的行尾注释
        const cleaned = slice
          .replace(/\/\/[^\n\r]*/g, '') // 去除 // 注释
          .replace(/\/\*[\s\S]*?\*\//g, ''); // 去除 /* */ 注释

        const parsed = JSON.parse(cleaned);
        const normalized = normalizeJsonData(parsed);
        if (normalized.shops.length > 0 || normalized.packages.length > 0) {
          return normalized;
        }
      } catch (_) {
        // 忽略
      }

      // 3. 尝试宽松 JS 解析 (处理无引号键名、尾随逗号、复杂注释等)
      try {
        const looseParsed = tryParseLooseJsLiteral(slice);
        if (looseParsed) {
          const normalized = normalizeJsonData(looseParsed);
          if (normalized.shops.length > 0 || normalized.packages.length > 0) {
            return normalized;
          }
        }
      } catch (__) {
        // continue
      }
    }
  }

  return null;
}

/**
 * 极简兜底：不依赖 [店铺]/[套餐] 标签，直接从全文提取一个套餐
 */
function parseLoosePackage(text: string, shop: any, makePkgId: () => string): any | null {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  const pkg: any = {
    id: makePkgId(),
    shop_id: shop.id,
    shop_name: shop.name,
    name: '',
    price: 'N/A',
    stars: 0,
    tags: [],
    icon: null,
    image1: '',
    image2: '',
    image3: '',
    description: '',
    content: [],
    reviews: [],
  };

  let currentArrayField: string | null = null;
  let currentScalarField: string | null = null;

  lines.forEach(line => {
    const match = line.match(/^([^:：]+)[:：](.*)$/);
    let isKnownField = false;

    if (match) {
      const keyRaw = match[1].trim().toLowerCase();
      if (
        [
          'name',
          'price',
          'stars',
          'icon',
          'image1',
          'image2',
          'image3',
          'description',
          'tags',
          'content',
          'reviews',
        ].includes(keyRaw)
      ) {
        isKnownField = true;
      }
    }

    if (isKnownField && match) {
      const key = match[1].trim().toLowerCase();
      const value = match[2].trim();
      if (['name', 'price', 'stars', 'icon', 'image1', 'image2', 'image3', 'description'].includes(key)) {
        pkg[key] = key === 'stars' ? parseFloat(value) || 0 : value;
        currentArrayField = null;
        if (['description', 'image1', 'image2', 'image3'].includes(key)) {
          currentScalarField = key;
        } else {
          currentScalarField = null;
        }
      } else if (['tags', 'content', 'reviews'].includes(key)) {
        currentArrayField = key;
        currentScalarField = null;
        if (value) {
          const items = value.startsWith('-')
            ? [value.replace(/^-/, '').trim()]
            : value.split(/[,，/、|]/).map(s => s.trim());
          items
            .map(v => v.replace(/^["']|["']$/g, '').trim())
            .filter(Boolean)
            .forEach(v => pkg[key].push(v));
        }
      }
    } else if (['tags', 'content', 'reviews'].includes(line.toLowerCase())) {
      currentArrayField = line.toLowerCase();
      currentScalarField = null;
    } else if (currentArrayField) {
      const val = normalizeBullet(line);
      if (val) pkg[currentArrayField].push(val);
    } else if (currentScalarField) {
      pkg[currentScalarField] += '\n' + line;
    }
  });

  if (!pkg.name && (pkg.content.length || pkg.reviews.length || pkg.tags.length)) {
    pkg.name = `套餐`;
  }

  return pkg.name ? pkg : null;
}

/**
 * 兜底再兜底：只提取 content: 后面的子弹行，生成一个套餐
 */
function parseContentBulletsOnly(text: string, shop: any, makePkgId: () => string): any | null {
  const lines = text.split('\n').map(l => l.trim());
  let collectingContent = false;
  let collectingReviews = false;
  const content: string[] = [];
  const reviews: string[] = [];

  for (const line of lines) {
    if (/^content\b/i.test(line)) {
      collectingContent = true;
      collectingReviews = false;
      continue;
    }
    if (/^reviews?\b/i.test(line)) {
      collectingReviews = true;
      collectingContent = false;
      continue;
    }
    if (collectingContent || collectingReviews) {
      if (/^[A-Za-z_][A-Za-z0-9_]*[:：]/.test(line)) {
        collectingContent = false;
        collectingReviews = false;
        continue;
      }

      // 首先尝试匹配子弹行（以 - * ? · 等开头）
      const bulletMatch = line.match(/^[-*?·－]\s*(.*)$/);
      if (bulletMatch) {
        const val = bulletMatch[1].replace(/^["']|["']$/g, '').trim();
        if (val) {
          if (collectingContent) content.push(val);
          else if (collectingReviews) reviews.push(val);
        }
      } else if (line.trim()) {
        // 如果不是子弹行但非空行，也作为内容处理（支持不带前缀的多行内容）
        const val = line.replace(/^["']|["']$/g, '').trim();
        if (val) {
          if (collectingContent) content.push(val);
          else if (collectingReviews) reviews.push(val);
        }
      }
    }
  }

  if (content.length === 0 && reviews.length === 0) return null;

  return {
    id: makePkgId(),
    shop_id: shop.id,
    shop_name: shop.name,
    name: `套餐`,
    price: 'N/A',
    stars: 0,
    tags: [],
    icon: null,
    image1: '',
    image2: '',
    image3: '',
    description: '',
    content,
    reviews,
  };
}

/**
 * 简易正则解析器，用于从 YAML 片段中提取店铺信息
 * 仅支持扁平的 shop_id, name 和简单的 packages 列表结构
 */
function parseYamlShopByRegex(text: string): any | null {
  try {
    const shop: any = { packages: [] };

    // 提取 shop_id (允许缩进)
    const idMatch = text.match(/^\s*shop_id:\s*(.+)$/m);
    if (idMatch) shop.shop_id = idMatch[1].trim();

    // 提取 name (店铺名) (允许缩进)
    // 注意：packages 下面也有 name，所以要小心匹配。
    // 假设店铺 name 在 packages 之前
    const nameMatch = text.match(/^\s*name:\s*(.+)$/m);
    if (nameMatch) shop.name = nameMatch[1].trim().replace(/^["']|["']$/g, '');

    // 如果没有 ID 或 Name，可能不是有效的店铺片段
    if (!shop.shop_id && !shop.name) return null;

    // 提取 packages 部分
    // 这是一个简化的处理，假设 packages: 后面的所有 - name: 都是套餐
    const packagesIndex = text.indexOf('packages:');
    if (packagesIndex !== -1) {
      const packagesText = text.slice(packagesIndex);
      // 按 - name: 分割套餐
      const pkgSections = packagesText.split(/^\s*-\s*name:/m).slice(1);

      pkgSections.forEach(pkgSection => {
        const pkg: any = { name: '', content: [], reviews: [], tags: [] };

        // 提取套餐名 (split 消耗掉了 name: 前缀，所以 pkgSection 开头就是名字)
        const firstLineEnd = pkgSection.indexOf('\n');
        const rawName = firstLineEnd === -1 ? pkgSection : pkgSection.slice(0, firstLineEnd);
        pkg.name = rawName.trim().replace(/^["']|["']$/g, '');

        // 提取其他字段
        const extractField = (key: string) => {
          const match = pkgSection.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, 'm'));
          return match ? match[1].trim().replace(/^["']|["']$/g, '') : null;
        };

        pkg.price = extractField('price');
        pkg.stars = parseFloat(extractField('stars') || '0');
        pkg.icon = extractField('icon');
        pkg.description = extractField('description');
        pkg.image1 = extractField('image1');
        pkg.image2 = extractField('image2');
        pkg.image3 = extractField('image3');

        // 简单的列表提取 (tags, content, reviews)
        // 这里只做最简单的行匹配，不支持复杂的嵌套
        const extractList = (key: string) => {
          const start = pkgSection.indexOf(`${key}:`);
          if (start === -1) return [];
          const list: string[] = [];
          const lines = pkgSection.slice(start).split('\n').slice(1);
          for (const line of lines) {
            // 如果遇到新的 key (不以 - 开头)，则停止
            if (line.trim() && !line.trim().startsWith('-')) break;
            if (line.trim().startsWith('-')) {
              list.push(
                line
                  .trim()
                  .replace(/^-\s*/, '')
                  .replace(/^["']|["']$/g, ''),
              );
            }
          }
          return list;
        };

        pkg.tags = extractList('tags');
        pkg.content = extractList('content');
        pkg.reviews = extractList('reviews');

        shop.packages.push(pkg);
      });
    }

    return shop;
  } catch (e) {
    return null;
  }
}

/**
 * 规范化 JSON 数据
 */
function normalizeJsonData(data: any): { shops: any[]; packages: any[] } {
  const makePkgId = createIdFactory('pkg');
  const shops: ShopType[] = [];
  const packages: PackageType[] = [];

  // 统一转为数组
  let rawShops: any[] = [];
  if (Array.isArray(data)) {
    rawShops = data;
  } else if (data && typeof data === 'object') {
    // 若含 shops 字段，优先视为 shops 数组
    if (Array.isArray(data.shops)) {
      rawShops = data.shops;
    } else if (data.shops && typeof data.shops === 'object') {
      rawShops = [data.shops];
    } else {
      // 可能是单个店铺对象
      rawShops = [data];
    }
  }

  const pushShop = (rawShop: any) => {
    if (!rawShop || typeof rawShop !== 'object') {
      console.warn('[normalize] skip non-object shop entry', rawShop);
      return;
    }
    if (!Array.isArray(rawShop.packages)) {
      console.warn('[normalize] shop packages not array', rawShop);
    }

    const parsed = (() => {
      try {
        return ShopSchema.parse({
          ...rawShop,
          id: String(generateShopId(rawShop)),
          shop_id: rawShop.shop_id ? String(rawShop.shop_id) : undefined, // 兼容数字类型ID
          name: rawShop.name || '未命名店铺',
          packages: [], // 暂不验证套餐，防止单一套餐错误导致整个店铺丢弃
        });
      } catch (e) {
        logParse('schema', false, e);
        return null;
      }
    })();
    if (!parsed) return;

    const shopId = String(parsed.id || generateShopId(parsed));

    const rawPackages = Array.isArray(rawShop.packages) ? rawShop.packages : [];

    const normalizedPkgs = rawPackages
      .map((rawPkg: any) => {
        if (!rawPkg || typeof rawPkg !== 'object') return null;
        const pkg = {
          ...rawPkg,
          id: String(generatePkgId(rawPkg, shopId, makePkgId)),
          shop_id: String(shopId),
          shop_name: parsed.name,
        };
        try {
          return PackageSchema.parse(pkg);
        } catch (e) {
          logParse('schema_pkg', false, e);
          return null;
        }
      })
      .filter(Boolean) as PackageType[];

    const shop = { ...parsed, id: shopId, packages: normalizedPkgs };
    shops.push(shop);
    packages.push(...normalizedPkgs);
    console.log('[normalize] accepted shop', shop.name, 'packages=', normalizedPkgs.length);
  };

  console.log('[normalize] rawShops snapshot:', rawShops);
  rawShops.forEach(rawShop => {
    if (rawShop && typeof rawShop === 'object' && Array.isArray(rawShop.shops)) {
      rawShop.shops.forEach((nested: any) => pushShop(nested));
    } else {
      pushShop(rawShop);
    }
  });

  // 去重：优先显式 id，其次 name+address+city hash
  const shopMap = new Map<string, ShopType>();
  shops.forEach(s => {
    const key = String(s.id || generateShopId(s));
    if (!shopMap.has(key)) shopMap.set(key, s);
  });

  const pkgMap = new Map<string, PackageType>();
  packages.forEach(p => {
    const key = String(p.id || generatePkgId(p, p.shop_id || 'unknown', makePkgId));
    if (!pkgMap.has(key)) pkgMap.set(key, p);
  });

  const result = { shops: Array.from(shopMap.values()), packages: Array.from(pkgMap.values()) };
  logParse('normalize', true, { rawShops: rawShops.length, shops: result.shops.length, pkgs: result.packages.length });
  return result;
}
