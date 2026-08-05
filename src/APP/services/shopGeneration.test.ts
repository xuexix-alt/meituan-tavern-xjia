import { parseShopResponse } from './shopGeneration';

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} 不一致。\n实际: ${JSON.stringify(actual)}\n期望: ${JSON.stringify(expected)}`);
  }
}

(globalThis as typeof globalThis & { window: Record<string, unknown> }).window = {};

const response = `[手机界面开始]
[推荐标签]
- 测试

[店铺]
shop_id: 2026080401
name: 测试店铺
shoptags:
  - 测试标签

[套餐]
name: 测试套餐
icon: fas fa-store
price: 88
stars: 4.8
tags:
  - 推荐
content:
  - '测试玩法'
image1: 【露脸图】[测试图片一]
image2: 【时装秀】[测试图片二]
image3: 【私密拍】[测试图片三]
description: [测试人物，25岁，测试身份。]
reviews:
  - 测试推荐语
[/套餐]
[/店铺]
[手机界面结束]`;

const parsed = parseShopResponse(response);

assertEqual(parsed.length, 1, '店铺数量');
assertEqual(parsed[0].shop_id, '2026080401', 'shop_id');
assertEqual(parsed[0].name, '测试店铺', '店铺名称');
assertEqual(parsed[0].packages.length, 1, '套餐数量');
assertEqual((parsed[0].packages[0] as { name?: unknown }).name, '测试套餐', '套餐名称');

assertEqual(parseShopResponse('这不是店铺数据'), [], '非店铺回复不写入');

console.log('shop generation parser contract passed');
