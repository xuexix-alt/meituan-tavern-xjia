import assert from 'node:assert';
import {
  DEFAULT_READER_TYPOGRAPHY,
  clamp,
  loadReaderTypography,
  saveReaderTypography,
} from './readerTypography.ts';

function makeStore(init = {}) {
  const map = new Map(Object.entries(init));
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
  };
}

function testEmptyStoreFallsBackToDefault() {
  const s = loadReaderTypography(makeStore());
  assert.deepEqual(s, DEFAULT_READER_TYPOGRAPHY, '空存储返回默认值');
}

function testInvalidValuesFallBack() {
  const s = loadReaderTypography(
    makeStore({ 'app-reader-font-size': 'abc', 'app-reader-line-height': 'xyz' }),
  );
  assert.deepEqual(s, DEFAULT_READER_TYPOGRAPHY, '非法值回落默认');
}

function testClampOutOfRange() {
  const s = loadReaderTypography(
    makeStore({ 'app-reader-font-size': '99', 'app-reader-line-height': '9.9' }),
  );
  assert.equal(s.fontSize, 20, '字号 clamp 到上限');
  assert.equal(s.lineHeight, 2.2, '行距 clamp 到上限');
}

function testRoundAndParse() {
  const s = loadReaderTypography(
    makeStore({ 'app-reader-font-size': '14.7', 'app-reader-line-height': '1.66' }),
  );
  assert.equal(s.fontSize, 15, '字号四舍五入为整数');
  assert.equal(s.lineHeight, 1.7, '行距保留一位小数');
}

function testSaveClampsAndWrites() {
  const store = makeStore();
  saveReaderTypography({ fontSize: 99, lineHeight: 0.1 }, store);
  assert.equal(store.getItem('app-reader-font-size'), '20', '保存时字号 clamp 到上限');
  assert.equal(store.getItem('app-reader-line-height'), '1.3', '保存时行距 clamp 到下限');
}

function testSaveWritesNormalValues() {
  const store = makeStore();
  saveReaderTypography({ fontSize: 15, lineHeight: 1.6 }, store);
  assert.equal(store.getItem('app-reader-font-size'), '15', '正常字号原样写入');
  assert.equal(store.getItem('app-reader-line-height'), '1.6', '正常行距原样写入');
}

function testClampHelper() {
  assert.equal(clamp(5, 1, 10), 5, '范围内原样');
  assert.equal(clamp(99, 1, 10), 10, '超出上限截断');
  assert.equal(clamp(-1, 1, 10), 1, '低于下限截断');
}

testEmptyStoreFallsBackToDefault();
testInvalidValuesFallBack();
testClampOutOfRange();
testRoundAndParse();
testSaveClampsAndWrites();
testSaveWritesNormalValues();
testClampHelper();
console.log('reader typography contract passed');
