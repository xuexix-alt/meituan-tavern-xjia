<template>
  <div class="app-view active">
    <div class="app-header">
      <div class="title">
        <i class="fas fa-arrow-left" @click="$router.back()"></i>
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
            @click="handleFeatureClick(content)"
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

      <div class="tab-content" :class="{ active: activeTab === 'images' }">
        <div class="image-item">
          <h5>露脸图</h5>
          <div class="image-placeholder" :style="{ borderStyle: itemData?.image1 ? 'solid' : 'dashed' }">
            {{ itemData?.image1 || '暂未提供' }}
          </div>
        </div>
        <div class="image-item">
          <h5>时装秀</h5>
          <div class="image-placeholder" :style="{ borderStyle: itemData?.image2 ? 'solid' : 'dashed' }">
            {{ itemData?.image2 || '暂未提供' }}
          </div>
        </div>
        <div class="image-item">
          <h5>私密拍</h5>
          <div class="image-placeholder" :style="{ borderStyle: itemData?.image3 ? 'solid' : 'dashed' }">
            {{ itemData?.image3 || '暂未提供' }}
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
  padding: 16px;
  padding-top: max(16px, env(safe-area-inset-top));
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  -webkit-backdrop-filter: blur(10px);
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
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.detail-info-card {
  background: var(--bg-card);
  padding: 20px 20px 24px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 0;
  position: relative;
}

.detail-name {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 1.6rem;
  font-weight: 800;
  margin-bottom: 12px;
  color: var(--text-primary);
  letter-spacing: 0.5px;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 0;

  .tag {
    background-color: var(--bg-badge);
    color: var(--text-secondary);
    font-size: 0.8rem;
    padding: 4px 10px;
    border-radius: 15px;
  }
}

.detail-tabs {
  display: flex;
  background-color: var(--bg-card);
  padding: 0 12px;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;

  .tab-link {
    flex: 1;
    text-align: center;
    padding: 14px 4px;
    cursor: pointer;
    border: none;
    background: transparent;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-secondary);
    position: relative;
    transition: all 0.3s ease;

    &.active {
      color: var(--text-primary);
      font-size: 1.05rem;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40%;
        height: 3px;
        background-color: var(--accent-primary);
        border-radius: 2px;
      }
    }
  }
}

.tab-content {
  display: none;
  padding: 18px;
  animation: fadeIn 0.3s;

  &.active {
    display: block;
  }
}

.review-item,
.service-item {
  background: var(--bg-card);
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.service-item::before {
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  content: '\f00c';
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
  transition: all 0.25s ease;
}

.service-item.clickable {
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateX(8px);
    box-shadow: 0 4px 12px rgba(255, 195, 0, 0.3);
    border-left: 4px solid var(--accent-primary);
  }

  &:hover::before {
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-light));
    color: white;
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(255, 195, 0, 0.4);
  }

  &:active {
    transform: translateX(12px) scale(0.98);
    transition: all 0.1s ease;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 195, 0, 0.1), transparent);
    transition: left 0.5s ease;
  }

  &:hover::after {
    left: 100%;
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

.image-item {
  margin-bottom: 15px;

  h5 {
    font-size: 0.9rem;
    color: var(--text-placeholder);
    margin-bottom: 8px;
    font-weight: 600;
  }

  .image-placeholder {
    background-color: var(--bg-primary);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-primary);
    height: 180px;
    width: 100%;
    font-size: 1rem;
    border: 1px dashed var(--border-color);
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
    padding: 12px 24px;
    border-radius: 50px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    &:hover {
      background: linear-gradient(135deg, var(--accent-light) 0, var(--accent-dark) 100%);
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    }

    &:active::before {
      width: 100px;
      height: 100px;
      animation: ripple 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    &:active {
      transform: translateY(0) scale(1.02);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
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
  animation: slideInRight 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

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
  font-size: 0.85rem;
  padding: 8px 12px;
  border-radius: 50px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  white-space: nowrap;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 195, 0, 0.2), transparent);
    transition: left 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  &:hover {
    background: var(--bg-badge);
    border-color: var(--accent-primary);
    color: var(--text-primary);
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-1px) scale(1.02);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
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
    border-radius: 8px;
    border: none;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    &:active::before {
      width: 100px;
      height: 100px;
      animation: ripple 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
  }

  .modal-btn-confirm {
    background: linear-gradient(135deg, var(--accent-primary) 0, var(--accent-light) 100%);
    color: #ffffff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    &:hover {
      background: linear-gradient(135deg, var(--accent-light) 0, var(--accent-dark) 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
    }
  }

  .modal-btn-cancel {
    background: var(--bg-card-light);
    color: var(--text-secondary);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    &:hover {
      background: var(--bg-badge);
      color: var(--text-primary);
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
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

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
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
