<template>
  <details class="generation-controls" open>
    <summary>生成参数</summary>
    <div class="generation-grid">
      <label class="field">
        <span>随机性（Temperature）</span>
        <input type="number" step="0.1" :value="generation.temperature ?? ''" @input="onNumber('temperature', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="field">
        <span>核采样（Top P）</span>
        <input type="number" step="0.1" :value="generation.top_p ?? ''" @input="onNumber('top_p', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="field">
        <span>最大 Token 数</span>
        <input type="number" step="1" :value="generation.max_tokens ?? ''" @input="onNumber('max_tokens', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="checkbox-field">
        <input type="checkbox" :checked="generation.stream" @change="onStreamChange" />
        <span>流式响应</span>
      </label>
    </div>
    <label class="field">
      <span>停止序列 <small>每行一个</small></span>
      <textarea rows="2" :value="generation.stop.join('\n')" @input="onStopInput" />
    </label>
    <label class="field">
      <span>附加参数 JSON</span>
      <textarea class="code-input" rows="5" :value="additionalText" @input="onAdditionalInput" />
    </label>
    <p v-if="additionalError" class="field-error" role="alert">{{ additionalError }}</p>
  </details>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { GenerationSettings } from '../domain/chat';
import { RESERVED_PAYLOAD_FIELDS } from '../domain/payload';

const props = defineProps<{
  generation: GenerationSettings;
}>();

const emit = defineEmits<{
  (e: 'change', generation: GenerationSettings): void;
}>();

const additionalText = ref(JSON.stringify(props.generation.additional, null, 2));
const additionalError = ref('');

watch(
  () => props.generation.additional,
  (additional) => {
    additionalText.value = JSON.stringify(additional, null, 2);
  },
);

function onNumber(key: 'temperature' | 'top_p' | 'max_tokens', value: string) {
  emit('change', { ...props.generation, [key]: value === '' ? undefined : Number(value) });
}

function onStreamChange(event: Event) {
  emit('change', { ...props.generation, stream: (event.target as HTMLInputElement).checked });
}

function onStopInput(event: Event) {
  const value = (event.target as HTMLTextAreaElement).value;
  emit('change', { ...props.generation, stop: value.split('\n').filter(Boolean) });
}

function onAdditionalInput(event: Event) {
  const text = (event.target as HTMLTextAreaElement).value;
  additionalText.value = text;
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('请输入 JSON 对象。');
    const conflict = Object.keys(parsed).find((key) => RESERVED_PAYLOAD_FIELDS.has(key));
    if (conflict) throw new Error(`“${conflict}” 是保留的请求字段。`);
    additionalError.value = '';
    emit('change', { ...props.generation, additional: parsed as Record<string, unknown> });
  } catch (error) {
    additionalError.value = error instanceof Error ? error.message : 'JSON 对象无效。';
  }
}
</script>
