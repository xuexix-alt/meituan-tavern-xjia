import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./ShopDetail.vue', import.meta.url), 'utf8');

test('店铺详情必须按共享归一化 ID 读取 shop_id-only 缓存', () => {
  assert.match(source, /createVariableShopStore/);
  assert.match(source, /fallbackShopStore/);
  assert.match(source, /normalizeShopList/);
  assert.match(source, /shop\.shop_id/);
  assert.match(source, /p\.shop_id \?\? p\.shopId/);
});
