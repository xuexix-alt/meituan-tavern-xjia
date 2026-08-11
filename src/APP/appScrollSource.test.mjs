import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./app.vue', import.meta.url), 'utf8');

test('APP 壳层让路由页面保持纵向 flex 布局', () => {
  assert.match(
    source,
    /\.phone-frame\s+:deep\(\.app-view\)\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s,
  );
});

test('APP 壳层把页面内容约束为可触摸纵向滚动区', () => {
  assert.match(
    source,
    /\.phone-frame\s+:deep\(\.app-content\)\s*\{[^}]*min-height:\s*0;[^}]*overflow-y:\s*auto;[^}]*touch-action:\s*pan-y;[^}]*-webkit-overflow-scrolling:\s*touch;/s,
  );
});
