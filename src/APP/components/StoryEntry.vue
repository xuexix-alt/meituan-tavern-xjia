<template>
  <button
    v-if="visible"
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
import { useRoute, useRouter } from 'vue-router';
import { useStorySession } from '../story/storyContext';

const route = useRoute();
const router = useRouter();
const session = useStorySession();
const visibleRoutes = new Set(['/home', '/discover', '/service', '/history', '/me', '/lab']);
const visible = computed(() => visibleRoutes.has(route.path));
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
  left: 50%;
  bottom: 72px;
  display: inline-grid;
  min-width: 108px;
  min-height: 48px;
  grid-template-columns: auto auto auto;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid rgba(255, 195, 0, 0.7);
  border-radius: 8px;
  background: var(--accent-primary);
  color: #2c2500;
  box-shadow:
    0 8px 22px rgba(0, 0, 0, 0.2),
    0 0 0 3px color-mix(in srgb, var(--bg-primary) 86%, transparent);
  font-weight: 800;
  transform: translateX(-50%);
  transition:
    transform 140ms ease,
    filter 140ms ease;

  &:hover {
    transform: translateX(-50%) translateY(-2px);
    filter: brightness(1.03);
  }
  &:active {
    transform: translateX(-50%) scale(0.97);
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

@media (max-width: 420px) {
  .story-entry {
    bottom: 68px;
    min-width: 96px;
    min-height: 44px;
    padding: 8px 13px;
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
