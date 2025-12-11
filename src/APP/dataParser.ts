/**
 * 精简版店铺/套餐解析：
 * - 仅解析当前楼层的 JSON / YAML / [店铺]…[/店铺] 标签
 * - 店铺列表缓存到 ShopStore 以便跨楼层复用
 */

import YAML from 'yaml';

// 简单缓存，避免同一楼层重复解析
let lastParsedData: { shops: any[]; packages: any[] } | null = null;
let lastParsedMessageId: string | null = null;

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
      shop_id: pkg.shop_id || pkg.shopId || pkg.shop?.id,
    }));
}

function mergeKeepOrder(current: any[], stored: any[]) {
  const merged: any[] = [];
  const seen = new Set<string>();
  const push = (list: any[]) =>
    list.forEach(s => {
      const key = String(s.id || s.name || '');
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push(s);
    });
  push(current);
  push(stored);
  return merged;
}

export function extractDataFromMessage(): { shops: any[]; packages: any[] } {
  const storeApi = getShopStoreApi();
  const rawId = getCurrentMessageId();
  if (typeof rawId === 'number' && rawId < 0) {
    const stored = storeApi?.getShops?.() || [];
    return stored.length ? { shops: stored, packages: flattenPackagesFromShops(stored) } : { shops: [], packages: [] };
  }

  const messageId = String(rawId);
  if (lastParsedMessageId === messageId && lastParsedData) return lastParsedData;

  const parsed = extractDataFromSpecificMessage(messageId);
  if (parsed) {
    const mergedShops = mergeKeepOrder(parsed.shops, storeApi?.getShops?.() || []);
    const mergedPkgs = parsed.packages.length ? parsed.packages : flattenPackagesFromShops(mergedShops);
    storeApi?.saveShops?.(mergedShops);
    const result = { shops: mergedShops, packages: mergedPkgs };
    rememberData(result, messageId);
    return result;
  }

  const stored = storeApi?.getShops?.() || [];
  if (stored.length) return { shops: stored, packages: flattenPackagesFromShops(stored) };
  return { shops: [], packages: [] };
}

export function extractDataFromSpecificMessage(messageId: string): { shops: any[]; packages: any[] } | null {
  try {
    const messages = getChatMessages(messageId);
    if (!messages || messages.length === 0) return null;
    const content = messages[0].message.trim();
    const parsed = parseShopData(content);
    return parsed.shops.length || parsed.packages.length ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * 解析顺序：JSON -> YAML -> [店铺] 标签
 */
export function parseShopData(text: string): { shops: any[]; packages: any[] } {
  // JSON
  try {
    let json = text.trim();
    if (!json.startsWith('{') && !json.startsWith('[')) {
      const idx = json.indexOf('{');
      if (idx !== -1) json = json.slice(idx);
    }
    if (json.startsWith('{') || json.startsWith('[')) {
      return normalizeJsonData(JSON.parse(json));
    }
  } catch {
    /* ignore */
  }

  // YAML
  try {
    const data = YAML.parse(text);
    if (data) return normalizeJsonData(data);
  } catch {
    /* ignore */
  }

  // [店铺] 标签
  return parseShopBlocks(text);
}

function normalizeJsonData(data: any): { shops: any[]; packages: any[] } {
  const shops: any[] = [];
  const packages: any[] = [];
  let pkgId = 0;

  const rawShops = Array.isArray(data) ? data : Array.isArray(data?.shops) ? data.shops : data ? [data] : [];

  rawShops.forEach((raw, idx) => {
    if (!raw || typeof raw !== 'object') return;
    const shop = {
      id: raw.id || `shop_${idx}`,
      name: raw.name || '未命名店铺',
      shoptags: Array.isArray(raw.shoptags) ? raw.shoptags : [],
      slogan: raw.slogan || (Array.isArray(raw.shoptags) ? raw.shoptags.join(' / ') : '优质服务'),
      theme: raw.theme || (Array.isArray(raw.shoptags) && raw.shoptags[0]) || '默认',
      packages: [] as any[],
    };

    const rawPkgs = Array.isArray(raw.packages) ? raw.packages : [];
    rawPkgs.forEach((rp: any) => {
      if (!rp || typeof rp !== 'object') return;
      const pkg = {
        id: rp.id || `pkg_${pkgId++}`,
        shop_id: shop.id,
        shop_name: shop.name,
        name: rp.name || '',
        price: rp.price || 'N/A',
        tags: Array.isArray(rp.tags) ? rp.tags : [],
        content: Array.isArray(rp.content) ? rp.content : [],
        reviews: Array.isArray(rp.reviews) ? rp.reviews : [],
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

function parseShopBlocks(text: string): { shops: any[]; packages: any[] } {
  const shops: any[] = [];
  const packages: any[] = [];
  let pkgId = 0;

  const blocks = text.split('[店铺]').slice(1);
  blocks.forEach((block, idx) => {
    const shopBlock = block.split('[/店铺]')[0] ?? block;
    const [shopHead = '', ...pkgBlocks] = shopBlock.split('[套餐]');

    const shop = {
      id: `shop_${idx}`,
      name: '未命名店铺',
      shoptags: [] as string[],
      slogan: '优质服务',
      theme: '默认',
      packages: [] as any[],
    };

    shopHead
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .forEach(line => {
        const pair = line.match(/^([^:：]+)[:：](.*)$/);
        if (!pair) return;
        const key = pair[1].trim().toLowerCase();
        const val = pair[2].trim();
        if (key === 'name') shop.name = val;
        if (key === 'shoptags') {
          shop.shoptags.push(
            ...val
              .split(/[,，/、|]/)
              .map(s => s.trim())
              .filter(Boolean),
          );
        }
      });
    if (shop.shoptags.length) {
      shop.slogan = shop.shoptags.join(' / ');
      shop.theme = shop.shoptags[0];
    }

    pkgBlocks.forEach(rawPkg => {
      const pkgText = (rawPkg.split('[/套餐]')[0] ?? rawPkg).trim();
      if (!pkgText) return;
      const pkg = {
        id: `pkg_${pkgId++}`,
        shop_id: shop.id,
        shop_name: shop.name,
        name: '',
        price: 'N/A',
        tags: [] as string[],
        content: [] as string[],
        reviews: [] as string[],
      };
      let current: 'tags' | 'content' | 'reviews' | null = null;
      pkgText
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .forEach(line => {
          const pair = line.match(/^([^:：]+)[:：](.*)$/);
          if (pair) {
            const key = pair[1].trim().toLowerCase();
            const val = pair[2].trim();
            if (['name', 'price', 'description'].includes(key)) {
              (pkg as any)[key] = val;
              current = null;
            } else if (['tags', 'content', 'reviews'].includes(key)) {
              current = key as any;
              if (val) (pkg as any)[current].push(...splitList(val));
            }
          } else if (current) {
            const v = line.replace(/^[-*•·－]\s*/, '').trim();
            if (v) (pkg as any)[current].push(v);
          }
        });
      if (!pkg.name) pkg.name = `套餐${pkgId}`;
      shop.packages.push(pkg);
      packages.push(pkg);
    });

    shops.push(shop);
  });

  return { shops, packages };
}

function splitList(val: string) {
  return val
    .split(/[,，/、|]/)
    .map(s => s.trim())
    .filter(Boolean);
}
