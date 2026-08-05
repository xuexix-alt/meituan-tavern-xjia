import { computed, ref } from 'vue';

export type GenerationTaskStatus = 'idle' | 'running' | 'parsing' | 'success' | 'error' | 'cancelled';

export interface GenerationTaskState {
  id: string | null;
  label: string;
  status: GenerationTaskStatus;
  startedAt: number | null;
  parsedCount: number;
  packageCount: number;
  error: string | null;
}

type Generate = (
  input: string,
  options: { signal?: AbortSignal },
) => Promise<{ text: string; mode: 'tavern' | 'direct'; payload: Record<string, unknown> }>;
type Ingest = (text: string) => {
  parsedCount: number;
  savedCount: number;
  packageCount: number;
  shops: unknown[];
};
type TimerHandle = unknown;

export interface GenerationTaskDependencies {
  generate: Generate;
  ingest: Ingest;
  schedule: (callback: () => void, delayMs: number) => TimerHandle;
  clearSchedule: (handle: TimerHandle) => void;
}

const IDLE_STATE: GenerationTaskState = {
  id: null,
  label: '',
  status: 'idle',
  startedAt: null,
  parsedCount: 0,
  packageCount: 0,
  error: null,
};

function createTaskId(): string {
  return typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `generation-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createGenerationTask(dependencies: GenerationTaskDependencies) {
  const state = ref<GenerationTaskState>({ ...IDLE_STATE });
  const isBusy = computed(() => state.value.status === 'running' || state.value.status === 'parsing');
  let controller: AbortController | null = null;
  let dismissTimer: TimerHandle | null = null;

  function clearDismissTimer(): void {
    if (dismissTimer === null) return;
    dependencies.clearSchedule(dismissTimer);
    dismissTimer = null;
  }

  function dismiss(): void {
    if (isBusy.value) return;
    clearDismissTimer();
    state.value = { ...IDLE_STATE };
  }

  function scheduleDismiss(delayMs: number): void {
    clearDismissTimer();
    dismissTimer = dependencies.schedule(dismiss, delayMs);
  }

  async function start(input: string, label: string): Promise<boolean> {
    if (isBusy.value) return false;

    clearDismissTimer();
    const taskId = createTaskId();
    const activeController = new AbortController();
    controller = activeController;
    state.value = {
      id: taskId,
      label,
      status: 'running',
      startedAt: Date.now(),
      parsedCount: 0,
      packageCount: 0,
      error: null,
    };

    try {
      const result = await dependencies.generate(input, { signal: activeController.signal });
      if (activeController.signal.aborted) throw new DOMException('请求已取消。', 'AbortError');

      state.value = { ...state.value, status: 'parsing' };
      const ingestion = dependencies.ingest(result.text);
      if (ingestion.parsedCount === 0) {
        state.value = {
          ...state.value,
          status: 'error',
          error: '模型回复未解析出有效店铺，请检查调试台预设与回复格式。',
        };
        return true;
      }

      state.value = {
        ...state.value,
        status: 'success',
        parsedCount: ingestion.parsedCount,
        packageCount: ingestion.packageCount,
      };
      scheduleDismiss(8000);
    } catch (error) {
      if (activeController.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
        state.value = { ...state.value, status: 'cancelled', error: null };
        scheduleDismiss(1800);
      } else {
        console.error('[APP 后台生成] 请求失败:', error);
        state.value = { ...state.value, status: 'error', error: errorMessage(error) };
      }
    } finally {
      if (controller === activeController) controller = null;
    }
    return true;
  }

  function cancel(): void {
    if (!isBusy.value || !controller) return;
    controller.abort();
    state.value = { ...state.value, status: 'cancelled', error: null };
    scheduleDismiss(1800);
  }

  function dispose(): void {
    controller?.abort();
    controller = null;
    clearDismissTimer();
    state.value = { ...IDLE_STATE };
  }

  return { state, isBusy, start, cancel, dismiss, dispose };
}
