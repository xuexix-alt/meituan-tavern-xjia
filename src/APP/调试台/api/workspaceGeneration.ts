import { loadWorkspace, type SendMode } from '../storage/localStore';
import { runChat, type ChatRunSnapshot } from './client';
import { runTavernChat, stopTavernGeneration } from './tavern';
import { buildWorkspacePayload } from './workspacePayload';

export { buildWorkspacePayload } from './workspacePayload';

export interface WorkspaceGenerationOptions {
  signal?: AbortSignal;
  onUpdate?: (snapshot: ChatRunSnapshot) => void;
}

export interface WorkspaceGenerationResult {
  text: string;
  mode: SendMode;
  payload: Record<string, unknown>;
}

export async function generateFromDebugWorkspace(
  userInput: string,
  options: WorkspaceGenerationOptions = {},
): Promise<WorkspaceGenerationResult> {
  const workspace = loadWorkspace();
  const payload = buildWorkspacePayload(workspace, userInput);

  if (workspace.sendMode === 'tavern') {
    const generationId = crypto.randomUUID();
    const stop = () => stopTavernGeneration(generationId);
    if (options.signal?.aborted) {
      stop();
      throw new DOMException('请求已取消。', 'AbortError');
    }
    options.signal?.addEventListener('abort', stop, { once: true });
    try {
      const result = await runTavernChat(payload, generationId);
      if (options.signal?.aborted) throw new DOMException('请求已取消。', 'AbortError');
      return { text: result.text, mode: 'tavern', payload };
    } finally {
      options.signal?.removeEventListener('abort', stop);
    }
  }

  const signal = options.signal ?? new AbortController().signal;
  const result = await runChat(workspace.connection, payload, options.onUpdate ?? (() => undefined), signal);
  return { text: result.text, mode: 'direct', payload };
}
