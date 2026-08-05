<template>
  <Transition name="generation-status">
    <section v-if="state.status !== 'idle'" class="generation-status" :class="`is-${state.status}`" aria-live="polite">
      <div class="status-icon" aria-hidden="true">
        <i v-if="state.status === 'running' || state.status === 'parsing'" class="fas fa-spinner fa-spin"></i>
        <i v-else-if="state.status === 'success'" class="fas fa-circle-check"></i>
        <i v-else-if="state.status === 'error'" class="fas fa-circle-exclamation"></i>
        <i v-else class="fas fa-ban"></i>
      </div>

      <div class="status-copy">
        <strong>{{ title }}</strong>
        <span v-if="state.status === 'running'">{{ elapsedText }}</span>
        <span v-else-if="state.status === 'error'">{{ state.error }}</span>
      </div>

      <button v-if="state.status === 'success'" class="view-command" @click="openDiscover">查看发现</button>
      <button
        v-if="isBusy"
        class="icon-command"
        type="button"
        title="停止生成"
        aria-label="停止生成"
        @click="generationTask.cancel"
      >
        <i class="fas fa-stop"></i>
      </button>
      <button
        v-else-if="state.status === 'error' || state.status === 'cancelled'"
        class="icon-command"
        type="button"
        title="关闭状态"
        aria-label="关闭状态"
        @click="generationTask.dismiss"
      >
        <i class="fas fa-xmark"></i>
      </button>
    </section>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { generationTask } from '../services/generationTaskSingleton';

const router = useRouter();
const state = generationTask.state;
const isBusy = generationTask.isBusy;
const now = ref(Date.now());
let clock: number | null = null;

const elapsedText = computed(() => {
  if (state.value.startedAt === null) return '';
  return `已用时 ${Math.max(0, Math.floor((now.value - state.value.startedAt) / 1000))} 秒`;
});

const title = computed(() => {
  switch (state.value.status) {
    case 'running':
      return `正在生成“${state.value.label}”`;
    case 'parsing':
      return '正在解析店铺数据…';
    case 'success':
      return `已写入 ${state.value.parsedCount} 家店铺、${state.value.packageCount} 个套餐`;
    case 'error':
      return '生成失败';
    case 'cancelled':
      return '已停止生成';
    default:
      return '';
  }
});

function openDiscover(): void {
  generationTask.dismiss();
  void router.push('/discover');
}

onMounted(() => {
  clock = window.setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onBeforeUnmount(() => {
  if (clock !== null) window.clearInterval(clock);
});
</script>

<style scoped lang="scss">
.generation-status {
  position: absolute;
  z-index: 30;
  inset: 0 0 auto;
  height: 48px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px 6px 14px;
  color: var(--text-primary);
  background: var(--bg-header);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
}

.status-icon {
  width: 24px;
  flex: 0 0 24px;
  text-align: center;
  color: var(--accent-dark);
}

.status-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  line-height: 1.25;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: 13px;
  }

  span {
    margin-top: 2px;
    color: var(--text-secondary);
    font-size: 11px;
  }
}

.view-command {
  min-height: 32px;
  flex: 0 0 auto;
  padding: 0 9px;
  color: #fff;
  background: var(--status-success);
  border: 0;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.icon-command {
  width: 34px;
  height: 34px;
  min-width: 34px;
  flex: 0 0 34px;
  display: grid;
  place-items: center;
  padding: 0;
  color: var(--text-secondary);
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
}

.icon-command:hover {
  color: var(--text-primary);
  background: var(--bg-item-hover);
}

.is-success .status-icon {
  color: var(--status-success);
}

.is-error .status-icon {
  color: var(--status-danger);
}

.is-cancelled .status-icon {
  color: var(--status-warning);
}

.generation-status-enter-active,
.generation-status-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.generation-status-enter-from,
.generation-status-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
