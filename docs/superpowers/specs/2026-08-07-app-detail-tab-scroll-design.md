# APP 套餐详情页移动端 tab 滚动兼容设计

## 目标

修复 `APP` 发现页套餐详情在部分手机浏览器或 WebView 中，手指从 tab 栏附近开始上下滑动时滚动失效的问题。保留现有套餐详情结构、tab 切换行为、粘性 tab 和底部下单栏。

## 现场结论

在酒馆现场的 `382px` 手机宽度 iframe 中，当前 `特色玩法` 和 `私密写真` 内容可以改变 `#detail-content.scrollTop`，三个 tab 的选中状态也不会因竖向滑动而误切换。`顾客评价` 当前数据高度不足一屏，因此没有可滚动距离。

源码没有发现主动拦截触摸事件的逻辑。现有滚动区依赖 `overflow-y: auto`，tab 栏和 tab 按钮没有明确声明纵向触摸手势，也没有移动端惯性滚动声明；在不同手机浏览器/WebView 的手势判定下，粘性 tab 与内层滚动容器存在兼容风险。

## 范围

- 调整 `src/APP/ItemDetail.vue` 的详情滚动区、tab 栏和 tab 按钮触摸策略。
- 增加源码级回归测试，锁定移动端滚动兼容声明和现有 tab 结构。
- 不改变 tab 数据、路由、套餐内容、下单流程或桌面端布局。
- 不修改 `app.vue` 的 iframe 尺寸和宿主滚动策略。

## 方案

在 `.app-content` 上明确允许纵向平移，并启用 iOS/WebView 惯性滚动：

```scss
touch-action: pan-y;
-webkit-overflow-scrolling: touch;
```

在 `.detail-tabs` 和 `.tab-link` 上同步声明 `touch-action: pan-y`，让从 tab 背景或按钮开始的竖向手势继续交给纵向滚动容器，同时保留按钮的点击/切换能力。现有 `overscroll-behavior: contain` 保持不变，避免详情页边界滚动串到酒馆宿主页面。

不移除 `position: sticky`：现场未证明粘性定位本身阻断滚动，移除会降低详情页长内容浏览时 tab 的可用性。也不拆分新的滚动容器，避免引入嵌套滚动和高度计算回归。

## 验证

- 源码回归测试确认三处移动触摸声明存在，tab 仍为三个按钮且使用现有点击切换。
- 执行 APP 相关 Node 测试。
- 执行 `pnpm build`，确认 TypeScript、Vue 和样式构建通过。
- 在酒馆现场的目标套餐详情页复测：从 tab 栏、三个 tab 按钮和正文区域分别向上/向下滑动，确认 `#detail-content.scrollTop` 变化且不会误切换 tab；确认底部“立即下单”仍可点击。
