import { describe, expect, it } from 'vitest';
import { applyMacroToPayload, effectiveMacroName, replaceMacro, resolveMacros } from './macros';
import type { PromptDraft } from './chat';

function createDraft(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): PromptDraft {
  return {
    model: 'deepseek-chat',
    messages: messages.map((message, index) => ({
      id: `m-${index}`,
      role: message.role,
      content: message.content,
      collapsed: false,
    })),
    generation: { stream: false, stop: [], additional: {} },
  };
}

describe('macros', () => {
  it('replaces every occurrence of the macro in a text', () => {
    expect(replaceMacro('a {{lastusermessage}} b {{lastusermessage}}', '{{lastusermessage}}', 'hi')).toBe('a hi b hi');
  });

  it('replaces with an empty string when the input box is empty', () => {
    expect(replaceMacro('【用户输入】\n{{lastusermessage}}\n生成', '{{lastusermessage}}', '')).toBe('【用户输入】\n\n生成');
  });

  it('leaves text untouched when the macro name is blank', () => {
    expect(replaceMacro('{{x}}', '', 'v')).toBe('{{x}}');
  });

  it('falls back to the default macro name when configured name is blank', () => {
    expect(effectiveMacroName('')).toBe('{{lastusermessage}}');
    expect(effectiveMacroName('{{input}}')).toBe('{{input}}');
  });

  it('resolves macros across messages and keeps other messages unchanged', () => {
    const draft = createDraft([
      { role: 'system', content: '设定' },
      { role: 'user', content: '用户 {{lastusermessage}} 结尾' },
      { role: 'assistant', content: '【用户输入】\n{{lastusermessage}}\n生成' },
    ]);
    const resolved = resolveMacros(draft, '{{lastusermessage}}', '今天想生成一套店');

    expect(resolved.messages[0].content).toBe('设定');
    expect(resolved.messages[1].content).toBe('用户 今天想生成一套店 结尾');
    expect(resolved.messages[2].content).toBe('【用户输入】\n今天想生成一套店\n生成');
    expect(resolved).not.toBe(draft);
    expect(draft.messages[2].content).toContain('{{lastusermessage}}');
  });

  it('applies the macro to a raw payload messages array', () => {
    const payload = {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '设定' },
        { role: 'user', content: '输入：{{lastusermessage}}' },
        { role: 'tool', content: 123 as unknown as string },
      ],
    };
    const resolved = applyMacroToPayload(payload, '{{lastusermessage}}', '内容A') as { messages: Array<{ role: string; content: string | number }> };

    expect(resolved.messages[0].content).toBe('设定');
    expect(resolved.messages[1].content).toBe('输入：内容A');
    expect(resolved.messages[2].content).toBe(123);
    expect(resolved).not.toBe(payload);
    expect(payload.messages[1].content).toContain('{{lastusermessage}}');
  });

  it('returns the payload unchanged when messages are missing', () => {
    const payload = { model: 'deepseek-chat' };
    expect(applyMacroToPayload(payload, '{{lastusermessage}}', 'v')).toBe(payload);
  });
});

