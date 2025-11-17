<template>
  <div class="app-view active">
    <div class="app-header">
      <div class="title">
        <i class="fas fa-arrow-left" @click="$router.back()"></i>
        <span id="detail-header-title">{{ itemData?.name || '商品详情' }}</span>
      </div>
    </div>

    <div class="app-content" id="detail-content">
      <div class="detail-info-card" style="margin-top: 0; border-radius: 0; box-shadow: none; padding-bottom: 18px;">
        <div class="detail-name">{{ itemData?.name || '未命名套餐' }}</div>
        <div class="detail-tags">
          <span v-for="tag in (itemData?.tags || [])" :key="tag" class="tag">{{ tag }}</span>
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
          <div v-for="content in itemData.content" :key="content" class="service-item">
            <p>{{ content }}</p>
          </div>
        </div>
        <div v-else class="empty-state">暂无特色玩法介绍。</div>
      </div>

      <div class="tab-content" :class="{ active: activeTab === 'reviews' }">
        <div v-if="itemData?.reviews && itemData.reviews.length > 0">
          <div v-for="review in itemData.reviews" :key="review" class="review-item">
            <p>{{ review }}</p>
          </div>
        </div>
        <div v-else class="empty-state">暂无顾客评价。</div>
      </div>

      <div class="tab-content" :class="{ active: activeTab === 'images' }">
        <div class="image-item">
          <h5>性感露脸</h5>
          <div class="image-placeholder" :style="{ borderStyle: itemData?.image1 ? 'solid' : 'dashed' }">
            {{ itemData?.image1 || '暂未提供' }}
          </div>
        </div>
        <div class="image-item">
          <h5>胸部特写</h5>
          <div class="image-placeholder" :style="{ borderStyle: itemData?.image2 ? 'solid' : 'dashed' }">
            {{ itemData?.image2 || '暂未提供' }}
          </div>
        </div>
        <div class="image-item">
          <h5>私处特写</h5>
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
          placeholder="可输入特殊要求，如服装、场景、认知等..."
        ></textarea>

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
import { useRoute } from 'vue-router';

const route = useRoute();
const itemData = ref<any>(null);
const activeTab = ref('content');
const showModal = ref(false);
const remarkText = ref('');

// 显示备注模态框
function showRemarkModal() {
  showModal.value = true;
}

// 关闭备注模态框
function closeRemarkModal() {
  showModal.value = false;
  remarkText.value = '';
}

// 添加到备注
function addToRemark(content: string) {
  if (remarkText.value) {
    remarkText.value += ' ' + content;
  } else {
    remarkText.value = content;
  }
}

// 确认下单
function confirmOrder() {
  const itemName = itemData.value?.name || '';
  const remark = remarkText.value || '无';
  sendToAI(`/send 我要下单：${itemName}。备注：${remark}`);
  closeRemarkModal();
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
  const itemId = route.params.id as string;
  itemData.value = data.packages.find(p => p.id === itemId);
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

.detail-info-card {
  background: #ffffff;
  padding: 20px;
  border-radius: 20px 20px 0 0;
  margin-top: 20px;
  position: relative;
  box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.05);
}

.detail-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: #1a1a1a;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;

  .tag {
    background-color: #fff8e1;
    color: #666666;
    font-size: 0.8rem;
    padding: 4px 10px;
    border-radius: 15px;
  }
}

.detail-tabs {
  display: flex;
  background-color: #ffffff;
  padding: 0 18px;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;

  .tab-link {
    padding: 12px 16px;
    cursor: pointer;
    border: none;
    background: transparent;
    font-size: 0.95rem;
    font-weight: 600;
    color: #666666;
    position: relative;
    transition: color 0.2s;

    &.active {
      color: #1a1a1a;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40%;
        height: 3px;
        background-color: #ffc300;
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
  background: #ffffff;
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
  color: #ffc300;
  background-color: #fff8e1;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  font-size: 0.8rem;
}

.review-item::before {
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  content: '\f075';
  color: #ffc300;
  background-color: #fff8e1;
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
  color: #1a1a1a;
  line-height: 1.5;
  font-size: 0.9rem;
}

.description-item {
  background: #f8f9fa !important;
  box-shadow: none !important;
  padding-left: 15px !important;
  align-items: flex-start;

  div {
    width: 100%;
  }

  .title {
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 5px;
  }

  .text {
    line-height: 1.6;
    color: #1a1a1a;
  }
}

.image-item {
  margin-bottom: 15px;

  h5 {
    font-size: 0.9rem;
    color: #999999;
    margin-bottom: 8px;
    font-weight: 600;
  }

  .image-placeholder {
    background-color: #f7f7f7;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1a1a1a;
    height: 180px;
    width: 100%;
    font-size: 1rem;
    border: 1px dashed #ddd;
  }
}

.detail-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #ffffff;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;

  .price-info .price {
    font-size: 1.4rem;
    font-weight: 700;
    color: #ff4a4a;
  }

  .order-btn {
    background: linear-gradient(135deg, #ffc300 0, #e6b000 100%);
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
      background: linear-gradient(135deg, #e6b000 0, #cc9900 100%);
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
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: none;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.modal-content {
  background: linear-gradient(135deg, #ffffff 0, #fafbfc 100%);
  padding: 24px;
  border-radius: 16px;
  width: 85%;
  max-width: 400px;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
  text-align: center;
  border: 1px solid #f8f8f8;
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
    background: linear-gradient(90deg, #ffc300, #ff6b35);
  }

  h3 {
    margin-bottom: 16px;
    color: #1a1a1a;
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
  color: #1a1a1a;
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
  background: linear-gradient(135deg, #f0f0f0 0, #e8e8e8 100%);
  color: #1a1a1a;
  font-size: 0.85rem;
  padding: 8px 12px;
  border-radius: 50px;
  border: 1px solid #e0e0e0;
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
    background: linear-gradient(135deg, #fff8e1 0, #fff3cc 100%);
    border-color: #ffc300;
    color: #111111;
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
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
  font-size: 0.9rem;
  resize: none;
  outline: none;
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  background: #ffffff;
  font-family: inherit;

  &:focus {
    border-color: #ffc300;
    box-shadow: 0 0 0 3px #fff3cc;
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
    background: linear-gradient(135deg, #ffc300 0, #e6b000 100%);
    color: #ffffff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    &:hover {
      background: linear-gradient(135deg, #e6b000 0, #cc9900 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
    }
  }

  .modal-btn-cancel {
    background: linear-gradient(135deg, #f5f5f5 0, #e8e8e8 100%);
    color: #999999;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    &:hover {
      background: linear-gradient(135deg, #e8e8e8 0, #dddddd 100%);
      color: #333333;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
    }
  }
}

.empty-state {
  text-align: center;
  color: #999999;
  padding: 40px 20px;
  line-height: 1.6;
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
</style>
