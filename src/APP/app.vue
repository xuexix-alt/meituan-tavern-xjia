<template>
  <div
    class="phone-frame"
    :class="{ 'has-generation-status': hasGenerationStatus, 'is-story-reader': isStoryRoute }"
    :data-theme="currentTheme"
  >
    <GenerationStatus />
    <StoryEntry />
    <!-- 错误边界组件 -->
    <ErrorBoundary>
      <RouterView />
    </ErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, onMounted, onErrorCaptured } from 'vue';
import { useRoute } from 'vue-router';
import ErrorBoundary from './components/ErrorBoundary.vue';
import GenerationStatus from './components/GenerationStatus.vue';
import StoryEntry from './components/StoryEntry.vue';
import { generationTask } from './services/generationTaskSingleton';
import { provideStorySession } from './story/storyContext';
import { createDefaultStorySession } from './story/storyTavern';

// 当前主题
const currentTheme = ref<'light' | 'dark'>('light');
const hasGenerationStatus = computed(() => generationTask.state.value.status !== 'idle');
const route = useRoute();
const isStoryRoute = computed(() => route.path === '/story');
const storySession = createDefaultStorySession();
provideStorySession(storySession);

// 初始化主题
function initTheme() {
  // 从localStorage读取保存的主题设置，默认为浅色
  const savedTheme = localStorage.getItem('app-theme') || 'light';
  const isDark = savedTheme === 'dark';

  // 设置Vue响应式数据
  currentTheme.value = savedTheme as 'light' | 'dark';

  // 同时设置到documentElement，确保CSS变量能正确应用
  document.documentElement.setAttribute('data-theme', savedTheme);

  console.log(`[主题初始化] 已加载${isDark ? '深色' : '浅色'}模式`);
}

// 在组件挂载时初始化主题
onMounted(() => {
  initTheme();
  storySession.bind();
  window.addEventListener('pagehide', disposeAppSessions);
});

onBeforeUnmount(() => {
  window.removeEventListener('pagehide', disposeAppSessions);
  disposeAppSessions();
});

function disposeAppSessions() {
  generationTask.dispose();
  storySession.dispose();
}

// 监听主题切换事件
window.addEventListener('theme-change', (event: any) => {
  const newTheme = event.detail.isDark ? 'dark' : 'light';
  currentTheme.value = newTheme;
  document.documentElement.setAttribute('data-theme', newTheme);
  console.log(`[主题切换] 已切换到${newTheme === 'dark' ? '深色' : '浅色'}模式`);
});

// 全局错误处理
onErrorCaptured((err: Error) => {
  console.error('[全局错误] 根组件错误:', err);
  return false;
});
</script>

<style lang="scss">
// 全局主题CSS变量 - 定义在根节点，确保所有组件都能访问
:root {
  /* 浅色主题 */
  --bg-primary: #f8f9fa;
  --bg-header: #ffffff;
  --bg-header-light: #fafbfc;
  --bg-card: linear-gradient(135deg, #ffffff 0%, #fffef8 100%);
  --bg-card-light: #f8f9fa;
  --bg-item: #ffffff;
  --bg-item-hover: #fff9e6;
  --bg-badge: linear-gradient(135deg, #fff9e6, #fff);
  --text-primary: #2c3e50; /* 更柔和的深色 */
  --text-secondary: #606f7b; /* 更清晰的次级文本色 */
  --text-placeholder: #95a5a6;
  --text-price: #ff6b6b;
  --border-color: #e0e0e0;
  --border-accent: rgba(255, 195, 0, 0.15);
  --accent-primary: #ffc300;
  --accent-light: #ffd54f;
  --accent-dark: #e6b000;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
  /* 状态颜色 */
  --status-success: #66bb6a;
  --status-info: #42a5f5;
  --status-warning: #ffa726;
  --status-danger: #ef5350;
  /* 渐变 */
  --badge-danger-gradient: linear-gradient(135deg, #ff4a4a 0%, #ff6b6b 100%);
  --badge-info-gradient: linear-gradient(135deg, #42a5f5 0%, #478ed1 100%);
}

[data-theme='dark'] {
  /* 深色主题 */
  --bg-primary: #1a1a1a;
  --bg-header: #2d2d2d;
  --bg-header-light: #252525;
  --bg-card: linear-gradient(135deg, #2d2d2d 0%, #252525 100%);
  --bg-card-light: #252525;
  --bg-item: #2d2d2d;
  --bg-item-hover: #353535;
  --bg-badge: linear-gradient(135deg, #3a3a3a, #2d2d2d);
  --text-primary: #ffffff; /* 纯白色，提高对比度 */
  --text-secondary: #e0e0e0; /* 亮灰色，增强可读性 */
  --text-placeholder: #9e9e9e; /* 更亮的占位符颜色 */
  --text-price: #ffab91; /* 更柔和的价格颜色 */
  --border-color: #404040; /* 更明显的边框色 */
  --border-accent: rgba(255, 195, 0, 0.3);
  --accent-primary: #ffc300;
  --accent-light: #ffd54f;
  --accent-dark: #e6b000;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.5);
  /* 状态颜色 - 深色模式下调整亮度 */
  --status-success: #66bb6a;
  --status-info: #42a5f5;
  --status-warning: #ffb74d;
  --status-danger: #e57373;
  /* 渐变 - 深色模式下调整 */
  --badge-danger-gradient: linear-gradient(135deg, #ff5252 0%, #ff8a80 100%);
  --badge-info-gradient: linear-gradient(135deg, #29b6f6 0%, #4fc3f7 100%);
}

/* 全局字体优化 */
body {
  margin: 0;
  font-family:
    'PingFang SC',
    'Microsoft YaHei',
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-feature-settings:
    'kern' 1,
    'liga' 1;
  font-variant-ligatures: common-ligatures;
  font-size: 16px; /* 基础字号调整 */
  line-height: 1.6; /* 增加行高 */
  color: var(--text-primary);
}

html,
body,
#app {
  width: 100%;
  max-width: 100%;
}

#app {
  display: block;
}

#app,
#app * {
  box-sizing: border-box;
}

#app img,
#app video,
#app canvas,
#app svg {
  max-width: 100%;
}

#app button,
#app input,
#app textarea,
#app select {
  font: inherit;
  min-width: 0;
  max-width: 100%;
}

/* 深色模式下字体渲染优化 */
[data-theme='dark'] body,
[data-theme='dark'] {
  font-weight: 400;
  letter-spacing: 0.2px;
}

/* 深色模式下特殊元素字体 */
[data-theme='dark'] .user-name,
[data-theme='dark'] .stat-value,
[data-theme='dark'] .service-name {
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* 深色模式下所有组件的字体优化 */
[data-theme='dark'] * {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 移动端触控优化 - 针对无hover设备和粗指针（触摸屏） */
@media (hover: none) and (pointer: coarse) {
  /* 移除移动端无效的hover效果，增强点击反馈 */
  body button:hover,
  body .nav-item:hover,
  body .category-item:hover {
    transform: none;
  }

  body .category-item:active .icon-wrapper,
  body button:active,
  body .nav-item:active {
    opacity: 0.7;
    transform: scale(0.95);
    transition:
      opacity 0.1s ease,
      transform 0.1s ease;
  }

  /* 增加触控目标最小尺寸（WCAG 2.1 AA标准） */
  body button,
  body .nav-item,
  body .category-item,
  body .dlc-button,
  body .search-btn,
  body .retry-btn {
    min-height: 44px;
    min-width: 44px;
  }

  /* 导航项特别优化 */
  body .nav-item {
    padding: 12px 0;
  }

  /* 输入框增加触控区域 */
  body input,
  body select,
  body textarea {
    font-size: 16px; /* 防止iOS自动缩放 */
    min-height: 44px;
  }

  /* 移除移动端不需要的复杂hover动画 */
  body .icon-wrapper:hover::before,
  body .search-bar-container:hover::before,
  body .dlc-button:hover::before {
    animation: none;
    transition: none;
  }
}
</style>

<style lang="scss" scoped>
.phone-frame {
  width: min(100%, 640px);
  max-width: 100%;
  min-height: min(720px, calc(100vw * 1.7));
  height: auto;
  max-height: 1024px;
  aspect-ratio: 10 / 16;
  background: var(--bg-primary);
  border: 1px solid var(--border-accent);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  margin: 0 auto;
  container-type: inline-size;
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.15) inset,
    0 10px 20px rgba(255, 195, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  @media (max-width: 768px) {
    width: 100%;
    min-height: min(680px, calc(100vw * 1.85));
    border-radius: 12px;
  }

  @media (max-width: 420px) {
    min-height: min(640px, calc(100vw * 1.95));
    border-radius: 10px;
  }
}

.phone-frame.is-story-reader {
  width: min(100%, 820px);
  max-width: 820px;
  min-height: min(1094px, calc(100vw * 1.3333));
  max-height: 1094px;
  aspect-ratio: 3 / 4;
}

@media (max-width: 768px) {
  .phone-frame.is-story-reader {
    width: 100%;
    min-height: min(980px, calc(100vw * 1.85));
    border-radius: 10px;
  }
}

.phone-frame :deep(.app-view) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  transition:
    top 0.18s ease,
    height 0.18s ease;
}

.phone-frame.has-generation-status :deep(.app-view) {
  top: 48px;
  height: calc(100% - 48px);
}

.phone-frame :deep(.app-header) {
  min-width: 0;
  padding-top: clamp(14px, 5%, 28px);
  padding-right: clamp(12px, 4%, 20px);
  padding-bottom: 12px;
  padding-left: clamp(12px, 4%, 20px);
}

.phone-frame :deep(.app-header .title) {
  min-width: 0;
  flex-wrap: wrap;
}

.phone-frame :deep(.app-content) {
  min-width: 0;
  padding: clamp(12px, 4%, 18px);
  overscroll-behavior: contain;
}

.phone-frame :deep(.nav-bar) {
  min-width: 0;
  padding-inline: clamp(4px, 2%, 12px);
}

.phone-frame :deep(.nav-item) {
  min-width: 0;
  margin-inline: 1px;
  text-align: center;
}

.phone-frame :deep(.nav-item span) {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.phone-frame :deep(.category-grid),
.phone-frame :deep(.metrics-grid),
.phone-frame :deep(.body-feature-grid .feature-row),
.phone-frame :deep(.stats-grid),
.phone-frame :deep(.clothing-grid),
.phone-frame :deep(.order-info-grid),
.phone-frame :deep(.section-grid),
.phone-frame :deep(.key-metrics) {
  grid-template-columns: repeat(auto-fit, minmax(min(138px, 100%), 1fr));
}

// 店铺卡片包含图标、文字和删除按钮，窄屏下至少保留可读宽度，避免三列挤压内容。
.phone-frame :deep(.shop-list-items) {
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
}

.phone-frame :deep(.settings-list) {
  grid-template-columns: 1fr;
}

@container (min-width: 520px) {
  .phone-frame :deep(.settings-list) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.phone-frame :deep(.category-grid) {
  grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
  gap: clamp(10px, 3%, 16px);
}

.phone-frame :deep(.slogan-content-wrapper) {
  flex-direction: column;
  align-items: stretch;
}

.phone-frame :deep(.slogan-content) {
  padding-right: 0;
  border-right: 0;
}

.phone-frame :deep(.slogan-title .title-line) {
  font-size: clamp(1.45rem, 8cqw, 1.8rem);
}

@container (min-width: 600px) {
  .phone-frame :deep(.slogan-content-wrapper) {
    flex-direction: row;
    align-items: center;
  }

  .phone-frame :deep(.slogan-content) {
    padding-right: 20px;
    border-right: 1px solid rgba(255, 195, 0, 0.2);
  }
}

.phone-frame :deep(.search-bar-container),
.phone-frame :deep(.order-status-row),
.phone-frame :deep(.bottom-section),
.phone-frame :deep(.status-time),
.phone-frame :deep(.rating-section),
.phone-frame :deep(.tabs-container) {
  flex-wrap: wrap;
}

.phone-frame :deep(.search-bar-container input) {
  min-width: 120px;
}

.phone-frame :deep(.search-btn) {
  flex-shrink: 0;
}

.phone-frame :deep(.shop-card),
.phone-frame :deep(.settings-item),
.phone-frame :deep(.feature-item),
.phone-frame :deep(.stat-item),
.phone-frame :deep(.clothing-item),
.phone-frame :deep(.compact-row) {
  min-width: 0;
}

.phone-frame :deep(.settings-icon) {
  flex: 0 0 40px;
}

.phone-frame :deep(.settings-info) {
  min-width: 0;
}

.phone-frame :deep(.settings-toggle),
.phone-frame :deep(.settings-arrow) {
  flex: 0 0 auto;
}

.phone-frame :deep(.notice-text),
.phone-frame :deep(.instruction-text),
.phone-frame :deep(.psychology-text),
.phone-frame :deep(.desc-text),
.phone-frame :deep(.section-content),
.phone-frame :deep(.section-item-value),
.phone-frame :deep(.info-value),
.phone-frame :deep(.stat-value),
.phone-frame :deep(.feature-value),
.phone-frame :deep(.clothing-value),
.phone-frame :deep(.identity-text),
.phone-frame :deep(.package-name),
.phone-frame :deep(.settings-title),
.phone-frame :deep(.settings-desc) {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.phone-frame :deep(.reorder-modal-overlay),
.phone-frame :deep(.modal-overlay) {
  position: absolute;
}

.phone-frame :deep(.reorder-modal-content) {
  width: 100%;
  height: 100%;
  border-radius: 12px;
}

.phone-frame :deep(.modal-content) {
  width: min(100%, 450px);
  max-height: calc(100% - 32px);
  overflow-y: auto;
}
</style>
