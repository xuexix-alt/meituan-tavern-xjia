<template>
  <div class="example-basic">
    <!-- 基础组件使用示例 -->
    <UiHeader title="基础组件示例" icon="star" />

    <div class="example-section">
      <h3>按钮组件</h3>
      <div class="button-row">
        <UiButton>默认按钮</UiButton>
        <UiButton variant="outline">轮廓按钮</UiButton>
        <UiButton variant="ghost">透明按钮</UiButton>
        <UiButton variant="filled" icon="heart">带图标按钮</UiButton>
        <UiButton loading>加载中</UiButton>
      </div>
    </div>

    <div class="example-section">
      <h3>卡片组件</h3>
      <UiGrid :columns="2" gap="md">
        <UiCard hoverable>
          <h4>基础卡片</h4>
          <p>这是一个可悬停的卡片组件</p>
        </UiCard>
        <UiCard clickable @click="handleCardClick">
          <h4>可点击卡片</h4>
          <p>点击这个卡片试试</p>
        </UiCard>
      </UiGrid>
    </div>

    <div class="example-section">
      <h3>搜索栏组件</h3>
      <UiSearchBar
        v-model="searchValue"
        placeholder="输入搜索关键词..."
        @search="handleSearch"
      />
    </div>

    <div class="example-section">
      <h3>徽章组件</h3>
      <div class="badge-row">
        <UiBadge>默认</UiBadge>
        <UiBadge variant="success">成功</UiBadge>
        <UiBadge variant="warning">警告</UiBadge>
        <UiBadge variant="danger">危险</UiBadge>
        <UiBadge variant="hot">热门</UiBadge>
        <UiBadge variant="new">新品</UiBadge>
      </div>
    </div>

    <div class="example-section">
      <h3>星级评分组件</h3>
      <UiStarRating
        v-model="rating"
        :max-stars="5"
        :show-text="true"
        text="非常好"
      />
    </div>

    <div class="example-section">
      <h3>标签页组件</h3>
      <UiTab v-model="activeTab" :tabs="tabList" @change="handleTabChange">
        <div v-if="activeTab === 0">
          <p>标签页1的内容</p>
        </div>
        <div v-if="activeTab === 1">
          <p>标签页2的内容</p>
        </div>
        <div v-if="activeTab === 2">
          <p>标签页3的内容</p>
        </div>
      </UiTab>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  UiHeader,
  UiButton,
  UiCard,
  UiGrid,
  UiSearchBar,
  UiBadge,
  UiStarRating,
  UiTab,
} from '@/UI/components';

// 响应式数据
const searchValue = ref('');
const rating = ref(4);
const activeTab = ref(0);
const tabList = [
  { label: '标签1' },
  { label: '标签2' },
  { label: '标签3' },
];

// 事件处理
const handleCardClick = () => {
  alert('卡片被点击了！');
};

const handleSearch = () => {
  console.log('搜索:', searchValue.value);
};

const handleTabChange = (index: number) => {
  console.log('切换到标签:', index);
};
</script>

<style lang="scss" scoped>
.example-basic {
  padding: spacing(6);
}

.example-section {
  margin-bottom: spacing(8);

  h3 {
    margin: 0 0 spacing(4) 0;
    font-size: font(xl);
    font-weight: font(semibold);
    color: text-color(primary);
  }

  .button-row {
    display: flex;
    flex-wrap: wrap;
    gap: spacing(3);
  }

  .badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: spacing(2);
  }
}
</style>
