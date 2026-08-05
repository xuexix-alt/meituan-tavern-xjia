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
14. [提示词模板系统](#14-提示词模板系统)

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

**模板与文本处理:**

- `ejs` - 模板引擎
- `markdown-it` - Markdown解析
- `pako` - 数据压缩

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

### 9.1 概述与版本选择

MVU变量框架是一个独立的酒馆助手脚本，作用于消息楼层变量。它允许在世界书中设置、初始化和用AI更新消息楼层变量。

项目目前支持两个版本的 MVU 框架，它们可以共存，请根据需求选择：

- **MVU 经典版** (9.2 - 9.5)：适用于简单的变量管理，直接通过 JS 接口或简单的规则文本操作。
- **MVU Zod 进阶版** (9.6)：适用于复杂的数据结构和严格的类型安全要求，基于 Zod Schema 和 JSON Patch。

### 9.2 经典版：核心接口

MVU的接口定义在`@types/iframe/exported.mvu.d.ts`中。当提及"MVU变量"时，优先使用MVU变量框架的接口。

### 9.3 经典版：使用流程

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

### 9.4 经典版：数据存储

- MVU将变量数据存储在`_.get(某楼层变量, 'stat_data')`中
- 等价操作：`_.get(getVariables({type: 'message', message_id: 5}), 'stat_data')` = `Mvu.getMvuData({type: 'message', message_id: 5})`
- 额外字段：`display_data`（可视化表示）和`delta_data`（变量变化）

### 9.5 经典版：事件系统

MVU提供事件监听功能，用于监听变量变化：

```typescript
// 监听变量变化事件
Mvu.on('variableChanged', (data) => {
  // 处理变量变化
});
```

### 9.6 MVU Zod 进阶版

#### 9.6.1 概述

MVU Zod 是 MVU 的进阶版本，引入了 **Zod Schema** 和 **JSON Patch (RFC 6902)** 标准。它解决了经典版中存在的类型安全、数值边界控制和复杂嵌套结构操作困难的问题。

**核心优势**：

- **类型安全**：所有变量更新都经过 Zod Schema 验证，防止类型错误（如将数字存为字符串）。
- **边界控制**：通过 `z.transform` 强制限制数值范围，防止数值溢出。
- **标准化操作**：使用 JSON Patch 标准（`replace`, `add`, `remove`），明确操作语义。
- **幂等性**：支持增量更新，确保重复解析不会导致数据错误累积。

#### 9.6.2 模块化工作流

MVU Zod 采用模块化的配置方式，推荐使用 Cursor 的 `mvu_zod_workflow` 规则辅助生成：

1. **模块1.0：变量结构 (Script)** - 使用 Zod 定义变量结构 (`变量结构.js`)。
2. **模块1.1：变量初始化 (YAML)** - 基于 Schema 生成初始值 (`[initvar]变量初始化.yaml`)。
3. **模块2：更新规则 (YAML)** - 定义变量的更新逻辑 (`[mvu_update]变量更新规则.yaml`)。
4. **模块3：输出格式 (YAML)** - 定义 AI 输出 JSON Patch 的 Prompt (`[mvu_update]变量输出格式.yaml`)。

#### 9.6.3 接口使用

进阶版主要通过注册 Schema 来工作：

```javascript
import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
import { z } from 'zod'; // 全局可用，无需 install

export const Schema = z.object({
  好感度: z.coerce.number().transform(v => _.clamp(v, 0, 100)),
  物品栏: z.record(z.string(), z.object({ 数量: z.coerce.number() }))
});

$(() => {
  registerMvuSchema(Schema);
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

  return { settings };
});
```

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

## 13. 进阶技巧

- **资源与CDN**: 首选 `https://testingcf.jsdelivr.net` 访问 npm/GitHub 资源；新增依赖优先用 `pnpm add` 让模板自动转 CDN。免翻字体可用 ZeoSeven Fonts，图标用 FontAwesome。注意颜色对比度，推崇 Adobe 颜色对比度检查器。
- **规则与正则**: 前端界面正则仅负责定位插入位置，不解析数据；数据解析在代码侧用 `getChatMessages` 等完成。可在 `.cursor/rules` 中追加自定义助手规则扩展提示。
- **性能与加载**: 为减轻配置页渲染卡顿，可把大块 HTML 换成外链加载；若需发布可自动更新的界面/脚本，使用 GitHub + jsdelivr 镜像域名。即便模板提到删除 `LimitChunkCountPlugin` 以分块，本仓库仍保持“不改 webpack.config.ts”。
- **设计与原型**: 鼓励先用 Figma 做原型（可配合 Figma MCP），再按设计还原；保持移动端友好与高对比度可读性。
- **外部通信**: 可用 `socket.io-client` 等连接器库与外部应用通信，大数据量注意服务器 `maxHttpBufferSize`。
- **配置能力速查**: @types 列出全部可用接口，先查文档/类型再编码，避免重复造轮子。
- **jQuery 操作宿主**: 脚本可直接改配置页面元素，也可用 `tavern_events.CHAT_COMPLETION_PROMPT_READY` 等事件原地改提示词；数组需原地修改（如 `splice`），不要整体替换。
- **流式与同层界面**: 简单方案在前端界面内用 `generate` + `iframe_events.STREAM_TOKEN_RECEIVED_*` 做流式；进阶可隐藏原楼层，自建渲染并监听 `MESSAGE_SEND/STREAM_TOKEN_RECEIVED/MESSAGE_RECEIVED`。
- **文件与构建选项**: 可用 `import './file?raw'` 直接拿本地文本；`// @obfuscate` 触发混淆，`// @no-ci` 可让模板 CI 跳过打包（详情使用，本仓库仍按需执行）。

---

**文档版本**: v1.0
**最后更新**: 2025-11-15
**维护者**: 酒馆助手开发团队

---

> 💡 **提示**: 本文档为AI助手专用开发规范，遵循此规范可以确保与酒馆助手的完美兼容性和最佳性能表现。

---

## 14. 提示词模板系统

### 14.1 核心概念与处理流程

扩展 SillyTavern 的宏语法，基于 [EJS](https://ejs.co/) 实现，支持在提示词、角色卡、世界书、预设和消息中使用 JavaScript 逻辑。

**处理流程**:

1. **生成前处理 (GENERATE)**: 处理 `<% ... %>` 块，替换为执行结果，发送给 LLM。
2. **生成后处理 (RENDER)**: LLM 输出后，再次处理内容中的 EJS 语法，用于动态修改显示内容或变量。

### 14.2 语法与注入规范

#### 14.2.1 基础语法

- `<% code %>`: 执行 JavaScript 代码，无输出。
- `<%= value %>`: 输出转义后的值 (HTML safe)。
- `<%- value %>`: 输出原始值 (Unescaped)。
- `<#escape-ejs> ... <#/escape-ejs>`: 范围转义，内部标签不被处理。

#### 14.2.2 世界书/条目注入标签

在世界书条目标题中使用以下前缀可控制注入位置：

- `[GENERATE:BEFORE]` / `[GENERATE:AFTER]`: 注入到发送给 LLM 的提示词开头/结尾。
- `[RENDER:BEFORE]` / `[RENDER:AFTER]`: 注入到渲染输出的开头/结尾（不发送给 LLM）。
- `[GENERATE:{idx}:BEFORE]`: 注入到第 `{idx}` 条消息前。
- `[InitialVariables]`: 初始化变量树 (JSON Object)。
- `[GENERATE:REGEX:pattern]`: 正则匹配消息内容时注入。

#### 14.2.3 Prompt 注入 (@INJECT)

使用 `@INJECT` 将消息以 `{role, content}` 格式插入 Prompt 数组，支持绝对位置、相对目标和正则匹配。

**语法**:

- `pos`: 绝对位置。`@INJECT pos=0,role=system` (开头)
- `target`: 相对目标。`@INJECT target=user,index=-1,at=after` (最后一条用户消息后)
- `regex`: 正则匹配。`@INJECT regex=关键词,role=system`

**重要**: 若需保证系统指令在最前，务必使用 `pos=0` 或最小 `order`。

### 14.3 装饰器系统 (Decorators)

在条目内容首行使用 `@@` 前缀控制条目行为：

- `@@activate`: 强制激活条目。
- `@@if condition`: 单行条件判断，为真时激活。
- `@@preprocessing`: 预处理条目，实现原生递归 🟢 关键字激活。
- `@@dont_activate`: 禁止激活。
- `@@generate_before` / `@@render_after` 等: 等同于标题注入标签。

### 14.4 核心 API 函数

#### 14.4.1 提示词注入与管理

- `injectPrompt(key, prompt)`: 注入提示词片段到指定键。
- `getPromptsInjected(key)`: 获取指定键注入的提示词（常用于预设中 `<%- getPromptsInjected("CoT") %>`）。

#### 14.4.2 世界书控制

- `await getwi(nameOrUid)`: 直接获取并返回指定世界书条目的内容（无视激活条件）。
- `await activewi(nameOrUid)`: 将条目加入酒馆待激活列表（遵循酒馆原生逻辑，如递归激活）。

#### 14.4.3 正则处理器

- `activateRegex(regex, replacement, options)`: 动态创建正则替换。
  - `options`: `{ generate: true, message: true, html: true }`
  - 支持传递函数作为 replacement。

### 14.5 开发目录结构

```
src/
├── templates/
│   ├── base_prompt.ejs     # 基础提示词模板
│   ├── character_card.md   # 角色卡模板
│   └── modules/            # 模块化片段
│       ├── formatting.ejs
│       └── world_info.ejs
```

### 14.6 最佳实践

1. **逻辑分离**: 复杂的 JS 逻辑应封装在 `src/utils` 或 `src/scripts` 中，模板中只进行简单的调用。
2. **System 优先**: 使用 `@INJECT pos=0` 确保核心指令（System Prompt）位于上下文最顶端，适配 Claude/Gemini 等模型。
3. **正则慎用**: 楼层渲染时的正则替换 (`html: true`) 会永久修改 DOM，需小心操作；修改 `message` 内容会永久改变聊天记录。
4. **变量管理**: 利用 `[InitialVariables]` 或 `@@initial_variables` 统一管理初始化状态。

### 14.7 内置函数与变量参考

#### 14.7.1 核心操作函数

```javascript
/**
 * 设置变量
 * @param {(string|null)} key - 变量名
 * @param {any} value - 变量值
 * @param {Object} [options={}] - 选项: { scope: 'global'|'local'|'message', flags: 'nx'|'xx' }
 */
function setvar(key, value, options = {});

/**
 * 读取变量
 * @param {(string|null)} key - 变量名
 * @returns {any} - 变量值
 */
function getvar(key, options = {});

/**
 * 增加/减少变量值
 */
function incvar(key, value = 1, options = {});
function decvar(key, value = 1, options = {});

/**
 * 执行 SillyTavern 命令
 */
async function execute(cmd);

/**
 * 读取世界书条目
 * @param {string} lorebook - 世界书名
 * @param {string} title - 条目名
 */
async function getwi(lorebook, title, data = {});

/**
 * 读取角色卡定义
 */
async function getchar(name, template, data = {});

/**
 * 输出内容
 */
function print(...args);

/**
 * 激活世界书条目
 */
async function activewi(lorebook, title, force = false);

/**
 * 获取聊天消息
 */
function getChatMessage(idx, role);
function getChatMessages(count);

/**
 * 正则处理
 */
function activateRegex(pattern, replace, opts = {});

/**
 * 提示词注入
 */
function injectPrompt(key, prompt, order, sticky, uid);
function getPromptsInjected(key);
```

#### 14.7.2 内置对象与库

- `variables`: 全局变量集合 (合并了消息、局部、全局变量)
- `SillyTavern`: 酒馆上下文对象
- `faker`: Faker.js 库 (生成随机数据)
- `_`: Lodash 库
- `$`: jQuery 库
- `toastr`: Toastr 消息提示库

#### 14.7.3 STScript 命令

- `/ejs [ctx={...}] code`: 执行 EJS 代码
- `/ejs-refresh`: 重新加载世界书

#### 14.7.4 导出函数 (Global Scope)

可通过 `globalThis.EjsTemplate` 访问：

- `evalTemplate(code, context)`: 执行模板
- `prepareContext(context)`: 创建执行上下文
- `getSyntaxErrorInfo(code)`: 检查语法错误
