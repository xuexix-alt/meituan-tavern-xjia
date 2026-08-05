import { computed, ref } from 'vue';
import { buildStoryTranscript } from './storyTranscript';
import type { StoryChatMessage, StorySession, StoryStatus, StorySubmitResult, StoryTranscriptItem } from './storyTypes';

type StopHandle = { stop: () => void } | (() => void) | void;

export interface StorySessionDependencies {
  readMessages: (range: string) => StoryChatMessage[];
  createMessages: (messages: Array<{ role: 'user'; message: string }>) => Promise<void>;
  persistAssistantMessage: (message: { message_id: number; message: string }) => Promise<void>;
  deleteMessages: (messageIds: number[]) => Promise<void>;
  generate: (config: { user_input: string; should_stream: true; generation_id: string }) => Promise<string>;
  stopGeneration: (generationId: string) => void;
  carrierMessageId: () => number | null;
  nextMessageId: () => number;
  readHostHtml: (messageId: number) => string;
  formatDisplayedMessage: (text: string, messageId: number) => string;
  listHostMessageIds: () => number[];
  reserveHostFloor: (messageId: number) => void;
  replaceHostFloors: (messageIds: number[]) => void;
  clearHostFloors: (messageIds: number[]) => void;
  createGenerationId: () => string;
  subscribe?: (event: string, listener: (...args: unknown[]) => void) => StopHandle;
}

const BUSY_STATUSES = new Set<StoryStatus>(['preparing', 'streaming', 'persisting']);

function stopHandle(handle: StopHandle): () => void {
  if (typeof handle === 'function') return handle;
  if (handle && typeof handle.stop === 'function') return () => handle.stop();
  return () => undefined;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createStorySession(dependencies: StorySessionDependencies): StorySession {
  const baseItems = ref<StoryTranscriptItem[]>([]);
  const composerText = ref('');
  const streamingText = ref('');
  const status = ref<StoryStatus>('idle');
  const error = ref('');
  const activeGenerationId = ref<string | null>(null);
  const failedPrompt = ref('');
  const failedUserMessageId = ref<number | null>(null);
  const failedAssistantMessageId = ref<number | null>(null);
  const cancelledGenerationIds = new Set<string>();
  const stops: Array<() => void> = [];
  let bound = false;

  const busy = computed(() => BUSY_STATUSES.has(status.value));
  const canRetry = computed(() => status.value === 'error' && !busy.value && Boolean(failedPrompt.value.trim()));
  const latestAssistant = computed(
    () => [...baseItems.value].reverse().find(item => item.role === 'assistant') ?? null,
  );
  const streamingItem = computed<StoryTranscriptItem | null>(() => {
    if (!streamingText.value) return null;
    return {
      messageId: dependencies.nextMessageId(),
      role: 'assistant',
      raw: streamingText.value,
      preview: streamingText.value
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100),
      finalHtml: '',
      hidden: false,
      isStreaming: true,
      isLatest: true,
      canRollback: false,
      canRegenerate: false,
      options: [],
    };
  });
  const items = computed(() => {
    const transient = streamingItem.value;
    return transient ? [...baseItems.value, transient] : baseItems.value;
  });

  function readAllMessages(): StoryChatMessage[] {
    return dependencies.readMessages('0-{{lastMessageId}}');
  }

  function findFailedUserMessage(prompt: string): StoryChatMessage | null {
    const carrier = dependencies.carrierMessageId();
    const messages = readAllMessages()
      .filter(message => message.role === 'user' && message.message_id > 0 && message.message_id !== carrier)
      .sort((a, b) => a.message_id - b.message_id);
    const tracked =
      failedUserMessageId.value == null
        ? null
        : (messages.find(message => message.message_id === failedUserMessageId.value) ?? null);
    return tracked ?? [...messages].reverse().find(message => message.message.trim() === prompt) ?? null;
  }

  function refresh(_reason = 'manual'): void {
    if (_reason === 'chat_changed') {
      failedPrompt.value = '';
      failedUserMessageId.value = null;
      failedAssistantMessageId.value = null;
    }
    try {
      const messages = readAllMessages();
      baseItems.value = buildStoryTranscript(messages, dependencies);
    } catch (caught) {
      console.warn('[APP story] 刷新正文快照失败，保留当前内容:', caught);
      return;
    }
    try {
      dependencies.replaceHostFloors(dependencies.listHostMessageIds());
    } catch (caught) {
      console.warn('[APP story] 同步宿主楼层可见性失败:', caught);
    }
  }

  function updateStreamingText(text: string, generationId?: string): void {
    if (!activeGenerationId.value) return;
    if (generationId && generationId !== activeGenerationId.value) return;
    streamingText.value = String(text ?? '');
  }

  async function persistAssistant(prompt: string, generationId: string): Promise<void> {
    status.value = 'streaming';
    const generatedResponse = await dependencies.generate({
      user_input: prompt,
      should_stream: true,
      generation_id: generationId,
    });
    const response = String(generatedResponse ?? '').trim() ? String(generatedResponse) : streamingText.value;
    if (!response.trim()) {
      throw new Error('酒馆 API 未返回正文文本，也未收到流式正文。');
    }
    streamingText.value = response;
    status.value = 'persisting';
    const nextId = dependencies.nextMessageId();
    failedAssistantMessageId.value = nextId;
    dependencies.reserveHostFloor(nextId);
    await dependencies.persistAssistantMessage({ message_id: nextId, message: response });
    failedAssistantMessageId.value = null;
    streamingText.value = '';
    status.value = 'done';
    failedPrompt.value = '';
    failedUserMessageId.value = null;
    refresh('assistant_persisted');
  }

  async function submitPrompt(value?: string): Promise<StorySubmitResult> {
    const text = String(value ?? composerText.value).trim();
    if (!text) return { accepted: false, error: '请输入行动内容。' };
    if (busy.value) return { accepted: false, error: '正文正在生成，请稍候。' };

    const generationId = dependencies.createGenerationId();
    activeGenerationId.value = generationId;
    status.value = 'preparing';
    error.value = '';
    streamingText.value = '';
    failedPrompt.value = text;
    failedUserMessageId.value = null;
    failedAssistantMessageId.value = null;
    composerText.value = '';
    try {
      const nextId = dependencies.nextMessageId();
      failedUserMessageId.value = nextId;
      dependencies.reserveHostFloor(nextId);
      await dependencies.createMessages([{ role: 'user', message: text }]);
      refresh('user_submitted');
      void persistAssistant(text, generationId)
        .catch(caught => {
          if (cancelledGenerationIds.has(generationId)) {
            status.value = 'cancelled';
            cancelledGenerationIds.delete(generationId);
            return;
          }
          status.value = 'error';
          error.value = errorText(caught);
        })
        .finally(() => {
          if (activeGenerationId.value === generationId) activeGenerationId.value = null;
        });
      return { accepted: true };
    } catch (caught) {
      status.value = 'error';
      error.value = errorText(caught);
      if (activeGenerationId.value === generationId) activeGenerationId.value = null;
      return { accepted: false, error: error.value };
    }
  }

  function cancelGeneration(): void {
    const generationId = activeGenerationId.value;
    if (!generationId) return;
    cancelledGenerationIds.add(generationId);
    dependencies.stopGeneration(generationId);
    status.value = 'cancelled';
    streamingText.value = '';
  }

  async function retryLast(): Promise<boolean> {
    if (!canRetry.value) return false;
    const prompt = failedPrompt.value.trim();
    if (!prompt) return false;

    const generationId = dependencies.createGenerationId();
    activeGenerationId.value = generationId;
    status.value = 'preparing';
    error.value = '';
    streamingText.value = '';

    try {
      const failedAssistantId = failedAssistantMessageId.value;
      if (failedAssistantId != null && failedAssistantId !== dependencies.carrierMessageId()) {
        const assistantExists = readAllMessages().some(message => message.message_id === failedAssistantId);
        if (assistantExists) {
          await dependencies.deleteMessages([failedAssistantId]);
          dependencies.clearHostFloors([failedAssistantId]);
          refresh('retry_cleanup');
        }
        failedAssistantMessageId.value = null;
      }

      const existingUser = findFailedUserMessage(prompt);
      if (existingUser) {
        failedUserMessageId.value = existingUser.message_id;
      } else {
        const nextId = dependencies.nextMessageId();
        failedUserMessageId.value = nextId;
        dependencies.reserveHostFloor(nextId);
        await dependencies.createMessages([{ role: 'user', message: prompt }]);
        refresh('retry_user_submitted');
      }

      await persistAssistant(prompt, generationId);
      return true;
    } catch (caught) {
      status.value = 'error';
      error.value = errorText(caught);
      return false;
    } finally {
      if (activeGenerationId.value === generationId) activeGenerationId.value = null;
    }
  }

  async function regenerate(messageId?: number): Promise<boolean> {
    if (busy.value) return false;
    let allMessages: StoryChatMessage[];
    try {
      allMessages = readAllMessages().sort((a, b) => a.message_id - b.message_id);
    } catch (caught) {
      console.warn('[APP story] 读取正文历史失败，无法重新生成:', caught);
      return false;
    }
    const carrier = dependencies.carrierMessageId();
    const target =
      messageId == null
        ? [...allMessages].reverse().find(message => message.role === 'assistant' && message.message_id !== carrier)
        : allMessages.find(message => message.message_id === messageId && message.role === 'assistant');
    if (!target || target.message_id === carrier) return false;
    const promptMessage = [...allMessages]
      .reverse()
      .find(
        message => message.role === 'user' && message.message_id < target.message_id && message.message_id !== carrier,
      );
    if (!promptMessage) return false;
    const prompt = String(promptMessage.message ?? '').trim();
    if (!prompt) return false;

    const deleteIds = allMessages
      .map(message => message.message_id)
      .filter(id => id >= target.message_id && id > 0 && id !== carrier);
    const generationId = dependencies.createGenerationId();
    activeGenerationId.value = generationId;
    status.value = 'preparing';
    error.value = '';
    streamingText.value = '';
    failedPrompt.value = prompt;
    failedUserMessageId.value = promptMessage.message_id;
    failedAssistantMessageId.value = null;
    try {
      if (deleteIds.length) await dependencies.deleteMessages(deleteIds);
      refresh('regenerate_deleted');
      await persistAssistant(prompt, generationId);
      return true;
    } catch (caught) {
      if (cancelledGenerationIds.has(generationId)) {
        status.value = 'cancelled';
        cancelledGenerationIds.delete(generationId);
      } else {
        status.value = 'error';
        error.value = errorText(caught);
      }
      return false;
    } finally {
      if (activeGenerationId.value === generationId) activeGenerationId.value = null;
    }
  }

  async function rollbackFrom(messageId: number): Promise<boolean> {
    if (busy.value) return false;
    const carrier = dependencies.carrierMessageId();
    if (messageId <= 0 || messageId === carrier) return false;
    const ids = readAllMessages()
      .map(message => message.message_id)
      .filter(id => id >= messageId && id > 0 && id !== carrier)
      .sort((a, b) => a - b);
    if (!ids.length) return false;
    try {
      await dependencies.deleteMessages(ids);
      dependencies.clearHostFloors(ids);
      status.value = 'done';
      refresh('rollback');
      return true;
    } catch (caught) {
      status.value = 'error';
      error.value = errorText(caught);
      return false;
    }
  }

  function bind(): void {
    if (bound) return;
    bound = true;
    refresh('bind');
    if (!dependencies.subscribe) return;
    ['message_sent', 'message_received', 'message_deleted', 'chat_changed'].forEach(event => {
      stops.push(stopHandle(dependencies.subscribe?.(event, () => refresh(event))));
    });
    ['stream_full', 'generation_ended'].forEach(event => {
      stops.push(
        stopHandle(
          dependencies.subscribe?.(event, (...args: unknown[]) => {
            updateStreamingText(String(args[0] ?? ''), typeof args[1] === 'string' ? args[1] : undefined);
          }),
        ),
      );
    });
  }

  function dispose(): void {
    stops.splice(0).forEach(stop => stop());
    bound = false;
    const generationId = activeGenerationId.value;
    if (generationId) dependencies.stopGeneration(generationId);
    activeGenerationId.value = null;
    streamingText.value = '';
  }

  return {
    baseItems,
    items,
    composerText,
    streamingText,
    status,
    error,
    activeGenerationId,
    busy,
    canRetry,
    latestAssistant,
    refresh,
    submitPrompt,
    updateStreamingText,
    cancelGeneration,
    retryLast,
    regenerate,
    rollbackFrom,
    bind,
    dispose,
  };
}
