<template>
  <div class="app-view active">
    <div class="app-header">
      <div class="title">
        <span>🗺️ 发现</span>
      </div>
    </div>

    <div class="app-content">
      <div class="shop-list">
        <div v-if="shops.length === 0" class="empty-state">
          暂无发现，请先让AI生成内容。
        </div>
        <div
          v-for="shop in shops"
          :key="shop.id"
          class="shop-card"
          @click="$router.push(`/shop/${shop.id}`)"
        >
          <div class="avatar-text">
            <i v-if="(shop.packages || []).find(p => p.icon)" :class="(shop.packages || []).find(p => p.icon).icon"></i>
            <i v-else class="fas fa-store"></i>
          </div>
          <div class="info">
            <div class="name">{{ shop.name }}</div>
            <div class="desc">{{ shop.slogan }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="nav-bar">
      <div class="nav-item" @click="$router.push('/')">
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
import { ref, onMounted } from 'vue';

const shops = ref<any[]>([]);

// 从酒馆消息提取数据
function extractDataFromMessage(): { shops: any[]; packages: any[] } {
  try {
    const currentMessageId = getCurrentMessageId();
    const messages = getChatMessages(currentMessageId);

    if (!messages || messages.length === 0) {
      throw new Error('无法获取当前消息');
    }

    const messageContent = messages[0].message;
    const match = messageContent.match(/\[手机界面开始\](.*?)\[手机界面结束\]/s);

    if (!match || !match[1]) {
      throw new Error('未找到手机界面数据标记');
    }

    const dataText = match[1].trim();
    return parseShopData(dataText);
  } catch (e) {
    console.warn('[酒馆助手接口获取失败]:', e);
    return { shops: [], packages: [] };
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
  shops.value = data.shops;
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
  backdrop-filter: blur(10px);
  position: relative;

  .title {
    font-size: 1.3rem;
    font-weight: 700;
    color: #1a1a1a;
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
  background: linear-gradient(135deg, #ffffff 0, #fafbfc 100%);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  border: 1px solid #f8f8f8;
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
      0 0 0 1px #fff3cc inset;
    border-color: #ffc300;

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  }

  .avatar-text {
    width: 68px;
    height: 68px;
    border-radius: 12px;
    background: linear-gradient(135deg, #fff9e6 0, #fffbf0 100%);
    border: 3px solid #fff3cc;
    box-shadow:
      0 3px 8px rgba(0, 0, 0, 0.08),
      0 0 0 2px #ffffff inset;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;

    i {
      font-size: 2.2rem;
      color: #ffc300;
      text-shadow:
        0 2px 4px rgba(0, 0, 0, 0.1),
        0 0 8px rgba(255, 195, 0, 0.3);
      filter: drop-shadow(0 1px 2px rgba(255, 195, 0, 0.4));
    }
  }

  .info {
    flex-grow: 1;
    min-width: 0;
  }

  .name {
    font-weight: 600;
    margin-bottom: 5px;
    color: #1a1a1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .desc {
    font-size: 0.8rem;
    color: #666666;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
  }
}

.nav-bar {
  display: flex;
  border-top: 1px solid #f0f0f0;
  background: linear-gradient(135deg, #ffffff 0, #fafbfc 100%);
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
    background: linear-gradient(90deg, transparent, #f0f0f0, transparent);
  }

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #666666;
    font-size: 0.8rem;
    padding: 4px 0;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    position: relative;
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
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
  }
}

.empty-state {
  text-align: center;
  color: #999999;
  padding: 40px 20px;
  line-height: 1.6;
}
</style>
