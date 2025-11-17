<template>
  <div class="app-view">
    <!-- 服务状态内容 -->
    <div class="app-header">
      <div class="title">
        <i class="fas fa-heart"></i>
        <span>服务状态</span>
      </div>
    </div>

    <div class="app-content">
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

      <!-- 基础信息卡片 -->
      <div class="info-card-grid">
        <div class="info-card">
          <div class="info-icon bg-primary">
            <i class="fas fa-user"></i>
          </div>
          <div class="info-content">
            <div class="info-label">玩家姓名</div>
            <div class="info-value">{{ userName }}</div>
          </div>
        </div>

        <div class="info-card">
          <div class="info-icon bg-warning">
            <i class="fas fa-wallet"></i>
          </div>
          <div class="info-content">
            <div class="info-label">账户余额</div>
            <div class="info-value text-warning">{{ accountBalance }}</div>
          </div>
        </div>

        <div class="info-card">
          <div class="info-icon bg-success">
            <i class="fas fa-shopping-cart"></i>
          </div>
          <div class="info-content">
            <div class="info-label">订单消费</div>
            <div class="info-value text-success">{{ totalSpending }}</div>
          </div>
        </div>
      </div>

      <!-- 美人标签页 -->
      <div class="tabs-container" v-if="girlsData.length > 1">
        <div
          v-for="(girl, index) in girlsData"
          :key="index"
          :class="['tab-item', { active: currentGirlIndex === index }]"
          @click="switchGirl(index)"
        >
          {{ getGirlName(girl) }}
        </div>
      </div>

      <!-- 服务状态详情 -->
      <div class="status-detail-card" v-if="currentGirl">
        <div class="girl-header">
          <div class="girl-basic-info">
            <h2 class="girl-name">{{ basicInfo.name }}</h2>
            <div class="girl-badges">
              <span class="badge badge-hot">HOT</span>
              <span class="badge badge-recommend">推荐</span>
            </div>
          </div>
          <div class="girl-identity">{{ basicInfo.identity }} · {{ basicInfo.age }}岁</div>

          <!-- 星级评分 -->
          <div class="star-rating">
            <i v-for="n in 5" :key="n" :class="['fas fa-star', n <= starRating ? 'star' : 'star empty']"></i>
            <span class="affection-text">{{ affectionDisplay }}/100 好感度</span>
          </div>

          <!-- 特色标签 -->
          <div class="feature-tags">
            <span v-if="basicInfo.hairColor" class="feature-tag">
              <i class="fas fa-paint-brush"></i>{{ basicInfo.hairColor }}
            </span>
            <span v-if="bodyInfo.cup" class="feature-tag">
              <i class="fas fa-heart"></i>{{ bodyInfo.cup }}罩杯
            </span>
          </div>
        </div>

        <!-- 价格信息 -->
        <div class="price-info">
          <div class="price-label">套餐价格</div>
          <div class="price-value">¥{{ packageInfo.price }}</div>
          <div class="location-info">
            <i class="fas fa-map-marker-alt"></i>
            <span>{{ currentLocation }}</span>
          </div>
          <div class="package-name">{{ packageInfo.name }}</div>
          <div :class="['order-status', orderStatus === '服务中' ? 'active' : 'ended']">
            {{ orderStatus }}
          </div>
        </div>
      </div>

      <!-- 订单信息卡片 -->
      <div class="card">
        <div class="card-title">
          <i class="fas fa-clipboard-list"></i>订单信息
        </div>
        <div class="info-grid">
          <div class="info-row">
            <span class="info-key">订单状态</span>
            <span class="info-val">{{ getOrderData('订单状态', '未知') }}</span>
          </div>
          <div class="info-row">
            <span class="info-key">当前地点</span>
            <span class="info-val">{{ getOrderData('当前地点', '未知') }}</span>
          </div>
          <div class="info-row">
            <span class="info-key">订单编号</span>
            <span class="info-val">{{ getOrderData('订单编号', '未知') }}</span>
          </div>
          <div class="info-row">
            <span class="info-key">开始时间</span>
            <span class="info-val">{{ getOrderData('开始时间', '未知') }}</span>
          </div>
        </div>
      </div>

      <!-- 数据网格 -->
      <div class="data-grid">
        <!-- 心跳 -->
        <div class="data-card">
          <div class="circular-progress">
            <svg width="70" height="70">
              <circle class="progress-bg" cx="35" cy="35" r="28"></circle>
              <circle
                :class="['progress-bar', heartbeatClass]"
                cx="35"
                cy="35"
                r="28"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="heartbeatOffset"
              ></circle>
            </svg>
            <div class="progress-text" :style="{ color: heartbeatColor }">
              {{ heartbeatDisplay }}
            </div>
          </div>
          <div class="data-label">心跳</div>
          <div class="data-value">{{ heartbeatDisplay }} <span v-if="heartbeatDisplay !== '-'">bpm</span></div>
        </div>

        <!-- 服务进度 -->
        <div class="data-card">
          <i class="fas fa-chart-line data-icon gradient-purple"></i>
          <div class="data-label">服务进度</div>
          <div class="data-value">{{ serviceProgress }}<span v-if="serviceProgressPercent !== null">%</span></div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" :style="{ width: serviceProgressBarWidth }"></div>
          </div>
        </div>

        <!-- 服务次数 -->
        <div class="data-card">
          <i class="fas fa-redo-alt data-icon gradient-cyan"></i>
          <div class="data-label">服务次数</div>
          <div class="data-value">{{ orderStats.totalOrdersText }}<span v-if="orderStats.totalOrders !== null">次</span></div>
        </div>

        <!-- 好感度 -->
        <div class="data-card">
          <i class="fas fa-heart data-icon gradient-orange"></i>
          <div class="data-label">好感度</div>
          <div class="data-value">{{ affectionDisplay }}<span v-if="affectionDisplay !== '-'">/100</span></div>
        </div>
      </div>

      <!-- 玩法特色 -->
      <div class="card">
        <div class="card-title">
          <i class="fas fa-fire"></i>玩法特色
        </div>
        <div class="feature-tags">
          <button
            v-for="feature in packageInfo.features"
            :key="feature"
            class="feature-tag"
            @click="sendQuick('搜索：' + feature)"
          >
            {{ feature }}
          </button>
          <span v-if="!packageInfo.features || packageInfo.features.length === 0" class="feature-tag">
            暂无特色标签
          </span>
        </div>
      </div>

      <!-- 心理状态 -->
      <div class="card thought-card">
        {{ getNestedValue(currentGirl, '心理状态.当前所想', '-') }}
      </div>

      <!-- 当前着装 -->
      <div class="card accordion">
        <div class="accordion-header" :class="{ active: showClothing }" @click="showClothing = !showClothing">
          <span><i class="fas fa-tshirt"></i> 当前着装</span>
          <i class="fas fa-chevron-down accordion-icon"></i>
        </div>
        <div class="accordion-content" :class="{ show: showClothing }">
          <div class="accordion-body">
            <div v-if="clothingDescription" class="clothing-desc">
              <strong>描述：</strong>{{ clothingDescription }}
            </div>
            <div v-if="hasValidClothing" class="clothing-grid">
              <div v-for="(value, key) in displayClothing" :key="key" class="clothing-card">
                <i :class="['clothing-icon', clothingIcon(key)]"></i>
                <div class="clothing-key">{{ key }}</div>
                <div class="clothing-value">{{ value }}</div>
              </div>
            </div>
            <div v-if="!hasValidClothing && !clothingDescription" class="empty-text">
              暂无着装信息
            </div>
          </div>
        </div>
      </div>

      <!-- 身体特征 -->
      <div class="card accordion">
        <div class="accordion-header" :class="{ active: showBody }" @click="showBody = !showBody">
          <span><i class="fas fa-venus"></i> 身体特征</span>
          <i class="fas fa-chevron-down accordion-icon"></i>
        </div>
        <div class="accordion-content" :class="{ show: showBody }">
          <div class="accordion-body">
            <div class="info-grid">
              <div class="info-row">
                <span class="info-key">三围描述</span>
                <span class="info-val">{{ getNestedValue(currentGirl, '身体特征.三围.描述', '-') }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">乳房形状</span>
                <span class="info-val">{{ getNestedValue(currentGirl, '身体特征.乳房.形状', '-') }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">当前姿势</span>
                <span class="info-val">{{ getNestedValue(currentGirl, '身体特征.姿势', '-') }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">胸部状态</span>
                <span class="info-val">{{ getNestedValue(currentGirl, '身体特征.胸部', '-') }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">私处状态</span>
                <span class="info-val">{{ getNestedValue(currentGirl, '身体特征.私处', '-') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 性经验 -->
      <div class="card accordion">
        <div class="accordion-header" :class="{ active: showExp }" @click="showExp = !showExp">
          <span><i class="fas fa-lock"></i> 性经验</span>
          <i class="fas fa-chevron-down accordion-icon"></i>
        </div>
        <div class="accordion-content" :class="{ show: showExp }">
          <div class="accordion-body">
            <div class="info-grid">
              <div class="info-row">
                <span class="info-key">是否处女</span>
                <span class="info-val">{{ getNestedValue(currentGirl, '性经验.处女', '-') }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">性伴侣数</span>
                <span class="info-val">{{ getNestedValue(currentGirl, '性经验.性伴侣数量', '-') }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">初次对象</span>
                <span class="info-val">{{ getNestedValue(currentGirl, '性经验.初次性行为对象', '-') }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">怀孕几率</span>
                <span class="info-val">{{ getNestedValue(currentGirl, '性经验.怀孕几率', '-') }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">下单次数</span>
                <span class="info-val">{{ getNestedValue(currentGirl, '性经验.下单次数', '-') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 服务统计 -->
      <div class="card accordion">
        <div class="accordion-header" :class="{ active: showStats }" @click="showStats = !showStats">
          <span><i class="fas fa-chart-line"></i> 服务统计</span>
          <i class="fas fa-chevron-down accordion-icon"></i>
        </div>
        <div class="accordion-content" :class="{ show: showStats }">
          <div class="accordion-body">
            <div class="info-grid">
              <div class="info-row">
                <span class="info-key">性交次数</span>
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

      <!-- 服务分类 -->
      <div class="card">
        <div class="card-title">
          <i class="fas fa-th-large"></i>服务分类
        </div>
        <div class="category-grid">
          <div class="category-item" @click="search('路人商品-路人主题')">
            <div class="category-icon"><i class="fas fa-street-view"></i></div>
            <div class="category-label">路人</div>
          </div>
          <div class="category-item" @click="search('路人商品-各类场景偶遇的心动女孩主题')">
            <div class="category-icon"><i class="fas fa-mask"></i></div>
            <div class="category-label">偶遇</div>
          </div>
          <div class="category-item" @click="search('路人商品-色情片中的AV女优主题')">
            <div class="category-icon"><i class="fas fa-video"></i></div>
            <div class="category-label">AV</div>
          </div>
          <div class="category-item" @click="search('路人商品-街上遇到的心动美女主题')">
            <div class="category-icon"><i class="fas fa-camera-retro"></i></div>
            <div class="category-label">街拍</div>
          </div>
          <div class="category-item" @click="search('熟人商品-各类主题')">
            <div class="category-icon"><i class="fas fa-user-friends"></i></div>
            <div class="category-label">熟人</div>
          </div>
          <div class="category-item" @click="search('熟人商品-各类乱伦主题')">
            <div class="category-icon"><i class="fas fa-heart-broken"></i></div>
            <div class="category-label">乱伦</div>
          </div>
          <div class="category-item" @click="search('熟人商品-各类职场主题')">
            <div class="category-icon"><i class="fas fa-briefcase"></i></div>
            <div class="category-label">职场</div>
          </div>
          <div class="category-item" @click="search('熟人商品-各类朋友妻主题')">
            <div class="category-icon"><i class="fas fa-users"></i></div>
            <div class="category-label">友妻</div>
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
        <i class="fas fa-heart"></i>
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
const searchKeyword = ref('');
const girlsData = ref<any[]>([]);
const currentGirlIndex = ref(0);
const showClothing = ref(false);
const showBody = ref(false);
const showExp = ref(false);
const showStats = ref(false);
const fullStatData = ref<any>(null);
const userName = ref('玩家');

// 当前选中的女孩数据
const currentGirl = computed(() => girlsData.value[currentGirlIndex.value] || null);

// 安全获取嵌套值
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

function getGirlName(girl: any) {
  return getNestedValue(girl, '基础信息.姓名') || `女孩 ${girlsData.value.indexOf(girl) + 1}`;
}

// 基础信息
const basicInfo = computed(() => ({
  name: getNestedValue(currentGirl.value, '基础信息.姓名'),
  identity: getNestedValue(currentGirl.value, '基础信息.身份'),
  age: getNestedValue(currentGirl.value, '基础信息.年龄'),
  hairColor: getNestedValue(currentGirl.value, '基础信息.外貌.发色', '')
}));

// 身体信息
const bodyInfo = computed(() => ({
  cup: getNestedValue(currentGirl.value, '身体特征.三围.罩杯')
}));

// 套餐信息
const packageInfo = computed(() => ({
  name: getNestedValue(currentGirl.value, '套餐.套餐名称'),
  price: getNestedValue(currentGirl.value, '套餐.套餐价格'),
  features: currentGirl.value?.套餐?.玩法特色 || []
}));

// 当前地点
const currentLocation = computed(() => {
  if (girlsData.value.length > 0) {
    const currentOrder = girlsData.value[0];
    if (currentOrder['当前地点'] && currentOrder['当前地点'] !== '--') {
      return currentOrder['当前地点'];
    }
  }
  const templateLocation = getNestedValue(fullStatData.value, '订单模板.新订单原型.当前地点');
  if (templateLocation && templateLocation !== '待定') {
    return templateLocation;
  }
  const worldLocation = getNestedValue(fullStatData.value, '系统状态.当前场景');
  if (worldLocation && worldLocation !== '--') {
    return worldLocation;
  }
  return '未知位置';
});

// 订单状态
const orderStatus = computed(() => getNestedValue(currentGirl.value, '订单状态', '-'));

// 订单数据
function getOrderData(key: string, fallback: string = '未知') {
  const currentOrder = (girlsData.value && girlsData.value.length > 0) ? girlsData.value[0] : null;
  const templateLocation = getNestedValue(fullStatData.value, '订单模板.新订单原型', {});
  const orderTemplate = templateLocation || {};

  const orderData: Record<string, any> = {
    '订单状态': currentOrder?.[key] || orderTemplate[key] || '未知',
    '当前地点': currentOrder?.[key] || orderTemplate[key] || '未知',
    '订单编号': orderTemplate[key] || 'ORD-' + Date.now(),
    '开始时间': orderTemplate[key] || new Date().toLocaleString('zh-CN')
  };

  return orderData[key] || fallback;
}

// 统计数据
const orderStats = computed(() => {
  const total = Number(currentGirl.value?.性经验?.下单次数) || null;
  return { totalOrders: total, totalOrdersText: total ?? '-' };
});

// 心跳
const heartbeatRate = computed(() => Number(currentGirl.value?.心跳) || null);
const heartbeatDisplay = computed(() => heartbeatRate.value ?? '-');
const heartbeatClass = computed(() => {
  const rate = heartbeatRate.value;
  if (rate == null) return 'normal';
  if (rate > 140) return 'danger';
  if (rate > 100) return 'warning';
  return 'normal';
});
const heartbeatColor = computed(() => {
  const rate = heartbeatRate.value;
  if (rate == null) return '#9E9E9E';
  if (rate > 140) return '#FF6B6B';
  if (rate > 100) return '#FF9800';
  return '#4CAF50';
});

const circumference = 2 * Math.PI * 28;
const heartbeatOffset = computed(() => {
  const rate = heartbeatRate.value;
  if (rate == null) return circumference;
  const percentage = Math.min(rate / 200, 1);
  return circumference - percentage * circumference;
});

// 好感度和星级
const affectionValue = computed(() => {
  let value = Number(currentGirl.value?.relationship_stats?.affection);
  if (value === undefined || isNaN(value)) {
    value = Number(currentGirl.value?.心理状态?.好感度);
  }
  return value;
});
const affectionDisplay = computed(() => affectionValue.value ?? '-');
const starRating = computed(() => {
  const score = affectionValue.value;
  if (score == null) return 0;
  return Math.max(0, Math.min(5, Math.round((score / 100) * 5)));
});

// 服务进度
const serviceProgressPercent = computed(() => {
  let current = Number(currentGirl.value?.current_service_progress?.sex_count);
  if (current === undefined || isNaN(current)) {
    current = Number(currentGirl.value?.服务统计?.本次服务性交次数);
  }
  if (current === undefined || isNaN(current)) return null;
  return Math.round(Math.min(current / 2, 1) * 100);
});
const serviceProgress = computed(() => serviceProgressPercent.value ?? '-');
const serviceProgressBarWidth = computed(() => `${serviceProgressPercent.value ?? 0}%`);

// 经济信息
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

// 服装信息
const displayClothing = computed(() => {
  let clothing = currentGirl.value?.身体特征?.服装;
  if (!clothing || typeof clothing !== 'object') {
    clothing = currentGirl.value?.服装;
  }
  if (!clothing || typeof clothing !== 'object') return {};

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(clothing)) {
    if (value && value !== '未知' && value !== '-' && value !== '无') {
      result[key] = value;
    }
  }
  return result;
});

const hasValidClothing = computed(() => Object.keys(displayClothing.value).length > 0);

const clothingDescription = computed(() => {
  const desc = getNestedValue(currentGirl.value, '基础信息.描述');
  if (desc && desc !== '--') {
    const clothingKeywords = ['穿着', '衬衫', '裙子', '裤子', '鞋', '袜', '外套', '上衣', '下装'];
    if (clothingKeywords.some(keyword => desc.includes(keyword))) {
      return desc;
    }
  }
  return null;
});

function clothingIcon(key: string) {
  const iconMap: Record<string, string> = {
    '上衣': 'fas fa-shirt',
    '下装': 'fas fa-person-dress',
    '内衣': 'fas fa-heart',
    '内裤': 'fas fa-heart',
    '丝袜': 'fas fa-socks',
    '鞋子': 'fas fa-shoe-prints',
    '配饰': 'fas fa-gem'
  };
  return iconMap[key] || 'fas fa-shirt';
}

// 搜索功能
function search(keyword: string) {
  sendToAI(`/send 搜索：${keyword}`);
}

function doSearch() {
  if (searchKeyword.value.trim()) {
    search(searchKeyword.value.trim());
  }
}

function sendQuick(message: string) {
  sendToAI(`/send ${message}`);
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

// 切换女孩
function switchGirl(index: number) {
  currentGirlIndex.value = index;
  showClothing.value = false;
  showBody.value = false;
  showExp.value = false;
  showStats.value = false;
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

    if (statData['服务中的订单'] && Array.isArray(statData['服务中的订单'])) {
      let orders = statData['服务中的订单'];
      if (orders.length > 0 && Array.isArray(orders[0])) orders = orders.flat();
      girlsData.value = orders.length > 0 ? orders : [createDefaultGirl()];
    } else {
      girlsData.value = [statData];
    }

    return true;
  } catch (error) {
    console.error('加载失败:', error);
    girlsData.value = [createDefaultGirl()];
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

    if (statData['服务中的订单'] && Array.isArray(statData['服务中的订单'])) {
      let orders = statData['服务中的订单'];
      if (orders.length > 0 && Array.isArray(orders[0])) orders = orders.flat();
      girlsData.value = orders.length > 0 ? orders : [createDefaultGirl()];
    } else {
      girlsData.value = [statData];
    }

    return true;
  } catch (error) {
    console.error('加载本地数据失败:', error);
    return false;
  }
}

function createDefaultGirl() {
  return {
    心跳: [120],
    订单状态: ['服务中'],
    基础信息: { 姓名: ['小美'], 年龄: [22], 身份: ['大学生'] },
    套餐: { 套餐名称: ['学姐的周末辅导'], 套餐价格: [199], 玩法特色: ['角色扮演'] },
    心理状态: { 当前所想: ['今天天气真好~'], 好感度: [50] },
    身体特征: { 三围: { 罩杯: ['C'] } },
    性经验: { 下单次数: [5] },
    服装: {
      上衣: '白色衬衫',
      下装: '黑色短裙',
      内衣: '白色蕾丝',
      内裤: '粉色棉质',
      丝袜: '黑色丝袜',
      鞋子: '黑色高跟鞋'
    }
  };
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

.search-bar-container {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #ffffff 0, #fafbfc 100%);
  border-radius: 50px;
  padding: 4px 8px 4px 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f8f8f8;

  i {
    color: #999999;
  }

  input {
    flex-grow: 1;
    border: none;
    outline: 0;
    background: transparent;
    padding: 8px 12px;
    font-size: 0.9rem;
    color: #1a1a1a;

    &::placeholder {
      color: #999999;
    }
  }

  .search-btn {
    background: linear-gradient(135deg, #ffc300 0, #e6b000 100%);
    color: #ffffff;
    border: none;
    border-radius: 50px;
    padding: 8px 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s;

    &:hover {
      background: linear-gradient(135deg, #e6b000 0, #cc9900 100%);
      transform: translateY(-1px);
    }
  }
}

.info-card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.info-card {
  background: linear-gradient(135deg, #ffffff 0, #fafbfc 100%);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f8f8f8;

  .info-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    color: white;

    &.bg-primary {
      background: linear-gradient(135deg, #ffc300 0, #e6b000 100%);
    }

    &.bg-warning {
      background: linear-gradient(135deg, #ff6b6b 0, #ff5252 100%);
    }

    &.bg-success {
      background: linear-gradient(135deg, #4CAF50 0, #81C784 100%);
    }
  }

  .info-content {
    flex-grow: 1;
  }

  .info-label {
    font-size: 12px;
    color: #999999;
    margin-bottom: 4px;
  }

  .info-value {
    font-size: 16px;
    font-weight: 700;
    color: #1a1a1a;

    &.text-warning {
      background: linear-gradient(135deg, #ff6b6b 0, #ff5252 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    &.text-success {
      background: linear-gradient(135deg, #4CAF50 0, #81C784 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
}

.tabs-container {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  background: #ffffff;
  padding: 6px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .tab-item {
    flex: 1;
    padding: 10px 16px;
    border: none;
    background: transparent;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s;
    color: #666666;

    &.active {
      background: linear-gradient(135deg, #ffc300 0, #e6b000 100%);
      color: #1a1a1a;
      box-shadow: 0 4px 12px rgba(255, 195, 0, 0.2);
    }
  }
}

.status-detail-card {
  background: linear-gradient(135deg, #ffffff 0, #fffef8 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 195, 0, 0.1);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;

  .girl-header {
    .girl-basic-info {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;

      .girl-name {
        font-size: 32px;
        font-weight: 800;
        margin: 0;
      }

      .girl-badges {
        display: flex;
        gap: 8px;

        .badge {
          padding: 4px 12px;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 700;

          &.badge-hot {
            background: linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%);
            color: white;
          }

          &.badge-recommend {
            background: linear-gradient(135deg, #FFD54F 0%, #FFC300 100%);
            color: #1a1a1a;
          }
        }
      }
    }

    .girl-identity {
      font-size: 16px;
      color: #666666;
      margin-bottom: 12px;
    }

    .star-rating {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 12px 0;

      .stars {
        display: flex;
        gap: 3px;

        .star {
          color: #ffc300;
          font-size: 18px;

          &.empty {
            color: #E0E0E0;
          }
        }
      }

      .affection-text {
        color: #666666;
        font-size: 14px;
        font-weight: 600;
      }
    }

    .feature-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 12px;

      .feature-tag {
        padding: 6px 14px;
        background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%);
        border: 2px solid #ffc300;
        border-radius: 50px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.25s;

        &:hover {
          background: linear-gradient(135deg, #ffc300 0, #e6b000 100%);
          color: white;
        }
      }
    }
  }

  .price-info {
    text-align: right;

    .price-label {
      font-size: 11px;
      color: #999999;
      margin-bottom: 6px;
    }

    .price-value {
      font-size: 34px;
      font-weight: 900;
      background: linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1;

      &::before {
        content: '¥';
        font-size: 22px;
      }
    }

    .location-info {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: flex-end;
      padding: 8px 12px;
      background: linear-gradient(135deg, #fff9e6, #fff);
      border-radius: 12px;
      border: 1px solid #ffc300;
      margin: 12px 0;

      i {
        color: #ffc300;
      }

      span {
        font-size: 13px;
        font-weight: 600;
        color: #1a1a1a;
      }
    }

    .package-name {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .order-status {
      padding: 5px 16px;
      border-radius: 50px;
      font-size: 11px;
      font-weight: 700;
      text-align: center;

      &.active {
        background: linear-gradient(135deg, #FFD54F 0%, #FFC300 100%);
      }

      &.ended {
        background: linear-gradient(135deg, #E0E0E0, #BDBDBD);
        color: white;
      }
    }
  }
}

.card {
  background: linear-gradient(135deg, #ffffff 0, #fffef8 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
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

.info-grid {
  display: grid;
  gap: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(135deg, #f5f5f5, #fafafa);
  border-radius: 12px;
  transition: all 0.25s;

  &:hover {
    background: linear-gradient(135deg, #fff9e6, #fff);
    transform: translateX(4px);
  }

  .info-key {
    font-size: 13px;
    color: #999999;
  }

  .info-val {
    font-size: 14px;
    font-weight: 700;
  }
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.data-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.4s;
  position: relative;
  border: 1px solid rgba(255, 195, 0, 0.1);
  background: white;
  border-radius: 16px;
  padding: 20px;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 40px rgba(255, 195, 0, 0.25);
  }

  .circular-progress {
    position: relative;
    width: 70px;
    height: 70px;
    margin: 0 auto 12px;

    svg {
      transform: rotate(-90deg);
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }

    .progress-bg {
      fill: none;
      stroke: #F0F0F0;
      stroke-width: 6;
    }

    .progress-bar {
      fill: none;
      stroke-width: 6;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.8s;

      &.normal {
        stroke: url(#gradient-normal);
      }

      &.warning {
        stroke: url(#gradient-warning);
      }

      &.danger {
        stroke: url(#gradient-danger);
      }
    }

    .progress-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 16px;
      font-weight: 800;
    }
  }

  .data-icon {
    font-size: 36px;
    margin-bottom: 12px;
    display: inline-block;

    &.gradient-purple {
      background: linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    &.gradient-cyan {
      background: linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    &.gradient-orange {
      background: linear-gradient(135deg, #FFA94D 0%, #FF6B35 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .data-label {
    font-size: 12px;
    color: #999999;
    margin-bottom: 8px;
  }

  .data-value {
    font-size: 26px;
    font-weight: 800;
    color: #1a1a1a;

    span {
      font-size: 13px;
      color: #666666;
      font-weight: 600;
    }
  }

  .progress-bar-container {
    width: 100%;
    height: 6px;
    background: #F0F0F0;
    border-radius: 50px;
    overflow: hidden;
    margin-top: 10px;

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(135deg, #FFD54F 0%, #FFC300 100%);
      transition: width 0.8s;
      box-shadow: 0 0 8px rgba(255, 195, 0, 0.5);
    }
  }
}

.thought-card {
  background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
  border: 2px solid #81C784;
  font-style: italic;
  line-height: 1.7;
}

.accordion {
  .accordion-header {
    padding: 16px 20px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    font-weight: 700;
    transition: all 0.3s;

    &:hover {
      background: linear-gradient(135deg, #fff9e6, rgba(255, 195, 0, 0.05));
    }

    &.active .accordion-icon {
      transform: rotate(180deg);
    }

    .accordion-icon {
      transition: transform 0.3s;
      color: #ffc300;
    }
  }

  .accordion-content {
    height: 0;
    overflow: hidden;
    transition: height 0.4s ease;

    &.show {
      height: auto;
    }

    .accordion-body {
      padding: 20px;
      border-top: 1px solid #EEEEEE;
    }
  }
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .feature-tag {
    padding: 8px 18px;
    border-radius: 50px;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.3s;
    cursor: pointer;
    background: linear-gradient(135deg, #fff9e6 0%, #fff 100%);
    border: 2px solid #ffc300;

    &:hover {
      background: linear-gradient(135deg, #ffc300 0, #e6b000 100%);
      color: white;
      transform: translateY(-2px);
    }
  }
}

.clothing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.clothing-card {
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, #fff9e6, #fff);
  border-radius: 16px;
  border: 2px solid #ffc300;
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    background: linear-gradient(135deg, #ffc300 0, #e6b000 100%);
    color: white;
  }

  .clothing-icon {
    font-size: 28px;
    margin-bottom: 8px;
    color: #e6b000;
    transition: all 0.3s;
  }

  &:hover .clothing-icon {
    color: white;
  }

  .clothing-key {
    font-size: 11px;
    color: #999999;
    margin-bottom: 4px;
  }

  .clothing-value {
    font-size: 13px;
    font-weight: 700;
  }
}

.clothing-desc {
  background: linear-gradient(135deg, #fff9e6, #fff);
  padding: 16px;
  border-radius: 16px;
  border: 2px solid #ffc300;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
}

.empty-text {
  text-align: center;
  padding: 20px;
  color: #999999;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.category-item {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  padding: 8px;
  border-radius: 12px;

  &:hover {
    background: #fff9e6;
    transform: translateY(-2px);
  }

  .category-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 8px;
    background: linear-gradient(135deg, #ffc300 0, #e6b000 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
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
  .info-card-grid {
    grid-template-columns: 1fr;
  }

  .status-detail-card {
    grid-template-columns: 1fr;
  }

  .data-grid {
    grid-template-columns: 1fr;
  }

  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .clothing-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
