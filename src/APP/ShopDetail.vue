<template>
  <div class="app-view active">
    <div class="app-header">
      <div class="title">
        <button class="back-btn" type="button" aria-label="返回" @click="$router.back()">
          <i class="fas fa-arrow-left"></i>
        </button>
        <span>店铺详情</span>
      </div>
    </div>

    <div class="app-content">
      <div class="shop-header-card">
        <div class="shop-avatar-text">
          <i v-if="shopPackages.find(p => p.icon)" :class="shopPackages.find(p => p.icon).icon"></i>
          <i v-else class="fas fa-store"></i>
        </div>
        <div class="shop-header-info">
          <div class="shop-name">{{ shopInfo?.name || '未命名店铺' }}</div>
          <div class="shop-slogan">{{ shopInfo?.slogan || '优质服务' }}</div>
        </div>
      </div>

      <div class="restore-tip">
        <i class="fas fa-undo-alt"></i>
        <span>误删店铺可回到原页面点击卡片重新找回</span>
      </div>

      <div class="list-section">
        <div class="section-header">
          <h3>精选套餐</h3>
          <span v-if="shopPackages.length > 0" class="section-count">{{ shopPackages.length }} 个</span>
        </div>
        <div class="package-list">
          <div v-if="shopPackages.length === 0" class="empty-state">
            <i class="fas fa-box-open"></i>
            <p>该店铺暂无套餐</p>
          </div>
          <div
            v-for="(pkg, index) in shopPackages"
            :key="pkg.id"
            class="package-card"
            :data-id="pkg.id"
            role="button"
            tabindex="0"
            :style="{ '--stagger': Math.min(index, 12) }"
            @click="goItemDetail(pkg)"
            @keydown.enter.prevent="goItemDetail(pkg)"
            @keydown.space.prevent="goItemDetail(pkg)"
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
            <i class="fas fa-chevron-right card-arrow"></i>
          </div>
        </div>
      </div>
    </div>

    <nav class="nav-bar">
      <button type="button" class="nav-item" @click="$router.push('/home')">
        <i class="fas fa-home"></i>
        <span>首页</span>
      </button>
      <button type="button" class="nav-item" @click="$router.push('/discover')">
        <i class="fas fa-compass"></i>
        <span>发现</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { extractDataFromMessage } from './dataParser';
import { mergeShopsById, normalizeShopList } from '../shared/shopCache';
import { createVariableShopStore, type ShopStoreApi } from './services/variableShopStore';

const route = useRoute();
const router = useRouter();
const shopInfo = ref<any>(null);
const shopPackages = ref<any[]>([]);

const fallbackShopStore = createVariableShopStore();
const shopStoreApi = ref<ShopStoreApi>(fallbackShopStore);

// 初始化
onMounted(async () => {
  let injectedStore = (window as typeof window & { ShopStore?: ShopStoreApi }).ShopStore;
  try {
    if (!injectedStore) {
      await waitGlobalInitialized('ShopStore');
      injectedStore = (window as typeof window & { ShopStore?: ShopStoreApi }).ShopStore;
    }
  } catch (e) {
    console.warn('[ShopDetail] ShopStore 未就绪，使用全局变量兜底', e);
  }
  shopStoreApi.value = injectedStore ?? fallbackShopStore;

  const data = extractDataFromMessage();
  const shopIdParam = route.params.id as string;

  // 1. 读取解析数据和缓存数据
  const parsedShops = normalizeShopList(data.shops || []);
  const existingShops = normalizeShopList(shopStoreApi.value?.getShops?.() || []);

  // 2. 统一按 shop_id 合并，兼容全局缓存中只有 shop_id 的旧数据
  const combinedShops = mergeShopsById(existingShops, parsedShops);

  // 3. 更新缓存
  shopStoreApi.value.saveShops(combinedShops);

  // 4. 查找目标店铺
  shopInfo.value = combinedShops.find(shop => shop.shop_id === String(shopIdParam)) || null;

  if (shopInfo.value) {
    shopPackages.value = (shopInfo.value.packages || []).map((p: any, index: number) => ({
      ...p,
      id: String(p.id ?? `${shopInfo.value.shop_id}::pkg_${index}`),
      shop_id: String(p.shop_id ?? p.shopId ?? shopInfo.value.shop_id),
    }));
  } else {
    // 兜底：从所有套餐中查找
    const allPkgs = combinedShops.flatMap(s => s.packages || []);
    shopPackages.value = allPkgs.filter((p: any) => String(p.shop_id ?? p.shopId ?? '') === String(shopIdParam));
  }
});

function goItemDetail(pkg: any) {
  const shopId = pkg.shop_id || shopInfo.value?.id;
  router.push({
    name: 'ItemDetailByShop',
    params: { shopId: String(shopId), id: String(pkg.id) },
    query: { name: pkg.name },
  });
}
</script>

<style lang="scss" scoped>
// 过渡属性白名单：避免 transition: all 匹配所有属性带来的性能开销
@mixin transition-props($duration: 0.25s, $easing: cubic-bezier(0.25, 0.46, 0.45, 0.94)) {
  transition-property: transform, box-shadow, background-color, border-color, color, opacity;
  transition-duration: $duration;
  transition-timing-function: $easing;
}

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
  padding: 14px var(--space-page) 12px;
  padding-top: max(14px, env(safe-area-inset-top));
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border-accent);
  flex-shrink: 0;

  .title {
    font-size: 1.15rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-primary);
    min-width: 0;

    span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .back-btn {
      width: 34px;
      height: 34px;
      border: 1px solid var(--border-accent);
      border-radius: 50%;
      background: var(--bg-card);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      box-shadow: var(--shadow-sm);
      transition:
        background-color 0.2s ease,
        transform 0.15s ease;

      i {
        font-size: 0.85rem;
      }

      @media (hover: hover) and (pointer: fine) {
        &:hover {
          background: var(--accent-light);
        }
      }

      &:active {
        transform: scale(0.9);
      }

      &:focus-visible {
        outline: 2px solid var(--accent-primary);
        outline-offset: 2px;
      }

      @media (hover: none) and (pointer: coarse) {
        width: var(--touch-target);
        height: var(--touch-target);
      }
    }
  }
}

.app-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 0;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.shop-header-card {
  background: var(--bg-card);
  border-radius: var(--radius-card);
  padding: 16px;
  margin: var(--space-page) var(--space-page) 12px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-accent);
  animation: card-enter 0.35s ease both;

  .shop-avatar-text {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.5rem;
    font-weight: 700;
    background: var(--bg-badge);
    color: var(--accent-primary);
    border: 1px solid var(--border-accent);
  }

  .shop-header-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .shop-name {
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: 0.3px;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  .shop-slogan {
    font-size: 0.82rem;
    color: var(--text-secondary);
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.restore-tip {
  margin: 0 var(--space-page) 12px;
  padding: 8px 12px;
  border: 1px dashed var(--border-accent);
  border-radius: var(--radius-control);
  background: var(--bg-badge);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  line-height: 1.5;

  i {
    color: var(--accent-primary);
    font-size: 0.85rem;
    flex-shrink: 0;
  }
}

.list-section {
  background: var(--bg-card);
  padding: 14px;
  border-radius: var(--radius-card);
  margin: 0 var(--space-page) var(--space-page);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-accent);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding: 0 2px;

    h3 {
      margin: 0;
      font-size: 1.05rem;
      color: var(--text-primary);
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 10px;

      &::before {
        content: '';
        display: block;
        width: 4px;
        height: 16px;
        background: linear-gradient(135deg, var(--accent-primary) 0, var(--accent-light) 100%);
        border-radius: 6px;
      }
    }

    .section-count {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--accent-dark);
      background: rgba(255, 195, 0, 0.14);
      border-radius: 999px;
      padding: 2px 8px;
      white-space: nowrap;
    }
  }
}

.package-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.package-card {
  background: var(--bg-card);
  border-radius: var(--radius-card);
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition:
    transform 0.18s ease,
    box-shadow 0.25s ease,
    border-color 0.2s ease;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  border: 1px solid var(--border-accent);
  position: relative;
  animation: card-enter 0.35s ease both;
  animation-delay: calc(var(--stagger, 0) * 35ms);

  &:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-card);
      border-color: var(--accent-primary);

      .avatar-text {
        transform: scale(1.05);
      }

      .card-arrow {
        color: var(--accent-primary);
        transform: translateX(2px);
      }
    }
  }

  &:active {
    transform: scale(0.98);
    box-shadow: var(--shadow-sm);
  }

  .avatar-text {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--accent-primary);
    background: var(--bg-badge);
    text-align: center;
    line-height: 1.2;
    border: 1px solid var(--border-accent);
    transition: transform 0.25s ease;
  }

  .info {
    flex-grow: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .name {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .desc {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    font-size: 0.78rem;
    color: var(--text-secondary);
    line-height: 1.45;
  }

  .package-tag {
    background: rgba(255, 195, 0, 0.14);
    color: var(--accent-dark);
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 999px;
    font-weight: 600;
    white-space: nowrap;
  }

  .card-arrow {
    flex-shrink: 0;
    color: var(--text-placeholder);
    font-size: 0.75rem;
    transition:
      color 0.2s ease,
      transform 0.2s ease;
  }
}

@media (prefers-reduced-motion: reduce) {
  .shop-header-card,
  .package-card {
    animation: none;
    transition: none;
  }
}

.nav-bar {
  display: flex;
  border-top: 1px solid var(--border-color);
  background: linear-gradient(135deg, var(--bg-header) 0, var(--bg-header-light) 100%);
  padding: 8px 12px;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
  flex-shrink: 0;
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
    @include transition-props(0.25s);
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
      font-size: 1.4rem;
      margin-bottom: 2px;
      @include transition-props(0.25s, cubic-bezier(0.34, 1.56, 0.64, 1));
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-placeholder);

  i {
    font-size: 2.5rem;
    margin-bottom: 12px;
    opacity: 0.4;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
  }
}
</style>
