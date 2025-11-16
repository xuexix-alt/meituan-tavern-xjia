<template>
  <div class="app-view active">
    <div class="app-header">
      <div class="title">
        <i class="fas fa-arrow-left" @click="$router.back()"></i>
        <span>店铺详情</span>
      </div>
    </div>

    <div class="app-content">
      <div class="shop-header-card">
        <div class="shop-avatar-text">
          <i v-if="shopPackages.find(p => p.icon)" :class="shopPackages.find(p => p.icon).icon"></i>
          <i v-else class="fas fa-store"></i>
        </div>
        <div class="shop-name">{{ shopInfo?.name || '未命名店铺' }}</div>
        <div class="shop-slogan">{{ shopInfo?.slogan || '优质服务' }}</div>
      </div>

      <div class="list-section">
        <div class="section-header">
          <h3>精选套餐</h3>
        </div>
        <div class="package-list">
          <div v-if="shopPackages.length === 0" class="empty-state">
            该店铺暂无套餐。
          </div>
          <div
            v-for="pkg in shopPackages"
            :key="pkg.id"
            class="package-card"
            @click="$router.push(`/item/${pkg.id}`)"
          >
            <div class="avatar-text">
              <i v-if="pkg.icon" :class="pkg.icon"></i>
              <span v-else>套餐</span>
            </div>
            <div class="info">
              <div class="name">{{ pkg.name }}</div>
              <div class="desc">
                <span v-for="tag in (pkg.tags || []).slice(0, 4)" :key="tag" class="package-tag">
                  {{ tag.replace(/['"]/g, '') }}
                </span>
                <span v-if="!pkg.tags || pkg.tags.length === 0">
                  {{ (pkg.description || '').split('\n')[0] }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="nav-bar">
      <div class="nav-item" @click="$router.push('/')">
        <i class="fas fa-home"></i>
        <span>首页</span>
      </div>
      <div class="nav-item" @click="$router.push('/discover')">
        <i class="fas fa-compass"></i>
        <span>发现</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const shopInfo = ref<any>(null);
const shopPackages = ref<any[]>([]);

// 从酒馆消息提取数据 - 增强版，支持回退到最近楼层或缓存
function extractDataFromMessage(): { shops: any[]; packages: any[] } {
  try {
    // 首先尝试从缓存获取数据（酒馆变量）
    const cachedData = getCachedShopData();
    if (cachedData) {
      console.log('[ShopDetail] 使用缓存的手机界面数据');
      return cachedData;
    }

    // 尝试从当前楼层获取数据
    const currentMessageId = getCurrentMessageId();
    const currentData = extractDataFromSpecificMessage(currentMessageId);
    if (currentData) {
      // 成功获取数据，缓存起来
      cacheShopData(currentData);
      return currentData;
    }

    // 当前楼层没有数据，尝试从最近楼层获取
    console.log('[ShopDetail] 当前楼层无数据，尝试从最近楼层获取...');
    // 确保 currentMessageId 是字符串
    const currentIdStr = String(currentMessageId || '');
    for (let i = 1; i <= 10; i++) {
      const historicalMessageId = `msg_${parseInt(currentIdStr.replace('msg_', '')) - i}`;
      const historicalData = extractDataFromSpecificMessage(historicalMessageId);
      if (historicalData) {
        console.log(`[ShopDetail] 从 ${i} 个楼层前找到数据，已缓存并使用`);
        cacheShopData(historicalData);
        return historicalData;
      }
    }

    // 所有方式都失败，返回空数据
    console.warn('[ShopDetail] 未找到任何楼层的手机界面数据，显示空状态');
    return { shops: [], packages: [] };
  } catch (e) {
    console.warn('[ShopDetail] 数据提取失败:', e);
    return { shops: [], packages: [] };
  }
}

// 从指定楼层提取数据
function extractDataFromSpecificMessage(messageId: string): { shops: any[]; packages: any[] } | null {
  try {
    const messages = getChatMessages(messageId);
    if (!messages || messages.length === 0) {
      return null;
    }

    const messageContent = messages[0].message;
    const match = messageContent.match(/\[手机界面开始\](.*?)\[手机界面结束\]/s);

    if (!match || !match[1]) {
      return null;
    }

    const dataText = match[1].trim();
    return parseShopData(dataText);
  } catch (e) {
    return null;
  }
}

// 缓存数据到酒馆变量
function cacheShopData(data: { shops: any[]; packages: any[] }) {
  try {
    const scriptId = getScriptId();
    if (scriptId) {
      replaceVariables({
        cachedShopData: data,
        cachedAt: Date.now()
      }, { type: 'script', script_id: scriptId });
    }
  } catch (e) {
    console.warn('[ShopDetail] 缓存数据失败:', e);
  }
}

// 从酒馆变量获取缓存数据
function getCachedShopData(): { shops: any[]; packages: any[] } | null {
  try {
    const scriptId = getScriptId();
    if (!scriptId) return null;

    const variables = getVariables({ type: 'script', script_id: scriptId });
    if (variables && variables.cachedShopData) {
      // 检查缓存是否过期（24小时）
      const cacheAge = Date.now() - (variables.cachedAt || 0);
      if (cacheAge < 24 * 60 * 60 * 1000) {
        return variables.cachedShopData;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// 解析店铺数据
function parseShopData(text: string): { shops: any[]; packages: any[] } {
  const shops: any[] = [];
  const packages: any[] = [];
  let packageCounter = 0;

  const shopSections = text.split('[店铺]').slice(1);

  shopSections.forEach((shopSection, shopIndex) => {
    const shopMatch = shopSection.match(/([\s\S]*?)\[套餐\]/);
    if (!shopMatch) return;

    const shopLines = shopMatch[1]
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    const shop: any = {
      id: `shop_${shopIndex}`,
      name: '未命名店铺',
      shoptags: [],
      slogan: '优质服务',
      theme: '默认',
      packages: [],
    };

    // 解析店铺信息
    const nameLine = shopLines.find(line => line.startsWith('name:'));
    if (nameLine) {
      shop.name = nameLine.substring(5).trim();
    }

    const shoptagsIndex = shopLines.findIndex(line => line.startsWith('shoptags:'));
    if (shoptagsIndex !== -1) {
      for (let i = shoptagsIndex + 1; i < shopLines.length; i++) {
        if (shopLines[i].startsWith('- ')) {
          shop.shoptags.push(shopLines[i].substring(2).trim());
        } else if (shopLines[i].includes(':')) {
          break;
        }
      }
    }

    if (shop.shoptags.length > 0) {
      shop.slogan = shop.shoptags.join(' / ');
      shop.theme = shop.shoptags[0] || '默认';
    }

    // 解析套餐
    const packageSections = shopSection.split('[套餐]').slice(1);

    packageSections.forEach(pkgSection => {
      const pkgLines = pkgSection
        .split('[/套餐]')[0]
        .trim()
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

      if (pkgLines.length === 0) return;

      const pkg: any = {
        id: `pkg_${packageCounter++}`,
        shop_id: shop.id,
        shop_name: shop.name,
        name: '',
        price: 'N/A',
        stars: 0,
        tags: [],
        icon: null,
        image1: '',
        image2: '',
        image3: '',
        description: '',
        content: [],
        reviews: [],
      };

      let currentArrayField: string | null = null;

      pkgLines.forEach(line => {
        const match = line.match(/^([^:]+):(.*)$/);
        if (match) {
          const fieldName = match[1].trim();
          const value = match[2].trim();

          if (['name', 'price', 'stars', 'icon', 'image1', 'image2', 'image3', 'description'].includes(fieldName)) {
            pkg[fieldName] = fieldName === 'stars' ? (parseFloat(value) || 0) : value;
            currentArrayField = null;
          } else if (['tags', 'content', 'reviews'].includes(fieldName)) {
            currentArrayField = fieldName;
            if (value) {
              pkg[fieldName].push(
                value
                  .replace(/^- /, '')
                  .trim()
                  .replace(/^["']|["']$/g, '')
              );
            }
          }
        } else if (line.startsWith('- ') && currentArrayField) {
          pkg[currentArrayField].push(
            line
              .substring(2)
              .trim()
              .replace(/^["']|["']$/g, '')
          );
        }
      });

      if (pkg.name) {
        shop.packages.push(pkg);
        packages.push(pkg);
      }
    });

    shops.push(shop);
  });

  return { shops, packages };
}

// 初始化
onMounted(() => {
  const data = extractDataFromMessage();
  const shopId = route.params.id as string;
  shopInfo.value = data.shops.find(s => s.id === shopId);
  shopPackages.value = data.packages.filter(p => p.shop_id === shopId);
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

  .title {
    font-size: 1.3rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-primary);

    i {
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      padding: 4px;
      border-radius: 6px;

      &:hover {
        background-color: var(--accent-light);
        transform: scale(1.1) rotate(-5deg);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
    }
  }
}

.app-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 0;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.shop-header-card {
  background: var(--bg-card);
  border-radius: 24px;
  padding: 20px;
  margin: 16px;
  text-align: center;
  box-shadow:
    0 6px 20px rgba(255, 195, 0, 0.15),
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.9) inset;
  border: 1px solid rgba(255, 195, 0, 0.2);
  position: relative;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      rgba(255, 195, 0, 0.08) 0,
      rgba(255, 215, 64, 0.05) 30%,
      transparent 70%
    );
    animation: pulse 6s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 195, 0, 0.4),
      transparent
    );
  }

  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow:
      0 12px 35px rgba(255, 195, 0, 0.25),
      0 6px 20px rgba(0, 0, 0, 0.12);
  }

  .shop-avatar-text {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin: 0 auto 12px;
    border: 4px solid var(--accent-primary);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.6rem;
    font-weight: 800;
    background: var(--bg-badge);
    color: var(--text-primary);
    box-shadow:
      0 6px 20px rgba(255, 195, 0, 0.35),
      0 0 0 3px var(--bg-card) inset,
      0 -3px 6px rgba(255, 255, 255, 0.8) inset;
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    z-index: 1;

    &::before {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 2px solid rgba(255, 195, 0, 0.3);
      animation: rotate 10s linear infinite;
    }

    i {
      filter: drop-shadow(0 2px 4px rgba(255, 195, 0, 0.5));
    }
  }

  .shop-name {
    font-size: 1.3rem;
    font-weight: 800;
    margin-bottom: 6px;
    color: var(--text-primary);
    text-shadow: 0 1px 3px rgba(255, 195, 0, 0.2);
    position: relative;
    z-index: 1;
  }

  .shop-slogan {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-top: 6px;
    line-height: 1.5;
    font-weight: 500;
    position: relative;
    z-index: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.list-section {
  background: var(--bg-card);
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border-accent);
  position: relative;
  overflow: hidden;

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

      &::before {
        content: '';
        display: block;
        width: 4px;
        height: 18px;
        background: linear-gradient(135deg, var(--accent-primary) 0, #ff6b35 100%);
        border-radius: 6px;
      }
    }
  }
}

.package-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.package-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  border: 1px solid var(--border-accent);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 195, 0, 0.05), transparent);
    transition: left 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  &:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow:
      0 8px 25px rgba(0, 0, 0, 0.12),
      0 0 0 1px var(--accent-light) inset;
    border-color: var(--accent-primary);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  }

  .avatar-text {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-primary);
    background: var(--bg-badge);
    text-align: center;
    line-height: 1.2;
    box-shadow:
      0 4px 6px rgba(0, 0, 0, 0.07),
      0 0 0 3px var(--bg-card) inset;
    border: 2px solid var(--accent-light);
    transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255, 195, 0, 0.1) 0, transparent 70%);
      transform: scale(0);
      transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    &:hover::before {
      transform: scale(1);
    }
  }

  .info {
    flex-grow: 1;
    min-width: 0;
  }

  .name {
    font-weight: 600;
    margin-bottom: 5px;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .desc {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 4px;
    min-height: 34px;
    align-items: center;
  }

  .package-tag {
    background: var(--bg-badge);
    color: var(--accent-dark);
    font-size: 0.75rem;
    padding: 5px 12px;
    border-radius: 50px;
    border: 1px solid var(--accent-primary);
    font-weight: 600;
    transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(217, 134, 0, 0.15);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(217, 134, 0, 0.1), transparent);
      transition: left 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      border-color: var(--accent-primary);

      &::before {
        left: 100%;
      }
    }
  }
}

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

.empty-state {
  text-align: center;
  color: var(--text-placeholder);
  padding: 40px 20px;
  line-height: 1.6;
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
</style>
