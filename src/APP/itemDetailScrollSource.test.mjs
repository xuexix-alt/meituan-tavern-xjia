import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./ItemDetail.vue', import.meta.url), 'utf8');

test('套餐详情滚动区和 tab 控件声明移动端纵向触摸策略', () => {
  assert.match(
    source,
    /\.app-content\s*\{[^}]*min-height:\s*0;[^}]*touch-action:\s*pan-y;[^}]*-webkit-overflow-scrolling:\s*touch;/s,
  );
  assert.match(source, /\.detail-tabs\s*\{[^}]*touch-action:\s*pan-y;/s);
  assert.match(source, /\.tab-link\s*\{[^}]*touch-action:\s*pan-y;/s);
});

test('套餐详情仍保留三个 tab 及现有切换目标', () => {
  assert.equal((source.match(/<button class="tab-link"/g) ?? []).length, 3);
  assert.match(source, /@click="activeTab = 'content'"/);
  assert.match(source, /@click="activeTab = 'reviews'"/);
  assert.match(source, /@click="activeTab = 'images'"/);
});
