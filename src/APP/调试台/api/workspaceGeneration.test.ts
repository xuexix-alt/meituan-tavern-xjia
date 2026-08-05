import { buildWorkspacePayload } from './workspacePayload';
import type { WorkspaceState } from '../storage/localStore';

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} 不一致。\n实际: ${JSON.stringify(actual)}\n期望: ${JSON.stringify(expected)}`);
  }
}

const workspace = {
  version: 1,
  connection: { baseUrl: 'https://example.test', apiKey: 'secret', model: 'test-model' },
  draft: {
    model: 'test-model',
    messages: [
      { id: 'system', role: 'system', content: '固定提示', collapsed: false },
      { id: 'assistant', role: 'assistant', content: '请求：{{lastusermessage}}', collapsed: false },
    ],
    generation: { stream: false, stop: [], additional: {} },
  },
  presets: [],
  history: [],
  macroName: '{{lastusermessage}}',
  macroInput: '旧输入',
  appendReply: false,
  sendMode: 'tavern',
} satisfies WorkspaceState;

const originalDraft = JSON.stringify(workspace.draft);
const payload = buildWorkspacePayload(workspace, '搜索：职场主题');

assertEqual(
  payload.messages,
  [
    { role: 'system', content: '固定提示' },
    { role: 'assistant', content: '请求：搜索：职场主题' },
  ],
  '首页输入替换宏',
);
assertEqual(JSON.stringify(workspace.draft), originalDraft, '不修改调试台预设');

console.log('workspace generation contract passed');
