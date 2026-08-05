import { ReadableStream } from 'node:stream/web';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app';
import { buildUpstreamUrl } from './upstream';

const providerHeaders = {
  'x-provider-base-url': 'https://api.deepseek.com',
  'x-provider-api-key': 'sk-test',
};

describe('compatible API proxy', () => {
  it('joins a base URL with v1/models without duplicating v1', () => {
    expect(buildUpstreamUrl('https://api.deepseek.com', 'models')).toBe('https://api.deepseek.com/v1/models');
    expect(buildUpstreamUrl('https://example.com/openai/v1/', 'models')).toBe(
      'https://example.com/openai/v1/models',
    );
  });

  it('rejects non-http provider URLs', () => {
    expect(() => buildUpstreamUrl('file:///tmp/key', 'models')).toThrow(/http/i);
  });

  it('forwards bearer authorization and JSON chat payloads', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'x-request-id': 'req-1' },
      }),
    );
    const payload = { model: 'deepseek-chat', messages: [{ role: 'user', content: 'Hi' }] };

    const response = await request(createApp(fetchImpl as typeof fetch))
      .post('/api/chat/completions')
      .set(providerHeaders)
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ choices: [{ message: { content: 'ok' } }] });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.deepseek.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer sk-test', 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      }),
    );
    expect(response.headers['x-request-id']).toBe('req-1');
  });

  it('returns the upstream status and JSON error body', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ error: { message: 'Invalid key' } }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const response = await request(createApp(fetchImpl as typeof fetch))
      .get('/api/models')
      .set(providerHeaders);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: { message: 'Invalid key' } });
  });

  it('pipes a text/event-stream response without JSON conversion', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[]}\n\n'));
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    const fetchImpl = vi.fn(async () =>
      new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } }),
    );

    const response = await request(createApp(fetchImpl as typeof fetch))
      .post('/api/chat/completions')
      .set(providerHeaders)
      .send({ model: 'deepseek-chat', messages: [{ role: 'user', content: 'Hi' }], stream: true });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.text).toBe('data: {"choices":[]}\n\ndata: [DONE]\n\n');
  });

  it('rejects requests without a provider key', async () => {
    const fetchImpl = vi.fn();
    const response = await request(createApp(fetchImpl as typeof fetch))
      .get('/api/models')
      .set('x-provider-base-url', 'https://api.deepseek.com');

    expect(response.status).toBe(401);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
