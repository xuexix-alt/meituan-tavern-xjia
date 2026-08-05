import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultDraft } from '../domain/chat';
import {
  STORAGE_KEY,
  createDefaultWorkspace,
  loadWorkspace,
  sanitizeHistoryEntry,
  saveWorkspace,
  toPromptPreset,
} from './localStore';

describe('local workspace storage', () => {
  beforeEach(() => localStorage.clear());

  it('loads DeepSeek defaults when storage is empty', () => {
    expect(loadWorkspace()).toMatchObject({
      version: 1,
      connection: {
        baseUrl: 'https://api.deepseek.com',
        apiKey: '',
        model: 'deepseek-v4-flash',
      },
      presets: [],
      history: [],
      macroName: '{{lastusermessage}}',
      appendReply: false,
    });
  });

  it('round-trips the version 1 workspace schema', () => {
    const workspace = createDefaultWorkspace();
    workspace.connection.apiKey = 'sk-local';
    workspace.draft.messages[0].content = 'Be precise.';

    saveWorkspace(workspace);

    expect(loadWorkspace()).toEqual(workspace);
  });

  it('upgrades only the untouched legacy blank draft to the bundled prompt', () => {
    const workspace = createDefaultWorkspace();
    workspace.connection.apiKey = 'keep-local-key';
    workspace.connection.model = 'deepseek-chat';
    workspace.draft = {
      model: 'deepseek-chat',
      messages: [
        { id: 'old-system', role: 'system', content: '', collapsed: false },
        { id: 'old-user', role: 'user', content: '', collapsed: false },
      ],
      generation: { stream: false, stop: [], additional: {} },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));

    const loaded = loadWorkspace();
    expect(loaded.connection.apiKey).toBe('keep-local-key');
    expect(loaded.connection.model).toBe('deepseek-v4-flash');
    expect(loaded.draft.messages).toHaveLength(5);
  });

  it('falls back safely when stored JSON is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{bad');
    localStorage.setItem('unrelated', 'keep');

    expect(loadWorkspace()).toMatchObject({
      version: 1,
      connection: { baseUrl: 'https://api.deepseek.com', apiKey: '', model: 'deepseek-v4-flash' },
      presets: [],
      history: [],
    });
    expect(localStorage.getItem('unrelated')).toBe('keep');
  });

  it('removes authorization values from history', () => {
    const entry = sanitizeHistoryEntry({
      id: 'run-1',
      timestamp: '2026-07-30T00:00:00.000Z',
      model: 'deepseek-chat',
      status: 'success',
      durationMs: 100,
      payload: {
        model: 'deepseek-chat',
        authorization: 'Bearer secret',
        nested: { apiKey: 'secret', 'x-provider-api-key': 'secret', keep: true },
      },
      responseText: 'ok',
    });

    expect(JSON.stringify(entry)).not.toContain('secret');
    expect(entry.payload).toEqual({ model: 'deepseek-chat', nested: { keep: true } });
  });

  it('keeps only the newest 30 history entries', () => {
    const workspace = createDefaultWorkspace();
    workspace.history = Array.from({ length: 35 }, (_, index) => ({
      id: `run-${index}`,
      timestamp: new Date(index * 1000).toISOString(),
      model: 'deepseek-chat',
      status: 'success' as const,
      durationMs: index,
      payload: { model: 'deepseek-chat', messages: [{ role: 'user', content: String(index) }] },
      responseText: String(index),
    }));

    saveWorkspace(workspace);

    const loaded = loadWorkspace();
    expect(loaded.history).toHaveLength(30);
    expect(loaded.history[0].id).toBe('run-34');
    expect(loaded.history[29].id).toBe('run-5');
  });

  it('does not copy an API key into a prompt preset', () => {
    const preset = toPromptPreset('Careful', createDefaultDraft(), {
      baseUrl: 'https://api.deepseek.com',
      apiKey: 'sk-secret',
      model: 'deepseek-chat',
    });

    expect(JSON.stringify(preset)).not.toContain('sk-secret');
    expect(preset).not.toHaveProperty('apiKey');
  });
});
