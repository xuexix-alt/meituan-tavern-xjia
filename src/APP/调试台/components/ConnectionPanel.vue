<template>
  <div class="panel-body stack">
    <div class="field">
      <span>发送方式</span>
      <div class="mode-switch" role="radiogroup" aria-label="发送方式">
        <button
          type="button"
          role="radio"
          :aria-checked="sendMode === 'direct'"
          :class="{ active: sendMode === 'direct' }"
          @click="$emit('send-mode-change', 'direct')"
        >
          直连 API（代理）
        </button>
        <button
          type="button"
          role="radio"
          :aria-checked="sendMode === 'tavern'"
          :class="{ active: sendMode === 'tavern' }"
          @click="$emit('send-mode-change', 'tavern')"
        >
          酒馆生成
        </button>
      </div>
      <small v-if="sendMode === 'tavern'">
        {{
          tavernAvailable
            ? '已连接酒馆生成（使用酒馆当前配置的模型，忽略下方地址/密钥）'
            : tavernError || '未检测到酒馆助手'
        }}
      </small>
      <small v-else>直连模式会直接请求下方接口地址（自动补 /v1），效果等同原调试台代理。</small>
    </div>

    <label class="field">
      <span>接口地址（Base URL）</span>
      <input :value="connection.baseUrl" @input="patch('baseUrl', ($event.target as HTMLInputElement).value)" />
    </label>

    <div class="field">
      <label for="provider-api-key">API 密钥</label>
      <div class="input-with-action">
        <input
          id="provider-api-key"
          :type="revealKey ? 'text' : 'password'"
          :value="connection.apiKey"
          autocomplete="off"
          @input="patch('apiKey', ($event.target as HTMLInputElement).value)"
        />
        <button
          class="icon-button"
          type="button"
          :aria-label="revealKey ? '隐藏 API 密钥' : '显示 API 密钥'"
          :title="revealKey ? '隐藏 API 密钥' : '显示 API 密钥'"
          @click="revealKey = !revealKey"
        >
          <i :class="['fas', revealKey ? 'fa-eye-slash' : 'fa-eye']" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <template v-if="models.length > 0">
      <label class="field">
        <span>模型</span>
        <select
          :value="manualModel || !models.includes(connection.model) ? '__manual__' : connection.model"
          @change="onModelSelect"
        >
          <option v-for="model in models" :key="model" :value="model">{{ model }}</option>
          <option value="__manual__">其他模型（手动输入）</option>
        </select>
      </label>
      <label v-if="manualModel || !models.includes(connection.model)" class="field">
        <span>手动模型名称</span>
        <input :value="connection.model" @input="patch('model', ($event.target as HTMLInputElement).value)" />
      </label>
    </template>
    <label v-else class="field">
      <span>模型</span>
      <input :value="connection.model" @input="patch('model', ($event.target as HTMLInputElement).value)" />
    </label>

    <button class="secondary-button" type="button" :disabled="loading || sendMode === 'tavern'" @click="load">
      <i class="fas fa-rotate-right" :class="{ spin: loading }" aria-hidden="true"></i>
      {{ loading ? '正在拉取模型' : '拉取模型列表' }}
    </button>
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
    <p v-if="models.length > 0" class="field-note">已获取 {{ models.length }} 个模型</p>

    <WorkspaceLibrary
      :presets="presets"
      :history="history"
      @save-preset="onSavePreset"
      @load-preset="onLoadPreset"
      @copy-preset="onCopyPreset"
      @delete-preset="onDeletePreset"
      @load-history="onLoadHistory"
      @resend-history="onResendHistory"
      @delete-history="onDeleteHistory"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { listModels } from '../api/client';
import type { ConnectionSettings, PromptPreset, RequestHistory, SendMode } from '../storage/localStore';
import WorkspaceLibrary from './WorkspaceLibrary.vue';

const props = defineProps<{
  connection: ConnectionSettings;
  presets: PromptPreset[];
  history: RequestHistory[];
  sendMode: SendMode;
  tavernAvailable: boolean;
  tavernError: string;
}>();

const emit = defineEmits<{
  (e: 'change', connection: ConnectionSettings): void;
  (e: 'send-mode-change', mode: SendMode): void;
  (e: 'save-preset', name: string): void;
  (e: 'load-preset', preset: PromptPreset): void;
  (e: 'copy-preset', preset: PromptPreset): void;
  (e: 'delete-preset', id: string): void;
  (e: 'load-history', entry: RequestHistory): void;
  (e: 'resend-history', entry: RequestHistory): void;
  (e: 'delete-history', id: string): void;
}>();

const models = ref<string[]>([]);
const loading = ref(false);
const error = ref('');
const revealKey = ref(false);
const manualModel = ref(true);

function patch(key: 'baseUrl' | 'apiKey' | 'model', value: string) {
  emit('change', { ...props.connection, [key]: value });
}

async function load() {
  if (props.sendMode === 'tavern') return;
  loading.value = true;
  error.value = '';
  try {
    const loadedModels = await listModels({
      baseUrl: props.connection.baseUrl,
      apiKey: props.connection.apiKey,
      model: props.connection.model,
    });
    models.value = loadedModels;
    manualModel.value = !loadedModels.includes(props.connection.model);
  } catch (reason) {
    error.value = `无法拉取模型：${reason instanceof Error ? reason.message : '未知错误'}`;
  } finally {
    loading.value = false;
  }
}

function onModelSelect(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (value === '__manual__') {
    manualModel.value = true;
    return;
  }
  manualModel.value = false;
  patch('model', value);
}

function onSavePreset(name: string) {
  emit('save-preset', name);
}
function onLoadPreset(preset: PromptPreset) {
  emit('load-preset', preset);
}
function onCopyPreset(preset: PromptPreset) {
  emit('copy-preset', preset);
}
function onDeletePreset(id: string) {
  emit('delete-preset', id);
}
function onLoadHistory(entry: RequestHistory) {
  emit('load-history', entry);
}
function onResendHistory(entry: RequestHistory) {
  emit('resend-history', entry);
}
function onDeleteHistory(id: string) {
  emit('delete-history', id);
}
</script>

<style scoped lang="scss">
.mode-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;

  button {
    min-height: 36px;
    border: 0;
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--muted);
    font-size: 0.74rem;
    font-weight: 650;
    box-shadow: var(--shadow-raised-small);

    &.active {
      background: var(--green-dark);
      color: #fff;
      box-shadow: var(--shadow-inset);
    }
  }
}
</style>
