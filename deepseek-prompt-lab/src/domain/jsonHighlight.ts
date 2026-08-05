/**
 * 将 JSON 文本渲染为带 token 高亮的安全 HTML 片段。
 * 所有原文内容都会先做 HTML 转义，返回的 HTML 可安全用于 dangerouslySetInnerHTML。
 */
const TOKEN_PATTERN =
  /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],:])/g;

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function highlightJson(text: string): string {
  let html = '';
  let last = 0;
  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    html += escapeHtml(text.slice(last, index));
    const [, stringToken, colon, numberToken, literalToken, punctToken] = match;
    if (stringToken !== undefined) {
      html += `<span class="tk-${colon !== undefined ? 'key' : 'string'}">${escapeHtml(stringToken)}</span>`;
      if (colon !== undefined) {
        html += `<span class="tk-punct">${escapeHtml(colon)}</span>`;
      }
    } else if (numberToken !== undefined) {
      html += `<span class="tk-number">${escapeHtml(numberToken)}</span>`;
    } else if (literalToken !== undefined) {
      html += `<span class="tk-literal">${escapeHtml(literalToken)}</span>`;
    } else if (punctToken !== undefined) {
      html += `<span class="tk-punct">${escapeHtml(punctToken)}</span>`;
    }
    last = match.index! + match[0].length;
  }
  return html + escapeHtml(text.slice(last));
}
