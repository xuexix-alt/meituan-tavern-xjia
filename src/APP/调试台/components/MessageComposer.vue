<template>
  <div class="composer-body">
    <label class="field macro-field">
      <span>用户输入（宏变量内容）</span>
      <textarea
        rows="2"
        :value="macroValue"
        aria-label="用户输入（宏变量内容）"
        :placeholder="`在这里输入内容，发送时将替换消息中的 ${macroName}`"
        @input="onMacroInput"
      />
      <small>发送请求时，消息里出现的 {{ macroName }} 会被替换成上面的输入内容；留空则替换为空。</small>
    </label>
    <div class="message-list">
      <MessageRow
        v-for="(message, index) in messages"
        :key="message.id"
        :message="message"
        :index="index"
        :count="messages.length"
        @change="onMessageChange"
        @copy="onCopy(message)"
        @delete="onDelete(message)"
        @move="direction => onMove(message, index, direction)"
      />
    </div>
    <button class="secondary-button add-message" type="button" @click="onAdd">
      <i class="fas fa-plus" aria-hidden="true"></i> 添加消息
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '../domain/chat';
import { addMessage, copyMessage, moveMessage, removeMessage } from '../domain/messages';
import MessageRow from './MessageRow.vue';

const props = defineProps<{
  messages: ChatMessage[];
  macroName: string;
  macroValue: string;
}>();

const emit = defineEmits<{
  (e: 'change', messages: ChatMessage[]): void;
  (e: 'macro-value-change', value: string): void;
}>();

function onMacroInput(event: Event) {
  emit('macro-value-change', (event.target as HTMLTextAreaElement).value);
}

function onMessageChange(next: ChatMessage) {
  emit(
    'change',
    props.messages.map(item => (item.id === next.id ? next : item)),
  );
}

function onCopy(message: ChatMessage) {
  emit('change', copyMessage(props.messages, message.id));
}

function onDelete(message: ChatMessage) {
  emit('change', removeMessage(props.messages, message.id));
}

function onMove(message: ChatMessage, index: number, direction: number) {
  emit('change', moveMessage(props.messages, index, index + direction));
}

function onAdd() {
  emit('change', addMessage(props.messages));
}
</script>
