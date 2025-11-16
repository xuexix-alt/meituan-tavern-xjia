<template>
  <div class="app-view active">
    <!-- 页面头部 -->
    <div class="app-header">
      <div class="title">
        <i class="fas fa-concierge-bell"></i>
        <span>服务状态</span>
      </div>
      <button v-if="girlsData.length > 0" class="refresh-btn" @click="refreshData">
        <i class="fas fa-sync-alt" :class="{ 'fa-spin': isRefreshing }"></i>
      </button>
    </div>

    <div class="app-content">
      <!-- 空状态 -->
      <div v-if="girlsData.length === 0 && !isLoading" class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>{{ errorMessage || '暂无服务中的订单' }}</p>
        <button class="retry-btn" @click="refreshData">
          <i class="fas fa-redo"></i>
          重试
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>正在加载服务数据...</p>
      </div>

      <!-- 标签页（仅多订单时显示） -->
      <div v-if="girlsData.length > 1" class="tabs-container">
        <div
          v-for="(girl, index) in girlsData"
          :key="index"
          :class="['tab-item', { active: currentGirlIndex === index }]"
          @click="currentGirlIndex = index"
        >
          {{ getGirlName(girl) }}
        </div>
      </div>

      <!-- 当前女孩的核心状态卡片 -->
      <div v-if="currentGirl" class="status-card">
        <!-- 基本信息和状态 -->
        <div class="status-header">
          <div class="basic-info">
            <h2 class="girl-name">{{ basicInfo.name }}</h2>
            <div class="sub-info">
              <span class="identity">{{ basicInfo.identity }}</span>
              <span class="dot">·</span>
              <span class="age">{{ basicInfo.age }}岁</span>
            </div>
          </div>
          <div class="badges">
            <span class="badge badge-hot">HOT</span>
            <span v-if="packageInfo.type" class="badge badge-type">{{ packageInfo.type }}</span>
          </div>
        </div>

        <!-- 订单状态指示器 -->
        <div class="order-status-row">
          <div class="status-item">
            <i class="fas fa-heart status-icon" :class="orderStatusClass"></i>
            <span class="status-text">{{ orderStatus }}</span>
          </div>
          <div class="status-item">
            <i class="fas fa-heartbeat status-icon" :class="heartbeatStatusClass"></i>
            <span class="status-text">{{ heartbeatDisplay }}</span>
          </div>
        </div>

        <!-- 星级评分 -->
        <div class="rating-section">
          <div class="stars">
            <i v-for="n in 5" :key="n" :class="['fas fa-star', n <= starRating ? 'star active' : 'star']"></i>
          </div>
          <span class="affection-score">{{ affectionDisplay }}/100</span>
        </div>

        <!-- 价格信息 -->
        <div class="price-section">
          <div class="price-label">套餐价格</div>
          <div class="price-value">¥{{ packageInfo.price }}</div>
          <div class="package-name">{{ packageInfo.name }}</div>
        </div>

        <!-- 关键指标网格 -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">心跳</div>
            <div class="metric-value" :style="{ color: heartbeatColor }">
              {{ heartbeatDisplay }}
              <span v-if="heartbeatDisplay !== '-'" class="metric-unit">bpm</span>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">服务进度</div>
            <div class="metric-value">{{ serviceProgress }}<span v-if="serviceProgress !== '-'">%</span></div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: serviceProgressBarWidth, background: progressColor }"></div>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">订单数</div>
            <div class="metric-value">{{ orderCount }}<span class="metric-unit">次</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-label">好感度</div>
            <div class="metric-value">{{ affectionDisplay }}<span class="metric-unit">/100</span></div>
          </div>
        </div>
      </div>

      <!-- 详情折叠面板 -->
      <div v-if="currentGirl" class="detail-section">
        <div class="detail-card accordion">
          <div class="accordion-header" :class="{ active: showDetails }" @click="showDetails = !showDetails">
            <span>
              <i class="fas fa-info-circle accordion-icon"></i>
              详细信息
            </span>
            <i class="fas fa-chevron-down accordion-arrow"></i>
          </div>
          <div class="accordion-content" :class="{ show: showDetails }">
            <div class="accordion-body">
              <!-- 着装信息 -->
              <div class="detail-group">
                <h4 class="group-title">
                  <i class="fas fa-user-tie"></i>
                  着装信息
                </h4>
                <div v-if="clothingDescription" class="clothing-desc">
                  {{ clothingDescription }}
                </div>
                <div v-if="hasValidClothing" class="clothing-grid">
                  <div v-for="(value, key) in displayClothing" :key="key" class="clothing-item">
                    <i :class="['clothing-icon', clothingIcon(key)]"></i>
                    <span class="clothing-key">{{ key }}</span>
                    <span class="clothing-value">{{ value }}</span>
                  </div>
                </div>
                <div v-else class="empty-text">暂无着装信息</div>
              </div>

              <!-- 性经验与服务统计 -->
              <div class="detail-group">
                <h4 class="group-title">
                  <i class="fas fa-chart-bar"></i>
                  性经验与服务统计
                </h4>
                <div class="info-rows">
                  <div class="info-row">
                    <span class="info-key">是否处女</span>
                    <span class="info-val">{{ getNestedValue(currentGirl, '性经验.处女', '-') }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-key">性伴侣数量</span>
                    <span class="info-val">{{ getNestedValue(currentGirl, '性经验.性伴侣数量', '-') }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-key">初次性行为对象</span>
                    <span class="info-val">{{ getNestedValue(currentGirl, '性经验.初次性行为对象', '-') }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-key">总时长</span>
                    <span class="info-val">{{ getNestedValue(currentGirl, '服务统计.总时长', '-') }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-key">已用时长</span>
                    <span class="info-val">{{ getNestedValue(currentGirl, '服务统计.已用时长', '-') }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-key">本次服务性交次数</span>
                    <span class="info-val">{{ getNestedValue(currentGirl, '服务统计.本次服务性交次数', '-') }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-key">内射次数</span>
                    <span class="info-val">{{ getNestedValue(currentGirl, '服务统计.内射次数', '-') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="nav-bar">
      <div class="nav-item" @click="$router.push('/')">
        <i class="fas fa-home"></i>
        <span>首页</span>
      </div>
      <div class="nav-item" @click="$router.push('/discover')">
        <i class="fas fa-compass"></i>
        <span>发现</span>
      </div>
      <div class="nav-item active" @click="$router.push('/service')">
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
import { ref, computed, onMounted } from 'vue';

// 响应式数据
const girlsData = ref<any[]>([]);
const currentGirlIndex = ref(0);
const showDetails = ref(true);
const isLoading = ref(false);
const isRefreshing = ref(false);
const errorMessage = ref('');

// 当前选中的女孩数据
const currentGirl = computed(() => girlsData.value[currentGirlIndex.value] || null);

// ================ 数据工具函数 ================

/**
 * 安全获取嵌套值
 */
function getNestedValue(obj: any, path: string, fallback: any = '--') {
  if (!obj) return fallback;
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  let current = obj;
  for (const key of keys) {
    if (current == null) return fallback;
    current = current[key];
  }
  return current ?? fallback;
}

/**
 * 获取女孩姓名
 */
function getGirlName(girl: any) {
  return getNestedValue(girl, '基础信息.姓名') || `女孩 ${girlsData.value.indexOf(girl) + 1}`;
}

// ================ 数据获取（MVU框架） ================

/**
 * 从MVU变量提取数据
 */
async function extractDataFromMVU(): Promise<{ girls: any[] }> {
  try {
    // 等待MVU初始化
    await waitGlobalInitialized('Mvu');

    // 获取MVU数据
    const mvuData = Mvu.getMvuData({ type: 'message', message_id: 'latest' }) as any;

    if (!mvuData) {
      throw new Error('MVU数据为空');
    }

    // 检查订单数据
    const orders = mvuData.stat_data?.['服务中的订单'] || mvuData['服务中的订单'];

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      throw new Error('未找到服务中的订单数据');
    }

    // 转换订单数据为界面格式
    const girls = orders.map((order: any) => ({
      id: order.id || 'unknown',
      基础信息: {
        姓名: order.基础信息?.姓名 || '未知',
        身份: order.基础信息?.身份 || '未知',
        年龄: order.基础信息?.年龄 || 0
      },
      服装: {
        描述: order.服装?.描述 || '',
        上衣: order.服装?.上衣 || '',
        下装: order.服装?.下装 || '',
        内衣: order.服装?.内衣 || '',
        内裤: order.服装?.内裤 || '',
        丝袜: order.服装?.丝袜 || '',
        鞋子: order.服装?.鞋子 || '',
        配饰: order.服装?.配饰 || ''
      },
      性经验: {
        处女: order.性经验?.处女 || '-',
        性伴侣数量: order.性经验?.性伴侣数量 || '-',
        初次性行为对象: order.性经验?.初次性行为对象 || '-'
      },
      服务统计: {
        总时长: order.服务统计?.总时长 || '-',
        已用时长: order.服务统计?.已用时长 || '-',
        本次服务性交次数: order.服务统计?.本次服务性交次数 || '-',
        内射次数: order.服务统计?.内射次数 || '-',
        订单状态: order.订单状态 || '未知',
        心跳: order.心跳 || '-'
      },
      套餐: {
        套餐名称: order.套餐?.套餐名称?.[0] || '未命名套餐',
        套餐价格: order.套餐?.套餐价格?.[0] || '0',
        商品类型: order.套餐?.商品类型 || '未知'
      },
      心理状态: {
        好感度: order.心理状态?.好感度 || 0
      }
    }));

    return { girls };
  } catch (error) {
    console.error('[Service] MVU数据获取失败:', error);
    throw error;
  }
}

/**
 * 刷新数据
 */
async function refreshData() {
  isRefreshing.value = true;
  errorMessage.value = '';

  try {
    const data = await extractDataFromMVU();
    girlsData.value = data.girls;

    if (data.girls.length === 0) {
      errorMessage.value = '未找到服务中的订单';
      toastr.warning('暂无服务数据', '服务状态');
    } else {
      toastr.success(`加载了 ${data.girls.length} 位女孩的服务数据`, '服务状态');
    }
  } catch (error: any) {
    errorMessage.value = error.message || '数据加载失败';
    console.error('[Service] 刷新数据失败:', error);
    toastr.error('数据加载失败，请重试', '服务状态');
    girlsData.value = [];
  } finally {
    isRefreshing.value = false;
  }
}

// ================ 计算属性 ================

// 基础信息
const basicInfo = computed(() => ({
  name: getNestedValue(currentGirl.value, '基础信息.姓名', '未知'),
  identity: getNestedValue(currentGirl.value, '基础信息.身份', '未知'),
  age: getNestedValue(currentGirl.value, '基础信息.年龄', 0),
}));

// 套餐信息
const packageInfo = computed(() => ({
  name: getNestedValue(currentGirl.value, '套餐.套餐名称', '未命名套餐'),
  price: getNestedValue(currentGirl.value, '套餐.套餐价格', '0'),
  type: getNestedValue(currentGirl.value, '套餐.商品类型', ''),
}));

// 订单状态
const orderStatus = computed(() => getNestedValue(currentGirl.value, '服务统计.订单状态', '未知'));
const orderStatusClass = computed(() => {
  const status = orderStatus.value;
  if (status.includes('服务中') || status.includes('进行中')) return 'status-active';
  if (status.includes('完成') || status.includes('结束')) return 'status-completed';
  return 'status-pending';
});

// 心跳
const heartbeatDisplay = computed(() => getNestedValue(currentGirl.value, '服务统计.心跳', '-'));
const heartbeatStatusClass = computed(() => {
  const value = parseFloat(String(heartbeatDisplay.value));
  if (isNaN(value)) return 'status-normal';
  if (value < 60) return 'status-warning';
  if (value > 100) return 'status-danger';
  return 'status-normal';
});
const heartbeatColor = computed(() => {
  switch (heartbeatStatusClass.value) {
    case 'status-warning': return '#FFA726';
    case 'status-danger': return '#EF5350';
    default: return '#66BB6A';
  }
});

// 星级评分
const starRating = computed(() => {
  const rating = Math.floor((affectionDisplay.value / 100) * 5);
  return Math.min(5, Math.max(0, rating));
});

// 好感度
const affectionDisplay = computed(() => {
  const value = getNestedValue(currentGirl.value, '心理状态.好感度', 0);
  return typeof value === 'number' ? value : parseFloat(value) || 0;
});

// 服务进度
const serviceProgress = computed(() => {
  const total = getNestedValue(currentGirl.value, '服务统计.总时长', '0');
  const current = getNestedValue(currentGirl.value, '服务统计.已用时长', '0');
  const totalNum = parseFloat(String(total));
  const currentNum = parseFloat(String(current));

  if (isNaN(totalNum) || isNaN(currentNum) || totalNum === 0) return '-';

  const progress = Math.round((currentNum / totalNum) * 100);
  return Math.min(100, Math.max(0, progress));
});

const serviceProgressBarWidth = computed(() => {
  const value = serviceProgress.value;
  return value === '-' ? '0%' : `${value}%`;
});

const progressColor = computed(() => {
  const value = serviceProgress.value;
  if (value === '-') return '#E0E0E0';
  if (value < 30) return '#FFA726';
  if (value > 80) return '#66BB6A';
  return '#FFD54F';
});

// 订单数量
const orderCount = computed(() => {
  const count = getNestedValue(currentGirl.value, '服务统计.总订单数', 0);
  return typeof count === 'number' ? count : parseInt(count) || 0;
});

// 着装信息
const clothingDescription = computed(() => {
  return getNestedValue(currentGirl.value, '服装.描述', '');
});

const displayClothing = computed(() => {
  const clothing = currentGirl.value?.服装;
  if (!clothing) return {};

  const result: any = {};
  const excludeKeys = ['描述'];

  for (const [key, value] of Object.entries(clothing)) {
    if (!excludeKeys.includes(key) && typeof value === 'string' && value.trim() && value !== '未知') {
      result[key] = value;
    }
  }

  return result;
});

const hasValidClothing = computed(() => Object.keys(displayClothing.value).length > 0);

function clothingIcon(key: string) {
  const iconMap: Record<string, string> = {
    '上衣': 'fas fa-tshirt',
    '下装': 'fas fa-user-tie',
    '鞋子': 'fas fa-shoe-prints',
    '内衣': 'fas fa-heart',
    '内裤': 'fas fa-user',
    '丝袜': 'fas fa-socks',
    '配饰': 'fas fa-gem',
  };
  return iconMap[key] || 'fas fa-tag';
}

// ================ 生命周期 ================

onMounted(async () => {
  isLoading.value = true;
  await refreshData();
  isLoading.value = false;
});
</script>

<style lang="scss" scoped>
.app-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  position: absolute;
  top: 0;
  left: 0;
}

.app-header {
  background: linear-gradient(135deg, var(--bg-header) 0%, var(--bg-header-light) 100%);
  padding: 48px 20px 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-accent);
  flex-shrink: 0;
  backdrop-filter: blur(15px);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border-accent), transparent);
  }

  .title {
    font-size: 1.4rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-primary);
    letter-spacing: 0.5px;

    i {
      color: var(--accent-primary);
      padding: 8px;
      border-radius: 10px;
      transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);

      &:hover {
        background: linear-gradient(135deg, rgba(255, 195, 0, 0.15), rgba(255, 215, 64, 0.1));
        transform: scale(1.15) rotate(-8deg);
      }
    }

    span {
      background: linear-gradient(135deg, var(--text-primary) 0%, #333333 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  .refresh-btn {
    background: none;
    border: none;
    color: var(--accent-primary);
    font-size: 1.2rem;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.3s;

    &:hover {
      background: rgba(255, 195, 0, 0.1);
      transform: rotate(180deg);
    }
  }
}

.app-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

// 空状态
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);

  i {
    font-size: 4rem;
    color: var(--text-placeholder);
    margin-bottom: 20px;
  }

  p {
    font-size: 1rem;
    margin-bottom: 24px;
  }

  .retry-btn {
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-light));
    color: var(--text-primary);
    border: none;
    padding: 12px 32px;
    border-radius: 25px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 195, 0, 0.4);
    }
  }
}

// 加载状态
.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid var(--border-color);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }

  p {
    font-size: 1rem;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// 标签页
.tabs-container {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  padding: 6px;
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(255, 195, 0, 0.1);
  border: 1px solid rgba(255, 195, 0, 0.2);

  .tab-item {
    flex: 1;
    padding: 12px 16px;
    border: none;
    background: transparent;
    border-radius: 12px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
    color: var(--text-secondary);
    text-align: center;

    &:hover {
      color: var(--text-primary);
      background: rgba(255, 195, 0, 0.1);
    }

    &.active {
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-light));
      color: var(--text-primary);
      box-shadow: 0 4px 15px rgba(255, 195, 0, 0.3);
    }
  }
}

// 状态卡片
.status-card {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-accent);

  .status-header {
    margin-bottom: 20px;

    .basic-info {
      .girl-name {
        font-size: 28px;
        font-weight: 800;
        margin: 0 0 8px 0;
        color: var(--text-primary);
      }

      .sub-info {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-secondary);
        font-size: 14px;

        .dot {
          color: var(--text-placeholder);
        }
      }
    }

    .badges {
      display: flex;
      gap: 8px;
      margin-top: 12px;

      .badge {
        padding: 4px 12px;
        border-radius: 50px;
        font-size: 11px;
        font-weight: 700;

        &.badge-hot {
          background: var(--badge-danger-gradient);
          color: white;
        }

        &.badge-type {
          background: var(--badge-info-gradient);
          color: white;
        }
      }
    }
  }

  .order-status-row {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    padding: 12px;
    background: var(--bg-card);
    border-radius: 12px;

    .status-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .status-icon {
        font-size: 18px;

        &.status-active { color: var(--status-success); }
        &.status-completed { color: var(--status-info); }
        &.status-pending { color: var(--status-warning); }
        &.status-normal { color: var(--status-success); }
        &.status-warning { color: var(--status-warning); }
        &.status-danger { color: var(--status-danger); }
      }

      .status-text {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
      }
    }
  }

  .rating-section {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding: 12px;
    background: var(--bg-badge);
    border-radius: 12px;

    .stars {
      display: flex;
      gap: 4px;

      .star {
        font-size: 16px;
        color: var(--border-color);

        &.active {
          color: var(--accent-primary);
        }
      }
    }

    .affection-score {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-secondary);
    }
  }

  .price-section {
    text-align: center;
    padding: 16px;
    background: var(--bg-badge);
    border-radius: 12px;
    margin-bottom: 20px;

    .price-label {
      font-size: 12px;
      color: var(--text-placeholder);
      margin-bottom: 8px;
    }

    .price-value {
      font-size: 32px;
      font-weight: 900;
      background: var(--badge-danger-gradient);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1;
      margin-bottom: 8px;
    }

    .package-name {
      font-size: 14px;
      color: var(--text-secondary);
      font-weight: 600;
    }
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    .metric-card {
      text-align: center;
      padding: 16px;
      background: var(--bg-card);
      border-radius: 12px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(255, 195, 0, 0.2);
      }

      .metric-label {
        font-size: 12px;
        color: var(--text-placeholder);
        margin-bottom: 8px;
      }

      .metric-value {
        font-size: 24px;
        font-weight: 800;
        color: var(--text-primary);
        margin-bottom: 8px;

        .metric-unit {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 600;
        }
      }

      .progress-bar {
        width: 100%;
        height: 6px;
        background: var(--border-color);
        border-radius: 50px;
        overflow: hidden;

        .progress-fill {
          height: 100%;
          border-radius: 50px;
          transition: width 0.8s;
        }
      }
    }
  }
}

// 详情区域
.detail-section {
  .detail-card {
    background: var(--bg-card);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(255, 195, 0, 0.15);

    .accordion-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      cursor: pointer;
      background: var(--bg-card);
      transition: all 0.3s;
      font-weight: 700;
      color: var(--text-primary);

      &:hover {
        background: var(--bg-badge);
      }

      &.active {
        background: var(--bg-badge);

        .accordion-arrow {
          transform: rotate(180deg);
        }
      }

      .accordion-icon {
        color: var(--accent-primary);
        margin-right: 8px;
      }

      .accordion-arrow {
        color: var(--text-placeholder);
        transition: transform 0.3s;
      }
    }

    .accordion-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out;

      &.show {
        max-height: 2000px;
      }
    }

    .accordion-body {
      padding: 20px;
      background: var(--bg-card);
    }
  }

  .detail-group {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .group-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 16px 0;
      display: flex;
      align-items: center;
      gap: 8px;

      i {
        color: var(--accent-primary);
      }
    }

    .clothing-desc {
      padding: 12px;
      background: var(--bg-badge);
      border-radius: 8px;
      color: var(--text-secondary);
      margin-bottom: 16px;
      line-height: 1.6;
    }

    .clothing-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;

      .clothing-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        background: var(--bg-card);
        border-radius: 10px;

        .clothing-icon {
          font-size: 18px;
          color: var(--accent-primary);
          flex-shrink: 0;
        }

        .clothing-key {
          font-size: 12px;
          color: var(--text-primary);
          flex: 1;
        }

        .clothing-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
      }
    }

    .info-rows {
      display: grid;
      gap: 10px;

      .info-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 16px;
        background: var(--bg-card);
        border-radius: 10px;

        .info-key {
          font-size: 13px;
          color: var(--text-primary);
        }

        .info-val {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }
      }
    }

    .empty-text {
      text-align: center;
      color: var(--text-placeholder);
      padding: 20px;
    }
  }
}

// 底部导航
.nav-bar {
  display: flex;
  border-top: 1px solid var(--border-color);
  background: linear-gradient(135deg, var(--bg-header) 0%, var(--bg-header-light) 100%);
  padding: 8px 0;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border-color), transparent);
  }

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--text-secondary);
    font-size: 0.8rem;
    padding: 4px 0;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    position: relative;
    border-radius: 8px;
    margin: 0 4px;

    &.active {
      color: var(--text-primary);

      i {
        color: var(--accent-primary);
        transform: scale(1.15) translateY(-2px);
      }
    }

    &:hover:not(.active) {
      color: var(--text-primary);
      transform: translateY(-1px);
    }

    i {
      font-size: 1.25rem;
      margin-bottom: 4px;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
  }
}
</style>
