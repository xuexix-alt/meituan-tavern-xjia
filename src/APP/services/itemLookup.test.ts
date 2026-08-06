import { dedupePackages, findPackageByIdOrName } from './itemLookup';

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} 不一致。\n实际: ${JSON.stringify(actual)}\n期望: ${JSON.stringify(expected)}`);
  }
}

const packages = dedupePackages([
  { id: 'pkg_auto_0', shop_id: '20240728103001', name: '狐狸的契约·赌上事业的内射' },
  { id: 'pkg_auto_0', shop_id: '2025163501', name: '昭和末年·初代女神' },
]);

assertEqual(packages.length, 2, '跨店铺重复套餐 ID 应保留');
assertEqual(
  findPackageByIdOrName(
    packages.filter(pkg => pkg.shop_id === '2025163501'),
    'pkg_auto_0',
    '昭和末年·初代女神',
  )?.name,
  '昭和末年·初代女神',
  '店铺范围内按套餐 ID 查找',
);
assertEqual(
  findPackageByIdOrName(packages, 'pkg_auto_0', '昭和末年·初代女神', true)?.name,
  '昭和末年·初代女神',
  '旧链接按名称优先兼容',
);

console.log('item lookup collision contract passed');
