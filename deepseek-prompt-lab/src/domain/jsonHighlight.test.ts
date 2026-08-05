import { describe, expect, it } from 'vitest';
import { highlightJson } from './jsonHighlight';

describe('highlightJson', () => {
  it('handles empty and plain text without matches', () => {
    expect(highlightJson('')).toBe('');
    expect(highlightJson('not json at all')).toBe('not json at all');
  });

  it('escapes HTML in raw content', () => {
    expect(highlightJson('<script>&')).toBe('&lt;script&gt;&amp;');
  });

  it('marks keys, strings and punctuation', () => {
    const html = highlightJson('{"model": "deepseek"}');
    expect(html).toContain('<span class="tk-key">"model"</span>');
    expect(html).toContain('<span class="tk-punct">:</span>');
    expect(html).toContain('<span class="tk-string">"deepseek"</span>');
  });

  it('marks numbers, booleans and null', () => {
    const html = highlightJson('{"n": -1.5e3, "b": true, "x": null}');
    expect(html).toContain('<span class="tk-number">-1.5e3</span>');
    expect(html).toContain('<span class="tk-literal">true</span>');
    expect(html).toContain('<span class="tk-literal">null</span>');
    expect(html).toContain('<span class="tk-punct">{</span>');
    expect(html).toContain('<span class="tk-punct">}</span>');
  });

  it('keeps colons, braces and quotes inside string tokens untouched', () => {
    const html = highlightJson('{"k": "a:{[\\"b\\"]:1}"}');
    expect(html).toContain('<span class="tk-string">"a:{[\\"b\\"]:1}"</span>');
    // 整个字符串是一个 token，内部冒号不会被拆出来；外层只有 {、:、} 三个标点。
    expect(html.match(/class="tk-punct"/g)).toHaveLength(3);
  });

  it('escapes dangerous characters inside string tokens', () => {
    const html = highlightJson('{"k": "<img>"}');
    expect(html).toContain('<span class="tk-string">"&lt;img&gt;"</span>');
  });
});
