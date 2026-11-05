<template>
  <div
    class="phone-frame"
    :class="{
      'has-generation-status': hasGenerationStatus,
      'has-story-entry': hasStoryEntry,
      'is-story-reader': isStoryRoute,
      'is-compact': hostHeight !== null && hostHeight < 440,
    }"
    :data-theme="currentTheme"
    :style="hostHeight === null ? undefined : { '--app-height': `${hostHeight}px` }"
  >
    <GenerationStatus />
    <StoryEntry v-if="hasStoryEntry" />
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
import { applyReaderTypography, loadReaderTypography } from './story/readerTypography';
import { observeHostPanelHeight } from './hostViewport';

// 当前主题
const currentTheme = ref<'light' | 'dark'>('light');
const hasGenerationStatus = computed(() => generationTask.state.value.status !== 'idle');
const route = useRoute();
const isStoryRoute = computed(() => route.path === '/story');
const hasStoryEntry = computed(() =>
  ['/home', '/discover', '/service', '/history', '/me', '/lab'].includes(route.path),
);
const hostHeight = ref<number | null>(null);
let stopHostViewport = () => {};
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
  stopHostViewport = observeHostPanelHeight(height => {
    hostHeight.value = height;
  });
  initTheme();
  applyReaderTypography(loadReaderTypography(localStorage));
  storySession.bind();
  window.addEventListener('pagehide', disposeAppSessions);
});

onBeforeUnmount(() => {
  window.removeEventListener('pagehide', disposeAppSessions);
  disposeAppSessions();
});

function disposeAppSessions() {
  stopHostViewport();
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
  --radius-control: 10px;
  --radius-card: 14px;
  --radius-panel: 18px;
  --touch-target: 44px;
  --space-page: clamp(12px, 4%, 18px);
  --shadow-card: 0 8px 24px rgba(0, 0, 0, 0.07);
  --shadow-floating: 0 12px 28px rgba(0, 0, 0, 0.14);
  /* 状态颜色 */
  --status-success: #66bb6a;
  --status-info: #42a5f5;
  --status-warning: #ffa726;
  --status-danger: #ef5350;
  /* 渐变 */
  --badge-danger-gradient: linear-gradient(135deg, #ff4a4a 0%, #ff6b6b 100%);
  --badge-info-gradient: linear-gradient(135deg, #42a5f5 0%, #478ed1 100%);
  /* 品牌渐变文字：浅色主题下用深金保证对比度（大字号 ≥3:1，小字号 ≥4.5:1） */
  --brand-text-gradient: linear-gradient(135deg, #8f6b00 0%, #6e5300 100%);
  /* 金色背景上的前景文字色（对比度 ≈9:1） */
  --on-accent: #2c2500;
  /* 可读金色文字：浅色背景上使用深金（≈5:1），深色主题覆盖为亮金 */
  --accent-text: #7a6000;
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
  --radius-control: 10px;
  --radius-card: 14px;
  --radius-panel: 18px;
  --touch-target: 44px;
  --space-page: clamp(12px, 4%, 18px);
  --shadow-card: 0 8px 24px rgba(0, 0, 0, 0.28);
  --shadow-floating: 0 12px 28px rgba(0, 0, 0, 0.46);
  /* 状态颜色 - 深色模式下调整亮度 */
  --status-success: #66bb6a;
  --status-info: #42a5f5;
  --status-warning: #ffb74d;
  --status-danger: #e57373;
  /* 渐变 - 深色模式下调整 */
  --badge-danger-gradient: linear-gradient(135deg, #ff5252 0%, #ff8a80 100%);
  --badge-info-gradient: linear-gradient(135deg, #29b6f6 0%, #4fc3f7 100%);
  /* 深色主题下品牌渐变文字用亮金（深底对比度 ≈10:1） */
  --brand-text-gradient: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-light) 100%);
  /* 深色主题下可读金色文字用亮金 */
  --accent-text: var(--accent-light);
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

/* 低特异性重置：允许 scoped 样式正常覆盖字体等属性（原先 #app 前缀的 ID 特异性会压过所有按钮/输入框的字号字重设置） */
button,
input,
textarea,
select {
  font: inherit;
  min-width: 0;
  max-width: 100%;
  touch-action: manipulation;
}

#app button:focus-visible,
#app input:focus-visible,
#app textarea:focus-visible,
#app select:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--accent-primary) 70%, transparent);
  outline-offset: 2px;
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

  /* 输入框增加触控区域（保持高特异性，确保覆盖 scoped 字号，防止 iOS 聚焦缩放） */
  #app input,
  #app select,
  #app textarea {
    font-size: 16px;
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
  width: 100%;
  max-width: 100%;
  min-height: 0;
  height: var(--app-height, auto);
  max-height: var(--app-height, 900px);
  aspect-ratio: 4 / 3;
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
  transition:
    background-color 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    border-color 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  @media (max-width: 768px) {
    aspect-ratio: 3 / 5;
    border-radius: 12px;
  }

  @media (max-width: 420px) {
    border-radius: 10px;
  }
}

.phone-frame :deep(.app-view) {
  display: flex;
  flex-direction: column;
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
  min-height: 56px;
  padding: 10px var(--space-page);
  background: color-mix(in srgb, var(--bg-header) 94%, transparent);
  box-shadow: 0 1px 0 color-mix(in srgb, var(--border-color) 75%, transparent);
}

// 正文入口占用顶栏的预留位置，不覆盖公告、列表或其他顶栏操作。
.phone-frame.has-story-entry :deep(.app-header),
.phone-frame.has-story-entry :deep(.lab-back-row) {
  padding-right: calc(var(--space-page) + 108px);
}

.phone-frame :deep(.app-header .title) {
  min-width: 0;
  gap: 10px;
  flex-wrap: nowrap;
}

.phone-frame :deep(.app-header .title > i) {
  flex-shrink: 0;
}

.phone-frame :deep(.app-header .title > span) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.phone-frame :deep(.app-header button),
.phone-frame :deep(.app-header .title > i) {
  min-width: var(--touch-target);
  min-height: var(--touch-target);
}

.phone-frame :deep(.app-content) {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-page);
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}

.phone-frame :deep(.nav-bar) {
  min-width: 0;
  min-height: 64px;
  padding: 8px var(--space-page) max(8px, env(safe-area-inset-bottom));
  gap: 4px;
  border-top: 1px solid color-mix(in srgb, var(--border-color) 78%, transparent);
  background: color-mix(in srgb, var(--bg-header) 96%, transparent);
}

.phone-frame :deep(.nav-item) {
  /* nav-item 为 button 元素时的默认样式重置 */
  background: transparent;
  border: none;
  padding: 4px 0;
  min-width: 0;
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  margin-inline: 1px;
  border-radius: 12px;
  text-align: center;
  transition:
    background-color 120ms ease,
    color 120ms ease,
    transform 120ms ease;
}

.phone-frame :deep(.nav-item.active) {
  background: var(--bg-item-hover);
  color: var(--text-primary);
}

.phone-frame :deep(.nav-item.active i) {
  color: var(--accent-dark);
}

.phone-frame :deep(.card),
.phone-frame :deep(.shop-card),
.phone-frame :deep(.package-card),
.phone-frame :deep(.history-card),
.phone-frame :deep(.status-card),
.phone-frame :deep(.detail-info-card),
.phone-frame :deep(.service-item),
.phone-frame :deep(.review-item) {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.phone-frame.has-generation-status :deep(.story-entry) {
  top: 58px;
}

.phone-frame :deep(.modal-content),
.phone-frame :deep(.reorder-modal-content) {
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-floating);
}

@media (hover: none) and (pointer: coarse) {
  .phone-frame :deep(button:not(:disabled):active),
  .phone-frame :deep(.nav-item:active),
  .phone-frame :deep(.shop-card:active),
  .phone-frame :deep(.package-card:active),
  .phone-frame :deep(.history-card:active) {
    transform: scale(0.98);
  }
}

@media (prefers-reduced-motion: reduce) {
  .phone-frame :deep(.nav-item),
  .phone-frame :deep(button) {
    transition: none;
  }
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
  grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

@container (min-width: 620px) {
  .phone-frame :deep(.category-grid) {
    grid-template-columns: repeat(8, minmax(0, 1fr));
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
  min-width: 0;
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

@media (max-width: 768px) {
  .phone-frame :deep(.detail-footer) {
    padding: 10px var(--space-page) max(12px, env(safe-area-inset-bottom));
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.08);
  }

  .phone-frame :deep(.modal-overlay),
  .phone-frame :deep(.reorder-modal-overlay) {
    align-items: flex-end;
    padding: 12px var(--space-page) max(12px, env(safe-area-inset-bottom));
  }

  .phone-frame :deep(.modal-content),
  .phone-frame :deep(.reorder-modal-content) {
    width: 100%;
    max-height: calc(100% - 24px);
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .phone-frame :deep(.search-bar-container) {
    min-height: 52px;
    gap: 8px;
    padding: 6px 8px 6px 14px;
    border-radius: var(--radius-panel);
  }
}

@container (max-width: 399px) {
  .phone-frame :deep(.import-btn span) {
    display: none;
  }
}

// 短屏保留搜索和正文操作空间，触控目标仍至少为 44px。
.phone-frame.is-compact :deep(.app-header) {
  min-height: 52px;
  padding-block: 4px;
}

.phone-frame.is-compact :deep(.app-header .title) {
  font-size: 1rem;
}

.phone-frame.is-compact :deep(.story-entry) {
  top: 5px;
}

.phone-frame.is-compact.has-generation-status :deep(.story-entry) {
  top: 53px;
}

.phone-frame.is-compact :deep(.nav-bar) {
  min-height: 52px;
  padding-block: 4px max(4px, env(safe-area-inset-bottom));
}

.phone-frame.is-compact :deep(.nav-item) {
  gap: 2px;
  font-size: 11px;
  line-height: 1.2;
}

.phone-frame.is-compact :deep(.nav-item i) {
  margin-bottom: 0;
  font-size: 17px;
}

.phone-frame.is-compact :deep(.brand-banner) {
  padding: 10px 14px;
  margin-bottom: 12px;
}

.phone-frame.is-compact :deep(.brand-banner h2) {
  font-size: 18px;
}

.phone-frame.is-compact :deep(.brand-subtitle) {
  display: none;
}

.phone-frame.is-compact :deep(.reader-header) {
  min-height: 52px;
  padding-block: 4px;
}

.phone-frame.is-compact :deep(.reader-composer) {
  padding-block: 6px max(6px, env(safe-area-inset-bottom));
}

.phone-frame.is-compact :deep(.reader-composer textarea) {
  height: 48px;
  min-height: 44px;
  padding-block: 8px;
}
</style>
