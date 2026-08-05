# APP Background Shop Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route Home category/search requests through the debug lab preset without creating chat messages, parse every successful shop response, and persist normalized shops globally by `shop_id`.

**Architecture:** Add a pure shop-cache merge module and a response-ingestion service. Add a headless generator that loads the debug workspace and reuses the existing direct/Tavern adapters. Home calls the headless generator; the debug lab keeps its UI flow and adds ingestion after successful responses. ShopStore remains the global API, backed by `updateVariablesWith`.

**Tech Stack:** Vue 3, TypeScript, Zod, Tavern Helper `generateRaw`, Tavern variables API.

## Global Constraints

- Preserve debug lab presets, raw JSON sending, history, direct API mode, and Tavern mode.
- Home background generation must not create chat messages or call `/send` or `/trigger`.
- Store valid shops globally, append new `shop_id` values, and replace matching `shop_id` values.
- Preserve manual deletion and cap persisted shops at 200.
- Use only APIs declared under `@types`.

---

### Task 1: Shop Cache Contract

**Files:**
- Create: `src/shared/shopCache.ts`
- Create: `src/shared/shopCache.test.ts`

**Interfaces:**
- Produces: `normalizeShopId`, `mergeShopsById`, and `removeShopById`.

- [ ] Write a test proving same `shop_id` replaces, new IDs append, malformed entries are discarded, and deletion uses normalized string IDs.
- [ ] Run the test and verify it fails because `shopCache.ts` does not exist.
- [ ] Implement the minimal pure cache helpers with a 200-item cap.
- [ ] Run the test and verify it passes.

### Task 2: Response Parsing And Persistence

**Files:**
- Create: `src/APP/services/shopGeneration.ts`
- Modify: `src/前端占位符脚本/index.ts`
- Test: `src/shared/shopCache.test.ts`

**Interfaces:**
- Consumes: `parseShopData`, `mergeShopsById`.
- Produces: `ingestShopResponse(text)` returning parsed/saved counts.

- [ ] Add a failing parser fixture test using the default preset's bracketed shop/package format.
- [ ] Implement ingestion with Zod-normalized parser output and ShopStore/global-variable persistence.
- [ ] Replace whole-table global writes with `updateVariablesWith` merge/delete/clear updates.
- [ ] Run cache/parser tests.

### Task 3: Shared Background Generation

**Files:**
- Create: `src/APP/调试台/api/workspaceGeneration.ts`
- Modify: `src/APP/Home.vue`
- Modify: `src/APP/调试台/useDebugLab.ts`

**Interfaces:**
- Produces: `generateFromDebugWorkspace(userInput, options)` returning response text and mode.
- Consumes: current debug workspace, macro resolver, payload builder, direct client, Tavern adapter, and response ingestion.

- [ ] Add a failing contract test proving `{{lastusermessage}}` is replaced from Home input without mutating the stored draft.
- [ ] Implement the headless generator with direct/Tavern cancellation support.
- [ ] Replace Home's Slash command path with the headless generator and ingestion feedback.
- [ ] Add ingestion to both successful debug lab send paths without changing response/history behavior.
- [ ] Run focused tests and lint.

### Task 4: Discover Store-First Loading

**Files:**
- Modify: `src/APP/Discover.vue`

**Interfaces:**
- Consumes: `window.ShopStore` and its update event.

- [ ] Make ShopStore the primary source of truth.
- [ ] Parse a legacy chat message only when the global cache is empty, then migrate valid shops into ShopStore.
- [ ] Preserve import and manual deletion.
- [ ] Run the full development build and inspect the bundled APP output.
