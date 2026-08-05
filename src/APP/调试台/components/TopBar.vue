<template>
  <header class="top-bar" :aria-describedby="importError ? 'import-error' : undefined">
    <div class="brand-block">
      <span class="brand-mark" aria-hidden="true">P</span>
      <div>
        <h1>提示词调试台</h1>
        <p class="connection-summary">本地代理 · {{ statusText }}</p>
      </div>
    </div>
    <div class="top-actions">
      <input
        ref="fileInput"
        class="visually-hidden-action"
        type="file"
        accept="application/json,.json"
        aria-label="选择工作台 JSON 文件"
        @change="onFileChange"
      />
      <button class="secondary-button compact-action" type="button" @click="fileInput?.click()">
        <i class="fas fa-upload" aria-hidden="true"></i> 导入 JSON
      </button>
      <button class="secondary-button compact-action" type="button" @click="$emit('export')">
        <i class="fas fa-download" aria-hidden="true"></i> 导出 JSON
      </button>
      <button
        :class="running ? 'stop-button' : 'send-button'"
        type="button"
        @click="running ? $emit('stop') : $emit('send')"
      >
        <i :class="['fas', running ? 'fa-stop' : 'fa-play']" aria-hidden="true"></i>
        {{ running ? '停止请求' : '发送请求' }}
      </button>
    </div>
    <span v-if="importError" id="import-error" class="top-error" role="alert">{{ importError }}</span>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  statusText?: string;
  running?: boolean;
  importError?: string;
}>();

const emit = defineEmits<{
  (e: 'send'): void;
  (e: 'stop'): void;
  (e: 'export'): void;
  (e: 'import', file: File): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) emit('import', file);
  input.value = '';
}
</script>
