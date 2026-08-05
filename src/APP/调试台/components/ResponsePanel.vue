<template>
  <div v-if="run.status === 'idle'" class="empty-state response-empty">
    <span class="empty-glyph" aria-hidden="true">›_</span>
    <strong>等待发送请求</strong>
    <span>响应文本、原始事件和诊断信息将显示在这里。</span>
  </div>

  <section v-else class="response-panel" aria-label="响应结果">
    <div class="response-status-row">
      <span class="status-dot" :class="`status-${run.status}`" aria-hidden="true"></span>
      <strong>{{ statusLabels[run.status] }}</strong>
      <span>{{ run.durationMs }} 毫秒</span>
    </div>
    <div class="response-tabs" role="tablist" aria-label="响应视图">
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'text'"
        :class="{ active: tab === 'text' }"
        @click="tab = 'text'"
      >
        <i class="fas fa-message" aria-hidden="true"></i>文本
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'raw'"
        :class="{ active: tab === 'raw' }"
        @click="tab = 'raw'"
      >
        <i class="fas fa-code" aria-hidden="true"></i>原始数据
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'diagnostics'"
        :class="{ active: tab === 'diagnostics' }"
        @click="tab = 'diagnostics'"
      >
        <i class="fas fa-chart-line" aria-hidden="true"></i>诊断
      </button>
    </div>
    <div class="response-content">
      <template v-if="tab === 'text'">
        <p v-if="run.error" class="response-error">{{ run.error }}</p>
        <p v-if="run.status === 'cancelled' && !run.text" class="muted-state">已取消</p>
        <template v-if="run.text">
          <div class="response-actions">
            <button class="secondary-button" type="button" @click="downloadText">
              <i class="fas fa-download" aria-hidden="true"></i> 导出 TXT
            </button>
          </div>
          <pre class="response-text">{{ run.text }}</pre>
        </template>
        <pre v-if="run.toolCalls.length > 0" class="tool-output">{{ JSON.stringify(run.toolCalls, null, 2) }}</pre>
      </template>

      <template v-if="tab === 'raw'">
        <pre class="response-raw">{{ run.rawFrames.join('\n\n') || run.errorBody || '没有原始响应内容。' }}</pre>
      </template>

      <dl v-if="tab === 'diagnostics'" class="diagnostics-grid">
        <dt>状态</dt>
        <dd>{{ statusLabels[run.status] }}</dd>
        <dt>HTTP 状态码</dt>
        <dd>{{ run.httpStatus ?? '—' }}</dd>
        <dt>耗时</dt>
        <dd>{{ run.durationMs }} 毫秒</dd>
        <dt>结束原因</dt>
        <dd>{{ run.finishReason ?? '—' }}</dd>
        <dt>请求 ID</dt>
        <dd>{{ run.requestId ?? '—' }}</dd>
        <dt>输入 Token</dt>
        <dd>{{ run.usage?.prompt_tokens ?? '—' }}</dd>
        <dt>输出 Token</dt>
        <dd>{{ run.usage?.completion_tokens ?? '—' }}</dd>
        <dt>Token 总数</dt>
        <dd>{{ run.usage?.total_tokens ?? '—' }}</dd>
        <dt>解析错误</dt>
        <dd>{{ run.parserErrors.length }}</dd>
      </dl>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ChatRunState } from '../useDebugLab';

const props = defineProps<{
  run: ChatRunState;
}>();

type ResponseTab = 'text' | 'raw' | 'diagnostics';
const tab = ref<ResponseTab>('text');

const statusLabels: Record<ChatRunState['status'], string> = {
  idle: '待命',
  sending: '正在发送',
  streaming: '正在接收',
  success: '成功',
  error: '错误',
  cancelled: '已取消',
};

function responseFileName(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `deepseek-response-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.txt`;
}

function downloadText() {
  const content = props.run.text;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = responseFileName();
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
</script>
