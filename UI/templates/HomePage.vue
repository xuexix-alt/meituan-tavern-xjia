<template>
  <div class="home-page">
    <!-- 页面头部 -->
    <UiHeader title="首页" icon="home" />

    <div class="home-page__content">
      <!-- 分类网格 -->
      <UiListSection title="分类">
        <UiGrid :columns="4" gap="sm">
          <UiCard
            v-for="(category, index) in categories"
            :key="index"
            clickable
            hoverable
            @click="handleCategoryClick(category)"
          >
            <div class="category-item">
              <div class="category-item__icon">
                <i :class="`fas fa-${category.icon}`"></i>
              </div>
              <span class="category-item__text">{{ category.name }}</span>
            </div>
          </UiCard>
        </UiGrid>
      </UiListSection>

      <!-- 搜索栏 -->
      <UiSearchBar
        v-model="searchKeyword"
        placeholder="搜索心仪的美人或服务..."
        @search="handleSearch"
        @enter="handleSearch"
      />

      <!-- 特色玩法 -->
      <UiListSection title="特色玩法">
        <div class="feature-grid">
          <!-- 特色功能按钮区域 -->
        </div>
      </UiListSection>

      <!-- 推荐内容 -->
      <UiListSection title="为你推荐">
        <div class="recommendation-list">
          <div v-if="packages.length === 0" class="empty-state">
            暂无推荐，请先让AI生成内容。
          </div>
          <UiPackageCard
            v-for="pkg in packages.slice(0, 3)"
            :key="pkg.id"
            :id="pkg.id"
            :name="pkg.name"
            :description="pkg.description"
            :tags="pkg.tags"
            :icon="pkg.icon"
            @click="handlePackageClick"
          />
        </div>
      </UiListSection>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  UiHeader,
  UiListSection,
  UiGrid,
  UiCard,
  UiSearchBar,
  UiPackageCard,
} from '@/UI/components';

// 响应式数据
const searchKeyword = ref('');
const categories = ref([
  { name: '路人', icon: 'street-view' },
  { name: '偶遇', icon: 'mask' },
  { name: 'AV', icon: 'video' },
  { name: '街拍', icon: 'camera-retro' },
  { name: '熟人', icon: 'user-friends' },
  { name: '乱伦', icon: 'heart-broken' },
  { name: '职场', icon: 'briefcase' },
  { name: '友妻', icon: 'users' },
]);

const packages = ref<any[]>([]);

// 事件处理
const handleCategoryClick = (category: any) => {
  console.log('分类点击:', category);
};

const handleSearch = () => {
  console.log('搜索:', searchKeyword.value);
};

const handlePackageClick = (id?: string | number) => {
  console.log('套餐点击:', id);
};
</script>

<style lang="scss" scoped>
.home-page {
  &__content {
    padding: spacing(6);
  }
}

.category-item {
  @include flex-center();
  flex-direction: column;
  gap: spacing(2);
  padding: spacing(4);
  text-align: center;

  &__icon {
    width: 48px;
    height: 48px;
    @include flex-center();
    background: rgba(color(primary), 0.1);
    color: color(primary);
    border-radius: border-radius(lg);
    font-size: font(2xl);

    i {
      font-size: inherit;
    }
  }

  &__text {
    font-size: font(sm);
    font-weight: font(medium);
    color: text-color(primary);
  }
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: spacing(3);
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: spacing(4);
}

.empty-state {
  padding: spacing(8);
  text-align: center;
  color: text-color(secondary);
  font-size: font(sm);
}
</style>
