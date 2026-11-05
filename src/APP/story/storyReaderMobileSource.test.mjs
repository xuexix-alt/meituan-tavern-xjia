import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const appSource = fs.readFileSync(new URL('../app.vue', import.meta.url), 'utf8');
const readerSource = fs.readFileSync(new URL('./StoryReader.vue', import.meta.url), 'utf8');

test('正文与其他页面共用宿主可视高度，不用额外最小高度挤出操作区', () => {
  assert.match(appSource, /height:\s*var\(--app-height,\s*auto\)/);
  assert.doesNotMatch(appSource, /min-height:\s*min\(980px/);
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
    /if\s*\(scroller\s*&&\s*shouldAutoFollow\.value\)[\s\S]*?scroller\.scrollTop\s*=\s*scroller\.scrollHeight/s,
  );
});
