import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const appSource = fs.readFileSync(new URL('../app.vue', import.meta.url), 'utf8');
const readerSource = fs.readFileSync(new URL('./StoryReader.vue', import.meta.url), 'utf8');

test('移动端正文外壳为阅读区保留更高的纵向空间', () => {
  assert.match(
    appSource,
    /\.phone-frame\.is-story-reader\s*\{[\s\S]*?min-height:\s*min\(980px,\s*calc\(100vw\s*\*\s*1\.85\)\)/,
  );
});

test('正文页在底部输入区提供独立的首页快捷按钮', () => {
  assert.match(readerSource, /class="reader-home-button"/);
  assert.match(readerSource, /aria-label="返回上一页"/);
  assert.match(readerSource, /aria-label="返回首页"/);
  assert.match(readerSource, /router\.replace\(['"]\/home['"]\)/);
  assert.match(readerSource, /fa-house/);
});

test('流式正文的自动跟随受手动滚动开关保护', () => {
  assert.match(readerSource, /const shouldAutoFollow = ref\(true\)/);
  assert.match(readerSource, /function handleManualScrollIntent\(\)[\s\S]*?shouldAutoFollow\.value\s*=\s*false/);
  assert.match(readerSource, /@touchmove(?:\.passive)?="handleManualScrollIntent"/);
  assert.match(readerSource, /@wheel(?:\.passive)?="handleManualScrollIntent"/);
  assert.match(
    readerSource,
    /if\s*\(shouldAutoFollow\.value\)[\s\S]*?scroller\.scrollTop\s*=\s*scroller\.scrollHeight/s,
  );
});
