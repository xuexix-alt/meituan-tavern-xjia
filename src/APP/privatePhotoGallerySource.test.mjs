import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./ItemDetail.vue', import.meta.url), 'utf8');

test('私密写真使用独立的单列画廊面板并保留三个图片标签', () => {
  assert.match(source, /private-photo-panel/);
  assert.match(source, /露脸图/);
  assert.match(source, /时装秀/);
  assert.match(source, /私密拍/);
});

test('私密写真画廊支持图片 URL 与文字提示词两种展示状态', () => {
  assert.match(source, /isImageSource/);
  assert.match(source, /image-placeholder/);
  assert.match(source, /image-gallery-media/);
});

test('私密写真画廊使用单列竖版比例并允许提示词自适应高度', () => {
  assert.match(source, /private-photo-panel[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(source, /private-photo-panel\.active[\s\S]*display:\s*grid/);
  assert.match(source, /image-gallery-media[\s\S]*aspect-ratio:\s*4\s*\/\s*5/);
  assert.match(source, /image-placeholder[\s\S]*min-height:[^;]+;[\s\S]*height:\s*auto/);
});
