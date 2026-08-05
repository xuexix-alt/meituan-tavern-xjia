import { mergeShopsById, removeShopById, updateShopCacheVariables } from './shopCache';

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} 不一致。\n实际: ${JSON.stringify(actual)}\n期望: ${JSON.stringify(expected)}`);
  }
}

const merged = mergeShopsById(
  [
    { id: '10', shop_id: 10, name: '旧店铺', packages: [] },
    { id: '20', shop_id: '20', name: '保留店铺', packages: [] },
  ],
  [
    { shop_id: '10', name: '更新店铺', packages: [{ name: '新套餐' }] },
    { shop_id: 30, name: '新增店铺', packages: [] },
    null,
    { shop_id: '', name: '无效店铺' },
  ],
);

assertEqual(
  merged.map((shop) => ({ id: shop.id, shop_id: shop.shop_id, name: shop.name })),
  [
    { id: '10', shop_id: '10', name: '更新店铺' },
    { id: '20', shop_id: '20', name: '保留店铺' },
    { id: '30', shop_id: '30', name: '新增店铺' },
  ],
  '按 shop_id 合并',
);

assertEqual(
  removeShopById(merged, 10).map((shop) => shop.shop_id),
  ['20', '30'],
  '按规范化 ID 删除',
);

const capped = mergeShopsById(
  [],
  Array.from({ length: 205 }, (_, index) => ({ shop_id: index + 1, name: `店铺${index + 1}` })),
);
assertEqual(capped.length, 200, '缓存数量上限');

assertEqual(
  mergeShopsById([], [
    { shop_id: 'same-name-1', name: '同名店铺' },
    { shop_id: 'same-name-2', name: '同名店铺' },
  ]).length,
  2,
  '同名不同 shop_id 均保留',
);

const variables = updateShopCacheVariables(
  { unrelated: { keep: true }, shop_store_cache: [{ shop_id: '1', name: '旧值' }] },
  [{ shop_id: '1', name: '新值' }],
);
assertEqual(variables.unrelated, { keep: true }, '保留其他全局变量');
assertEqual(
  (variables.shop_store_cache as Array<{ name: string }>)[0].name,
  '新值',
  '原子更新缓存字段',
);

console.log('shop cache contract passed');
