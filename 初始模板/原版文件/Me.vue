<template>
  <div class="app-view">
    <!-- 我的页面内容 -->
    <div class="app-header">
      <div class="title">
        <i class="fas fa-user"></i>
        <span>我的</span>
      </div>
    </div>

    <div class="app-content">
      <!-- 用户信息卡片 -->
      <div class="user-profile-card">
        <div class="avatar-wrapper">
          <div class="avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="avatar-badge">
            <i class="fas fa-crown"></i>
          </div>
        </div>
        <div class="user-info">
          <h2 class="user-name">{{ userName }}</h2>
          <div class="user-level">
            <i class="fas fa-star"></i>
            <span>VIP用户</span>
          </div>
          <div class="user-stats">
            <div class="stat-item">
              <div class="stat-value">{{ accountBalance }}</div>
              <div class="stat-label">账户余额</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-value">{{ totalSpending }}</div>
              <div class="stat-label">累计消费</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-value">{{ orderCount }}</div>
              <div class="stat-label">订单数量</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷功能 -->
      <div class="card">
        <div class="card-title">
          <i class="fas fa-bolt"></i>快捷功能
        </div>
        <div class="quick-actions-grid">
          <div class="action-item" @click="$router.push('/service')">
            <div class="action-icon bg-primary">
              <i class="fas fa-heart"></i>
            </div>
            <div class="action-label">服务状态</div>
          </div>
          <div class="action-item" @click="$router.push('/history')">
            <div class="action-icon bg-success">
              <i class="fas fa-history"></i>
            </div>
            <div class="action-label">历史订单</div>
          </div>
          <div class="action-item" @click="search('路人商品-路人主题')">
            <div class="action-icon bg-warning">
              <i class="fas fa-street-view"></i>
            </div>
            <div class="action-label">浏览路人</div>
          </div>
          <div class="action-item" @click="search('熟人商品-各类主题')">
            <div class="action-icon bg-info">
              <i class="fas fa-user-friends"></i>
            </div>
            <div class="action-label">浏览熟人</div>
          </div>
        </div>
      </div>

      <!-- 我的服务分类 -->
      <div class="card">
        <div class="card-title">
          <i class="fas fa-th-large"></i>我的服务分类
        </div>
        <div class="category-grid">
          <div class="category-item" @click="search('路人商品-路人主题')">
            <div class="category-icon"><i class="fas fa-street-view"></i></div>
            <div class="category-label">路人</div>
            <div class="category-count">{{ categoryStats.路人 || 0 }}</div>
          </div>
          <div class="category-item" @click="search('路人商品-各类场景偶遇的心动女孩主题')">
            <div class="category-icon"><i class="fas fa-mask"></i></div>
            <div class="category-label">偶遇</div>
            <div class="category-count">{{ categoryStats.偶遇 || 0 }}</div>
          </div>
          <div class="category-item" @click="search('路人商品-色情片中的AV女优主题')">
            <div class="category-icon"><i class="fas fa-video"></i></div>
            <div class="category-label">AV</div>
            <div class="category-count">{{ categoryStats.AV || 0 }}</div>
          </div>
          <div class="category-item" @click="search('路人商品-街上遇到的心动美女主题')">
            <div class="category-icon"><i class="fas fa-camera-retro"></i></div>
            <div class="category-label">街拍</div>
            <div class="category-count">{{ categoryStats.街拍 || 0 }}</div>
          </div>
          <div class="category-item" @click="search('熟人商品-各类主题')">
            <div class="category-icon"><i class="fas fa-user-friends"></i></div>
            <div class="category-label">熟人</div>
            <div class="category-count">{{ categoryStats.熟人 || 0 }}</div>
          </div>
          <div class="category-item" @click="search('熟人商品-各类乱伦主题')">
            <div class="category-icon"><i class="fas fa-heart-broken"></i></div>
            <div class="category-label">乱伦</div>
            <div class="category-count">{{ categoryStats.乱伦 || 0 }}</div>
          </div>
          <div class="category-item" @click="search('熟人商品-各类职场主题')">
            <div class="category-icon"><i class="fas fa-briefcase"></i></div>
            <div class="category-label">职场</div>
            <div class="category-count">{{ categoryStats.职场 || 0 }}</div>
          </div>
          <div class="category-item" @click="search('熟人商品-各类朋友妻主题')">
            <div class="category-icon"><i class="fas fa-users"></i></div>
            <div class="category-label">友妻</div>
            <div class="category-count">{{ categoryStats.友妻 || 0 }}</div>
          </div>
        </div>
      </div>

      <!-- 最近服务 -->
      <div class="card">
        <div class="card-title">
          <i class="fas fa-clock"></i>最近服务
        </div>
        <div v-if="recentServices.length === 0" class="empty-state">
          暂无最近服务记录
        </div>
        <div v-for="service in recentServices" :key="service.id" class="service-item" @click="reorder(service)">
          <div class="service-icon">
            <i :class="service.icon"></i>
          </div>
          <div class="service-info">
            <div class="service-name">{{ service.name }}</div>
            <div class="service-meta">
              <span class="service-time">{{ service.time }}</span>
              <span class="service-status" :style="getStatusStyle(service.status)">{{ service.status }}</span>
            </div>
          </div>
          <div class="service-price">{{ service.price }}</div>
        </div>
      </div>

      <!-- 常用搜索 -->
      <div class="card">
        <div class="card-title">
          <i class="fas fa-search"></i>常用搜索
        </div>
        <div class="search-tags">
          <div class="search-tag" v-for="tag in commonSearches" :key="tag" @click="search(tag)">
            <i class="fas fa-tag"></i>
            <span>{{ tag }}</span>
          </div>
        </div>
      </div>

      <!-- 设置选项 -->
      <div class="card">
        <div class="card-title">
          <i class="fas fa-cog"></i>设置
        </div>
        <div class="settings-list">
          <div class="settings-item" @click="toggleTheme">
            <div class="settings-icon">
              <i class="fas fa-moon"></i>
            </div>
            <div class="settings-info">
              <div class="settings-title">深色模式</div>
              <div class="settings-desc">切换深色/浅色主题</div>
            </div>
            <div class="settings-toggle">
              <i :class="['fas', isDarkMode ? 'fa-toggle-on' : 'fa-toggle-off']"></i>
            </div>
          </div>
          <div class="settings-item" @click="refreshData">
            <div class="settings-icon">
              <i class="fas fa-sync-alt"></i>
            </div>
            <div class="settings-info">
              <div class="settings-title">刷新数据</div>
              <div class="settings-desc">从酒馆重新获取最新数据</div>
            </div>
            <div class="settings-arrow">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>
          <div class="settings-item" @click="goHome">
            <div class="settings-icon">
              <i class="fas fa-home"></i>
            </div>
            <div class="settings-info">
              <div class="settings-title">返回首页</div>
              <div class="settings-desc">快速回到首页</div>
            </div>
            <div class="settings-arrow">
              <i class="fas fa-chevron-right"></i>
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
      <div class="nav-item" @click="$router.push('/service')">
        <i class="fas fa-heart"></i>
        <span>服务</span>
      </div>
      <div class="nav-item" @click="$router.push('/history')">
        <i class="fas fa-history"></i>
        <span>历史</span>
      </div>
      <div class="nav-item active" @click="$router.push('/me')">
        <i class="fas fa-user"></i>
        <span>我的</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// 响应式数据
const userName = ref('玩家');
const isDarkMode = ref(false);
const fullStatData = ref<any>(null);
const historyItems = ref<any[]>([]);

// 统计数据
const accountBalance = computed(() => {
  if (fullStatData.value?.经济?.账户余额 !== undefined) {
    return fullStatData.value.经济.账户余额;
  }
  return '--';
});

const totalSpending = computed(() => {
  if (fullStatData.value?.经济?.订单消费 !== undefined) {
    return fullStatData.value.经济.订单消费;
  }
  return 0;
});

const orderCount = computed(() => historyItems.value.length || 0);

// 分类统计
const categoryStats = computed(() => {
  const stats: Record<string, number> = {};
  historyItems.value.forEach(item => {
    const category = getCategoryFromPackage(item.package_name);
    if (category) {
      stats[category] = (stats[category] || 0) + 1;
    }
  });
  return stats;
});

function getCategoryFromPackage(packageName: string): string | null {
  if (!packageName) return null;
  const categories: Record<string, string[]> = {
    '路人': ['路人主题', '路人'],
    '偶遇': ['偶遇', '场景偶遇'],
    'AV': ['AV', '女优'],
    '街拍': ['街拍', '街上遇到'],
    '熟人': ['熟人', '熟人主题'],
    '乱伦': ['乱伦'],
    '职场': ['职场'],
    '友妻': ['友妻', '朋友妻']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => packageName.includes(keyword))) {
      return category;
    }
  }
  return null;
}

// 最近服务
const recentServices = computed(() => {
  return historyItems.value.slice(0, 5).map((item, index) => ({
    id: index,
    name: item.girl_name || '未知',
    icon: 'fas fa-heart',
    time: item.order_time || '历史订单',
    status: item.order_status || '已完成',
    price: `¥${item.price || 0}`
  }));
});

// 常用搜索
const commonSearches = ref([
  '路人商品-路人主题',
  '熟人商品-各类主题',
  'AV女优',
  '街拍美女',
  '职场女性',
  '朋友妻'
]);

// 状态样式
function getStatusStyle(status: string) {
  const styles: Record<string, string> = {
    '已完成': 'background-color: rgba(46,204,113,0.2); color: #2ecc71;',
    '订单结束': 'background-color: rgba(231,76,60,0.2); color: #e74c3c;',
    '服务结束': 'background-color: rgba(230,126,34,0.2); color: #e67e22;',
    '进行中': 'background-color: rgba(52,152,219,0.2); color: #3498db;'
  };
  return styles[status] || styles['已完成'];
}

// 搜索功能
function search(keyword: string) {
  sendToAI(`/send 搜索：${keyword}`);
}

function sendToAI(message: string) {
  console.log(`[发送至AI]: ${message}`);
  const fullCommand = `${message} | /trigger await=true`;
  if (typeof window.triggerSlash !== 'undefined') {
    try {
      window.triggerSlash(fullCommand);
    } catch (e) {
      console.error('执行triggerSlash时出错:', e);
    }
  } else {
    console.log(`[模拟发送至AI - 完整指令]: ${fullCommand}`);
  }
}

// 重新下单
function reorder(service: any) {
  const pkg = service.name || '未知套餐';
  sendToAI(`/send 我要下单：${pkg}`);
}

// 切换主题
function toggleTheme() {
  isDarkMode.value = !isDarkMode.value;
  // TODO: 实现主题切换逻辑
}

// 刷新数据
function refreshData() {
  window.location.reload();
}

// 返回首页
function goHome() {
  sendToAI('/send 首页');
}

// 初始化数据
async function initDisplay() {
  try {
    const messages = await getChatMessages('latest');
    if (!messages || messages.length === 0 || !messages[0].data) {
      const loaded = await loadFullExampleData();
      if (loaded) return true;
      return false;
    }

    const statData = messages[0].data.stat_data;
    if (!statData) {
      const loaded = await loadFullExampleData();
      if (loaded) return true;
      return false;
    }

    fullStatData.value = statData;

    if (statData['历史订单'] && Array.isArray(statData['历史订单'])) {
      historyItems.value = statData['历史订单'].map((item: any) => {
        const order = Array.isArray(item) ? item[0] : item;
        return {
          girl_name: order.基础信息?.姓名?.[0] || order.姓名 || '未知',
          identity: order.基础信息?.身份?.[0] || order.身份 || '未知',
          package_name: order.套餐?.套餐名称?.[0] || order.套餐名称 || '未知套餐',
          order_time: '历史订单',
          order_status: order.订单状态 || '已完成',
          service_location: '未知',
          price: order.套餐?.套餐价格?.[0] || order.套餐价格 || 0
        };
      });
    } else {
      historyItems.value = [];
    }

    return true;
  } catch (error) {
    console.error('加载失败:', error);
    return false;
  }
}

async function getChatMessages(messageId: string) {
  try {
    if (typeof window.Mvu === 'undefined' || !window.Mvu.getMvuData) return [];
    const response = window.Mvu.getMvuData({ type: 'message', message_id: messageId || 'latest' });
    return response && response.stat_data ? [{ data: response }] : [];
  } catch (error) {
    console.error('获取消息失败:', error);
    return [];
  }
}

async function loadFullExampleData() {
  try {
    const res = await fetch('./变量示例.json');
    if (!res.ok) return false;
    const data = await res.json();
    const statData = data?.stat_data;
    if (!statData) return false;

    fullStatData.value = statData;

    if (statData['历史订单'] && Array.isArray(statData['历史订单'])) {
      historyItems.value = statData['历史订单'].map((item: any) => {
        const order = Array.isArray(item) ? item[0] : item;
        return {
          girl_name: order.基础信息?.姓名?.[0] || order.姓名 || '未知',
          identity: order.基础信息?.身份?.[0] || order.身份 || '未知',
          package_name: order.套餐?.套餐名称?.[0] || order.套餐名称 || '未知套餐',
          order_time: '历史订单',
          order_status: order.订单状态 || '已完成',
          service_location: '未知',
          price: order.套餐?.套餐价格?.[0] || order.套餐价格 || 0
        };
      });
    } else {
      historyItems.value = [];
    }

    return true;
  } catch (error) {
    console.error('加载本地数据失败:', error);
    return false;
  }
}

onMounted(async () => {
  await initDisplay();
  try {
    if (typeof window.replaceMacros === 'function') {
      userName.value = await window.replaceMacros('小哥哥');
    }
  } catch (e) {
    userName.value = '玩家';
  }
});
</script>

<style lang="scss" scoped>
.app-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
  position: absolute;
  top: 0;
  left: 0;
}

.app-header {
  background: linear-gradient(135deg, #ffffff 0, #fafbfc 100%);
  padding: 35px 16px 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;

  .title {
    font-size: 1.3rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #1a1a1a;

    i {
      color: #ffc300;
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

.user-profile-card {
  background: linear-gradient(135deg, #ffffff 0, #fffef8 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 195, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;

  .avatar-wrapper {
    position: relative;

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ffc300 0, #e6b000 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 32px;
      color: white;
      box-shadow: 0 4px 12px rgba(255, 195, 0, 0.3);

      i {
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
    }

    .avatar-badge {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FFD54F 0%, #FFC300 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      i {
        font-size: 14px;
        color: white;
      }
    }
  }

  .user-info {
    flex-grow: 1;

    .user-name {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #1a1a1a;
    }

    .user-level {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: linear-gradient(135deg, #fff9e6, #fff);
      border: 1px solid #ffc300;
      border-radius: 50px;
      font-size: 13px;
      font-weight: 600;
      color: #d98600;
      margin-bottom: 12px;

      i {
        color: #ffc300;
      }
    }

    .user-stats {
      display: flex;
      align-items: center;
      gap: 16px;

      .stat-item {
        text-align: center;

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 11px;
          color: #999999;
        }
      }

      .stat-divider {
        width: 1px;
        height: 30px;
        background: #f0f0f0;
      }
    }
  }
}

.card {
  background: linear-gradient(135deg, #ffffff 0, #fffef8 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 195, 0, 0.1);

  .card-title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;

    i {
      color: #ffc300;
    }
  }
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.action-item {
  text-align: center;
  cursor: pointer;
  transition: all 0.25s;
  padding: 12px;
  border-radius: 12px;

  &:hover {
    background: #fff9e6;
    transform: translateY(-2px);
  }

  .action-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 auto 8px;
    font-size: 24px;
    color: white;
    transition: all 0.25s;

    &.bg-primary {
      background: linear-gradient(135deg, #ffc300 0, #e6b000 100%);
    }

    &.bg-success {
      background: linear-gradient(135deg, #4CAF50 0, #81C784 100%);
    }

    &.bg-warning {
      background: linear-gradient(135deg, #FF6B6B 0, #FF5252 100%);
    }

    &.bg-info {
      background: linear-gradient(135deg, #A78BFA 0, #8B5CF6 100%);
    }
  }

  .action-label {
    font-size: 12px;
    color: #666666;
    font-weight: 500;
  }
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.category-item {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  padding: 12px 8px;
  border-radius: 12px;
  position: relative;

  &:hover {
    background: #fff9e6;
    transform: translateY(-2px);
  }

  .category-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 8px;
    background: linear-gradient(135deg, #ffc300 0, #e6b000 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s;

    &:hover {
      transform: rotate(360deg) scale(1.1);
    }
  }

  .category-label {
    font-size: 12px;
    color: #666666;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .category-count {
    font-size: 11px;
    color: #999999;
  }
}

.service-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.25s;

  &:hover {
    background: #fff9e6;
    transform: translateX(4px);
  }

  .service-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #fff9e6, #fff);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 18px;
    color: #ffc300;
    border: 1px solid #ffc300;
  }

  .service-info {
    flex-grow: 1;

    .service-name {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 4px;
    }

    .service-meta {
      display: flex;
      gap: 8px;
      font-size: 12px;

      .service-time {
        color: #999999;
      }

      .service-status {
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 500;
      }
    }
  }

  .service-price {
    font-size: 16px;
    font-weight: 700;
    color: #FF6B6B;
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999999;
  line-height: 1.6;
}

.search-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.search-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #fff9e6, #fff);
  border: 1px solid #ffc300;
  border-radius: 50px;
  font-size: 13px;
  font-weight: 500;
  color: #d98600;
  cursor: pointer;
  transition: all 0.25s;

  &:hover {
    background: linear-gradient(135deg, #ffc300, #e6b000);
    color: white;
    transform: translateY(-2px);
  }

  i {
    font-size: 11px;
  }
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.settings-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s;

  &:hover {
    background: #fff9e6;
    transform: translateX(4px);
  }

  .settings-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #fff9e6, #fff);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 18px;
    color: #ffc300;
    border: 1px solid #ffc300;
  }

  .settings-info {
    flex-grow: 1;

    .settings-title {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 4px;
    }

    .settings-desc {
      font-size: 12px;
      color: #999999;
    }
  }

  .settings-toggle,
  .settings-arrow {
    font-size: 18px;
    color: #999999;
    transition: all 0.25s;

    &:hover {
      color: #ffc300;
    }
  }
}

.nav-bar {
  display: flex;
  border-top: 1px solid #f0f0f0;
  background: linear-gradient(135deg, #ffffff 0, #fafbfc 100%);
  padding: 8px 0;
  flex-shrink: 0;

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #666666;
    font-size: 0.8rem;
    padding: 4px 0;
    cursor: pointer;
    transition: all 0.25s;
    border-radius: 8px;
    margin: 0 4px;

    &.active {
      color: #1a1a1a;

      i {
        color: #ffc300;
        transform: scale(1.15) translateY(-2px);
      }
    }

    &:hover:not(.active) {
      color: #333333;
      transform: translateY(-1px);
    }

    i {
      font-size: 1.25rem;
      margin-bottom: 4px;
      transition: all 0.25s;
    }
  }
}

@media (max-width: 480px) {
  .user-profile-card {
    flex-direction: column;
    text-align: center;

    .user-stats {
      justify-content: space-around;
    }
  }

  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
