# UI技能系统集成指南

本指南将帮助你将UI技能系统集成到现有的酒馆助手项目中。

## 快速开始

### 1. 文件复制

将整个`UI/`目录复制到你的项目根目录：

```bash
# 复制UI技能系统到你的项目
cp -r F:/ST/meituan-tavern-xjia/UI /path/to/your/project/
```

### 2. 项目配置

#### 配置TypeScript路径别名

在`tsconfig.json`中添加路径别名：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@UI/*": ["UI/*"]
    }
  }
}
```

#### 配置Webpack别名

在`vite.config.ts`或`webpack.config.ts`中添加：

```typescript
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@UI': resolve(__dirname, 'UI'),
    },
  },
});
```

### 3. 导入使用

#### 在Vue组件中导入

```vue
<script setup lang="ts">
import {
  UiCard,
  UiButton,
  UiGrid,
  UiHeader,
} from '@UI/components';
</script>
```

#### 导入样式

```scss
// 在你的主样式文件中导入
@import '@UI/styles/tokens.scss';
@import '@UI/styles/mixins.scss';

// 或者在组件中导入
<style lang="scss" scoped>
@import '@UI/styles/tokens.scss';
@import '@UI/styles/mixins.scss';

.custom-component {
  color: color(primary);
  padding: spacing(4);
}
</style>
```

#### 使用动画

```typescript
<script setup lang="ts">
import { pageAnimations, interactionAnimations } from '@UI/animations';
import { onMounted } from 'vue';

onMounted(() => {
  // 页面加载动画
  pageAnimations.fadeIn('.page-content', 0.6);

  // 添加悬停效果
  interactionAnimations.cardHover('.card');
});
</script>
```

## 集成示例

### 示例1：基础页面集成

```vue
<template>
  <div class="user-profile-page">
    <!-- 使用UI组件构建页面 -->
    <UiHeader title="个人资料" icon="user">
      <template #actions>
        <UiButton variant="outline" size="sm" @click="handleEdit">
          编辑
        </UiButton>
      </template>
    </UiHeader>

    <div class="page-content">
      <UiListSection title="基本信息">
        <UiGrid :columns="2" gap="sm">
          <UiInfoCard
            label="用户名"
            :value="user.name"
            icon="user"
            icon-color="primary"
          />
          <UiInfoCard
            label="邮箱"
            :value="user.email"
            icon="envelope"
            icon-color="info"
          />
          <UiInfoCard
            label="注册时间"
            :value="user.registerDate"
            icon="calendar"
            icon-color="success"
          />
          <UiInfoCard
            label="状态"
            :value="user.status"
            icon="check-circle"
            icon-color="success"
            value-color="success"
          />
        </UiGrid>
      </UiListSection>

      <UiListSection title="徽章">
        <div class="badge-list">
          <UiBadge variant="primary">活跃用户</UiBadge>
          <UiBadge variant="success">已验证</UiBadge>
          <UiBadge variant="vip">VIP会员</UiBadge>
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
  UiInfoCard,
  UiBadge,
  UiButton,
} from '@UI/components';

import { pageAnimations } from '@UI/animations';
import { onMounted } from 'vue';

const user = ref({
  name: '用户名',
  email: 'user@example.com',
  registerDate: '2024-01-01',
  status: '正常',
});

const handleEdit = () => {
  console.log('编辑用户资料');
};

onMounted(() => {
  pageAnimations.fadeIn('.user-profile-page', 0.6);
});
</script>

<style lang="scss" scoped>
@import '@UI/styles/tokens.scss';
@import '@UI/styles/mixins.scss';

.user-profile-page {
  .page-content {
    padding: spacing(6);
  }

  .badge-list {
    display: flex;
    flex-wrap: wrap;
    gap: spacing(2);
  }
}
</style>
```

### 示例2：使用页面模板

直接复制并修改`UI/templates/HomePage.vue`：

```vue
<template>
  <HomePageTemplate
    :categories="customCategories"
    :packages="customPackages"
    @category-click="handleCategoryClick"
    @search="handleSearch"
    @package-click="handlePackageClick"
  />
</template>

<script setup lang="ts">
import HomePageTemplate from '@UI/templates/HomePage.vue';

const customCategories = ref([
  { name: '分类1', icon: 'icon1' },
  { name: '分类2', icon: 'icon2' },
]);

const customPackages = ref([]);

const handleCategoryClick = (category: any) => {
  console.log('分类点击:', category);
};

const handleSearch = (keyword: string) => {
  console.log('搜索:', keyword);
};

const handlePackageClick = (id?: string | number) => {
  console.log('套餐点击:', id);
};
</script>
```

### 示例3：集成动画效果

```vue
<template>
  <div class="animated-page">
    <UiCard
      v-for="item in items"
      :key="item.id"
      class="animated-card"
      hoverable
      clickable
      @click="handleCardClick(item)"
    >
      <h3>{{ item.title }}</h3>
      <p>{{ item.description }}</p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { UiCard } from '@UI/components';
import { listAnimations, interactionAnimations } from '@UI/animations';
import { onMounted, nextTick } from 'vue';

const items = ref([
  { id: 1, title: '标题1', description: '描述1' },
  { id: 2, title: '标题2', description: '描述2' },
  { id: 3, title: '标题3', description: '描述3' },
]);

const handleCardClick = (item: any) => {
  console.log('点击卡片:', item);
};

onMounted(async () => {
  await nextTick();

  // 列表项依次出现
  listAnimations.staggerIn('.animated-card', 0.1);

  // 添加悬停效果
  const cards = document.querySelectorAll('.animated-card');
  cards.forEach(card => {
    interactionAnimations.cardHover(card as HTMLElement);
  });
});
</script>

<style lang="scss" scoped>
.animated-page {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: spacing(4);
  padding: spacing(6);
}

.animated-card {
  cursor: pointer;
}
</style>
```

## 高级集成

### 1. 自定义主题

创建自定义主题文件：

```scss
// custom-theme.scss
@import '@UI/styles/tokens.scss';

// 覆盖默认颜色
$colors: map-merge($colors, (
  primary: #your-color,
  secondary: #your-color,
));

// 覆盖默认字体
$fonts: map-merge($fonts, (
  sans: 'Your Custom Font', sans-serif,
));
```

### 2. 添加全局样式

在`main.ts`或入口文件中导入：

```typescript
import '@UI/styles/tokens.scss';
import '@UI/styles/mixins.scss';
import './custom-theme.scss';
```

### 3. 按需导入

只导入需要的组件：

```typescript
// 只导入按钮和卡片
import UiButton from '@UI/components/UiButton.vue';
import UiCard from '@UI/components/UiCard.vue';
```

### 4. Tree Shaking支持

在`vite.config.ts`中配置：

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'ui-components': ['@UI/components'],
          'ui-animations': ['@UI/animations'],
          'ui-styles': ['@UI/styles'],
        },
      },
    },
  },
});
```

## 常见问题

### Q: 样式不生效怎么办？

**A: 检查以下几点：**

1. 确保已导入样式文件：
```scss
@import '@UI/styles/tokens.scss';
@import '@UI/styles/mixins.scss';
```

2. 检查SCSS配置是否正确
3. 确保没有其他样式覆盖

### Q: 动画不流畅？

**A: 优化建议：**

1. 减少同时动画的元素数量
2. 使用`will-change`属性：
```scss
.animated-element {
  will-change: transform, opacity;
}
```

3. 在移动设备上简化动画

### Q: TypeScript类型错误？

**A: 解决方法：**

1. 确保`tsconfig.json`配置了路径别名
2. 重启TypeScript服务
3. 检查组件的Prop类型定义

### Q: 如何自定义组件样式？

**A: 使用CSS变量或覆盖：**

```vue
<style scoped>
/* 使用CSS变量 */
.ui-button {
  --button-bg: your-color;
  background-color: var(--button-bg);
}

/* 或使用深度选择器 */
:deep(.ui-button) {
  /* 自定义样式 */
}
</style>
```

## 性能建议

### 1. 使用异步组件

```typescript
const UiButton = defineAsyncComponent(
  () => import('@UI/components/UiButton.vue')
);
```

### 2. 缓存组件实例

```typescript
import { shallowRef } from 'vue';

const UiButton = shallowRef(UiButtonComponent);
```

### 3. 虚拟滚动（大量数据）

对于大量数据列表，考虑使用虚拟滚动库配合UI组件。

## 迁移现有代码

### 从旧代码迁移到UI技能系统

1. **识别常用模式**
2. **替换为对应组件**
3. **使用设计Tokens替换硬编码样式**
4. **添加动画效果**

示例迁移：

```vue
<!-- 迁移前 -->
<div class="card" onclick="handleClick()">
  <h3>标题</h3>
  <p>内容</p>
</div>

<!-- 迁移后 -->
<UiCard clickable hoverable @click="handleClick">
  <h3>标题</h3>
  <p>内容</p>
</UiCard>
```

## 支持与帮助

- 查看 [组件文档](./components.md) 了解详细用法
- 查看 [动画指南](./animations.md) 学习动画技巧
- 查看 [最佳实践](./best-practices.md) 提升代码质量
- 查看 [完整文档](../README.md) 获取概览

---

祝你在使用UI技能系统时拥有愉快的开发体验！🎉
