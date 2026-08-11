# APP 服务页最近订单与移动端信息密度优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 APP 服务页在没有活动订单时展示最近一条服务记录，并降低移动端首屏渲染与信息展示的垂直开销。

**Architecture:** 在共享订单规范化层增加纯函数 `selectActiveOrLatestOrders`，根据活动订单、原始 record 插入顺序或缓存时间戳产生显示集合和模式。`Service.vue` 只消费该派生结果，新增最近服务提示、稳定订单 key、按需渲染详情和紧凑移动端样式；不改 Zod MVU Schema 与世界书。

**Tech Stack:** Vue 3 SFC、TypeScript、SCSS、Zod MVU record、Node 内置测试运行器、Webpack/pnpm。

## Global Constraints

- `服务中的订单` 继续按 Zod MVU 的订单 ID record 读取，不增加时间戳或序号字段。
- 有活动订单时展示全部活动订单；没有活动订单时只展示最近一条；空 record 不回退旧缓存。
- 通过 MVU 正常数据读取的最近订单按 record 插入顺序取最后一项；脚本缓存按 `__cachedAt` 最大值取最新项。
- `.app-content` 继续是 APP 页面唯一纵向滚动容器，禁止在服务页子项目增加嵌套滚动。
- 详细内容必须按需渲染；触控控件沿用项目的 44px 目标和 reduced-motion 约束。
- 所有生产代码先有会失败的测试；每个红绿循环都必须运行并读取结果。
- 保护当前工作区已有的 dist 修改、ZIP 删除、计划文档和源文件修改，只修改本任务确认的文件。

---

### Task 1: Specify shared active-or-latest order selection

**Files:**
- Modify: `src/shared/serviceOrders.test.mjs`
- Inspect: `src/shared/serviceOrders.ts`

**Interfaces:**
- Consumes: existing `ServiceOrder`, `filterActiveOrders`, and normalized order IDs.
- Produces: failing tests for `selectActiveOrLatestOrders(orders: ServiceOrder[])` returning `{ orders, mode }`.

- [ ] **Step 1: Add the failing selector tests**

Update the import to include the not-yet-exported selector:

```js
import { loadOrdersFromMVU, selectActiveOrLatestOrders } from './serviceOrders.ts';
```

After the existing record normalization assertions, add:

```js
const finishedOld = { ...orders[0], id: 'ORDER_OLD' };
const finishedLatest = { ...orders[0], id: 'ORDER_LATEST' };
const active = { ...orders[0], id: 'ORDER_ACTIVE', status: '服务中' };

const activeDisplay = selectActiveOrLatestOrders([finishedOld, active, finishedLatest]);
assertEqual(activeDisplay.mode, 'active', '活动订单显示模式');
assertEqual(activeDisplay.orders.map(order => order.id), ['ORDER_ACTIVE'], '活动订单优先');

const recentDisplay = selectActiveOrLatestOrders([finishedOld, finishedLatest]);
assertEqual(recentDisplay.mode, 'recent', '最近订单显示模式');
assertEqual(recentDisplay.orders.map(order => order.id), ['ORDER_LATEST'], '原始 record 最后一项为最近订单');

const cachedDisplay = selectActiveOrLatestOrders([
  { ...finishedOld, __cachedAt: 10 },
  { ...finishedLatest, __cachedAt: 30 },
  { ...active, status: '服务结束', __cachedAt: 20 },
]);
assertEqual(cachedDisplay.orders.map(order => order.id), ['ORDER_LATEST'], '缓存按 __cachedAt 取最新订单');

assertEqual(selectActiveOrLatestOrders([]), { orders: [], mode: 'empty' }, '空订单集合保持空状态');
```

- [ ] **Step 2: Run the test to verify it fails for the missing production export**

Run:

```powershell
node --test src/shared/serviceOrders.test.mjs
```

Expected: FAIL because `serviceOrders.ts` does not yet export `selectActiveOrLatestOrders`.

### Task 2: Implement the shared selector minimally

**Files:**
- Modify: `src/shared/serviceOrders.ts` near `filterActiveOrders`/`filterCompletedOrders`
- Test: `src/shared/serviceOrders.test.mjs`

**Interfaces:**
- Consumes: normalized `ServiceOrder[]`; `__cachedAt` remains optional and is only used for cache-derived arrays.
- Produces: `ServiceOrderDisplayMode`, `ServiceOrderDisplay`, and `selectActiveOrLatestOrders` for APP pages.

- [ ] **Step 1: Add the display result types and selector**

Add this implementation without changing MVU extraction or cache loading:

```ts
export type ServiceOrderDisplayMode = 'active' | 'recent' | 'empty';

export interface ServiceOrderDisplay {
  orders: ServiceOrder[];
  mode: ServiceOrderDisplayMode;
}

function getLatestOrder(orders: ServiceOrder[]) {
  const cachedOrders = orders.filter(order => Number.isFinite(order.__cachedAt));
  if (cachedOrders.length > 0) {
    return cachedOrders.reduce((latest, order) =>
      (order.__cachedAt ?? 0) > (latest.__cachedAt ?? 0) ? order : latest,
    );
  }

  return orders[orders.length - 1];
}

export function selectActiveOrLatestOrders(orders: ServiceOrder[]): ServiceOrderDisplay {
  const active = filterActiveOrders(orders);
  if (active.length > 0) return { orders: active, mode: 'active' };
  if (orders.length === 0) return { orders: [], mode: 'empty' };

  const latest = getLatestOrder(orders);
  return latest ? { orders: [latest], mode: 'recent' } : { orders: [], mode: 'empty' };
}
```

- [ ] **Step 2: Run the shared selector test to verify it passes**

Run:

```powershell
node --test src/shared/serviceOrders.test.mjs
```

Expected: PASS, including existing record-key and falsy-value normalization assertions plus the new display-selection assertions.

### Task 3: Specify the Service.vue display and lazy-rendering contract

**Files:**
- Create: `src/APP/servicePageSource.test.mjs`
- Inspect: `src/APP/Service.vue`

**Interfaces:**
- Consumes: source-level DOM and SCSS contracts in `Service.vue`.
- Produces: failing source tests for display mode, recent notice, stable order key, lazy detail sections, and compact grid rules.

- [ ] **Step 1: Write source-contract tests before editing Service.vue**

Create:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./Service.vue', import.meta.url), 'utf8');

test('服务页使用共享订单显示选择器并标记最近服务模式', () => {
  assert.match(source, /selectActiveOrLatestOrders/);
  assert.match(source, /displayMode === 'recent'/);
  assert.match(source, /最近一次服务记录/);
  assert.match(source, /:key="girl\.id"/);
});

test('服务页按需渲染详情并使用移动端紧凑网格', () => {
  assert.match(source, /v-if="showDetails"/);
  assert.match(source, /v-if="showPsychology"/);
  assert.match(source, /v-if="showBody"/);
  assert.match(source, /v-if="showExperience"/);
  assert.match(source, /\.recent-order-notice/);
  assert.match(source, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
});
```

- [ ] **Step 2: Run the source test to verify it fails before the UI implementation**

Run:

```powershell
node --test src/APP/servicePageSource.test.mjs
```

Expected: FAIL because the current Service.vue lacks the shared selector, recent notice, lazy `v-if` detail content, and new compact-grid contract.

### Task 4: Wire display modes into Service.vue

**Files:**
- Modify: `src/APP/Service.vue` template and script sections
- Test: `src/shared/serviceOrders.test.mjs`, `src/APP/servicePageSource.test.mjs`

**Interfaces:**
- Consumes: `selectActiveOrLatestOrders`, `ServiceOrder`, and existing MVU refresh/cache functions.
- Produces: `girlsData`, `displayMode`, and `currentGirl` that always represent a valid active or recent display set.

- [ ] **Step 1: Add display mode state and one apply function**

Import the selector and types, then add:

```ts
import {
  loadOrdersFromMVU,
  readCachedOrders,
  selectActiveOrLatestOrders,
  type ServiceOrder,
  type ServiceOrderDisplayMode,
} from '../shared/serviceOrders';

const displayMode = ref<ServiceOrderDisplayMode>('empty');

function applyDisplayOrders(orders: ServiceOrder[]) {
  const display = selectActiveOrLatestOrders(orders);
  girlsData.value = display.orders;
  displayMode.value = display.mode;
  currentGirlIndex.value = Math.min(currentGirlIndex.value, Math.max(display.orders.length - 1, 0));
  return display;
}
```

Replace direct `filterActiveOrders` assignments in `refreshData` with `applyDisplayOrders(orders)` for both MVU data and cache fallback. Keep `loadOrdersFromMVU`'s explicit empty-object behavior unchanged.

- [ ] **Step 2: Align manual refresh notifications with display mode**

Use the display result so active orders keep the success toast and recent fallback gets an informational toast:

```ts
const display = applyDisplayOrders(orders);
if (display.mode === 'empty') {
  errorMessage.value = '未找到服务中的订单';
  console.log('[服务状态] 暂无服务数据');
} else if (notify && display.mode === 'recent') {
  toastr.info('当前无服务中的订单，展示最近一次服务记录', '服务状态');
} else if (notify) {
  toastr.success(`加载了 ${display.orders.length} 位女孩的服务数据`, '服务状态');
}
```

Keep MVU event refreshes silent by continuing to call `refreshData(false)`.

- [ ] **Step 3: Add the recent notice and stable order keys**

Immediately inside `.app-content`, add:

```vue
<div v-if="displayMode === 'recent'" class="recent-order-notice" role="status">
  <i class="fas fa-history"></i>
  <span>当前无服务中的订单，展示最近一次服务记录</span>
</div>
```

Change order tabs to `button type="button"` and use `:key="girl.id"`. Add a `最近服务` badge when `displayMode === 'recent'`; keep the computed order status sourced from the normalized order.

- [ ] **Step 4: Make detail panels lazy and preserve reset behavior**

Set `showDetails` to `ref(false)`, reset it to `false` in the current-girl watcher, and change the outer accordion plus its inner bodies from hidden-but-mounted content to conditional rendering:

```vue
<button type="button" class="accordion-header" :class="{ active: showDetails }" @click="showDetails = !showDetails">
  <span><i class="fas fa-info-circle accordion-icon"></i>详细信息</span>
  <i class="fas fa-chevron-down accordion-arrow" :class="{ active: showDetails }"></i>
</button>
<div v-if="showDetails" class="accordion-content show">
  <!-- existing detail body -->
</div>
```

Use the same button pattern for `.collapsible-header`, and render the three bodies with `v-if="showPsychology"`, `v-if="showBody"`, and `v-if="showExperience"`. Keep all existing data paths and icons.

- [ ] **Step 5: Run behavior and source tests**

Run:

```powershell
node --test src/shared/serviceOrders.test.mjs src/APP/servicePageSource.test.mjs
```

Expected: PASS with zero failures.

### Task 5: Apply mobile density and interaction styles

**Files:**
- Modify: `src/APP/Service.vue` style section
- Test: `src/APP/servicePageSource.test.mjs`

**Interfaces:**
- Consumes: existing APP CSS variables, `.app-content` scroll ownership, and Service.vue class names.
- Produces: compact, non-overflowing service summary and detail controls for narrow phone widths.

- [ ] **Step 1: Add the recent notice and control defaults**

Add scoped styles:

```scss
.recent-order-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-control);
  background: var(--bg-badge);
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.accordion-header,
.collapsible-header,
.tab-item {
  font: inherit;
}
```

- [ ] **Step 2: Reduce summary-card vertical cost**

Adjust the existing summary rules as follows:

```scss
.status-card {
  padding: clamp(12px, 3.5vw, 16px);
  margin-bottom: 10px;

  .status-header { margin-bottom: 12px; }

  .order-status-row {
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
    padding: 8px 10px;
  }

  .price-section {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: 'label value' 'name value' 'features features';
    align-items: center;
    gap: 4px 10px;
    padding: 10px 12px;
    margin-bottom: 12px;
    text-align: left;

    .price-label { grid-area: label; margin: 0; }
    .price-value { grid-area: value; margin: 0; font-size: 24px; }
    .package-name { grid-area: name; min-width: 0; margin: 0; overflow-wrap: anywhere; }
    .features-tags { grid-area: features; justify-content: flex-start; margin-top: 4px; }
  }

  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;

    .metric-card {
      min-width: 0;
      padding: 10px;
      .metric-label { margin-bottom: 4px; font-size: 12px; }
      .metric-value { margin-bottom: 5px; font-size: 22px; }
    }
  }
}
```

- [ ] **Step 3: Keep detail grids dense and safe on narrow screens**

Use `minmax(0, 1fr)` and `min-width: 0` for clothing, body-feature, and statistics grids. Reduce detail paddings and remove hover lift on coarse pointers:

```scss
.detail-section {
  .detail-card,
  .collapsible-group { min-width: 0; }

  .accordion-body,
  .collapsible-content { padding-inline: 12px; }

  .clothing-grid,
  .body-feature-grid .feature-row,
  .experience-stats .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .clothing-item,
  .feature-item,
  .stat-item,
  .desc-item,
  .psychology-item {
    min-width: 0;
    padding: 9px;
  }
}

@media (hover: none) and (pointer: coarse) {
  .status-card .metric-card:hover,
  .detail-section .feature-item:hover,
  .detail-section .stat-item:hover {
    transform: none;
    box-shadow: none;
  }
}
```

- [ ] **Step 4: Run the source UI contracts**

Run:

```powershell
node --test src/APP/servicePageSource.test.mjs src/APP/mobileUiSource.test.mjs src/APP/appScrollSource.test.mjs
```

Expected: PASS; the APP shell touch and scroll contracts remain green.

### Task 6: Run full verification and commit only confirmed task files

**Files:**
- Verify: `src/shared/serviceOrders.ts`, `src/shared/serviceOrders.test.mjs`, `src/APP/Service.vue`, `src/APP/servicePageSource.test.mjs`
- Generated artifact to inspect: `dist/APP/index.html`
- Preserve: every pre-existing dirty path shown by `git status --short`

**Interfaces:**
- Consumes: completed selector, Service.vue behavior, and mobile CSS.
- Produces: passing source tests, a successful production build, clean diff checks, and an intentionally scoped commit.

- [ ] **Step 1: Run all relevant Node tests**

Run:

```powershell
$testFiles = @(
  'src/shared/serviceOrders.test.mjs',
  'src/APP/servicePageSource.test.mjs',
  'src/APP/mobileUiSource.test.mjs',
  'src/APP/appScrollSource.test.mjs',
  'src/APP/itemDetailScrollSource.test.mjs',
  'src/APP/pageDataRefreshSource.test.mjs',
  'src/APP/discoverLayoutSource.test.mjs',
  'src/APP/shopDetailSource.test.mjs',
  'src/APP/utils.test.mjs',
  'src/APP/story/orderPrompts.test.mjs'
)
node --test $testFiles
```

Expected: every listed test passes with zero failures.

- [ ] **Step 2: Run the production build and inspect the APP artifact**

Run:

```powershell
pnpm build
```

Expected: webpack exits with code 0. Then inspect the APP artifact:

```powershell
rg -n "最近一次服务记录|repeat\\(2,minmax\\(0,1fr\\)\\)|recent-order-notice" dist/APP/index.html
```

If the build rewrites unrelated `dist/**` entries, leave pre-existing user changes untouched and stage only the APP artifact if its diff is attributable to this source change.

- [ ] **Step 3: Inspect final scope and formatting**

Run:

```powershell
git status --short
git diff --check
git diff --stat -- src/shared/serviceOrders.ts src/shared/serviceOrders.test.mjs src/APP/Service.vue src/APP/servicePageSource.test.mjs dist/APP/index.html
```

Expected: no whitespace errors; unrelated existing files remain unstaged.

- [ ] **Step 4: Commit only the confirmed implementation files**

After reviewing the scoped diff, stage only the task files:

```powershell
git add -- src/shared/serviceOrders.ts src/shared/serviceOrders.test.mjs src/APP/Service.vue src/APP/servicePageSource.test.mjs dist/APP/index.html
git diff --cached --check
git commit -m "feat: improve service page recent order display"
```

Expected: one implementation commit containing no unrelated dirty-worktree changes.
