# 克制型新拟态 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将现有提示词调试工作台改造成保持可读性和交互反馈的克制型 Neumorphism / Soft UI。

**Architecture:** 复用现有 React 组件结构，仅调整全局设计变量、面板/控件/消息项/标签的 CSS 层级；不修改状态管理、API 请求和数据模型。通过现有 Vitest、Playwright E2E 与真实浏览器截图验证。

**Tech Stack:** React, TypeScript, Vite, CSS, Vitest, Playwright。

## Global Constraints

- 保留现有中文文案、ARIA 标签和业务交互。
- 不引入第三方 UI 依赖。
- API Key、提示词、导入导出和原始 JSON 行为不变。
- 页面必须在桌面和 390px 手机宽度下无水平溢出。

### Task 1: 更新视觉变量与基础控件

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: 替换页面色板与阴影变量**

将 `--paper`、`--surface`、`--surface-soft`、边框和状态色调整为浅灰绿色新拟态色板，新增 `--shadow-light`、`--shadow-dark`、`--shadow-raised` 和 `--shadow-inset`。

- [ ] **Step 2: 将工作区、按钮、输入控件改为凸起/内凹层级**

移除工作区的强边框依赖，使用双阴影；普通按钮使用 `box-shadow: var(--shadow-raised)`；按下和聚焦状态使用内凹阴影或现有焦点轮廓；输入框和文本域使用 `var(--shadow-inset)`。

- [ ] **Step 3: 更新消息项、生成参数、原始 JSON 和响应区的层级**

让 `.message-row`、`.generation-controls`、`.raw-panel`、`.response-panel` 与库列表行使用轻微浮起面；保留 `.raw-editor` 深色背景，仅调整圆角、边缘和内阴影。

- [ ] **Step 4: 保持响应式规则并检查窄屏按钮**

保持现有断点和移动端隐藏逻辑，确保顶部导入、导出、发送操作在 390px 宽度下不溢出，必要时仅调整间距与图标按钮尺寸。

- [ ] **Step 5: 运行验证**

运行 `pnpm test`、`pnpm build` 和 `pnpm test:e2e`；预期所有测试通过。

### Task 2: 浏览器视觉检查

**Files:**
- Create: `output/playwright/neumorphism-desktop.png`
- Create: `output/playwright/neumorphism-mobile.png`

- [ ] **Step 1: 启动或复用本地服务并打开页面**

使用 `http://127.0.0.1:4174`，确认页面返回 200 和 `/api/health` 返回 `{"status":"ok"}`。

- [ ] **Step 2: 捕获桌面和手机截图**

使用 Playwright 在桌面与 390px 手机视口截图，确认浮起面板、内凹输入框、焦点态和移动标签没有重叠或水平滚动。

- [ ] **Step 3: 记录残余风险**

若阴影在特定浏览器过淡或过强，只调整 CSS 变量，不改变组件行为。
