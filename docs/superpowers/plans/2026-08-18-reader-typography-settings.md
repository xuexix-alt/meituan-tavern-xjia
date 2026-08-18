# 正文阅读排版调节器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `src/APP` 的 `/story` 正文阅读器增加字号与行距调节器，默认排版收紧为 15px / 1.6，支持连续调节并持久化到 `localStorage`。

**Architecture:** 用 CSS 变量驱动排版：在 iframe 根元素 `document.documentElement` 上设置 `--reader-font-size` / `--reader-line-height`，`StoryMessageBody` 的 `font-size`/`line-height` 改用 `var()` 引用。调节逻辑抽为纯函数模块 `readerTypography.ts`（默认值、范围、clamp、读写），供 `app.vue` 初始化与 `StoryReader.vue` 面板复用。调节面板内联在 `StoryReader.vue` 顶栏「Aa」按钮下，不单独建组件。

**Tech Stack:** Vue 3 (`<script setup>`)、SCSS scoped 样式、Node 22 `--experimental-strip-types` 跑 `.mjs` 测试、webpack 构建。

**提交策略：** 本项目约定不主动执行 git 提交。以下每个 Task 末尾的 Commit 步骤，均需在执行前与用户确认提交方式（默认：全部完成后一次性提交；如需逐 Task 提交请明确告知）。

---

### Task 1: 排版设置纯函数模块（TDD）

**Files:**
- Create: `src/APP/story/readerTypography.ts`
- Create: `src/APP/story/readerTypography.test.mjs`

- [ ] **Step 1: 写失败测试**

创建 `src/APP/story/readerTypography.test.mjs`：

```js
import assert from 'node:assert';
import {
  DEFAULT_READER_TYPOGRAPHY,
  clamp,
  loadReaderTypography,
  saveReaderTypography,
} from './readerTypography.ts';

function makeStore(init = {}) {
  const map = new Map(Object.entries(init));
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
  };
}

function testEmptyStoreFallsBackToDefault() {
  const s = loadReaderTypography(makeStore());
  assert.deepEqual(s, DEFAULT_READER_TYPOGRAPHY, '空存储返回默认值');
}

function testInvalidValuesFallBack() {
  const s = loadReaderTypography(
    makeStore({ 'app-reader-font-size': 'abc', 'app-reader-line-height': 'xyz' }),
  );
  assert.deepEqual(s, DEFAULT_READER_TYPOGRAPHY, '非法值回落默认');
}

function testClampOutOfRange() {
  const s = loadReaderTypography(
    makeStore({ 'app-reader-font-size': '99', 'app-reader-line-height': '9.9' }),
  );
  assert.equal(s.fontSize, 20, '字号 clamp 到上限');
  assert.equal(s.lineHeight, 2.2, '行距 clamp 到上限');
}

function testRoundAndParse() {
  const s = loadReaderTypography(
    makeStore({ 'app-reader-font-size': '14.7', 'app-reader-line-height': '1.66' }),
  );
  assert.equal(s.fontSize, 15, '字号四舍五入为整数');
  assert.equal(s.lineHeight, 1.7, '行距保留一位小数');
}

function testSaveClampsAndWrites() {
  const store = makeStore();
  saveReaderTypography({ fontSize: 99, lineHeight: 0.1 }, store);
  assert.equal(store.getItem('app-reader-font-size'), '20', '保存时字号 clamp 到上限');
  assert.equal(store.getItem('app-reader-line-height'), '1.3', '保存时行距 clamp 到下限');
}

function testSaveWritesNormalValues() {
  const store = makeStore();
  saveReaderTypography({ fontSize: 15, lineHeight: 1.6 }, store);
  assert.equal(store.getItem('app-reader-font-size'), '15', '正常字号原样写入');
  assert.equal(store.getItem('app-reader-line-height'), '1.6', '正常行距原样写入');
}

function testClampHelper() {
  assert.equal(clamp(5, 1, 10), 5, '范围内原样');
  assert.equal(clamp(99, 1, 10), 10, '超出上限截断');
  assert.equal(clamp(-1, 1, 10), 1, '低于下限截断');
}

testEmptyStoreFallsBackToDefault();
testInvalidValuesFallBack();
testClampOutOfRange();
testRoundAndParse();
testSaveClampsAndWrites();
testSaveWritesNormalValues();
testClampHelper();
console.log('reader typography contract passed');
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --experimental-strip-types src/APP/story/readerTypography.test.mjs`
Expected: FAIL，报 `ERR_MODULE_NOT_FOUND` / 找不到 `./readerTypography.ts`（模块尚未创建）。

- [ ] **Step 3: 创建模块**

创建 `src/APP/story/readerTypography.ts`：

```ts
// 正文阅读排版设置：默认值、调节范围与 localStorage 持久化。
// StoryMessageBody 通过 var(--reader-font-size) / var(--reader-line-height) 引用。

export interface ReaderTypographySettings {
  /** 正文字号，单位 px */
  fontSize: number;
  /** 正文行高倍数，无单位 */
  lineHeight: number;
}

export const DEFAULT_READER_TYPOGRAPHY: ReaderTypographySettings = { fontSize: 15, lineHeight: 1.6 };

export const FONT_SIZE_RANGE = { min: 13, max: 20, step: 1 };
export const LINE_HEIGHT_RANGE = { min: 1.3, max: 2.2, step: 0.1 };

export const READER_FONT_SIZE_KEY = 'app-reader-font-size';
export const READER_LINE_HEIGHT_KEY = 'app-reader-line-height';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundLineHeight(value: number): number {
  return Math.round(value * 10) / 10;
}

/** 从存储读取设置；缺失或非法时回落默认值，越界时 clamp 到范围。 */
export function loadReaderTypography(store: Pick<Storage, 'getItem'>): ReaderTypographySettings {
  const rawFont = Number(store.getItem(READER_FONT_SIZE_KEY));
  const rawLine = Number(store.getItem(READER_LINE_HEIGHT_KEY));
  return {
    fontSize: Number.isFinite(rawFont)
      ? clamp(Math.round(rawFont), FONT_SIZE_RANGE.min, FONT_SIZE_RANGE.max)
      : DEFAULT_READER_TYPOGRAPHY.fontSize,
    lineHeight: Number.isFinite(rawLine)
      ? clamp(roundLineHeight(rawLine), LINE_HEIGHT_RANGE.min, LINE_HEIGHT_RANGE.max)
      : DEFAULT_READER_TYPOGRAPHY.lineHeight,
  };
}

/** 写入存储；值先 clamp 到范围并规范化，保证前后一致。 */
export function saveReaderTypography(
  settings: ReaderTypographySettings,
  store: Pick<Storage, 'setItem'>,
): void {
  store.setItem(
    READER_FONT_SIZE_KEY,
    String(clamp(Math.round(settings.fontSize), FONT_SIZE_RANGE.min, FONT_SIZE_RANGE.max)),
  );
  store.setItem(
    READER_LINE_HEIGHT_KEY,
    String(clamp(roundLineHeight(settings.lineHeight), LINE_HEIGHT_RANGE.min, LINE_HEIGHT_RANGE.max)),
  );
}

/** 将排版设置应用到 iframe 根元素，使 StoryMessageBody 的 var() 生效。 */
export function applyReaderTypography(settings: ReaderTypographySettings): void {
  const root = document.documentElement;
  root.style.setProperty('--reader-font-size', `${settings.fontSize}px`);
  root.style.setProperty('--reader-line-height', String(settings.lineHeight));
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node --experimental-strip-types src/APP/story/readerTypography.test.mjs`
Expected: PASS，输出 `reader typography contract passed`

- [ ] **Step 5: Commit**

```bash
git add src/APP/story/readerTypography.ts src/APP/story/readerTypography.test.mjs
git commit -m "feat: add reader typography settings module"
```
（若用户未确认提交策略，跳过此步，最后统一提交）

---

### Task 2: StoryMessageBody 改用 CSS 变量

**Files:**
- Modify: `src/APP/story/StoryMessageBody.vue:20-28`（`.story-message-body` 排版）

- [ ] **Step 1: 修改排版为 CSS 变量**

将 `.story-message-body` 的 `font-size` / `line-height` 改为引用 CSS 变量，删除硬编码与窄屏分支：

```scss
.story-message-body {
  min-width: 0;
  max-width: 100%;
  color: var(--text-primary);
  font-size: var(--reader-font-size, 15px);
  line-height: var(--reader-line-height, 1.6);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}
```

并删除文件末尾的整个窄屏分支：

```scss
@media (max-width: 520px) {
  .story-message-body {
    font-size: 16px;
    line-height: 1.76;
  }
}
```

- [ ] **Step 2: 构建验证**

Run: `pnpm build`
Expected: 构建成功，无报错。

- [ ] **Step 3: Commit**

```bash
git add src/APP/story/StoryMessageBody.vue
git commit -m "feat: drive story body typography from CSS variables"
```
（若用户未确认提交策略，跳过此步）

---

### Task 3: app.vue 启动时应用持久化设置

**Files:**
- Modify: `src/APP/app.vue:22-25`（import 区）与 `src/APP/app.vue:50-54`（`onMounted`）

- [ ] **Step 1: 引入模块**

在 `src/APP/app.vue` 的 import 区（`import { provideStorySession } from './story/storyContext';` 附近）新增：

```ts
import { applyReaderTypography, loadReaderTypography } from './story/readerTypography';
```

- [ ] **Step 2: 挂载时应用排版**

将 `onMounted` 改为在初始化主题后应用持久化排版：

```ts
onMounted(() => {
  initTheme();
  applyReaderTypography(loadReaderTypography(localStorage));
  storySession.bind();
  window.addEventListener('pagehide', disposeAppSessions);
});
```

- [ ] **Step 3: 构建验证**

Run: `pnpm build`
Expected: 构建成功。

- [ ] **Step 4: Commit**

```bash
git add src/APP/app.vue
git commit -m "feat: apply persisted reader typography on mount"
```
（若用户未确认提交策略，跳过此步）

---

### Task 4: StoryReader 顶栏按钮与调节面板

**Files:**
- Modify: `src/APP/story/StoryReader.vue`（模板 header、script、scoped 样式）

- [ ] **Step 1: 模板新增顶栏按钮与面板**

将 `StoryReader.vue` 的 `<header class="reader-header">` 中历史按钮替换为包裹容器，并在 header 之后插入面板：

```html
    <header class="reader-header">
      <button type="button" class="icon-button" aria-label="返回上一页" @click="router.back()">
        <i class="fas fa-arrow-left"></i>
      </button>
      <div class="reader-title">
        <strong>正文</strong>
        <span>{{ statusText }}</span>
      </div>
      <div class="reader-actions">
        <button
          type="button"
          class="icon-button"
          :aria-pressed="settingsOpen"
          aria-label="调节阅读排版"
          @click="settingsOpen = !settingsOpen"
        >
          <i class="fas fa-text-height"></i>
        </button>
        <button type="button" class="icon-button" aria-label="查看正文历史" @click="historyOpen = true">
          <i class="fas fa-clock-rotate-left"></i>
        </button>
      </div>
    </header>

    <div v-if="settingsOpen" class="settings-panel">
      <div class="settings-row">
        <span class="settings-label">字号</span>
        <div class="settings-control">
          <button type="button" class="step-btn" aria-label="减小字号" @click="step('fontSize', -1)">
            <i class="fas fa-minus"></i>
          </button>
          <input
            type="range"
            class="settings-range"
            :min="FONT_SIZE_RANGE.min"
            :max="FONT_SIZE_RANGE.max"
            :step="FONT_SIZE_RANGE.step"
            v-model.number="settings.fontSize"
            @input="onTypographyChange"
          />
          <button type="button" class="step-btn" aria-label="增大字号" @click="step('fontSize', 1)">
            <i class="fas fa-plus"></i>
          </button>
          <span class="settings-value">{{ settings.fontSize }}px</span>
        </div>
      </div>
      <div class="settings-row">
        <span class="settings-label">行距</span>
        <div class="settings-control">
          <button type="button" class="step-btn" aria-label="减小行距" @click="step('lineHeight', -0.1)">
            <i class="fas fa-minus"></i>
          </button>
          <input
            type="range"
            class="settings-range"
            :min="LINE_HEIGHT_RANGE.min"
            :max="LINE_HEIGHT_RANGE.max"
            :step="LINE_HEIGHT_RANGE.step"
            v-model.number="settings.lineHeight"
            @input="onTypographyChange"
          />
          <button type="button" class="step-btn" aria-label="增大行距" @click="step('lineHeight', 0.1)">
            <i class="fas fa-plus"></i>
          </button>
          <span class="settings-value">{{ settings.lineHeight.toFixed(1) }}</span>
        </div>
      </div>
      <button type="button" class="reset-button" @click="resetTypography">恢复默认</button>
    </div>
```

- [ ] **Step 2: script 新增状态与处理函数**

在 `StoryReader.vue` 的 import 区新增：

```ts
import type { ReaderTypographySettings } from './readerTypography';
import {
  DEFAULT_READER_TYPOGRAPHY,
  FONT_SIZE_RANGE,
  LINE_HEIGHT_RANGE,
  applyReaderTypography,
  clamp,
  loadReaderTypography,
  saveReaderTypography,
} from './readerTypography';
```

在 `const rollbackConfirmId = ref<number | null>(null);` 之后新增：

```ts
const settingsOpen = ref(false);
const settings = ref<ReaderTypographySettings>(loadReaderTypography(localStorage));

function onTypographyChange(): void {
  applyReaderTypography(settings.value);
  saveReaderTypography(settings.value, localStorage);
}

function resetTypography(): void {
  settings.value = { ...DEFAULT_READER_TYPOGRAPHY };
  onTypographyChange();
}

function step(field: 'fontSize' | 'lineHeight', delta: number): void {
  const config = field === 'fontSize' ? FONT_SIZE_RANGE : LINE_HEIGHT_RANGE;
  const next = clamp(Math.round((settings.value[field] + delta) * 10) / 10, config.min, config.max);
  settings.value = { ...settings.value, [field]: next };
  onTypographyChange();
}
```

- [ ] **Step 3: scoped 样式新增面板样式**

在 `StoryReader.vue` 的 `<style scoped lang="scss">` 中新增（放在 `.reader-header` 规则之后）：

```scss
.reader-actions {
  display: grid;
  grid-template-columns: repeat(2, 44px);
  gap: 8px;
}

.settings-panel {
  position: absolute;
  z-index: 5;
  top: 64px;
  right: clamp(12px, 4vw, 18px);
  display: grid;
  width: min(300px, calc(100% - 24px));
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-header);
  box-shadow: var(--shadow-floating);
}

.settings-row {
  display: grid;
  gap: 6px;
}

.settings-label {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.settings-control {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 36px auto;
  align-items: center;
  gap: 8px;
}

.step-btn {
  width: 36px;
  min-height: 36px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-card-light);
  color: var(--text-primary);
}

.settings-range {
  width: 100%;
  accent-color: var(--accent-primary);
}

.settings-value {
  min-width: 40px;
  color: var(--text-primary);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.reset-button {
  min-height: 40px;
  border: 0;
  border-radius: 8px;
  background: var(--bg-card-light);
  color: var(--text-secondary);
  font-weight: 600;
}
```

同时将 `.reader-header` 的 `grid-template-columns` 从 `44px minmax(0, 1fr) 44px` 改为 `44px minmax(0, 1fr) 96px`。

- [ ] **Step 4: 构建验证**

Run: `pnpm build`
Expected: 构建成功。

- [ ] **Step 5: Commit**

```bash
git add src/APP/story/StoryReader.vue
git commit -m "feat: add reader typography control panel"
```
（若用户未确认提交策略，跳过此步）

---

### Task 5: 回归测试与手动验证

**Files:**
- 无代码改动，执行验证。

- [ ] **Step 1: 运行全部现有 story 测试**

Run: `node --experimental-strip-types src/APP/story/readerTypography.test.mjs`
Expected: PASS（`reader typography contract passed`）

Run: `node src/APP/story/storyIntegrationSource.test.js`
Expected: PASS（`story integration source contract passed`）

Run: `node src/APP/appScrollSource.test.mjs`
Expected: PASS

- [ ] **Step 2: 完整构建**

Run: `pnpm build`
Expected: webpack 生产构建成功。

- [ ] **Step 3: 手动验证清单**

1. 进入正文页 → 顶栏右上出现「Aa」按钮，点击展开面板。
2. 拖动字号滑块：正文、「你的行动」、正文历史中的正文文字字号即时变化。
3. 拖动行距滑块：行距即时变化。
4. 面板「Aa−/Aa+」「行距±」按钮按步进增减并 clamp 到 13–20 / 1.3–2.2。
5. 刷新页面后设置保留（localStorage `app-reader-font-size` / `app-reader-line-height`）。
6. 「恢复默认」回到 15px / 1.6。
7. 点击面板外区域，面板不自动关闭（面板无遮罩，点「Aa」切换关闭）——验证面板不影响正文滚动与选择。

- [ ] **Step 4: Commit（若用户确认提交策略）**

```bash
git add -A
git commit -m "feat: reader typography controls"
```

---

## Self-Review

**Spec 覆盖：**
- 默认 15px/1.6 → Task 1 `DEFAULT_READER_TYPOGRAPHY`
- 调节范围 13–20 / 1.3–2.2 → Task 1 `FONT_SIZE_RANGE` / `LINE_HEIGHT_RANGE`，Task 4 面板
- 顶栏「Aa」按钮 + 面板 → Task 4
- 即时生效 → Task 4 `applyReaderTypography` + `var()` 引用（Task 2）
- 持久化 localStorage → Task 1 load/save + Task 3 启动应用 + Task 4 调节写入
- 覆盖正文/用户行动/正文历史 → 三者均复用 `StoryMessageBody`，Task 2 一处改动生效
- 「恢复默认」→ Task 4 `resetTypography`

**占位符扫描：** 无 TBD/TODO，所有代码块为完整实现。

**类型一致性：** `ReaderTypographySettings`、`clamp`、`FONT_SIZE_RANGE`/`LINE_HEIGHT_RANGE`、`applyReaderTypography`、`loadReaderTypography`、`saveReaderTypography` 在各 Task 中的引用与 Task 1 定义一致；`step` 参数 `'fontSize' | 'lineHeight'` 与接口字段一致。
