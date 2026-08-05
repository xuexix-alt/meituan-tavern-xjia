import { describe, expect, it } from 'vitest';
import type { ChatMessage } from './chat';
import { addMessage, copyMessage, moveMessage, removeMessage } from './messages';

const messages: ChatMessage[] = [
  { id: 'system-1', role: 'system', content: 'Rules', collapsed: false },
  { id: 'user-1', role: 'user', content: 'Hello', collapsed: true },
];

describe('message operations', () => {
  it('adds a user message after the current final message', () => {
    const result = addMessage(messages);

    expect(result).toHaveLength(3);
    expect(result.slice(0, 2)).toEqual(messages);
    expect(result[2]).toMatchObject({ role: 'user', content: '', collapsed: false });
    expect(result[2].id).not.toBe(messages[1].id);
  });

  it('copies content into a new message with a fresh id', () => {
    const result = copyMessage(messages, 'user-1');

    expect(result).toHaveLength(3);
    expect(result[2]).toMatchObject({ role: 'user', content: 'Hello', collapsed: true });
    expect(result[2].id).not.toBe('user-1');
  });

  it('copies an explicitly empty tool_call_id', () => {
    const toolMessage: ChatMessage[] = [
      { id: 'tool-1', role: 'tool', content: 'Result', tool_call_id: '', collapsed: false },
    ];

    const result = copyMessage(toolMessage, 'tool-1');

    expect(result[1]).toMatchObject({ role: 'tool', tool_call_id: '' });
  });

  it('does not delete the final remaining message', () => {
    const onlyMessage = [messages[0]];

    expect(removeMessage(onlyMessage, 'system-1')).toBe(onlyMessage);
  });

  it('moves a message within bounds and ignores invalid moves', () => {
    expect(moveMessage(messages, 0, 1).map((message) => message.id)).toEqual(['user-1', 'system-1']);
    expect(moveMessage(messages, -1, 1)).toBe(messages);
    expect(moveMessage(messages, 0, 2)).toBe(messages);
  });
});
