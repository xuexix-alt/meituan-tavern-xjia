import assert from 'node:assert/strict';
import test from 'node:test';
import { getHostPanelHeight } from './hostViewport.ts';

test('高度来自宿主聊天可视区，不受 iframe 自身高度影响', () => {
  assert.equal(getHostPanelHeight({ top: 36, bottom: 1000 }, { offsetTop: 0, height: 1200 }), 952);
});

test('短屏保留导航空间，不用最小高度撑出宿主', () => {
  assert.equal(getHostPanelHeight({ top: 36, bottom: 320 }, { offsetTop: 0, height: 400 }), 272);
});

test('软键盘压缩和移动 visualViewport 时只使用可见交集', () => {
  assert.equal(getHostPanelHeight({ top: 36, bottom: 700 }, { offsetTop: 100, height: 350 }), 338);
  assert.equal(getHostPanelHeight({ top: -80, bottom: 500 }, { offsetTop: 0, height: 844 }), 488);
});

test('不可见或无效宿主保留 CSS 回退，防止布局坍缩或反馈循环', () => {
  assert.equal(getHostPanelHeight({ top: 900, bottom: 1000 }, { offsetTop: 0, height: 844 }), null);
  assert.equal(getHostPanelHeight({ top: 0, bottom: 0 }, { offsetTop: 0, height: 844 }), null);
  assert.equal(getHostPanelHeight({ top: 0, bottom: NaN }, { offsetTop: 0, height: 844 }), null);
});
