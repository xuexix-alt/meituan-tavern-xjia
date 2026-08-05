import { generateFromDebugWorkspace } from '../调试台/api/workspaceGeneration';
import { createGenerationTask } from './generationTask';
import { ingestShopResponse } from './shopGeneration';

export const generationTask = createGenerationTask({
  generate: generateFromDebugWorkspace,
  ingest: ingestShopResponse,
  schedule: (callback, delayMs) => window.setTimeout(callback, delayMs),
  clearSchedule: handle => window.clearTimeout(handle as number),
});
