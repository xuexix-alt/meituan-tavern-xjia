export interface AccumulatedToolCall {
  index: number;
  id?: string;
  type?: string;
  function: { name?: string; arguments: string };
}

export interface SseUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  [key: string]: unknown;
}

export class SseParser {
  text = '';
  rawFrames: string[] = [];
  errors: string[] = [];
  toolCalls: AccumulatedToolCall[] = [];
  finishReason?: string;
  usage?: SseUsage;
  done = false;

  private readonly decoder = new TextDecoder();
  private buffer = '';

  constructor(private readonly onUpdate?: (parser: SseParser) => void) {}

  push(chunk: Uint8Array | string): void {
    this.buffer += typeof chunk === 'string' ? chunk : this.decoder.decode(chunk, { stream: true });
    this.drainCompleteFrames();
  }

  finish(): void {
    this.buffer += this.decoder.decode();
    this.drainCompleteFrames();
    if (this.buffer.trim()) this.processFrame(this.buffer);
    this.buffer = '';
  }

  private drainCompleteFrames(): void {
    this.buffer = this.buffer.replace(/\r\n/g, '\n');
    let boundary = this.buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const frame = this.buffer.slice(0, boundary);
      this.buffer = this.buffer.slice(boundary + 2);
      this.processFrame(frame);
      boundary = this.buffer.indexOf('\n\n');
    }
  }

  private processFrame(frame: string): void {
    const data = frame
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).replace(/^ /, ''))
      .join('\n');
    if (!data) return;

    this.rawFrames.push(data);
    if (data.trim() === '[DONE]') {
      this.done = true;
      this.onUpdate?.(this);
      return;
    }

    try {
      const event = JSON.parse(data) as ChatChunk;
      this.accumulate(event);
    } catch (error) {
      this.errors.push(error instanceof Error ? error.message : 'Malformed SSE frame.');
    }
    this.onUpdate?.(this);
  }

  private accumulate(event: ChatChunk): void {
    if (event.usage) this.usage = event.usage;
    const choice = event.choices?.[0];
    if (!choice) return;
    if (typeof choice.delta?.content === 'string') this.text += choice.delta.content;
    if (typeof choice.finish_reason === 'string') this.finishReason = choice.finish_reason;

    for (const delta of choice.delta?.tool_calls ?? []) {
      const existing = this.toolCalls[delta.index] ?? { index: delta.index, function: { arguments: '' } };
      if (delta.id !== undefined) existing.id = delta.id;
      if (delta.type !== undefined) existing.type = delta.type;
      if (delta.function?.name !== undefined) existing.function.name = (existing.function.name ?? '') + delta.function.name;
      if (delta.function?.arguments !== undefined) existing.function.arguments += delta.function.arguments;
      this.toolCalls[delta.index] = existing;
    }
  }
}

interface ChatChunk {
  choices?: Array<{
    delta?: {
      content?: unknown;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason?: unknown;
  }>;
  usage?: SseUsage;
}
