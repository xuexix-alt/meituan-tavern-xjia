import { expect, test, type Page } from '@playwright/test';

const jsonHeaders = { 'content-type': 'application/json', 'x-request-id': 'e2e-request' };

async function mockChat(page: Page, answer = 'Mock assistant response') {
  await page.route('**/api/chat/completions', (route) => route.fulfill({
    status: 200,
    headers: jsonHeaders,
    body: JSON.stringify({
      choices: [{ message: { content: answer }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 4, completion_tokens: 3, total_tokens: 7 },
    }),
  }));
}

test('edits raw JSON and sends a streaming-compatible request', async ({ page }) => {
  await page.route('**/api/chat/completions', (route) => route.fulfill({
    status: 200,
    headers: { 'content-type': 'text/event-stream', 'x-request-id': 'stream-e2e' },
    body: 'data: {"choices":[{"delta":{"content":"Streamed "}}]}\n\ndata: {"choices":[{"delta":{"content":"response"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
  }));
  await page.goto('/');
  await page.getByLabel('原始请求 JSON').fill('{"model":"deepseek-chat","messages":[{"role":"user","content":"Raw E2E"}],"stream":true}');
  await page.getByRole('button', { name: '应用到结构化编辑器' }).click();
  await page.getByRole('button', { name: '发送请求' }).click();

  await expect(page.getByText('Streamed response')).toBeVisible();
  await expect(page.getByText('成功').first()).toBeVisible();
});

test('imports and exports the playground JSON format', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('API 密钥', { exact: true }).fill('never-export-this');
  await page.getByLabel('选择工作台 JSON 文件').setInputFiles({
    name: 'prompt-playground.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      baseUrl: 'http://localhost:9000/v1',
      model: 'imported-model',
      temperature: 0.3,
      maxTokens: 512,
      stream: false,
      macroName: '{{input}}',
      appendReply: true,
      messages: [{ role: 'user', content: 'Imported through browser' }],
    })),
  });

  await expect(page.getByLabel('模型')).toHaveValue('imported-model');
  await expect(page.getByLabel('消息内容')).toHaveValue('Imported through browser');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 JSON' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const exported = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(exported).toMatchObject({
    baseUrl: 'http://localhost:9000/v1',
    model: 'imported-model',
    maxTokens: 512,
    macroName: '{{input}}',
    appendReply: true,
  });
  expect(JSON.stringify(exported)).not.toContain('never-export-this');
});

test('keeps manual model entry when model discovery fails', async ({ page }) => {
  await page.route('**/api/models', (route) => route.fulfill({
    status: 503,
    headers: jsonHeaders,
    body: JSON.stringify({ error: { message: 'Discovery unavailable' } }),
  }));
  await page.goto('/');
  await page.getByLabel('模型').fill('local-compatible-model');
  await page.getByRole('button', { name: '拉取模型列表' }).click();

  await expect(page.getByRole('alert')).toContainText('无法拉取模型');
  await expect(page.getByLabel('模型')).toHaveValue('local-compatible-model');
});

test('persists presets and sanitized history after reload', async ({ page }) => {
  await mockChat(page, 'Persisted answer');
  await page.goto('/');
  await page.getByLabel('API 密钥', { exact: true }).fill('browser-local-secret');
  await page.getByLabel('消息内容').nth(1).fill('Persistent request');
  await page.getByLabel('预设名称').fill('Persistence check');
  await page.getByRole('button', { name: '保存预设' }).click();
  await page.getByRole('button', { name: '发送请求' }).click();
  await expect(page.getByText('Persisted answer')).toBeVisible();
  await expect(page.getByText('Persistent request').first()).toBeVisible();
  await page.reload();

  await expect(page.getByText('Persistence check')).toBeVisible();
  await expect(page.getByText('Persistent request').first()).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('deepseek-prompt-lab.workspace.v1') ?? '{}'));
  expect(JSON.stringify(stored.presets)).not.toContain('browser-local-secret');
  expect(JSON.stringify(stored.history)).not.toContain('browser-local-secret');
});

test('cancels a request and keeps the current draft', async ({ page }) => {
  await page.route('**/api/chat/completions', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.fulfill({ status: 200, headers: jsonHeaders, body: JSON.stringify({ choices: [] }) }).catch(() => undefined);
  });
  await page.goto('/');
  await page.getByLabel('消息内容').nth(1).fill('Keep this browser draft');
  await page.getByRole('button', { name: '发送请求' }).click();
  await page.getByRole('button', { name: '停止请求' }).click();

  await expect(page.getByText('已取消').first()).toBeVisible();
  await expect(page.getByLabel('消息内容').nth(1)).toHaveValue('Keep this browser draft');
});

test('fits desktop and phone viewports without horizontal overflow', async ({ page }, testInfo) => {
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('desktop.png'), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole('tab', { name: '编辑区' })).toBeVisible();
  await expect(page.getByLabel('用户输入（宏变量内容）')).toBeVisible();
  await page.getByRole('tab', { name: '检查区' }).click();
  await expect(page.getByRole('heading', { name: '检查' })).toBeVisible();
  await expect(page.getByLabel('原始请求 JSON')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // 手机上发送请求后，导出 TXT 按钮应出现在检查区且不产生横向溢出
  await mockChat(page, 'Mobile answer');
  await page.getByRole('tab', { name: '编辑区' }).click();
  await page.getByRole('button', { name: '发送请求' }).click();
  await page.getByRole('tab', { name: '检查区' }).click();
  await expect(page.getByRole('button', { name: '导出 TXT' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('phone.png'), fullPage: true });
});

