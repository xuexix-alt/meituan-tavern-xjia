<template>
  <div class="phone-frame" :data-theme="currentTheme">
    <!-- 错误边界组件 -->
    <ErrorBoundary>
      <div class="demo-container">
        <!-- 头部 -->
        <div class="header">
          <h1><i class="fas fa-store"></i> 店铺生成 Demo</h1>
          <button class="theme-toggle" @click="toggleTheme">
            <i :class="currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'"></i>
          </button>
        </div>

        <!-- 输入区域 -->
        <div class="input-section">
          <div class="search-bar">
            <i class="fas fa-search"></i>
            <input v-model="keyword" placeholder="输入搜索关键词..." @keyup.enter="handleSearch" />
          </div>
          <button class="generate-btn" :disabled="loading" @click="handleSearch">
            <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-magic'"></i>
            {{ loading ? '生成中...' : '生成店铺' }}
          </button>
        </div>

        <!-- 结果区域 -->
        <div class="results-section">
          <!-- 流式输出 -->
          <div class="output-card raw-output">
            <div class="card-header">
              <i class="fas fa-stream"></i>
              <h3>流式输出</h3>
            </div>
            <div class="card-content">
              <pre v-if="rawOutput">{{ rawOutput }}</pre>
              <div v-else class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>等待生成...</p>
              </div>
            </div>
          </div>

          <!-- 解析结果 -->
          <div class="output-card parsed-output">
            <div class="card-header">
              <i class="fas fa-clipboard-list"></i>
              <h3>解析结果 (MVU更新)</h3>
            </div>
            <div class="card-content">
              <div v-if="shopList.length === 0" class="empty-state">
                <i class="fas fa-shopping-bag"></i>
                <p>暂无店铺数据</p>
              </div>
              <div v-else class="shop-list">
                <div v-for="(shop, shopId) in shopData" :key="shopId" class="shop-item">
                  <div class="shop-header">
                    <h4><i class="fas fa-store-alt"></i> {{ shop.shopname }}</h4>
                    <div class="tags">
                      <span v-for="tag in shop.shoptags" :key="tag" class="tag">
                        <i class="fas fa-tag"></i> {{ tag }}
                      </span>
                    </div>
                  </div>
                  <div class="packages">
                    <div v-for="pkg in shop.packages" :key="pkg.name" class="package-item">
                      <div class="package-header">
                        <h5>{{ pkg.name }}</h5>
                        <span class="price">¥{{ pkg.price }}</span>
                      </div>
                      <p class="package-desc">{{ pkg.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import ErrorBoundary from './components/ErrorBoundary.vue';
import { ShopGenerationAdapter } from './utils/adapters/shop-generation';
import { InlineInteractionService } from './utils/core';

const keyword = ref('');
const loading = ref(false);
const rawOutput = ref('');
const shopData = ref<any>({});
const shopList = ref<any[]>([]);
const currentTheme = ref<'light' | 'dark'>('light');

const service = new InlineInteractionService();
const adapter = new ShopGenerationAdapter();

// 初始化主题
function initTheme() {
  const savedTheme = localStorage.getItem('demo-theme') || 'light';
  currentTheme.value = savedTheme as 'light' | 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  console.log(`[主题初始化] 已加载${savedTheme === 'dark' ? '深色' : '浅色'}模式`);
}

// 切换主题
function toggleTheme() {
  const newTheme = currentTheme.value === 'light' ? 'dark' : 'light';
  currentTheme.value = newTheme;
  localStorage.setItem('demo-theme', newTheme);
  document.documentElement.setAttribute('data-theme', newTheme);
  console.log(`[主题切换] 已切换到${newTheme === 'dark' ? '深色' : '浅色'}模式`);
}

const handleShopUpdate = (event: CustomEvent) => {
  console.log('Received shop update:', event.detail);
  const patch = event.detail;
  if (Array.isArray(patch)) {
    patch.forEach(p => {
      if (p.op === 'replace' && (p.path === '/店铺列表' || p.path === '店铺列表')) {
        shopData.value = p.value;
        shopList.value = Object.values(p.value);
      }
    });
  }
};

onMounted(() => {
  initTheme();
  window.addEventListener('shop-data-updated', handleShopUpdate as EventListener);
});

onUnmounted(() => {
  window.removeEventListener('shop-data-updated', handleShopUpdate as EventListener);
});

async function handleSearch() {
  if (!keyword.value) return;

  loading.value = true;
  rawOutput.value = '';

  const demoAdapter = Object.assign(Object.create(Object.getPrototypeOf(adapter)), adapter);
  demoAdapter.onStream = (token: string) => {
    rawOutput.value += token;
  };

  try {
    await service.execute(demoAdapter, { keyword: keyword.value });
  } catch (e) {
    console.error('Execution failed', e);
    rawOutput.value += `\nError: ${e}`;
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss">
// 全局主题CSS变量
:root {
  --bg-primary: #f8f9fa;
  --bg-header: #ffffff;
  --bg-card: #ffffff;
  --bg-item: #ffffff;
  --bg-item-hover: #fff9e6;
  --text-primary: #2c3e50;
  --text-secondary: #606f7b;
  --text-tertiary: #95a5a6;
  --border-color: #e0e0e0;
  --accent-primary: #ffc300;
  --accent-dark: #e6b000;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
}

[data-theme='dark'] {
  --bg-primary: #1a1a1a;
  --bg-header: #2d2d2d;
  --bg-card: #2d2d2d;
  --bg-item: #2d2d2d;
  --bg-item-hover: #353535;
  --text-primary: #ffffff;
  --text-secondary: #e0e0e0;
  --text-tertiary: #9e9e9e;
  --border-color: #404040;
  --accent-primary: #ffc300;
  --accent-dark: #e6b000;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.5);
}

body {
  font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>

<style lang="scss" scoped>
.phone-frame {
  width: 100%;
  min-height: 800px;
  background: var(--bg-primary);
  border: 12px solid #1a1a1a;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  transition: all 0.4s ease;

  @media (max-width: 768px) {
    border-width: 8px;
    border-radius: 16px;
  }
}

.demo-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 20px;
  overflow-y: auto;
  color: var(--text-primary);
}

// 头部
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg-header);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);

  h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 12px;

    i {
      color: var(--accent-primary);
    }
  }

  .theme-toggle {
    background: var(--bg-item);
    border: 2px solid var(--border-color);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    color: var(--text-primary);

    &:hover {
      background: var(--accent-primary);
      color: white;
      transform: scale(1.1);
    }

    i {
      font-size: 1.2rem;
    }
  }
}

// 输入区域
.input-section {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);

  .search-bar {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--bg-item);
    border: 2px solid var(--border-color);
    border-radius: 12px;
    transition: all 0.3s;

    &:focus-within {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 4px rgba(255, 195, 0, 0.1);
    }

    i {
      color: var(--text-tertiary);
      font-size: 1.1rem;
    }

    input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 16px;
      color: var(--text-primary);

      &::placeholder {
        color: var(--text-tertiary);
      }
    }
  }

  .generate-btn {
    padding: 12px 28px;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-dark));
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 195, 0, 0.4);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    i {
      font-size: 1.1rem;
    }
  }
}

// 结果区域
.results-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  flex: 1;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.output-card {
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: var(--bg-header);
    border-bottom: 2px solid var(--border-color);

    i {
      color: var(--accent-primary);
      font-size: 1.2rem;
    }

    h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
    }
  }

  .card-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    max-height: 500px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-tertiary);

  i {
    font-size: 3rem;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 1rem;
  }
}

pre {
  background: var(--bg-item);
  padding: 16px;
  border-radius: 8px;
  white-space: pre-wrap;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0;
}

.shop-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.shop-item {
  background: var(--bg-item);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s;

  &:hover {
    border-color: var(--accent-primary);
    box-shadow: var(--shadow-md);
  }
}

.shop-header {
  margin-bottom: 16px;

  h4 {
    margin: 0 0 12px 0;
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;

    i {
      color: var(--accent-primary);
    }
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-dark));
    color: white;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;

    i {
      font-size: 0.7rem;
    }
  }
}

.packages {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.package-item {
  background: var(--bg-item-hover);
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid var(--accent-primary);
  transition: all 0.3s;

  &:hover {
    transform: translateX(4px);
  }

  .package-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    h5 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .price {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--accent-primary);
    }
  }

  .package-desc {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.5;
  }
}
</style>
