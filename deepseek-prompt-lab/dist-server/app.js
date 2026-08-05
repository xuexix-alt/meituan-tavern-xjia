import { Readable } from 'node:stream';
import express from 'express';
import { buildUpstreamUrl } from './upstream.js';
const forwardedResponseHeaders = new Set(['content-type', 'x-request-id', 'request-id']);
export function createApp(fetchImpl = fetch) {
    const app = express();
    app.use(express.json({ limit: '2mb' }));
    app.get('/api/health', (_request, response) => {
        response.status(200).json({ status: 'ok' });
    });
    app.get('/api/models', (request, response) => {
        void forward(request, response, 'models', fetchImpl);
    });
    app.post('/api/chat/completions', (request, response) => {
        void forward(request, response, 'chat/completions', fetchImpl);
    });
    return app;
}
async function forward(request, response, resource, fetchImpl) {
    const baseUrl = readHeader(request, 'x-provider-base-url');
    const apiKey = readHeader(request, 'x-provider-api-key');
    if (!baseUrl) {
        response.status(400).json({ error: { message: '必须填写接口地址。' } });
        return;
    }
    if (!apiKey) {
        response.status(401).json({ error: { message: '必须填写 API 密钥。' } });
        return;
    }
    let upstreamUrl;
    try {
        upstreamUrl = buildUpstreamUrl(baseUrl, resource);
    }
    catch (error) {
        response.status(400).json({ error: { message: error instanceof Error ? error.message : '接口地址无效。' } });
        return;
    }
    const controller = new AbortController();
    response.once('close', () => {
        if (!response.writableEnded)
            controller.abort();
    });
    try {
        const upstream = await fetchImpl(upstreamUrl, {
            method: resource === 'models' ? 'GET' : 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                ...(resource === 'models' ? {} : { 'Content-Type': 'application/json' }),
            },
            ...(resource === 'models' ? {} : { body: JSON.stringify(request.body) }),
            signal: controller.signal,
        });
        response.status(upstream.status);
        copyResponseHeaders(upstream.headers, response);
        if (!upstream.body) {
            response.end();
            return;
        }
        const contentType = upstream.headers.get('content-type') ?? '';
        if (contentType.toLowerCase().includes('text/event-stream')) {
            Readable.fromWeb(upstream.body).pipe(response);
            return;
        }
        const body = Buffer.from(await upstream.arrayBuffer());
        response.send(body);
    }
    catch (error) {
        if (controller.signal.aborted || response.headersSent) {
            if (!response.writableEnded)
                response.end();
            return;
        }
        response.status(502).json({
            error: { message: error instanceof Error ? error.message : '上游接口请求失败。' },
        });
    }
}
function readHeader(request, name) {
    const value = request.headers[name];
    return Array.isArray(value) ? value[0] : value;
}
function copyResponseHeaders(headers, response) {
    headers.forEach((value, name) => {
        const normalized = name.toLowerCase();
        if (forwardedResponseHeaders.has(normalized) || normalized.startsWith('x-ratelimit-')) {
            response.setHeader(name, value);
        }
    });
}
