<template>
  <div class="app-view active">
    <div class="app-header">
      <div class="title">
        <span>🧭 发现</span>
        <button class="import-btn" @click="triggerImport">导入JSON</button>
      </div>
    </div>

    <div class="app-content">
      <div class="shop-list">
        <div v-if="shops.length === 0" class="empty-state">
          <i class="fas fa-search"></i>
          <p>暂无发现，请先让AI生成内容</p>
        </div>
        <div v-else class="shop-list-items">
          <div v-for="shop in shops" :key="shop.id" class="shop-card" @click="$router.push(`/shop/${shop.id}`)">
            <div class="avatar-text">
              <i
                v-if="(shop.packages || []).find((p: any) => p.icon)"
                :class="(shop.packages || []).find((p: any) => p.icon).icon"
              ></i>
              <i v-else class="fas fa-store"></i>
            </div>
            <div class="info">
              <div class="name">{{ shop.name }}</div>
              <div class="desc">
                <span class="slogan-text">{{ shop.slogan }}</span>
                <span v-if="shop.packages && shop.packages.length > 0" class="package-count">
                  <i class="fas fa-layer-group"></i>
                  {{ shop.packages.length }} 个套餐
                </span>
              </div>
            </div>
            <button class="delete-btn" @click.stop="deleteShop(shop.id)">
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
import { onMounted, ref } from 'vue';
import { extractDataFromMessage } from './dataParser';

const shops = ref<any[]>([]);
const shopStoreApi = ref<any>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const MAX_IMPORT_ITEMS = 200;
const MAX_IMPORT_SIZE_MB = 5;

function dedupeShops(list: any[]) {
  const map = new Map<string, any>();
  list.forEach(s => {
    if (!s) return;
    const id = s.id ? String(s.id) : '';
    if (id && !map.has(id)) {
      map.set(id, s);
      return;
    }
    // fallback 按 name 去重
    if (!id && s.name) {
      const key = `name_${s.name}`;
      if (!map.has(key)) map.set(key, s);
    }
  });
  return Array.from(map.values());
}

// 初始化
onMounted(async () => {
  try {
    await waitGlobalInitialized('ShopStore');
    shopStoreApi.value = (window as any).ShopStore;
  } catch (e) {
    console.warn('[Discover] ShopStore 未就绪，使用临时数据', e);
  }

  // 1. 获取现有缓存
  const existingShops = shopStoreApi.value?.getShops() || [];

  // 2. 获取当前解析数据
  const data = extractDataFromMessage();
  const parsedShops = data.shops || [];

  // 3. 合并 (优先保留新解析的数据，基于 id 去重)
  const combinedShops = [...parsedShops, ...existingShops];
  const uniqueById = Array.from(new Map(combinedShops.map(s => [s.id, s])).values());
  // 确保 id 始终为字符串，避免路由/去重错判
  uniqueById.forEach(s => (s.id = String(s.id)));

  // 4. 高级清洗：基于店名去重，自动清理重复的垃圾数据
  const nameMap = new Map<string, any[]>();
  uniqueById.forEach(s => {
    if (!s.name || s.name === '未命名店铺') return; // 跳过无效名
    const list = nameMap.get(s.name) || [];
    list.push(s);
    nameMap.set(s.name, list);
  });

  const finalShops: any[] = [];
  const idsToDelete: string[] = [];

  // 处理有名字的店铺
  nameMap.forEach(group => {
    if (group.length === 1) {
      finalShops.push(group[0]);
    } else {
      // 出现重复，选出一个保留
      // 优先级：shop_名字 > shop_auto_ > 其他
      group.sort((a, b) => {
        const score = (id: string, name: string) => {
          if (id === `shop_${name}`) return 3;
          if (id.includes('_auto_')) return 2;
          return 1;
        };
        return score(b.id, b.name) - score(a.id, a.name);
      });

      const winner = group[0];
      finalShops.push(winner);
      // 标记其余的为待删除
      for (let i = 1; i < group.length; i++) {
        idsToDelete.push(group[i].id);
      }
    }
  });

  // 把那些没有名字的店铺也加回来 (如果不希望保留无名店铺，可以注释掉)
  uniqueById.forEach(s => {
    if (!s.name || s.name === '未命名店铺') {
      finalShops.push(s);
    }
  });

  // 5. 执行清理和更新
  shops.value = finalShops;

  // 异步执行清理，避免阻塞
  if (idsToDelete.length > 0) {
    console.log('[Discover] 自动清理重复店铺:', idsToDelete);
    idsToDelete.forEach(id => shopStoreApi.value?.deleteShop(id));
  }

  if (parsedShops.length > 0) {
    shopStoreApi.value?.saveShops(finalShops);
  }

  console.log('[Discover] 已加载', shops.value.length, '个店铺 (清洗后)');

  // 监听缓存更新事件
  window.addEventListener('shop:cache:updated', () => {
    shops.value = dedupeShops(shopStoreApi.value?.getShops() || []);
  });
});

function deleteShop(id: string) {
  shops.value = shops.value.filter(shop => shop.id !== id);
  shopStoreApi.value?.deleteShop(id);
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
  padding: 20px 20px 16px 20px;
  padding-top: max(20px, env(safe-area-inset-top));
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-accent);
  flex-shrink: 0;
  -webkit-backdrop-filter: blur(15px);
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
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 1.6rem;
    font-weight: 900;
    color: var(--text-primary);
    letter-spacing: 1px;
    text-shadow: 0 2px 4px rgba(255, 195, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 10px;

    span {
      color: var(--text-primary);
    }

    .import-btn {
      padding: 8px 12px;
      border: 1px solid var(--border-accent);
      background: var(--bg-card);
      color: var(--text-primary);
      border-radius: 10px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-sm);

      &:hover {
        background: var(--accent-light);
        transform: translateY(-1px);
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

  &::-webkit-scrollbar {
    display: none;
  }
}

.shop-list {
  padding-bottom: 20px;
}

.shop-list-items {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;

  /* 平板端：2列 */
  @media (min-width: 481px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  /* 大屏端：3列 */
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.shop-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow:
    var(--shadow-sm),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  cursor: pointer;
  border: 1px solid var(--border-accent);
  position: relative;
  overflow: hidden;
  gap: 14px;

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

  .delete-btn {
    margin-left: auto;
    border: none;
    background: var(--badge-danger-gradient);
    color: #fff;
    border-radius: 50%;
    width: 34px;
    height: 34px;
    min-width: 34px;
    min-height: 34px;
    padding: 0;
    cursor: pointer;
    box-shadow: 0 3px 10px rgba(239, 83, 80, 0.28);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
    z-index: 1;

    &:hover {
      transform: translateY(-1px) scale(0.97);
      box-shadow: 0 5px 12px rgba(239, 83, 80, 0.35);
    }

    i {
      font-size: 12px;
    }
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
    font-size: 1.15rem;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .desc {
    font-size: 0.9rem;
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
      line-clamp: 1;
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
      color: rgba(255, 255, 255, 0.95);
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
  padding: 60px 20px;
  color: var(--text-secondary);
  text-align: center;

  i {
    font-size: 3rem;
    margin-bottom: 16px;
    opacity: 0.3;
  }

  p {
    margin: 0;
    font-size: 0.95rem;
    opacity: 0.8;
  }
}

.hidden-input {
  display: none;
}
</style>
