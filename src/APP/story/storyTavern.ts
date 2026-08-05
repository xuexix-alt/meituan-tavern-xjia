import { createHostFloorVisibilityController } from './hostFloorVisibility';
import { createStorySession, type StorySessionDependencies } from './storySession';
import type { StoryChatMessage, StorySession } from './storyTypes';

function carrierMessageId(): number | null {
  try {
    const id = Number(getCurrentMessageId());
    return Number.isFinite(id) && id >= 0 ? Math.trunc(id) : null;
  } catch {
    return null;
  }
}

function nextMessageId(): number {
  try {
    return Math.max(0, Math.trunc(Number(getLastMessageId()))) + 1;
  } catch {
    return 1;
  }
}

function hostDocuments(): Document[] {
  const documents: Document[] = [];
  const add = (candidate: Document | null | undefined) => {
    if (candidate && candidate !== document && !documents.includes(candidate)) documents.push(candidate);
  };
  try {
    add(window.parent?.document);
  } catch {
    // Ignore cross-origin hosts.
  }
  try {
    add(window.top?.document);
  } catch {
    // Ignore cross-origin hosts.
  }
  return documents;
}

function readHostHtml(messageId: number): string {
  for (const doc of hostDocuments()) {
    const root = doc.querySelector(
      `.mes[mesid='${messageId}'], .mes[data-message-index='${messageId}'], .mes[data-message-id='${messageId}']`,
    );
    const html = String(root?.querySelector('.mes_text')?.innerHTML ?? '').trim();
    if (html) return html;
  }
  try {
    return String(retrieveDisplayedMessage(messageId)?.html?.() ?? '').trim();
  } catch {
    return '';
  }
}

function listHostMessageIds(): number[] {
  const ids = new Set<number>();
  for (const doc of hostDocuments()) {
    doc.querySelectorAll('.mes[mesid], .mes[data-message-index], .mes[data-message-id]').forEach(element => {
      const value = element.getAttribute('mesid') ?? element.getAttribute('data-message-index') ?? element.getAttribute('data-message-id');
      const id = Number(value);
      if (Number.isFinite(id) && id >= 0) ids.add(Math.trunc(id));
    });
  }
  if (!ids.size) {
    try {
      getChatMessages('0-{{lastMessageId}}', { hide_state: 'all' }).forEach(message => ids.add(message.message_id));
    } catch {
      // The session will expose the missing API during refresh.
    }
  }
  return Array.from(ids).sort((a, b) => a - b);
}

function normalizeMessages(messages: ChatMessage[]): StoryChatMessage[] {
  return messages.map(message => ({
    message_id: message.message_id,
    role: message.role,
    message: String(message.message ?? ''),
    is_hidden: Boolean(message.is_hidden),
  }));
}

function eventName(alias: string): EventType | null {
  if (typeof tavern_events === 'undefined' || typeof iframe_events === 'undefined') return null;
  if (alias === 'message_sent') return tavern_events.MESSAGE_SENT;
  if (alias === 'message_received') return tavern_events.MESSAGE_RECEIVED;
  if (alias === 'message_deleted') return tavern_events.MESSAGE_DELETED;
  if (alias === 'chat_changed') return tavern_events.CHAT_CHANGED;
  if (alias === 'stream_full') return iframe_events.STREAM_TOKEN_RECEIVED_FULLY;
  return null;
}

function requireApi<T>(value: T | undefined, name: string): T {
  if (typeof value === 'undefined') throw new Error(`酒馆助手 API ${name} 不可用，请在酒馆聊天内打开 APP。`);
  return value;
}

export function createDefaultStorySession(): StorySession {
  const visibility = createHostFloorVisibilityController({ carrierMessageId, nextMessageId });
  const dependencies: StorySessionDependencies = {
    readMessages: range => {
      if (typeof getChatMessages === 'undefined') return [];
      return normalizeMessages(getChatMessages(range, { hide_state: 'all' }));
    },
    createMessages: async messages => {
      const create = requireApi(typeof createChatMessages === 'undefined' ? undefined : createChatMessages, 'createChatMessages');
      await create(messages.map(message => ({ ...message, is_hidden: false })), { refresh: 'affected' });
    },
    deleteMessages: async messageIds => {
      const remove = requireApi(typeof deleteChatMessages === 'undefined' ? undefined : deleteChatMessages, 'deleteChatMessages');
      await remove(messageIds, { refresh: 'all' });
    },
    generate: async config => {
      const run = requireApi(typeof generate === 'undefined' ? undefined : generate, 'generate');
      const result = await run(config);
      if (typeof result !== 'string') throw new Error('正文生成返回了不支持的工具调用结果。');
      return result;
    },
    stopGeneration: generationId => {
      if (typeof stopGenerationById === 'function') stopGenerationById(generationId);
    },
    carrierMessageId,
    nextMessageId,
    readHostHtml,
    formatDisplayedMessage: (text, messageId) => {
      if (typeof formatAsDisplayedMessage === 'undefined') return text;
      return formatAsDisplayedMessage(text, { message_id: messageId });
    },
    listHostMessageIds,
    reserveHostFloor: messageId => visibility.apply(messageId),
    replaceHostFloors: messageIds => visibility.replace(messageIds),
    clearHostFloors: messageIds => visibility.clear(messageIds),
    createGenerationId: () => `meituan-story-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    subscribe: (alias, listener) => {
      if (typeof eventOn === 'undefined') return;
      const name = eventName(alias);
      if (!name) return;
      return eventOn(name as any, listener as any);
    },
  };
  const session = createStorySession(dependencies);
  const disposeSession = session.dispose;
  session.dispose = () => {
    disposeSession();
    visibility.destroy();
  };
  return session;
}
