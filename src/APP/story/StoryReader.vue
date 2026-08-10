<template>
  <div class="story-reader">
    <header class="reader-header">
      <button type="button" class="icon-button" aria-label="返回上一页" @click="router.back()">
        <i class="fas fa-arrow-left"></i>
      </button>
      <div class="reader-title">
        <strong>正文</strong>
        <span>{{ statusText }}</span>
      </div>
      <button type="button" class="icon-button" aria-label="查看正文历史" @click="historyOpen = true">
        <i class="fas fa-clock-rotate-left"></i>
      </button>
    </header>

    <main
      ref="readerScroller"
      class="reader-scroll"
      @touchmove.passive="handleManualScrollIntent"
      @wheel.passive="handleManualScrollIntent"
    >
      <div class="reader-column">
        <article v-if="relatedUser" class="user-note" :class="{ expanded: userExpanded }">
          <button type="button" @click="userExpanded = !userExpanded">
            <span>你的行动</span>
            <span>{{ relatedUser.preview }}</span>
            <i class="fas" :class="userExpanded ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
          </button>
          <StoryMessageBody v-if="userExpanded" :item="relatedUser" class="user-body" />
        </article>

        <article v-if="latestAssistant" class="story-paper" :class="{ streaming: latestAssistant.isStreaming }">
          <div class="paper-meta">
            <span>{{ latestAssistant.isStreaming ? '正在书写' : `楼层 #${latestAssistant.messageId}` }}</span>
            <span v-if="latestAssistant.isStreaming" class="stream-dot"></span>
          </div>
          <StoryMessageBody :item="latestAssistant" />

          <div v-if="!latestAssistant.isStreaming && latestAssistant.options.length" class="story-options">
            <button
              v-for="option in latestAssistant.options"
              :key="option"
              type="button"
              :disabled="session.busy.value"
              @click="submitChoice(option)"
            >
              {{ option }}
            </button>
          </div>

          <div v-if="!latestAssistant.isStreaming && latestAssistant.canRegenerate" class="paper-actions">
            <template v-if="rollbackConfirmId === latestAssistant.messageId">
              <span>删除当前及后续正文？</span>
              <button
                type="button"
                class="danger"
                :disabled="session.busy.value"
                @click="confirmRollback(latestAssistant.messageId)"
              >
                确认
              </button>
              <button type="button" :disabled="session.busy.value" @click="rollbackConfirmId = null">取消</button>
            </template>
            <template v-else>
              <button
                type="button"
                :disabled="session.busy.value"
                @click="session.regenerate(latestAssistant.messageId)"
              >
                <i class="fas fa-rotate-right"></i> 重新生成
              </button>
              <button
                type="button"
                class="danger"
                :disabled="session.busy.value"
                @click="rollbackConfirmId = latestAssistant.messageId"
              >
                <i class="fas fa-clock-rotate-left"></i> 回退
              </button>
            </template>
          </div>
        </article>

        <div v-else class="reader-empty">
          <i class="fas fa-book-open"></i>
          <strong>正文尚未开始</strong>
          <span>从套餐下单或在下方输入行动。</span>
        </div>

        <div v-if="session.error.value" class="reader-error" role="alert">
          <span>{{ session.error.value }}</span>
          <button
            v-if="session.canRetry.value"
            type="button"
            class="retry-button"
            :disabled="session.busy.value"
            @click="retryGeneration"
          >
            <i class="fas fa-rotate-right"></i>
            重试生成
          </button>
        </div>
      </div>
    </main>

    <footer class="reader-composer">
      <button
        type="button"
        class="reader-home-button"
        aria-label="返回首页"
        title="返回首页"
        @click="router.replace('/home')"
      >
        <i class="fas fa-house"></i>
      </button>
      <textarea
        v-model="session.composerText.value"
        rows="2"
        placeholder="输入接下来的行动..."
        :disabled="session.busy.value"
        @keydown.enter.exact.prevent="submitComposer"
      ></textarea>
      <button
        type="button"
        class="send-button"
        :class="{ cancel: session.busy.value }"
        :aria-label="session.busy.value ? '停止生成' : '发送行动'"
        @click="session.busy.value ? session.cancelGeneration() : submitComposer()"
      >
        <i class="fas" :class="session.busy.value ? 'fa-stop' : 'fa-paper-plane'"></i>
      </button>
    </footer>

    <StoryHistoryOverlay :open="historyOpen" :items="session.items.value" @close="historyOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStorySession } from './storyContext';
import StoryHistoryOverlay from './StoryHistoryOverlay.vue';
import StoryMessageBody from './StoryMessageBody.vue';

const router = useRouter();
const session = useStorySession();
const readerScroller = ref<HTMLElement | null>(null);
const historyOpen = ref(false);
const userExpanded = ref(false);
const rollbackConfirmId = ref<number | null>(null);
const shouldAutoFollow = ref(true);

const latestAssistant = computed(
  () => [...session.items.value].reverse().find(item => item.role === 'assistant') ?? null,
);
const relatedUser = computed(() => {
  const assistant = latestAssistant.value;
  if (!assistant) return null;
  const beforeId = assistant.messageId;
  return [...session.baseItems.value].reverse().find(item => item.role === 'user' && item.messageId < beforeId) ?? null;
});
const statusText = computed(() => {
  if (session.status.value === 'streaming') return '生成中';
  if (session.status.value === 'persisting') return '正在保存';
  if (session.status.value === 'error') return '生成异常';
  if (session.status.value === 'cancelled') return '已停止';
  return latestAssistant.value ? '已同步酒馆聊天' : '等待行动';
});

async function submitComposer() {
  const result = await session.submitPrompt();
  if (!result.accepted && result.error) session.error.value = result.error;
}

async function submitChoice(option: string) {
  session.composerText.value = option;
  await submitComposer();
}

async function retryGeneration() {
  await session.retryLast();
}

async function confirmRollback(messageId: number) {
  await session.rollbackFrom(messageId);
  rollbackConfirmId.value = null;
}

function handleManualScrollIntent(): void {
  shouldAutoFollow.value = false;
}

async function scrollToLatest(): Promise<void> {
  await nextTick();
  const scroller = readerScroller.value;
  if (scroller && shouldAutoFollow.value) {
    scroller.scrollTop = scroller.scrollHeight;
  }
}

watch(
  () => relatedUser.value?.messageId,
  () => {
    userExpanded.value = false;
  },
);

watch(
  () => session.status.value,
  async (status, previousStatus) => {
    if (status !== 'streaming' || previousStatus === 'streaming') return;
    shouldAutoFollow.value = true;
    await scrollToLatest();
  },
  { immediate: true },
);

watch(
  () => latestAssistant.value?.raw,
  async () => {
    await scrollToLatest();
  },
);

defineExpose<{ session: typeof session }>({ session });
</script>

<style scoped lang="scss">
.story-reader {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  background: var(--bg-primary);
}

.reader-header {
  z-index: 4;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 10px clamp(12px, 4vw, 18px);
  border-bottom: 1px solid var(--border-color);
  background: color-mix(in srgb, var(--bg-header) 94%, transparent);
}

.reader-title {
  display: grid;
  min-width: 0;
  justify-items: center;

  strong {
    font-size: clamp(18px, 5vw, 21px);
    letter-spacing: -0.01em;
  }
  span {
    color: var(--text-secondary);
    font-size: 12px;
  }
}

.icon-button {
  width: 44px;
  min-height: 44px;
  border: 0;
  border-radius: 50%;
  background: var(--bg-card-light);
  color: var(--text-primary);
}

.reader-scroll {
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding: 18px clamp(12px, 4vw, 28px) 30px;
}

.reader-column {
  display: grid;
  width: min(100%, 720px);
  margin: 0 auto;
  gap: 16px;
}

.user-note {
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-card-light);

  > button {
    display: grid;
    width: 100%;
    min-height: 48px;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border: 0;
    background: transparent;
    color: var(--text-primary);
    text-align: left;

    span:first-child {
      color: var(--accent-dark);
      font-size: 13px;
      font-weight: 700;
    }
    span:nth-child(2) {
      overflow: hidden;
      color: var(--text-secondary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.user-body {
  padding: 6px 16px 16px;
  border-top: 1px solid var(--border-color);
}

.story-paper {
  display: grid;
  gap: 16px;
  padding: clamp(20px, 5%, 32px);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: var(--bg-item);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.09);

  &.streaming {
    border-color: color-mix(in srgb, var(--accent-primary) 62%, var(--border-color));
  }
}

.paper-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 12px;
}

.stream-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent-primary);
  animation: story-pulse 1s ease-in-out infinite;
}

.story-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(180px, 100%), 1fr));
  gap: 10px;

  button {
    min-height: 44px;
    padding: 9px 12px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--bg-card-light);
    color: var(--text-primary);
    text-align: left;
  }
}

.paper-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 13px;

  span {
    margin-right: auto;
  }
  button {
    min-height: 38px;
    padding: 7px 11px;
    border: 0;
    border-radius: 8px;
    background: var(--bg-card-light);
    color: var(--text-primary);
  }
  .danger {
    color: var(--status-danger);
  }
}

.reader-empty,
.reader-error {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 36px 20px;
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  color: var(--text-secondary);
  text-align: center;

  i {
    color: var(--accent-dark);
    font-size: 28px;
  }
  strong {
    color: var(--text-primary);
  }
}

.reader-error {
  color: var(--status-danger);
  text-align: center;

  .retry-button {
    min-height: 44px;
    padding: 9px 18px;
    border: 0;
    border-radius: 8px;
    background: var(--accent-primary);
    color: #2c2500;
    font-weight: 700;

    i {
      color: inherit;
      font-size: 1rem;
    }
    &:disabled {
      cursor: wait;
      opacity: 0.55;
    }
  }
}

.reader-composer {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 48px;
  gap: 10px;
  padding: 10px clamp(12px, 4%, 24px) max(12px, env(safe-area-inset-bottom));
  border-top: 1px solid var(--border-color);
  background: color-mix(in srgb, var(--bg-header) 96%, transparent);
  backdrop-filter: blur(12px);

  textarea {
    width: 100%;
    min-height: 52px;
    max-height: 128px;
    resize: vertical;
    padding: 12px 14px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--bg-item);
    color: var(--text-primary);
    outline: none;

    &:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px rgba(255, 195, 0, 0.14);
    }
  }
}

.reader-home-button {
  width: 48px;
  min-height: 48px;
  align-self: end;
  border: 0;
  border-radius: 50%;
  background: var(--bg-card-light);
  color: var(--text-primary);
  transition:
    transform 120ms ease,
    background-color 120ms ease,
    filter 120ms ease;

  &:active {
    transform: scale(0.96);
    background: var(--bg-item-hover);
  }
}

.send-button {
  width: 48px;
  min-height: 48px;
  align-self: end;
  border: 0;
  border-radius: 50%;
  background: var(--accent-primary);
  color: #2c2500;
  transition:
    transform 120ms ease,
    background-color 120ms ease,
    filter 120ms ease;

  &:active {
    transform: scale(0.96);
  }

  &.cancel {
    background: var(--status-danger);
    color: white;
  }
}

@keyframes story-pulse {
  50% {
    opacity: 0.35;
    transform: scale(0.8);
  }
}

@media (prefers-reduced-motion: reduce) {
  .stream-dot {
    animation: none;
  }
}
</style>
