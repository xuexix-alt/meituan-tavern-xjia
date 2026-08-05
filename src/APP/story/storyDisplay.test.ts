import { renderStreamingStoryHtml } from './storyDisplay';

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label} 不一致。\n实际: ${String(actual)}\n期望: ${String(expected)}`);
  }
}

function testPartialXmlReplacement() {
  const html = renderStreamingStoryHtml(
    '正文\n<UpdateVariable>{"foo":1',
    'assistant',
    text => text.replace(/<UpdateVariable>[\s\S]*$/i, '<div class="variable-pending">变量处理中</div>'),
  );
  assertEqual(html, '正文\n<div class="variable-pending">变量处理中</div>', '未闭合 XML 应用显示正则');
}

function testBeautificationHtml() {
  const html = renderStreamingStoryHtml('<scene>雪夜</scene>', 'assistant', text =>
    text.replace(/<scene>([\s\S]*?)<\/scene>/i, '<article class="scene">$1</article>'),
  );
  assertEqual(html, '<article class="scene">雪夜</article>', '正则 HTML 原样进入 v-html');
}

function testIntentionalEmptyOutput() {
  const html = renderStreamingStoryHtml('<hidden>secret</hidden>', 'assistant', () => '');
  assertEqual(html, '', '空正则结果保持隐藏');
}

function testUnchangedUnsafeXmlIsEscaped() {
  const source = '<unknown onclick="alert(1)">raw</unknown>';
  const html = renderStreamingStoryHtml(source, 'assistant', text => text);
  assertEqual(
    html,
    '&lt;unknown onclick=&quot;alert(1)&quot;&gt;raw&lt;/unknown&gt;',
    '未被正则处理的 XML 安全转义',
  );
}

function testRegexFailureFallsBackSafely() {
  const originalWarn = console.warn;
  console.warn = () => undefined;
  let html = '';
  try {
    html = renderStreamingStoryHtml('<UpdateVariable>broken', 'assistant', () => {
      throw new Error('regex unavailable');
    });
  } finally {
    console.warn = originalWarn;
  }
  assertEqual(html, '&lt;UpdateVariable&gt;broken', '正则异常安全回退');
}

function testRoleMapping() {
  const sources: string[] = [];
  const apply = (text: string, source: string) => {
    sources.push(source);
    return `${text}!`;
  };
  renderStreamingStoryHtml('a', 'assistant', apply);
  renderStreamingStoryHtml('u', 'user', apply);
  renderStreamingStoryHtml('s', 'system', apply);
  assertEqual(sources.join(','), 'ai_output,user_input,world_info', '消息角色映射');
}

testPartialXmlReplacement();
testBeautificationHtml();
testIntentionalEmptyOutput();
testUnchangedUnsafeXmlIsEscaped();
testRegexFailureFallsBackSafely();
testRoleMapping();
console.log('story display contract passed');
