<template>
  <div class="app-view active">
    <div class="app-header">
      <div class="title">
        <span>🗺️ 发现</span>
      </div>
    </div>

    <div class="app-content">
      <div ref="containerRef" v-bind="containerProps" class="shop-list-container">
        <div v-if="shops.length === 0" class="empty-state">暂无发现，请先让AI生成内容。</div>
        <div v-else v-bind="wrapperProps">
          <div
            v-for="shop in virtualShops"
            :key="shop.data.id"
            class="shop-card"
            @click="$router.push(`/shop/${shop.data.id}`)"
          >
            <div class="avatar-text">
              <i
                v-if="(shop.data.packages || []).find((p: any) => p.icon)"
                :class="(shop.data.packages || []).find((p: any) => p.icon).icon"
              ></i>
              <i v-else class="fas fa-store"></i>
            </div>
            <div class="info">
              <div class="name">{{ shop.data.name }}</div>
              <div class="desc">
                <span class="slogan-text">{{ shop.data.slogan }}</span>
                <span v-if="shop.data.packages && shop.data.packages.length > 0" class="package-count">
                  <i class="fas fa-layer-group"></i>
                  {{ shop.data.packages.length }} 个套餐
                </span>
              </div>
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
      <div class="nav-item active" @click="$router.push('/discover')">
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
import { ref, onMounted, computed } from 'vue';
import { useVirtualList } from '@vueuse/core';

const shops = ref<any[]>([]);

// 虚拟列表配置
const containerRef = ref<HTMLElement>();
const ITEM_HEIGHT = 100; // 每个店铺卡片预估高度（包括间距）
const {
  list: virtualShops,
  containerProps,
  wrapperProps,
} = useVirtualList(shops, {
  itemHeight: ITEM_HEIGHT,
  overscan: 5, // 预渲染额外5个项目，确保滚动流畅
});

// 从酒馆消息提取数据 - 直接获取，不使用缓存
function extractDataFromMessage(): { shops: any[]; packages: any[] } {
  try {
    // 尝试从当前楼层获取数据
    const currentMessageId = String(getCurrentMessageId());
    const currentData = extractDataFromSpecificMessage(currentMessageId);
    if (currentData) {
      console.log('[Discover] 从当前楼层获取到数据');
      return currentData;
    }

    // 当前楼层没有数据，尝试从最近楼层获取
    console.log('[Discover] 当前楼层无数据，尝试从最近楼层获取...');
    // 确保 currentMessageId 是字符串
    const currentIdStr = String(currentMessageId || '');
    for (let i = 1; i <= 10; i++) {
      const historicalMessageId = `msg_${parseInt(currentIdStr.replace('msg_', '')) - i}`;
      const historicalData = extractDataFromSpecificMessage(historicalMessageId);
      if (historicalData) {
        console.log(`[Discover] 从 ${i} 个楼层前找到数据`);
        return historicalData;
      }
    }

    // 所有方式都失败，返回空数据
    console.warn('[Discover] 未找到任何楼层的手机界面数据，显示空状态');
    return { shops: [], packages: [] };
  } catch (e) {
    console.warn('[Discover] 数据提取失败:', e);
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
            pkg[fieldName] = fieldName === 'stars' ? parseFloat(value) || 0 : value;
            currentArrayField = null;
          } else if (['tags', 'content', 'reviews'].includes(fieldName)) {
            currentArrayField = fieldName;
            if (value) {
              pkg[fieldName].push(
                value
                  .replace(/^- /, '')
                  .trim()
                  .replace(/^["']|["']$/g, ''),
              );
            }
          }
        } else if (line.startsWith('- ') && currentArrayField) {
          pkg[currentArrayField].push(
            line
              .substring(2)
              .trim()
              .replace(/^["']|["']$/g, ''),
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
  shops.value = data.shops;
  console.log('[Discover] 已加载', shops.value.length, '个店铺');
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
    color: var(--text-primary);
    letter-spacing: 0.5px;
    text-shadow: 0 1px 2px rgba(255, 195, 0, 0.1);

    span {
      background: linear-gradient(135deg, var(--text-primary) 0%, #333333 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
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

.shop-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.shop-card {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow:
    var(--shadow-sm),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset;
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
    background: linear-gradient(90deg, transparent, rgba(255, 195, 0, 0.08), rgba(255, 215, 64, 0.12), transparent);
    transition: left 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 60px;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 195, 0, 0.03));
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-8px) scale(1.03);
    box-shadow:
      0 12px 35px rgba(255, 195, 0, 0.25),
      var(--shadow-md),
      0 0 0 2px var(--border-accent) inset;
    border-color: var(--accent-primary);

    &::before {
      left: 100%;
    }

    &::after {
      opacity: 1;
    }

    .avatar-text {
      transform: rotate(5deg) scale(1.1);
      box-shadow:
        0 6px 16px rgba(255, 195, 0, 0.35),
        0 0 0 3px var(--border-accent) inset;
    }
  }

  &:active {
    transform: translateY(-3px) scale(1.015);
    box-shadow:
      0 6px 20px rgba(255, 195, 0, 0.2),
      var(--shadow-sm);
  }

  .avatar-text {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: var(--bg-badge);
    border: 2px solid var(--border-accent);
    box-shadow:
      0 4px 12px rgba(255, 195, 0, 0.25),
      0 0 0 2px var(--bg-card) inset,
      0 -2px 4px rgba(255, 255, 255, 0.8) inset;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

    i {
      font-size: 1.4rem;
      color: var(--accent-primary);
      text-shadow:
        0 2px 8px rgba(255, 195, 0, 0.5),
        0 0 12px rgba(255, 215, 64, 0.4);
      filter: drop-shadow(0 2px 4px rgba(255, 195, 0, 0.5));
      transition: all 0.3s ease;
    }
  }

  .info {
    flex-grow: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .name {
    font-weight: 700;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 1.05rem;
    letter-spacing: 0.2px;
  }

  .desc {
    font-size: 0.85rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    line-height: 1.5;
    font-weight: 400;

    .slogan-text {
      flex: 1;
      min-width: 100px;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .package-count {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-light));
      color: var(--text-primary);
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(255, 195, 0, 0.3);
      transition: all 0.3s ease;

      i {
        font-size: 0.7rem;
        opacity: 0.9;
      }
    }
  }
}

.nav-bar {
  display: flex;
  border-top: 1px solid var(--border-accent);
  background: linear-gradient(135deg, var(--bg-header) 0%, var(--bg-header-light) 100%);
  padding: 10px 8px;
  flex-shrink: 0;
  backdrop-filter: blur(15px);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--border-accent), transparent);
  }

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--text-secondary);
    font-size: 0.8rem;
    padding: 6px 4px;
    cursor: pointer;
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    border-radius: 12px;
    margin: 0 2px;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 100%;
      background: linear-gradient(135deg, rgba(255, 195, 0, 0.15), rgba(255, 215, 64, 0.1));
      border-radius: 12px;
      transition: all 0.3s ease;
      z-index: 0;
    }

    &.active {
      color: var(--text-primary);
      transform: translateY(-2px);

      &::before {
        width: 100%;
      }

      i {
        color: var(--accent-primary);
        transform: scale(1.2) translateY(-3px);
        filter: drop-shadow(0 2px 6px rgba(255, 195, 0, 0.4));
      }

      span {
        font-weight: 700;
        color: var(--accent-primary);
      }
    }

    &:hover:not(.active) {
      color: var(--text-primary);
      transform: translateY(-1px);

      &::before {
        width: 60%;
      }
    }

    i {
      font-size: 1.3rem;
      margin-bottom: 4px;
      transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      z-index: 1;
    }

    span {
      font-weight: 500;
      transition: all 0.3s ease;
      position: relative;
      z-index: 1;
    }
  }
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px 20px;
  line-height: 1.6;
}
</style>
