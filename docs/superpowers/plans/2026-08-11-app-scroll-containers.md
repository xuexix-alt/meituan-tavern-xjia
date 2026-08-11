# APP Mobile Scroll Containers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the APP discovery package-detail content and history-order list form reliable touch-scroll containers inside the Tavern iframe.

**Architecture:** Keep one scroll owner per APP page. The shared `.phone-frame` shell will guarantee that routed `.app-view` pages are column flex containers, while their `.app-content` child receives the zero automatic minimum height and mobile vertical touch scrolling needed to consume the remaining space. Existing page-level padding, sticky tabs, and modal scroll areas remain unchanged.

**Tech Stack:** Vue 3 SFC, SCSS, TypeScript/Webpack, Node built-in test runner, Chrome Tavern iframe verification.

## Global Constraints

- Preserve the existing single scroll container per page; do not add nested page scrolling.
- Keep `.detail-tabs` sticky and keep existing tab/order interactions intact.
- Use only the project-defined Tavern/iframe interfaces; this fix is CSS/layout-only.
- Treat `dist/APP/index.html` as the runtime artifact and audit unrelated build output after `pnpm build`.
- Preserve pre-existing user deletions and unrelated documents in the dirty worktree.

---

### Task 1: Add failing scroll-shell source regression

**Files:**
- Create: `src/APP/appScrollSource.test.mjs`
- Inspect: `src/APP/app.vue`, `src/APP/ItemDetail.vue`, `src/APP/History.vue`

**Interfaces:**
- Consumes: shared `.phone-frame :deep(.app-view)` and `.phone-frame :deep(.app-content)` rules in `app.vue`.
- Produces: source-level assertions that prevent the flex chain and touch-scroll contract from regressing.

- [x] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./app.vue', import.meta.url), 'utf8');

test('APP 壳层让路由页面保持纵向 flex 布局', () => {
  assert.match(
    source,
    /\.phone-frame\s+:deep\(\.app-view\)\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s,
  );
});

test('APP 壳层把页面内容约束为可触摸纵向滚动区', () => {
  assert.match(
    source,
    /\.phone-frame\s+:deep\(\.app-content\)\s*\{[^}]*min-height:\s*0;[^}]*overflow-y:\s*auto;[^}]*touch-action:\s*pan-y;[^}]*-webkit-overflow-scrolling:\s*touch;/s,
  );
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `node --test src/APP/appScrollSource.test.mjs`

Expected: FAIL because the shared app shell currently lacks `display:flex`, `flex-direction:column`, and the zero-min-height touch-scroll contract.

### Task 2: Implement the shared flex scroll contract

**Files:**
- Modify: `src/APP/app.vue:351-399`
- Preserve: `src/APP/ItemDetail.vue` existing `min-height:0`, `touch-action:pan-y`, and `-webkit-overflow-scrolling:touch` changes already present in the worktree.

**Interfaces:**
- Consumes: `.phone-frame` shell and all routed APP page `.app-view`/`.app-content` elements.
- Produces: a single flex-based scroll chain shared by discovery detail, history, and other APP pages.

- [x] **Step 1: Add the minimal shell declarations**

```scss
.phone-frame :deep(.app-view) {
  display: flex;
  flex-direction: column;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  transition:
    top 0.18s ease,
    height 0.18s ease;
}

.phone-frame :deep(.app-content) {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-page);
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}
```

- [x] **Step 2: Run the focused source tests**

Run: `node --test src/APP/appScrollSource.test.mjs src/APP/itemDetailScrollSource.test.mjs src/APP/mobileUiSource.test.mjs`

Expected: PASS with the existing tab and mobile UI contracts intact.

### Task 3: Build, inspect the artifact, and verify the live Tavern flow

**Files:**
- Generated runtime artifact: `dist/APP/index.html`
- Do not retain unrelated generated changes from `pnpm build`.

- [x] **Step 1: Run APP source tests and the project build**

Run: `node --test src/APP/appScrollSource.test.mjs src/APP/itemDetailScrollSource.test.mjs src/APP/mobileUiSource.test.mjs`

Run: `pnpm build`

Expected: focused tests pass and webpack exits successfully; inspect `dist/APP/index.html` for the shell declarations.

- [x] **Step 2: Re-check generated scope**

Run: `git status --short; git diff --check; git diff --stat`

Expected: source/test plus `dist/APP/index.html` only for this fix; retain existing deletions and unrelated documents without staging them.

- [x] **Step 3: Refresh the real `127.0.0.1:8000` Tavern iframe**

Verify after the iframe is loaded:

```js
({
  viewDisplay: getComputedStyle(document.querySelector('.app-view')).display,
  viewFlexDirection: getComputedStyle(document.querySelector('.app-view')).flexDirection,
  contentScrollHeight: document.querySelector('.app-content').scrollHeight,
  contentClientHeight: document.querySelector('.app-content').clientHeight,
  contentTouchAction: getComputedStyle(document.querySelector('.app-content')).touchAction,
})
```

Expected: `viewDisplay === 'flex'`, `viewFlexDirection === 'column'`, content has `scrollHeight > clientHeight` when populated, and touch action is `pan-y`. Exercise package-detail body/tab scrolling and the history list with multiple orders without changing the active tab or triggering a card action.

Observed: the freshly rebuilt bundle showed the expected flex and touch-scroll styles in the live Tavern iframe. A real coordinate scroll moved the populated Home content from `scrollTop=0` to `247`. The current verification chat had no history-order cards, so the multi-order gesture itself could not be exercised without fabricating or mutating user data; the History route still exposed the same `flex: 1 1 auto`, `min-height: 0`, `overflow-y: auto`, and `touch-action: pan-y` contract.
