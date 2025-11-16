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
    display: flex;
    align-items: center;
    gap: 8px;
    color: #1a1a1a;

    i {
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      padding: 4px;
      border-radius: 6px;

      &:hover {
        background-color: #fff3cc;
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
  background: linear-gradient(135deg, #ffffff 0, #fafbfc 100%);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f8f8f8;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 195, 0, 0.05) 0, transparent 70%);
    animation: pulse 4s ease-in-out infinite;
  }

  .shop-avatar-text {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    margin: 0 auto 8px;
    border: 4px solid #ffc300;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.4rem;
    font-weight: 700;
    background: linear-gradient(135deg, #fff9e6 0, #fffbf0 100%);
    color: #1a1a1a;
    box-shadow:
      0 4px 12px rgba(255, 195, 0, 0.3),
      0 0 0 3px #ffffff inset;
  }

  .shop-name {
    font-size: 1.25rem;
    font-weight: 800;
    margin-bottom: 4px;
    color: #1a1a1a;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .shop-slogan {
    font-size: 0.85rem;
    color: #999999;
    margin-top: 4px;
    line-height: 1.4;
  }
}

.list-section {
  background: linear-gradient(135deg, #ffffff 0, #fafbfc 100%);
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f8f8f8;
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
      color: #1a1a1a;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 12px;

      &::before {
        content: '';
        display: block;
        width: 4px;
        height: 18px;
        background: linear-gradient(135deg, #ffc300 0, #ff6b35 100%);
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
    width: 64px;
    height: 64px;
    border-radius: 16px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.8rem;
    font-weight: 700;
    color: #1a1a1a;
    background: linear-gradient(135deg, #fff9e6 0, #fffbf0 100%);
    text-align: center;
    line-height: 1.2;
    box-shadow:
      0 4px 6px rgba(0, 0, 0, 0.07),
      0 0 0 3px #ffffff inset;
    border: 2px solid #fff3cc;
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
    color: #1a1a1a;
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
    background: linear-gradient(135deg, #fff7e6 0, #ffeacc 100%);
    color: #d98600;
    font-size: 0.75rem;
    padding: 5px 12px;
    border-radius: 50px;
    border: 1px solid #ffd699;
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
      border-color: #d98600;

      &::before {
        left: 100%;
      }
    }
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
