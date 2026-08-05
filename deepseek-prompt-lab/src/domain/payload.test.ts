import { describe, expect, it } from 'vitest';
import { createDefaultDraft, type PromptDraft } from './chat';
import { buildPayload, importRawPayload } from './payload';

function createDraft(overrides: Partial<PromptDraft> = {}): PromptDraft {
  return {
    model: 'deepseek-chat',
    messages: [
      {
        id: 'editor-message-1',
        role: 'system',
        content: 'Be concise.',
        collapsed: false,
      },
    ],
    generation: {
      stream: true,
      temperature: 0.7,
      stop: ['END'],
      additional: { response_format: { type: 'json_object' } },
    },
    ...overrides,
  };
}

describe('payload domain', () => {
  it('creates the bundled DeepSeek draft with five editable messages', () => {
    const draft = createDefaultDraft();

    expect(draft).toMatchObject({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', collapsed: false },
        { role: 'system', collapsed: false },
        { role: 'user', collapsed: false },
        { role: 'user', collapsed: false },
        { role: 'assistant', collapsed: false },
      ],
      generation: { stream: true, temperature: 0.95, max_tokens: 50000, stop: [], additional: {} },
    });
    expect(draft.messages[0].content).toContain('手机界面文字生成接口');
    expect(draft.messages[0].id).not.toBe(draft.messages[1].id);
  });

  it('builds a wire payload without editor-only ids', () => {
    const payload = buildPayload(createDraft());

    expect(payload).toEqual({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: 'Be concise.' }],
      stream: true,
      temperature: 0.7,
      stop: ['END'],
      response_format: { type: 'json_object' },
    });
    expect(JSON.stringify(payload)).not.toContain('editor-message-1');
    expect(JSON.stringify(payload)).not.toContain('collapsed');
  });

  it('rejects additional fields that replace model messages or stream', () => {
    for (const additional of [{ model: 'other' }, { messages: [] }, { stream: false }]) {
      expect(() => buildPayload(createDraft({ generation: { stream: true, stop: [], additional } }))).toThrow(
        /保留字段/,
      );
    }
  });

  it('imports supported fields and preserves unknown top-level fields', () => {
    const result = importRawPayload(
      JSON.stringify({
        model: 'deepseek-reasoner',
        messages: [{ role: 'user', content: 'Explain this.' }],
        stream: true,
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 400,
        stop: ['STOP'],
        reasoning_effort: 'high',
      }),
    );

    expect(result).toMatchObject({ success: true });
    if (!result.success) throw new Error(result.error);

    expect(result.draft).toMatchObject({
      model: 'deepseek-reasoner',
      messages: [{ role: 'user', content: 'Explain this.', collapsed: false }],
      generation: {
        stream: true,
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 400,
        stop: ['STOP'],
        additional: { reasoning_effort: 'high' },
      },
    });
    expect(result.draft.messages[0].id).toEqual(expect.any(String));
  });

  it('rejects invalid JSON and an empty messages array', () => {
    expect(importRawPayload('{oops')).toMatchObject({ success: false });
    expect(importRawPayload('{"model":"deepseek-chat","messages":[]}')).toMatchObject({ success: false });
  });

  it('keeps tool_call_id only for tool messages', () => {
    const result = importRawPayload(
      JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'assistant', content: 'Not a tool.', tool_call_id: 'discard-me' },
          { role: 'tool', content: 'Tool output.', tool_call_id: 'call-1' },
        ],
      }),
    );

    expect(result).toMatchObject({ success: true });
    if (!result.success) throw new Error(result.error);

    expect(buildPayload(result.draft).messages).toEqual([
      { role: 'assistant', content: 'Not a tool.' },
      { role: 'tool', content: 'Tool output.', tool_call_id: 'call-1' },
    ]);
  });

  it('preserves an explicitly empty tool_call_id on tool messages', () => {
    const result = importRawPayload(
      JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'tool', content: 'Tool output.', tool_call_id: '' }],
      }),
    );

    expect(result).toMatchObject({ success: true });
    if (!result.success) throw new Error(result.error);

    expect(buildPayload(result.draft).messages).toEqual([
      { role: 'tool', content: 'Tool output.', tool_call_id: '' },
    ]);
  });
});
