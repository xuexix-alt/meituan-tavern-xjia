import { createHostFloorVisibilityController } from './hostFloorVisibility';
import { sanitizeMvuUpdateBlocks } from './storyMvuGuard';
import { createAssistantTransportPlan } from './storyMessageTransport';
import { createStorySession, type StorySessionDependencies } from './storySession';
import type { StoryChatMessage, StorySession } from './storyTypes';

type StoryIframeEvents = Pick<typeof iframe_events, 'STREAM_TOKEN_RECEIVED_FULLY' | 'GENERATION_ENDED'>;
type StoryTavernEvents = Pick<
  typeof tavern_events,
  'MESSAGE_SENT' | 'MESSAGE_RECEIVED' | 'MESSAGE_DELETED' | 'CHAT_CHANGED'
>;
type StoryEventSource = {
  on: (event: unknown, listener: (...args: unknown[]) => void) => void;
  removeListener: (event: unknown, listener: (...args: unknown[]) => void) => void;
  emit: (event: unknown, ...args: unknown[]) => Promise<void> | void;
};
type StorySillyTavern = typeof SillyTavern & {
  getContext?: () => { eventSource?: StoryEventSource; name2?: string };
};
type StoryTavernHelper = Window['TavernHelper'] & {
  iframe_events?: StoryIframeEvents;
  tavern_events?: StoryTavernEvents;
};
type StoryRuntimeWindow = Window & {
  TavernHelper?: StoryTavernHelper;
  SillyTavern?: StorySillyTavern;
};

function resolveTavernHelper(): StoryTavernHelper | null {
  const candidates = [() => window, () => window.parent, () => window.top];
  for (const getCandidate of candidates) {
    try {
      const helper = (getCandidate() as StoryRuntimeWindow).TavernHelper;
      if (helper) return helper;
    } catch {
      // 跨域访问失败，继续尝试下一个窗口。
    }
  }
  return null;
}

function resolveSillyTavern(): StorySillyTavern | null {
  const candidates = [() => window, () => window.parent, () => window.top];
  for (const getCandidate of candidates) {
    try {
      const sillyTavern = (getCandidate() as StoryRuntimeWindow).SillyTavern;
      if (sillyTavern) return sillyTavern;
    } catch {
      // 跨域访问失败，继续尝试下一个窗口。
    }
  }
  return null;
}

function resolveAssistantName(): string | undefined {
  const candidates = [() => window.top, () => window.parent, () => window];
  for (const getCandidate of candidates) {
    try {
      const host = getCandidate() as StoryRuntimeWindow;
      const sillyTavern = host.SillyTavern;
      const name = sillyTavern?.getContext?.().name2 ?? sillyTavern?.name2;
      if (typeof name === 'string' && name.trim()) return name.trim();
    } catch {
      // 继续尝试下一层宿主窗口。
    }
  }
  return undefined;
}

function resolveHelperMethod<K extends keyof Window['TavernHelper']>(name: K): Window['TavernHelper'][K] | undefined {
  const helper = resolveTavernHelper();
  const method = helper?.[name];
  if (typeof method !== 'function') return undefined;
  return Function.prototype.bind.call(method, helper) as Window['TavernHelper'][K];
}

function carrierMessageId(): number | null {
  try {
    const getCurrent = typeof getCurrentMessageId === 'undefined' ? undefined : getCurrentMessageId;
    if (!getCurrent) throw new Error('当前页面没有消息楼层上下文');
    const id = Number(getCurrent());
    return Number.isFinite(id) && id >= 0 ? Math.trunc(id) : null;
  } catch {
    try {
      const getIframe = typeof getIframeName === 'undefined' ? undefined : getIframeName;
      const getMessage = resolveHelperMethod('getMessageId');
      if (!getIframe || !getMessage) return null;
      const id = Number(getMessage(getIframe()));
      return Number.isFinite(id) && id >= 0 ? Math.trunc(id) : null;
    } catch {
      return null;
    }
  }
}

function nextMessageId(): number {
  try {
    const getLast =
      typeof getLastMessageId === 'undefined' ? resolveHelperMethod('getLastMessageId') : getLastMessageId;
    if (!getLast) throw new Error('酒馆助手未提供 getLastMessageId');
    return Math.max(0, Math.trunc(Number(getLast()))) + 1;
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
    const retrieve =
      typeof retrieveDisplayedMessage === 'undefined'
        ? resolveHelperMethod('retrieveDisplayedMessage')
        : retrieveDisplayedMessage;
    return String(retrieve?.(messageId)?.html?.() ?? '').trim();
  } catch {
    return '';
  }
}

function listHostMessageIds(): number[] {
  const ids = new Set<number>();
  for (const doc of hostDocuments()) {
    doc.querySelectorAll('.mes[mesid], .mes[data-message-index], .mes[data-message-id]').forEach(element => {
      const value =
        element.getAttribute('mesid') ??
        element.getAttribute('data-message-index') ??
        element.getAttribute('data-message-id');
      const id = Number(value);
      if (Number.isFinite(id) && id >= 0) ids.add(Math.trunc(id));
    });
  }
  if (!ids.size) {
    try {
      const read = typeof getChatMessages === 'undefined' ? resolveHelperMethod('getChatMessages') : getChatMessages;
      read?.('0-{{lastMessageId}}', { hide_state: 'all' }).forEach(message => ids.add(message.message_id));
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
  const helper = resolveTavernHelper();
  const tavernEventTypes = typeof tavern_events === 'undefined' ? helper?.tavern_events : tavern_events;
  const iframeEventTypes = typeof iframe_events === 'undefined' ? helper?.iframe_events : iframe_events;
  if (alias === 'message_sent' && tavernEventTypes) return tavernEventTypes.MESSAGE_SENT;
  if (alias === 'message_received' && tavernEventTypes) return tavernEventTypes.MESSAGE_RECEIVED;
  if (alias === 'message_deleted' && tavernEventTypes) return tavernEventTypes.MESSAGE_DELETED;
  if (alias === 'chat_changed' && tavernEventTypes) return tavernEventTypes.CHAT_CHANGED;
  if (alias === 'stream_full' && iframeEventTypes) return iframeEventTypes.STREAM_TOKEN_RECEIVED_FULLY;
  if (alias === 'generation_ended' && iframeEventTypes) return iframeEventTypes.GENERATION_ENDED;
  return null;
}

function subscribeToHostEvent(
  event: EventType,
  listener: (...args: unknown[]) => void,
): ReturnType<NonNullable<StorySessionDependencies['subscribe']>> | undefined {
  if (typeof eventOn !== 'undefined') return eventOn(event as any, listener as any);

  const eventSource = resolveSillyTavern()?.getContext?.().eventSource;
  if (!eventSource) return undefined;
  eventSource.on(event as any, listener as any);
  return {
    stop: () => eventSource.removeListener(event as any, listener as any),
  };
}

async function emitHostEvent(event: EventType, ...args: unknown[]): Promise<void> {
  if (typeof eventEmit !== 'undefined') {
    await (eventEmit as unknown as (event: EventType, ...data: unknown[]) => Promise<void>)(event, ...args);
    return;
  }

  const eventSource = resolveSillyTavern()?.getContext?.().eventSource;
  if (eventSource?.emit) await eventSource.emit(event, ...args);
}

function requireApi<T>(value: T | undefined, name: string): T {
  if (typeof value === 'undefined') throw new Error(`酒馆助手 API ${name} 不可用，请在酒馆聊天内打开 APP。`);
  return value;
}

export function createDefaultStorySession(): StorySession {
  const visibility = createHostFloorVisibilityController({ carrierMessageId, nextMessageId });
  const dependencies: StorySessionDependencies = {
    readMessages: range => {
      const read = typeof getChatMessages === 'undefined' ? resolveHelperMethod('getChatMessages') : getChatMessages;
      if (!read) return [];
      return normalizeMessages(read(range, { hide_state: 'all' }));
    },
    createMessages: async messages => {
      const create = requireApi(
        typeof createChatMessages === 'undefined' ? resolveHelperMethod('createChatMessages') : createChatMessages,
        'createChatMessages',
      );
      await create(
        messages.map(message => ({ ...message, is_hidden: false })),
        { refresh: 'affected' },
      );
    },
    persistAssistantMessage: async ({ message_id, message }) => {
      const create = requireApi(
        typeof createChatMessages === 'undefined' ? resolveHelperMethod('createChatMessages') : createChatMessages,
        'createChatMessages',
      );
      const set = requireApi(
        typeof setChatMessages === 'undefined' ? resolveHelperMethod('setChatMessages') : setChatMessages,
        'setChatMessages',
      );
      // 这里只清理明显无效的 UpdateVariable 外壳；不要在这里调用 Mvu.parseMessage。
      // MVUbeta 会在 MESSAGE_RECEIVED 中完成唯一一次解析、变量写回和 setChatMessages 回传。
      const sanitized = await sanitizeMvuUpdateBlocks(message);
      if (sanitized.removedBlocks > 0) {
        console.warn(`[APP story] 已移除 ${sanitized.removedBlocks} 个无效 MVU 更新块。`);
      }

      const plan = createAssistantTransportPlan(message_id, sanitized.text, '...', resolveAssistantName());
      await create([plan.staging], { refresh: 'affected' });

      const read = typeof getChatMessages === 'undefined' ? resolveHelperMethod('getChatMessages') : getChatMessages;
      const stagedMessage = read?.(message_id, { hide_state: 'all' }).find(item => item.message_id === message_id);
      if (!stagedMessage) {
        throw new Error(`助手正文载体楼层 ${message_id} 创建失败。`);
      }

      await set([plan.update], { refresh: 'affected' });

      const receivedEvent = eventName('message_received');
      if (!receivedEvent) return;
      try {
        await emitHostEvent(receivedEvent, message_id, 'extension');
      } catch (error) {
        // MVUbeta 的额外模型/变量回写不能否定已经保存的正文。
        console.warn('[APP story] MVUbeta 回写失败，正文已保留在同一楼层:', error);
      }
    },
    deleteMessages: async messageIds => {
      const remove = requireApi(
        typeof deleteChatMessages === 'undefined' ? resolveHelperMethod('deleteChatMessages') : deleteChatMessages,
        'deleteChatMessages',
      );
      await remove(messageIds, { refresh: 'none' });
    },
    generate: async config => {
      const run = requireApi(typeof generate === 'undefined' ? resolveHelperMethod('generate') : generate, 'generate');
      const result = await run(config);
      if (typeof result === 'string') return result;
      if (result && typeof result === 'object' && typeof result.content === 'string') return result.content;
      throw new Error('正文生成返回了不支持的工具调用结果。');
    },
    stopGeneration: generationId => {
      const stop =
        typeof stopGenerationById === 'undefined' ? resolveHelperMethod('stopGenerationById') : stopGenerationById;
      if (stop) stop(generationId);
    },
    carrierMessageId,
    nextMessageId,
    readHostHtml,
    formatDisplayedMessage: (text, messageId) => {
      const format =
        typeof formatAsDisplayedMessage === 'undefined'
          ? resolveHelperMethod('formatAsDisplayedMessage')
          : formatAsDisplayedMessage;
      if (!format) return text;
      return format(text, { message_id: messageId });
    },
    listHostMessageIds,
    reserveHostFloor: messageId => visibility.apply(messageId),
    replaceHostFloors: messageIds => visibility.replace(messageIds),
    clearHostFloors: messageIds => visibility.clear(messageIds),
    createGenerationId: () => `meituan-story-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    subscribe: (alias, listener) => {
      const name = eventName(alias);
      if (!name) return;
      return subscribeToHostEvent(name, listener);
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
