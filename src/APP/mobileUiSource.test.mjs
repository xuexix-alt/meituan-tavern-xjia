import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const appSource = fs.readFileSync(new URL('./app.vue', import.meta.url), 'utf8');
const readerSource = fs.readFileSync(new URL('./story/StoryReader.vue', import.meta.url), 'utf8');

test('APP 壳层提供统一的移动端设计令牌和触控反馈', () => {
  assert.match(appSource, /--radius-card:\s*14px/);
  assert.match(appSource, /--touch-target:\s*44px/);
  assert.match(appSource, /touch-action:\s*manipulation/);
  assert.match(appSource, /:focus-visible/);
});

test('底部导航和固定操作区避开移动端安全区', () => {
  assert.match(appSource, /\.phone-frame :deep\(\.nav-bar\)[\s\S]*?safe-area-inset-bottom/);
  assert.match(appSource, /\.phone-frame :deep\(\.detail-footer\)[\s\S]*?safe-area-inset-bottom/);
});

test('正文阅读区继续保留长文本舒适留白和底部操作安全区', () => {
  assert.match(readerSource, /\.reader-scroll[\s\S]*?padding:/);
  assert.match(readerSource, /\.reader-composer[\s\S]*?safe-area-inset-bottom/);
  assert.match(readerSource, /\.story-paper[\s\S]*?border-radius:\s*14px/);
});

test('套餐详情的固定下单区和弹窗在窄屏下保持可操作', () => {
  assert.match(appSource, /\.phone-frame :deep\(\.detail-footer\)/);
  assert.match(appSource, /\.phone-frame :deep\(\.modal-overlay\)[\s\S]*?align-items:\s*flex-end/);
  assert.match(appSource, /\.phone-frame :deep\(\.modal-content\)[\s\S]*?max-height:/);
});

test('正文和搜索入口在触屏上提供即时按下反馈', () => {
  assert.match(readerSource, /\.reader-home-button[\s\S]*?transition:/);
  assert.match(readerSource, /\.send-button[\s\S]*?transition:/);
  assert.match(appSource, /\.phone-frame :deep\(\.search-bar-container\)/);
});
