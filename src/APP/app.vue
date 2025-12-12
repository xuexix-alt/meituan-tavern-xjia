<template>
  <div class="phone-frame" :data-theme="currentTheme">
    <!-- 错误边界组件 -->
    <ErrorBoundary>
      <RouterView />
    </ErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onErrorCaptured } from 'vue';
import ErrorBoundary from './components/ErrorBoundary.vue';

// 当前主题
const currentTheme = ref<'light' | 'dark'>('light');

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
});

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
  width: 100%;
  height: 1024px; // 增大高度，模拟平板竖屏
  background: var(--bg-primary);
  border: 12px solid #1a1a1a;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.15) inset,
    0 10px 20px rgba(255, 195, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  @media (max-width: 768px) {
    border-width: 8px;
    border-radius: 16px;
  }
}
</style>
