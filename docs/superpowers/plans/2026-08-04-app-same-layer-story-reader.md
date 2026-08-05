# APP Same-Layer Story Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a root-owned same-layer story session, vertical-Pad `/story` reader, centered story entry, and order-to-story submission flow with correct streaming Tavern display regexes.

**Architecture:** `createStorySession()` is a dependency-injected service that owns transcript state, generation, persistence, rollback, and event refresh. `app.vue` creates one instance, provides it to routes, and owns host-floor hiding for the APP lifetime. Reader components consume the session; order pages submit plain instructions through a small bridge and navigate only after acceptance.

**Tech Stack:** Vue 3 Composition API, Vue Router memory history, Tavern Helper typed globals, SCSS, TypeScript tests run through `ts-node --transpile-only`, Webpack 5.

## Global Constraints

- Do not change shop discovery generation, debug-lab presets, or `shop_store_cache` behavior.
- Persist story turns as real Tavern user/assistant messages with `is_hidden: false`.
- Never hide or delete the APP carrier message returned by `getCurrentMessageId()`.
- Streaming display regexes use `formatAsTavernRegexedString`; `formatAsDisplayedMessage` receives only persisted message IDs.
- Intentional empty regex output remains empty.
- `/story` uses an `820px` maximum width and `3 / 4` aspect ratio without `vh` sizing.
- Preserve unrelated dirty-worktree changes.

---

### Task 1: Streaming Display Renderer

**Files:**
- Create: `src/APP/story/storyDisplay.ts`
- Test: `src/APP/story/storyDisplay.test.ts`

**Interfaces:**
- Produces: `renderStreamingStoryHtml(text, role, applyRegex?): string`
- Produces: `escapeStoryHtml(text): string`

- [ ] Write tests for partial XML replacement, HTML beautification, intentional empty output, unchanged unsafe XML, and API failure.
- [ ] Run the test and verify it fails because `storyDisplay.ts` is missing.
- [ ] Implement a result-aware regex wrapper that distinguishes success from failure and maps assistant/user/system to `ai_output`/`user_input`/`world_info`.
- [ ] Run the focused test and verify all cases pass.

### Task 2: Host Floor Visibility

**Files:**
- Create: `src/APP/story/hostFloorVisibility.ts`
- Test: `src/APP/story/hostFloorVisibility.test.ts`

**Interfaces:**
- Produces: `createHostFloorVisibilityController(options)` with `apply`, `replace`, `clear`, `reserve`, `reapply`, and `destroy`.

- [ ] Write tests for carrier exclusion, owned attributes, duplicate host nodes, replacement, and cleanup.
- [ ] Run the test and verify the module is missing.
- [ ] Implement the controller with host-document discovery, dynamic CSS, and a `MutationObserver`.
- [ ] Run the focused test and verify it passes.

### Task 3: Story Session Core

**Files:**
- Create: `src/APP/story/storyTypes.ts`
- Create: `src/APP/story/storyTranscript.ts`
- Create: `src/APP/story/storySession.ts`
- Create: `src/APP/story/storyContext.ts`
- Test: `src/APP/story/storySession.test.ts`

**Interfaces:**
- Produces: `StorySession`, `StoryTranscriptItem`, `StoryStatus`.
- Produces: `createStorySession(dependencies): StorySession`.
- Produces: `provideStorySession(session)` and `useStorySession()`.
- `StorySession.submitPrompt(text)` resolves to `{ accepted: true }` or `{ accepted: false, error }`.

- [ ] Write tests proving user-create, generate, assistant-create order; streaming generation-ID filtering; cancellation; retry-safe failures; regeneration; and carrier-safe rollback.
- [ ] Run the focused test and verify it fails for missing session modules.
- [ ] Implement bounded transcript normalization and persisted final-HTML preference.
- [ ] Implement the root session state machine and dependency-injected Tavern operations.
- [ ] Add mounted event binding and deterministic disposal without coupling the pure session tests to Vue lifecycle.
- [ ] Run the focused tests and verify they pass.

### Task 4: Reader Components and Route

**Files:**
- Create: `src/APP/story/StoryMessageBody.vue`
- Create: `src/APP/story/StoryReader.vue`
- Create: `src/APP/story/StoryHistoryOverlay.vue`
- Create: `src/APP/Story.vue`
- Modify: `src/APP/界面.ts`

**Interfaces:**
- Consumes: root `StorySession`.
- Produces: lazy `/story` route and complete reader controls.

- [ ] Add a source-contract test asserting the lazy route and required reader/session controls.
- [ ] Run it and verify failure before creating the components.
- [ ] Implement latest-assistant reading, related-user accordion, bounded history overlay, error/empty states, and responsive body rendering.
- [ ] Implement composer submission, stop, regenerate, and rollback confirmation.
- [ ] Register `/story` lazily.
- [ ] Run source tests and TypeScript/build checks.

### Task 5: Root Ownership, Pad Shell, and Centered Story Entry

**Files:**
- Create: `src/APP/components/StoryEntry.vue`
- Modify: `src/APP/app.vue`
- Test: `src/APP/story/storyIntegrationSource.test.ts`

**Interfaces:**
- Consumes: `createStorySession`, `provideStorySession`, and router state.
- Produces: one APP-lifetime session, centered entry, and route-dependent shell class.

- [ ] Write source assertions for one root session, provider wiring, centered entry, story-route class, `820px`, and `3 / 4`.
- [ ] Run and verify expected failure.
- [ ] Create and provide the session in `app.vue`, bind/dispose it with the APP lifecycle, and mount `StoryEntry` outside routed pages.
- [ ] Implement the centered elevated entry with accessible status and route navigation.
- [ ] Add `.is-story-reader` shell dimensions and narrow-width behavior.
- [ ] Run the focused test and build.

### Task 6: Order Submission Bridge

**Files:**
- Create: `src/APP/story/orderPrompts.ts`
- Create: `src/APP/story/orderSubmission.ts`
- Test: `src/APP/story/orderSubmission.test.ts`
- Modify: `src/APP/ItemDetail.vue`
- Modify: `src/APP/History.vue`

**Interfaces:**
- Produces: `buildPackageOrderPrompt(input): string`.
- Produces: `buildRepeatOrderPrompt(input): string`.
- Produces: `submitOrderToStory(session, router, text): Promise<OrderSubmissionResult>`.

- [ ] Write tests preserving current Chinese instruction text while excluding `/send`, `/trigger`, and pipe syntax.
- [ ] Write tests that navigation occurs only after session acceptance.
- [ ] Run and verify missing-module failures.
- [ ] Implement prompt builders and the submission bridge.
- [ ] Replace `triggerSlash` in `ItemDetail.vue` and `History.vue`; keep modals open on rejection and show the returned error.
- [ ] Run focused tests and source checks proving the old slash chain is absent from these handlers.

### Task 7: Full Verification

**Files:**
- Modify generated `dist/APP/index.html` only through the normal build.

- [ ] Run every APP/shared focused TypeScript test.
- [ ] Run `pnpm exec vue-tsc --noEmit` and record any pre-existing versus introduced failures.
- [ ] Run `pnpm build` and verify APP output is regenerated.
- [ ] Start or reuse the local server and verify `/story` in Playwright at desktop and mobile widths.
- [ ] In Tavern, verify an order streams into the reader, partial XML display regexes apply, final HTML persists, and host floors do not flash.
- [ ] Review `git diff --check` and confirm unrelated dirty files were not reverted.
