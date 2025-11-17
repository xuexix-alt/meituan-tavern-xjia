# 组件文档

本文档详细说明每个UI组件的用法、属性和示例。

## 目录

1. [基础组件](#基础组件)
2. [复合组件](#复合组件)
3. [业务组件](#业务组件)

---

## 基础组件

### UiCard

基础卡片容器，提供内容包装和交互效果。

#### 属性 (Props)

| 名称 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `hoverable` | `boolean` | `false` | 是否启用悬停效果 |
| `clickable` | `boolean` | `false` | 是否可点击 |
| `selected` | `boolean` | `false` | 是否选中状态 |

#### 事件 (Events)

| 名称 | 参数 | 说明 |
|------|------|------|
| `click` | `MouseEvent` | 点击事件 |

#### 使用示例

```vue
<template>
  <UiCard hoverable clickable @click="handleCardClick">
    <h3>卡片标题</h3>
    <p>卡片内容</p>
  </UiCard>
</template>
```

---

### UiButton

多功能按钮组件，支持多种样式和尺寸。

#### 属性 (Props)

| 名称 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'filled' \| 'outline' \| 'ghost' \| 'link'` | `'filled'` | 按钮样式 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 按钮尺寸 |
| `block` | `boolean` | `false` | 是否宽度100% |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `loading` | `boolean` | `false` | 是否加载中 |
| `icon` | `string` | - | 图标名称（FontAwesome） |
| `tag` | `string` | `'button'` | 自定义标签 |

#### 样式变体

- **filled**: 填充样式（默认）
- **outline**: 轮廓样式
- **ghost**: 透明样式
- **link**: 链接样式

#### 使用示例

```vue
<template>
  <!-- 默认按钮 -->
  <UiButton>默认按钮</UiButton>

  <!-- 轮廓按钮 -->
  <UiButton variant="outline">轮廓按钮</UiButton>

  <!-- 带图标按钮 -->
  <UiButton variant="filled" icon="heart">喜欢</UiButton>

  <!-- 加载状态 -->
  <UiButton loading>加载中...</UiButton>

  <!-- 大尺寸块级按钮 -->
  <UiButton size="lg" block>块级按钮</UiButton>
</template>
```

---

### UiSearchBar

搜索栏组件，提供搜索输入和操作功能。

#### 属性 (Props)

| 名称 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string` | `''` | 搜索关键词 |
| `placeholder` | `string` | `'搜索...'` | 占位符文本 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `showButton` | `boolean` | `true` | 是否显示搜索按钮 |
| `buttonText` | `string` | `'搜索'` | 按钮文本 |

#### 事件 (Events)

| 名称 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `string` | 输入值变化 |
| `search` | `string` | 点击搜索按钮 |
| `enter` | `string` | 按下回车键 |

#### 使用示例

```vue
<template>
  <UiSearchBar
    v-model="searchKeyword"
    placeholder="输入搜索关键词..."
    @search="handleSearch"
    @enter="handleEnter"
  />
</template>

<script setup lang="ts">
const searchKeyword = ref('');

const handleSearch = (value: string) => {
  console.log('搜索:', value);
};

const handleEnter = (value: string) => {
  console.log('回车搜索:', value);
};
</script>
```

---

### UiGrid

网格布局组件，提供响应式网格系统。

#### 属性 (Props)

| 名称 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `columns` | `number` | `2` | 网格列数（1-4） |
| `gap` | `'sm' \| 'md' \| 'lg'` | `'md'` | 网格间距 |

#### 响应式行为

- **桌面端**: 使用指定的列数
- **平板端**: 3-4列自动调整为2列
- **手机端**: 强制单列显示

#### 使用示例

```vue
<template>
  <!-- 2列网格（默认） -->
  <UiGrid>
    <UiCard>项目1</UiCard>
    <UiCard>项目2</UiCard>
    <UiCard>项目3</UiCard>
    <UiCard>项目4</UiCard>
  </UiGrid>

  <!-- 3列网格 -->
  <UiGrid :columns="3" gap="sm">
    <UiCard>项目1</UiCard>
    <UiCard>项目2</UiCard>
    <UiCard>项目3</UiCard>
  </UiGrid>
</template>
```

---

## 复合组件

### UiHeader

页面头部组件，提供标题、图标和操作区域。

#### 属性 (Props)

| 名称 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | - | 主标题 |
| `subtitle` | `string` | - | 副标题 |
| `icon` | `string` | - | 图标名称（FontAwesome） |

#### 插槽 (Slots)

| 名称 | 说明 |
|------|------|
| `default` | 页面标题区域内容 |
| `actions` | 右侧操作区内容 |

#### 使用示例

```vue
<template>
  <UiHeader
    title="页面标题"
    subtitle="副标题描述"
    icon="star"
  >
    <template #actions>
      <UiButton variant="ghost" size="sm">设置</UiButton>
    </template>
  </UiHeader>
</template>
```

---

### UiBadge

徽章/标签组件，用于显示状态和分类。

#### 属性 (Props)

| 名称 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'info' \| 'hot' \| 'new' \| 'recommend' \| 'vip'` | `'primary'` | 徽章样式 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 徽章尺寸 |
| `icon` | `string` | - | 图标名称 |
| `dot` | `boolean` | `false` | 是否显示为圆点 |

#### 颜色变体

- `primary`: 主色（蓝色）
- `success`: 成功（绿色）
- `warning`: 警告（黄色）
- `danger`: 危险（红色）
- `info`: 信息（蓝色）
- `hot`: 热门（红色）
- `new`: 新品（绿色）
- `recommend`: 推荐（橙色）
- `vip`: VIP（紫色）

#### 使用示例

```vue
<template>
  <!-- 默认徽章 -->
  <UiBadge>标签</UiBadge>

  <!-- 带图标徽章 -->
  <UiBadge variant="success" icon="check">已完成</UiBadge>

  <!-- 热门徽章 -->
  <UiBadge variant="hot">HOT</UiBadge>

  <!-- 小尺寸徽章 -->
  <UiBadge size="sm" variant="info">小标签</UiBadge>
</template>
```

---

### UiStarRating

星级评分组件，支持交互和只读模式。

#### 属性 (Props)

| 名称 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `number` | `0` | 当前评分 |
| `maxStars` | `number` | `5` | 最大星数 |
| `readonly` | `boolean` | `false` | 是否只读 |
| `showText` | `boolean` | `false` | 是否显示文本 |
| `text` | `string` | - | 显示文本 |
| `icon` | `string` | `'fa-star'` | 星星图标 |
| `hoverIcon` | `string` | `'fa-star'` | 悬停图标 |

#### 事件 (Events)

| 名称 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `number` | 评分变化 |
| `change` | `number` | 评分确定 |

#### 使用示例

```vue
<template>
  <!-- 可交互评分 -->
  <UiStarRating
    v-model="rating"
    :max-stars="5"
    :show-text="true"
    text="非常好"
    @change="handleRatingChange"
  />

  <!-- 只读评分 -->
  <UiStarRating
    :model-value="4"
    :max-stars="5"
    :readonly="true"
    :show-text="true"
    text="4.0分"
  />
</template>

<script setup lang="ts">
const rating = ref(4);

const handleRatingChange = (value: number) => {
  console.log('新评分:', value);
};
</script>
```

---

### UiTab

标签页组件，支持多标签切换。

#### 属性 (Props)

| 名称 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `number` | `0` | 当前活跃标签索引 |
| `tabs` | `Array<{ label: string, value?: string \| number }>` | `[]` | 标签列表 |

#### 事件 (Events)

| 名称 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `number` | 活跃标签变化 |
| `change` | `number, Tab` | 标签切换 |

#### 使用示例

```vue
<template>
  <UiTab v-model="activeTab" :tabs="tabList" @change="handleTabChange">
    <div v-if="activeTab === 0">
      <p>标签1的内容</p>
    </div>
    <div v-if="activeTab === 1">
      <p>标签2的内容</p>
    </div>
    <div v-if="activeTab === 2">
      <p>标签3的内容</p>
    </div>
  </UiTab>
</template>

<script setup lang="ts">
const activeTab = ref(0);

const tabList = [
  { label: '标签1' },
  { label: '标签2' },
  { label: '标签3' },
];

const handleTabChange = (index: number, tab: any) => {
  console.log('切换到:', index, tab);
};
</script>
```

---

## 业务组件

### UiInfoCard

信息展示卡片，通常用于显示统计数据。

#### 属性 (Props)

| 名称 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | - | 标签文本 |
| `value` | `string \| number` | - | 数值 |
| `icon` | `string` | - | 图标名称 |
| `iconColor` | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'primary'` | 图标颜色 |
| `valueColor` | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'primary'` | 数值颜色 |

#### 插槽 (Slots)

| 名称 | 说明 |
|------|------|
| `icon` | 自定义图标区域 |
| `value` | 自定义数值显示 |

#### 使用示例

```vue
<template>
  <UiGrid :columns="3" gap="sm">
    <UiInfoCard
      label="用户数量"
      :value="userCount"
      icon="users"
      icon-color="primary"
      value-color="primary"
    />
    <UiInfoCard
      label="订单总额"
      :value="totalAmount"
      icon="shopping-cart"
      icon-color="success"
      value-color="success"
    />
    <UiInfoCard
      label="在线状态"
      value="在线"
      icon="circle"
      icon-color="success"
      value-color="success"
    />
  </UiGrid>
</template>
```

---

### UiPackageCard

套餐展示卡片，用于显示商品或服务套餐。

#### 属性 (Props)

| 名称 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `id` | `string \| number` | - | 套餐ID |
| `name` | `string` | - | 套餐名称 |
| `description` | `string` | - | 描述 |
| `tags` | `string[]` | `[]` | 标签列表 |
| `icon` | `string` | - | 图标 |

#### 事件 (Events)

| 名称 | 参数 | 说明 |
|------|------|------|
| `click` | `string \| number` | 点击事件，传入套餐ID |

#### 使用示例

```vue
<template>
  <UiPackageCard
    :id="package.id"
    :name="package.name"
    :description="package.description"
    :tags="package.tags"
    :icon="package.icon"
    @click="handlePackageClick"
  />
</template>

<script setup lang="ts">
const package = ref({
  id: 1,
  name: '豪华套餐',
  description: '包含多项高级服务',
  tags: ['高级', '推荐', '热门'],
  icon: 'crown'
});

const handlePackageClick = (id?: string | number) => {
  router.push(`/package/${id}`);
};
</script>
```

---

### UiStatusPanel

状态展示面板，提供卡片容器和自定义头部。

#### 属性 (Props)

| 名称 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | - | 面板标题 |
| `icon` | `string` | - | 图标 |

#### 插槽 (Slots)

| 名称 | 说明 |
|------|------|
| `actions` | 头部操作区 |
| `default` | 面板内容 |

#### 使用示例

```vue
<template>
  <UiStatusPanel title="服务状态" icon="heart">
    <template #actions>
      <UiButton variant="ghost" size="sm">设置</UiButton>
    </template>

    <div class="panel-content">
      <p>面板内容区域</p>
    </div>
  </UiStatusPanel>
</template>
```

---

### UiProfileHeader

个人资料头部组件，展示用户头像和基本信息。

#### 属性 (Props)

| 名称 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | `string` | - | 用户名 |
| `subtitle` | `string` | - | 副标题 |
| `avatar` | `string` | - | 头像URL |

#### 插槽 (Slots)

| 名称 | 说明 |
|------|------|
| `badges` | 徽章区域 |

#### 使用示例

```vue
<template>
  <UiProfileHeader
    name="美人名称"
    subtitle="25岁 · 学生"
    avatar="/avatar.jpg"
  >
    <template #badges>
      <UiBadge variant="hot">HOT</UiBadge>
      <UiBadge variant="vip">VIP</UiBadge>
    </template>
  </UiProfileHeader>
</template>
```

---

### UiListSection

列表区块组件，组织页面内容区块。

#### 属性 (Props)

| 名称 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | - | 区块标题 |

#### 插槽 (Slots)

| 名称 | 说明 |
|------|------|
| `header-actions` | 标题区操作按钮 |
| `default` | 区块内容 |

#### 使用示例

```vue
<template>
  <UiListSection title="用户列表">
    <template #header-actions>
      <UiButton variant="outline" size="sm">添加</UiButton>
    </template>

    <UiCard v-for="user in users" :key="user.id">
      <div class="user-item">
        {{ user.name }}
      </div>
    </UiCard>
  </UiListSection>
</template>
```

---

## 通用特性

### 响应式设计

所有组件都支持响应式设计，自动适配不同屏幕尺寸：

- **大屏幕** (≥1024px): 完整功能展示
- **平板** (768px-1023px): 适当调整布局
- **手机** (<768px): 单列布局，触摸优化

### 无障碍访问

组件支持基本的无障碍访问特性：

- 键盘导航支持
- 适当的语义化HTML
- ARIA标签支持

### TypeScript支持

所有组件都提供完整的TypeScript类型定义：

```typescript
import { UiButton } from '@/UI/components';

// 类型安全的使用
<UiButton variant="filled" size="lg">按钮</UiButton>
```

---

## 更多资源

- [动画指南](./animations.md)
- [样式系统](./styles.md)
- [最佳实践](./best-practices.md)
