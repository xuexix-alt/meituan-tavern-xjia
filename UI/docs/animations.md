# 动画指南

本文档详细说明如何使用UI技能系统中的动画工具库。

## 概述

动画工具库基于GSAP构建，提供流畅、高性能的动画效果。所有动画都针对酒馆助手场景优化，支持iframe环境。

## 核心模块

### 1. 页面动画 (pageAnimations)

用于页面元素出现的动画效果。

#### fadeIn - 淡入动画

```typescript
pageAnimations.fadeIn(selector: string, duration?: number)
```

**参数说明:**
- `selector`: CSS选择器
- `duration`: 动画时长（秒），默认0.6

**使用示例:**
```typescript
import { pageAnimations } from '@/UI/animations';

// 页面加载时淡入显示
onMounted(() => {
  pageAnimations.fadeIn('.page-content', 0.6);
});
```

#### slideIn - 滑入动画

```typescript
pageAnimations.slideIn(selector: string, direction: 'left' | 'right' | 'up' | 'down', duration?: number)
```

**参数说明:**
- `direction`: 滑入方向
  - `left`: 从左滑入
  - `right`: 从右滑入
  - `up`: 从下滑入（默认）
  - `down`: 从上滑入

**使用示例:**
```typescript
// 卡片列表从下方滑入
pageAnimations.slideIn('.card-list', 'up', 0.5);
```

#### bounceIn - 弹跳进入

```typescript
pageAnimations.bounceIn(selector: string, duration?: number)
```

弹跳动画适合强调重要元素。

**使用示例:**
```typescript
// 重要提示弹跳出现
pageAnimations.bounceIn('.important-message', 0.8);
```

#### scaleIn - 缩放出现

```typescript
pageAnimations.scaleIn(selector: string, duration?: number)
```

从0缩放到1的大小，常用于模态框或弹窗。

**使用示例:**
```typescript
// 模态框缩放出现
pageAnimations.scaleIn('.modal-overlay', 0.4);
```

#### rotateIn - 旋转进入

```typescript
pageAnimations.rotateIn(selector: string, duration?: number)
```

带有旋转效果的进入动画。

**使用示例:**
```typescript
// 图标旋转进入
pageAnimations.rotateIn('.hero-icon', 0.6);
```

### 2. 交互动画 (interactionAnimations)

用于用户交互的反馈动画。

#### hoverScale - 悬停放大

```typescript
interactionAnimations.hoverScale(selector: string, scale?: number)
```

鼠标悬停时放大元素。

**参数说明:**
- `scale`: 放大倍数，默认1.05

**使用示例:**
```typescript
// 卡片悬停放大效果
interactionAnimations.hoverScale('.card', 1.08);
```

#### buttonClick - 按钮点击反馈

```typescript
interactionAnimations.buttonClick(selector: string)
```

按钮被点击时的缩放反馈。

**使用示例:**
```typescript
// 搜索按钮点击反馈
interactionAnimations.buttonClick('.search-button');
```

#### cardHover - 卡片悬停效果

```typescript
interactionAnimations.cardHover(selector: string)
```

卡片悬停时的综合效果（上移+阴影）。

**使用示例:**
```typescript
// 套餐卡片悬停效果
interactionAnimations.cardHover('.package-card');
```

**自定义悬停效果:**
```typescript
// 创建自定义悬停动画
const hoverAnimation = gsap.timeline({ paused: true });
hoverAnimation.to('.card', {
  y: -10,
  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  duration: 0.3
});
```

#### loadingSpinner - 加载动画

```typescript
interactionAnimations.loadingSpinner(selector: string)
```

创建无限旋转的加载指示器。

**使用示例:**
```typescript
// 加载图标旋转
interactionAnimations.loadingSpinner('.loading-icon');
```

### 3. 页面转场动画 (pageTransitions)

用于页面切换的过渡动画。

#### slideTransition - 滑动转场

```typescript
pageTransitions.slideTransition(containerSelector: string, direction?: 'left' | 'right')
```

**参数说明:**
- `direction`: 转场方向
  - `left`: 向左滑动（默认）
  - `right`: 向右滑动

**使用示例:**
```typescript
// 页面左滑进入
pageTransitions.slideTransition('.page-container', 'left');
```

#### fadeTransition - 淡入淡出转场

```typescript
pageTransitions.fadeTransition(selector: string)
```

平滑的淡入淡出过渡。

**使用示例:**
```typescript
// 内容淡入淡出切换
pageTransitions.fadeTransition('.page-content');
```

### 4. 列表动画 (listAnimations)

专门用于列表和网格的动画效果。

#### staggerIn - 列表项依次进入

```typescript
listAnimations.staggerIn(selector: string, stagger?: number)
```

列表项依次延迟出现，创造流畅的入场效果。

**参数说明:**
- `stagger`: 每项之间的延迟时间（秒），默认0.1

**使用示例:**
```typescript
// 用户列表依次出现
listAnimations.staggerIn('.user-item', 0.15);

// 商品网格依次出现
listAnimations.staggerIn('.product-card', 0.08);
```

#### waterfall - 瀑布流加载动画

```typescript
listAnimations.waterfall(selector: string, stagger?: number)
```

适合瀑布流布局的加载动画，带有弹性效果。

**使用示例:**
```typescript
// 瀑布流图片加载
listAnimations.waterfall('.masonry-item', 0.05);
```

### 5. 进度条动画 (progressAnimations)

用于数据可视化的进度动画。

#### counter - 数字递增

```typescript
progressAnimations.counter(selector: string, toValue: number, duration?: number)
```

数字从0递增到指定值，常用于计数器。

**参数说明:**
- `toValue`: 目标数值
- `duration`: 动画时长（秒），默认2

**使用示例:**
```typescript
// 点赞数递增动画
progressAnimations.counter('.like-count', 1250, 1.5);

// 金额递增动画
progressAnimations.counter('.amount-display', 9999, 2);
```

#### progressFill - 进度条填充

```typescript
progressAnimations.progressFill(selector: string, toPercentage: number, duration?: number)
```

进度条宽度填充动画。

**参数说明:**
- `toPercentage`: 目标百分比（0-100）
- `duration`: 动画时长（秒），默认1.5

**使用示例:**
```typescript
// 进度条填充到80%
progressAnimations.progressFill('.progress-bar-fill', 80, 1.2);

// 加载进度
progressAnimations.progressFill('.loading-progress', 100, 3);
```

## 高级用法

### 1. 组合动画

创建复杂的动画序列：

```typescript
import { gsap } from 'gsap';

const timeline = gsap.timeline();

// 页面加载动画序列
timeline
  .from('.header', { y: -50, opacity: 0, duration: 0.5 })
  .from('.content', { y: 30, opacity: 0, duration: 0.5 }, '-=0.3')
  .from('.footer', { y: 50, opacity: 0, duration: 0.5 }, '-=0.3');
```

### 2. 条件动画

根据条件应用不同动画：

```typescript
const animateCard = (index: number) => {
  if (index % 2 === 0) {
    pageAnimations.slideIn('.card', 'left', 0.5);
  } else {
    pageAnimations.slideIn('.card', 'right', 0.5);
  }
};
```

### 3. 滚动触发动画

使用Intersection Observer触发动画：

```typescript
import { pageAnimations } from '@/UI/animations';

const observeElements = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        pageAnimations.fadeIn('.animate-on-scroll', 0.6);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });
};

onMounted(() => {
  observeElements();
});
```

### 4. 性能优化

#### 使用will-change

```css
.card {
  will-change: transform, opacity;
}
```

#### 限制同时动画数量

```typescript
const animateQueue: (() => void)[] = [];
let isAnimating = false;

const queueAnimation = (fn: () => void) => {
  animateQueue.push(fn);
  processQueue();
};

const processQueue = () => {
  if (isAnimating || animateQueue.length === 0) return;
  isAnimating = true;
  const animation = animateQueue.shift()!;
  animation();
  setTimeout(() => {
    isAnimating = false;
    processQueue();
  }, 100);
};
```

### 5. 动画控制

#### 暂停/恢复动画

```typescript
const tl = gsap.timeline();
tl.to('.element', { x: 100 });

// 暂停
tl.pause();

// 恢复
tl.resume();

// 重置
tl.restart();
```

#### 动画事件回调

```typescript
pageAnimations.fadeIn('.element', 0.6).eventCallback('onComplete', () => {
  console.log('动画完成');
});
```

## 最佳实践

### 1. 动画时长建议

| 动画类型 | 推荐时长 |
|---------|---------|
| 微交互（点击、悬停） | 150-250ms |
| 元素出现/消失 | 300-500ms |
| 页面转场 | 400-600ms |
| 加载动画 | 800-1200ms |
| 数字计数 | 1500-3000ms |

### 2. 缓动函数选择

- `power2.out`: 适合减速运动（自然停止）
- `back.out`: 适合弹性效果（轻微回弹）
- `bounce.out`: 适合弹跳效果（强烈回弹）
- `elastic.out`: 适合橡皮筋效果（强烈弹性）

### 3. 性能考虑

- 避免同时动画过多元素（建议<10个）
- 合理使用`will-change`属性
- 对于移动设备，简化动画效果
- 使用`requestAnimationFrame`优化自定义动画

### 4. 可访问性

- 为动画提供`prefers-reduced-motion`支持
- 避免过度闪烁的动画
- 提供动画关闭选项

```scss
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 常见问题

### Q: 动画不流畅怎么办？

A: 检查以下几点：
1. 确保元素没有同时运行过多动画
2. 使用硬件加速（transform、opacity）
3. 避免在动画中触发布局重排
4. 检查是否使用了`！important`覆盖

### Q: 如何在Vue组件中使用？

A: 在`onMounted`或`nextTick`中调用动画：

```vue
<script setup lang="ts">
import { pageAnimations } from '@/UI/animations';
import { onMounted, nextTick } from 'vue';

onMounted(async () => {
  await nextTick();
  pageAnimations.fadeIn('.page-content', 0.6);
});
</script>
```

### Q: 如何实现自定义动画？

A: 使用GSAP的底层API：

```typescript
import { gsap } from 'gsap';

const customAnimation = () => {
  gsap.fromTo('.element',
    { rotation: 0, scale: 0 },
    {
      rotation: 360,
      scale: 1,
      duration: 1,
      ease: 'power2.inOut'
    }
  );
};
```

## 更多资源

- [GSAP官方文档](https://greensock.com/docs/)
- [UI组件文档](./components.md)
- [最佳实践指南](./best-practices.md)
