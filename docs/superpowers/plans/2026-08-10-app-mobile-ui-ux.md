# APP 移动端 UI/UX 统一优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变业务逻辑、数据结构和路由的前提下，统一整个 APP 的移动端视觉、触控反馈、阅读密度和底部操作区体验。

**Architecture:** 以 `src/APP/app.vue` 作为 APP 壳层和移动端设计令牌入口，通过 `:deep` 规则统一各页面已有的 header、content、card、button、nav 和 modal；只在正文页对阅读区和输入区做局部排版优化。使用源代码回归测试锁定关键 CSS/模板契约，避免重复重构每个页面的大型 scoped style。

**Tech Stack:** Vue 3、TypeScript、SCSS、Node `node:test`、Webpack 5、pnpm。

## Global Constraints

- 保留 `--accent-primary` 黄色作为主要行动色，不引入新的 UI 依赖。
- 主要触控目标至少 44px，重要行动按钮优先 48px。
- 使用 `touch-action: manipulation`，不依赖移动端 hover，并提供 `:focus-visible`。
- 不使用 `vh`/`dvh` 作为 iframe 高度方案；底部安全区只通过 `env(safe-area-inset-bottom)` 增强留白。
- 不改 API、酒馆变量、数据解析、生成流程和路由行为。
- 只提交本任务新增/修改的文件，保留工作区中已有的无关修改和构建噪声。

---

### Task 1: 锁定共享移动端设计契约

**Files:**
- Create: `src/APP/mobileUiSource.test.mjs`
- Test: `src/APP/mobileUiSource.test.mjs`

**Interfaces:**
- Consumes: `src/APP/app.vue` 的全局主题变量和 APP 壳层样式文本。
- Produces: 可由 `node --test src/APP/mobileUiSource.test.mjs` 执行的移动端 UI 回归契约。

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const appSource = fs.readFileSync(new URL('./app.vue', import.meta.url), 'utf8');
const readerSource = fs.readFileSync(new URL('./story/StoryReader.vue', import.meta.url), 'utf8');

test('APP 壳层提供统一的移动端设计令牌和触控反馈', () => {
  assert.match(appSource, /--radius-card:\s*14px/);
  assert.match(appSource, /--touch-target:\s*44px/);
  assert.match(appSource, /touch-action:\s*manipulation/);
  assert.match(appSource, /:focus-visible/);
});

test('底部导航和固定操作区避开移动端安全区', () => {
  assert.match(appSource, /\.phone-frame :deep\(\.nav-bar\)[\s\S]*?safe-area-inset-bottom/);
  assert.match(appSource, /\.phone-frame :deep\(\.detail-footer\)[\s\S]*?safe-area-inset-bottom/);
});

test('正文阅读区继续保留长文本舒适留白和底部操作安全区', () => {
  assert.match(readerSource, /\.reader-scroll[\s\S]*?padding:/);
  assert.match(readerSource, /\.reader-composer[\s\S]*?safe-area-inset-bottom/);
  assert.match(readerSource, /\.story-paper[\s\S]*?border-radius:\s*14px/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/APP/mobileUiSource.test.mjs`

Expected: FAIL because the new shared tokens, focus rule, safe-area rules, and story paper radius do not exist yet.

- [ ] **Step 3: Commit the failing test**

```powershell
git add -- src/APP/mobileUiSource.test.mjs
git commit -m "test: specify app mobile ui contract"
```

### Task 2: Implement the shared APP mobile design layer

**Files:**
- Modify: `src/APP/app.vue:48-337`
- Test: `src/APP/mobileUiSource.test.mjs`

**Interfaces:**
- Consumes: existing page class names (`app-header`, `app-content`, `nav-bar`, `card`, `shop-card`, `package-card`, `history-card`, `status-card`, `modal-content`).
- Produces: one consistent mobile shell for Home, Discover, ShopDetail, ItemDetail, Service, History, Me, and the StoryEntry overlay.

- [ ] **Step 1: Add the shared design tokens**

Add these variables beside the existing root theme variables and matching dark-theme values:

```scss
--radius-control: 10px;
--radius-card: 14px;
--radius-panel: 18px;
--touch-target: 44px;
--space-page: clamp(12px, 4%, 18px);
--shadow-card: 0 8px 24px rgba(0, 0, 0, 0.07);
--shadow-floating: 0 12px 28px rgba(0, 0, 0, 0.14);
```

- [ ] **Step 2: Add global touch and focus feedback**

Extend the existing `#app button, input, textarea, select` rules and add a focus rule:

```scss
#app button,
#app input,
#app textarea,
#app select {
  font: inherit;
  min-width: 0;
  max-width: 100%;
  touch-action: manipulation;
}

#app button:focus-visible,
#app input:focus-visible,
#app textarea:focus-visible,
#app select:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--accent-primary) 70%, transparent);
  outline-offset: 2px;
}
```

- [ ] **Step 3: Add shared shell rules for header, content, navigation, cards, and overlays**

Append the following to the existing `.phone-frame` scoped style, keeping desktop values intact and placing mobile overrides in the existing `@media (max-width: 768px)` block where possible:

```scss
.phone-frame :deep(.app-header) {
  min-height: 56px;
  padding: 10px var(--space-page);
  background: color-mix(in srgb, var(--bg-header) 94%, transparent);
  box-shadow: 0 1px 0 color-mix(in srgb, var(--border-color) 75%, transparent);
}

.phone-frame :deep(.app-header .title) {
  min-width: 0;
  gap: 10px;
}

.phone-frame :deep(.app-header .title > span) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.phone-frame :deep(.app-header button),
.phone-frame :deep(.app-header .title > i) {
  min-width: var(--touch-target);
  min-height: var(--touch-target);
}

.phone-frame :deep(.app-content) {
  padding: var(--space-page);
  overscroll-behavior-y: contain;
}

.phone-frame :deep(.card),
.phone-frame :deep(.shop-card),
.phone-frame :deep(.package-card),
.phone-frame :deep(.history-card),
.phone-frame :deep(.status-card),
.phone-frame :deep(.detail-info-card),
.phone-frame :deep(.service-item),
.phone-frame :deep(.review-item) {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.phone-frame :deep(.nav-bar) {
  min-height: 64px;
  padding: 8px var(--space-page) max(8px, env(safe-area-inset-bottom));
  gap: 4px;
  border-top: 1px solid color-mix(in srgb, var(--border-color) 78%, transparent);
  background: color-mix(in srgb, var(--bg-header) 96%, transparent);
}

.phone-frame :deep(.nav-item) {
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  border-radius: 12px;
  transition: background-color 120ms ease, color 120ms ease, transform 120ms ease;
}

.phone-frame :deep(.nav-item.active) {
  background: var(--bg-item-hover);
  color: var(--text-primary);
}

.phone-frame :deep(.nav-item.active i) {
  color: var(--accent-dark);
}

.phone-frame :deep(.story-entry) {
  bottom: max(72px, calc(68px + env(safe-area-inset-bottom)));
  box-shadow: var(--shadow-floating), 0 0 0 3px color-mix(in srgb, var(--bg-primary) 86%, transparent);
}

.phone-frame :deep(.modal-content),
.phone-frame :deep(.reorder-modal-content) {
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-floating);
}

@media (hover: none) and (pointer: coarse) {
  .phone-frame :deep(button:not(:disabled):active),
  .phone-frame :deep(.nav-item:active),
  .phone-frame :deep(.shop-card:active),
  .phone-frame :deep(.package-card:active),
  .phone-frame :deep(.history-card:active) {
    transform: scale(0.98);
  }
}

@media (prefers-reduced-motion: reduce) {
  .phone-frame :deep(.nav-item),
  .phone-frame :deep(button) {
    transition: none;
  }
}
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node --test src/APP/mobileUiSource.test.mjs`

Expected: PASS with 3 tests.

- [ ] **Step 5: Commit the shared design layer**

```powershell
git add -- src/APP/app.vue src/APP/mobileUiSource.test.mjs
git commit -m "feat: unify app mobile ui foundation"
```

### Task 3: Tune page-level mobile reading and action surfaces

**Files:**
- Modify: `src/APP/app.vue:338-430`
- Modify: `src/APP/story/StoryReader.vue:220-390`
- Test: `src/APP/mobileUiSource.test.mjs`

**Interfaces:**
- Consumes: shared tokens and shell rules from Task 2; existing detail footer, modal, StoryReader, and bottom navigation DOM.
- Produces: consistent mobile spacing for long content, fixed action regions that respect the safe area, and immediate control feedback.

- [ ] **Step 1: Extend the failing test with page-level contracts**

Add these assertions to the test file before implementing the page rules:

```js
test('套餐详情的固定下单区和弹窗在窄屏下保持可操作', () => {
  assert.match(appSource, /\.phone-frame :deep\(\.detail-footer\)/);
  assert.match(appSource, /\.phone-frame :deep\(\.modal-overlay\)[\s\S]*?align-items:\s*flex-end/);
  assert.match(appSource, /\.phone-frame :deep\(\.modal-content\)[\s\S]*?max-height:/);
});

test('正文和首页入口在触屏上提供即时按下反馈', () => {
  assert.match(readerSource, /\.reader-home-button[\s\S]*?transition:/);
  assert.match(readerSource, /\.send-button[\s\S]*?transition:/);
  assert.match(appSource, /\.phone-frame :deep\(\.search-bar-container\)/);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test src/APP/mobileUiSource.test.mjs`

Expected: FAIL because the mobile detail modal rules and StoryReader button transitions do not exist yet.

- [ ] **Step 3: Implement narrow-screen detail and modal rules**

Add these rules in `app.vue` after the existing modal selectors:

```scss
@media (max-width: 768px) {
  .phone-frame :deep(.detail-footer) {
    padding: 10px var(--space-page) max(12px, env(safe-area-inset-bottom));
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.08);
  }

  .phone-frame :deep(.modal-overlay),
  .phone-frame :deep(.reorder-modal-overlay) {
    align-items: flex-end;
    padding: 12px var(--space-page) max(12px, env(safe-area-inset-bottom));
  }

  .phone-frame :deep(.modal-content),
  .phone-frame :deep(.reorder-modal-content) {
    width: 100%;
    max-height: calc(100% - 24px);
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .phone-frame :deep(.search-bar-container) {
    min-height: 52px;
    gap: 8px;
    padding: 6px 8px 6px 14px;
    border-radius: var(--radius-panel);
  }
}
```

- [ ] **Step 4: Implement StoryReader typography, surface, and composer polish**

Update the existing StoryReader rules without changing its data or scroll logic:

```scss
.reader-header {
  min-height: 56px;
  padding: 10px clamp(12px, 4vw, 18px);
}

.reader-title strong {
  font-size: clamp(18px, 5vw, 21px);
  letter-spacing: -0.01em;
}

.reader-scroll {
  padding: 18px clamp(12px, 4vw, 28px) 30px;
  overscroll-behavior-y: contain;
}

.story-paper {
  gap: 16px;
  padding: clamp(20px, 5vw, 32px);
  border-radius: 14px;
}

.reader-composer {
  padding: 10px clamp(12px, 4vw, 24px) max(12px, env(safe-area-inset-bottom));
  background: color-mix(in srgb, var(--bg-header) 96%, transparent);
  backdrop-filter: blur(12px);
}

.reader-home-button,
.send-button {
  transition: transform 120ms ease, background-color 120ms ease, filter 120ms ease;

  &:active {
    transform: scale(0.96);
  }
}
```

- [ ] **Step 5: Run focused tests and format check**

Run: `node --test src/APP/mobileUiSource.test.mjs`

Expected: PASS with 5 tests.

Run: `pnpm exec prettier --check src/APP/app.vue src/APP/story/StoryReader.vue src/APP/mobileUiSource.test.mjs`

Expected: all files use Prettier code style.

- [ ] **Step 6: Commit page-level polish**

```powershell
git add -- src/APP/app.vue src/APP/story/StoryReader.vue src/APP/mobileUiSource.test.mjs
git commit -m "feat: polish app mobile interaction surfaces"
```

### Task 4: Run regression verification and publish the APP artifact

**Files:**
- Modify: `dist/APP/index.html` (generated by the build)
- Preserve: all unrelated existing worktree changes

**Interfaces:**
- Consumes: all source changes from Tasks 1–3 and the repository webpack configuration.
- Produces: a verified `dist/APP/index.html` containing the updated mobile UI.

- [ ] **Step 1: Run all runnable APP tests**

Run in PowerShell:

```powershell
$testFiles = Get-ChildItem src/APP -Recurse -File |
  Where-Object { $_.Name -match '\.test\.(mjs|js)$' } |
  ForEach-Object FullName
node --test $testFiles
```

Expected: exit code 0 and no failing tests.

- [ ] **Step 2: Run the whitespace check**

Run: `git diff --check`

Expected: no output and exit code 0.

- [ ] **Step 3: Build the APP**

Run: `pnpm build`

Expected: webpack completes successfully and writes `dist/APP/index.html`.

- [ ] **Step 4: Verify the generated artifact contains the feature markers**

Run:

```powershell
$artifact = Get-Content -Raw -LiteralPath 'dist/APP/index.html'
if ($artifact -notmatch 'safe-area-inset-bottom' -or $artifact -notmatch 'touch-action') {
  throw 'APP artifact is missing mobile UI markers'
}
Write-Output 'APP artifact contains mobile UI markers'
```

Expected: `APP artifact contains mobile UI markers`.

- [ ] **Step 5: Commit only the APP artifact**

```powershell
git add -- dist/APP/index.html
git commit -m "build: publish app mobile ui polish"
```

- [ ] **Step 6: Report runtime boundary**

If the current Tavern chat does not contain the APP iframe, report source/test/build success separately from live touch verification. Do not treat a direct static browser load that lacks Tavern globals as a valid runtime proof.
