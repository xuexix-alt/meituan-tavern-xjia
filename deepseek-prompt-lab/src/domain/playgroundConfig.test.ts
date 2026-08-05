import { describe, expect, it } from 'vitest';
import { createDefaultDraft } from './chat';
import { exportPlaygroundConfig, importPlaygroundConfig } from './playgroundConfig';

describe('playground config', () => {
  it('round-trips the bundled config shape without an API key', () => {
    const draft = createDefaultDraft();
    draft.generation.additional = { apiKey: 'nested-secret', reasoning_effort: 'high' };
    const exported = exportPlaygroundConfig({
      baseUrl: 'https://api.deepseek.com',
      draft,
      macroName: '{{lastusermessage}}',
      appendReply: false,
    });

    expect(exported).toMatchObject({
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash',
      temperature: 0.95,
      maxTokens: 50000,
      stream: true,
      macroName: '{{lastusermessage}}',
      appendReply: false,
    });
    expect(exported).not.toHaveProperty('apiKey');
    expect(exported).toHaveProperty('reasoning_effort', 'high');

    const imported = importPlaygroundConfig(JSON.stringify(exported));
    expect(imported).toMatchObject({ success: true });
    if (!imported.success) throw new Error(imported.error);
    expect(imported.config.baseUrl).toBe('https://api.deepseek.com');
    expect(imported.config.draft).toMatchObject({
      model: 'deepseek-v4-flash',
      generation: { temperature: 0.95, max_tokens: 50000, stream: true },
    });
    expect(imported.config.draft.messages).toHaveLength(5);
  });

  it('accepts OpenAI wire names when importing a playground file', () => {
    const result = importPlaygroundConfig(JSON.stringify({
      baseUrl: 'http://localhost:9000/v1',
      model: 'local-model',
      max_tokens: 128,
      messages: [{ role: 'user', content: 'hello' }],
    }));

    expect(result).toMatchObject({ success: true });
    if (!result.success) throw new Error(result.error);
    expect(result.config.draft.generation.max_tokens).toBe(128);
    expect(result.config.draft.messages[0]).toMatchObject({ role: 'user', content: 'hello' });
  });
});
