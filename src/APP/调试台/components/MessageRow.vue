<template>
  <article class="message-row">
    <div class="message-toolbar">
      <label class="role-field">
        <select :value="message.role" :aria-label="`第 ${index + 1} 条消息的角色`" @change="onRoleChange">
          <option v-for="role in roles" :key="role" :value="role">{{ roleLabels[role] }}</option>
        </select>
      </label>
      <span class="message-index">#{{ index + 1 }}</span>
      <div class="row-actions">
        <button
          class="icon-button"
          type="button"
          aria-label="上移消息"
          title="上移"
          :disabled="index === 0"
          @click="$emit('move', -1)"
        >
          <i class="fas fa-chevron-up" aria-hidden="true"></i>
        </button>
        <button
          class="icon-button"
          type="button"
          aria-label="下移消息"
          title="下移"
          :disabled="index === count - 1"
          @click="$emit('move', 1)"
        >
          <i class="fas fa-chevron-down" aria-hidden="true"></i>
        </button>
        <button class="icon-button" type="button" aria-label="复制消息" title="复制消息" @click="$emit('copy')">
          <i class="fas fa-copy" aria-hidden="true"></i>
        </button>
        <button
          class="icon-button danger"
          type="button"
          aria-label="删除消息"
          title="删除消息"
          :disabled="count === 1"
          @click="$emit('delete')"
        >
          <i class="fas fa-trash" aria-hidden="true"></i>
        </button>
      </div>
    </div>
    <div v-if="!message.collapsed" class="message-content">
      <label class="field">
        <textarea
          :aria-label="'消息内容'"
          :rows="message.role === 'system' ? 6 : 5"
          :value="message.content"
          :placeholder="`${roleLabels[message.role]}消息`"
          @input="onContentInput"
        />
      </label>
      <label v-if="message.role === 'tool'" class="field compact-field">
        <span>工具调用 ID</span>
        <input :value="message.tool_call_id ?? ''" @input="onToolCallIdInput" />
      </label>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { ChatMessage, MessageRole } from '../domain/chat';

const props = defineProps<{
  message: ChatMessage;
  index: number;
  count: number;
}>();

const emit = defineEmits<{
  (e: 'change', message: ChatMessage): void;
  (e: 'copy'): void;
  (e: 'delete'): void;
  (e: 'move', direction: -1 | 1): void;
}>();

const roles: MessageRole[] = ['system', 'user', 'assistant', 'tool'];
const roleLabels: Record<MessageRole, string> = { system: '系统', user: '用户', assistant: '助手', tool: '工具' };

function onRoleChange(event: Event) {
  const role = (event.target as HTMLSelectElement).value as MessageRole;
  const next = { ...props.message, role };
  if (role !== 'tool') delete next.tool_call_id;
  emit('change', next);
}

function onContentInput(event: Event) {
  emit('change', { ...props.message, content: (event.target as HTMLTextAreaElement).value });
}

function onToolCallIdInput(event: Event) {
  emit('change', { ...props.message, tool_call_id: (event.target as HTMLInputElement).value });
}
</script>
