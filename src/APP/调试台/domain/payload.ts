import { z } from 'zod';
import type { ChatMessage, GenerationSettings, MessageRole, PromptDraft } from './chat';

const messageRoles = ['system', 'user', 'assistant', 'tool'] as const satisfies readonly MessageRole[];
export const RESERVED_PAYLOAD_FIELDS = new Set([
  'model',
  'messages',
  'stream',
  'temperature',
  'top_p',
  'max_tokens',
  'stop',
]);

const rawMessageSchema = z.object({
  role: z.enum(messageRoles),
  content: z.string(),
  tool_call_id: z.string().optional(),
});

const rawPayloadSchema = z
  .object({
    model: z.string().min(1),
    messages: z.array(rawMessageSchema).min(1),
    stream: z.boolean().optional(),
    temperature: z.number().finite().optional(),
    top_p: z.number().finite().optional(),
    max_tokens: z.number().finite().optional(),
    stop: z.array(z.string()).optional(),
  })
  .passthrough();

export interface ChatCompletionPayload {
  model: string;
  messages: Array<{
    role: MessageRole;
    content: string;
    tool_call_id?: string;
  }>;
  stream: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stop: string[];
  [field: string]: unknown;
}

export type RawImportResult =
  | { success: true; draft: PromptDraft }
  | { success: false; error: string };

export function buildPayload(draft: PromptDraft): ChatCompletionPayload {
  for (const field of Object.keys(draft.generation.additional)) {
    if (RESERVED_PAYLOAD_FIELDS.has(field)) {
      throw new Error(`附加参数“${field}”是保留字段。`);
    }
  }

  const payload: ChatCompletionPayload = {
    model: draft.model,
    messages: draft.messages.map(toWireMessage),
    stream: draft.generation.stream,
    stop: draft.generation.stop,
  };

  copyDefinedGenerationSettings(payload, draft.generation);
  Object.assign(payload, draft.generation.additional);
  return payload;
}

export function importRawPayload(text: string): RawImportResult {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(text);
  } catch {
    return { success: false, error: '请求 JSON 格式无效。' };
  }

  const parsedPayload = rawPayloadSchema.safeParse(parsedJson);
  if (!parsedPayload.success) {
    return { success: false, error: '请求内容不符合 OpenAI 兼容格式。' };
  }

  const additional: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(parsedPayload.data)) {
    if (!RESERVED_PAYLOAD_FIELDS.has(field)) additional[field] = value;
  }

  return {
    success: true,
    draft: {
      model: parsedPayload.data.model,
      messages: parsedPayload.data.messages.map((message) => ({
        id: crypto.randomUUID(),
        role: message.role,
        content: message.content,
        ...(message.role === 'tool' && message.tool_call_id !== undefined
          ? { tool_call_id: message.tool_call_id }
          : {}),
        collapsed: false,
      })),
      generation: {
        stream: parsedPayload.data.stream ?? false,
        ...(parsedPayload.data.temperature === undefined ? {} : { temperature: parsedPayload.data.temperature }),
        ...(parsedPayload.data.top_p === undefined ? {} : { top_p: parsedPayload.data.top_p }),
        ...(parsedPayload.data.max_tokens === undefined ? {} : { max_tokens: parsedPayload.data.max_tokens }),
        stop: parsedPayload.data.stop ?? [],
        additional,
      },
    },
  };
}

function toWireMessage(message: ChatMessage): ChatCompletionPayload['messages'][number] {
  return {
    role: message.role,
    content: message.content,
    ...(message.role === 'tool' && message.tool_call_id !== undefined
      ? { tool_call_id: message.tool_call_id }
      : {}),
  };
}

function copyDefinedGenerationSettings(payload: ChatCompletionPayload, generation: GenerationSettings): void {
  if (generation.temperature !== undefined) payload.temperature = generation.temperature;
  if (generation.top_p !== undefined) payload.top_p = generation.top_p;
  if (generation.max_tokens !== undefined) payload.max_tokens = generation.max_tokens;
}
