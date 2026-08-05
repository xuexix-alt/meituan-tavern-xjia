import type { ConnectionSettings } from '../storage/localStore';
import { SseParser, type AccumulatedToolCall, type SseUsage } from './sse';

export interface ChatRunSnapshot {
  text: string;
  rawFrames: string[];
  toolCalls: AccumulatedToolCall[];
  finishReason?: string;
  usage?: SseUsage;
  parserErrors: string[];
}

export interface ChatRunResult extends ChatRunSnapshot {
  httpStatus: number;
  requestId?: string;
}

export class ChatApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: string,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ChatApiError';
  }
}

function providerHeaders(connection: ConnectionSettings): HeadersInit {
  return {
    'x-provider-base-url': connection.baseUrl,
    'x-provider-api-key': connection.apiKey,
  };
}

export async function listModels(connection: ConnectionSettings): Promise<string[]> {
  const response = await fetch('/api/models', { headers: providerHeaders(connection) });
  if (!response.ok) throw new Error(await readError(response));

  const json: unknown = await response.json();
  const candidates = Array.isArray(json)
    ? json
    : json && typeof json === 'object' && Array.isArray((json as { data?: unknown }).data)
      ? (json as { data: unknown[] }).data
      : [];

  return [...new Set(candidates.flatMap(modelId))].sort((left, right) => left.localeCompare(right));
}

export async function runChat(
  connection: ConnectionSettings,
  payload: Record<string, unknown>,
  onUpdate: (snapshot: ChatRunSnapshot) => void,
  signal: AbortSignal,
): Promise<ChatRunResult> {
  const response = await fetch('/api/chat/completions', {
    method: 'POST',
    headers: { ...providerHeaders(connection), 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  const requestId = response.headers.get('x-request-id')
    ?? response.headers.get('request-id')
    ?? response.headers.get('openai-request-id')
    ?? undefined;

  if (!response.ok) {
    const body = await response.text();
    let message = body || `请求失败，HTTP 状态码 ${response.status}。`;
    try {
      const parsed = JSON.parse(body) as { error?: { message?: string }; message?: string };
      message = parsed.error?.message ?? parsed.message ?? message;
    } catch {
      // Preserve the upstream text body when it is not JSON.
    }
    throw new ChatApiError(message, response.status, body, requestId);
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType.includes('text/event-stream')) {
    if (!response.body) throw new ChatApiError('流式响应没有内容。', response.status, '', requestId);
    const parser = new SseParser((current) => onUpdate(snapshotFromParser(current)));
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.push(value);
    }
    parser.finish();
    const snapshot = snapshotFromParser(parser);
    onUpdate(snapshot);
    return { ...snapshot, httpStatus: response.status, requestId };
  }

  const raw = await response.text();
  let json: ChatJsonResponse;
  try {
    json = JSON.parse(raw) as ChatJsonResponse;
  } catch {
    throw new ChatApiError('接口返回了无效的 JSON。', response.status, raw, requestId);
  }
  const choice = json.choices?.[0];
  const content = choice?.message?.content;
  const snapshot: ChatRunSnapshot = {
    text: typeof content === 'string' ? content : content == null ? '' : JSON.stringify(content, null, 2),
    rawFrames: [raw],
    toolCalls: normalizeToolCalls(choice?.message?.tool_calls),
    finishReason: typeof choice?.finish_reason === 'string' ? choice.finish_reason : undefined,
    usage: json.usage,
    parserErrors: [],
  };
  onUpdate(snapshot);
  return { ...snapshot, httpStatus: response.status, requestId };
}

function modelId(value: unknown): string[] {
  if (typeof value === 'string' && value) return [value];
  if (value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string') {
    return [(value as { id: string }).id];
  }
  return [];
}

async function readError(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return `请求失败，HTTP 状态码 ${response.status}。`;
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string }; message?: string };
    return parsed.error?.message ?? parsed.message ?? text;
  } catch {
    return text;
  }
}

function snapshotFromParser(parser: SseParser): ChatRunSnapshot {
  return {
    text: parser.text,
    rawFrames: [...parser.rawFrames],
    toolCalls: parser.toolCalls.map((call) => ({ ...call, function: { ...call.function } })),
    finishReason: parser.finishReason,
    usage: parser.usage,
    parserErrors: [...parser.errors],
  };
}

function normalizeToolCalls(value: unknown): AccumulatedToolCall[] {
  if (!Array.isArray(value)) return [];
  return value.map((call, index) => {
    const item = call && typeof call === 'object' ? call as Record<string, unknown> : {};
    const fn = item.function && typeof item.function === 'object' ? item.function as Record<string, unknown> : {};
    return {
      index,
      ...(typeof item.id === 'string' ? { id: item.id } : {}),
      ...(typeof item.type === 'string' ? { type: item.type } : {}),
      function: {
        ...(typeof fn.name === 'string' ? { name: fn.name } : {}),
        arguments: typeof fn.arguments === 'string' ? fn.arguments : '',
      },
    };
  });
}

interface ChatJsonResponse {
  choices?: Array<{
    message?: { content?: unknown; tool_calls?: unknown };
    finish_reason?: unknown;
  }>;
  usage?: SseUsage;
}
