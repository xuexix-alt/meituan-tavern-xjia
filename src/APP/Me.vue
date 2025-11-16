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
            <img v-if="userAvatar" :src="userAvatar" :alt="userName" />
            <i v-else class="fas fa-user"></i>
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

      <!-- 最近服务 -->
      <div class="card">
        <div class="card-title">
          <i class="fas fa-clock"></i>最近服务
        </div>
        <div v-if="recentServices.length === 0" class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>暂无最近服务记录</p>
        </div>
        <div v-for="service in recentServices" :key="service.id" class="service-item" @click="reorder(service)">
          <div class="service-icon">
            <i :class="service.icon"></i>
          </div>
          <div class="service-info">
            <div class="service-name">{{ service.name }}</div>
            <div class="service-meta">
              <span class="service-time">{{ service.time }}</span>
              <span class="service-status" :class="service.status">{{ service.status }}</span>
            </div>
          </div>
          <div class="service-price">{{ service.price }}</div>
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
              <i :class="['fas', isDarkMode ? 'fa-sun' : 'fa-moon']"></i>
            </div>
            <div class="settings-info">
              <div class="settings-title">{{ isDarkMode ? '浅色模式' : '深色模式' }}</div>
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
              <div class="settings-desc">返回首页浏览店铺</div>
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
const userAvatar = ref('');
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

// 最近服务
const recentServices = computed(() => {
  return historyItems.value.slice(0, 5).map((item, index) => ({
    id: index,
    name: item.girl_name || '未知',
    icon: 'fas fa-heart',
    time: item.order_time || '历史订单',
    status: getStatusClass(item.order_status || '已完成'),
    price: `¥${item.price || 0}`
  }));
});

// 状态样式类名
function getStatusClass(status: string) {
  const statusMap: Record<string, string> = {
    '已完成': 'status-completed',
    '订单结束': 'status-ended',
    '服务结束': 'status-ended',
    '进行中': 'status-ongoing'
  };
  return statusMap[status] || 'status-completed';
}

// 发送AI指令
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
  // 触发全局主题切换事件
  window.dispatchEvent(new CustomEvent('theme-change', {
    detail: { isDark: isDarkMode.value }
  }));
  // 持久化主题设置
  localStorage.setItem('app-theme', isDarkMode.value ? 'dark' : 'light');
}

// 刷新数据
function refreshData() {
  window.location.reload();
}

// 返回首页（修改后的指令）
function goHome() {
  sendToAI('/send 首页-路人商品1个店铺-熟人商品一个店铺');
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

// 获取用户头像（使用酒馆宏）
async function getUserAvatar() {
  try {
    if (typeof window.replaceMacros === 'function') {
      // 使用酒馆宏获取头像URL
      const avatarUrl = await window.replaceMacros('{{user_avatar}}');
      if (avatarUrl && avatarUrl !== '{{user_avatar}}') {
        userAvatar.value = avatarUrl;
        return;
      }
    }
    // 如果没有头像宏，使用默认头像或生成头像
    userAvatar.value = '';
  } catch (e) {
    console.error('获取用户头像失败:', e);
    userAvatar.value = '';
  }
}

onMounted(async () => {
  // 加载主题设置
  const savedTheme = localStorage.getItem('app-theme');
  if (savedTheme === 'dark') {
    isDarkMode.value = true;
    window.dispatchEvent(new CustomEvent('theme-change', {
      detail: { isDark: true }
    }));
  }

  await initDisplay();

  // 获取用户名（使用酒馆宏{{user}}）
  try {
    if (typeof window.replaceMacros === 'function') {
      const userNameMacro = await window.replaceMacros('{{user}}');
      if (userNameMacro && userNameMacro !== '{{user}}') {
        userName.value = userNameMacro;
      }
    }
  } catch (e) {
    console.error('获取用户名失败:', e);
    userName.value = '玩家';
  }

  // 获取用户头像
  await getUserAvatar();
});
</script>

<style lang="scss" scoped>
.app-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  position: absolute;
  top: 0;
  left: 0;
  transition: background-color 0.3s ease;
}

.app-header {
  background: linear-gradient(135deg, var(--bg-header) 0, var(--bg-header-light) 100%);
  padding: 35px 16px 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  transition: all 0.3s ease;

  .title {
    font-size: 1.3rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-primary);

    i {
      color: var(--accent-primary);
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
  background: var(--bg-card);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-accent);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .avatar-wrapper {
    position: relative;

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent-primary) 0, var(--accent-dark) 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 32px;
      color: white;
      box-shadow: var(--shadow-md);
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

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
      background: linear-gradient(135deg, var(--accent-light) 0%, var(--accent-primary) 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      border: 2px solid var(--bg-card);
      box-shadow: var(--shadow-sm);

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
      color: var(--text-primary);
    }

    .user-level {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: var(--bg-badge);
      border: 1px solid var(--accent-primary);
      border-radius: 50px;
      font-size: 13px;
      font-weight: 600;
      color: var(--accent-dark);
      margin-bottom: 12px;
      transition: all 0.3s ease;

      i {
        color: var(--accent-primary);
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
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 11px;
          color: var(--text-secondary);
        }
      }

      .stat-divider {
        width: 1px;
        height: 30px;
        background: var(--border-color);
      }
    }
  }
}

.card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-accent);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: var(--shadow-md);
  }

  .card-title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-primary);

    i {
      color: var(--accent-primary);
    }
  }
}

.service-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-item);
  border-radius: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    background: var(--bg-item-hover);
    transform: translateX(4px);
  }

  .service-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--bg-badge);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 18px;
    color: var(--accent-primary);
    border: 1px solid var(--accent-primary);
  }

  .service-info {
    flex-grow: 1;

    .service-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .service-meta {
      display: flex;
      gap: 8px;
      font-size: 12px;

      .service-time {
        color: var(--text-secondary);
      }

      .service-status {
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 500;

        &.status-completed {
          background-color: rgba(46, 204, 113, 0.2);
          color: #2ecc71;
        }

        &.status-ended {
          background-color: rgba(231, 76, 60, 0.2);
          color: #e74c3c;
        }

        &.status-ongoing {
          background-color: rgba(52, 152, 219, 0.2);
          color: #3498db;
        }
      }
    }
  }

  .service-price {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-price);
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
  line-height: 1.6;

  i {
    font-size: 3rem;
    color: var(--text-placeholder);
    margin-bottom: 16px;
    display: block;
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
  background: var(--bg-item);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    background: var(--bg-item-hover);
    transform: translateX(4px);
  }

  .settings-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--bg-badge);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 18px;
    color: var(--accent-primary);
    border: 1px solid var(--accent-primary);
  }

  .settings-info {
    flex-grow: 1;

    .settings-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .settings-desc {
      font-size: 12px;
      color: var(--text-secondary);
    }
  }

  .settings-toggle,
  .settings-arrow {
    font-size: 18px;
    color: var(--text-secondary);
    transition: all 0.25s ease;

    &:hover {
      color: var(--accent-primary);
    }
  }
}

.nav-bar {
  display: flex;
  border-top: 1px solid var(--border-color);
  background: linear-gradient(135deg, var(--bg-header) 0, var(--bg-header-light) 100%);
  padding: 8px 0;
  flex-shrink: 0;

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--text-secondary);
    font-size: 0.8rem;
    padding: 4px 0;
    cursor: pointer;
    transition: all 0.25s;
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
}
</style>
