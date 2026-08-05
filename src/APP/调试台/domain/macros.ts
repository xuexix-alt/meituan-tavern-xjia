import type { PromptDraft } from './chat';

/** 宏名缺省时使用的默认宏。 */
export const DEFAULT_MACRO_NAME = '{{lastusermessage}}';

/** 把一段文本里出现的所有宏名替换为宏内容（宏名为空时不处理）。 */
export function replaceMacro(text: string, macroName: string, macroValue: string): string {
  if (!macroName) return text;
  return text.split(macroName).join(macroValue);
}

/** 返回实际生效的宏名：配置为空时回落到默认宏。 */
export function effectiveMacroName(macroName: string): string {
  return macroName || DEFAULT_MACRO_NAME;
}

/** 对结构化草稿做宏替换：只替换 content 中包含宏的消息，返回新草稿，不改原对象。 */
export function resolveMacros(draft: PromptDraft, macroName: string, macroValue: string): PromptDraft {
  const macro = effectiveMacroName(macroName);
  return {
    ...draft,
    messages: draft.messages.map((message) =>
      message.content.includes(macro)
        ? { ...message, content: replaceMacro(message.content, macro, macroValue) }
        : message,
    ),
  };
}

/** 对已解析的原始请求 payload 做宏替换（发送原始 JSON 时使用）。 */
export function applyMacroToPayload(
  payload: Record<string, unknown>,
  macroName: string,
  macroValue: string,
): Record<string, unknown> {
  const macro = effectiveMacroName(macroName);
  const messages = payload.messages;
  if (!Array.isArray(messages)) return payload;
  return {
    ...payload,
    messages: messages.map((message) => {
      if (!message || typeof message !== 'object' || !('content' in message)) return message;
      const record = message as Record<string, unknown>;
      if (typeof record.content !== 'string' || !record.content.includes(macro)) return message;
      return { ...record, content: replaceMacro(record.content, macro, macroValue) };
    }),
  };
}
