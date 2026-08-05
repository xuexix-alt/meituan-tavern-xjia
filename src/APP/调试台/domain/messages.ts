import type { ChatMessage } from './chat';

function createMessage(role: ChatMessage['role'], content = ''): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    collapsed: false,
  };
}

export function addMessage(messages: ChatMessage[]): ChatMessage[] {
  return [...messages, createMessage('user')];
}

export function copyMessage(messages: ChatMessage[], id: string): ChatMessage[] {
  const sourceIndex = messages.findIndex(message => message.id === id);
  if (sourceIndex === -1) return messages;

  const source = messages[sourceIndex];
  const copy = {
    ...createMessage(source.role, source.content),
    collapsed: source.collapsed,
    ...(source.role === 'tool' && source.tool_call_id !== undefined ? { tool_call_id: source.tool_call_id } : {}),
  };

  return [...messages.slice(0, sourceIndex + 1), copy, ...messages.slice(sourceIndex + 1)];
}

export function removeMessage(messages: ChatMessage[], id: string): ChatMessage[] {
  if (messages.length <= 1 || !messages.some(message => message.id === id)) return messages;
  return messages.filter(message => message.id !== id);
}

export function moveMessage(messages: ChatMessage[], fromIndex: number, toIndex: number): ChatMessage[] {
  if (
    fromIndex < 0 ||
    fromIndex >= messages.length ||
    toIndex < 0 ||
    toIndex >= messages.length ||
    fromIndex === toIndex
  ) {
    return messages;
  }

  const reordered = [...messages];
  const [message] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, message);
  return reordered;
}
