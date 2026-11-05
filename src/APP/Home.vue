<template>
  <div class="app-view active">
    <div class="app-header">
      <div class="title"><i class="fas fa-home" aria-hidden="true"></i><span>首页</span></div>
    </div>
    <div class="app-content home-content">
      <section class="brand-banner" aria-label="美人团外卖">
        <div>
          <p class="brand-label">美人团外卖 <span>v4.0.0</span></p>
          <h2>随心所欲 · 跨越时空</h2>
          <p class="brand-subtitle">为您送上一切心动的美人</p>
        </div>
        <i class="fas fa-heart banner-icon" aria-hidden="true"></i>
      </section>
      <div class="home-layout">
        <section class="home-main" aria-label="探索与搜索">
          <!-- 搜索栏 -->
          <div class="search-bar-container" role="search" aria-label="搜索店铺">
            <i class="fas fa-search"></i>
            <input
              v-model="searchKeyword"
              aria-label="搜索店铺或主题"
              placeholder="搜索店铺、主题或想遇见的人…"
              @keyup.enter="doSearch"
            />
            <button
              class="search-btn"
              :class="{ 'is-stopping': isGenerating }"
              @click="isGenerating ? cancelGeneration() : doSearch()"
            >
              {{ isGenerating ? '停止' : '搜索' }}
            </button>
          </div>

          <!-- 分类网格 -->
          <div class="category-grid" :class="{ 'is-generating': isGenerating }" :aria-busy="isGenerating">
            <div
              class="category-item"
              role="button"
              tabindex="0"
              @click="search('各类路人商品-2个店铺每个含3个套餐', '路人')"
              @keydown.enter.prevent="search('各类路人商品-2个店铺每个含3个套餐', '路人')"
              @keydown.space.prevent="search('各类路人商品-2个店铺每个含3个套餐', '路人')"
            >
              <div class="icon-wrapper"><i class="fas fa-street-view"></i></div>
              <span>路人</span>
            </div>
            <div
              class="category-item"
              role="button"
              tabindex="0"
              @click="search('路人商品-各类场景偶遇的心动女孩主题-2个店铺每个含3个套餐', '偶遇')"
              @keydown.enter.prevent="search('路人商品-各类场景偶遇的心动女孩主题-2个店铺每个含3个套餐', '偶遇')"
              @keydown.space.prevent="search('路人商品-各类场景偶遇的心动女孩主题-2个店铺每个含3个套餐', '偶遇')"
            >
              <div class="icon-wrapper"><i class="fas fa-mask"></i></div>
              <span>偶遇</span>
            </div>
            <div
              class="category-item"
              role="button"
              tabindex="0"
              @click="search('路人商品-色情片中的AV女优主题-2个店铺每个含3个套餐', 'AV')"
              @keydown.enter.prevent="search('路人商品-色情片中的AV女优主题-2个店铺每个含3个套餐', 'AV')"
              @keydown.space.prevent="search('路人商品-色情片中的AV女优主题-2个店铺每个含3个套餐', 'AV')"
            >
              <div class="icon-wrapper"><i class="fas fa-video"></i></div>
              <span>AV</span>
            </div>
            <div
              class="category-item"
              role="button"
              tabindex="0"
              @click="search('路人商品-街上遇到的心动美女主题-2个店铺每个含3个套餐', '街拍')"
              @keydown.enter.prevent="search('路人商品-街上遇到的心动美女主题-2个店铺每个含3个套餐', '街拍')"
              @keydown.space.prevent="search('路人商品-街上遇到的心动美女主题-2个店铺每个含3个套餐', '街拍')"
            >
              <div class="icon-wrapper"><i class="fas fa-camera-retro"></i></div>
              <span>街拍</span>
            </div>
            <div
              class="category-item"
              role="button"
              tabindex="0"
              @click="search('各类熟人商品-2个店铺每个含3个套餐', '熟人')"
              @keydown.enter.prevent="search('各类熟人商品-2个店铺每个含3个套餐', '熟人')"
              @keydown.space.prevent="search('各类熟人商品-2个店铺每个含3个套餐', '熟人')"
            >
              <div class="icon-wrapper"><i class="fas fa-user-friends"></i></div>
              <span>熟人</span>
            </div>
            <div
              class="category-item"
              role="button"
              tabindex="0"
              @click="search('熟人商品-乱伦主题（不得含母子）-2个店铺每个含3个套餐', '乱伦')"
              @keydown.enter.prevent="search('熟人商品-乱伦主题（不得含母子）-2个店铺每个含3个套餐', '乱伦')"
              @keydown.space.prevent="search('熟人商品-乱伦主题（不得含母子）-2个店铺每个含3个套餐', '乱伦')"
            >
              <div class="icon-wrapper"><i class="fas fa-heart-broken"></i></div>
              <span>乱伦</span>
            </div>
            <div
              class="category-item"
              role="button"
              tabindex="0"
              @click="search('熟人商品-各类职场主题-2个店铺每个含3个套餐', '职场')"
              @keydown.enter.prevent="search('熟人商品-各类职场主题-2个店铺每个含3个套餐', '职场')"
              @keydown.space.prevent="search('熟人商品-各类职场主题-2个店铺每个含3个套餐', '职场')"
            >
              <div class="icon-wrapper"><i class="fas fa-briefcase"></i></div>
              <span>职场</span>
            </div>
            <div
              class="category-item"
              role="button"
              tabindex="0"
              @click="search('熟人商品-各类朋友妻主题-2个店铺每个含3个套餐', '友妻')"
              @keydown.enter.prevent="search('熟人商品-各类朋友妻主题-2个店铺每个含3个套餐', '友妻')"
              @keydown.space.prevent="search('熟人商品-各类朋友妻主题-2个店铺每个含3个套餐', '友妻')"
            >
              <div class="icon-wrapper"><i class="fas fa-users"></i></div>
              <span>友妻</span>
            </div>
          </div>

          <!-- 特色玩法 -->
          <div class="list-section">
            <div class="section-header">
              <h3>特色玩法</h3>
            </div>
            <div class="feature-button-grid">
              <!-- DLC按钮 -->
              <div class="feature-button-item">
                <button
                  class="dlc-button"
                  title="DLC需先挂载世界书"
                  :disabled="isGenerating"
                  @click="generateDLCContent"
                >
                  <div class="dlc-icon">
                    <i class="fas fa-history"></i>
                  </div>
                  <span class="dlc-text">DLC:1995国企往事</span>
                  <div class="dlc-badge">NEW</div>
                </button>
              </div>
            </div>
          </div>
        </section>
        <aside class="home-aside" aria-label="公告与帮助">
          <details class="announcement-panel">
            <summary>
              <span class="summary-heading"><i class="fas fa-bullhorn" aria-hidden="true"></i> 最新公告</span>
              <span class="notice-preview">新增「国企往事」DLC</span>
              <i class="fas fa-chevron-down disclosure-icon" aria-hidden="true"></i>
            </summary>
            <div class="panel-content">
              <p><span class="notice-tag">活动</span> 新增“国企往事”DLC，挂载世界书后点击即可</p>
              <p><span class="notice-tag">更新</span> 现在店铺脚本有快捷按钮导出JSON，欢迎分享到发布贴中供大家品尝</p>
              <p>
                <span class="notice-tag">更新</span> 当前推荐非json格式的APP生成方式，深度为0，顺序-1，根据预设情况调整
              </p>
              <p>
                <span class="notice-tag">更新</span> 截断问题多出自预设和正则，我也没有更好的办法，不行你就还我的预设
              </p>
              <p>
                <span class="notice-tag">更新</span>
                经常被截断推荐默认的非js生成模式，破限不完全的预设搜不出明星，只能搜出高仿货🤣
              </p>
            </div>
          </details>
          <details class="help-panel">
            <summary>
              <span class="summary-heading"><i class="fas fa-circle-question" aria-hidden="true"></i> 玩法与帮助</span>
              <span class="notice-preview">搜索、结束服务与更新说明</span>
              <i class="fas fa-chevron-down disclosure-icon" aria-hidden="true"></i>
            </summary>
            <div class="panel-content">
              <ol>
                <li>女孩你不想玩了最好向AI下指令“结束服务”。</li>
                <li>搜某种类别时最好加上“X店铺每个x套餐”。</li>
                <li>正确更新APP的方式是关掉酒馆清空浏览器缓存。</li>
                <li>世界书有二选一模式，如果常截断可以试试不同框架。</li>
              </ol>
            </div>
          </details>
        </aside>
      </div>
    </div>
    <!-- 底部导航 -->
    <nav class="nav-bar">
      <button type="button" class="nav-item active" aria-current="page" @click="$router.push('/home')">
        <i class="fas fa-home"></i>
        <span>首页</span>
      </button>
      <button type="button" class="nav-item" @click="$router.push('/discover')">
        <i class="fas fa-compass"></i>
        <span>发现</span>
      </button>
      <button type="button" class="nav-item" @click="$router.push('/service')">
        <i class="fas fa-concierge-bell"></i>
        <span>服务</span>
      </button>
      <button type="button" class="nav-item" @click="$router.push('/history')">
        <i class="fas fa-history"></i>
        <span>历史</span>
      </button>
      <button type="button" class="nav-item" @click="$router.push('/me')">
        <i class="fas fa-user"></i>
        <span>我的</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { generationTask } from './services/generationTaskSingleton';

// 响应式数据
const searchKeyword = ref('');
const isGenerating = generationTask.isBusy;

// 搜索功能
function search(keyword: string, label: string) {
  void generationTask.start(`搜索：${keyword}`, label);
}

function doSearch() {
  if (searchKeyword.value.trim()) {
    search(searchKeyword.value.trim(), '自定义搜索');
  }
}

function cancelGeneration() {
  generationTask.cancel();
}

// DLC内容生成功能
function generateDLCContent() {
  const dlcMessage =
    '生成-首页-店铺列表：1个名为"组织部派来一个年轻人"。其中包含7个套餐，女孩名字分别是：1苏晴；2白慧；3丁小芹；4王春燕；5林婉仪；6秦舒澜；7藤原千惠。套餐内容严格按照设定。';
  search(dlcMessage, '1995国企往事');
}
</script>

<style lang="scss" scoped>
.app-header,
.title {
  display: flex;
  align-items: center;
}
.app-header {
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-color);
}
.title {
  gap: 10px;
  font-size: 1.2rem;
  font-weight: 700;
}
.title i {
  display: grid;
  place-items: center;
  color: var(--accent-text);
}
.home-content {
  scrollbar-gutter: stable;
}
.brand-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  margin-bottom: 18px;
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-card);
  background: linear-gradient(120deg, color-mix(in srgb, var(--accent-primary) 15%, var(--bg-item)), var(--bg-item));
  h2 {
    margin: 4px 0;
    color: var(--accent-text);
    font-size: clamp(20px, 3.6cqw, 30px);
    font-weight: 750;
    line-height: 1.35;
  }
}
.brand-label {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
}
.brand-label span {
  margin-left: 8px;
  font-size: 11px;
  font-weight: 400;
}
.brand-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
}
.banner-icon {
  flex-shrink: 0;
  color: var(--accent-primary);
  font-size: 32px;
}
.home-layout,
.home-main,
.home-aside {
  display: grid;
  gap: 18px;
  min-width: 0;
  align-content: start;
}
.search-bar-container {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
  padding: 6px 8px 6px 14px;
  min-height: 56px;
  background: var(--bg-item);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  &:focus-within {
    border-color: var(--accent-dark);
    box-shadow: 0 0 0 3px var(--border-accent);
  }
  > i {
    color: var(--accent-text);
  }
  input {
    flex: 1;
    min-width: 0;
    width: 0;
    min-height: 44px;
    padding: 8px 0;
    border: 0;
    background: transparent;
    color: var(--text-primary);
    font-size: 16px;
  }
  input::placeholder {
    color: var(--text-secondary);
  }
}
.search-btn {
  min-height: 44px;
  padding: 8px 18px;
  border: 0;
  border-radius: var(--radius-control);
  background: var(--accent-primary);
  color: var(--on-accent);
  font-weight: 700;
  cursor: pointer;
  &.is-stopping {
    background: var(--status-danger);
    color: var(--bg-item);
  }
}
.category-grid {
  display: grid;
}
.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  min-width: 0;
  min-height: 72px;
  padding: 5px 0;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  border-radius: var(--radius-control);
  touch-action: manipulation;
  &:focus-visible {
    outline: 3px solid var(--accent-dark);
    outline-offset: 2px;
  }
  &:active {
    background: var(--bg-item-hover);
  }
}
.icon-wrapper {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: var(--bg-item);
  border: 1px solid var(--border-accent);
  color: var(--accent-text);
  font-size: 21px;
}
.section-header h3 {
  margin: 0 0 10px;
  font-size: 16px;
}
.feature-button-grid {
  display: grid;
  gap: 12px;
}
.dlc-button {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 68px;
  padding: 12px 16px;
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-card);
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
}
.dlc-icon {
  display: grid;
  place-items: center;
  flex: 0 0 40px;
  height: 40px;
  background: var(--bg-item-hover);
  color: var(--accent-text);
  border-radius: 12px;
}
.dlc-text {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 15px;
  font-weight: 700;
}
.dlc-badge {
  padding: 2px 6px;
  background: var(--accent-primary);
  color: var(--on-accent);
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
}
.home-aside details {
  min-width: 0;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  background: var(--bg-item);
}
summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 16px;
  gap: 4px 12px;
  align-items: center;
  min-height: 72px;
  padding: 12px 14px;
  cursor: pointer;
  list-style: none;
  &::-webkit-details-marker {
    display: none;
  }
  &:focus-visible {
    outline: 3px solid var(--accent-dark);
    outline-offset: 2px;
    border-radius: var(--radius-card);
  }
}
.summary-heading {
  min-width: 0;
  font-size: 14px;
  font-weight: 700;
}
.summary-heading i {
  margin-right: 4px;
  color: var(--accent-text);
}
.notice-preview {
  grid-column: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--text-secondary);
  overflow-wrap: anywhere;
}
.disclosure-icon {
  grid-column: 2;
  grid-row: 1 / 3;
  color: var(--text-secondary);
  font-size: 12px;
}
details[open] .disclosure-icon {
  transform: rotate(180deg);
}
.panel-content {
  padding: 0 14px 14px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.7;
  overflow-wrap: anywhere;
  p {
    margin: 0 0 10px;
  }
  p:last-child {
    margin-bottom: 0;
  }
  ol {
    margin: 0;
    padding-left: 20px;
  }
  li + li {
    margin-top: 8px;
  }
}
.notice-tag {
  padding: 2px 5px;
  border-radius: 4px;
  background: var(--accent-primary);
  color: var(--on-accent);
  font-size: 11px;
}
.nav-bar {
  display: flex;
  flex-shrink: 0;
}
.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
}
.nav-item i {
  font-size: 20px;
}
@container (min-width: 600px) {
  .home-aside {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
}
@container (min-width: 900px) {
  .home-layout {
    grid-template-columns: minmax(0, 1fr) 280px;
    gap: 24px;
  }
  .home-aside {
    grid-template-columns: minmax(0, 1fr);
  }
}
@container (max-width: 359px) {
  .brand-banner {
    padding: 12px 14px;
    margin-bottom: 12px;
  }
  .banner-icon {
    display: none;
  }
  .home-layout,
  .home-main,
  .home-aside {
    gap: 12px;
  }
  .search-btn {
    padding-inline: 12px;
  }
}
</style>
