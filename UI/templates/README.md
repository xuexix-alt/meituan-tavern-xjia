# UI模板库

此目录包含了基于UI组件库构建的完整页面模板，可以直接复制使用或作为开发参考。

## 可用模板

### 1. HomePage.vue - 首页模板
完整的首页布局，包含：
- 页面头部（UiHeader）
- 分类网格（UiGrid + UiCard）
- 搜索栏（UiSearchBar）
- 特色玩法区域
- 推荐列表（UiPackageCard）

**使用场景**: 应用主页、商品分类页面

### 2. ServiceStatusPage.vue - 服务状态页面
完整的服务状态展示页面，包含：
- 基础信息卡片网格（UiGrid + UiInfoCard）
- 标签页切换（UiTab）
- 状态详情面板（UiStatusPanel）
- 星级评分（UiStarRating）
- 进度条展示
- 操作按钮（UiButton）

**使用场景**: 用户状态页面、服务详情页面、个人中心

## 如何使用

### 方式1: 直接复制
```bash
# 复制模板文件到你的项目
cp UI/templates/HomePage.vue src/your-project/
```

### 方式2: 参考实现
查看模板代码作为开发参考，学习如何组合使用UI组件。

### 方式3: 自定义修改
复制模板后，根据实际需求修改样式和逻辑。

## 模板特点

1. **响应式设计**: 自动适配移动端和桌面端
2. **TypeScript支持**: 完整的类型定义
3. **组合式API**: 使用Vue 3 Composition API
4. **样式隔离**: SCSS scoped styles
5. **可复用组件**: 基于UI组件库构建
6. **动画支持**: 预留GSAP动画集成点

## 自定义模板

如需创建自定义模板，请遵循以下规范：

1. 使用 `<script setup lang="ts">`
2. 导入所需的UI组件
3. 使用 `ref()` 和 `computed()` 管理响应式数据
4. 在 `<style lang="scss" scoped>` 中编写样式
5. 遵循项目的命名规范

```vue
<template>
  <div class="custom-page">
    <UiHeader title="页面标题" icon="icon-name" />
    <div class="custom-page__content">
      <!-- 页面内容 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiHeader } from '@/UI/components';

const pageData = ref('页面数据');
</script>

<style lang="scss" scoped>
.custom-page {
  &__content {
    padding: spacing(6);
  }
}
</style>
```

## 最佳实践

1. **保持一致性**: 遵循模板的结构和命名规范
2. **响应式优先**: 考虑移动端显示效果
3. **可访问性**: 添加适当的ARIA标签
4. **性能优化**: 使用 `v-memo` 缓存复杂渲染
5. **动画控制**: 合理使用转场动画
