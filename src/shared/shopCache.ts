export const SHOP_CACHE_LIMIT = 200;

export type StoredShop = Record<string, unknown> & {
  id: string;
  shop_id: string;
  name: string;
  packages: unknown[];
};

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim();
  return text ? text : null;
}

export function normalizeShopId(shop: Record<string, unknown>): string | null {
  return asNonEmptyString(shop.shop_id) ?? asNonEmptyString(shop.id);
}

export function normalizeStoredShop(value: unknown): StoredShop | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const shop = value as Record<string, unknown>;
  const id = normalizeShopId(shop);
  const name = asNonEmptyString(shop.name);
  if (!id || !name) return null;

  return {
    ...shop,
    id,
    shop_id: id,
    name,
    packages: Array.isArray(shop.packages) ? shop.packages : [],
  };
}

export function normalizeShopList(value: unknown): StoredShop[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeStoredShop).filter((shop): shop is StoredShop => shop !== null);
}

export function mergeShopsById(existing: unknown, incoming: unknown): StoredShop[] {
  const merged = new Map<string, StoredShop>();
  for (const shop of normalizeShopList(existing)) merged.set(shop.shop_id, shop);
  for (const shop of normalizeShopList(incoming)) merged.set(shop.shop_id, shop);
  return Array.from(merged.values()).slice(-SHOP_CACHE_LIMIT);
}

export function removeShopById(existing: unknown, shopId: string | number): StoredShop[] {
  const target = String(shopId).trim();
  return normalizeShopList(existing).filter((shop) => shop.shop_id !== target);
}

export function updateShopCacheVariables(
  variables: Record<string, unknown>,
  incoming: unknown,
  key = 'shop_store_cache',
): Record<string, unknown> {
  return { ...variables, [key]: mergeShopsById(variables[key], incoming) };
}
