<template>
  <div class="phone-frame" :data-theme="currentTheme">
    <!-- 错误边界组件 -->
    <ErrorBoundary>
      <RouterView />
    </ErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onErrorCaptured, defineComponent, h } from 'vue';

// 当前主题
const currentTheme = ref<'light' | 'dark'>('light');

// 错误边界组件
const ErrorBoundary = defineComponent({
  name: 'ErrorBoundary',
  setup(_, { slots }) {
    const hasError = ref(false);
    const errorMessage = ref('');

    const error = ref<Error | null>(null);

    // 捕获子组件错误
    onErrorCaptured((err: Error) => {
      console.error('[错误边界] 捕获到组件错误:', err);
      error.value = err;
      hasError.value = true;
      errorMessage.value = err.message || '发生了未知错误';
      console.log('[系统提示] 页面出现错误，已自动恢复');
      return false; // 阻止错误继续传播
    });

    // 重试函数
    const retry = () => {
      hasError.value = false;
      error.value = null;
      errorMessage.value = '';
      // 强制重新渲染
      window.location.reload();
    };

    return () =>
      hasError.value
        ? h('div', { class: 'error-boundary' }, [
            h('div', { class: 'error-content' }, [
              h('i', { class: 'fas fa-exclamation-triangle' }),
              h('h3', '页面出现错误'),
              h('p', errorMessage.value),
              h(
                'button',
                {
                  class: 'retry-btn',
                  onClick: retry,
                },
                [h('i', { class: 'fas fa-redo' }), ' 重新加载'],
              ),
            ]),
          ])
        : slots.default?.();
  },
});

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
  --text-primary: #1a1a1a;
  --text-secondary: #555555;
  --text-placeholder: #888888;
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
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --text-placeholder: #707070;
  --text-price: #ff8a65;
  --border-color: #3a3a3a;
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
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-feature-settings: "kern" 1, "liga" 1;
  font-variant-ligatures: common-ligatures;
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
    transition: opacity 0.1s ease, transform 0.1s ease;
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
  width: 360px;
  height: 780px; // 从680px调整到780px，更符合19.5:9手机比例
  background: var(--bg-primary);
  border: 8px solid #1a1a1a;
  border-radius: 32px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.15) inset,
    0 10px 20px rgba(255, 195, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  &::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 6px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
    z-index: 10;
  }

  @media (max-width: 480px) {
    width: 95vw;
    max-width: 380px;
    // 使用aspect-ratio替代vh单位，确保高度与宽度成比例
    aspect-ratio: 360 / 780;
    max-height: 800px;
    // 设置最小高度，防止被压缩
    min-height: 600px;
    border-width: 6px;
    border-radius: 28px;
  }

  @media (max-width: 360px) {
    width: 100vw;
    // 使用aspect-ratio而不是100vh，确保比例一致
    aspect-ratio: 360 / 780;
    // 在极小屏幕上允许高度自适应，但保持最小值
    min-height: 100%;
    border-radius: 0;
    border: none;
    max-width: none;
    // 移除max-height限制，允许在非常小的屏幕上完全显示
    max-height: none;

    &::before {
      display: none;
    }
  }
}

// 错误边界样式
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--bg-primary);
  padding: 40px 20px;

  .error-content {
    text-align: center;
    color: var(--text-secondary);

    i {
      font-size: 4rem;
      color: var(--accent-primary);
      margin-bottom: 20px;
      display: block;
    }

    h3 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 12px 0;
      color: var(--text-primary);
    }

    p {
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin: 0 0 24px 0;
    }

    .retry-btn {
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-dark));
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 25px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
      display: inline-flex;
      align-items: center;
      gap: 8px;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 195, 0, 0.4);
      }

      i {
        font-size: 1rem;
        margin: 0;
      }
    }
  }
}
</style>
