import { parseShopData } from './shopData';

const parsed = parseShopData(`[手机界面开始]
[店铺]
shop_id: shop-a
name: 店铺A
[套餐]
name: 套餐A
price: 100
[/套餐]
[/店铺]
[店铺]
shop_id: shop-b
name: 店铺B
[套餐]
name: 套餐B
price: 100
[/套餐]
[/店铺]
[手机界面结束]`);

const ids = parsed.packages.map(pkg => pkg.id);
if (parsed.shops.length !== 2 || parsed.packages.length !== 2) {
  throw new Error(`应解析出 2 家店铺和 2 个套餐，实际为 ${parsed.shops.length}/${parsed.packages.length}`);
}
if (ids[0] === ids[1] || ids.some(id => String(id).startsWith('pkg_auto_'))) {
  throw new Error(`跨店铺套餐 ID 不应重复或继续使用 pkg_auto_*：${JSON.stringify(ids)}`);
}

console.log('shop data package identity contract passed');
