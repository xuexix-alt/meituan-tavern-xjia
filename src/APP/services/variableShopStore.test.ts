import { createVariableShopStore } from './variableShopStore';

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} 不一致。\n实际: ${JSON.stringify(actual)}\n期望: ${JSON.stringify(expected)}`);
  }
}

let variables: Record<string, unknown> = {
  unrelated: { keep: true },
  shop_store_cache: [{ shop_id: 'stored-1', name: '全局店铺', packages: [] }],
};

const store = createVariableShopStore(
  () => variables,
  updater => {
    variables = updater(variables);
  },
);

assertEqual(store.getShops().map(shop => shop.shop_id), ['stored-1'], '无脚本时读取全局缓存');

store.saveShops([{ shop_id: 'stored-2', name: '新增店铺', packages: [] }]);
assertEqual(store.getShops().map(shop => shop.shop_id), ['stored-1', 'stored-2'], '无脚本时追加店铺');

store.deleteShop('stored-1');
assertEqual(store.getShops().map(shop => shop.shop_id), ['stored-2'], '无脚本时手动删除');
assertEqual(variables.unrelated, { keep: true }, '保留其他全局变量');

console.log('variable shop store fallback contract passed');
