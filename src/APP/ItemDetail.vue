<template>
  <div class="app-view active">
    <div class="app-header">
      <div class="title">
        <button class="back-btn" type="button" aria-label="返回" @click="$router.back()">
          <i class="fas fa-arrow-left"></i>
        </button>
        <span id="detail-header-title">{{ itemData?.name || '商品详情' }}</span>
      </div>
    </div>

    <div class="app-content" id="detail-content">
      <div class="detail-info-card">
        <div class="detail-name">{{ itemData?.name || '未命名套餐' }}</div>
        <div class="detail-tags">
          <span v-for="tag in itemData?.tags || []" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>

      <div class="detail-tabs">
        <button class="tab-link" :class="{ active: activeTab === 'content' }" @click="activeTab = 'content'">
          特色玩法
        </button>
        <button class="tab-link" :class="{ active: activeTab === 'reviews' }" @click="activeTab = 'reviews'">
          顾客评价
        </button>
        <button class="tab-link" :class="{ active: activeTab === 'images' }" @click="activeTab = 'images'">
          私密写真
        </button>
      </div>

      <div class="tab-content" :class="{ active: activeTab === 'content' }">
        <div v-if="itemData?.description" class="service-item description-item">
          <div>
            <p class="title">详情介绍</p>
            <p class="text">{{ itemData.description }}</p>
          </div>
        </div>
        <div v-if="itemData?.content && itemData.content.length > 0">
          <div
            v-for="content in itemData.content"
            :key="content"
            class="service-item clickable"
            role="button"
            tabindex="0"
            @click="handleFeatureClick(content)"
            @keydown.enter.prevent="handleFeatureClick(content)"
            @keydown.space.prevent="handleFeatureClick(content)"
          >
            <p>{{ content }}</p>
          </div>
          <div class="tip-text">💡 点击上方特色玩法可直接下单，或点击底部"立即下单"自定义备注</div>
        </div>
        <div v-else class="empty-state">
          <i class="fas fa-list-ul"></i>
          <p>暂无特色玩法介绍</p>
        </div>
      </div>

      <div class="tab-content" :class="{ active: activeTab === 'reviews' }">
        <div v-if="itemData?.reviews && itemData.reviews.length > 0">
          <div v-for="review in itemData.reviews" :key="review" class="review-item">
            <p>{{ review }}</p>
          </div>
        </div>
        <div v-else class="empty-state">
          <i class="fas fa-comment-slash"></i>
          <p>暂无顾客评价</p>
        </div>
      </div>

      <div class="tab-content private-photo-panel" :class="{ active: activeTab === 'images' }">
        <div
          v-for="photo in [
            { label: '露脸图', value: itemData?.image1 },
            { label: '时装秀', value: itemData?.image2 },
            { label: '私密拍', value: itemData?.image3 },
          ]"
          :key="photo.label"
          class="image-item"
        >
          <div class="image-gallery-header">
            <h5>{{ photo.label }}</h5>
            <span class="image-gallery-status">
              {{ isImageSource(photo.value) ? '已生成' : '待生成' }}
            </span>
          </div>
          <div class="image-gallery-card">
            <div v-if="isImageSource(photo.value)" class="image-gallery-media">
              <img :src="photo.value" :alt="photo.label" loading="lazy" />
            </div>
            <div v-else class="image-placeholder">
              <i class="fas fa-camera-retro" aria-hidden="true"></i>
              <span>{{ photo.value || '暂无生成提示词' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="detail-footer">
      <div class="price-info">
        <span class="price">{{ itemData?.price || '¥0' }}</span>
      </div>
      <button class="order-btn" @click="showRemarkModal">立即下单</button>
    </div>

    <!-- 备注模态框 -->
    <div id="remark-modal" class="modal-overlay" :style="{ display: showModal ? 'flex' : 'none' }">
      <div class="modal-content">
        <h3>玩法和备注</h3>

        <div class="modal-content-tags" v-if="itemData?.content && itemData.content.length > 0">
          <h4 class="modal-tags-title">快速选择</h4>
          <div class="modal-tags-wrapper">
            <button
              v-for="content in itemData.content"
              :key="content"
              class="content-tag-btn"
              @click="addToRemark(content)"
            >
              {{ content }}
            </button>
          </div>
        </div>

        <textarea
          id="remark-textarea"
          v-model="remarkText"
          placeholder="可尝试时空替换、NTR、NTL、露出、换装秀、反差婊等多样玩法..."
        ></textarea>

        <div v-if="submissionError" class="submission-error" role="alert">{{ submissionError }}</div>

        <div class="modal-buttons">
          <button class="modal-btn-cancel" @click="closeRemarkModal">取消</button>
          <button class="modal-btn-confirm" @click="confirmOrder">确认下单</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { extractDataFromMessage } from './dataParser';
import { useStorySession } from './story/storyContext';
import { buildPackageOrderPrompt } from './story/orderPrompts';
import { submitOrderToStory } from './story/orderSubmission';
import { dedupePackages, findPackageByIdOrName } from './services/itemLookup';

const route = useRoute();
const router = useRouter();
const storySession = useStorySession();
const itemData = ref<any>(null);
const activeTab = ref('content');
const showModal = ref(false);
const remarkText = ref('');
const shopStoreApi = ref<any>(null);
const fallbackLogPrinted = ref(false);
const submissionError = ref('');

function isImageSource(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const source = value.trim();
  return /^(?:https?:\/\/|data:image\/|blob:)/i.test(source);
}

// 显示备注模态框
function showRemarkModal() {
  submissionError.value = '';
  showModal.value = true;
}

// 关闭备注模态框
function closeRemarkModal() {
  showModal.value = false;
  remarkText.value = '';
  submissionError.value = '';
}

// 添加到备注
function addToRemark(content: string) {
  if (remarkText.value) {
    remarkText.value += ' ' + content;
  } else {
    remarkText.value = content;
  }
}

// 点击特色玩法
function handleFeatureClick(content: string) {
  remarkText.value = content;
  showRemarkModal();
}

// 确认下单
async function confirmOrder() {
  const itemName = itemData.value?.name || '';
  const itemDescription = itemData.value?.description || '无详情';
  const remark = remarkText.value || '无';
  const prompt = buildPackageOrderPrompt({ itemName, itemDescription, remark });
  submissionError.value = '';
  const result = await submitOrderToStory(storySession, router, prompt);
  if (!result.accepted) {
    submissionError.value = result.error || '无法开始正文，请稍后重试。';
    return;
  }
  closeRemarkModal();
}

// 初始化
onMounted(async () => {
  const itemId = route.params.id as string;
  const shopId = route.params.shopId as string | undefined;
  const fromQueryName = route.query?.name as string | undefined;

  // 1) 解析当前楼层
  const parsed = extractDataFromMessage().packages || [];

  // 2) 读取 ShopStore 缓存（若可用）
  let cached: any[] = [];
  try {
    await waitGlobalInitialized('ShopStore');
    shopStoreApi.value = (window as any).ShopStore;
    cached = (shopStoreApi.value?.getShops?.() || []).flatMap((s: any) => s.packages || []);
  } catch (e) {
    console.warn('[ItemDetail] ShopStore 不可用，使用解析数据', e);
  }

  const combined = dedupePackages([...parsed, ...cached]);
  const scopedPackages = shopId
    ? combined.filter(p => String(p.shop_id ?? p.shopId ?? '') === String(shopId))
    : combined;
  itemData.value = findPackageByIdOrName(scopedPackages, String(itemId), fromQueryName, !shopId);

  // 3) 若按 id 未命中，尝试按名称/价格最相近的套餐兜底
  if (!itemData.value) {
    itemData.value = findPackageByIdOrName(combined, String(itemId), fromQueryName, true);
  }
  const fallbackCandidates = scopedPackages.length > 0 ? scopedPackages : combined;
  if (!itemData.value && fallbackCandidates.length > 0) {
    itemData.value = fallbackCandidates[0];
    if (!fallbackLogPrinted.value) {
      console.warn('[ItemDetail] 未匹配到相同 ID，已兜底使用首个套餐', {
        want: itemId,
        shopId,
        candidates: combined.slice(0, 5).map(p => p.id),
      });
      fallbackLogPrinted.value = true;
    }
  }

  console.log('[ItemDetail] loaded item:', itemData.value);
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
  min-height: 0;
  overflow-y: auto;
  padding: 0;
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.detail-info-card {
  background: var(--bg-card);
  padding: 16px var(--space-page) 18px;
  border-bottom: 1px solid var(--border-accent);
  margin-bottom: 0;
  position: relative;
}

.detail-name {
  font-size: 1.3rem;
  font-weight: 800;
  margin-bottom: 10px;
  color: var(--text-primary);
  letter-spacing: 0.3px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 0;

  .tag {
    background: rgba(255, 195, 0, 0.14);
    color: var(--accent-dark);
    font-size: 0.72rem;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 999px;
    white-space: nowrap;
  }
}

.detail-tabs {
  display: flex;
  touch-action: pan-y;
  background-color: var(--bg-card);
  padding: 0 var(--space-page);
  border-bottom: 1px solid var(--border-accent);
  position: sticky;
  top: 0;
  z-index: 10;

  .tab-link {
    flex: 1;
    text-align: center;
    touch-action: pan-y;
    padding: 12px 4px;
    min-height: var(--touch-target);
    cursor: pointer;
    border: none;
    background: transparent;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-secondary);
    position: relative;
    transition: color 0.2s ease;

    @media (hover: hover) and (pointer: fine) {
      &:hover:not(.active) {
        color: var(--text-primary);
      }
    }

    &:focus-visible {
      outline: 2px solid var(--accent-primary);
      outline-offset: -2px;
      border-radius: 6px;
    }

    &.active {
      color: var(--accent-dark);
      font-weight: 700;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 28px;
        height: 3px;
        background: linear-gradient(90deg, var(--accent-primary), var(--accent-light));
        border-radius: 2px;
      }
    }
  }
}

.tab-content {
  display: none;
  padding: var(--space-page);
  animation: fadeIn 0.3s;

  &.active {
    display: block;
  }
}

.review-item,
.service-item {
  background: var(--bg-card);
  padding: 14px;
  border-radius: var(--radius-card);
  margin-bottom: 10px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-accent);
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.service-item::before {
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  content: '\f00c';
  color: var(--accent-primary);
  background-color: var(--bg-badge);
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  font-size: 0.7rem;
  margin-top: 1px;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.service-item.clickable {
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.25s ease,
    border-color 0.2s ease;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-card);
      border-color: var(--accent-primary);

      &::before {
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-light));
        color: #fff;
      }
    }
  }

  &:active {
    transform: scale(0.99);
  }

  &:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }
}

.review-item::before {
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  content: '\f075';
  color: var(--accent-primary);
  background-color: var(--bg-badge);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  font-size: 0.8rem;
}

.review-item p,
.service-item p {
  margin: 0;
  color: var(--text-primary);
  line-height: 1.5;
  font-size: 0.9rem;
}

.description-item {
  background: var(--bg-card-light) !important;
  box-shadow: none !important;
  padding-left: 15px !important;
  align-items: flex-start;

  div {
    width: 100%;
  }

  .title {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 5px;
  }

  .text {
    line-height: 1.6;
    color: var(--text-primary);
  }
}

.private-photo-panel {
  grid-template-columns: 1fr;
  gap: 18px;
  padding: 16px var(--space-page) 36px;
}

.private-photo-panel.active {
  display: grid;
}

.private-photo-panel .image-item {
  min-width: 0;
  margin: 0;
}

.image-gallery-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.image-gallery-header h5 {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.image-gallery-status {
  color: var(--text-placeholder);
  font-size: 0.75rem;
}

.image-gallery-card {
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
}

.image-gallery-media {
  aspect-ratio: 4 / 5;
  background: var(--bg-primary);
}

.image-gallery-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.private-photo-panel .image-placeholder {
  display: flex;
  min-height: 180px;
  height: auto;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 10px;
  padding: 18px;
  border: 0;
  border-radius: 0;
  background: var(--bg-card-light);
  color: var(--text-primary);
  font-size: 0.95rem;
  line-height: 1.75;
  overflow-wrap: anywhere;
  text-align: left;
}

.private-photo-panel .image-placeholder i {
  flex: 0 0 auto;
  margin-top: 3px;
  color: var(--accent-primary);
}

@media (max-width: 380px) {
  .private-photo-panel {
    padding-inline: 12px;
  }
}

.detail-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  background: var(--bg-card);
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;

  .price-info .price {
    font-family: 'DIN Alternate', 'Roboto Condensed', sans-serif;
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--status-danger);
    letter-spacing: -0.5px;
  }

  .order-btn {
    background: linear-gradient(135deg, var(--accent-primary) 0, var(--accent-light) 100%);
    color: #ffffff;
    border: none;
    padding: 0 28px;
    min-height: var(--touch-target);
    border-radius: 999px;
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 1px;
    cursor: pointer;
    transition:
      transform 0.15s ease,
      box-shadow 0.2s ease,
      filter 0.2s ease;
    box-shadow: 0 4px 12px rgba(255, 195, 0, 0.3);

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(255, 195, 0, 0.4);
        filter: brightness(1.03);
      }
    }

    &:active {
      transform: scale(0.96);
    }

    &:focus-visible {
      outline: 2px solid var(--accent-dark);
      outline-offset: 2px;
    }
  }
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: none;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.modal-content {
  background: var(--bg-card);
  padding: 24px;
  border-radius: 16px;
  width: 85%;
  max-width: 400px;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
  text-align: center;
  border: 1px solid var(--border-accent);
  position: relative;
  overflow: hidden;
  animation: modal-up 0.22s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--accent-primary), var(--accent-dark));
  }

  h3 {
    margin-bottom: 16px;
    color: var(--text-primary);
    font-size: 1.2rem;
    font-weight: 700;
  }
}

.modal-content-tags {
  margin-bottom: 15px;
}

.modal-tags-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
  text-align: left;
}

.modal-tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
}

.content-tag-btn {
  background: var(--bg-card-light);
  color: var(--text-primary);
  font-size: 0.82rem;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease;
  white-space: nowrap;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: var(--bg-badge);
      border-color: var(--accent-primary);
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

.modal-content textarea {
  width: 100%;
  height: 80px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
  font-size: 0.9rem;
  resize: none;
  outline: none;
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  background: var(--bg-card);
  color: var(--text-primary);
  font-family: inherit;

  &:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px var(--bg-badge);
    transform: translateY(-1px);
  }
}

.modal-buttons {
  display: flex;
  justify-content: space-between;
  gap: 12px;

  button {
    flex: 1;
    padding: 12px 16px;
    min-height: var(--touch-target);
    border-radius: var(--radius-control);
    border: none;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      transform 0.15s ease,
      box-shadow 0.2s ease,
      background-color 0.2s ease,
      filter 0.2s ease;

    &:active {
      transform: scale(0.97);
    }

    &:focus-visible {
      outline: 2px solid var(--accent-primary);
      outline-offset: 2px;
    }
  }

  .modal-btn-confirm {
    background: linear-gradient(135deg, var(--accent-primary) 0, var(--accent-light) 100%);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(255, 195, 0, 0.3);

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        transform: translateY(-1px);
        filter: brightness(1.03);
      }
    }
  }

  .modal-btn-cancel {
    background: var(--bg-card-light);
    color: var(--text-secondary);

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: var(--bg-badge);
        color: var(--text-primary);
        transform: translateY(-1px);
      }
    }
  }
}

.tip-text {
  background: linear-gradient(135deg, var(--bg-badge), var(--bg-card));
  border-left: 4px solid var(--accent-primary);
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  box-shadow: 0 2px 8px rgba(255, 195, 0, 0.1);
  animation: fadeIn 0.5s ease;

  i {
    color: var(--accent-primary);
    margin-right: 6px;
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modal-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.submission-error {
  margin-top: 10px;
  padding: 9px 11px;
  border: 1px solid color-mix(in srgb, var(--status-danger) 40%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--status-danger) 8%, transparent);
  color: var(--status-danger);
  font-size: 13px;
}
</style>
