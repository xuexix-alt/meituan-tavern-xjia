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
          <h2 class="user-name">{{ username }}</h2>
          <div class="user-level">
            <i class="fas fa-star"></i>
            <span>VIP用户 8128</span>
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
          <div class="settings-item" @click="regenerateShops">
            <div class="settings-icon">
              <i class="fas fa-sync-alt"></i>
            </div>
            <div class="settings-info">
              <div class="settings-title">重新生成首页店铺</div>
              <div class="settings-desc">重新生成首页店铺</div>
            </div>
            <div class="settings-arrow">
              <i class="fas fa-sync-alt"></i>
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

// 酒馆宏替换函数声明
declare global {
  interface Window {
    replaceMacros: (macro: string) => Promise<string>;
  }
}

// 响应式数据
const isDarkMode = ref(false);
const fullStatData = ref<any>(null);
const username = ref<string>('玩家'); // 默认用户名

// 统计数据
const accountBalance = computed(() => {
  if (fullStatData.value?.经济?.账户余额 !== undefined) {
    return fullStatData.value.经济.账户余额;
  }
  return '--';
});

const totalSpending = computed(() => {
  // 从服务中的订单计算累计消费
  const orders = fullStatData.value?.['服务中的订单'] || fullStatData.value?.服务中的订单 || [];
  if (Array.isArray(orders)) {
    const total = orders.reduce((sum: number, order: any) => {
      const price = order.套餐?.套餐价格 || order.套餐价格 || 0;
      return sum + (typeof price === 'number' ? price : 0);
    }, 0);
    return total || 0;
  }
  return 0;
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

// 重新生成首页店铺
function regenerateShops() {
  sendToAI('/send 生成-首页-熟人店铺2个-路人店铺2个');
}

// 获取用户头像 - 简化版本，使用默认图标
function getUserAvatar(): boolean {
  // 暂时不实现复杂头像获取，使用默认用户图标
  console.log('使用默认用户头像图标');
  return false;
}

// 初始化数据
async function initDisplay() {
  try {
    const messages = await getChatMessages('latest');
    if (!messages || messages.length === 0 || !messages[0].data) {
      console.warn('未获取到消息数据，使用默认空数据');
      fullStatData.value = {};
      return true;
    }

    const statData = messages[0].data.stat_data;
    if (!statData) {
      console.warn('消息数据中无 stat_data，使用默认空数据');
      fullStatData.value = {};
      return true;
    }

    fullStatData.value = statData;

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

// async function loadFullExampleData() {
//   // 此函数已废弃，不再加载本地示例数据
//   // 以避免404错误
//   return false;
// }


onMounted(async () => {
  // 加载主题设置
  const savedTheme = localStorage.getItem('app-theme');
  if (savedTheme === 'dark') {
    isDarkMode.value = true;
    window.dispatchEvent(new CustomEvent('theme-change', {
      detail: { isDark: true }
    }));
  }

  // 尝试从 SillyTavern 获取用户名
  if (SillyTavern?.name1) {
    username.value = SillyTavern.name1;
    console.log('从 SillyTavern 获取用户名:', username.value);
  } else {
    // 尝试从全局变量获取
    try {
      const globalVars = getVariables({ type: 'global' });
      if (globalVars?.user_name) {
        username.value = globalVars.user_name;
        console.log('从全局变量获取用户名:', username.value);
      } else {
        console.log('未找到用户名，使用默认:', username.value);
      }
    } catch (e) {
      console.log('获取全局变量失败:', e);
    }
  }

  // 初始化头像（使用默认图标）
  getUserAvatar();

  await initDisplay();
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
