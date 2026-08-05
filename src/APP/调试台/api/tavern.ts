// 酒馆生成模式：参考同模板《小手机平台》的 platform/tavernApiAdapter.ts 与 ai/providers.ts。
// 通过酒馆助手的 window.TavernHelper.generateRaw / stopGenerationById 走酒馆自己的生成链路。

type TavernGenerateOptions = {
  generation_id: string;
  should_stream: false;
  should_silence: true;
  max_chat_history: 0 | number;
  ordered_prompts: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
};

type TavernGenerateRaw = (options: TavernGenerateOptions) => Promise<string>;

type TavernStopGenerationById = (id: string) => unknown | Promise<unknown>;

interface TavernHelperLike {
  generateRaw?: TavernGenerateRaw;
  stopGenerationById?: TavernStopGenerationById;
}

export interface TavernAvailability {
  available: boolean;
  hasGenerateRaw: boolean;
  hasStopGenerationById: boolean;
  error?: string;
}

export interface TavernRunResult {
  text: string;
  generationId: string;
}

function resolveTavernHelper(): TavernHelperLike | null {
  const candidates = [() => window.parent, () => window.top, () => window];
  for (const getCandidate of candidates) {
    try {
      const targetWindow = getCandidate();
      const tavernHelper = (targetWindow as { TavernHelper?: TavernHelperLike } | null)?.TavernHelper;
      if (tavernHelper && typeof tavernHelper.generateRaw === 'function') return tavernHelper;
    } catch {
      // 跨域访问失败，继续尝试下一个窗口。
    }
  }
  return null;
}

export function checkTavernAvailable(): TavernAvailability {
  try {
    const helper = resolveTavernHelper();
    if (!helper) {
      return {
        available: false,
        hasGenerateRaw: false,
        hasStopGenerationById: false,
        error: '无法访问酒馆助手的 generateRaw，请确认在酒馆助手环境中运行。',
      };
    }
    return {
      available: true,
      hasGenerateRaw: true,
      hasStopGenerationById: typeof helper.stopGenerationById === 'function',
    };
  } catch (error) {
    return {
      available: false,
      hasGenerateRaw: false,
      hasStopGenerationById: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 把调试台草稿的 messages 转换为 generateRaw 的 ordered_prompts。
 * generateRaw 只支持 system/user/assistant，tool 消息降级为 user 并保留工具调用 ID。
 */
export function payloadToOrderedPrompts(
  payload: Record<string, unknown>,
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const prompts: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
  for (const message of messages) {
    if (!message || typeof message !== 'object') continue;
    const record = message as { role?: unknown; content?: unknown; tool_call_id?: unknown };
    if (typeof record.content !== 'string') continue;

    let role: 'system' | 'user' | 'assistant' = 'user';
    if (record.role === 'system') role = 'system';
    else if (record.role === 'assistant') role = 'assistant';

    let content = record.content;
    if (record.role === 'tool' && typeof record.tool_call_id === 'string' && record.tool_call_id) {
      content = `[工具 ${record.tool_call_id} 的返回]\n${content}`;
    }
    prompts.push({ role, content });
  }
  return prompts;
}

export function buildTavernGenerateConfig(
  payload: Record<string, unknown>,
  generationId: string,
): TavernGenerateOptions {
  const orderedPrompts = payloadToOrderedPrompts(payload);
  if (orderedPrompts.length === 0) throw new Error('请求没有可发送的消息。');

  return {
    generation_id: generationId,
    should_stream: false,
    should_silence: true,
    max_chat_history: 0,
    ordered_prompts: orderedPrompts,
  };
}

export async function runTavernChat(
  payload: Record<string, unknown>,
  generationId = crypto.randomUUID(),
): Promise<TavernRunResult> {
  const helper = resolveTavernHelper();
  if (!helper?.generateRaw) {
    throw new Error('无法访问酒馆助手的 generateRaw，请确认在酒馆助手环境中运行。');
  }

  const result = await Promise.resolve(helper.generateRaw(buildTavernGenerateConfig(payload, generationId)));

  if (typeof result !== 'string') {
    throw new Error(`酒馆生成返回类型错误，期望 string，得到 ${typeof result}`);
  }
  return { text: result, generationId };
}

export function stopTavernGeneration(id: string): void {
  const helper = resolveTavernHelper();
  if (!helper?.stopGenerationById) return;
  try {
    void Promise.resolve(helper.stopGenerationById(id)).catch(() => {
      // 取消失败不影响主流程。
    });
  } catch {
    // 忽略。
  }
}
