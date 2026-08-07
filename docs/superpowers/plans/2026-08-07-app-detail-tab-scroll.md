# APP 套餐详情页移动端 tab 滚动修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make vertical touch scrolling from the package-detail tab area reliable across mobile browsers and WebViews without changing tab switching, sticky positioning, or ordering behavior.

**Architecture:** Keep `#detail-content` as the only detail-page scroll container. Add explicit vertical touch intent and iOS/WebView momentum scrolling to the existing `.app-content`, then apply the same vertical touch intent to `.detail-tabs` and its `.tab-link` buttons so gestures starting over the tab controls remain scroll gestures when vertical. Lock the contract with a focused source-level Node test and verify the generated APP bundle in the live Tavern page.

**Tech Stack:** Vue SFC, SCSS, Node built-in test runner (`node:test`), pnpm, webpack, Playwright CLI for live Tavern verification.

## Global Constraints

- Modify only `src/APP/ItemDetail.vue`, the new focused source test, and the generated `dist/APP/index.html` runtime artifact for the implementation; preserve unrelated worktree changes.
- Do not remove `position: sticky`, create a second scroll container, or change tab data, routing, order flow, or iframe sizing.
- Use only existing CSS and test tooling; do not add dependencies or new Tavern APIs.
- Keep `overscroll-behavior: contain` in `app.vue` unchanged.
- Verify source tests, production build, and the actual `127.0.0.1:8000` target detail page separately.

---

### Task 1: Add a failing source-level regression test

**Files:**
- Create: `src/APP/itemDetailScrollSource.test.mjs`
- Reference: `src/APP/ItemDetail.vue`

**Interfaces:**
- Consumes: the current `ItemDetail.vue` source as UTF-8 text.
- Produces: a test contract requiring vertical touch scrolling on `.app-content`, `.detail-tabs`, and `.tab-link`, while preserving the three existing tab buttons and their click assignments.

- [ ] **Step 1: Write the failing test**

Create `src/APP/itemDetailScrollSource.test.mjs` with this exact content:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./ItemDetail.vue', import.meta.url), 'utf8');

test('套餐详情滚动区和 tab 控件声明移动端纵向触摸策略', () => {
  assert.match(
    source,
    /\.app-content\s*\{[^}]*touch-action:\s*pan-y;[^}]*-webkit-overflow-scrolling:\s*touch;/s,
  );
  assert.match(source, /\.detail-tabs\s*\{[^}]*touch-action:\s*pan-y;/s);
  assert.match(source, /\.tab-link\s*\{[^}]*touch-action:\s*pan-y;/s);
});

test('套餐详情仍保留三个 tab 及现有切换目标', () => {
  assert.equal((source.match(/<button class="tab-link"/g) ?? []).length, 3);
  assert.match(source, /@click="activeTab = 'content'"/);
  assert.match(source, /@click="activeTab = 'reviews'"/);
  assert.match(source, /@click="activeTab = 'images'"/);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```powershell
node --test src/APP/itemDetailScrollSource.test.mjs
```

Expected: the second test passes, while `套餐详情滚动区和 tab 控件声明移动端纵向触摸策略` fails because the current source has none of the required `touch-action` declarations.

### Task 2: Implement the minimal touch-scrolling compatibility fix

**Files:**
- Modify: `src/APP/ItemDetail.vue:288-354`

**Interfaces:**
- Consumes: the existing `.app-content`, `.detail-tabs`, and nested `.tab-link` SCSS rules.
- Produces: unchanged DOM and behavior with explicit vertical touch handling and mobile momentum scrolling.

- [ ] **Step 1: Add vertical touch intent and momentum scrolling to `.app-content`**

In the existing `.app-content` rule, keep its current flex and overflow declarations and add:

```scss
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
```

The resulting beginning of the rule must remain structurally equivalent to:

```scss
.app-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 0;
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  -ms-overflow-style: none;
```

- [ ] **Step 2: Allow vertical gestures starting on the sticky tab bar and buttons**

Add `touch-action: pan-y;` once to `.detail-tabs` and once to its nested `.tab-link` rule, without changing `position: sticky`, `z-index`, button padding, or the Vue click handlers. The relevant rules must contain:

```scss
.detail-tabs {
  display: flex;
  touch-action: pan-y;
  /* existing declarations remain */

  .tab-link {
    /* existing declarations remain */
    touch-action: pan-y;
  }
}
```

### Task 3: Run regression checks and inspect the diff

**Files:**
- Test: `src/APP/itemDetailScrollSource.test.mjs`
- Test: `src/APP/discoverLayoutSource.test.mjs`
- Test: `src/APP/shopDetailSource.test.mjs`
- Modify: `src/APP/ItemDetail.vue`
- Generated: `dist/APP/index.html`

**Interfaces:**
- Consumes: the implementation from Task 2.
- Produces: passing APP source tests and a diff limited to the new regression test plus the three intended CSS declarations.

- [ ] **Step 1: Run the focused and neighboring APP tests**

Run:

```powershell
node --test src/APP/itemDetailScrollSource.test.mjs src/APP/discoverLayoutSource.test.mjs src/APP/shopDetailSource.test.mjs
```

Expected: all tests pass with zero failures.

- [ ] **Step 2: Check formatting and scope**

Run:

```powershell
git diff --check
git status --short
git diff -- src/APP/ItemDetail.vue src/APP/itemDetailScrollSource.test.mjs
```

Expected: no whitespace errors; only the new test and `ItemDetail.vue` are added/modified by this task. The pre-existing deleted ZIP files and untracked `docs/superpowers/plans/2026-08-05-meituan-mvu-card-layout.md` remain untouched.

### Task 4: Build and verify the live Tavern interaction

**Files:**
- Build output: generated by `pnpm build`; do not manually edit generated files.
- Runtime target: `http://127.0.0.1:8000/`, character chat “美人团外卖3.0beta4”.

**Interfaces:**
- Consumes: the production APP bundle generated from the changed source.
- Produces: evidence that the target package detail remains vertically scrollable from the tab bar and that the order button remains reachable.

- [ ] **Step 1: Build the production bundle**

Run:

```powershell
pnpm build
```

Expected: webpack exits with code 0 and emits the APP bundle without TypeScript, Vue, Sass, or webpack errors.

- [ ] **Step 2: Re-open the current Tavern chat and target the package detail**

Use the existing local Tavern page at `http://127.0.0.1:8000/`, open “美人团外卖3.0beta4”, enter `发现`, choose “半熟恋人·私密约会”, then choose “性感网红主播的私密档期”. Use the actual generated APP iframe, not a standalone source preview.

- [ ] **Step 3: Verify touch gestures from each relevant surface**

At the mobile viewport used for the report (`382px` iframe width), perform an upward and downward touch swipe starting on:

1. the tab bar background,
2. each of the three tab buttons,
3. the active tab content.

Expected: for tabs with content taller than the viewport, `#detail-content.scrollTop` changes in the swipe direction; the active tab remains unchanged after a vertical swipe; the tab bar remains usable for taps.

- [ ] **Step 4: Verify the order affordance and final scope**

Scroll to the bottom of the target detail page and click `立即下单`. Expected: the remark modal opens and `确认下单` remains within the modal’s visible action area. Finish with:

```powershell
git status --short
```

Expected: no unrelated user files are staged or modified by the implementation.

- [ ] **Step 5: Commit only the implementation and APP runtime files**

After all checks pass, commit only the implementation and regression test:

```powershell
git add -- src/APP/ItemDetail.vue src/APP/itemDetailScrollSource.test.mjs dist/APP/index.html
git commit -m "fix: preserve mobile detail tab scrolling"
```
