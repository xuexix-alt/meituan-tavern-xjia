import { describe, expect, it } from 'vitest';
import { SseParser } from './sse';

const encode = (text: string) => new TextEncoder().encode(text);

describe('SseParser', () => {
  it('parses an event split across byte chunks', () => {
    const parser = new SseParser();
    parser.push(encode('data: {"choices":[{"delta":{"con'));
    parser.push(encode('tent":"Hello"}}]}\n\n'));
    expect(parser.text).toBe('Hello');
  });

  it('handles multiple data frames in one chunk', () => {
    const parser = new SseParser();
    parser.push(encode('data: {"choices":[{"delta":{"content":"A"}}]}\n\ndata: {"choices":[{"delta":{"content":"B"}}]}\n\n'));
    expect(parser.text).toBe('AB');
    expect(parser.rawFrames).toHaveLength(2);
  });

  it('accumulates content and tool-call deltas', () => {
    const parser = new SseParser();
    parser.push(encode('data: {"choices":[{"delta":{"content":"Thinking ","tool_calls":[{"index":0,"id":"call-1","type":"function","function":{"name":"search","arguments":"{\\"q\\":"}}]}}]}\n\n'));
    parser.push(encode('data: {"choices":[{"delta":{"content":"done","tool_calls":[{"index":0,"function":{"arguments":"\\"x\\"}"}}]}}]}\n\n'));
    expect(parser.text).toBe('Thinking done');
    expect(parser.toolCalls[0]).toMatchObject({ id: 'call-1', function: { name: 'search', arguments: '{"q":"x"}' } });
  });

  it('recognizes data DONE and flushes the final partial buffer', () => {
    const parser = new SseParser();
    parser.push(encode('data: {"choices":[{"delta":{"content":"Final"},"finish_reason":"stop"}]}\n\ndata: [DONE]'));
    parser.finish();
    expect(parser.text).toBe('Final');
    expect(parser.finishReason).toBe('stop');
    expect(parser.done).toBe(true);
  });

  it('retains malformed frames as diagnostic errors without crashing', () => {
    const parser = new SseParser();
    parser.push(encode('data: {broken}\n\ndata: {"choices":[{"delta":{"content":"ok"}}]}\n\n'));
    expect(parser.errors).toHaveLength(1);
    expect(parser.rawFrames[0]).toBe('{broken}');
    expect(parser.text).toBe('ok');
  });
});
