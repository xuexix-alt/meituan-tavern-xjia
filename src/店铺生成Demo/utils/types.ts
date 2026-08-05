export interface InteractionAdapter<InputData, ParsedData> {
  /**
   * 构建发送给 LLM 的提示词
   */
  buildPrompt(input: InputData): string | Promise<string>;

  /**
   * 解析 LLM 的响应
   */
  parseResponse(rawText: string): ParsedData | Promise<ParsedData>;

  /**
   * 处理流式 Token (可选)
   */
  onStream?(token: string): void;

  /**
   * 处理副作用 (如 MVU 更新)
   */
  handleSideEffects(parsedData: ParsedData): void | Promise<void>;
}

export interface ExecutionOptions {
  /** 是否静默写入用户历史 (不刷新页面) */
  silentUser?: boolean;
  /** 是否静默写入 AI 历史 (不刷新页面) */
  silentAssistant?: boolean;
  /** 是否开启流式 */
  stream?: boolean;
}

export interface InteractionResult<ParsedData> {
  rawResponse: string;
  parsedData: ParsedData;
}
