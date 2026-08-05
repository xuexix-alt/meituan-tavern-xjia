<template>
  <div class="workspace-library">
    <section class="library-section" aria-labelledby="presets-heading">
      <div class="library-heading">
        <i class="fas fa-save" aria-hidden="true"></i>
        <h3 id="presets-heading">预设</h3>
      </div>
      <div class="preset-create">
        <input
          id="preset-name"
          v-model="presetName"
          placeholder="预设名称"
          aria-label="预设名称"
          @keydown.enter="savePreset"
        />
        <button
          class="icon-button"
          type="button"
          title="保存预设"
          aria-label="保存预设"
          :disabled="!presetName.trim()"
          @click="savePreset"
        >
          <i class="fas fa-save" aria-hidden="true"></i>
        </button>
      </div>
      <p v-if="presets.length === 0" class="library-empty">暂无已保存的预设</p>
      <div v-else class="library-list">
        <div v-for="preset in presets" :key="preset.id" class="library-row">
          <div class="library-row-copy">
            <strong>{{ preset.name }}</strong>
            <span>{{ preset.draft.model }}</span>
          </div>
          <div class="library-actions">
            <button
              class="icon-button"
              type="button"
              :aria-label="`加载预设 ${preset.name}`"
              title="加载预设"
              @click="$emit('load-preset', preset)"
            >
              <i class="fas fa-upload" aria-hidden="true"></i>
            </button>
            <button
              class="icon-button"
              type="button"
              :aria-label="`复制预设 ${preset.name}`"
              title="复制预设"
              @click="$emit('copy-preset', preset)"
            >
              <i class="fas fa-copy" aria-hidden="true"></i>
            </button>
            <button
              class="icon-button danger"
              type="button"
              :aria-label="`删除预设 ${preset.name}`"
              title="删除预设"
              @click="deleteTarget = { type: 'preset', id: preset.id, label: preset.name }"
            >
              <i class="fas fa-trash" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="library-section" aria-labelledby="history-heading">
      <div class="library-heading">
        <i class="fas fa-history" aria-hidden="true"></i>
        <h3 id="history-heading">历史记录</h3>
        <span>{{ history.length }}</span>
      </div>
      <p v-if="history.length === 0" class="library-empty">暂无请求记录</p>
      <div v-else class="library-list">
        <div v-for="entry in history" :key="entry.id" class="library-row history-row">
          <div class="library-row-copy">
            <strong>{{ historySummary(entry) }}</strong>
            <span>{{ entry.model }} · {{ historyStatusLabels[entry.status] }} · {{ entry.durationMs }} 毫秒</span>
          </div>
          <div class="library-actions">
            <button
              class="icon-button"
              type="button"
              title="加载请求"
              aria-label="加载历史请求"
              @click="$emit('load-history', entry)"
            >
              <i class="fas fa-upload" aria-hidden="true"></i>
            </button>
            <button
              class="icon-button"
              type="button"
              title="重新发送请求"
              aria-label="重新发送历史请求"
              @click="$emit('resend-history', entry)"
            >
              <i class="fas fa-rotate-right" aria-hidden="true"></i>
            </button>
            <button
              class="icon-button danger"
              type="button"
              title="删除请求"
              aria-label="删除历史请求"
              @click="deleteTarget = { type: 'history', id: entry.id, label: historySummary(entry) }"
            >
              <i class="fas fa-trash" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    </section>

    <div v-if="deleteTarget" class="modal-backdrop" role="presentation">
      <section
        class="confirm-dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="deleteTarget.type === 'preset' ? '删除预设' : '删除历史记录'"
      >
        <h3>{{ deleteTarget.type === 'preset' ? '删除这个预设？' : '删除这条历史记录？' }}</h3>
        <p>{{ deleteTarget.label }}</p>
        <div class="dialog-actions">
          <button class="secondary-button" type="button" @click="deleteTarget = null">取消</button>
          <button class="danger-button" type="button" @click="confirmDelete">确认删除</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { PromptPreset, RequestHistory } from '../storage/localStore';

defineProps<{
  presets: PromptPreset[];
  history: RequestHistory[];
}>();

const emit = defineEmits<{
  (e: 'save-preset', name: string): void;
  (e: 'load-preset', preset: PromptPreset): void;
  (e: 'copy-preset', preset: PromptPreset): void;
  (e: 'delete-preset', id: string): void;
  (e: 'load-history', entry: RequestHistory): void;
  (e: 'resend-history', entry: RequestHistory): void;
  (e: 'delete-history', id: string): void;
}>();

const presetName = ref('');

type DeleteTarget = { type: 'preset' | 'history'; id: string; label: string };
const deleteTarget = ref<DeleteTarget | null>(null);

const historyStatusLabels: Record<RequestHistory['status'], string> = {
  success: '成功',
  error: '错误',
  cancelled: '已取消',
};

function savePreset() {
  const name = presetName.value.trim();
  if (!name) return;
  emit('save-preset', name);
  presetName.value = '';
}

function confirmDelete() {
  if (!deleteTarget.value) return;
  if (deleteTarget.value.type === 'preset') emit('delete-preset', deleteTarget.value.id);
  else emit('delete-history', deleteTarget.value.id);
  deleteTarget.value = null;
}

function historySummary(entry: RequestHistory): string {
  const messages = Array.isArray(entry.payload.messages) ? entry.payload.messages : [];
  const candidate = [...messages]
    .reverse()
    .find(message => message && typeof message === 'object' && (message as { role?: unknown }).role === 'user');
  const content =
    candidate && typeof (candidate as { content?: unknown }).content === 'string'
      ? (candidate as { content: string }).content.trim()
      : '';
  return content.slice(0, 52) || new Date(entry.timestamp).toLocaleString();
}
</script>
