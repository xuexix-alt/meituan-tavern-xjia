import { ExecutionOptions, InteractionAdapter, InteractionResult } from './types';

// 声明全局变量，避免 TS 报错
declare const eventOn: any;
declare const iframe_events: any;
declare const generate: any;
declare const createChatMessages: any;

export class InlineInteractionService {
  /**
   * 执行同层交互流程
   */
  async execute<InputData, ParsedData>(
    adapter: InteractionAdapter<InputData, ParsedData>,
    input: InputData,
    options: ExecutionOptions = { silentUser: true, silentAssistant: true, stream: true },
  ): Promise<InteractionResult<ParsedData>> {
    console.log('[InlineInteractionService] Start execution');

    // 1. 构建 Prompt
    const prompt = await adapter.buildPrompt(input);
    console.log('[InlineInteractionService] Prompt built length:', prompt.length);

    // 2. 写入用户历史 (Silent)
    if (options.silentUser) {
      const userContent = typeof input === 'string' ? input : '执行操作';
      await this.addToHistory('user', userContent);
    }

    // 3. 准备流式监听
    const onStream = (token: string) => {
      if (options.stream && adapter.onStream) {
        adapter.onStream(token);
      }
    };

    if (options.stream && typeof eventOn === 'function' && typeof iframe_events !== 'undefined') {
      try {
        eventOn(iframe_events.STREAM_TOKEN_RECEIVED_INCREMENTALLY, onStream);
      } catch (e) {
        console.warn('Failed to register stream listener:', e);
      }
    }

    // 4. 调用 LLM
    console.log('[InlineInteractionService] Generating...');
    // generate 返回最终的完整文本
    const fullResponse = await generate({
      user_input: prompt,
      should_stream: options.stream,
    });
    console.log('[InlineInteractionService] Generation complete. Length:', fullResponse.length);

    // 5. 解析响应
    const parsedData = await adapter.parseResponse(fullResponse);
    console.log('[InlineInteractionService] Response parsed');

    // 6. 处理副作用 (MVU等)
    await adapter.handleSideEffects(parsedData);
    console.log('[InlineInteractionService] Side effects handled');

    // 7. 写入 Assistant 历史
    // 注意：必须使用 refresh: 'affected' 以触发MVU扫描和变量更新
    if (options.silentAssistant) {
      await this.addToHistory('assistant', fullResponse, true); // 第3个参数表示需要触发MVU
    }

    return {
      rawResponse: fullResponse,
      parsedData,
    };
  }

  /**
   * 添加消息到历史记录
   * @param role 消息角色
   * @param content 消息内容
   * @param triggerMvu 是否触发MVU扫描（渲染消息）
   */
  private async addToHistory(role: 'user' | 'assistant', content: string, triggerMvu: boolean = false) {
    try {
      await createChatMessages([{ role, message: content }], {
        // 如果需要触发MVU（assistant消息），使用 'affected' 触发渲染
        // 否则使用 'none' 静默添加（user消息）
        refresh: triggerMvu ? 'affected' : 'none',
      });
      console.log(`[InlineInteractionService] Added ${role} message (triggerMvu: ${triggerMvu})`);
    } catch (e) {
      console.warn('[InlineInteractionService] Failed to add history', e);
    }
  }
}
