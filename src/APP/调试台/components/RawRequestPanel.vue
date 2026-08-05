<template>
  <section class="raw-panel" aria-labelledby="raw-request-heading">
    <div class="subpanel-heading">
      <div>
        <i class="fas fa-code" aria-hidden="true"></i>
        <h3 id="raw-request-heading">原始请求</h3>
      </div>
      <span :class="isDirty ? 'dirty-badge' : 'synced-badge'">{{ isDirty ? '原始 JSON 未同步' : '已同步' }}</span>
    </div>
    <div class="raw-body">
      <div class="raw-editor-wrap">
        <pre class="raw-editor-highlight" aria-hidden="true" ref="highlightRef" v-html="highlighted" />
        <textarea
          class="raw-editor"
          aria-label="原始请求 JSON"
          spellcheck="false"
          ref="editorRef"
          :value="text"
          @input="onInput"
          @scroll="syncScroll"
        />
      </div>
      <p v-if="!parsed.success" class="field-error" role="alert">{{ parsed.error }}</p>
      <div class="raw-actions">
        <button class="secondary-button" type="button" :disabled="!parsed.success" @click="onApply">
          <i class="fas fa-download" aria-hidden="true"></i> 应用到结构化编辑器
        </button>
        <button class="secondary-button" type="button" @click="$emit('rebuild')">
          <i class="fas fa-rotate-right" aria-hidden="true"></i> 从结构化编辑器重建
        </button>
      </div>
      <div v-if="isDirty" class="send-choice">
        <button class="secondary-button" type="button" @click="$emit('send-structured')">
          <i class="fas fa-paper-plane" aria-hidden="true"></i> 发送结构化请求
        </button>
        <button class="secondary-button accent" type="button" :disabled="!parsed.success" @click="onSendRaw">
          <i class="fas fa-code" aria-hidden="true"></i> 发送原始 JSON
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { PromptDraft } from '../domain/chat';
import { highlightJson } from '../domain/jsonHighlight';
import { importRawPayload } from '../domain/payload';

const props = defineProps<{
  text: string;
  isDirty: boolean;
}>();

const emit = defineEmits<{
  (e: 'text-change', text: string): void;
  (e: 'apply', draft: PromptDraft): void;
  (e: 'rebuild'): void;
  (e: 'send-raw'): void;
  (e: 'send-structured'): void;
}>();

const parsed = computed(() => importRawPayload(props.text));
const highlighted = computed(() => highlightJson(props.text));
const editorRef = ref<HTMLTextAreaElement | null>(null);
const highlightRef = ref<HTMLPreElement | null>(null);

function onInput(event: Event) {
  emit('text-change', (event.target as HTMLTextAreaElement).value);
}

function syncScroll() {
  if (editorRef.value && highlightRef.value) {
    highlightRef.value.scrollTop = editorRef.value.scrollTop;
    highlightRef.value.scrollLeft = editorRef.value.scrollLeft;
  }
}

watch(
  () => props.text,
  () => {
    void nextTick(syncScroll);
  },
);

function onApply() {
  if (parsed.value.success) emit('apply', parsed.value.draft);
}

function onSendRaw() {
  if (parsed.value.success) emit('send-raw');
}
</script>

