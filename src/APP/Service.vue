<template>
  <div class="app-view">
    <div class="app-header">
      <div class="title">
        <i class="fas fa-concierge-bell"></i>
        <span>服务状态</span>
      </div>
      <button class="icon-btn" :disabled="isLoading" @click="refreshData">
        <i class="fas fa-sync-alt" :class="{ 'fa-spin': isLoading }"></i>
      </button>
    </div>

    <div class="app-content">
      <div v-if="isLoading" class="state-block">
        <div class="spinner"></div>
        <p>正在加载服务数据...</p>
      </div>

      <div v-else-if="activeOrders.length === 0" class="state-block">
        <i class="fas fa-inbox"></i>
        <p>{{ errorMessage || '暂无服务中的订单' }}</p>
        <button class="primary-btn" @click="refreshData">重试</button>
      </div>

      <div v-else class="card-list">
        <div v-for="order in activeOrders" :key="order.id" class="order-card">
          <div class="card-header">
            <div class="name">{{ order.basic.name }}</div>
            <div class="tags">
              <span class="tag" v-if="order.package.type">{{ order.package.type }}</span>
              <span class="tag danger" v-if="order.status.includes('警告')">{{ order.status }}</span>
              <span class="tag success" v-else>{{ order.status }}</span>
            </div>
          </div>

          <div class="info-row">
            <i class="fas fa-user"></i>
            <span>{{ order.basic.identity }} · {{ order.basic.age }}岁</span>
          </div>

          <div class="info-row">
            <i class="fas fa-box"></i>
            <div class="package">
              <div class="pkg-name">{{ order.package.name }}</div>
              <div class="pkg-price">￥{{ order.package.price }}</div>
              <div class="features">
                <span v-for="f in order.package.features" :key="f" class="feature">{{ f }}</span>
              </div>
            </div>
          </div>

          <div class="metrics">
            <div class="metric">
              <div class="label">心跳</div>
              <div class="value">{{ order.metrics.heartbeat || '-' }}</div>
            </div>
            <div class="metric">
              <div class="label">服务进度</div>
              <div class="value">
                {{ order.metrics.progress ?? '-' }}<span v-if="order.metrics.progress !== null">%</span>
              </div>
            </div>
            <div class="metric">
              <div class="label">好感度</div>
              <div class="value">{{ order.metrics.affection ?? '-' }}/100</div>
            </div>
            <div class="metric">
              <div class="label">服务次数</div>
              <div class="value">{{ order.metrics.count ?? '-' }}</div>
            </div>
          </div>

          <div class="stats">
            <div class="stat">
              <div class="label">当前所想</div>
              <div class="text">{{ order.psychology.thought }}</div>
            </div>
            <div class="stat">
              <div class="label">身体特征</div>
              <div class="text">
                {{ order.bodyShape }}
              </div>
            </div>
            <div class="stat">
              <div class="label">服务记录</div>
              <div class="text">日穴 {{ order.service.times }} · 内射 {{ order.service.inside }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="nav-bar">
      <div class="nav-item" @click="$router.push('/home')">
        <i class="fas fa-home"></i>
        <span>首页</span>
      </div>
      <div class="nav-item" @click="$router.push('/discover')">
        <i class="fas fa-compass"></i>
        <span>发现</span>
      </div>
      <div class="nav-item active">
        <i class="fas fa-concierge-bell"></i>
        <span>服务</span>
      </div>
      <div class="nav-item" @click="$router.push('/history')">
        <i class="fas fa-history"></i>
        <span>历史</span>
      </div>
      <div class="nav-item" @click="$router.push('/me')">
        <i class="fas fa-user"></i>
        <span>我的</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getNestedValue } from './utils';

type OrderView = {
  id: string;
  status: string;
  basic: { name: string; identity: string; age: number | string };
  package: { name: string; price: number | string; type?: string; features: string[] };
  psychology: { thought: string };
  metrics: { heartbeat: string | number | null; progress: number | null; affection: number | null; count: number | null };
  bodyShape: string;
  service: { times: string | number; inside: string | number };
};

const orders = ref<OrderView[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');

const activeOrders = computed(() => orders.value);

function pick<T>(obj: any, path: string, fallback: T): T {
  return (getNestedValue(obj, path, fallback) as T) ?? fallback;
}

async function loadFromMVU() {
  await waitGlobalInitialized('Mvu');
  const msgId = typeof getCurrentMessageId === 'function' ? getCurrentMessageId() : 'latest';
  const data = Mvu.getMvuData({ type: 'message', message_id: msgId }) as any;
  const list = data?.stat_data?.['服务中的订单'] || data?.['服务中的订单'] || [];
  if (!Array.isArray(list)) throw new Error('未找到服务中的订单');

  const active = list.filter((o: any) => !(o.订单状态 || '').includes('服务结束'));
  orders.value = active.map((o: any, idx: number): OrderView => ({
    id: o.id || String(idx),
    status: o.订单状态 || '进行中',
    basic: {
      name: pick(o, '基础信息.姓名', '未知'),
      identity: pick(o, '基础信息.身份', '未知'),
      age: pick(o, '基础信息.年龄', '-'),
    },
    package: {
      name: pick(o, '套餐.套餐名称', '未命名套餐'),
      price: pick(o, '套餐.套餐价格', '-'),
      type: pick(o, '套餐.商品类型', undefined),
      features: Array.isArray(o.套餐?.玩法特色) ? o.套餐.玩法特色 : [],
    },
    psychology: {
      thought: pick(o, '心理状态.当前所想', '-'),
    },
    metrics: {
      heartbeat: o.心跳 ?? null,
      progress: o.服务进度 ?? null,
      affection: o.心理状态?.好感度 ?? null,
      count: o.服务统计?.本次服务性交次数 ?? null,
    },
    bodyShape: pick(o, '身体特征.三围.描述', '-') || pick(o, '身体特征.胸部', '-'),
    service: {
      times: o.服务统计?.本次服务性交次数 ?? '-',
      inside: o.服务统计?.内射次数 ?? '-',
    },
  }));
}

async function refreshData() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    await loadFromMVU();
  } catch (e: any) {
    console.error(e);
    errorMessage.value = e?.message || '加载失败';
    orders.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  refreshData();
});
</script>

<style scoped lang="scss">
.app-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  position: absolute;
  inset: 0;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, var(--bg-header), var(--bg-header-light));
  border-bottom: 1px solid var(--border-color);

  .title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    color: var(--text-primary);
    font-size: 1.1rem;

    i {
      color: var(--accent-primary);
    }
  }

  .icon-btn {
    border: none;
    background: var(--bg-card);
    border-radius: 10px;
    padding: 8px 10px;
    color: var(--text-primary);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    transition: 0.2s;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.app-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.state-block {
  text-align: center;
  padding: 40px 12px;
  color: var(--text-secondary);

  .spinner {
    width: 28px;
    height: 28px;
    border: 3px solid var(--border-color);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    margin: 0 auto 12px;
    animation: spin 1s linear infinite;
  }

  .primary-btn {
    margin-top: 12px;
    padding: 10px 16px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-light));
    color: #fff;
    font-weight: 700;
    cursor: pointer;
  }
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid var(--border-accent);
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  .name {
    font-size: 18px;
    font-weight: 800;
    color: var(--text-primary);
  }

  .tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
}

.tag {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: var(--bg-badge);
  color: var(--text-primary);
  &.danger {
    background: var(--badge-danger-gradient);
    color: #fff;
  }
  &.success {
    background: var(--badge-info-gradient);
    color: #fff;
  }
}

.info-row {
  display: flex;
  gap: 10px;
  align-items: center;
  color: var(--text-secondary);
  margin: 8px 0;

  i {
    color: var(--accent-primary);
  }
}

.package {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .pkg-name {
    font-weight: 700;
    color: var(--text-primary);
  }
  .pkg-price {
    color: var(--status-danger);
    font-weight: 800;
  }
}

.features {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  .feature {
    padding: 3px 8px;
    border-radius: 8px;
    background: var(--bg-badge);
    font-size: 12px;
  }
}

.metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin: 10px 0;

  .metric {
    background: var(--bg-card);
    border: 1px solid var(--border-accent);
    border-radius: 10px;
    padding: 10px;
    text-align: center;

    .label {
      font-size: 12px;
      color: var(--text-secondary);
    }
    .value {
      font-size: 16px;
      font-weight: 800;
      color: var(--text-primary);
    }
  }
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .stat {
    background: var(--bg-badge);
    border-radius: 10px;
    padding: 10px;
    border: 1px solid var(--border-color);

    .label {
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 4px;
    }
    .text {
      font-size: 14px;
      color: var(--text-primary);
      line-height: 1.5;
      white-space: pre-wrap;
    }
  }
}

.nav-bar {
  display: flex;
  border-top: 1px solid var(--border-color);
  background: linear-gradient(135deg, var(--bg-header), var(--bg-header-light));
  padding: 8px 0;

  .nav-item {
    flex: 1;
    text-align: center;
    color: var(--text-secondary);
    padding: 6px 0;
    cursor: pointer;
    transition: 0.2s;

    &.active,
    &:hover {
      color: var(--text-primary);
    }

    i {
      display: block;
      font-size: 18px;
      margin-bottom: 2px;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
