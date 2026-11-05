# 美人团 APP 自适应布局实施计划

**Goal:** 电脑版填满可用宽度，手机及中间宽度正确重排，主入口和底部操作可达。

**Architecture:** 沿用 Vue 页面和共享壳层，以容器查询布局。独立 hostViewport.ts 仅观察宿主可视高度并清理监听，CSS 保留独立预览回退。

**Tech Stack:** Vue 3、SCSS、jQuery、ResizeObserver、node:test、webpack。

## 约束

执行已获用户授权；在本次会话直接完成，不提交或推送。保持现有生成与数据逻辑，不改宿主配置和其他构建文件。

## 步骤

- [x] 为宿主高度交集、短屏、键盘视口、不可见容器增加行为测试并确认失败。
- [x] 实现 hostViewport.ts；在 app.vue 挂载和销毁；宽度 100%，消除阅读页单独的宽高上限。
- [x] 调整 Home.vue 结构与样式：搜索前置、原公告内容保留在 details，容器查询 4/8 列及侧栏。
- [x] 调整 Discover.vue 卡片及 StoryEntry.vue 顶栏位置；为主页面和调试台返回栏预留按钮位置。
- [x] 更新已失效的旧高度/卡片宽度断言，运行 APP 测试和格式检查。
- [x] 用 pnpm build 产出 APP；在原酒馆刷新，验证多视口布局、公告展开及导航与阅读输入区，恢复浏览器尺寸。

验证命令：node --test src/APP/hostViewport.test.mjs；node --test（APP 下全部 .test.mjs/.test.js）；pnpm exec prettier --check（修改文件）；pnpm build；git diff --check。

## 实际验证

- APP 的 28 项可运行 JS/MJS 测试通过；新高度模块的独立 TypeScript 检查通过。
- 生产构建使用临时配置复用 webpack 原 APP 配置，仅选择 APP entry；其他 dist 改动未覆盖。临时配置已删除。构建成功，保留原有包体大小提示。
- 全量 vue-tsc 仍报既有 TypeFest、蓝牙类型、Discover 的 dedupeShops、旧 index.ts 等错误；本次新增高度代码和新壳层未报类型错误。
- 真实酒馆 Chrome 测试：320×640、390×844、768×1024、1280×720、1920×1080，首页均无横向溢出，搜索与导航可见。窄屏四列分类，中宽及宽屏八列，宽屏侧栏。
- 正文在 320×640、390×844、1280×720 的返回和输入操作区可见。320px 服务、历史、我的、发现页无横向溢出；公告原五条内容能展开并收起。
- 未发送生成、下单或行动请求。实际手机软键盘由 visualViewport 逻辑支持，尚未做真机验证。
- 独立只读代码审查未发现阻断问题。截图和测量记录位于本聊天 visualizations 下的 meituan-ui-audit/responsive-after。
