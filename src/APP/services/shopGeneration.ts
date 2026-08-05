import { parseShopData } from '../../shared/shopData';
import { mergeShopsById, normalizeShopList, updateShopCacheVariables, type StoredShop } from '../../shared/shopCache';

const SHOP_STORE_KEY = 'shop_store_cache';

interface ShopStoreApi {
  getShops?: () => unknown;
  saveShops?: (shops: unknown[]) => unknown;
}

export interface ShopIngestionResult {
  parsedCount: number;
  savedCount: number;
  packageCount: number;
  shops: StoredShop[];
}

function resolveShopStore(): ShopStoreApi | null {
  const api = (window as typeof window & { ShopStore?: ShopStoreApi }).ShopStore;
  return api && typeof api.saveShops === 'function' ? api : null;
}

function emitCacheUpdated(count: number): void {
  window.dispatchEvent(
    new CustomEvent('shop:cache:updated', {
      detail: { scope: { type: 'global' }, count, op: 'write' },
    }),
  );
}

export function parseShopResponse(text: string): StoredShop[] {
  if (!text.trim()) return [];
  return normalizeShopList(parseShopData(text).shops);
}

export function persistGeneratedShops(incoming: StoredShop[]): StoredShop[] {
  if (incoming.length === 0) return [];

  const store = resolveShopStore();
  if (store?.saveShops) {
    const saved = store.saveShops(incoming);
    if (Array.isArray(saved)) return normalizeShopList(saved);
    return mergeShopsById(store.getShops?.() ?? [], incoming);
  }

  let merged: StoredShop[] = [];
  updateVariablesWith(
    variables => {
      const updated = updateShopCacheVariables(variables, incoming, SHOP_STORE_KEY);
      merged = normalizeShopList(updated[SHOP_STORE_KEY]);
      return updated;
    },
    { type: 'global' },
  );
  emitCacheUpdated(merged.length);
  return merged;
}

export function ingestShopResponse(text: string): ShopIngestionResult {
  const shops = parseShopResponse(text);
  if (shops.length === 0) return { parsedCount: 0, savedCount: 0, packageCount: 0, shops: [] };

  const saved = persistGeneratedShops(shops);
  return {
    parsedCount: shops.length,
    savedCount: saved.length,
    packageCount: shops.reduce((total, shop) => total + shop.packages.length, 0),
    shops,
  };
}
