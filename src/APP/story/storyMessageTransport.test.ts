import { createAssistantTransportPlan } from './storyMessageTransport';

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} 不一致。\n实际: ${JSON.stringify(actual)}\n期望: ${JSON.stringify(expected)}`);
  }
}

assertEqual(
  createAssistantTransportPlan(8, '<content>正文</content>'),
  {
    staging: { role: 'user', message: '...', is_hidden: false },
    update: { message_id: 8, role: 'assistant', message: '<content>正文</content>', is_hidden: false },
  },
  '助手正文必须改写同一楼层',
);

assertEqual(
  createAssistantTransportPlan(9, '正文', 'APP_STORY_PENDING', '美人团'),
  {
    staging: { role: 'user', message: 'APP_STORY_PENDING', is_hidden: false },
    update: { message_id: 9, name: '美人团', role: 'assistant', message: '正文', is_hidden: false },
  },
  '助手身份与占位文本可控',
);

console.log('story message transport contract passed');
