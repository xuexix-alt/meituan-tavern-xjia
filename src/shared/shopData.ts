/**
 * 数据解析工具模块（共享）
 * - 从酒馆消息中提取店铺 / 套餐数据
 * - 可被前端 APP 与脚本共享调用
 */

// 简单缓存，避免同一会话内重复解析
let lastParsedData: { shops: any[]; packages: any[] } | null = null;
let lastParsedMessageId: string | null = null;

// 基于时间戳的唯一 ID 生成器，防止店名哈希导致的碰撞/错乱
function createIdFactory(prefix: string) {
  const base = Date.now().toString().slice(-8); // 取时间戳末 8 位，够用且易区分
  let counter = 0;
  return () => `${prefix}_${base}_${counter++}`;
}

function getShopStoreApi() {
  const api = (window as any).ShopStore;
  return api && typeof api.getShops === 'function' ? api : null;
}

function rememberData(data: { shops: any[]; packages: any[] }, messageId: string) {
  lastParsedData = data;
  lastParsedMessageId = messageId;
}

function flattenPackagesFromShops(shops: any[]) {
  return shops
    .flatMap(shop => shop?.packages || [])
    .map((pkg: any, idx: number) => ({
      ...pkg,
      id: pkg.id || `pkg_${idx}`,
      shop_id:
        pkg.shop_id || (pkg.shopId ?? (pkg.shop || {}).id) || shops.find(s => (s.packages || []).includes(pkg))?.id,
    }));
}

function sanitizeShops(shops: any[]) {
  const map = new Map<string, any>();
  (shops || []).forEach(s => {
    if (!s) return;
    const hasPackages = Array.isArray(s.packages) && s.packages.length > 0;
    const name = typeof s.name === 'string' ? s.name.trim() : '';
    const hasMeaningfulName = name && !['未命名店铺', '默认店铺'].includes(name);
    if (!hasPackages && !hasMeaningfulName) return; // 过滤无名且无套餐的垃圾店铺

    const id = s.id ? String(s.id) : hasMeaningfulName ? `shop_${name}` : '';
    if (!id) return;
    if (!map.has(id)) {
      map.set(id, { ...s, id, name: hasMeaningfulName ? name : s.name });
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

    // 尝试从当前楼层获取数据
    const currentIdRaw = getCurrentMessageId();
    // 当还没有任何消息时，getCurrentMessageId 可能返回负数，直接跳过以避免无效 range 错误
    if (typeof currentIdRaw === 'number' && currentIdRaw < 0) {
      // 仍然尝试使用持久化数据兜底
      if (storeApi) {
        const storedShops = sanitizeShops(storeApi.getShops() || []);
        if (storedShops.length > 0) {
          const pkgs = flattenPackagesFromShops(storedShops);
          return { shops: storedShops, packages: pkgs };
        }
      }
      return { shops: [], packages: [] };
    }

    const currentMessageId = String(currentIdRaw);
    const currentData = extractDataFromSpecificMessage(currentMessageId);
    if (currentData) {
      const currentShops = sanitizeShops(currentData.shops || []);
      // 先把当前解析到的店铺追加进全局存储（不与历史合并）
      if (storeApi && currentShops.length > 0) {
        storeApi.saveShops(currentShops);
      }

      const storedShops = sanitizeShops(storeApi?.getShops?.() || []);
      const shopsToUse = storedShops.length > 0 ? storedShops : currentShops;
      const pkgsToUse =
        currentData.packages && currentData.packages.length > 0
          ? currentData.packages
          : flattenPackagesFromShops(shopsToUse);

      const result = { shops: shopsToUse, packages: pkgsToUse };
      rememberData(result, currentMessageId);
      return result;
    }

    // 兜底：仅使用持久化
    if (storeApi) {
      const storedShops = sanitizeShops(storeApi.getShops() || []);
      if (storedShops.length > 0) {
        const pkgs = flattenPackagesFromShops(storedShops);
        return { shops: storedShops, packages: pkgs };
      }
    }

    return { shops: [], packages: [] };
  } catch (e) {
    return { shops: [], packages: [] };
  }
}

/**
 * 从指定楼层提取数据
 * @param messageId 消息楼层ID
 * @returns 包含店铺和套餐数据的对象，如果失败返回null
 */
export function extractDataFromSpecificMessage(messageId: string): { shops: any[]; packages: any[] } | null {
  try {
    const messages = getChatMessages(messageId);
    if (!messages || messages.length === 0) {
      return null;
    }

    const messageContent = messages[0].message;
    // 支持不区分大小写的标签匹配，并处理可能的空白/换行或异常字符（如中间多了换行再闭合]）
    const match = messageContent.match(/\[手机界面开始[^\]]*\]([\s\S]*?)\[手机界面结束[^\]]*\]/i);

    let dataText: string | null = null;

    if (!match || !match[1]) {
      // 1) 容错：仅有开始标签
      const startMatch = messageContent.match(/\[手机界面开始[^\]]*\]([\s\S]*)/i);
      if (startMatch && startMatch[1]) {
        dataText = startMatch[1].trim();
      } else {
        // 2) 再容错：用户直接贴了 JSON / JS 模板，但忘记包裹标签，仍尝试全量解析
        dataText = messageContent.trim();
      }
    } else {
      dataText = match[1].trim();
    }

    if (!dataText) return null;

    const parsed = parseShopData(dataText);
    // 若解析结果为空，最后再用整段消息内容兜底一次（防止截取不完整导致空）
    if (parsed.shops.length === 0 && parsed.packages.length === 0 && dataText !== messageContent) {
      const fallbackParsed = parseShopData(messageContent.trim());
      if (fallbackParsed.shops.length > 0 || fallbackParsed.packages.length > 0) {
        rememberData(fallbackParsed, messageId);
        return fallbackParsed;
      }
    }

    if (parsed.shops.length > 0 || parsed.packages.length > 0) {
      rememberData(parsed, messageId);
    }
    return parsed;
  } catch (e) {
    return null;
  }
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
  let pkgNameCounter = 1;

  // 0. 优先尝试 JS 模板格式（json_template.js 的写法）
  const jsParsed = tryParseJsTemplate(text);
  if (jsParsed) return jsParsed;

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
      return normalizeJsonData(parsed);
    }
  } catch (e) {
    // 1.1 容错：截断/掺杂文本时，提取最大可解析 JSON 子串
    const tolerant = tryParseLargestJsonChunk(text);
    if (tolerant) return tolerant;
  }

  // 2. 原有的文本解析逻辑（并允许直接是套餐块，此时构造一个虚拟店铺承载）
  const shops: any[] = [];
  const packages: any[] = [];

  const splitArrayValues = (val: string): string[] =>
    val
      .split(/[,，/、|]/)
      .map(s => s.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);

  // 以 [店铺] 作为起点，[/店铺] 或下一个 [店铺] / 文本末尾 作为终点
  const rawShopSections = text.includes('[店铺]') ? text.split('[店铺]').slice(1) : ['[店铺]\n[套餐]\n' + text]; // 无店铺标签时，把整段当作一个店铺片段处理，并假定内容为套餐块

  rawShopSections.forEach((rawSection, shopIndex) => {
    // 截到 [/店铺]，否则取整个片段（兼容截断）
    const section = rawSection.split('[/店铺]')[0] ?? rawSection;

    // 拆出头部和套餐部分，头部是 [套餐] 之前的内容（允许没有套餐）
    const [shopHeader = '', ...packageSectionsRaw] = section.split('[套餐]');

    const shopLines = shopHeader
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    const shop: any = {
      id: '', // 稍后生成
      name: '未命名店铺',
      shoptags: [],
      slogan: '优质服务',
      theme: '默认',
      packages: [],
    };

    // 解析店铺信息
    const nameLine = shopLines.find(line => /^name[:：]/i.test(line));
    if (nameLine) {
      shop.name = nameLine.replace(/^name[:：]/i, '').trim();
    } else if (!section.includes('[店铺]')) {
      // 当没有店铺标签且未提供店名时，给一个虚拟名称避免丢弃套餐
      shop.name = '默认店铺';
    }

    const shoptagsIndex = shopLines.findIndex(line => /^shoptags[:：]/i.test(line));
    if (shoptagsIndex !== -1) {
      // 允许同一行内有逗号/顿号分隔
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
          // 无前缀的行也作为标签
          const val = shopLines[i].trim();
          if (val) shop.shoptags.push(...splitArrayValues(val));
        }
      }
    }

    // Fallback for tags if they are just lines under shoptags:
    if (shoptagsIndex !== -1 && shop.shoptags.length === 0) {
      for (let i = shoptagsIndex + 1; i < shopLines.length; i++) {
        if (shopLines[i].includes(':')) break;
        const val = shopLines[i].replace(/^["']|["']$/g, '').trim();
        if (val) shop.shoptags.push(val);
      }
    }

    // 生成唯一 ID
    shop.id = makeShopId();

    if (shop.shoptags.length > 0) {
      shop.slogan = shop.shoptags.join(' / ');
      shop.theme = shop.shoptags[0] || '默认';
    }

    // 解析套餐（容错缺少 [/套餐]）
    packageSectionsRaw.forEach(pkgSectionRaw => {
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

      pkgLines.forEach(line => {
        // 支持全角冒号
        const match = line.match(/^([^:：]+)[:：](.*)$/);
        if (match) {
          const fieldNameRaw = match[1].trim();
          const fieldName = fieldNameRaw.toLowerCase();
          const value = match[2].trim();

          if (['name', 'price', 'stars', 'icon', 'image1', 'image2', 'image3', 'description'].includes(fieldName)) {
            const key = fieldName as keyof typeof pkg;
            pkg[key] = fieldName === 'stars' ? parseFloat(value) || 0 : value;
            currentArrayField = null;
          } else if (['tags', 'content', 'reviews'].includes(fieldName)) {
            currentArrayField = fieldName;
            if (value) {
              const items = value.startsWith('-') ? [value.replace(/^-/, '').trim()] : splitArrayValues(value);
              items.forEach(v => {
                const cleaned = v.replace(/^["']|["']$/g, '').trim();
                if (cleaned) pkg[fieldName].push(cleaned);
              });
            }
          }
        } else if (['tags', 'content', 'reviews'].includes(line.toLowerCase())) {
          // 支持无冒号写法：单独一行 "content" / "tags" / "reviews"
          currentArrayField = line.toLowerCase();
        } else if (currentArrayField) {
          // Handle array items that might not start with -，并兼容其他子弹符号
          const val = line
            .replace(/^[-*?·－]\s*/, '')
            .trim()
            .replace(/^["']|["']$/g, '');
          if (val) pkg[currentArrayField].push(val);
        }
      });

      // 如果缺少 name 但已包含内容，给出默认名称，避免丢弃
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
    } else {
      const bulletPkg = parseContentBulletsOnly(text, fallbackShop, makePkgId);
      if (bulletPkg) {
        fallbackShop.packages.push(bulletPkg);
        packages.push(bulletPkg);
      }
    }
  }

  return { shops, packages };
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
  if (end === -1) return null;
  return source.slice(firstBrace, end + 1);
}

/**
 * 简单的括号配对查找，返回与 startIndex 的 '{' 对应的 '}' 位置
 */
function findMatchingBrace(str: string, startIndex: number): number {
  let depth = 0;
  for (let i = startIndex; i < str.length; i++) {
    const ch = str[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
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
  const unsafeKeyword = /(function\b|=>|\bclass\b|\bwhile\b|\bfor\b|\bimport\b|\bexport\b|\beval\b|\brequire\b)/;
  if (unsafeKeyword.test(str)) return null;

  // 给未加引号的键补引号（仅匹配以字母/下划线开头的键）
  const withQuotedKeys = str.replace(/(^|[{\s,])([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');

  // 再次移除尾随逗号
  const cleaned = withQuotedKeys.replace(/,\s*([}\]])/g, '$1');

  try {
    // 使用 Function 包裹以防止顶层 "use strict" 影响
    const fn = new Function(`return (${cleaned});`);
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
  const firstBrace = src.indexOf('{');
  const firstBracket = src.indexOf('[');
  const start =
    firstBrace === -1 ? firstBracket : firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket);
  if (start === -1) return null;

  // 从文本尾部向前寻找可解析的末尾
  for (let end = src.lastIndexOf('}'); end >= start; end = src.lastIndexOf('}', end - 1)) {
    const slice = src.slice(start, end + 1);
    try {
      const parsed = JSON.parse(slice);
      return normalizeJsonData(parsed);
    } catch (_) {
      // continue
    }
  }

  // 如果数组闭合符可能是 ']'
  for (let end = src.lastIndexOf(']'); end >= start; end = src.lastIndexOf(']', end - 1)) {
    const slice = src.slice(start, end + 1);
    try {
      const parsed = JSON.parse(slice);
      return normalizeJsonData(parsed);
    } catch (_) {
      // continue
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

  lines.forEach(line => {
    const match = line.match(/^([^:：]+)[:：](.*)$/);
    if (match) {
      const key = match[1].trim().toLowerCase();
      const value = match[2].trim();
      if (['name', 'price', 'stars', 'icon', 'image1', 'image2', 'image3', 'description'].includes(key)) {
        pkg[key] = key === 'stars' ? parseFloat(value) || 0 : value;
        currentArrayField = null;
      } else if (['tags', 'content', 'reviews'].includes(key)) {
        currentArrayField = key;
        if (value) {
          const items = value.startsWith('-')
            ? [value.replace(/^-/, '').trim()]
            : value.split(/[,，/、|]/).map(s => s.trim());
          items.filter(Boolean).forEach(v => pkg[key].push(v.replace(/^["']|["']$/g, '')));
        }
      }
    } else if (['tags', 'content', 'reviews'].includes(line.toLowerCase())) {
      currentArrayField = line.toLowerCase();
    } else if (currentArrayField) {
      const val = line
        .replace(/^[-*?·－]\s*/, '')
        .trim()
        .replace(/^["']|["']$/g, '');
      if (val) pkg[currentArrayField].push(val);
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
      const bulletMatch = line.match(/^[-*?·－]\s*(.*)$/);
      if (bulletMatch) {
        const val = bulletMatch[1].replace(/^["']|["']$/g, '').trim();
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
 * 规范化 JSON 数据
 */
function normalizeJsonData(data: any): { shops: any[]; packages: any[] } {
  const shops: any[] = [];
  const packages: any[] = [];
  // 统一转为数组
  let rawShops: any[] = [];
  if (Array.isArray(data)) {
    rawShops = data;
  } else if (data && typeof data === 'object') {
    if (Array.isArray(data.shops)) {
      rawShops = data.shops;
    } else {
      // 可能是单个店铺对象
      rawShops = [data];
    }
  }

  rawShops.forEach((rawShop, index) => {
    if (!rawShop || typeof rawShop !== 'object') return;

    const shopName = rawShop.name || '未命名店铺';
    const shop: any = {
      id: rawShop.id ? String(rawShop.id) : makeShopId(),
      name: shopName,
      shoptags: Array.isArray(rawShop.shoptags) ? rawShop.shoptags : [],
      slogan: rawShop.slogan || '优质服务',
      theme: rawShop.theme || '默认',
      packages: [],
    };

    // 如果没有 slogan 但有 tags，尝试用 tags 生成
    if (!rawShop.slogan && shop.shoptags.length > 0) {
      shop.slogan = shop.shoptags.join(' / ');
      shop.theme = shop.shoptags[0] || '默认';
    }

    const rawPackages = Array.isArray(rawShop.packages) ? rawShop.packages : [];

    rawPackages.forEach((rawPkg: any) => {
      if (!rawPkg || typeof rawPkg !== 'object') return;

      const pkg: any = {
        id: rawPkg.id ? String(rawPkg.id) : makePkgId(),
        shop_id: shop.id,
        shop_name: shop.name,
        name: rawPkg.name || '',
        price: rawPkg.price || 'N/A',
        stars: typeof rawPkg.stars === 'number' ? rawPkg.stars : 0,
        tags: Array.isArray(rawPkg.tags) ? rawPkg.tags : [],
        icon: rawPkg.icon || null,
        image1: rawPkg.image1 || '',
        image2: rawPkg.image2 || '',
        image3: rawPkg.image3 || '',
        description: rawPkg.description || '',
        content: Array.isArray(rawPkg.content) ? rawPkg.content : [],
        reviews: Array.isArray(rawPkg.reviews) ? rawPkg.reviews : [],
      };

      if (pkg.name) {
        shop.packages.push(pkg);
        packages.push(pkg);
      }
    });

    shops.push(shop);
  });

  return { shops, packages };
}
