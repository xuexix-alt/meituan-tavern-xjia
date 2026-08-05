import { buildPayload } from '../domain/payload';
import { resolveMacros } from '../domain/macros';
import type { WorkspaceState } from '../storage/localStore';

export function buildWorkspacePayload(workspace: WorkspaceState, userInput: string): Record<string, unknown> {
  const resolved = resolveMacros(workspace.draft, workspace.macroName, userInput);
  return buildPayload(resolved) as Record<string, unknown>;
}
