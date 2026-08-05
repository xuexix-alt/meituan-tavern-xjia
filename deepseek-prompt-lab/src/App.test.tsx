import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

describe('Prompt Lab', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders the prompt lab workbench', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: '提示词调试台' })).toBeVisible();
    expect(screen.getByRole('button', { name: '发送请求' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '导入 JSON' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '导出 JSON' })).toBeEnabled();
  });

  it('imports the playground config shape and keeps the local API key', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('API 密钥'), 'local-secret');
    const file = new File([], 'import.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', { value: () => Promise.resolve(JSON.stringify({
      baseUrl: 'http://localhost:9000/v1',
      model: 'imported-model',
      temperature: 0.2,
      maxTokens: 256,
      stream: false,
      macroName: '{{input}}',
      appendReply: true,
      messages: [{ role: 'user', content: 'Imported prompt' }],
    })) });

    fireEvent.change(screen.getByLabelText('选择工作台 JSON 文件'), { target: { files: [file] } });

    await waitFor(() => expect(screen.getByLabelText('模型')).toHaveValue('imported-model'));
    expect(screen.getByLabelText('接口地址（Base URL）')).toHaveValue('http://localhost:9000/v1');
    expect(screen.getByLabelText('API 密钥')).toHaveValue('local-secret');
    expect(screen.getByLabelText('消息内容')).toHaveValue('Imported prompt');
    expect(screen.getByLabelText('最大 Token 数')).toHaveValue(256);
  });

  it('starts with the bundled DeepSeek values and prompt messages', () => {
    render(<App />);
    expect(screen.getByLabelText('接口地址（Base URL）')).toHaveValue('https://api.deepseek.com');
    expect(screen.getByLabelText('模型')).toHaveValue('deepseek-v4-flash');
    expect(screen.getAllByLabelText(/消息的角色/)).toHaveLength(5);
    expect(screen.getAllByLabelText(/消息的角色/)[0]).toHaveValue('system');
    expect(screen.getAllByLabelText(/消息的角色/)[1]).toHaveValue('system');
    expect(screen.getAllByLabelText(/消息的角色/)[2]).toHaveValue('user');
    expect(screen.getAllByLabelText(/消息的角色/)[4]).toHaveValue('assistant');
    expect((screen.getAllByLabelText('消息内容')[0] as HTMLTextAreaElement).value).toContain('手机界面文字生成接口');
  });

  it('keeps manual model entry available after model loading fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText('模型'));
    await user.type(screen.getByLabelText('模型'), 'my-compatible-model');
    await user.click(screen.getByRole('button', { name: '拉取模型列表' }));

    expect(await screen.findByText(/无法拉取模型/)).toBeVisible();
    expect(screen.getByLabelText('模型')).toHaveValue('my-compatible-model');
  });

  it('renders a selectable model menu after loading models', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      data: [{ id: 'deepseek-chat' }, { id: 'deepseek-reasoner' }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '拉取模型列表' }));

    const modelPicker = await screen.findByLabelText('模型');
    expect(modelPicker.tagName).toBe('SELECT');
    expect(within(modelPicker).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'deepseek-chat',
      'deepseek-reasoner',
      '其他模型（手动输入）',
    ]);

    await user.selectOptions(modelPicker, 'deepseek-reasoner');
    expect((screen.getByLabelText('原始请求 JSON') as HTMLTextAreaElement).value).toContain('deepseek-reasoner');
  });

  it('adds duplicates deletes and button-reorders messages', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '添加消息' }));
    expect(screen.getAllByTestId('message-row')).toHaveLength(6);

    const added = screen.getAllByTestId('message-row')[5];
    await user.type(within(added).getByLabelText('消息内容'), 'Added');
    await user.click(within(added).getByRole('button', { name: '复制消息' }));
    expect(screen.getAllByTestId('message-row')).toHaveLength(7);

    await user.click(within(screen.getAllByTestId('message-row')[6]).getByRole('button', { name: '上移消息' }));
    expect(within(screen.getAllByTestId('message-row')[5]).getByLabelText('消息内容')).toHaveValue('Added');

    await user.click(within(screen.getAllByTestId('message-row')[5]).getByRole('button', { name: '删除消息' }));
    expect(screen.getAllByTestId('message-row')).toHaveLength(6);
  });

  it('changes a message among all four portable roles', async () => {
    const user = userEvent.setup();
    render(<App />);
    const role = screen.getAllByLabelText(/消息的角色/)[0];

    expect(within(role).getAllByRole('option').map((option) => option.textContent)).toEqual([
      '系统',
      '用户',
      '助手',
      '工具',
    ]);
    await user.selectOptions(role, 'tool');
    expect(role).toHaveValue('tool');
    expect(screen.getByLabelText('工具调用 ID')).toBeVisible();
  });

  it('shows a conflict when additional parameters contain reserved fields', async () => {
    const user = userEvent.setup();
    render(<App />);
    fireEvent.change(screen.getByLabelText('附加参数 JSON'), {
      target: { value: '{"model":"other"}' },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(/保留/);
  });

  it('regenerates raw JSON while the raw editor is clean', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getAllByLabelText('消息内容')[0], 'Stay concise');

    expect((screen.getByLabelText('原始请求 JSON') as HTMLTextAreaElement).value).toContain('Stay concise');
  });

  it('does not overwrite a dirty raw editor after structured edits', async () => {
    const user = userEvent.setup();
    render(<App />);
    const raw = screen.getByLabelText('原始请求 JSON');
    const custom = '{"model":"raw-model","messages":[{"role":"user","content":"Raw"}]}';
    fireEvent.change(raw, { target: { value: custom } });

    await user.type(screen.getAllByLabelText('消息内容')[0], 'Structured edit');

    expect(raw).toHaveValue(custom);
    expect(screen.getByText('原始 JSON 未同步')).toBeVisible();
  });

  it('imports valid raw JSON into structured controls explicitly', async () => {
    const user = userEvent.setup();
    render(<App />);
    fireEvent.change(screen.getByLabelText('原始请求 JSON'), {
      target: { value: '{"model":"raw-model","messages":[{"role":"assistant","content":"Imported"}]}' },
    });

    await user.click(screen.getByRole('button', { name: '应用到结构化编辑器' }));

    expect(screen.getByLabelText('模型')).toHaveValue('raw-model');
    expect(screen.getAllByLabelText(/消息的角色/)).toHaveLength(1);
    expect(screen.getByLabelText('消息内容')).toHaveValue('Imported');
    expect(screen.queryByText('原始 JSON 未同步')).not.toBeInTheDocument();
  });

  it('rebuilds and clears dirty state only after confirmation', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<App />);
    const raw = screen.getByLabelText('原始请求 JSON');
    fireEvent.change(raw, { target: { value: '{"model":"raw-model","messages":[{"role":"user","content":"Raw"}]}' } });

    await user.click(screen.getByRole('button', { name: '从结构化编辑器重建' }));
    expect((raw as HTMLTextAreaElement).value).toContain('raw-model');
    expect(screen.getByText('原始 JSON 未同步')).toBeVisible();

    await user.click(screen.getByRole('button', { name: '从结构化编辑器重建' }));
    expect((raw as HTMLTextAreaElement).value).toContain('deepseek-v4-flash');
    expect(screen.queryByText('原始 JSON 未同步')).not.toBeInTheDocument();
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it('blocks sending invalid raw JSON', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('原始请求 JSON'), { target: { value: '{bad' } });

    expect(screen.getByRole('button', { name: '应用到结构化编辑器' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '发送原始 JSON' })).toBeDisabled();
    expect(screen.getByText(/请求 JSON 格式无效/)).toBeVisible();
  });

  it('sends the selected payload and renders assistant text', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      id: 'chat-1',
      choices: [{ message: { content: 'Assistant answer' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 },
    }), { status: 200, headers: { 'content-type': 'application/json', 'x-request-id': 'req-1' } }));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '发送请求' }));

    expect(await screen.findByText('Assistant answer')).toBeVisible();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/chat/completions', expect.objectContaining({ method: 'POST' }));
  });

  it('appends streaming deltas and changes Send to Stop', async () => {
    let streamController!: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({ start(controller) { streamController = controller; } });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } }));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '发送请求' }));
    expect(await screen.findByRole('button', { name: '停止请求' })).toBeVisible();
    streamController.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello "}}]}\n\n'));
    streamController.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"world"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n'));
    streamController.close();

    expect(await screen.findByText('Hello world')).toBeVisible();
    expect(await screen.findByRole('button', { name: '发送请求' })).toBeVisible();
  });

  it('cancels through AbortController without clearing the draft', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    const user = userEvent.setup();
    render(<App />);
    await user.clear(screen.getAllByLabelText('消息内容')[1]);
    await user.type(screen.getAllByLabelText('消息内容')[1], 'Keep this draft');

    await user.click(screen.getByRole('button', { name: '发送请求' }));
    await user.click(await screen.findByRole('button', { name: '停止请求' }));

    expect((await screen.findAllByText('已取消')).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('消息内容')[1]).toHaveValue('Keep this draft');
  });

  it('shows status duration finish reason request id and usage', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: 'Done' }, finish_reason: 'length' }],
      usage: { prompt_tokens: 4, completion_tokens: 6, total_tokens: 10 },
    }), { status: 200, headers: { 'content-type': 'application/json', 'x-request-id': 'req-diag' } }));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '发送请求' }));
    await screen.findByText('Done');
    await user.click(screen.getByRole('tab', { name: '诊断' }));

    expect(screen.getAllByText('成功').length).toBeGreaterThan(0);
    expect(screen.getByText('length')).toBeVisible();
    expect(screen.getByText('req-diag')).toBeVisible();
    expect(screen.getByText('10')).toBeVisible();
    expect(screen.getAllByText(/毫秒/).length).toBeGreaterThan(0);
  });

  it('renders response content as text rather than HTML', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: '<img alt="unsafe" src=x>' }, finish_reason: 'stop' }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '发送请求' }));

    expect(await screen.findByText('<img alt="unsafe" src=x>')).toBeVisible();
    expect(screen.queryByAltText('unsafe')).not.toBeInTheDocument();
  });

  it('saves loads copies and deletes presets without including the API key', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('API 密钥'), 'secret-key');
    await user.clear(screen.getAllByLabelText('消息内容')[0]);
    await user.type(screen.getAllByLabelText('消息内容')[0], 'Saved instruction');
    await user.type(screen.getByLabelText('预设名称'), 'Concise preset');
    await user.click(screen.getByRole('button', { name: '保存预设' }));

    const stored = JSON.parse(localStorage.getItem('deepseek-prompt-lab.workspace.v1') ?? '{}');
    expect(JSON.stringify(stored.presets)).not.toContain('secret-key');
    expect(screen.getByText('Concise preset')).toBeVisible();

    await user.clear(screen.getAllByLabelText('消息内容')[0]);
    await user.type(screen.getAllByLabelText('消息内容')[0], 'Changed');
    await user.click(screen.getByRole('button', { name: '加载预设 Concise preset' }));
    expect(screen.getAllByLabelText('消息内容')[0]).toHaveValue('Saved instruction');

    await user.click(screen.getByRole('button', { name: '复制预设 Concise preset' }));
    expect(screen.getByText('Concise preset 副本')).toBeVisible();
    await user.click(screen.getByRole('button', { name: '删除预设 Concise preset' }));
    expect(screen.getByRole('dialog', { name: '删除预设' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: '确认删除' }));
    expect(screen.queryByText('Concise preset')).not.toBeInTheDocument();
  });

  it('records sanitized history and supports load resend and delete', async () => {
    const request = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: 'History answer' }, finish_reason: 'stop' }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('API 密钥'), 'history-secret');
    await user.clear(screen.getAllByLabelText('消息内容')[1]);
    await user.type(screen.getAllByLabelText('消息内容')[1], 'Remember this');
    await user.click(screen.getByRole('button', { name: '发送请求' }));
    await screen.findByText('History answer');

    expect((await screen.findAllByText('Remember this')).length).toBeGreaterThan(0);
    const stored = JSON.parse(localStorage.getItem('deepseek-prompt-lab.workspace.v1') ?? '{}');
    expect(JSON.stringify(stored.history)).not.toContain('history-secret');

    await user.clear(screen.getAllByLabelText('消息内容')[1]);
    await user.type(screen.getAllByLabelText('消息内容')[1], 'Different');
    await user.click(screen.getByRole('button', { name: '加载历史请求' }));
    expect(screen.getAllByLabelText('消息内容')[1]).toHaveValue('Remember this');

    await user.click(screen.getByRole('button', { name: '重新发送历史请求' }));
    expect(request).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.getAllByRole('button', { name: '删除历史请求' })).toHaveLength(2));
    const deleteButtons = screen.getAllByRole('button', { name: '删除历史请求' });
    await user.click(deleteButtons[0]);
    await user.click(screen.getByRole('button', { name: '确认删除' }));
    expect(screen.getAllByRole('button', { name: '删除历史请求' })).toHaveLength(1);
  });

  it('offers mobile work-area tabs with explicit active state', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('tab', { name: '连接区' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: '编辑区' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('tab', { name: '检查区' }));
    expect(screen.getByRole('tab', { name: '检查区' })).toHaveAttribute('aria-selected', 'true');
  });
  it('exports AI output as a txt file with a timestamped name', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: 'TXT export content' }, finish_reason: 'stop' }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '发送请求' }));
    await screen.findByText('TXT export content');

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:mock');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });

    await user.click(screen.getByRole('button', { name: '导出 TXT' }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(await blob.text()).toBe('TXT export content');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy.mock.instances[0]).toMatchObject({
      download: expect.stringMatching(/^deepseek-response-\d{8}-\d{6}\.txt$/),
    });
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');

    delete (URL as unknown as Record<string, unknown>).createObjectURL;
    delete (URL as unknown as Record<string, unknown>).revokeObjectURL;
  });
  it('replaces the macro in messages with the user input when sending', async () => {
    const request = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: 'OK' }, finish_reason: 'stop' }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('用户输入（宏变量内容）'), '想要一套古典旗袍主题店');
    await user.click(screen.getByRole('button', { name: '发送请求' }));
    await screen.findByText('OK');

    const body = JSON.parse(String(request.mock.calls[0][1]?.body)) as { messages: Array<{ role: string; content: string }> };
    const assistant = body.messages.find((message) => message.role === 'assistant');
    expect(assistant).toBeDefined();
    expect(assistant?.content).toContain('想要一套古典旗袍主题店');
    expect(assistant?.content).not.toContain('{{lastusermessage}}');
  });
});




