<template>
  <div class="app-view active">
    <!-- 首页内容 -->
    <div class="app-header">
      <div class="title">
        <i class="fas fa-home"></i>
        <span>首页</span>
      </div>
    </div>

    <div class="app-content">
      <!-- 分类网格 -->
      <div class="category-grid">
        <div class="category-item" @click="search('各类路人')">
          <div class="icon-wrapper"><i class="fas fa-street-view"></i></div>
          <span>路人</span>
        </div>
        <div class="category-item" @click="search('路人商品-各类场景偶遇的心动女孩主题')">
          <div class="icon-wrapper"><i class="fas fa-mask"></i></div>
          <span>偶遇</span>
        </div>
        <div class="category-item" @click="search('路人商品-色情片中的AV女优主题')">
          <div class="icon-wrapper"><i class="fas fa-video"></i></div>
          <span>AV</span>
        </div>
        <div class="category-item" @click="search('路人商品-街上遇到的心动美女主题')">
          <div class="icon-wrapper"><i class="fas fa-camera-retro"></i></div>
          <span>街拍</span>
        </div>
        <div class="category-item" @click="search('熟人商品-各类主题')">
          <div class="icon-wrapper"><i class="fas fa-user-friends"></i></div>
          <span>熟人</span>
        </div>
        <div class="category-item" @click="search('熟人商品-各类乱伦主题')">
          <div class="icon-wrapper"><i class="fas fa-heart-broken"></i></div>
          <span>乱伦</span>
        </div>
        <div class="category-item" @click="search('熟人商品-各类职场主题')">
          <div class="icon-wrapper"><i class="fas fa-briefcase"></i></div>
          <span>职场</span>
        </div>
        <div class="category-item" @click="search('熟人商品-各类朋友妻主题')">
          <div class="icon-wrapper"><i class="fas fa-users"></i></div>
          <span>友妻</span>
        </div>
      </div>

      <!-- 搜索栏 -->
      <div class="search-bar-container">
        <i class="fas fa-search"></i>
        <input
          v-model="searchKeyword"
          placeholder="搜索心仪的美人或服务..."
          @keyup.enter="doSearch"
        />
        <button class="search-btn" @click="doSearch">搜索</button>
      </div>

      <!-- 特色玩法 -->
      <div class="list-section">
        <div class="section-header">
          <h3>特色玩法</h3>
        </div>
        <div class="feature-button-grid">
          <!-- 特色玩法按钮已移除，测试酒馆信息解析功能 -->
        </div>
      </div>

    </div>

    <!-- 底部导航 -->
    <div class="nav-bar">
      <div class="nav-item active" @click="$router.push('/')">
        <i class="fas fa-home"></i>
        <span>首页</span>
      </div>
      <div class="nav-item" @click="$router.push('/discover')">
        <i class="fas fa-compass"></i>
        <span>发现</span>
      </div>
      <div class="nav-item" @click="$router.push('/service')">
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
import { ref } from 'vue';

// 响应式数据
const searchKeyword = ref('');

// 搜索功能
function search(keyword: string) {
  sendToAI(`/send 搜索：${keyword}`);
}

function doSearch() {
  if (searchKeyword.value.trim()) {
    search(searchKeyword.value.trim());
  }
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
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.app-header {
  background: linear-gradient(135deg, var(--bg-header) 0, var(--bg-header-light) 100%);
  padding: 35px 16px 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  backdrop-filter: blur(10px);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border-color), transparent);
  }

  .title {
    font-size: 1.3rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-primary);
    transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);

    i {
      color: var(--accent-primary);
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      padding: 4px;
      border-radius: 6px;

      &:hover {
        background-color: rgba(255, 195, 0, 0.2);
        transform: scale(1.1) rotate(-5deg);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
    }
  }
}

.app-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    display: none;
  }
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.category-item {
  text-align: center;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    background: radial-gradient(circle, rgba(255, 195, 0, 0.3), transparent);
    border-radius: 50%;
    transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    z-index: -1;
  }

  &:active::before {
    width: 80px;
    height: 80px;
    animation: ripple 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .icon-wrapper {
    width: 55px;
    height: 55px;
    background: var(--bg-badge);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 12px;
    font-size: 1.5rem;
    color: var(--accent-primary);
    box-shadow: var(--shadow-sm);
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    overflow: hidden;
    border: 2px solid transparent;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      transition: left 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    &:hover::before {
      left: 100%;
    }
  }

  &:hover .icon-wrapper {
    transform: scale(1.1) rotate(8deg);
    box-shadow: var(--shadow-md);
    background: linear-gradient(135deg, var(--accent-primary) 0, var(--accent-dark) 100%);
    color: #ffffff;
    border-color: var(--border-accent);
  }

  &:active .icon-wrapper {
    transform: scale(0.95) rotate(3deg);
  }
}

.search-bar-container {
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border-radius: 50px;
  padding: 4px 8px 4px 16px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-accent);
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 195, 0, 0.1), transparent);
    transition: left 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  &:focus-within {
    box-shadow:
      0 10px 15px rgba(0, 0, 0, 0.1),
      0 0 0 3px var(--border-accent);
    border-color: var(--accent-primary);
    transform: translateY(-1px);

    &::before {
      left: 100%;
    }

    i {
      color: var(--accent-primary);
    }
  }

  i {
    color: var(--text-secondary);
    transition: color 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  input {
    flex-grow: 1;
    border: none;
    outline: 0;
    background: transparent;
    padding: 8px 12px;
    font-size: 0.9rem;
    color: var(--text-primary);
    transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);

    &::placeholder {
      color: var(--text-secondary);
      transition: color 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    &:focus::placeholder {
      color: var(--text-placeholder);
    }
  }

  .search-btn {
    background: linear-gradient(135deg, var(--accent-primary) 0, var(--accent-dark) 100%);
    color: #ffffff;
    border: none;
    border-radius: 50px;
    padding: 8px 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    &:hover {
      background: linear-gradient(135deg, var(--accent-dark) 0, #cc9900 100%);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    &:active::before {
      width: 100px;
      height: 100px;
      animation: ripple 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
  }
}

.list-section {
  background: var(--bg-card);
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-accent);
  position: relative;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 195, 0, 0.03), transparent);
    transition: left 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  &:hover::before {
    left: 100%;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      margin: 0;
      font-size: 1.15rem;
      color: var(--text-primary);
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);

      &::before {
        content: '';
        display: block;
        width: 4px;
        height: 18px;
        background: linear-gradient(135deg, var(--accent-primary) 0, #ff6b35 100%);
        border-radius: 6px;
        transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }
    }
  }

  &:hover .section-header h3::before {
    width: 6px;
    height: 20px;
    box-shadow: 0 0 8px rgba(255, 195, 0, 0.4);
  }
}

.feature-button-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 0;
}

.nav-bar {
  display: flex;
  border-top: 1px solid var(--border-color);
  background: linear-gradient(135deg, var(--bg-header) 0, var(--bg-header-light) 100%);
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

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px 20px;
  line-height: 1.6;
}

// 动画
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes bounce {
  0%,
  100%,
  20%,
  53%,
  80% {
    transform: translate3d(0, 0, 0);
  }
  40%,
  43% {
    transform: translate3d(0, -8px, 0);
  }
  70% {
    transform: translate3d(0, -4px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}
</style>
