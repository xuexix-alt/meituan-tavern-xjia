# 最佳实践指南

本文档提供了使用UI技能系统的最佳实践，帮助你构建高质量的用户界面。

## 目录

1. [组件使用规范](#组件使用规范)
2. [样式管理](#样式管理)
3. [响应式设计](#响应式设计)
4. [性能优化](#性能优化)
5. [可访问性](#可访问性)
6. [代码组织](#代码组织)
7. [调试技巧](#调试技巧)

---

## 组件使用规范

### 1. 组件选择原则

**选择合适的组件:**

```vue
<!-- ✅ 正确：使用专门的组件 -->
<UiSearchBar v-model="keyword" @search="handleSearch" />

<!-- ❌ 错误：自己实现简单的搜索框 -->
<div class="search-box">
  <input v-model="keyword" />
  <button @click="handleSearch">搜索</button>
</div>
```

**组件组合使用:**

```vue
<!-- 推荐：使用组件组合构建复杂布局 -->
<UiHeader title="用户管理">
  <template #actions>
    <UiButton variant="outline" size="sm" @click="handleRefresh">
      刷新
    </UiButton>
  </template>
</UiHeader>

<UiListSection title="用户列表">
  <template #header-actions>
    <UiButton variant="filled" size="sm" @click="handleAdd">
      添加用户
    </UiButton>
  </template>

  <UiGrid :columns="3" gap="md">
    <UiCard
      v-for="user in users"
      :key="user.id"
      clickable
      hoverable
      @click="handleUserClick(user)"
    >
      <UiProfileHeader
        :name="user.name"
        :subtitle="user.role"
        :avatar="user.avatar"
      >
        <template #badges>
          <UiBadge v-if="user.vip" variant="vip">VIP</UiBadge>
        </template>
      </UiProfileHeader>
    </UiCard>
  </UiGrid>
</UiListSection>
```

### 2. Props使用规范

**提供默认值:**

```typescript
// ✅ 推荐：提供有意义的默认值
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'success';
  size?: 'sm' | 'md' | 'lg';
}>(), {
  variant: 'primary',
  size: 'md',
});

// ❌ 避免：不提供默认值导致类型错误
defineProps<{
  variant: string;
  size: string;
}>();
```

**类型安全:**

```typescript
// ✅ 推荐：使用联合类型限制取值
withDefaults(defineProps<{
  variant?: 'filled' | 'outline' | 'ghost';
}>(), {
  variant: 'filled',
});

// ❌ 避免：使用any类型
defineProps<{
  variant: any;
}>();
```

### 3. 事件命名规范

```typescript
// ✅ 推荐：使用kebab-case事件名
const emit = defineEmits<{
  'item-click': [item: any];
  'item-select': [item: any, selected: boolean];
}>();

// ✅ 推荐：使用update:前缀的双向绑定
const emit = defineEmits<{
  'update:modelValue': [value: string];
  'change': [value: string];
}>();
```

---

## 样式管理

### 1. 使用设计Tokens

**✅ 推荐：使用预定义的设计Tokens**

```scss
// 使用颜色
background: color(primary);
color: text-color(secondary);

// 使用间距
padding: spacing(4);
margin-bottom: spacing(6);

// 使用字体
font-size: font(lg);
font-weight: font(bold);

// 使用圆角
border-radius: border-radius(lg);

// 使用阴影
box-shadow: shadow(lg);
```

**❌ 避免：硬编码数值**

```scss
// ❌ 避免：硬编码颜色值
background: #4f46e5;
color: #64748b;

// ❌ 避免：硬编码间距
padding: 16px;
margin-bottom: 24px;

// ❌ 避免：硬编码字体大小
font-size: 18px;
font-weight: 600;
```

### 2. 使用Mixins

**✅ 推荐：复用样式逻辑**

```scss
.card {
  @include card-base();
  @include hover-shadow();
  @include active-state();
}

.button {
  @include button-filled();

  &--large {
    padding: spacing(4) spacing(6);
  }
}
```

**❌ 避免：重复样式代码**

```scss
// ❌ 避免：重复定义相似的样式
.card-1 {
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-2 {
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### 3. 样式作用域

**✅ 推荐：使用scoped样式**

```vue
<style lang="scss" scoped>
.card {
  // 样式仅作用于当前组件
}
</style>
```

**✅ 推荐：全局样式使用前缀**

```scss
// UI组件库样式使用ui-前缀
.ui-card {
  @include card-base();
}

.ui-button {
  @include button-base();
}
```

---

## 响应式设计

### 1. 移动端优先

**✅ 推荐：从小屏幕开始设计**

```scss
.card {
  padding: spacing(4);

  // 平板及以上屏幕增加内边距
  @include up(md) {
    padding: spacing(6);
  }

  // 大屏幕进一步增加
  @include up(lg) {
    padding: spacing(8);
  }
}
```

**❌ 避免：大屏幕优先**

```scss
// ❌ 避免：默认样式针对大屏幕
.card {
  padding: 48px;
}

// 然后在移动端减少（不够灵活）
@media (max-width: 768px) {
  .card {
    padding: 16px;
  }
}
```

### 2. 断点使用

**✅ 推荐：使用语义化断点**

```scss
// 移动端
@include down(sm) { /* 样式 */ }

// 平板
@include between(sm, md) { /* 样式 */ }

// 桌面端
@include up(md) { /* 样式 */ }
```

**❌ 避免：使用具体像素值**

```scss
// ❌ 避免：硬编码像素断点
@media (max-width: 768px) { /* 样式 */ }
@media (min-width: 1024px) { /* 样式 */ }
```

### 3. 网格响应式

```vue
<template>
  <!-- 移动端1列，平板2列，桌面3-4列 -->
  <UiGrid :columns="4" gap="md">
    <UiCard v-for="item in items" :key="item.id">
      {{ item.title }}
    </UiCard>
  </UiGrid>
</template>
```

---

## 性能优化

### 1. 组件渲染优化

**使用v-memo缓存复杂渲染:**

```vue
<template>
  <UiCard
    v-for="item in items"
    :key="item.id"
    v-memo="[item.selected, item.count]"
  >
    <h3>{{ item.title }}</h3>
    <p>{{ item.description }}</p>
    <span>{{ item.count }}</span>
  </UiCard>
</template>
```

**使用computed缓存计算:**

```typescript
const expensiveValue = computed(() => {
  return items.value.filter(item => item.active)
                   .sort((a, b) => b.score - a.score)
                   .slice(0, 10);
});
```

### 2. 样式优化

**避免过度嵌套:**

```scss
// ✅ 推荐：扁平化结构
.card {
  &__header { /* 样式 */ }
  &__body { /* 样式 */ }
  &__footer { /* 样式 */ }
}

// ❌ 避免：过深嵌套
.card {
  .card-header {
    .card-title {
      .title-text {
        // ...
      }
    }
  }
}
```

**使用transform而非position:**

```scss
// ✅ 推荐：使用transform
.modal {
  transform: translate(-50%, -50%);
}

// ❌ 避免：频繁使用top/left（触发重排）
.modal {
  top: 50%;
  left: 50%;
  margin-top: -150px;
  margin-left: -200px;
}
```

### 3. 动画优化

**使用GPU加速属性:**

```scss
// ✅ 推荐：transform和opacity
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s;
}
```

**避免动画过多元素:**

```typescript
// ✅ 推荐：限制同时动画数量
const animateElements = async (elements: HTMLElement[]) => {
  const batchSize = 5;
  for (let i = 0; i < elements.length; i += batchSize) {
    const batch = elements.slice(i, i + batchSize);
    await Promise.all(batch.map(el => animateElement(el)));
    await delay(50); // 小延迟防止卡顿
  }
};
```

---

## 可访问性

### 1. 语义化HTML

**✅ 推荐：使用语义化标签**

```vue
<!-- ✅ 推荐：使用正确的HTML结构 -->
<UiHeader title="页面标题">
  <template #actions>
    <UiButton aria-label="设置">设置</UiButton>
  </template>
</UiHeader>

<main role="main">
  <UiSearchBar
    v-model="search"
    placeholder="搜索..."
    role="searchbox"
    aria-label="搜索框"
  />
</main>

<!-- ❌ 避免：使用div代替语义标签 -->
<div class="header">
  <div class="actions">
    <button>设置</button>
  </div>
</div>
```

### 2. ARIA标签

```vue
<template>
  <!-- 按钮 -->
  <UiButton
    variant="outline"
    aria-label="删除项目"
    @click="handleDelete"
  >
    <i class="fas fa-trash" aria-hidden="true"></i>
  </UiButton>

  <!-- 搜索框 -->
  <UiSearchBar
    v-model="search"
    role="searchbox"
    aria-label="商品搜索"
    aria-describedby="search-help"
  />
  <p id="search-help" class="sr-only">
    输入关键词搜索商品
  </p>

  <!-- 标签页 -->
  <UiTab
    v-model="activeTab"
    role="tablist"
    :tabs="tabs"
  >
    <div
      v-if="activeTab === 0"
      role="tabpanel"
      aria-labelledby="tab-0"
    >
      标签页内容
    </div>
  </UiTab>
</template>
```

### 3. 键盘导航

```typescript
// 为自定义组件添加键盘支持
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleClick();
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    selectPrevious();
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    selectNext();
  }
};
```

### 4. 动画与可访问性

```scss
// 支持用户减少动画偏好
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

// 为动画元素添加说明
.animated-element {
  &::after {
    content: '动画';
    @include sr-only();
  }
}
```

---

## 代码组织

### 1. 文件结构

```
src/
├── components/
│   ├── ui/                    # UI组件
│   ├── features/              # 业务组件
│   └── layouts/               # 布局组件
├── composables/               # 组合式函数
│   ├── useSearch.ts
│   └── usePagination.ts
├── utils/                     # 工具函数
│   ├── formatters.ts
│   └── validators.ts
└── types/                     # 类型定义
    ├── api.ts
    └── components.ts
```

### 2. 组件组织

**单一职责原则:**

```typescript
// ✅ 推荐：单一职责的组件
const UserCard = defineComponent({
  props: {
    user: {
      type: Object as PropType<User>,
      required: true,
    },
  },
  emits: ['select'],
});

// ❌ 避免：承担过多职责
const UserManagementPanel = defineComponent({
  // 既要显示用户，又要管理用户，又要处理搜索...
});
```

**组件拆分:**

```vue
<!-- ✅ 推荐：拆分小组件 -->
<template>
  <UserCard
    v-for="user in users"
    :key="user.id"
    :user="user"
    @select="handleUserSelect"
  />
</template>

<!-- UserCard.vue -->
<template>
  <UiCard hoverable clickable @click="handleSelect">
    <UiProfileHeader
      :name="user.name"
      :subtitle="user.email"
      :avatar="user.avatar"
    >
      <template #badges>
        <UiBadge v-if="user.admin" variant="vip">管理员</UiBadge>
      </template>
    </UiProfileHeader>
  </UiCard>
</template>
```

### 3. 组合式函数

```typescript
// useSearch.ts
export const useSearch = () => {
  const keyword = ref('');
  const results = ref<SearchResult[]>([]);
  const loading = ref(false);

  const search = async () => {
    loading.value = true;
    try {
      results.value = await api.search(keyword.value);
    } finally {
      loading.value = false;
    }
  };

  return {
    keyword,
    results,
    loading,
    search,
  };
};
```

---

## 调试技巧

### 1. 样式调试

**使用CSS自定义属性:**

```scss
:root {
  --debug-border: 1px solid red;
}

.debug {
  border: var(--debug-border);
}
```

**查看组件结构:**

```vue
<template>
  <div class="component-tree">
    <UiHeader title="调试" />
    <UiGrid :columns="2">
      <UiCard>Item 1</UiCard>
      <UiCard>Item 2</UiCard>
    </UiGrid>
  </div>
</template>

<style scoped>
.component-tree * {
  outline: 1px dashed rgba(255, 0, 0, 0.3);
}
</style>
```

### 2. 性能分析

**使用Vue DevTools:**

```typescript
// 标记性能测量点
import { markRaw } from 'vue';

const expensiveOperation = () => {
  performance.mark('start-expensive');

  // 复杂计算

  performance.mark('end-expensive');
  performance.measure('expensive', 'start-expensive', 'end-expensive');
};
```

**使用Chrome DevTools:**

```typescript
// 在需要分析的地方打点
console.time('render-list');
renderList();
console.timeEnd('render-list');

// 内存快照
console.profile('render-profile');
renderList();
console.profileEnd('render-profile');
```

### 3. 错误处理

```vue
<script setup lang="ts">
// 全局错误处理
const errorHandler = (error: Error) => {
  console.error('组件错误:', error);
  toastr.error('操作失败，请重试');
};

// 边界组件
const Fallback = defineComponent({
  setup() {
    return () => h('div', '出现错误，请刷新页面');
  },
});
</script>
```

---

## 总结

遵循这些最佳实践可以帮助你：

1. **提高代码质量** - 使用规范的组件和样式
2. **提升用户体验** - 响应式设计和可访问性
3. **增强性能** - 优化渲染和动画
4. **便于维护** - 清晰的代码组织
5. **快速定位问题** - 有效的调试技巧

记住：**清晰比聪明更重要，简单比复杂更困难。**
