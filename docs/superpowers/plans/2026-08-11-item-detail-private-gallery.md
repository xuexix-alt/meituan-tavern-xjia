# APP Private Photo Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn only the package detail page's private-photo tab into a single-column portrait gallery that supports today's text prompts and future image URLs.

**Architecture:** Keep `image1`, `image2`, and `image3` as the only data inputs. Add a local presentation helper that recognizes URL/data-URL values; the template renders a shared gallery card with either an image media stage or the existing prompt text. Scope all new CSS under `.private-photo-panel` so the other detail tabs and the shared scroll shell remain unchanged.

**Tech Stack:** Vue 3 SFC, TypeScript, scoped SCSS, Node built-in test runner, Webpack, Chrome Tavern iframe verification.

## Global Constraints

- Change only the private-photo tab presentation; do not change data parsing or MVU schema fields.
- Preserve the existing `#detail-content` / `.app-content` scroll container and sticky tabs.
- Render current non-URL strings as readable prompt text; do not invent image assets.
- Use a single vertical column and prevent horizontal overflow on narrow Tavern iframes.
- Preserve unrelated dirty worktree changes and audit broad `dist/**` rewrites after `pnpm build`.

---

### Task 1: Add the failing gallery source contract

**Files:**
- Create: `src/APP/privatePhotoGallerySource.test.mjs`
- Inspect: `src/APP/ItemDetail.vue`

**Interfaces:**
- Consumes: the private-photo template and scoped style blocks in `ItemDetail.vue`.
- Produces: source assertions for the private panel class, URL-aware media branch, three labels, and portrait gallery CSS.

- [x] **Step 1: Write the failing test**

Create the source contract below:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./ItemDetail.vue', import.meta.url), 'utf8');

test('私密写真使用独立的单列画廊面板并保留三个图片标签', () => {
  assert.match(source, /private-photo-panel/);
  assert.match(source, /露脸图/);
  assert.match(source, /时装秀/);
  assert.match(source, /私密拍/);
});

test('私密写真画廊支持图片 URL 与文字提示词两种展示状态', () => {
  assert.match(source, /isImageSource/);
  assert.match(source, /image-placeholder/);
  assert.match(source, /image-gallery-media/);
});

test('私密写真画廊使用单列竖版比例并允许提示词自适应高度', () => {
  assert.match(source, /private-photo-panel[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(source, /private-photo-panel\.active[\s\S]*display:\s*grid/);
  assert.match(source, /image-gallery-media[\s\S]*aspect-ratio:\s*4\s*\/\s*5/);
  assert.match(source, /image-placeholder[\s\S]*min-height:[^;]+;[\s\S]*height:\s*auto/);
});
```

- [x] **Step 2: Run the test to verify it fails**

Run:

```powershell
node --test src/APP/privatePhotoGallerySource.test.mjs
```

Expected: FAIL because `ItemDetail.vue` currently has no private gallery panel, URL branch, or portrait gallery declarations.

### Task 2: Implement the private-photo gallery presentation

**Files:**
- Modify: `src/APP/ItemDetail.vue:65-85` for the private-photo template.
- Modify: `src/APP/ItemDetail.vue:240-245` for the local URL predicate.
- Modify: `src/APP/ItemDetail.vue:502-525` for private-photo-only SCSS.

**Interfaces:**
- Consumes: `itemData.image1`, `itemData.image2`, and `itemData.image3` as strings.
- Produces: `isImageSource(value: unknown): boolean` and a private gallery card structure used only by the images tab.

- [x] **Step 1: Add the URL predicate before the component mount hook**

Add this local helper after `submissionError`:

```ts
function isImageSource(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const source = value.trim();
  return /^(?:https?:\/\/|data:image\/|blob:)/i.test(source);
}
```

- [x] **Step 2: Replace only the private-photo markup**

Replace the current three `.image-item` blocks with a single-column gallery panel using the existing fields:

```vue
<div class="tab-content private-photo-panel" :class="{ active: activeTab === 'images' }">
  <div
    v-for="photo in [
      { label: '露脸图', value: itemData?.image1 },
      { label: '时装秀', value: itemData?.image2 },
      { label: '私密拍', value: itemData?.image3 },
    ]"
    :key="photo.label"
    class="image-item"
  >
    <div class="image-gallery-header">
      <h5>{{ photo.label }}</h5>
      <span class="image-gallery-status">
        {{ isImageSource(photo.value) ? '已生成' : '待生成' }}
      </span>
    </div>
    <div class="image-gallery-card">
      <div v-if="isImageSource(photo.value)" class="image-gallery-media">
        <img :src="photo.value" :alt="photo.label" loading="lazy" />
      </div>
      <div v-else class="image-placeholder">
        <i class="fas fa-camera-retro" aria-hidden="true"></i>
        <span>{{ photo.value || '暂无生成提示词' }}</span>
      </div>
    </div>
  </div>
</div>
```

- [x] **Step 3: Add scoped single-column portrait gallery styles**

Replace the old `.image-item` block with styles scoped to the private panel:

```scss
.private-photo-panel {
  grid-template-columns: 1fr;
  gap: 18px;
  padding: 16px var(--space-page) 36px;
}

.private-photo-panel.active {
  display: grid;
}

.private-photo-panel .image-item {
  min-width: 0;
  margin: 0;
}

.image-gallery-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.image-gallery-header h5 {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.image-gallery-status {
  color: var(--text-placeholder);
  font-size: 0.75rem;
}

.image-gallery-card {
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
}

.image-gallery-media {
  aspect-ratio: 4 / 5;
  background: var(--bg-primary);
}

.image-gallery-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.private-photo-panel .image-placeholder {
  display: flex;
  min-height: 180px;
  height: auto;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 10px;
  padding: 18px;
  border: 0;
  border-radius: 0;
  background: var(--bg-card-light);
  color: var(--text-primary);
  font-size: 0.95rem;
  line-height: 1.75;
  overflow-wrap: anywhere;
  text-align: left;
}

.private-photo-panel .image-placeholder i {
  flex: 0 0 auto;
  margin-top: 3px;
  color: var(--accent-primary);
}

@media (max-width: 380px) {
  .private-photo-panel {
    padding-inline: 12px;
  }
}
```

- [x] **Step 4: Run focused tests to verify the implementation passes**

Run:

```powershell
node --test src/APP/privatePhotoGallerySource.test.mjs src/APP/itemDetailScrollSource.test.mjs src/APP/mobileUiSource.test.mjs
```

Expected: all focused tests pass, including the existing detail scroll and mobile interaction contracts.

### Task 3: Build, scope generated output, and verify the real Tavern iframe

**Files:**
- Generated runtime artifact: `dist/APP/index.html`
- Keep only APP output tied to this change; restore unrelated generated outputs and preserve all pre-existing user edits.

**Interfaces:**
- Consumes: the completed `ItemDetail.vue` template and styles.
- Produces: a rebuilt APP iframe artifact with the private gallery CSS and URL branch.

- [x] **Step 1: Run all APP source tests and build**

Run:

```powershell
$tests = rg --files src/APP -g '*.test.mjs' -g '*.test.js'
node --test $tests
pnpm build
```

Expected: all tests pass and webpack exits with code 0; existing bundle-size/Browserslist warnings may remain.

- [x] **Step 2: Verify generated scope and formatting**

Run:

```powershell
git diff --check
rg -n -- "private-photo-panel|image-gallery-media|aspect-ratio:4/5|已生成|待生成" dist/APP/index.html
git status --short
```

Expected: `dist/APP/index.html` contains the gallery branch/styles, `git diff --check` is clean, and unrelated `dist/**` changes are restored without touching existing user changes.

- [x] **Step 3: Refresh the real Tavern iframe and inspect the private-photo tab**

Open the current `127.0.0.1:8000` APP chat, enter a package detail, select “私密写真”, and wait for the iframe to finish loading. Verify:

```js
(() => {
  const panel = document.querySelector('.private-photo-panel');
  const cards = [...document.querySelectorAll('.private-photo-panel .image-gallery-card')];
  return {
    panelDisplay: getComputedStyle(panel).display,
    panelColumns: getComputedStyle(panel).gridTemplateColumns,
    cardCount: cards.length,
    firstCardWidth: cards[0]?.getBoundingClientRect().width ?? 0,
    contentOverflowY: getComputedStyle(document.querySelector('.app-content')).overflowY,
  };
})()
```

Expected: `panelDisplay === 'grid'`, one `gridTemplateColumns` track, three cards, no horizontal overflow, and the original `.app-content` remains the only vertical scroll container.

Observed: after rebuilding and refreshing the live Tavern iframe, the private panel reported `display: grid`, one column, three cards, `overflow-y: auto`, and `touch-action: pan-y`. Current text prompts produced adaptive card heights of 180px, 195.562px, and 195.562px; no fixed-height text clipping was observed in the screenshot.
