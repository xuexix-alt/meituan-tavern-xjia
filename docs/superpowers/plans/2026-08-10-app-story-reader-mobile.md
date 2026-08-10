# APP Story Reader Mobile Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the APP story reader taller on mobile, add a home shortcut in the bottom composer, and let users permanently take over the scroll position during a streaming response.

**Architecture:** Keep the existing `/story` three-row grid and its independent `.reader-scroll` container. Increase only the mobile story shell's width-based minimum height, add a bottom composer navigation button, and guard the existing `raw` watcher with a local `shouldAutoFollow` flag that resets only when a new streaming generation begins.

**Tech Stack:** Vue 3 Composition API, Vue Router 4 memory history, scoped SCSS, Node `node:test`, webpack 5, pnpm.

## Global Constraints

- Keep the story reader inside the existing `src/APP` route and do not change Tavern message persistence, generation, rollback, or history logic.
- Do not use `vh` or `dvh` to force iframe height; use the existing width/aspect-ratio/min-height approach.
- Preserve the existing header back action as `router.back()` and route the new bottom home shortcut to `/home`.
- Manual touch movement or wheel scrolling must disable automatic following for the current response; later stream updates must not write `scrollTop` until a new stream starts.
- Preserve unrelated dirty-worktree files and stage only files directly related to this feature and the APP build output.

---

### Task 1: Add failing source-contract tests

**Files:**
- Create: `src/APP/story/storyReaderMobileSource.test.mjs`
- Read: `src/APP/app.vue`
- Read: `src/APP/story/StoryReader.vue`

**Interfaces:**
- Consumes the current Vue SFC source text from `app.vue` and `StoryReader.vue`.
- Produces source-level checks for the mobile shell height, footer home button, and scroll-follow state used by the implementation task.

- [ ] **Step 1: Write the failing source-contract test**

Create `src/APP/story/storyReaderMobileSource.test.mjs` with these tests:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const appSource = fs.readFileSync(new URL('../app.vue', import.meta.url), 'utf8');
const readerSource = fs.readFileSync(new URL('./StoryReader.vue', import.meta.url), 'utf8');

test('移动端正文外壳为阅读区保留更高的纵向空间', () => {
  assert.match(
    appSource,
    /\.phone-frame\.is-story-reader\s*\{[\s\S]*?min-height:\s*min\(980px,\s*calc\(100vw\s*\*\s*1\.85\)\)/,
  );
});

test('正文页在底部输入区提供独立的首页快捷按钮', () => {
  assert.match(readerSource, /class="reader-home-button"/);
  assert.match(readerSource, /aria-label="返回上一页"/);
  assert.match(readerSource, /aria-label="返回首页"/);
  assert.match(readerSource, /router\.replace\(['"]\/home['"]\)/);
  assert.match(readerSource, /fa-house/);
});

test('流式正文的自动跟随受手动滚动开关保护', () => {
  assert.match(readerSource, /const shouldAutoFollow = ref\(true\)/);
  assert.match(readerSource, /function handleManualScrollIntent\(\)[\s\S]*?shouldAutoFollow\.value\s*=\s*false/);
  assert.match(readerSource, /@touchmove(?:\.passive)?="handleManualScrollIntent"/);
  assert.match(readerSource, /@wheel(?:\.passive)?="handleManualScrollIntent"/);
  assert.match(
    readerSource,
    /if\s*\(scroller\s*&&\s*shouldAutoFollow\.value\)[\s\S]*?scroller\.scrollTop\s*=\s*scroller\.scrollHeight/s,
  );
});
```

- [ ] **Step 2: Run the new test and verify it fails for the expected missing contracts**

Run:

```powershell
node --test src/APP/story/storyReaderMobileSource.test.mjs
```

Expected: FAIL because the current source still uses the smaller mobile height, has only the back/history buttons, and always assigns `scrollTop` in the raw-content watcher.

- [ ] **Step 3: Commit the failing test**

```powershell
git add -- src/APP/story/storyReaderMobileSource.test.mjs
git commit -m "test: specify mobile story reader behavior"
```

### Task 2: Implement the mobile shell, bottom navigation, and scroll handoff

**Files:**
- Modify: `src/APP/app.vue:320-326`
- Modify: `src/APP/story/StoryReader.vue:3-6,129-190,194-326`
- Test: `src/APP/story/storyReaderMobileSource.test.mjs`

**Interfaces:**
- Consumes `router` from `useRouter()` and `session.status.value` from the existing story session.
- Produces a bottom `reader-home-button`, a `/home` replacement navigation action, and a local `shouldAutoFollow` state for the existing reader scroller.

- [ ] **Step 1: Increase only the mobile story shell height**

In `src/APP/app.vue`, change the existing story-reader mobile rule to:

```scss
@media (max-width: 768px) {
  .phone-frame.is-story-reader {
    width: 100%;
    min-height: min(980px, calc(100vw * 1.85));
    border-radius: 10px;
  }
}
```

Keep the desktop `3 / 4` aspect ratio and all normal APP shell rules unchanged.

- [ ] **Step 2: Add the home button to the bottom composer**

Keep the existing header buttons unchanged. Add this button as the first child of `.reader-composer`, before the textarea; leave the send button as the right-side control:

```vue
<button
  type="button"
  class="reader-home-button"
  aria-label="返回首页"
  title="返回首页"
  @click="router.replace('/home')"
>
  <i class="fas fa-house"></i>
</button>
```

Update the composer grid without changing the title, back, history, or send behavior:

```scss
.reader-composer {
  grid-template-columns: 48px minmax(0, 1fr) 48px;
}

.reader-home-button {
  width: 48px;
  min-height: 48px;
  align-self: end;
  border: 0;
  border-radius: 50%;
  background: var(--bg-card-light);
  color: var(--text-primary);
}

.reader-home-button:active {
  background: var(--bg-item-hover);
}
```

Keep the existing `min-height: 44px` on the header `.icon-button` and the new 48px home button so all controls remain touch-safe. On narrow widths, the textarea remains the flexible middle column and the grid must not overflow horizontally.

- [ ] **Step 3: Add the manual scroll handoff state**

In `StoryReader.vue`, keep `ref` in the existing Vue import and add:

```ts
const shouldAutoFollow = ref(true);

function handleManualScrollIntent(): void {
  shouldAutoFollow.value = false;
}

async function scrollToLatest(): Promise<void> {
  await nextTick();
  const scroller = readerScroller.value;
  if (scroller && shouldAutoFollow.value) {
    scroller.scrollTop = scroller.scrollHeight;
  }
}
```

Add the input handlers to the existing `<main>` element:

```vue
<main
  ref="readerScroller"
  class="reader-scroll"
  @touchmove.passive="handleManualScrollIntent"
  @wheel.passive="handleManualScrollIntent"
>
```

Replace the unconditional raw watcher with this guarded flow:

```ts
watch(
  () => session.status.value,
  async (status, previousStatus) => {
    if (status !== 'streaming' || previousStatus === 'streaming') return;
    shouldAutoFollow.value = true;
    await scrollToLatest();
  },
  { immediate: true },
);

watch(
  () => latestAssistant.value?.raw,
  async () => {
    await scrollToLatest();
  },
);
```

The raw watcher therefore keeps the existing “show the newest text” behavior while `shouldAutoFollow` is true, stops immediately after a touch swipe or wheel action, and cannot reclaim the user's position until the next `streaming` transition resets the flag.

- [ ] **Step 4: Run the source-contract test and verify it passes**

Run:

```powershell
node --test src/APP/story/storyReaderMobileSource.test.mjs
```

Expected: PASS with 3 tests.

- [ ] **Step 5: Commit the source implementation**

```powershell
git add -- src/APP/app.vue src/APP/story/StoryReader.vue src/APP/story/storyReaderMobileSource.test.mjs
git commit -m "feat: improve mobile story reader navigation"
```

### Task 3: Build and verify the APP artifact

**Files:**
- Modify: `dist/APP/index.html` (only if generated content changes)
- Modify: `dist/APP/index.js.LICENSE.txt` (only if generated license content changes)
- Read: all other generated files reported by the build

**Interfaces:**
- Consumes the updated APP Vue sources through the existing webpack configuration.
- Produces the runtime-loaded `dist/APP/index.html` artifact with the new story reader implementation.

- [ ] **Step 1: Run the targeted source test and whitespace check**

Run:

```powershell
node --test src/APP/story/storyReaderMobileSource.test.mjs
git diff --check
```

Expected: the source test passes and `git diff --check` reports no errors.

- [ ] **Step 2: Build the project**

Run:

```powershell
pnpm build
```

Expected: webpack completes successfully. Existing asset-size and browserslist warnings may remain non-fatal.

- [ ] **Step 3: Confirm the generated APP entry contains the new runtime markers**

Run:

```powershell
Select-String -Path dist/APP/index.html -Pattern 'reader-home-button','返回首页','185vw'
```

Expected: `dist/APP/index.html` contains the compiled home shortcut and the larger mobile shell rule (`185vw`; webpack simplifies `calc(100vw * 1.85)`). The minified auto-follow logic is verified by the source test, because webpack may rename `shouldAutoFollow` in the generated script.

- [ ] **Step 4: Audit generated changes before staging**

Run:

```powershell
git status --short
git diff --name-only
```

Keep existing user edits and stage only the updated APP source/test files plus the APP artifact required by this task. Do not stage unrelated generated outputs such as other `dist/*` entries, the pre-existing ZIP deletions, `src/美人团/schema.json`, or the existing untracked plan.

- [ ] **Step 5: Commit the verified APP artifact**

```powershell
git add -- src/APP/app.vue src/APP/story/StoryReader.vue src/APP/story/storyReaderMobileSource.test.mjs dist/APP/index.html dist/APP/index.js.LICENSE.txt
git commit -m "build: update mobile story reader artifact"
```

### Task 4: Verify the behavior in the real Tavern runtime

**Files:**
- Read: `dist/APP/index.html`
- Runtime: `http://127.0.0.1:8000`

**Interfaces:**
- Consumes the freshly built APP artifact loaded by the Tavern Helper renderer.
- Produces runtime evidence for mobile layout, navigation, and streaming scroll ownership.

- [ ] **Step 1: Load the fresh APP artifact in the Tavern page**

Reload the actual APP iframe after `pnpm build`, wait for the reader content to render, and confirm the loaded iframe is using the current `dist/APP/index.html` rather than an older remote or cached bundle.

- [ ] **Step 2: Verify the mobile layout and navigation**

At a narrow mobile viewport, open `/story` and verify:

1. The reader shell is visibly taller than the previous build.
2. The middle reading area has additional height and remains independently scrollable.
3. The arrow returns to the previous APP route.
4. The house button in the bottom-left composer replaces the route with `/home`.

- [ ] **Step 3: Verify streaming scroll ownership**

During a real streaming response:

1. Confirm the reader follows new output while untouched.
2. Swipe upward or downward inside the reader content.
3. Wait for several more stream updates and confirm the scroll position is not changed by the APP.
4. Start a new streaming response and confirm automatic following is enabled again.

- [ ] **Step 4: Record verification status without claiming untested runtime behavior**

Report separately which checks passed in source/build and which checks were confirmed in the live Tavern iframe. Do not treat a successful `pnpm build` as proof that a remote or cached deployment has updated.
