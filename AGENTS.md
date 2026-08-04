<<<<<<< HEAD
# 酒馆助手前端界面与脚本开发 - AGENTS规范

> 本文档为AI编码助手提供完整的项目开发规范、技术路线和工具使用指南
 
---

## 📋 目录

1. [项目概述](#1-项目概述)
2. [项目结构与分类](#2-项目结构与分类)
3. [核心技术栈](#3-核心技术栈)
4. [接口使用规范](#4-接口使用规范)
5. [构建配置规范](#5-构建配置规范)
6. [酒馆变量系统](#6-酒馆变量系统)
7. [前端界面开发](#7-前端界面开发)
8. [脚本开发](#8-脚本开发)
9. [MVU变量框架](#9-mvu变量框架)
10. [Chrome DevTools MCP](#10-chrome-devtools-mcp)
11. [前端美化设计技能系统](#11-前端美化设计技能系统)
12. [最佳实践](#12-最佳实践)
13. [&#36827;&#38454;&#25216;&#24039;](#13-&#36827;&#38454;&#25216;&#24039;)

---

## 1. 项目概述

### 1.1 项目定位

本项目专门用于编写酒馆助手 ([Tavern Helper](https://n0vi028.github.io/JS-Slash-Runner-Doc/guide/关于酒馆助手/介绍.html)) 所支持的前端界面或脚本。它们在酒馆 (SillyTavern) 中以前台或后台的形式运行，可以在代码中直接使用酒馆助手所提供的接口。

### 1.2 应用场景

- **UI美化**: 为角色卡提供更好的UI显示，如将消息楼层中纯文本的状态栏美化为有动态效果、有交互的HTML状态栏
- **交互增强**: 实现非纯文本的游玩体验，如监听现实时间或酒馆事件来实现meta游戏、播放多媒体文件
- **体验优化**: 优化酒馆使用体验，如用jQuery为预设提示词条目新增复制按钮
- **外部连接**: 连接外部应用程序，如通过socket.io-client连接外部服务器
- **功能扩展**: 新增额外功能，如每20楼在后台调用一次LLM来生成对之前剧情的总结

### 1.3 技术特性

- **运行方式**: 所有代码在浏览器中运行，支持iframe沙盒隔离
- **开发语言**: TypeScript（严格类型检查）
- **前端框架**: Vue 3 + Composition API
- **状态管理**: Pinia + Zod（数据校验）
- **样式方案**: SCSS + Vue SFC scoped styles
- **构建工具**: Webpack 5（已配置完整loader和插件）

 
### 1.4 设计与性能规范

- **实现方式应尽量简洁**: 项目实现方式应保持结构简单、依赖精炼，避免堆叠不必要的动画与资源加载。
- **资源加载受限**: 考虑到大部分场景运行在性能较弱的手机浏览器，需要严格控制脚本体积、外部资源请求次数与内存占用，并合理拆分懒加载。
- **移动端优化优先**: 全部UI与交互必须针对移动浏览器进行自适应与优化，确保触控操作舒适、布局响应迅速且不产生横向滚动。

---

## 2. 项目结构与分类

### 2.1 目录结构

```
src/
├── APP/              # 前端界面项目
├── 界面示例/          # 界面项目模板
├── 脚本示例/          # 脚本项目模板
└── 模板/             # 项目模板文件夹

dist/                 # 构建输出目录（自动生成）
├── APP/
├── 界面示例/
└── 脚本示例/
```

### 2.2 项目类型判定

- **前端界面项目**: `src/xxx` 文件夹中既有 `index.ts` 也有 `index.html`
  - 特点: 前台显示，有独立UI界面
  - 示例: `src/APP`, `src/界面示例`

- **脚本项目**: `src/xxx` 文件夹中仅有 `index.ts`
  - 特点: 后台运行，无界面
  - 示例: `src/脚本示例`

---

## 3. 核心技术栈

### 3.1 依赖库

项目使用pnpm作为包管理器，预装以下第三方库：

**核心框架:**
- `vue` - Vue 3 框架
- `vue-router` - Vue路由
- `pinia` - 状态管理

**开发工具:**
- `typescript` - TypeScript支持
- `jquery` - DOM操作
- `lodash` - 工具库
- `zod` - 数据校验
- `toastr` - 消息提示

**视觉与动画:**
- `gsap` - 动画库
- `pixi.js` - 2D渲染
- `@pixi/react` - React集成

**其他:**
- `dedent` - 文本格式化
- `jquery-ui` - UI组件
- `yaml` - YAML解析

### 3.2 第三方库使用原则

- **优先使用第三方库**而不是原生API
- 使用`jquery`而不是原生DOM操作
- 使用`zod`进行数据校验和纠错
- 使用`gsap`制作动画效果
- 使用`vueuse`提供的组合式API

### 3.3 CDN使用与第三方库管理

项目提供免费的CDN服务支持，所有第三方库和GitHub文件都可以通过CDN访问。

**国内访问优化**：
- 使用 `https://testingcf.jsdelivr.net` 镜像确保国内网络环境可正常访问
- 不推荐使用 `https://cdn.jsdelivr.net`（国内可能无法访问）

**第三方库添加与管理**：
- 为项目添加第三方库时，**推荐使用** `pnpm add 第三方库名` 来安装
- 模板文件夹已配置webpack，会在打包时自动将第三方库转换为jsdelivr CDN链接
- 这可以避免在多个脚本或界面中重复打包相同的第三方库，减少总体积
- 转换后的CDN链接将使用 `https://testingcf.jsdelivr.net/npm/` 前缀

**手动CDN引用**：
如果您需要直接在脚本或界面中引用CDN资源，请使用以下格式：
```typescript
// ✅ 正确：使用国内可访问的镜像
importSomething from 'https://testingcf.jsdelivr.net/npm/package-name@version/+esm';

// ❌ 错误：可能无法在国内访问
importSomething from 'https://cdn.jsdelivr.net/npm/package-name@version/+esm';
```

---

## 4. 接口使用规范

### 4.1 @types目录限制 ⚠️ **重要**

- `@types`目录包含了所有酒馆和酒馆助手提供的依赖函数、接口和类型定义
- **禁止超出**`@types`文件夹中定义的函数和接口进行开发
- 不得自建接口或使用未在`@types`中定义的全局函数

### 4.2 @types目录结构

**function/目录 - 核心功能函数:**
- `variables.d.ts` - 变量操作：`getVariables`、`replaceVariables`、`klona`
- `chat_message.d.ts` - 消息处理：`getChatMessages`、`sendMessage`、`getCurrentMessageId`
- `slash.d.ts` - STScript命令：`triggerSlash`、`waitGlobalInitialized`
- `script.d.ts` - 脚本管理：`getScriptId`、`eventOn`、`getButtonEvent`
- `builtin.d.ts` - 内置工具：`toastr`、`$`、`jQuery`
- `generate.d.ts` - 内容生成：`generate`
- `character.d.ts` - 角色卡：`getCurrentCharacterId`、`getCharacterCard`
- `global.d.ts` - 全局API：`getIframeName`、`window`、`document`
- `audio.d.ts` - 音频播放：`playAudio`
- `lorebook.d.ts` - 世界书：`replaceWorldbook`
- `util.d.ts` - 工具函数：`klona`

**iframe/目录 - 框架和插件接口:**
- `exported.sillytavern.d.ts` - 酒馆原生API
- `exported.tavernhelper.d.ts` - 酒馆助手API
- `exported.mvu.d.ts` - MVU变量框架：`Mvu.getMvuData`、`Mvu.parseMessage`
- `exported.ejstemplate.d.ts` - EJS模板引擎
- `event.d.ts` - 事件系统：`tavern_events`
- `script.d.ts` - 脚本框架：`waitForInit`
- `util.d.ts` - iframe工具
- `variables.d.ts` - iframe变量操作

### 4.3 接口使用示例

```typescript
// 变量操作
getVariables({type: 'script', script_id: getScriptId()})

// 消息处理
getChatMessages(getCurrentMessageId())

// 事件监听
eventOn(getButtonEvent('按钮名'), callback)

// MVU框架（需先初始化）
await waitGlobalInitialized('Mvu')
Mvu.getMvuData({type: 'message', message_id: 'latest'})
```

---

## 5. 构建配置规范

### 5.1 webpack.config.ts 修改规则（更新）

- 原先“禁止修改”是项目内部的个人约束，优先级低于酒馆助手官方文档。为兼容官方内置第三方库或修复构建/运行问题，可在必要时调整 `webpack.config.ts`。
- 改动时应遵循“最小化、可回溯”原则，并在相邻注释中标明目的。

### 5.2 已配置的Loader和插件

- **Vue Loader** - 用于Vue SFC编译
- **TypeScript Loader** - 用于.ts/.tsx文件编译
- **SCSS Loader** - 用于.scss文件编译和提取
- **MiniCssExtractPlugin** - 用于CSS提取
- **HtmlWebpackPlugin** - 用于HTML打包
- **VueUse自动导入** - 自动导入组件和指令
- **代码混淆和压缩优化** - 混淆代码，提升性能

### 5.4 内置第三方库（遵循酒馆助手官方文档）

- 运行时已内置的全局库：Vue 3 (`window.Vue`)、Vue Router 4 (`window.VueRouter`)、jQuery 3 (`window.$/jQuery`)、Lodash (`window._`)、toastr (`window.toastr`)、Pixi.js (`window.PIXI`)、YAML (`window.YAML`)、zod (`window.z`)、Font Awesome 图标字体等。
- 优先使用上述全局，不要重复从 CDN 注入同一库，避免版本漂移与双份体积。
- 若需要 external，映射到对应全局变量；除非必须锁定特定版本或离线打包，否则不要指向外链 CDN。
- `index.html` 保持纯静态 `<body>`，依赖由构建/注入完成，不手写 `<script>`/`<link>`.

### 5.3 特殊导入方式

```typescript
// 1. 导入文件内容（原始字符串）
import html_content from './html.html?raw';
import json_content from './json.json?raw';

// 2. 导入HTML（最小化）
import html from './file.html';

// 3. 导入Markdown（解析为HTML）
import markdown from './file.md';

// 4. 导入Vue组件
import Component from './Component.vue';

// 5. 导入样式（自动插入<head>）
import './index.scss';
```

---

## 6. 酒馆变量系统

### 6.1 变量类型

酒馆变量用于持久化存储前端界面、脚本的数据，可通过酒馆助手的`getVariables`、`replaceVariables`等接口读写。

- **全局变量**: 在酒馆中全局一致，无论是否打开角色卡、哪张角色卡，都共享同样的全局变量
- **角色卡变量**: 绑定在角色卡上的变量
- **脚本变量**: 绑定在某个脚本上的变量
- **聊天变量**: 绑定在某角色卡的某个聊天文件上的变量
- **消息楼层变量**: 绑定在某角色卡、某聊天的某个楼层上

### 6.2 使用示例

```typescript
// 读取变量
const variables = getVariables({type: 'global'});

// 写入变量
replaceVariables({key: 'value'}, {type: 'global'});

// 使用Zod进行数据校验
const Settings = z.object({
  button_selected: z.boolean().default(false)
});
const settings = Settings.parse(getVariables({type: 'script', script_id: getScriptId()}));
```

---

## 7. 前端界面开发

### 7.1 项目判定

如果`src/xxx`文件夹中既有`index.ts`文件也有`index.html`文件，则它是前端界面项目。

前端界面以无沙盒iframe的形式在酒馆消息楼层中前台显示，有一个自己的界面。

### 7.2 index.html规范

前端界面的`index.html`仅可填写静态`<body>`内容，不得引用项目中其他文件：

```html
<head>
  <!-- 保留空白，webpack打包时会插入样式、脚本等 -->
</head>
<body>
  <!-- 这里写<div>、<span>等静态内容 -->
  <!-- 也可以只写<div id="app"></div>交给vue渲染 -->
</body>
```

**禁止事项:**
- ❌ 禁止使用`<link>`导入样式
- ❌ 禁止使用`<script>`引用本地脚本
- ❌ 禁止使用`<img src="">`占位

### 7.3 样式规范

**简单样式:**
- 可在index.html中直接使用TailwindCSS
- 需要新建`@import 'tailwindcss'`的CSS文件并导入

**复杂样式:**
- 优先使用Vue组件的`<style lang="scss">`标签
- 或在TypeScript中`import './index.scss'`

### 7.4 iframe适配要求

- ❌ 禁止使用`vh`等受宿主高度影响的单位
- ✅ 使用`width`和`aspect-ratio`让高度动态调整
- ❌ 避免使用`min-height`、`overflow: auto`等强制撑高父容器的元素
- ✅ 页面整体应适配容器宽度，不产生横向滚动条
- ✅ 优先卡片形状，无背景颜色（除非明确要求）

### 7.5 正确加载/卸载

```typescript
// ✅ 正确：使用jQuery初始化
$(() => {
  toastr.success('界面加载成功！');
  createApp(app).use(router).mount('#app');
});

// ✅ 正确：使用jQuery和pagehide事件卸载
$(window).on('pagehide', () => {
  toastr.info('界面已卸载');
});

// ❌ 错误：使用DOMContentLoaded
document.addEventListener("DOMContentLoaded", fn);

// ❌ 错误：在全局作用域执行代码
toastr.success('这会在每次导入时执行');
```

### 7.6 Vue开发规范

```typescript
// 优先使用Vue编写界面
// Vue Router必须使用createMemoryHistory()
const router = createRouter({
  history: createMemoryHistory(),
  routes: [...]
});

// 监听Vue响应式数据变化并同步到酒馆数据
watchEffect(() => {
  replaceVariables(klona(settings.value), {type: 'script', script_id: getScriptId()});
});

// 状态管理使用Pinia
const useSettingsStore = defineStore('settings', () => {
  const settings = ref(Settings.parse(getVariables({type: 'script', script_id: getScriptId()})));
  return {settings};
});
```

---

## 8. 脚本开发

### 8.1 项目判定

如果`src/xxx`文件夹中仅有`index.ts`文件，则它是脚本项目。

脚本以无沙盒iframe的形式在酒馆后台运行，没有自己的界面，只有代码部分可供编写。

### 8.2 jQuery使用

脚本中的jQuery直接作用于整个酒馆页面而非仅作用于脚本所在的iframe：

```typescript
// ✅ 选择酒馆页面的body
$('body')

// ❌ 选择脚本iframe的body
$(document.body)
```

### 8.3 Vue组件挂载

当需要在脚本中向酒馆页面挂载Vue组件时：

```typescript
// 使用jQuery创建挂载位置
const $app = $('<div id="app"></div>');
$('body').append($app);

// 挂载Vue组件
app.mount($app[0]);
```

### 8.4 样式处理

由于脚本运行在iframe中，样式仅会应用于iframe内。向酒馆网页添加DOM时，需要将样式复制到酒馆网页的`<head>`中：

```typescript
export function teleport_style() {
  $(`<div>`)
    .attr('script_id', getScriptId())
    .append($(`head > style`, document).clone())
    .appendTo('head');
}

export function deteleport_style() {
  $(`head > div[script_id="${getScriptId()}"]`).remove();
}
```

### 8.5 脚本设置

使用脚本变量和Zod为用户提供自定义设置：

```typescript
const Settings = z.object({
  button_enabled: z.boolean().default(false),
  theme: z.enum(['light', 'dark']).default('light')
});

const settings = ref(Settings.parse(getVariables({type: 'script', script_id: getScriptId()})));
```

### 8.6 按钮功能

脚本可以注册按钮事件：

```typescript
eventOn(getButtonEvent('按钮名'), () => {
  console.log('按钮被点击了');
});
```

---

## 9. MVU变量框架

### 9.1 概述

MVU变量框架是一个独立的酒馆助手脚本，作用于消息楼层变量。它允许：
- 在世界书中设置消息楼层变量
- 在世界书或聊天记录中初始化消息楼层变量
- 用AI输出更新消息楼层变量

### 9.2 接口文件

MVU的接口定义在`@types/iframe/exported.mvu.d.ts`中。当提及"MVU变量"时，优先使用MVU变量框架的接口。

### 9.3 使用流程

```typescript
// 1. 等待初始化
await waitGlobalInitialized('Mvu');

// 2. 读取MVU数据
const data = Mvu.getMvuData({type: 'message', message_id: 'latest'});

// 3. 自行解析MVU命令
const result = Mvu.parseMessage(oldVars, messageString);

// 4. 写回数据
Mvu.replaceMvuData(newData, {type: 'message', message_id: 5});
```

### 9.4 数据存储

- MVU将变量数据存储在`_.get(某楼层变量, 'stat_data')`中
- 等价操作：`_.get(getVariables({type: 'message', message_id: 5}), 'stat_data')` = `Mvu.getMvuData({type: 'message', message_id: 5})`
- 额外字段：`display_data`（可视化表示）和`delta_data`（变量变化）

### 9.5 事件系统

MVU提供事件监听功能，用于监听变量变化：

```typescript
// 监听变量变化事件
Mvu.on('variableChanged', (data) => {
  // 处理变量变化
});
```

---

## 10. Chrome DevTools MCP

### 10.1 概述

Chrome DevTools MCP通过Model Context Protocol (MCP)为AI助手提供完整的Chrome DevTools功能访问权限，提供**6大类共26个工具功能**。

### 10.2 工具分类

#### 10.2.1 Input automation (8个工具) - 输入自动化

- `click` - 点击指定元素
- `drag` - 拖拽元素到目标位置
- `fill` - 在输入框输入文本或选择下拉选项
- `fill_form` - 批量填充多个表单元素
- `handle_dialog` - 处理浏览器弹出的对话框
- `hover` - 悬停在指定元素上
- `press_key` - 按键或组合键操作
- `upload_file` - 通过元素上传文件

#### 10.2.2 Navigation automation (6个工具) - 导航自动化

- `close_page` - 关闭指定索引的页面
- `list_pages` - 获取所有打开的页面列表
- `navigate_page` - 导航到URL或历史操作
- `new_page` - 创建新页面
- `select_page` - 选择页面作为上下文
- `wait_for` - 等待指定文本在页面上出现

#### 10.2.3 Emulation (2个工具) - 模拟

- `emulate` - 模拟CPU和网络条件
- `resize_page` - 调整页面窗口大小

#### 10.2.4 Performance (3个工具) - 性能分析

- `performance_analyze_insight` - 分析性能跟踪中的特定洞察
- `performance_start_trace` - 开始性能跟踪记录
- `performance_stop_trace` - 停止性能跟踪记录

#### 10.2.5 Network (2个工具) - 网络请求

- `get_network_request` - 获取指定的网络请求
- `list_network_requests` - 列出所有网络请求

#### 10.2.6 Debugging (5个工具) - 调试

- `evaluate_script` - 在当前页面执行JavaScript函数
- `get_console_message` - 根据ID获取控制台消息
- `list_console_messages` - 列出所有控制台消息
- `take_screenshot` - 截取页面或元素截图
- `take_snapshot` - 获取页面的文本快照（基于无障碍树）

### 10.3 典型工作流程

```typescript
// 1. 获取页面快照（获取元素uid）
take_snapshot({ verbose: true });

// 2. 导航到指定URL
navigate_page({ type: 'url', url: 'https://example.com' });

// 3. 等待页面加载
wait_for({ text: '欢迎', timeout: 5000 });

// 4. 填充表单
fill_form({
  elements: [
    { uid: 'element-1', value: '用户名' },
    { uid: 'element-2', value: '密码' }
  ]
});

// 5. 点击提交按钮
click({ uid: 'submit-button' });

// 6. 截取结果截图
take_screenshot({ format: 'png', fullPage: true });
```

### 10.4 性能分析工作流程

```typescript
// 1. 开始性能跟踪
performance_start_trace({ autoStop: true, reload: true });

// 等待跟踪完成...

// 2. 分析性能洞察
performance_analyze_insight({
  insightSetId: 'insight-set-1',
  insightName: 'LCPBreakdown'
});

// 3. 停止跟踪
performance_stop_trace();
```

---

## 11. 前端美化设计技能系统

### 11.1 概述

前端美化设计技能系统（UI Skills System）是专为酒馆助手项目打造的前端界面组件库和开发工具集。它提供了一整套完整的UI组件、动画效果、设计系统和开发模板，帮助开发者快速构建美观、一致的用户界面。

### 11.2 核心特性

- **🎨 完整组件库**: 13+ 高质量Vue 3组件，涵盖常用UI模式
- **🎬 动画工具**: 基于GSAP的流畅动画效果库
- **📐 设计系统**: 统一的设计Tokens和样式工具
- **📦 页面模板**: 开箱即用的完整页面模板
- **⚡ TypeScript**: 完整类型定义，优秀的开发体验
- **📱 响应式**: 移动端优先的响应式设计
- **🎯 酒馆专用**: 针对酒馆助手场景优化

### 11.3 目录结构

```
UI/
├── components/          # UI组件库
│   ├── index.ts        # 组件导出入口
│   ├── UiCard.vue      # 基础卡片
│   ├── UiButton.vue    # 按钮组件
│   ├── UiSearchBar.vue # 搜索栏
│   ├── UiGrid.vue      # 网格布局
│   ├── UiHeader.vue    # 页面头部
│   ├── UiBadge.vue     # 徽章/标签
│   ├── UiStarRating.vue# 星级评分
│   ├── UiTab.vue       # 标签页
│   ├── UiInfoCard.vue  # 信息卡片
│   ├── UiPackageCard.vue # 套餐卡片
│   ├── UiStatusPanel.vue # 状态面板
│   ├── UiProfileHeader.vue # 个人资料头
│   └── UiListSection.vue # 列表区块
│
├── animations/         # 动画工具库
│   └── index.ts        # 动画函数集合
│
├── styles/             # 样式系统
│   ├── tokens.scss     # 设计Tokens
│   └── mixins.scss     # 样式Mixins
│
├── templates/          # 页面模板
│   ├── HomePage.vue
│   ├── ServiceStatusPage.vue
│   └── README.md
│
├── examples/           # 使用示例
│   ├── BasicUsage.vue
│   └── AdvancedUsage.vue
│
├── docs/              # 文档
│   ├── components.md
│   ├── animations.md
│   ├── best-practices.md
│   └── integration.md
│
└── index.ts           # 主入口文件
```

### 11.4 组件库说明

#### 11.4.1 基础组件

**UiCard - 基础卡片容器**
- 支持悬停效果 (`hoverable`)
- 支持点击反馈 (`clickable`)
- 支持选中状态 (`selected`)

**UiButton - 按钮组件**
- 4种样式变体：filled、outline、ghost、link
- 3种尺寸：sm、md、lg
- 支持加载状态和图标

**UiSearchBar - 搜索栏**
- 内置搜索图标
- 支持回车搜索和按钮搜索
- 可自定义按钮文本

**UiGrid - 网格布局**
- 自定义列数（1-4列）
- 响应式适配（自动调整）
- 3种间距规格

#### 11.4.2 复合组件

**UiHeader - 页面头部**
- 图标、标题、副标题
- 右侧操作区插槽
- 统一的页面头部样式

**UiBadge - 徽章/标签**
- 9种颜色变体（primary、success、warning、danger、info、hot、new、recommend、vip）
- 3种尺寸
- 支持点和图标模式

**UiStarRating - 星级评分**
- 可交互评分
- 自定义最大星数
- 悬停效果和文本显示

**UiTab - 标签页**
- 平滑切换动画
- 响应式水平滚动
- 标签切换事件

#### 11.4.3 业务组件

**UiInfoCard - 信息卡片**
- 图标+标签+数值布局
- 5种图标颜色
- 插槽支持自定义内容

**UiPackageCard - 套餐卡片**
- 头像区域
- 名称和描述
- 标签列表展示

**UiStatusPanel - 状态面板**
- 卡片容器
- 自定义头部
- 适合状态展示页面

**UiProfileHeader - 个人资料头**
- 头像、名称、副标题
- 背景渐变效果
- 徽章插槽

**UiListSection - 列表区块**
- 标题和操作区
- 内容区域插槽
- 列表组织单元

### 11.5 动画工具库

#### 11.5.1 页面动画 (pageAnimations)

```typescript
// 淡入动画
pageAnimations.fadeIn('.element', 0.6);

// 滑入动画（4个方向）
pageAnimations.slideIn('.element', 'up', 0.5);

// 弹跳进入
pageAnimations.bounceIn('.element', 0.8);

// 缩放出现
pageAnimations.scaleIn('.element', 0.4);

// 旋转进入
pageAnimations.rotateIn('.element', 0.6);
```

#### 11.5.2 交互动画 (interactionAnimations)

```typescript
// 悬停放大
interactionAnimations.hoverScale('.element', 1.05);

// 按钮点击反馈
interactionAnimations.buttonClick('.button');

// 卡片悬停效果
interactionAnimations.cardHover('.card');

// 加载动画
interactionAnimations.loadingSpinner('.spinner');
```

#### 11.5.3 列表动画 (listAnimations)

```typescript
// 列表项依次进入
listAnimations.staggerIn('.item', 0.1);

// 瀑布流加载
listAnimations.waterfall('.grid-item', 0.05);
```

#### 11.5.4 进度动画 (progressAnimations)

```typescript
// 数字递增
progressAnimations.counter('.counter', 100, 2);

// 进度条填充
progressAnimations.progressFill('.progress', 80, 1.5);
```

### 11.6 设计系统

#### 11.6.1 设计Tokens

```scss
// 颜色系统
color(primary)      // #4f46e5
color(success)      // #10b981
color(warning)      // #f59e0b

// 文本颜色
text-color(primary)      // 主文本
text-color(secondary)    // 次要文本
text-color(disabled)     // 禁用文本

// 间距系统
spacing(4)   // 16px
spacing(6)   // 24px
spacing(8)   // 32px

// 字体系统
font(base)   // 16px
font(lg)     // 18px
font(xl)     // 20px

font(bold)   // 700
font(medium) // 500
```

#### 11.6.2 样式Mixins

```scss
// Flexbox居中
@include flex-center();

// 卡片样式
@include card-base();

// 按钮样式
@include button-filled();

// 悬停阴影
@include hover-shadow();

// 响应式断点
@include up(md) { /* 大屏幕样式 */ }
@include down(sm) { /* 小屏幕样式 */ }
```

### 11.7 使用示例

#### 11.7.1 基础用法

```vue
<template>
  <UiCard hoverable clickable @click="handleClick">
    <h3>卡片标题</h3>
    <p>卡片内容</p>
  </UiCard>

  <UiButton variant="outline" icon="heart">
    按钮
  </UiButton>

  <UiSearchBar
    v-model="keyword"
    placeholder="输入关键词..."
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
import { UiCard, UiButton, UiSearchBar } from '@UI/components';

const keyword = ref('');

const handleClick = () => {
  console.log('卡片被点击');
};

const handleSearch = (value: string) => {
  console.log('搜索:', value);
};
</script>
```

#### 11.7.2 复杂布局

```vue
<template>
  <UiHeader title="用户管理" icon="users">
    <template #actions>
      <UiButton variant="filled" size="sm">添加用户</UiButton>
    </template>
  </UiHeader>

  <UiListSection title="用户列表">
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
          :subtitle="user.email"
          :avatar="user.avatar"
        >
          <template #badges>
            <UiBadge v-if="user.admin" variant="vip">管理员</UiBadge>
          </template>
        </UiProfileHeader>
      </UiCard>
    </UiGrid>
  </UiListSection>
</template>

<script setup lang="ts">
import {
  UiHeader,
  UiListSection,
  UiGrid,
  UiCard,
  UiProfileHeader,
  UiBadge,
  UiButton,
} from '@UI/components';
</script>
```

#### 11.7.3 动画应用

```vue
<script setup lang="ts">
import { pageAnimations, listAnimations } from '@UI/animations';
import { onMounted, nextTick } from 'vue';

onMounted(async () => {
  await nextTick();

  // 页面加载动画
  pageAnimations.fadeIn('.page-content', 0.6);

  // 列表动画
  listAnimations.staggerIn('.list-item', 0.1);
});
</script>
```

### 11.8 页面模板

#### 11.8.1 首页模板 (HomePage.vue)

完整的首页布局，包含：
- 页面头部
- 分类网格
- 搜索栏
- 特色玩法区域
- 推荐列表

#### 11.8.2 服务状态页面 (ServiceStatusPage.vue)

完整的服务状态展示页面，包含：
- 基础信息卡片网格
- 标签页切换
- 状态详情面板
- 星级评分
- 进度条展示
- 操作按钮

### 11.9 最佳实践

1. **组件选择**: 根据需求选择合适的组件
2. **样式管理**: 使用设计Tokens和Mixins
3. **响应式**: 移动端优先的设计思路
4. **动画优化**: 合理控制动画时长和数量
5. **可访问性**: 提供键盘导航和ARIA标签

### 11.10 集成指南

1. **文件复制**: 将`UI/`目录复制到项目根目录
2. **配置别名**: 在`tsconfig.json`中配置`@UI`路径别名
3. **导入使用**: 在组件中导入需要的组件
4. **导入样式**: 在样式文件中导入设计Tokens
5. **使用动画**: 在适当的位置调用动画函数

详细集成步骤请参考：`UI/docs/integration.md`

### 11.11 文档资源

- **README** (`UI/README.md`) - 概览和快速开始
- **组件文档** (`UI/docs/components.md`) - 详细的组件API
- **动画指南** (`UI/docs/animations.md`) - 动画使用说明
- **最佳实践** (`UI/docs/best-practices.md`) - 开发规范和技巧
- **集成指南** (`UI/docs/integration.md`) - 完整集成步骤

---

## 12. 最佳实践

### 11.1 代码规范

**优先使用TypeScript而非JavaScript**
- ✅ 使用TypeScript提供更好的类型检查
- ✅ 利用接口定义和类型推断
- ❌ 避免使用any类型

**优先使用酒馆助手提供的接口**
- ✅ 使用`getChatMessages()`而非`SillyTavern.chat`
- ✅ 使用`replaceWorldbook()`而非`triggerSlash('/setentryfield')`
- ✅ 酒馆助手接口抽象层次更高，更符合TypeScript类型系统

### 11.2 数据管理

**使用Pinia + Zod管理状态**

```typescript
// 用Zod定义类型和默认值
const Settings = z.object({
  button_selected: z.boolean().default(false)
}).preparse({});

// 使用Pinia实现响应式读写
export const useSettingsStore = defineStore('settings', () => {
  const settings = ref(Settings.parse(getVariables({type: 'script', script_id: getScriptId()})));

  watchEffect(() => {
    replaceVariables(klona(settings.value), {type: 'script', script_id: getScriptId()});
  });

=======
# 酒馆助手前端界面或脚本编写

本项目主要用于编写酒馆助手 ([Tavern Helper](https://n0vi028.github.io/JS-Slash-Runner-Doc/guide/关于酒馆助手/介绍.html)) 所支持的前端界面或脚本. 它们在酒馆 (SillyTavern) 中以前台或后台的形式运行, 可以在代码中直接使用酒馆助手所提供的接口, 进而:

- 为角色卡提供更好的 UI 显示, 如将消息楼层中原本只是代码块纯文本的状态栏美化为有动态效果、有交互的 html 状态栏
- 实现非纯文本的游玩体验, 如监听现实时间或酒馆事件来实现 meta 游戏、播放多媒体文件、自制游玩界面并与酒馆交互
- 优化酒馆使用体验, 如用 jQuery 为预设提示词条目新增复制按钮, 监听酒馆接收到消息事件并判断是否需要重新生成本楼层消息
- 连接外部应用程序, 如通过 socket.io-client 连接外部服务器, 进而实现外部应用程序与酒馆的通信
- 新增额外功能, 如每 20 楼在后台调用一次 LLM 来生成对之前剧情的总结
- ...

## 访问酒馆网页

在编写时, 你应该用 chrome-devtools 连接我已经打开的浏览器, 从中读取或操纵连接到的酒馆网页 (其网址与 `.vscode/launch.json` 中配置的 `url` 一致), 来了解当前的界面、脚本情况, 如获取当前的 DOM 情况、实际显示情况、Console 情况、点击界面……

连接到网页后, 你需要检查 `$('#extensions_settings')` 中的`酒馆助手-实时监听-允许监听`开关是否处于启用状态. 一旦启用, 则界面、脚本代码到酒馆网页的实时同步已经建立好了: 在代码变更后, 酒馆网页上将热重载新的脚本或界面代码, 因此你不需要刷新酒馆网页, 也不需要自己运行 `pnpm build` 来更新代码打包结果, 直接查看网页即可.

## 项目结构

### 核心机制: 前端界面或脚本

每个前端界面或脚本, 都以 `src` 文件夹或 `示例` 文件夹中的一个独立文件夹形式存在. 具体是前端界面还是脚本, 由文件夹中的内容直接决定:

- 如果文件夹中既有 `index.ts` 文件也有 `index.html` 文件, 则是前端界面项目. 例如, `示例/界面示例` 是一个前端界面项目.
- 如果文件夹中仅有 `index.ts` 文件, 则是脚本项目. 例如, `示例/脚本示例`、`示例/流式楼层界面示例` 是一个脚本项目.

你可以在 `初始模板/*/新建为src文件夹中的文件夹` 中找到前端界面和脚本项目的初始模板.

### 流式楼层界面

由于酒馆框架限制, 前端界面只能在它所基于的文本格式输出完毕后才能渲染, 也就是说前端界面的渲染不支持流式文本 (AI 逐渐输出文本供用户阅读).

为了让前端界面支持流式, 本编写模板的[进阶技巧](https://stagedog.github.io/青空莉/工具经验/实时编写前端界面或脚本/进阶技巧/)中提出了两种方法, 简单地说: (具体需要查看进阶技巧文章)

- 不再使用酒馆的输入框, 让玩家始终在一个渲染好的前端界面里游玩, 而在前端界面内使用酒馆助手提供的 `generate` 或 `generateRaw` 请求 AI 生成新的回复.
- 继续使用酒馆的输入框, 但利用脚本可以使用 jquery 操纵酒馆网页的特性, 替换掉酒馆原本不支持流式前端界面渲染的楼层显示.

流式楼层界面即使用了第二种方法. 在 `util/streaming.ts` 中, 项目提供了 `mountStreamingMessage` 函数来挂载流式楼层界面. 此外, 在 `示例/流式楼层界面示例` 中, 你可以找到一个流式楼层界面的示例.

**流式楼层界面不过是调用了 `mountStreamingMessage` 的脚本, 因此所有脚本的编写规则依旧适用.**

### MVU 角色卡

如果我要求你制作一张基于 MVU 的角色卡, 你应该参考本项目提供在 `示例/角色卡示例` 中的额外支持:

- `示例/角色卡示例/脚本/*/` 中是角色卡的所有脚本
- `示例/角色卡示例/界面/*/` 中是角色卡的所有前端界面
- `示例/角色卡示例/schema.ts` 中是用 zod 4 库书写的角色卡 MVU 变量结构定义
  - 提供给脚本、前端界面导入使用
  - 会在 `pnpm build` 或 `pnpm watch` 时生成对应的 json schema 文件 `示例/角色卡示例/schema.json`, 便于编写变量初始值文件 initvar.yaml `# yaml-language-server: $schema=schema文件路径`
- `util/mvu.ts` 中提供了 `defineMvuDataStore` 函数, 它基于 pinia 实现了本项目推荐的前端界面获取、修改 MVU 变量方式, 支持与酒馆实际变量之间的双向同步; `示例/角色卡示例/界面/store.ts` 中的 `useDataStore` 就是用它获取和修改界面所在楼层变量的.

你同样可以在 `初始模板/角色卡/新建为src文件夹中的文件夹` 中找到 MVU zod 角色卡的初始模板.

## 项目参考文件

### 可用的第三方库

项目使用 pnpm 作为包管理器, 在 `package.json` 的 `dependencies` 部分定义了可用的第三方库 (dedent、gsap、jquery、jquery-ui、lodash、pinia、pixi.js、toastr、yaml、vue、vue-router、@vueuse/core、react、@pixi/react、async-wait-until、zod), 你也可以自己通过 `pnpm add` 添加更多第三方库, 如添加 (@vueuse/integrations 等).

前端界面或脚本都是在浏览器中使用, 因此你不能使用 nodejs 库

### 与酒馆交互的方式

前端界面或脚本主要使用酒馆助手所提供的接口与酒馆进行交互. 这些接口定义在 `@types` 文件夹中, 如 `@types/function/worldbook.d.ts` 中描述了该如何操控世界书, `@types/function/variables.d.ts` 中描述了该如何操控酒馆变量.

此外, `@types` 文件夹也为酒馆本身、其他插件、MVU 变量框架所提供的接口变量、函数进行了类型定义, 如 `@types/iframe/exported.mvu.d.ts` 中描述了 MVU 变量框架所提供的接口 `Mvu`.

除了代码接口外, 酒馆自制了 STScript 命令. 要将这些命令转换为 Typescript 代码, 你需要使用 `@types/function/slash.d.ts` 内所定义的 `triggerSlash` 函数来调用它们. 具体的命令列表见于 `slash_command.txt` 文件.

以上接口在代码中均可直接使用, 不需要导入或新定义它们, 也不需要检查是否可用.

#### 酒馆助手接口

`@types` 文件夹中定义了酒馆助手所提供的所有接口, [酒馆助手官方文档](https://n0vi028.github.io/JS-Slash-Runner-Doc/)中也对这些接口进行了类似的说明:

其中, `@types/function` 中的接口将会导出到酒馆网页的 `window.TavernHelper`; 而 `@types/iframe` 依赖于 iframe 环境, 只在酒馆助手前端界面或脚本内可用. 由于本项目主要是制作酒馆助手前端界面或脚本, `@types/function` 和 `@types/iframe` 内的接口均可直接调用, 你无须在意 `@types/function` 和 `@types/iframe` 的区别.

- `@types/function/audio.d.ts`: 音频播放器
- `@types/function/builtin.d.ts`: 对 `@types/iframe/exported.sillytavern.d.ts` 的增补, 一些酒馆原生具有但没有导出的接口
- `@types/function/chat_message.d.ts`: 操作目前酒馆玩家与 AI 的聊天楼层记录, 如获取某些楼层的消息、修改楼层消息内容、新建楼层、删除楼层、移动楼层等
- `@types/function/displayed_message.d.ts`: 操作目前酒馆网页对楼层的显示, 如获取某一楼层的 JQuery 实例、将文本格式化为如果放在楼层中会如何显示的 html 文本等
- `@types/iframe/event.d.ts`: 监听、发送酒馆事件, 如监听消息接收完毕、监听世界书发生更新等
- `@types/iframe/exported.ejstemplate.d.ts`: 与提示词模板这一酒馆插件进行交互, 主要是调整提示词模板的设置. 除非我明确要求你做, 不要考虑
- `@types/iframe/exported.mvu.d.ts`: 与 MVU 变量框架进行交互
- `@types/iframe/exported.sillytavern.d.ts`: 酒馆原生导出的接口, 但抽象层次很低, 因此你应该优先使用 `@types` 中列出的其他酒馆助手接口而不是这个文件里的
- `@types/function/extension.d.ts`: 操作酒馆第三方扩展的安装、卸载、更新等
- `@types/function/generate.d.ts`: 请求酒馆 AI 生成回复. `generate` 是携带酒馆预设作为提示词的请求 AI 生成, 而 `generateRaw` 是不携带酒馆预设 (但依旧会发送酒馆世界书条目等内容) 直接请求 AI 生成
- `@types/function/global.d.ts`: 支持不同前端界面、脚本间的接口共享
- `@types/function/import_raw.d.ts`: 导入酒馆原生数据, 包括角色卡、聊天记录、世界书、预设等. 导入所用的数据格式应与玩家通过酒馆页面按钮导出的数据格式一致
- `@types/function/inject.d.ts`: 为酒馆 AI 请求注入额外提示词
- `@types/function/macro_like.d.ts`: 注册酒馆助手宏. 注册后, 酒馆 AI 提示词、酒馆楼层显示中出现这个宏时, 将会被替换为宏所定义的内容
- `@types/function/preset.d.ts`: 操作酒馆预设, 可以切换使用别的预设, 也可以调整预设中的酒馆 AI 请求参数 (温度、流式传输等) 和提示词等
- `@types/function/raw_character.d.ts`: 获取角色卡的一些信息
- `@types/function/script.d.ts`: 获取或修改当前酒馆助手脚本的某些信息
- `@types/iframe/script.d.ts`: 获取或修改当前酒馆助手脚本的某些信息
- `@types/function/slash.d.ts`: 运行酒馆的 DSL 命令 (称为 "/STScript"), 可运行的命令在 `slash_command.txt` 中有列出, 但这些命令很难与代码结合使用,因此你应该优先使用 `@types` 中列出的其他酒馆助手接口而不是 "/STScript" 命令
- `@types/function/tavern_regex.d.ts`: 操作酒馆正则. 酒馆在发送 AI 请求或显示楼层时, 会按酒馆正则将聊天记录中的内容替换成其他内容. 除非明确要求, 你只应该在有些时候使用这个文件里的 `formatAsTavernRegexedString` 函数
- `@types/function/util.d.ts`: 一些工具函数, 如获取当前酒馆聊天的最新楼层号, 替换文本里的酒馆宏等
- `@types/iframe/util.d.ts`: 一些工具函数, 如在前端界面里获取前端界面所在楼层号等
- `@types/function/variables.d.ts`: 操作酒馆变量, 可以获取或修改变量值
- `@types/iframe/varriables.d.ts`: 操作酒馆变量
- `@types/function/version.d.ts`: 获取酒馆和酒馆助手的版本号
- `@types/function/worldbook.d.ts`: 操作世界书, 可以删除创建世界书, 可以调整世界书启用情况, 也可以调整其中的条目等

### 工具函数

在 `util` 中定义了一些工具函数:

- `util/script.ts`: 脚本可能使用的函数
- `util/common.ts`: 前端界面或脚本可能使用的函数
- `util/mvu.ts`: MVU 角色卡可能使用的函数

## 酒馆变量

酒馆变量可用于持久化地存储前端界面、脚本的数据, 可通过酒馆助手的 `getVariables`、`replaceVariables` 等接口读写.

- 全局变量 (`{type: 'global'}`): 在酒馆中全局一致, 无论是否打开角色卡、哪张角色卡, 都共享同样的全局变量.
- 角色卡变量 (`{type: 'character'}`): 绑定在角色卡上的变量.
- 脚本变量 (`{type: 'script', script_id: string}`): 绑定在某个脚本上的变量.
- 聊天变量 (`{type: 'chat'}`): 绑定在某角色卡的某个聊天文件上的变量. 当在酒馆中选择某张角色卡与 LLM 进行对话时, 都需要创建一个聊天文件.
- 消息楼层变量 (`{type: 'message', message_id: 'latest'|number}`): 绑定在某角色卡、某聊天的某个楼层上. 当在酒馆中用某个聊天文件与 LLM 进行对话时, 可能会逐渐有很多用户输入和 AI 输出, 每个用户输入和 AI 输出都是单独的消息楼层.

## 特殊导入方式

### 导入文件内容

项目支持用 `import string from './文件?raw'` 来将文件内容作为字符串导入.

如果导入的文件是 typescript、scss, 则导入的将会是经过 webpack 打包后的纯 javascript、css 而不是原始内容, 因此能在 jquery 中直接使用.

```typescript
// 直接导入文件内容
import html_content from './html.html?raw';
import json_content from './json.json?raw';

// 经过 webpack 打包后导入
import javascript_content from './script.ts?raw';
import css_content from './style.scss?raw';
```

### 导入 html

除了以 `?raw` 直接导入 HTML 文件内容外, 项目还支持用 `import html from './文件.html'` 来通过 html-loader 将 html 文件内容最小化后作为字符串导入.

### 导入 markdown

项目还支持用 `import markdown from './文件.md'` 来通过 remark-loader 将 markdown 文件内容解析为 html 后作为字符串导入.

### 导入 vue

项目直接支持用 `import Component from './文件.vue'` 来导入 vue 组件, 如果要设计界面你应该优先使用 vue 组件 (含 pinia 和 vue-router).

### 为前端界面导入样式

前端界面支持在 typescript 中 `import './index.scss'` 来导入全局 scss 文件, 并自动将它们打包到最终的 `dist/**/index.html` 中的 `<head>` 部分.

## 最佳实践

通用于前端界面和脚本:

### 使用 typescript 而非 javascript

typescript 更容易写对, 你应该使用 typescript 而非 javascript

### 尽量使用项目参考文件中的功能

项目参考文件中的功能往往更为简单正确, 因此你应该尽量使用它们. 例如:

- 尽量使用第三方库, 例如:
  - 使用 jquery 而不是 javascript 内置的 DOM 操作
  - 使用 jqueryui 实现拖动效果 (vue 中则使用 vueuse 等第三方库)
  - 使用 zod 处理数据校验和纠错而不是 if else, 并用 `z.prettifyError()` 来格式化错误信息
  - 使用 gsap 制作打字机等所有动画效果
  - ...
- 尽量使用酒馆助手给出的接口, 例如:
  - 使用 `getIframeName()` 而不是 `(this.frameElement as Element).id`
  - ...

### 优先使用酒馆助手提供的接口

**酒馆助手所提供的接口抽象层次更高, 你应该优先使用 `@types` 文件夹中其他文件定义的酒馆助手接口**, 而不是 `@types/iframe/exported.sillytavern.d.ts` 中定义的酒馆内置接口或 STScript 命令.

- 使用 `@types/function/chat_message.d.ts` 中定义的 `getChatMessages()`、`setChatMessages()` 等来获取、修改消息楼层
- 使用 `@types/function/worldbook.d.ts` 中定义的 `getWorldbook()`、`replaceWorldbook()` 等来获取、修改世界书条目
- 使用 `@types/function/variables.d.ts` 中定义的 `getVariables()`、`replaceVariables()` 等来获取、修改酒馆变量
- ……

### 优先使用 vue 编写界面

vue 相比于 jquery 或 DOM 操作更为简单, 因此你应该尽量使用 vue (可使用 pinia、vue-router 或自己添加其他第三方库) 来编写前端界面, 但要注意 vue-router 的 `createRouter()` 不能写在 `$(() => {})` 中, 必须在全局执行.

当需要监听 vue 的响应式数据变化并存入酒馆数据时 (如酒馆变量、世界书……), 你应该先用 `klona()` 来去除 proxy 层, 以在脚本中编写 vue 并提供用户设置为例:

```typescript
const Settings = z.object({/*...*/}); // 用 zod 定义设置的类型和默认值
const settings = ref(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));
watchEffect(() => replaceVariables(klona(settings.value), { type: 'script', script_id: getScriptId() }));
```

前端界面和脚本都是 iframe, 因此你在使用 vue-router 时, 应该使用 `history: createMemoryHistory()` 来创建路由, 否则将无法正常路由.

### 优先使用 pinia、zod 管理数据状态

当需要从酒馆读取配置/数据时, 你应该用 pinia 实现响应式读写:

```typescript
const Settings = z.object({ button_selected: z.boolean().default(false) }).prefault({});
export const useSettingsStore = defineStore('settings', () => {
  const settings = ref(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));
  watchEffect(() => {
    replaceVariables(klona(settings.value), { type: 'script', script_id: getScriptId() });
  });
>>>>>>> ffcef6e22b372e2f3dcc1048bf50073234505d74
  return { settings };
});
```

<<<<<<< HEAD
**去除Proxy层**

```typescript
// 当需要监听Vue响应式数据变化并存入酒馆数据时
watchEffect(() => {
  replaceVariables(klona(settings.value), {type: 'script', script_id: getScriptId()});
});
```

### 11.3 界面开发

**优先使用Vue编写界面**
- ✅ Vue比jQuery或DOM操作更简单
- ✅ 可使用Pinia、VueRouter和其他第三方库
- ❌ Vue Router的createRouter()不能写在`$(() => {})`中，必须在全局执行

**Vue Router配置**

```typescript
// ✅ 正确：使用createMemoryHistory()
const router = createRouter({
  history: createMemoryHistory(),
  routes: [...]
});
```

**多媒体资源处理**

```typescript
// 当有很多多媒体资源时，使用@pixi/react在.tsx中编写界面
// 使用pixi.js实现资源预先加载
```

### 11.4 重载机制

```typescript
// 完全重载前端界面或脚本
let chat_id = SillyTavern.getCurrentChatId();
eventOn(tavern_events.CHAT_CHANGED, new_chat_id => {
  if (chat_id !== new_chat_id) {
    chat_id = new_chat_id;
    window.location.reload(); // ✅ 使用window.location.reload()
  }
});
```

### 11.5 @pixi/react使用场景

```typescript
// 当有很多多媒体资源时，前端界面更像是一个完整的游戏
// 应该使用@pixi/react在.tsx中编写界面
// 并使用pixi.js实现资源预先加载等逻辑
```

### 11.6 加载/卸载时机

```typescript
// ✅ 正确：使用jQuery在加载时执行
$(() => {
  // 在这里初始化界面
});

// ✅ 正确：使用jQuery和pagehide事件在卸载时执行
$(window).on('pagehide', () => {
  // 在这里清理资源
});

// ❌ 错误：使用DOMContentLoaded
document.addEventListener("DOMContentLoaded", fn);

// ❌ 错误：在全局作用域执行代码
```

---

## 📚 参考资料

### 官方文档

- [酒馆助手介绍](https://n0vi028.github.io/JS-Slash-Runner-Doc/guide/关于酒馆助手/介绍.html)
- [MVU变量框架](https://github.com/MagicalAstrogy/MagVarUpdate)
- [Chrome DevTools官方文档](https://developer.chrome.com/docs/devtools/)
- [Puppeteer文档](https://puppeteer.github.io/puppeteer/)
- [MCP协议规范](https://modelcontextprotocol.io/)

### 项目文件

- `/src/APP/` - 实际项目示例
- `/src/界面示例/` - 前端界面模板
- `/src/脚本示例/` - 脚本项目模板
- `/模板/**/新建为src文件夹中的文件夹` - 项目模板
- `/@types/` - 酒馆助手和酒馆API类型定义
- `/slash_command.txt` - STScript命令列表

### 关键配置文件

- `/webpack.config.ts` - **不允许修改**
- `/package.json` - 依赖管理
- `/pnpm-lock.yaml` - 锁定版本

---

## ⚠️ 重要注意事项

1. **禁止修改webpack.config.ts** - 构建配置文件已优化，修改可能导致构建失败
2. **禁止超出@types接口** - 所有开发必须使用@types中定义的接口
3. **正确使用加载/卸载时机** - 使用jQuery而非DOMContentLoaded
4. **Vue Router必须使用MemoryHistory** - 前端界面和脚本都是iframe
5. **样式隔离处理** - 脚本向酒馆添加DOM时需特殊处理样式
6. **安全警告** - Chrome调试端口打开时避免浏览敏感网站

---

## 13. &#36827;&#38454;&#25216;&#24039;

- &#36164;&#28304;&#19982;CDN&#65306;&#39318;&#36873; `https://testingcf.jsdelivr.net` &#35775;&#38382; npm/GitHub &#36164;&#28304;&#65307;&#26032;&#22686;&#20381;&#36182;&#20248;&#20808;&#29992; `pnpm add` &#35753;&#27169;&#26495;&#33258;&#21160;&#36716; CDN&#12290;&#20813;&#36153;&#23383;&#20307;&#21487;&#29992; ZeoSeven Fonts&#65292;&#22270;&#26631;&#29992; FontAwesome&#12290;&#27880;&#24847;&#39068;&#33394;&#23545;&#27604;&#24230;&#65292;&#25512;&#33616; Adobe &#39068;&#33394;&#23545;&#27604;&#24230;&#26816;&#26597;&#22120;&#12290;
- &#35268;&#21017;&#19982;&#27491;&#21017;&#65306;&#21069;&#31471;&#30028;&#38754;&#27491;&#21017;&#20165;&#36127;&#36131;&#23450;&#20301;&#25554;&#20837;&#20301;&#32622;&#65292;&#19981;&#35299;&#26512;&#25968;&#25454;&#65307;&#25968;&#25454;&#35299;&#26512;&#22312;&#20195;&#30721;&#20391;&#29992; `getChatMessages` &#31561;&#23436;&#25104;&#12290;&#21487;&#22312; `.cursor/rules` &#20013;&#36861;&#21152;&#33258;&#23450;&#20041;&#21161;&#25163;&#35268;&#21017;&#25193;&#23637;&#25552;&#31034;&#12290;
- &#24615;&#33021;&#19982;&#21152;&#36733;&#65306;&#20026;&#20943;&#36731;&#37202;&#39302;&#28210;&#26579;&#21345;&#39039;&#65292;&#21487;&#25226;&#22823;&#22359; HTML &#25442;&#25104;&#22806;&#38142;&#21152;&#36733;&#65307;&#33509;&#38656;&#21457;&#24067;&#21487;&#33258;&#21160;&#26356;&#26032;&#30340;&#30028;&#38754;/&#33050;&#26412;&#65292;&#20351;&#29992; GitHub + jsdelivr &#38236;&#20687;&#22495;&#21517;&#12290;&#21363;&#20415;&#27169;&#26495;&#25552;&#21040;&#21024;&#38500; `LimitChunkCountPlugin` &#20197;&#20998;&#22359;&#65292;&#26412;&#20179;&#24211;&#20173;&#20445;&#25345;&#8220;&#19981;&#25913; webpack.config.ts&#8221;&#12290;
- &#35774;&#35745;&#19982;&#21407;&#22411;&#65306;&#40723;&#21169;&#20808;&#29992; Figma &#20570;&#21407;&#22411;&#65288;&#21487;&#37197;&#21512; Figma MCP&#65289;&#65292;&#20877;&#25353;&#35774;&#35745;&#36824;&#21407;&#65307;&#20445;&#25345;&#31227;&#21160;&#31471;&#21451;&#22909;&#19982;&#39640;&#23545;&#27604;&#24230;&#21487;&#35835;&#24615;&#12290;
- &#22806;&#37096;&#36890;&#20449;&#65306;&#21487;&#29992; `socket.io-client` &#31561;&#27983;&#35272;&#22120;&#24211;&#19982;&#22806;&#37096;&#24212;&#29992;&#36890;&#20449;&#65292;&#22823;&#20307;&#37327;&#25968;&#25454;&#27880;&#24847;&#26381;&#21153;&#22120; `maxHttpBufferSize`&#12290;
- &#37202;&#39302;&#33021;&#21147;&#36895;&#26597;&#65306;@types &#21015;&#20986;&#20840;&#37096;&#21487;&#29992;&#25509;&#21475;&#65292;&#20808;&#26597;&#25991;&#26723;/&#31867;&#22411;&#20877;&#32534;&#30721;&#65292;&#36991;&#20813;&#37325;&#22797;&#36896;&#36718;&#23376;&#12290;
- jQuery &#25805;&#20316;&#23487;&#20027;&#65306;&#33050;&#26412;&#21487;&#30452;&#25509;&#25913;&#37202;&#39302;&#39029;&#38754;&#20803;&#32032;&#65292;&#20063;&#21487;&#29992; `tavern_events.CHAT_COMPLETION_PROMPT_READY` &#31561;&#20107;&#20214;&#21407;&#22320;&#25913;&#25552;&#31034;&#35789;&#65307;&#25968;&#32452;&#38656;&#21407;&#22320;&#20462;&#25913;&#65288;&#22914; `splice`&#65289;&#65292;&#19981;&#35201;&#25972;&#20307;&#26367;&#25442;&#12290;
- &#27969;&#24335;&#19982;&#21516;&#23618;&#30028;&#38754;&#65306;&#31616;&#21333;&#26041;&#26696;&#22312;&#21069;&#31471;&#30028;&#38754;&#20869;&#29992; `generate` + `iframe_events.STREAM_TOKEN_RECEIVED_*` &#20570;&#27969;&#24335;&#65307;&#36827;&#38454;&#21487;&#38544;&#34255;&#21407;&#27004;&#23618;&#65292;&#33258;&#24314;&#28210;&#26579;&#24182;&#30417;&#21548; `MESSAGE_SEND/STREAM_TOKEN_RECEIVED/MESSAGE_RECEIVED`&#12290;
- &#25991;&#20214;&#19982;&#26500;&#24314;&#36873;&#39033;&#65306;&#21487;&#29992; `import './file?raw'` &#30452;&#25509;&#25343;&#26412;&#22320;&#25991;&#26412;&#65307;`// @obfuscate` &#35302;&#21457;&#28151;&#28102;&#65292;`// @no-ci` &#21487;&#35753;&#27169;&#26495; CI &#36339;&#36807;&#25171;&#21253;&#65288;&#37196;&#24773;&#20351;&#29992;&#65292;&#26412;&#20179;&#24211;&#20173;&#25353;&#38656;&#25191;&#34892;&#65289;&#12290;

---

**文档版本**: v1.0
**最后更新**: 2025-11-15
**维护者**: 酒馆助手开发团队

---

> 💡 **提示**: 本文档为AI助手专用开发规范，遵循此规范可以确保与酒馆助手的完美兼容性和最佳性能表现。
=======
### 优先使用 tailwindcss 和 `<style scoped>` 进行样式设计

你可以直接在项目中使用 tailwindcss, 而无需导入任何 css 文件.

在设计样式时, 你应该优先使用 tailwindcss 直接在 vue 组件的 `<template>` 内书写, 对于无法这样做的情况则使用 `<style scoped>` 标签.

### 尝试使用 @pixi/react 编写界面

当有很多多媒体资源时, 我们的前端界面更像是一个完整的游戏, 因此你应该使用 @pixi/react 在 .tsx 中编写界面, 并使用 pixi.js 来实现资源预先加载等逻辑.

### 正确在加载、卸载前端界面或脚本时执行功能

你应该总是在加载时才执行代码, 而不该直接在全局作用域中执行代码.

项目最终打包生成的 `dist/**/index.html` 或 `dist/**/index.js` 可能先上传到网上, 再以 `$('body').load(网络链接)` 或 `import '网络链接'` 的方式加载到酒馆中. `document.addEventListener("DOMContentLoaded", fn)` 在这个加载过程中不会被触发, 因此禁止使用 `DOMContentLoaded` 作为加载时的执行时机.

你应该使用 jquery 来在加载时执行功能:

```typescript
$(() => {
  toastr.success('加载成功');
});
```

同样地, 使用 jquery 及 `'pagehide'` 事件 (而不是 `'unload'`) 来在卸载时执行功能:

```typescript
$(window).on('pagehide', () => {
  toastr.success('卸载成功');
});
```

### 使用 console、throw 和 errorCatched 合理记录日志和错误

你应该在代码的关键节点使用 `console.info` 简洁地记录日志, 并尽量保持日志与最新代码逻辑的一致性.

对于可恢复的错误, 使用 `console.warn`、`console.error` 记录日志;

对于让前端界面、脚本无法继续使用的错误, 你应该使用 `throw Error`, 而用 errorCatched 转换顶部函数从而对其进行记录, 例如:

```typescript
function init() { /*... */}

$(() => {
  errorCatched(init)();
})
```

### 重载前端界面或脚本

如果有完全重载前端界面或脚本的需求, 你应该使用 `window.location.reload()`. 如聊天文件变更时重新载入前端界面或脚本, 你可以用 `util/script.ts` 中定义好了的工具函数:

```ts
export function reloadOnChatChange(): EventOnReturn {
  let chat_id = SillyTavern.getCurrentChatId();
  return eventOn(tavern_events.CHAT_CHANGED, new_chat_id => {
    if (chat_id !== new_chat_id) {
      chat_id = new_chat_id;
      window.location.reload();
    }
  });
}
```
>>>>>>> ffcef6e22b372e2f3dcc1048bf50073234505d74
