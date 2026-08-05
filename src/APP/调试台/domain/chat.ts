export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  tool_call_id?: string;
  collapsed: boolean;
}

export interface GenerationSettings {
  stream: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stop: string[];
  additional: Record<string, unknown>;
}

export interface PromptDraft {
  model: string;
  messages: ChatMessage[];
  generation: GenerationSettings;
}

function createMessage(role: MessageRole, content = '', tool_call_id?: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    ...(tool_call_id === undefined ? {} : { tool_call_id }),
    collapsed: false,
  };
}

export function createDefaultDraft(): PromptDraft {
  const config = defaultConfig as {
    model: string;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    stream?: boolean;
    stop?: string[];
    messages: Array<{ role: MessageRole; content: string; tool_call_id?: string }>;
  };
  return {
    model: config.model,
    messages: config.messages.map((message) => createMessage(message.role, message.content, message.tool_call_id)),
    generation: {
      stream: config.stream ?? false,
      ...(config.temperature === undefined ? {} : { temperature: config.temperature }),
      ...(config.topP === undefined ? {} : { top_p: config.topP }),
      ...(config.maxTokens === undefined ? {} : { max_tokens: config.maxTokens }),
      stop: config.stop ?? [],
      additional: {},
    },
  };
}

import defaultConfigText from '../assets/prompt-playground.default.json?raw';
const defaultConfig = JSON.parse(defaultConfigText) as unknown;
