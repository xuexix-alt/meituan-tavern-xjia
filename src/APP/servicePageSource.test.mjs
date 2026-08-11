import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./Service.vue', import.meta.url), 'utf8');

test('服务页使用共享订单显示选择器并标记最近服务模式', () => {
  assert.match(source, /selectActiveOrLatestOrders/);
  assert.match(source, /displayMode === 'recent'/);
  assert.match(source, /最近一次服务记录/);
  assert.match(source, /:key="girl\.id"/);
});

test('服务页按需渲染详情并使用移动端紧凑网格', () => {
  assert.match(source, /v-if="showDetails"/);
  assert.match(source, /v-if="showPsychology"/);
  assert.match(source, /v-if="showBody"/);
  assert.match(source, /v-if="showExperience"/);
  assert.match(source, /\.recent-order-notice/);
  assert.match(source, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)/);
});
