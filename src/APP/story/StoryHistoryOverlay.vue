<template>
  <div
    v-if="open"
    class="history-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="正文历史"
    @click.self="$emit('close')"
  >
    <section class="history-panel">
      <header>
        <div>
          <strong>正文历史</strong>
          <span>{{ items.length }} 条记录</span>
        </div>
        <button type="button" aria-label="关闭历史" @click="$emit('close')"><i class="fas fa-times"></i></button>
      </header>
      <div class="history-list">
        <article v-for="item in items" :key="`${item.messageId}-${item.isStreaming}`" class="history-item">
          <button type="button" class="history-summary" @click="toggle(item.messageId)">
            <span>{{ item.role === 'user' ? '玩家' : '正文' }} #{{ item.messageId }}</span>
            <span>{{ item.preview || (item.isStreaming ? '生成中' : '空消息') }}</span>
            <i class="fas" :class="expandedId === item.messageId ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
          </button>
          <StoryMessageBody v-if="expandedId === item.messageId" :item="item" class="history-body" />
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { StoryTranscriptItem } from './storyTypes';
import StoryMessageBody from './StoryMessageBody.vue';

const props = defineProps<{ open: boolean; items: StoryTranscriptItem[] }>();
defineEmits<{ (event: 'close'): void }>();
const expandedId = ref<number | null>(null);

function toggle(messageId: number) {
  expandedId.value = expandedId.value === messageId ? null : messageId;
}

watch(
  () => props.open,
  open => {
    if (!open) expandedId.value = null;
  },
);
</script>

<style scoped lang="scss">
.history-overlay {
  position: absolute;
  z-index: 30;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(24, 28, 32, 0.46);
  backdrop-filter: blur(6px);
}

.history-panel {
  display: flex;
  width: min(100%, 680px);
  max-height: 86%;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.22);

  > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    border-bottom: 1px solid var(--border-color);

    div {
      display: grid;
      gap: 2px;
    }

    span {
      color: var(--text-secondary);
      font-size: 12px;
    }

    button {
      width: 40px;
      min-height: 40px;
      border: 0;
      border-radius: 50%;
      background: var(--bg-card-light);
      color: var(--text-primary);
    }
  }
}

.history-list {
  display: grid;
  gap: 10px;
  padding: 14px;
  overflow-y: auto;
}

.history-item {
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-item);
}

.history-summary {
  display: grid;
  width: 100%;
  min-height: 48px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  text-align: left;

  span:nth-child(2) {
    overflow: hidden;
    color: var(--text-secondary);
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.history-body {
  padding: 14px 16px 18px;
  border-top: 1px solid var(--border-color);
}
</style>
