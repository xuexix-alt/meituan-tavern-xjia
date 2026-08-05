# APP Root Generation Task Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep Home-triggered shop generation alive across APP route changes and expose a persistent, actionable status bar on every page.

**Architecture:** A Vue singleton owns the request lifecycle, cancellation controller, result ingestion, and transient completion state. `App.vue` renders one root-level status component while `Home.vue` only starts tasks, so route component unmounts no longer cancel active generation.

**Tech Stack:** Vue 3 Composition API, TypeScript, Vue Router, Tavern Helper `generateRaw`, existing shop parser/cache services, SCSS.

## Global Constraints

- Tasks persist only within the current APP iframe and current SillyTavern chat.
- APP route changes must not cancel active generation.
- Chat changes, iframe refresh, pagehide, and 6621 hot reload may cancel active generation.
- Only one Home generation task may run at a time.
- Debug lab behavior and history remain unchanged.
- Shop results continue to use global `shop_store_cache` and `shop_id` merge semantics.

---

### Task 1: Root Generation Task Manager

**Files:**
- Create: `src/APP/services/generationTask.ts`
- Create: `src/APP/services/generationTask.test.ts`

**Interfaces:**
- Consumes: `generateFromDebugWorkspace(input, { signal })` and `ingestShopResponse(text)`.
- Produces: `createGenerationTask(dependencies?)`, singleton `generationTask`, reactive `state`, computed `isBusy`, and methods `start(input, label)`, `cancel()`, `dismiss()`, `dispose()`.

- [ ] Write a failing test with deferred generation proving that state becomes `running`, a second start is rejected, route-like caller disappearance does not cancel, success reports parsed/package counts, explicit cancel aborts, and parser-empty responses become `error`.
- [ ] Run `pnpm exec ts-node --transpile-only src/APP/services/generationTask.test.ts` with CommonJS compiler options and verify the missing module failure.
- [ ] Implement the minimal singleton task controller with states `idle`, `running`, `parsing`, `success`, `error`, and `cancelled`; auto-dismiss success after 8 seconds and cancellation after a short delay.
- [ ] Re-run the task test and verify all state transitions pass.

### Task 2: Global Generation Status Bar

**Files:**
- Create: `src/APP/components/GenerationStatus.vue`
- Modify: `src/APP/app.vue`

**Interfaces:**
- Consumes: `generationTask.state`, `generationTask.isBusy`, `cancel()`, `dismiss()`, and Vue Router.
- Produces: one root-level status band visible across every APP route.

- [ ] Add component-level rendering cases for running, parsing, success, error, and cancelled, using Font Awesome icons, elapsed seconds, accessible icon buttons, and a success command that routes to `/discover`.
- [ ] Mount the component above `RouterView` in `App.vue`; apply a root class while visible and reserve exactly 48px so it never overlaps page headers.
- [ ] Register `pagehide` and root unmount cleanup that calls `generationTask.dispose()`; remove listeners during unmount.
- [ ] Run targeted ESLint on the new component and `app.vue`.

### Task 3: Home Integration

**Files:**
- Modify: `src/APP/Home.vue`

**Interfaces:**
- Consumes: singleton `generationTask.start(input, label)` and `generationTask.isBusy`.
- Produces: category, search, and DLC triggers whose requests survive Home route unmount.

- [ ] Replace Home's local `AbortController`, request parsing, toast lifecycle, and `onBeforeUnmount(cancelGeneration)` with the root task manager.
- [ ] Keep current keyword assembly exactly, give each task a short visible label, and map the Home search button to the global cancel action while busy.
- [ ] Preserve category and DLC disabled behavior while a task is running or parsing.
- [ ] Run the task contracts and targeted ESLint for `Home.vue`.

### Task 4: Verification and Tavern Live Test

**Files:**
- Regenerate: `dist/APP/index.html`

**Interfaces:**
- Consumes: the 6621 watcher and Playwright SillyTavern session.
- Produces: evidence that generation survives APP navigation and still writes discover data without new chat floors.

- [ ] Run all shop/task/workspace contract tests and targeted ESLint.
- [ ] Run `pnpm build:dev` and verify Webpack exits successfully.
- [ ] In Playwright, start a Home category generation, immediately navigate to Discover, and verify the root status remains visible and reaches success.
- [ ] Verify chat message IDs are unchanged, `shop_store_cache` contains parsed shops, Discover refreshes, and browser console reports zero errors.
- [ ] Explicitly cancel one live task from the status bar and verify the UI reports `cancelled`; treat the expected SillyTavern backend `AbortError` as cancellation rather than API failure.
