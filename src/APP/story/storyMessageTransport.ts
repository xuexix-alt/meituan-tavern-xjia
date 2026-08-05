export interface StoryAssistantTransportPlan {
  staging: {
    role: 'user';
    message: string;
    is_hidden: false;
  };
  update: {
    message_id: number;
    name?: string;
    role: 'assistant';
    message: string;
    is_hidden: false;
  };
}

/**
 * createChatMessages always emits a message event. Stage as user first so the
 * MVUbeta MESSAGE_RECEIVED throttle cannot consume the real assistant event.
 */
export function createAssistantTransportPlan(
  messageId: number,
  message: string,
  placeholder = '...',
  assistantName?: string,
): StoryAssistantTransportPlan {
  return {
    staging: {
      role: 'user',
      message: placeholder,
      is_hidden: false,
    },
    update: {
      message_id: messageId,
      ...(assistantName ? { name: assistantName } : {}),
      role: 'assistant',
      message,
      is_hidden: false,
    },
  };
}
