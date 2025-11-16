<template>
  <div class="app-view">
    <!-- 历史订单内容 -->
    <div class="app-header">
      <div class="title">
        <i class="fas fa-history"></i>
        <span>历史订单</span>
      </div>
    </div>

    <div class="app-content">
      <div class="card">
        <div class="card-title">
          <i class="fas fa-history"></i>历史订单
        </div>
        <div v-if="historyItems.length === 0" class="empty-state">
          暂无历史订单
        </div>
        <div v-for="item in historyItems" :key="item.order_time" class="history-card" @click="reorder(item)">
          <div class="history-info">
            <h3 class="history-title">{{ item.girl_name || '-' }} - {{ item.package_name || '-' }}</h3>
            <div class="history-details">
              <div class="detail-item">
                <i class="fas fa-user"></i>
                <span>{{ item.identity || '-' }}</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-clock"></i>
                <span>{{ item.order_time || '-' }}</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-info-circle"></i>
                <span>订单状态:</span>
                <span :style="getStatusStyle(item.order_status)" class="status-badge">{{ item.order_status || '-' }}</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>服务地点: {{ item.service_location || '-' }}</span>
              </div>
            </div>
          </div>
          <div class="history-price-section">
            <div class="history-price">{{ item.price || '-' }}</div>
            <div class="quick-reorder-btn">
              <i class="fas fa-redo"></i>
              <span>再次下单</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 确认订单弹窗 -->
    <div v-if="currentView === 'reorder' && selectedOrder" class="reorder-modal-overlay" @click.self="currentView = 'history'">
      <div class="reorder-modal-content">
        <div class="modal-header">
          <div class="modal-title">
            <i class="fas fa-shopping-cart"></i>确认订单
          </div>
          <button class="btn-close" @click="currentView = 'history'">
            <i class="fas fa-arrow-left"></i> 返回
          </button>
        </div>

        <div class="modal-body">
          <div class="order-info-grid">
            <div class="info-box">
              <div class="info-label">美人姓名</div>
              <div class="info-value">{{ selectedOrder.girl_name || '-' }}</div>
            </div>
            <div class="info-box">
              <div class="info-label">身份</div>
              <div class="info-value">{{ selectedOrder.identity || '-' }}</div>
            </div>
            <div class="info-box">
              <div class="info-label">套餐名称</div>
              <div class="info-value">{{ selectedOrder.package_name || '-' }}</div>
            </div>
            <div class="info-box">
              <div class="info-label">订单价格</div>
              <div class="info-value price">¥{{ selectedOrder.price || '-' }}</div>
            </div>
          </div>

          <div class="info-section">
            <div class="section-title">
              <i class="fas fa-info-circle"></i> 订单说明
            </div>
            <div class="section-content">
              您即将再次下单"{{ selectedOrder.package_name || '-' }}"服务，价格为 ¥{{ selectedOrder.price || '-' }}。
              当前好感度：{{ getNestedValue(selectedOrder?.originalData, '心理状态.好感度', '-') }}，
              被下单次数：{{ getNestedValue(selectedOrder?.originalData, '性经验.下单次数', '-') }}，
              怀孕几率：{{ getNestedValue(selectedOrder?.originalData, '性经验.怀孕几率', '-') }}。
              确认后将立即生效，请确保您已了解服务内容。
            </div>
          </div>

          <div class="info-section">
            <div class="section-title">
              <i class="fas fa-heart"></i> 心理状态
            </div>
            <div class="section-grid">
              <div class="section-item">
                <div class="section-item-label">好感度</div>
                <div class="section-item-value">{{ getNestedValue(selectedOrder?.originalData, '心理状态.好感度', '-') }}</div>
              </div>
              <div class="section-item">
                <div class="section-item-label">当前所想</div>
                <div class="section-item-value">{{ getNestedValue(selectedOrder?.originalData, '心理状态.当前所想', '-') }}</div>
              </div>
            </div>
          </div>

          <div class="info-section">
            <div class="section-title">
              <i class="fas fa-user"></i> 身体特征
            </div>
            <div class="section-grid">
              <div class="section-item">
                <div class="section-item-label">三围描述</div>
                <div class="section-item-value">{{ getNestedValue(selectedOrder?.originalData, '身体特征.三围.描述', '-') }}</div>
              </div>
              <div class="section-item">
                <div class="section-item-label">乳房形状</div>
                <div class="section-item-value">{{ getNestedValue(selectedOrder?.originalData, '身体特征.乳房.形状', '-') }}</div>
              </div>
              <div class="section-item">
                <div class="section-item-label">姿势</div>
                <div class="section-item-value">{{ getNestedValue(selectedOrder?.originalData, '身体特征.姿势', '-') }}</div>
              </div>
              <div class="section-item">
                <div class="section-item-label">胸部状态</div>
                <div class="section-item-value">{{ getNestedValue(selectedOrder?.originalData, '身体特征.胸部', '-') }}</div>
              </div>
              <div class="section-item">
                <div class="section-item-label">私处状态</div>
                <div class="section-item-value">{{ getNestedValue(selectedOrder?.originalData, '身体特征.私处', '-') }}</div>
              </div>
            </div>
          </div>

          <div class="info-section">
            <div class="section-title">
              <i class="fas fa-star"></i> 性经验
            </div>
            <div class="section-grid">
              <div class="section-item">
                <div class="section-item-label">是否处女</div>
                <div class="section-item-value">{{ getNestedValue(selectedOrder?.originalData, '性经验.处女', '-') }}</div>
              </div>
              <div class="section-item">
                <div class="section-item-label">性伴侣数量</div>
                <div class="section-item-value">{{ getNestedValue(selectedOrder?.originalData, '性经验.性伴侣数量', '-') }}</div>
              </div>
              <div class="section-item">
                <div class="section-item-label">初次性行为对象</div>
                <div class="section-item-value">{{ getNestedValue(selectedOrder?.originalData, '性经验.初次性行为对象', '-') }}</div>
              </div>
              <div class="section-item">
                <div class="section-item-label">怀孕几率</div>
                <div class="section-item-value">{{ getNestedValue(selectedOrder?.originalData, '性经验.怀孕几率', '-') }}</div>
              </div>
              <div class="section-item">
                <div class="section-item-label">下单次数</div>
                <div class="section-item-value">{{ getNestedValue(selectedOrder?.originalData, '性经验.下单次数', '-') }}</div>
              </div>
            </div>
          </div>

          <div class="info-section">
            <div class="section-title">
              <i class="fas fa-chart-bar"></i> 服务统计
            </div>
            <div class="section-grid">
              <div class="section-item">
                <div class="section-item-label">本次服务性交次数</div>
                <div class="section-item-value">{{ getNestedValue(selectedOrder?.originalData, '服务统计.本次服务性交次数', '-') }}</div>
              </div>
              <div class="section-item">
                <div class="section-item-label">内射次数</div>
                <div class="section-item-value">{{ getNestedValue(selectedOrder?.originalData, '服务统计.内射次数', '-') }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" @click="showReorderModal">
            <i class="fas fa-check-circle"></i> 再次下单
          </button>
          <button class="btn btn-secondary" @click="currentView = 'history'">
            <i class="fas fa-times-circle"></i> 取消
          </button>
        </div>
      </div>
    </div>

    <!-- 玩法和备注弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>玩法和备注</h3>
        <div v-if="currentOrderFeatures.length > 0" class="modal-tags-section">
          <h4>快速选择</h4>
          <div class="modal-tags-wrapper">
            <button
              v-for="feature in currentOrderFeatures"
              :key="feature"
              class="content-tag-btn"
              @click="addFeatureToRemark(feature)"
            >
              {{ feature }}
            </button>
          </div>
        </div>
        <textarea
          v-model="orderRemark"
          ref="remarkTextarea"
          placeholder="可输入特殊要求，如服装、场景、认知等..."
        ></textarea>
        <div class="modal-buttons">
          <button class="modal-btn-cancel" @click="closeModal">取消</button>
          <button class="modal-btn-confirm" @click="confirmOrder">再次下单</button>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="nav-bar">
      <div class="nav-item" @click="$router.push('/')">
        <i class="fas fa-home"></i>
        <span>首页</span>
      </div>
      <div class="nav-item" @click="$router.push('/discover')">
        <i class="fas fa-compass"></i>
        <span>发现</span>
      </div>
      <div class="nav-item" @click="$router.push('/service')">
        <i class="fas fa-heart"></i>
        <span>服务</span>
      </div>
      <div class="nav-item active" @click="$router.push('/history')">
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
import { ref, computed, onMounted, nextTick } from 'vue';

// 响应式数据
const historyItems = ref<any[]>([]);
const selectedOrder = ref<any>(null);
const currentView = ref('history');
const showModal = ref(false);
const orderRemark = ref('');
const remarkTextarea = ref<HTMLTextAreaElement | null>(null);

// 安全获取嵌套值
function getNestedValue(obj: any, path: string, fallback: any = '--') {
  if (!obj) return fallback;
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  let current = obj;
  for (const key of keys) {
    if (current == null) return fallback;
    current = current[key];
  }
  return current ?? fallback;
}

// 状态样式
function getStatusStyle(status: string) {
  const styles: Record<string, string> = {
    '已完成': 'background-color: rgba(46,204,113,0.2); color: #2ecc71; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;',
    '订单结束': 'background-color: rgba(231,76,60,0.2); color: #e74c3c; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;',
    '服务结束': 'background-color: rgba(230,126,34,0.2); color: #e67e22; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;',
    '进行中': 'background-color: rgba(52,152,219,0.2); color: #3498db; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;'
  };
  return styles[status] || styles['进行中'];
}

// 提取订单特色功能
function extractOrderFeatures(order: any): string[] {
  if (!order || typeof order !== 'object') return [];

  const features = new Set<string>();

  const pushFeature = (value: any) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (!trimmed) return;
    if (['无', '未知', '--'].includes(trimmed)) return;
    features.add(trimmed);
  };

  const pushFeatureArray = (list: any[]) => {
    if (!Array.isArray(list)) return;
    list.forEach(pushFeature);
  };

  pushFeature(order['套餐名称']);
  if (order['套餐']) {
    pushFeature(order['套餐']['套餐名称']);
    pushFeatureArray(order['套餐']['玩法特色']);
    pushFeature(order['套餐']['商品类型']);
  }

  const clothingSources = [
    order['服装'],
    order['身体特征']?.['服装']
  ];
  clothingSources.forEach(source => {
    if (source && typeof source === 'object') {
      Object.values(source).forEach(pushFeature);
    }
  });

  return Array.from(features);
}

// 当前订单特色
const currentOrderFeatures = computed(() => {
  if (selectedOrder.value) {
    const orderFeatures = selectedOrder.value.features || extractOrderFeatures(selectedOrder.value.originalData);
    if (orderFeatures.length > 0) return orderFeatures;
  }
  return [];
});

// 重新下单
function reorder(item: any) {
  selectedOrder.value = item;
  currentView.value = 'reorder';
}

function quickReorder(item: any) {
  const pkg = item.package_name || '未知套餐';
  sendToAI(`/send 我要下单：${pkg}`);
}

function showReorderModal() {
  orderRemark.value = '';
  showModal.value = true;
  nextTick(() => {
    try {
      remarkTextarea.value && remarkTextarea.value.focus();
    } catch (_) {}
  });
}

function closeModal() {
  showModal.value = false;
  orderRemark.value = '';
}

function addFeatureToRemark(feature: string) {
  if (orderRemark.value) {
    orderRemark.value += ' ' + feature;
  } else {
    orderRemark.value = feature;
  }
  if (remarkTextarea.value) remarkTextarea.value.focus();
}

function confirmOrder() {
  if (!selectedOrder.value) return;

  const pkg = selectedOrder.value.package_name || '未知套餐';
  const girl = selectedOrder.value.girl_name || '未知';
  const identity = selectedOrder.value.identity || '未知';
  const age = getNestedValue(selectedOrder.value?.originalData, '基础信息.年龄', '-');

  const originPrice = selectedOrder.value.price;
  const finalPrice = originPrice ?? '-';

  const remark = orderRemark.value.trim() || '无';
  const text = `再次下单：${girl}，${age}，${identity}，${pkg}，订单价格：¥${finalPrice}。备注：${remark}`;
  const ok = sendToAI(`/send ${text}`);

  closeModal();
  currentView.value = 'history';

  if (!ok) {
    try {
      console.info('命令已复制到剪贴板');
    } catch (_) {}
  }
}

function sendToAI(message: string) {
  console.log(`[发送至AI]: ${message}`);
  const fullCommand = `${message} | /trigger await=true`;
  if (typeof window.triggerSlash !== 'undefined') {
    try {
      window.triggerSlash(fullCommand);
      return true;
    } catch (e) {
      console.error('执行triggerSlash时出错:', e);
      return false;
    }
  } else {
    console.log(`[模拟发送至AI - 完整指令]: ${fullCommand}`);
    return false;
  }
}

// 初始化数据
async function initDisplay() {
  try {
    const messages = await getChatMessages('latest');
    if (!messages || messages.length === 0 || !messages[0].data) {
      const loaded = await loadFullExampleData();
      if (loaded) return true;
      return false;
    }

    const statData = messages[0].data.stat_data;
    if (!statData) {
      const loaded = await loadFullExampleData();
      if (loaded) return true;
      return false;
    }

    if (statData['历史订单'] && Array.isArray(statData['历史订单'])) {
      historyItems.value = statData['历史订单'].map((item: any) => {
        const order = Array.isArray(item) ? item[0] : item;
        return {
          girl_name: order.基础信息?.姓名?.[0] || order.姓名 || '未知',
          identity: order.基础信息?.身份?.[0] || order.身份 || '未知',
          package_name: order.套餐?.套餐名称?.[0] || order.套餐名称 || '未知套餐',
          order_time: '历史订单',
          order_status: order.订单状态 || '已完成',
          service_location: '未知',
          price: order.套餐?.套餐价格?.[0] || order.套餐价格 || 0,
          features: extractOrderFeatures(order),
          originalData: order
        };
      });
    } else {
      historyItems.value = [];
    }

    return true;
  } catch (error) {
    console.error('加载失败:', error);
    return false;
  }
}

async function getChatMessages(messageId: string) {
  try {
    if (typeof window.Mvu === 'undefined' || !window.Mvu.getMvuData) return [];
    const response = window.Mvu.getMvuData({ type: 'message', message_id: messageId || 'latest' });
    return response && response.stat_data ? [{ data: response }] : [];
  } catch (error) {
    console.error('获取消息失败:', error);
    return [];
  }
}

async function loadFullExampleData() {
  try {
    const res = await fetch('./变量示例.json');
    if (!res.ok) return false;
    const data = await res.json();
    const statData = data?.stat_data;
    if (!statData) return false;

    if (statData['历史订单'] && Array.isArray(statData['历史订单'])) {
      historyItems.value = statData['历史订单'].map((item: any) => {
        const order = Array.isArray(item) ? item[0] : item;
        return {
          girl_name: order.基础信息?.姓名?.[0] || order.姓名 || '未知',
          identity: order.基础信息?.身份?.[0] || order.身份 || '未知',
          package_name: order.套餐?.套餐名称?.[0] || order.套餐名称 || '未知套餐',
          order_time: '历史订单',
          order_status: order.订单状态 || '已完成',
          service_location: '未知',
          price: order.套餐?.套餐价格?.[0] || order.套餐价格 || 0,
          features: extractOrderFeatures(order),
          originalData: order
        };
      });
    } else {
      historyItems.value = [];
    }

    return true;
  } catch (error) {
    console.error('加载本地数据失败:', error);
    return false;
  }
}

onMounted(async () => {
  await initDisplay();
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

  .title {
    font-size: 1.3rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-primary);

    i {
      color: var(--accent-primary);
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

.card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 195, 0, 0.1);

  .card-title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;

    i {
      color: var(--accent-primary);
    }
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-placeholder);
  line-height: 1.6;
}

.history-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-card);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.4s;
  border: 1px solid var(--border-accent);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(255, 195, 0, 0.25);
  }

  .history-info {
    flex-grow: 1;
    margin-right: 16px;

    .history-title {
      font-size: 17px;
      font-weight: 700;
      margin-bottom: 6px;
      color: var(--text-primary);
    }

    .history-details {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .detail-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--text-placeholder);

        i {
          width: 14px;
          text-align: center;
        }

        .status-badge {
          margin-left: 4px;
        }
      }
    }
  }

  .history-price-section {
    text-align: right;
    flex-shrink: 0;

    .history-price {
      font-size: 28px;
      font-weight: 900;
      background: var(--badge-danger-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;

      &::before {
        content: '¥';
        font-size: 20px;
      }
    }

    .quick-reorder-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: var(--bg-badge);
      border: 1px solid var(--accent-primary);
      border-radius: 50px;
      font-size: 12px;
      font-weight: 600;
      color: var(--accent-dark);
      transition: all 0.25s;

      &:hover {
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-dark));
        color: white;
      }

      i {
        font-size: 11px;
      }
    }
  }
}

.reorder-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
}

.reorder-modal-content {
  background: var(--bg-card);
  border-radius: 20px;
  width: 100%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 12px 40px rgba(255, 195, 0, 0.25);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-dark));
    border-radius: 20px 20px 0 0;
  }

  .modal-header {
    padding: 24px 24px 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);

    .modal-title {
      font-size: 20px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--text-primary);

      i {
        color: var(--accent-primary);
      }
    }

    .btn-close {
      padding: 8px 16px;
      background: var(--bg-card-light);
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s;
      color: var(--text-secondary);

      &:hover {
        background: var(--bg-badge);
      }

      i {
        margin-right: 4px;
      }
    }
  }

  .modal-body {
    padding: 20px 24px;
    overflow-y: auto;
  }

  .modal-footer {
    padding: 16px 24px 24px 24px;
    display: flex;
    gap: 12px;

    .btn {
      flex: 1;
      padding: 14px;
      border-radius: 12px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      &.btn-primary {
        background: linear-gradient(135deg, var(--accent-primary) 0, var(--accent-dark) 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(255, 195, 0, 0.2);

        &:hover {
          background: linear-gradient(135deg, var(--accent-dark) 0, #cc9900 100%);
          transform: translateY(-2px);
        }
      }

      &.btn-secondary {
        background: var(--bg-card-light);
        color: var(--text-secondary);

        &:hover {
          background: var(--bg-badge);
        }
      }
    }
  }
}

.order-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;

  .info-box {
    background: var(--bg-card-light);
    padding: 16px;
    border-radius: 16px;
    border: 1px solid var(--border-color);

    .info-label {
      font-size: 12px;
      color: var(--text-placeholder);
      margin-bottom: 6px;
    }

    .info-value {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);

      &.price {
        font-size: 20px;
        background: var(--badge-danger-gradient);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
  }
}

.info-section {
  background: var(--bg-card-light);
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--border-color);

  .section-title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-primary);

    i {
      color: var(--accent-primary);
    }
  }

  .section-content {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.7;
  }

  .section-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .section-item {
    .section-item-label {
      font-size: 12px;
      color: var(--text-placeholder);
      margin-bottom: 4px;
    }

    .section-item-value {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
    }
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: var(--bg-card);
  padding: 28px;
  border-radius: 20px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 12px 40px rgba(255, 195, 0, 0.25);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(135deg, var(--accent-primary) 0, var(--accent-dark) 100%);
    border-radius: 20px 20px 0 0;
  }

  h3 {
    margin-bottom: 20px;
    text-align: center;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .modal-tags-section {
    margin-bottom: 16px;

    h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 10px;
      text-align: left;
      color: var(--text-secondary);
    }
  }

  .modal-tags-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .content-tag-btn {
    background: var(--bg-card-light);
    color: var(--text-primary);
    font-size: 13px;
    padding: 8px 14px;
    border-radius: 50px;
    border: 1.5px solid var(--border-color);
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-dark));
      color: white;
      transform: translateY(-2px);
    }
  }

  textarea {
    width: 100%;
    height: 100px;
    border: 2px solid var(--border-color);
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 20px;
    font-size: 14px;
    resize: none;
    transition: all 0.3s;
    font-family: inherit;
    background: var(--bg-card);
    color: var(--text-primary);

    &:focus {
      outline: none;
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px rgba(255, 195, 0, 0.2);
    }
  }

  .modal-buttons {
    display: flex;
    gap: 12px;

    button {
      flex: 1;
      padding: 14px;
      border-radius: 12px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .modal-btn-confirm {
      background: linear-gradient(135deg, var(--accent-primary) 0, var(--accent-dark) 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(255, 195, 0, 0.2);

      &:hover {
        transform: translateY(-2px);
      }
    }

    .modal-btn-cancel {
      background: var(--bg-card-light);
      color: var(--text-secondary);

      &:hover {
        background: var(--bg-badge);
      }
    }
  }
}

.nav-bar {
  display: flex;
  border-top: 1px solid var(--border-color);
  background: linear-gradient(135deg, var(--bg-header) 0, var(--bg-header-light) 100%);
  padding: 8px 0;
  flex-shrink: 0;

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--text-secondary);
    font-size: 0.8rem;
    padding: 4px 0;
    cursor: pointer;
    transition: all 0.25s;
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
      transition: all 0.25s;
    }
  }
}

@media (max-width: 480px) {
  .order-info-grid {
    grid-template-columns: 1fr;
  }

  .info-section {
    .section-grid {
      grid-template-columns: 1fr;
    }
  }

  .history-card {
    flex-direction: column;
    align-items: flex-start;

    .history-info {
      margin-right: 0;
      margin-bottom: 12px;
      width: 100%;
    }

    .history-price-section {
      width: 100%;
      text-align: left;

      .history-price {
        font-size: 24px;
      }
    }
  }
}
</style>
