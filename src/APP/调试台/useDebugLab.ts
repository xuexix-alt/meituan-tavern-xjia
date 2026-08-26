import { computed, ref, watch } from 'vue';
import type { GenerationSettings, PromptDraft } from './domain/chat';
import { buildPayload, importRawPayload } from './domain/payload';
import {
  HISTORY_LIMIT,
  cloneSerializable,
  loadWorkspace,
  sanitizeHistoryEntry,
  saveWorkspace,
  toPromptPreset,
  type ConnectionSettings,
  type PromptPreset,
  type RequestHistory,
  type SendMode,
  type WorkspaceState,
} from './storage/localStore';
import { applyMacroToPayload, resolveMacros } from './domain/macros';
import { exportPlaygroundConfig, importPlaygroundConfig } from './domain/playgroundConfig';
import { ChatApiError, runChat, type ChatRunSnapshot } from './api/client';
import { checkTavernAvailable, runTavernChat, stopTavernGeneration } from './api/tavern';
import { ingestShopResponse } from '../services/shopGeneration';

export type WorkArea = 'connection' | 'compose' | 'inspect';

export type ChatRunStatus = 'idle' | 'sending' | 'streaming' | 'success' | 'error' | 'cancelled';

export interface ChatRunState extends ChatRunSnapshot {
  runId: number;
  status: ChatRunStatus;
  durationMs: number;
  httpStatus?: number;
  requestId?: string;
  error?: string;
  errorBody?: string;
}

const emptySnapshot: ChatRunSnapshot = { text: '', rawFrames: [], toolCalls: [], parserErrors: [] };

export function useDebugLab() {
  const workspace = ref<WorkspaceState>(loadWorkspace());
  const rawText = ref(JSON.stringify(buildPayload(workspace.value.draft), null, 2));
  const isRawDirty = ref(false);
  const activeArea = ref<WorkArea>('compose');
  const importError = ref('');

  const chatState = ref<ChatRunState>({ runId: 0, status: 'idle', durationMs: 0, ...emptySnapshot });
  let controller: AbortController | null = null;
  let startedAt = 0;
  let runIdSeq = 0;
  const pendingPayload = ref<{ payload: Record<string, unknown>; connection: ConnectionSettings } | null>(null);
  const recordedRunId = ref(0);

  // 发送方式：tavern = 酒馆生成（generateRaw）；direct = 直连 API（代理逻辑搬进浏览器）
  // 默认酒馆生成，仅显式存有 direct 时才使用直连
  const sendMode = ref<SendMode>(workspace.value.sendMode === 'direct' ? 'direct' : 'tavern');
  const tavernAvailable = ref(false);
  const tavernError = ref('');
  let tavernRunId: string | null = null;

  const running = computed(() => chatState.value.status === 'sending' || chatState.value.status === 'streaming');

  function ingestResponse(text: string): void {
    try {
      ingestShopResponse(text);
    } catch (error) {
      console.warn('[调试台] 店铺响应解析或保存失败:', error);
    }
  }

  function checkTavern(): boolean {
    const result = checkTavernAvailable();
    tavernAvailable.value = result.available;
    tavernError.value = result.error ?? '';
    return result.available;
  }

  function setSendMode(mode: SendMode) {
    sendMode.value = mode;
    workspace.value = { ...workspace.value, sendMode: mode };
    if (mode === 'tavern') checkTavern();
  }

  // 初始时若上次选择了酒馆模式，先检查一次可用性。
  if (sendMode.value === 'tavern') checkTavern();

  // 持久化到 localStorage（与原调试台相同存储键）
  watch(workspace, state => saveWorkspace(state), { deep: true });

  // 原始 JSON 与结构化草稿保持同步（仅在未手动编辑原始 JSON 时）
  watch(
    () => workspace.value.draft,
    () => {
      if (!isRawDirty.value) rawText.value = JSON.stringify(buildPayload(workspace.value.draft), null, 2);
    },
    { deep: true },
  );

  // 请求耗时计时
  watch(
    () => chatState.value.status,
    (status, _previous, onCleanup) => {
      if (status !== 'sending' && status !== 'streaming') return;
      const timer = window.setInterval(() => {
        chatState.value = {
          ...chatState.value,
          durationMs: Math.max(chatState.value.durationMs, Date.now() - startedAt),
        };
      }, 100);
      onCleanup(() => window.clearInterval(timer));
    },
  );

  // 请求结束后写入历史（成功 / 错误 / 取消）
  watch([() => chatState.value.status, () => chatState.value.runId], () => {
    const status = chatState.value.status;
    if (!['success', 'error', 'cancelled'].includes(status)) return;
    if (!pendingPayload.value || recordedRunId.value === chatState.value.runId) return;
    recordedRunId.value = chatState.value.runId;
    const pending = pendingPayload.value;
    const entry = sanitizeHistoryEntry({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      model: typeof pending.payload.model === 'string' ? pending.payload.model : pending.connection.model,
      baseUrl: pending.connection.baseUrl,
      status: status as RequestHistory['status'],
      durationMs: chatState.value.durationMs,
      payload: cloneSerializable(pending.payload),
      responseText: chatState.value.text,
      requestId: chatState.value.requestId,
      httpStatus: chatState.value.httpStatus,
      error: chatState.value.error,
    } as RequestHistory);
    workspace.value = { ...workspace.value, history: [entry, ...workspace.value.history].slice(0, HISTORY_LIMIT) };
  });

  const updateDraft = (draft: PromptDraft) => {
    workspace.value = { ...workspace.value, draft };
  };

  const updateConnection = (connection: ConnectionSettings) => {
    workspace.value = {
      ...workspace.value,
      connection,
      draft: { ...workspace.value.draft, model: connection.model },
    };
  };

  const updateGeneration = (generation: GenerationSettings) => {
    updateDraft({ ...workspace.value.draft, generation });
  };

  const applyRawDraft = (draft: PromptDraft) => {
    workspace.value = {
      ...workspace.value,
      connection: { ...workspace.value.connection, model: draft.model },
      draft,
    };
    rawText.value = JSON.stringify(buildPayload(draft), null, 2);
    isRawDirty.value = false;
  };

  const rebuildRaw = () => {
    if (isRawDirty.value && !window.confirm('放弃尚未同步的原始 JSON 修改吗？')) return;
    rawText.value = JSON.stringify(buildPayload(workspace.value.draft), null, 2);
    isRawDirty.value = false;
  };

  const runPayload = (payload: Record<string, unknown>, connection = workspace.value.connection) => {
    pendingPayload.value = { payload: cloneSerializable(payload), connection: { ...connection } };
    if (sendMode.value === 'tavern') void sendTavern(payload);
    else void send(connection, payload);
  };

  const sendStructured = () => {
    const resolved = resolveMacros(workspace.value.draft, workspace.value.macroName, workspace.value.macroInput);
    runPayload(buildPayload(resolved) as Record<string, unknown>);
  };

  const sendRaw = () => {
    try {
      const payload = JSON.parse(rawText.value) as Record<string, unknown>;
      runPayload(applyMacroToPayload(payload, workspace.value.macroName, workspace.value.macroInput));
    } catch {
      // RawRequestPanel 在 JSON 无效时禁用发送按钮。
    }
  };

  const importWorkspaceFile = async (file: File) => {
    importError.value = '';
    try {
      const result = importPlaygroundConfig(await file.text());
      if (!result.success) {
        importError.value = result.error;
        return;
      }
      const { config } = result;
      workspace.value = {
        ...workspace.value,
        connection: {
          ...workspace.value.connection,
          ...(config.baseUrl === undefined ? {} : { baseUrl: config.baseUrl }),
          model: config.draft.model,
        },
        draft: config.draft,
        ...(config.macroName === undefined ? {} : { macroName: config.macroName }),
        ...(config.appendReply === undefined ? {} : { appendReply: config.appendReply }),
      };
      rawText.value = JSON.stringify(buildPayload(config.draft), null, 2);
      isRawDirty.value = false;
    } catch {
      importError.value = '无法读取这个 JSON 文件。';
    }
  };

  const exportWorkspaceFile = () => {
    const config = exportPlaygroundConfig({
      baseUrl: workspace.value.connection.baseUrl,
      draft: workspace.value.draft,
      macroName: workspace.value.macroName,
      appendReply: workspace.value.appendReply,
    });
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'prompt-playground.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const replaceDraft = (draft: PromptDraft, baseUrl = workspace.value.connection.baseUrl) => {
    workspace.value = {
      ...workspace.value,
      connection: { ...workspace.value.connection, baseUrl, model: draft.model },
      draft,
    };
    rawText.value = JSON.stringify(buildPayload(draft), null, 2);
    isRawDirty.value = false;
  };

  const savePreset = (name: string) => {
    const preset = toPromptPreset(name, workspace.value.draft, workspace.value.connection);
    workspace.value = { ...workspace.value, presets: [preset, ...workspace.value.presets] };
  };

  const loadPreset = (preset: PromptPreset) => replaceDraft(cloneSerializable(preset.draft), preset.baseUrl);

  const copyPreset = (preset: PromptPreset) => {
    const now = new Date().toISOString();
    const copy: PromptPreset = {
      ...cloneSerializable(preset),
      id: crypto.randomUUID(),
      name: `${preset.name} 副本`,
      createdAt: now,
      updatedAt: now,
    };
    workspace.value = { ...workspace.value, presets: [copy, ...workspace.value.presets] };
  };

  const deletePreset = (id: string) => {
    workspace.value = { ...workspace.value, presets: workspace.value.presets.filter(preset => preset.id !== id) };
  };

  const deleteHistory = (id: string) => {
    workspace.value = { ...workspace.value, history: workspace.value.history.filter(entry => entry.id !== id) };
  };

  const loadHistory = (entry: RequestHistory) => {
    const imported = importRawPayload(JSON.stringify(entry.payload));
    if (imported.success) replaceDraft(imported.draft, entry.baseUrl ?? workspace.value.connection.baseUrl);
  };

  const resendHistory = (entry: RequestHistory) => {
    const connection = {
      ...workspace.value.connection,
      baseUrl: entry.baseUrl ?? workspace.value.connection.baseUrl,
      model: entry.model,
    };
    workspace.value = { ...workspace.value, connection };
    runPayload(cloneSerializable(entry.payload), connection);
  };

  const send = async (connection: ConnectionSettings, payload: Record<string, unknown>) => {
    controller?.abort();
    const ctrl = new AbortController();
    controller = ctrl;
    const runId = ++runIdSeq;
    startedAt = Date.now();
    chatState.value = { runId, status: 'sending', durationMs: 0, ...emptySnapshot };

    try {
      const result = await runChat(
        connection,
        payload,
        snapshot => {
          if (chatState.value.runId === runId) {
            chatState.value = {
              ...chatState.value,
              ...snapshot,
              status: 'streaming',
              durationMs: Date.now() - startedAt,
            };
          }
        },
        ctrl.signal,
      );
      if (chatState.value.runId === runId) {
        ingestResponse(result.text);
        chatState.value = {
          ...chatState.value,
          ...result,
          status: 'success',
          durationMs: Date.now() - startedAt,
        };
      }
    } catch (error) {
      if (ctrl.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
        if (chatState.value.runId === runId) {
          chatState.value = {
            ...chatState.value,
            status: 'cancelled',
            durationMs: Date.now() - startedAt,
          };
        }
      } else {
        const apiError = error instanceof ChatApiError ? error : undefined;
        if (chatState.value.runId === runId) {
          chatState.value = {
            ...chatState.value,
            status: 'error',
            durationMs: Date.now() - startedAt,
            error: error instanceof Error ? error.message : '请求失败。',
            errorBody: apiError?.body,
            httpStatus: apiError?.status,
            requestId: apiError?.requestId,
          };
        }
      }
    } finally {
      if (controller === ctrl) controller = null;
    }
  };

  const sendTavern = async (payload: Record<string, unknown>) => {
    const runId = ++runIdSeq;
    startedAt = Date.now();
    chatState.value = { runId, status: 'sending', durationMs: 0, ...emptySnapshot };

    const generationId = crypto.randomUUID();
    tavernRunId = generationId;
    try {
      const result = await runTavernChat(payload, generationId);
      if (chatState.value.runId === runId && chatState.value.status !== 'cancelled') {
        ingestResponse(result.text);
        chatState.value = {
          ...chatState.value,
          status: 'success',
          durationMs: Date.now() - startedAt,
          text: result.text,
          rawFrames: [result.text],
          finishReason: 'stop',
        };
      }
    } catch (error) {
      if (chatState.value.runId === runId && chatState.value.status !== 'cancelled') {
        chatState.value = {
          ...chatState.value,
          status: 'error',
          durationMs: Date.now() - startedAt,
          error: error instanceof Error ? error.message : '酒馆生成失败。',
        };
      }
    } finally {
      if (tavernRunId === generationId) tavernRunId = null;
    }
  };

  const cancel = () => {
    if (sendMode.value === 'tavern') {
      if (tavernRunId) {
        stopTavernGeneration(tavernRunId);
        tavernRunId = null;
      }
      if (chatState.value.status === 'sending' || chatState.value.status === 'streaming') {
        chatState.value = {
          ...chatState.value,
          status: 'cancelled',
          durationMs: Date.now() - startedAt,
        };
      }
      return;
    }
    controller?.abort();
  };

  return {
    workspace,
    rawText,
    isRawDirty,
    activeArea,
    importError,
    chatState,
    running,
    sendMode,
    setSendMode,
    tavernAvailable,
    tavernError,
    checkTavern,
    cancel,
    updateDraft,
    updateConnection,
    updateGeneration,
    applyRawDraft,
    rebuildRaw,
    sendStructured,
    sendRaw,
    importWorkspaceFile,
    exportWorkspaceFile,
    savePreset,
    loadPreset,
    copyPreset,
    deletePreset,
    loadHistory,
    resendHistory,
    deleteHistory,
  };
}
