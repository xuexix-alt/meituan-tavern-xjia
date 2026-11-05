<template>
  <button
    type="button"
    class="story-entry"
    :class="{ busy: session.busy.value, error: session.status.value === 'error' }"
    :aria-label="`打开正文，${statusText}`"
    @click="router.push('/story')"
  >
    <i class="fas fa-book-open"></i>
    <span>正文</span>
    <span v-if="session.busy.value" class="story-entry-dot" aria-hidden="true"></span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStorySession } from '../story/storyContext';

const router = useRouter();
const session = useStorySession();
const statusText = computed(() => {
  if (session.busy.value) return '正在生成';
  if (session.status.value === 'error') return '生成异常';
  if (session.latestAssistant.value) return '已有正文';
  return '尚未开始';
});
</script>

<style scoped lang="scss">
.story-entry {
  position: absolute;
  z-index: 24;
  top: 10px;
  right: var(--space-page);
  display: inline-grid;
  min-width: 96px;
  min-height: 44px;
  grid-template-columns: auto auto auto;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 195, 0, 0.7);
  border-radius: 8px;
  background: var(--accent-primary);
  color: #2c2500;
  box-shadow: var(--shadow-sm);
  font-weight: 800;
  transition:
    transform 140ms ease,
    filter 140ms ease;

  &:hover {
    transform: translateY(-1px);
    filter: brightness(1.03);
  }
  &:active {
    transform: scale(0.97);
  }
  &.error {
    border-color: var(--status-danger);
  }
}

.story-entry-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--status-danger);
  animation: entry-pulse 1s ease-in-out infinite;
}

@keyframes entry-pulse {
  50% {
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .story-entry,
  .story-entry-dot {
    transition: none;
    animation: none;
  }
}
</style>
