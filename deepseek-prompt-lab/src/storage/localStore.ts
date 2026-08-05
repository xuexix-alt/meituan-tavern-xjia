import { z } from 'zod';
import { createDefaultDraft, type PromptDraft } from '../domain/chat';
import { DEFAULT_MACRO_NAME } from '../domain/macros';
import { createDefaultPlaygroundConfig } from '../domain/playgroundConfig';

export const STORAGE_KEY = 'deepseek-prompt-lab.workspace.v1';
export const HISTORY_LIMIT = 30;

export interface ConnectionSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface PromptPreset {
  id: string;
  name: string;
  baseUrl: string;
  draft: PromptDraft;
  createdAt: string;
  updatedAt: string;
}

export type RequestStatus = 'success' | 'error' | 'cancelled';

export interface RequestHistory {
  id: string;
  timestamp: string;
  model: string;
  baseUrl?: string;
  status: RequestStatus;
  durationMs: number;
  payload: Record<string, unknown>;
  responseText: string;
  requestId?: string;
  httpStatus?: number;
  error?: string;
}

export interface WorkspaceState {
  version: 1;
  connection: ConnectionSettings;
  draft: PromptDraft;
  presets: PromptPreset[];
  history: RequestHistory[];
  macroName: string;
  appendReply: boolean;
  macroInput: string;
}

const messageSchema = z.object({
  id: z.string(),
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string(),
  tool_call_id: z.string().optional(),
  collapsed: z.boolean(),
});

const draftSchema = z.object({
  model: z.string(),
  messages: z.array(messageSchema).min(1),
  generation: z.object({
    stream: z.boolean(),
    temperature: z.number().optional(),
    top_p: z.number().optional(),
    max_tokens: z.number().optional(),
    stop: z.array(z.string()),
    additional: z.record(z.string(), z.unknown()),
  }),
});

const connectionSchema = z.object({
  baseUrl: z.string(),
  apiKey: z.string(),
  model: z.string(),
});

const presetSchema = z.object({
  id: z.string(),
  name: z.string(),
  baseUrl: z.string(),
  draft: draftSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const historySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  model: z.string(),
  baseUrl: z.string().optional(),
  status: z.enum(['success', 'error', 'cancelled']),
  durationMs: z.number(),
  payload: z.record(z.string(), z.unknown()),
  responseText: z.string(),
  requestId: z.string().optional(),
  httpStatus: z.number().optional(),
  error: z.string().optional(),
});

const workspaceSchema = z.object({
  version: z.literal(1),
  connection: connectionSchema,
  draft: draftSchema,
  presets: z.array(presetSchema),
  history: z.array(historySchema),
  macroName: z.string().optional().default(DEFAULT_MACRO_NAME),
  appendReply: z.boolean().optional().default(false),
  macroInput: z.string().optional().default(''),
});

const secretFieldNames = new Set(['authorization', 'apikey', 'api_key', 'x-provider-api-key']);

export function createDefaultWorkspace(): WorkspaceState {
  const defaults = createDefaultPlaygroundConfig();
  return {
    version: 1,
    connection: {
      baseUrl: defaults.baseUrl,
      apiKey: '',
      model: defaults.model,
    },
    draft: createDefaultDraft(),
    presets: [],
    history: [],
    macroName: defaults.macroName,
    appendReply: defaults.appendReply,
    macroInput: '',
  };
}

export function loadWorkspace(storage: Storage = localStorage): WorkspaceState {
  const stored = storage.getItem(STORAGE_KEY);
  if (!stored) return createDefaultWorkspace();

  try {
    const parsed = workspaceSchema.safeParse(JSON.parse(stored));
    if (!parsed.success) return createDefaultWorkspace();
    const normalized = normalizeWorkspace(parsed.data);
    if (!isLegacyBlankDraft(normalized.draft)) return normalized;

    const defaults = createDefaultWorkspace();
    return {
      ...normalized,
      connection: {
        ...normalized.connection,
        baseUrl: defaults.connection.baseUrl,
        model: defaults.connection.model,
      },
      draft: defaults.draft,
      macroName: defaults.macroName,
      appendReply: defaults.appendReply,
      macroInput: defaults.macroInput,
    };
  } catch {
    return createDefaultWorkspace();
  }
}

function isLegacyBlankDraft(draft: PromptDraft): boolean {
  return draft.model === 'deepseek-chat'
    && draft.messages.length === 2
    && draft.messages[0].role === 'system'
    && draft.messages[1].role === 'user'
    && draft.messages.every((message) => message.content === '')
    && draft.generation.stream === false
    && draft.generation.temperature === undefined
    && draft.generation.top_p === undefined
    && draft.generation.max_tokens === undefined
    && draft.generation.stop.length === 0
    && Object.keys(draft.generation.additional).length === 0;
}

export function saveWorkspace(state: WorkspaceState, storage: Storage = localStorage): WorkspaceState {
  const normalized = normalizeWorkspace(state);
  storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function toPromptPreset(
  name: string,
  draft: PromptDraft,
  connection: ConnectionSettings,
  now = new Date().toISOString(),
): PromptPreset {
  return {
    id: crypto.randomUUID(),
    name,
    baseUrl: connection.baseUrl,
    draft: structuredClone(draft),
    createdAt: now,
    updatedAt: now,
  };
}

export function sanitizeHistoryEntry(run: RequestHistory): RequestHistory {
  return sanitizeValue(run) as RequestHistory;
}

function normalizeWorkspace(state: WorkspaceState): WorkspaceState {
  const presets = state.presets.map(({ id, name, baseUrl, draft, createdAt, updatedAt }) => ({
    id,
    name,
    baseUrl,
    draft: structuredClone(draft),
    createdAt,
    updatedAt,
  }));
  const history = state.history
    .map(sanitizeHistoryEntry)
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, HISTORY_LIMIT);

  return {
    version: 1,
    connection: { ...state.connection },
    draft: structuredClone(state.draft),
    presets,
    history,
    macroName: state.macroName,
    appendReply: state.appendReply,
    macroInput: state.macroInput ?? '',
  };
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, child]) =>
      secretFieldNames.has(key.toLowerCase()) ? [] : [[key, sanitizeValue(child)]],
    ),
  );
}


