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
  setup(_, { slots, emit }) {
    const hasError = ref(false);
    const errorMessage = ref('');

    const error = ref<Error | null>(null);

    // 捕获子组件错误
    onErrorCaptured((err: Error) => {
      console.error('[错误边界] 捕获到组件错误:', err);
      error.value = err;
      hasError.value = true;
      errorMessage.value = err.message || '发生了未知错误';
      toastr.error('页面出现错误，已自动恢复', '系统提示');
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

    return () => hasError.value
      ? h('div', { class: 'error-boundary' }, [
          h('div', { class: 'error-content' }, [
            h('i', { class: 'fas fa-exclamation-triangle' }),
            h('h3', '页面出现错误'),
            h('p', errorMessage.value),
            h('button', {
              class: 'retry-btn',
              onClick: retry
            }, [
              h('i', { class: 'fas fa-redo' }),
              ' 重新加载'
            ])
          ])
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
  --text-price: #FF6B6B;
  --border-color: #e0e0e0;
  --border-accent: rgba(255, 195, 0, 0.15);
  --accent-primary: #ffc300;
  --accent-light: #FFD54F;
  --accent-dark: #e6b000;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
  /* 状态颜色 */
  --status-success: #66BB6A;
  --status-info: #42A5F5;
  --status-warning: #FFA726;
  --status-danger: #EF5350;
  /* 渐变 */
  --badge-danger-gradient: linear-gradient(135deg, #ff4a4a 0%, #ff6b6b 100%);
  --badge-info-gradient: linear-gradient(135deg, #42A5F5 0%, #478ed1 100%);
}

[data-theme="dark"] {
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
  --text-price: #FF8A65;
  --border-color: #3a3a3a;
  --border-accent: rgba(255, 195, 0, 0.3);
  --accent-primary: #ffc300;
  --accent-light: #FFD54F;
  --accent-dark: #e6b000;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.5);
  /* 状态颜色 - 深色模式下调整亮度 */
  --status-success: #66BB6A;
  --status-info: #42A5F5;
  --status-warning: #FFB74D;
  --status-danger: #E57373;
  /* 渐变 - 深色模式下调整 */
  --badge-danger-gradient: linear-gradient(135deg, #ff5252 0%, #ff8a80 100%);
  --badge-info-gradient: linear-gradient(135deg, #29B6F6 0%, #4FC3F7 100%);
}

/* 全局字体优化 */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* 深色模式下字体渲染优化 */
[data-theme="dark"] body,
[data-theme="dark"] {
  font-weight: 400;
  letter-spacing: 0.2px;
}

/* 深色模式下特殊元素字体 */
[data-theme="dark"] .user-name,
[data-theme="dark"] .stat-value,
[data-theme="dark"] .service-name {
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* 深色模式下所有组件的字体优化 */
[data-theme="dark"] * {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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
    height: 90vh;
    max-height: 800px;
    border-width: 6px;
    border-radius: 28px;
  }

  @media (max-width: 360px) {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    border: none;
    max-width: none;
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
