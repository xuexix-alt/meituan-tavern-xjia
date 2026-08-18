<template>
  <div class="app-view active">
    <div class="app-header">
      <div class="title">
        <div class="title-icon">
          <i class="fas fa-compass"></i>
        </div>
        <div class="title-text">
          <span class="title-main">发现</span>
          <span class="title-sub">{{ shops.length > 0 ? `${shops.length} 个店铺` : '暂无店铺' }}</span>
        </div>
      </div>
      <button class="import-btn" type="button" @click="triggerImport">
        <i class="fas fa-file-import"></i>
        <span>导入 JSON</span>
      </button>
    </div>

    <div class="app-content">
      <div class="shop-list">
        <div v-if="shops.length === 0" class="empty-state">
          <i class="fas fa-compass"></i>
          <p>暂无发现，请先让AI生成内容</p>
          <button class="empty-import-btn" type="button" @click="triggerImport">
            <i class="fas fa-file-import"></i>
            <span>导入 JSON</span>
          </button>
        </div>
        <div v-else class="shop-list-items">
          <div
            v-for="(shop, index) in shops"
            :key="shop.id"
            class="shop-card"
            role="button"
            tabindex="0"
            :style="{ '--stagger': Math.min(index, 12) }"
            @click="$router.push(`/shop/${shop.id}`)"
            @keydown.enter.prevent="$router.push(`/shop/${shop.id}`)"
            @keydown.space.prevent="$router.push(`/shop/${shop.id}`)"
          >
            <div class="avatar-text">
              <i
                v-if="(shop.packages || []).find((p: any) => p.icon)"
                :class="(shop.packages || []).find((p: any) => p.icon).icon"
              ></i>
              <i v-else class="fas fa-store"></i>
            </div>
            <div class="info">
              <div class="name-row">
                <div class="name">{{ shop.name }}</div>
                <span v-if="shop.packages && shop.packages.length > 0" class="package-count">
                  <i class="fas fa-layer-group"></i>
                  {{ shop.packages.length }} 个套餐
                </span>
              </div>
              <div class="desc">
                <span class="slogan-text">{{ shop.slogan || '暂无简介' }}</span>
              </div>
            </div>
            <button
              class="delete-btn"
              type="button"
              :aria-label="`删除 ${shop.name}`"
              @click.stop="deleteShop(shop.id)"
            >
              <i class="fas fa-trash"></i>
            </button>
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
  <input ref="fileInput" class="hidden-input" type="file" accept=".json,application/json" @change="handleFileChange" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { extractDataFromMessage } from './dataParser';
import { mergeShopsById } from '../shared/shopCache';
import { createVariableShopStore, type ShopStoreApi } from './services/variableShopStore';

const shops = ref<any[]>([]);
const fallbackShopStore = createVariableShopStore();
const shopStoreApi = ref<ShopStoreApi>(fallbackShopStore);
const fileInput = ref<HTMLInputElement | null>(null);
const MAX_IMPORT_ITEMS = 200;
const MAX_IMPORT_SIZE_MB = 5;

function syncFromStore() {
  shops.value = shopStoreApi.value.getShops();
}

// 初始化
onMounted(() => {
  const injectedStore = (window as typeof window & { ShopStore?: ShopStoreApi }).ShopStore;
  shopStoreApi.value = injectedStore ?? fallbackShopStore;

  // 1. 获取现有缓存
  const existingShops = shopStoreApi.value.getShops();

  // 2. 全局缓存是主数据源；仅在空缓存时迁移一次旧聊天楼层数据。
  const parsedShops = existingShops.length === 0 ? extractDataFromMessage().shops || [] : [];

  // 3. shop_id 是唯一主键：相同 ID 更新，同名不同 ID 保留。
  const finalShops = mergeShopsById(existingShops, parsedShops);
  shops.value = finalShops;

  if (parsedShops.length > 0) {
    shopStoreApi.value.saveShops(parsedShops);
  }

  console.log('[Discover] 已加载', shops.value.length, '个店铺 (清洗后)');

  // 监听缓存更新事件
  window.addEventListener('shop:cache:updated', syncFromStore);
});

onBeforeUnmount(() => window.removeEventListener('shop:cache:updated', syncFromStore));

function deleteShop(id: string) {
  shops.value = shops.value.filter(shop => shop.id !== id);
  shopStoreApi.value.deleteShop(id);
  console.log('[Discover] 已删除店铺', id);
}

function triggerImport() {
  fileInput.value?.click();
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  if (!files || files.length === 0) return;
  const file = files[0];
  if (file.size > MAX_IMPORT_SIZE_MB * 1024 * 1024) {
    toastr.error(`文件过大（>${MAX_IMPORT_SIZE_MB}MB）`, '导入失败');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || '');
      const parsed = JSON.parse(text);

      // 版本信息检查
      let versionInfo = '';
      let importWarning = '';

      if (parsed.version) {
        versionInfo = ` v${parsed.version}`;

        // 显示版本信息
        if (parsed.generatedAt) {
          const exportDate = new Date(parsed.generatedAt).toLocaleString('zh-CN');
          versionInfo += ` (导出时间: ${exportDate})`;
        }
      }

      // 检查校验和（如果存在）
      if (parsed.checksum && parsed.shops) {
        const currentChecksum = checksumPayload(JSON.stringify(parsed.shops));
        if (currentChecksum !== parsed.checksum) {
          importWarning = '数据校验和不匹配，文件可能已被修改';
        }
      }

      // 显示版本信息提示
      if (versionInfo) {
        const currentVersion = 'v1'; // 当前APP支持的版本
        if (parsed.version !== currentVersion) {
          toastr.warning(`文件版本${versionInfo}，当前APP版本${currentVersion}，请检查版本兼容性`, '版本信息');
        } else {
          toastr.info(`文件版本${versionInfo}`, '版本信息');
        }
      }

      // 显示警告信息
      if (importWarning) {
        toastr.warning(importWarning, '导入提示');
      }

      const rawShops = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as any)?.shops)
          ? (parsed as any).shops
          : [parsed];
      const cleaned = dedupeShops(
        (rawShops || [])
          .map((s: any) => {
            if (!s || (!s.id && !s.name)) return null;
            let id = s.id ? String(s.id) : '';
            if (!id && s.name) {
              id = `shop_${s.name}`;
            }
            return { ...s, id };
          })
          .filter(Boolean),
      ).slice(0, MAX_IMPORT_ITEMS);
      if (!cleaned.length) {
        toastr.error('你的json格式错误', '导入失败');
      } else if (cleaned.length > MAX_IMPORT_ITEMS) {
        toastr.warning(`最多导入 ${MAX_IMPORT_ITEMS} 条，已自动截断`, '导入提示');
      } else {
        shops.value = cleaned as any[];
        shopStoreApi.value?.saveShops(shops.value);
        const successMsg = `从文件导入 ${cleaned.length} 个店铺${versionInfo}`;
        toastr.success(successMsg, '导入成功');
      }
    } catch (e) {
      console.warn('[Discover] 导入失败', e);
      toastr.error('你的json格式错误', '导入失败');
    } finally {
      input.value = '';
    }
  };
  reader.readAsText(file);
}

// 辅助函数：计算校验和
function checksumPayload(str: string) {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum = (sum + str.charCodeAt(i)) % 65536;
  }
  return sum.toString(16);
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
}

.app-header {
  background: linear-gradient(135deg, var(--bg-header) 0%, var(--bg-header-light) 100%);
  padding: 14px var(--space-page) 12px;
  padding-top: max(14px, env(safe-area-inset-top));
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border-accent);
  flex-shrink: 0;
  -webkit-backdrop-filter: blur(15px);
  backdrop-filter: blur(15px);

  .title {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;

    .title-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-light));
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(255, 195, 0, 0.28);
    }

    .title-text {
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;

      .title-main {
        font-size: 1.2rem;
        font-weight: 800;
        color: var(--text-primary);
        letter-spacing: 0.5px;
        line-height: 1.2;
      }

      .title-sub {
        font-size: 0.72rem;
        color: var(--text-secondary);
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  .import-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 14px;
    border: 1px solid var(--border-accent);
    background: var(--bg-card);
    color: var(--text-primary);
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;
    box-shadow: var(--shadow-sm);
    transition:
      background-color 0.2s ease,
      transform 0.15s ease,
      box-shadow 0.2s ease;

    i {
      font-size: 0.78rem;
      color: var(--accent-primary);
    }

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: var(--accent-light);
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }
    }

    &:active {
      transform: scale(0.96);
    }

    &:focus-visible {
      outline: 2px solid var(--accent-primary);
      outline-offset: 2px;
    }
  }
}

.app-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: var(--space-page);
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.shop-list {
  padding-bottom: 8px;
}

.shop-list-items {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;

  /* 平板端：2列 */
  @media (min-width: 560px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  /* 大屏端：3列 */
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.shop-card {
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

  .delete-btn {
    position: absolute;
    top: 6px;
    right: 6px;
    border: none;
    background: transparent;
    color: var(--text-placeholder);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition:
      opacity 0.2s ease,
      color 0.2s ease,
      background-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.15s ease;

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        color: #fff;
        background: var(--badge-danger-gradient);
        box-shadow: 0 4px 10px rgba(239, 83, 80, 0.3);
      }
    }

    &:active {
      transform: scale(0.88);
    }

    &:focus-visible {
      opacity: 1;
      outline: 2px solid var(--status-danger);
      outline-offset: 2px;
    }

    @media (hover: none) and (pointer: coarse) {
      opacity: 1;
      top: 2px;
      right: 2px;
      width: var(--touch-target);
      height: var(--touch-target);
      min-width: var(--touch-target);
      min-height: var(--touch-target);
      color: var(--status-danger);
    }

    i {
      font-size: 0.8rem;
    }
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover .delete-btn,
    &:focus-within .delete-btn {
      opacity: 1;
    }
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-card);
      border-color: var(--accent-primary);

      .avatar-text {
        transform: scale(1.05);
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
    background: var(--bg-badge);
    border: 1px solid var(--border-accent);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    transition: transform 0.25s ease;

    i {
      font-size: 1.25rem;
      color: var(--accent-primary);
    }
  }

  .info {
    flex-grow: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-right: 30px;
  }

  .name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .name {
    font-weight: 700;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 1rem;
    line-height: 1.35;
    flex: 1;
    min-width: 0;
  }

  .package-count {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    background: rgba(255, 195, 0, 0.14);
    color: var(--accent-dark);
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;

    i {
      font-size: 0.65rem;
    }
  }

  .desc {
    font-size: 0.8rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    line-height: 1.45;

    .slogan-text {
      flex: 1;
      min-width: 0;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
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

@media (prefers-reduced-motion: reduce) {
  .shop-card {
    animation: none;
    transition: none;
  }
}

.nav-bar {
  display: flex;
  border-top: 1px solid var(--border-accent);
  background: linear-gradient(135deg, var(--bg-header) 0%, var(--bg-header-light) 100%);
  padding: 8px 12px;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
  flex-shrink: 0;
  -webkit-backdrop-filter: blur(15px);
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
      font-size: 1.4rem;
      margin-bottom: 2px;
      transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      z-index: 1;
    }

    span {
      font-size: 0.7rem;
      font-weight: 600;
      transition: all 0.3s ease;
      position: relative;
      z-index: 1;
      letter-spacing: 0.5px;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 20px;
  color: var(--text-secondary);
  text-align: center;

  > i {
    font-size: 2.6rem;
    margin-bottom: 12px;
    opacity: 0.3;
  }

  p {
    margin: 0 0 16px;
    font-size: 0.92rem;
    opacity: 0.8;
  }

  .empty-import-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 16px;
    border: 1px solid var(--border-accent);
    border-radius: 999px;
    background: var(--bg-card);
    color: var(--text-primary);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition:
      background-color 0.2s ease,
      transform 0.15s ease;

    i {
      font-size: 0.8rem;
      color: var(--accent-primary);
    }

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: var(--accent-light);
        transform: translateY(-1px);
      }
    }

    &:active {
      transform: scale(0.96);
    }

    &:focus-visible {
      outline: 2px solid var(--accent-primary);
      outline-offset: 2px;
    }
  }
}

.hidden-input {
  display: none;
}
</style>
