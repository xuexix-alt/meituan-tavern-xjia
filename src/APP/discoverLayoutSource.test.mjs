import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const appSource = fs.readFileSync(new URL('./app.vue', import.meta.url), 'utf8');
const discoverSource = fs.readFileSync(new URL('./Discover.vue', import.meta.url), 'utf8');

test('发现页窄屏店铺卡片保留可读宽度并允许副标题收缩', () => {
  assert.match(
    appSource,
    /\.phone-frame :deep\(\.shop-list-items\)\s*\{\s*grid-template-columns: repeat\(auto-fit, minmax\(min\(200px, 100%\), 1fr\)\)/s,
  );
  assert.match(discoverSource, /\.slogan-text[\s\S]*?min-width: 0;/);
});
