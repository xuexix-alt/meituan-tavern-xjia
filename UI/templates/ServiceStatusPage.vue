<template>
  <div class="service-status-page">
    <UiHeader title="服务状态" icon="heart" />

    <div class="service-status-page__content">
      <!-- 搜索栏 -->
      <UiSearchBar
        v-model="searchKeyword"
        placeholder="搜索心仪的美人或服务..."
        @search="handleSearch"
      />

      <!-- 基础信息卡片网格 -->
      <UiListSection title="基础信息">
        <UiGrid :columns="3" gap="sm">
          <UiInfoCard
            label="玩家姓名"
            :value="userName"
            icon="user"
            icon-color="primary"
          />
          <UiInfoCard
            label="账户余额"
            :value="accountBalance"
            icon="wallet"
            icon-color="warning"
            value-color="warning"
          />
          <UiInfoCard
            label="订单消费"
            :value="totalSpending"
            icon="shopping-cart"
            icon-color="success"
            value-color="success"
          />
        </UiGrid>
      </UiListSection>

      <!-- 美人标签页 -->
      <UiTab
        v-if="girlsData.length > 1"
        v-model="currentGirlIndex"
        :tabs="girlTabs"
        @change="handleTabChange"
      />

      <!-- 服务状态详情 -->
      <UiStatusPanel
        v-if="currentGirl"
        :title="basicInfo.name"
        :icon="basicInfo.icon"
      >
        <div class="girl-details">
          <!-- 女孩基本信息 -->
          <div class="girl-header">
            <div class="girl-badges">
              <UiBadge variant="hot">HOT</UiBadge>
              <UiBadge variant="recommend">推荐</UiBadge>
            </div>
            <div class="girl-identity">
              {{ basicInfo.identity }} · {{ basicInfo.age }}岁
            </div>

            <!-- 星级评分 -->
            <UiStarRating
              v-model="starRating"
              :max-stars="5"
              :show-text="true"
              :text="`${affectionDisplay}/100 好感度`"
            />

            <!-- 特色标签 -->
            <div class="feature-tags">
              <UiBadge
                v-if="basicInfo.hairColor"
                variant="info"
                icon="paint-brush"
              >
                {{ basicInfo.hairColor }}
              </UiBadge>
              <UiBadge
                v-if="bodyInfo.cup"
                variant="info"
                icon="heart"
              >
                {{ bodyInfo.cup }}罩杯
              </UiBadge>
            </div>
          </div>

          <!-- 价格信息 -->
          <div class="price-section">
            <div class="price-label">套餐价格</div>
            <div class="price-value">¥{{ packageInfo.price }}</div>
          </div>

          <!-- 进度条 -->
          <div class="progress-section">
            <div class="progress-item">
              <span class="progress-label">亲密度</span>
              <div class="progress-bar">
                <div
                  class="progress-bar__fill"
                  :style="{ width: `${intimacy}%` }"
                ></div>
              </div>
              <span class="progress-value">{{ intimacy }}%</span>
            </div>

            <div class="progress-item">
              <span class="progress-label">好感度</span>
              <div class="progress-bar">
                <div
                  class="progress-bar__fill progress-bar__fill--success"
                  :style="{ width: `${affection}%` }"
                ></div>
              </div>
              <span class="progress-value">{{ affection }}%</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <UiButton variant="filled" size="lg" block @click="handleOrder">
              立即订购
            </UiButton>
            <UiButton variant="outline" size="lg" block @click="handleFavorite">
              加入收藏
            </UiButton>
          </div>
        </div>
      </UiStatusPanel>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  UiHeader,
  UiSearchBar,
  UiListSection,
  UiGrid,
  UiInfoCard,
  UiTab,
  UiStatusPanel,
  UiBadge,
  UiStarRating,
  UiButton,
} from '@/UI/components';

// 响应式数据
const searchKeyword = ref('');
const currentGirlIndex = ref(0);
const userName = ref('玩家');
const accountBalance = ref('¥0');
const totalSpending = ref('¥0');
const girlsData = ref<any[]>([]);
const starRating = ref(5);
const affectionDisplay = ref(75);
const intimacy = ref(60);
const affection = ref(75);

const basicInfo = ref({
  name: '美人名称',
  identity: '身份',
  age: 22,
  hairColor: '棕色',
  icon: 'user',
});

const bodyInfo = ref({
  cup: 'C',
});

const packageInfo = ref({
  price: 299,
});

// 计算属性
const currentGirl = computed(() => {
  return girlsData.value[currentGirlIndex.value];
});

const girlTabs = computed(() => {
  return girlsData.value.map((girl, index) => ({
    label: `美人${index + 1}`,
  }));
});

// 事件处理
const handleSearch = () => {
  console.log('搜索:', searchKeyword.value);
};

const handleTabChange = (index: number) => {
  console.log('切换标签:', index);
};

const handleOrder = () => {
  console.log('立即订购');
};

const handleFavorite = () => {
  console.log('加入收藏');
};
</script>

<style lang="scss" scoped>
.service-status-page {
  &__content {
    padding: spacing(6);
  }
}

.girl-details {
  display: flex;
  flex-direction: column;
  gap: spacing(6);
}

.girl-header {
  .girl-badges {
    display: flex;
    gap: spacing(2);
    margin-bottom: spacing(2);
  }

  .girl-identity {
    font-size: font(sm);
    color: text-color(secondary);
    margin-bottom: spacing(3);
  }

  .feature-tags {
    display: flex;
    gap: spacing(2);
    margin-top: spacing(3);
  }
}

.price-section {
  text-align: center;
  padding: spacing(4);
  background: rgba(color(primary), 0.05);
  border-radius: border-radius(lg);

  .price-label {
    font-size: font(sm);
    color: text-color(secondary);
    margin-bottom: spacing(1);
  }

  .price-value {
    font-size: font(3xl);
    font-weight: font(bold);
    color: color(primary);
  }
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: spacing(4);

  .progress-item {
    display: flex;
    align-items: center;
    gap: spacing(3);

    .progress-label {
      min-width: 60px;
      font-size: font(sm);
      color: text-color(secondary);
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: map-get($colors, gray-200);
      border-radius: border-radius(full);
      overflow: hidden;

      &__fill {
        height: 100%;
        background: color(primary);
        border-radius: border-radius(full);
        transition: width duration(slow) easing(smooth);

        &--success {
          background: color(success);
        }
      }
    }

    .progress-value {
      min-width: 40px;
      text-align: right;
      font-size: font(sm);
      font-weight: font(medium);
      color: text-color(primary);
    }
  }
}

.action-buttons {
  display: flex;
  gap: spacing(3);
}
</style>
