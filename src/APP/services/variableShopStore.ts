import { mergeShopsById, normalizeShopList, removeShopById, type StoredShop } from '../../shared/shopCache';

const SHOP_STORE_KEY = 'shop_store_cache';

type Variables = Record<string, unknown>;
type ReadVariables = () => Variables;
type UpdateVariables = (updater: (variables: Variables) => Variables) => void;

export interface ShopStoreApi {
  getShops: () => StoredShop[];
  saveShops: (shops: unknown[]) => StoredShop[];
  deleteShop: (shopId: string) => StoredShop[];
}

export function createVariableShopStore(
  readVariables: ReadVariables = () => (getVariables({ type: 'global' }) || {}) as Variables,
  updateVariables: UpdateVariables = updater => updateVariablesWith(updater, { type: 'global' }),
): ShopStoreApi {
  const getShops = () => normalizeShopList(readVariables()[SHOP_STORE_KEY]);

  return {
    getShops,
    saveShops(shops) {
      let merged: StoredShop[] = [];
      updateVariables(variables => {
        merged = mergeShopsById(variables[SHOP_STORE_KEY], shops);
        return { ...variables, [SHOP_STORE_KEY]: merged };
      });
      return merged;
    },
    deleteShop(shopId) {
      let filtered: StoredShop[] = [];
      updateVariables(variables => {
        filtered = removeShopById(variables[SHOP_STORE_KEY], shopId);
        return { ...variables, [SHOP_STORE_KEY]: filtered };
      });
      return filtered;
    },
  };
}
