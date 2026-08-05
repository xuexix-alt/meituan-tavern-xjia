import { z } from 'zod';
import defaultConfig from '../assets/prompt-playground.default.json';
import type { ChatMessage, MessageRole, PromptDraft } from './chat';

const roleSchema = z.enum(['system', 'user', 'assistant', 'tool']);
const messageSchema = z.object({
  role: roleSchema,
  content: z.string(),
  tool_call_id: z.string().optional(),
});

const configSchema = z.object({
  baseUrl: z.string().optional(),
  model: z.string().min(1),
  temperature: z.number().finite().optional(),
  topP: z.number().finite().optional(),
  top_p: z.number().finite().optional(),
  maxTokens: z.number().finite().optional(),
  max_tokens: z.number().finite().optional(),
  stream: z.boolean().optional(),
  stop: z.array(z.string()).optional(),
  macroName: z.string().optional(),
  appendReply: z.boolean().optional(),
  messages: z.array(messageSchema).min(1),
}).passthrough();

export interface PromptPlaygroundConfig {
  baseUrl: string;
  model: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stream: boolean;
  stop?: string[];
  macroName: string;
  appendReply: boolean;
  messages: Array<{ role: MessageRole; content: string; tool_call_id?: string }>;
  [key: string]: unknown;
}

export interface ImportedPlaygroundConfig {
  baseUrl?: string;
  draft: PromptDraft;
  macroName?: string;
  appendReply?: boolean;
}

export function createDefaultPlaygroundConfig(): PromptPlaygroundConfig {
  return normalizeConfig(defaultConfig as unknown);
}

export function importPlaygroundConfig(text: string):
  | { success: true; config: ImportedPlaygroundConfig }
  | { success: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { success: false, error: '工作台 JSON 格式无效。' };
  }

  const result = configSchema.safeParse(parsed);
  if (!result.success) return { success: false, error: 'JSON 缺少有效的 model 或 messages。' };
  const config = result.data;
  return {
    success: true,
    config: {
      baseUrl: config.baseUrl,
      macroName: config.macroName,
      appendReply: config.appendReply,
      draft: draftFromConfig(config),
    },
  };
}

export function exportPlaygroundConfig(input: {
  baseUrl: string;
  draft: PromptDraft;
  macroName: string;
  appendReply: boolean;
}): PromptPlaygroundConfig {
  const secretFields = new Set(['authorization', 'apikey', 'api_key', 'x-provider-api-key']);
  const additional = Object.fromEntries(
    Object.entries(input.draft.generation.additional).filter(([key]) => !secretFields.has(key.toLowerCase())),
  );
  const payload = {
    baseUrl: input.baseUrl,
    model: input.draft.model,
    ...(input.draft.generation.temperature === undefined ? {} : { temperature: input.draft.generation.temperature }),
    ...(input.draft.generation.top_p === undefined ? {} : { topP: input.draft.generation.top_p }),
    ...(input.draft.generation.max_tokens === undefined ? {} : { maxTokens: input.draft.generation.max_tokens }),
    stream: input.draft.generation.stream,
    ...(input.draft.generation.stop.length === 0 ? {} : { stop: input.draft.generation.stop }),
    macroName: input.macroName,
    appendReply: input.appendReply,
    messages: input.draft.messages.map(({ role, content, tool_call_id }) => ({
      role,
      content,
      ...(tool_call_id === undefined ? {} : { tool_call_id }),
    })),
  } satisfies PromptPlaygroundConfig;
  return { ...payload, ...additional };
}

export function draftFromConfig(config: z.infer<typeof configSchema>): PromptDraft {
  return {
    model: config.model,
    messages: config.messages.map((message) => messageFromConfig(message)),
    generation: {
      stream: config.stream ?? false,
      ...(config.temperature === undefined ? {} : { temperature: config.temperature }),
      ...((config.topP ?? config.top_p) === undefined ? {} : { top_p: config.topP ?? config.top_p }),
      ...((config.maxTokens ?? config.max_tokens) === undefined ? {} : { max_tokens: config.maxTokens ?? config.max_tokens }),
      stop: config.stop ?? [],
      additional: Object.fromEntries(Object.entries(config).filter(([key]) => ![
        'baseUrl', 'model', 'temperature', 'topP', 'top_p', 'maxTokens', 'max_tokens', 'stream', 'stop',
        'macroName', 'appendReply', 'messages',
      ].includes(key))),
    },
  };
}

function normalizeConfig(value: unknown): PromptPlaygroundConfig {
  const parsed = configSchema.parse(value);
  return {
    baseUrl: parsed.baseUrl ?? 'https://api.deepseek.com',
    model: parsed.model,
    ...(parsed.temperature === undefined ? {} : { temperature: parsed.temperature }),
    ...(parsed.topP === undefined ? {} : { topP: parsed.topP }),
    ...(parsed.maxTokens === undefined ? {} : { maxTokens: parsed.maxTokens }),
    stream: parsed.stream ?? false,
    stop: parsed.stop ?? [],
    macroName: parsed.macroName ?? '',
    appendReply: parsed.appendReply ?? false,
    messages: parsed.messages,
  };
}

function messageFromConfig(message: z.infer<typeof messageSchema>): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: message.role,
    content: message.content,
    ...(message.tool_call_id === undefined ? {} : { tool_call_id: message.tool_call_id }),
    collapsed: false,
  };
}
