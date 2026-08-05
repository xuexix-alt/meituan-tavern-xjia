# DeepSeek Prompt Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local React workbench that composes, inspects, sends, streams, and records DeepSeek or other OpenAI-compatible Chat Completions requests.

**Architecture:** A React/Vite browser client owns structured prompt state, raw JSON state, presets, history, and diagnostics. A small Express server accepts localhost-only forwarding requests, injects the browser-supplied authorization credential, and relays JSON or SSE upstream without persisting secrets.

**Tech Stack:** Node.js 22+, pnpm 10+, React, TypeScript, Vite, Express, Zod, dnd-kit, Lucide React, Vitest, Testing Library, Supertest, and Playwright.

## Global Constraints

- The tool is local and single-user; it is not designed for internet-facing deployment.
- DeepSeek defaults to `https://api.deepseek.com`, while base URL and model remain editable.
- API key, settings, presets, and history are browser-local; the proxy never writes or logs credentials.
- OpenAI-compatible `system`, `user`, `assistant`, and `tool` roles are the portable baseline.
- Structured and raw JSON edits use explicit two-way synchronization; no dirty raw draft is overwritten silently.
- Model HTML is never rendered; output is displayed as text.
- The model-list endpoint is optional and manual model entry always remains available.
- The recent request history is sanitized and capped at 30 records.
- The primary layout is a three-column workbench on desktop and tabbed work areas on small screens.

---

## File Structure

```text
deepseek-prompt-lab/
├── package.json                 # scripts and dependency ownership
├── tsconfig.json                # shared strict TypeScript settings
├── tsconfig.app.json            # browser compilation
├── tsconfig.server.json         # Node proxy compilation
├── vite.config.ts               # React build and local proxy routing
├── vitest.config.ts             # jsdom and Node test projects
├── playwright.config.ts         # real-browser verification
├── index.html                   # Vite entry document
├── server/
│   ├── app.ts                   # Express construction and route registration
│   ├── index.ts                 # localhost listener and static production hosting
│   ├── upstream.ts              # validated URL building and upstream fetch forwarding
│   └── upstream.test.ts         # proxy unit and integration tests
├── src/
│   ├── main.tsx                 # React bootstrap
│   ├── App.tsx                  # workbench composition and top-level state
│   ├── App.test.tsx             # top-level interaction tests
│   ├── styles.css               # responsive workbench and component styling
│   ├── domain/
│   │   ├── chat.ts              # message, payload, settings, and run types
│   │   ├── payload.ts           # canonical build and raw import functions
│   │   ├── payload.test.ts      # payload and synchronization tests
│   │   ├── messages.ts          # immutable message operations
│   │   └── messages.test.ts     # add, copy, delete, and reorder tests
│   ├── storage/
│   │   ├── localStore.ts        # versioned persistence and safe fallback
│   │   └── localStore.test.ts   # persistence, migration, and sanitization tests
│   ├── api/
│   │   ├── client.ts            # local proxy calls and AbortController ownership
│   │   ├── sse.ts               # incremental SSE parser and accumulator
│   │   └── sse.test.ts          # split-frame and completion tests
│   ├── hooks/
│   │   ├── usePersistentState.ts # versioned local state adapter
│   │   └── useChatRun.ts        # active request, stream, cancel, diagnostics
│   └── components/
│       ├── TopBar.tsx           # connection summary and send/stop commands
│       ├── ConnectionPanel.tsx  # URL, key, models, presets, and history
│       ├── MessageComposer.tsx  # sortable message list and add action
│       ├── MessageRow.tsx       # one role/content editor and row commands
│       ├── GenerationControls.tsx # standard and additional parameters
│       ├── RawRequestPanel.tsx  # raw editor and explicit sync commands
│       ├── ResponsePanel.tsx    # text/raw/diagnostics tabs
│       └── MobileTabs.tsx       # narrow-screen work-area navigation
├── tests/
│   └── prompt-lab.spec.ts       # Playwright end-to-end flows
└── README.md                    # local setup, security boundary, and usage
```

### Task 1: Create The Tested Application Shell

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.server.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/App.test.tsx`
- Create: `src/styles.css`

**Interfaces:**
- Consumes: Node.js 22 and pnpm 10 from the local environment.
- Produces: `pnpm dev`, `pnpm build`, `pnpm test`, and a renderable `<App />` root.

- [ ] **Step 1: Add runtime and test dependencies**

Run:

```powershell
pnpm add react react-dom express zod lucide-react @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
pnpm add -D typescript vite @vitejs/plugin-react tsx concurrently vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @types/react @types/react-dom @types/express supertest @types/supertest playwright
```

Expected: `package.json` and `pnpm-lock.yaml` are created without peer-dependency failures.

- [ ] **Step 2: Define scripts and strict compiler/test configuration**

Use these script contracts in `package.json`:

```json
{
  "scripts": {
    "dev": "concurrently -k \"vite\" \"tsx watch server/index.ts\"",
    "build": "tsc -p tsconfig.app.json --noEmit && vite build && tsc -p tsconfig.server.json",
    "start": "node dist-server/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

Configure Vite to proxy `/api` to `http://127.0.0.1:4174`. Configure Vitest with jsdom for `src/**/*.test.ts?(x)` and Node for `server/**/*.test.ts`.

- [ ] **Step 3: Write the failing application smoke test**

```tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { App } from './App';

it('renders the prompt lab workbench', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Prompt Lab' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Send request' })).toBeEnabled();
});
```

- [ ] **Step 4: Run the smoke test and verify failure**

Run: `pnpm test -- src/App.test.tsx`

Expected: FAIL because `App` has not been exported with the required workbench content.

- [ ] **Step 5: Implement the minimal shell and neutral visual tokens**

Create an `App` with a top bar, three named work areas, and CSS variables for paper, ink, muted gray, green success, amber warning, and red error. Use square or 6px-radius controls, stable toolbar heights, system fonts, visible focus rings, and no gradients.

- [ ] **Step 6: Verify the shell**

Run: `pnpm test -- src/App.test.tsx`

Expected: PASS with 1 test.

- [ ] **Step 7: Commit the shell**

```powershell
git add package.json pnpm-lock.yaml tsconfig*.json vite.config.ts vitest.config.ts index.html src
git commit -m "feat: scaffold prompt lab workbench"
```

### Task 2: Implement Prompt Domain State And Payload Synchronization

**Files:**
- Create: `src/domain/chat.ts`
- Create: `src/domain/payload.ts`
- Create: `src/domain/payload.test.ts`
- Create: `src/domain/messages.ts`
- Create: `src/domain/messages.test.ts`

**Interfaces:**
- Consumes: Zod.
- Produces: `ChatMessage`, `PromptDraft`, `RawImportResult`, `createDefaultDraft()`, `buildPayload(draft)`, `importRawPayload(text)`, `addMessage`, `copyMessage`, `removeMessage`, and `moveMessage`.

- [ ] **Step 1: Define exact domain types**

```ts
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  tool_call_id?: string;
  collapsed: boolean;
}

export interface GenerationSettings {
  stream: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stop: string[];
  additional: Record<string, unknown>;
}

export interface PromptDraft {
  model: string;
  messages: ChatMessage[];
  generation: GenerationSettings;
}
```

- [ ] **Step 2: Write failing payload tests**

Cover these exact cases:

```ts
it('builds a wire payload without editor-only ids');
it('rejects additional fields that replace model messages or stream');
it('imports supported fields and preserves unknown top-level fields');
it('rejects invalid JSON and an empty messages array');
it('keeps tool_call_id only for tool messages');
```

- [ ] **Step 3: Run payload tests and verify failure**

Run: `pnpm test -- src/domain/payload.test.ts`

Expected: FAIL because payload functions do not exist.

- [ ] **Step 4: Implement canonical build and raw import**

`buildPayload` returns the selected `model`, wire-format messages, standard generation fields, then non-conflicting additional fields. `importRawPayload` parses with Zod, creates fresh editor IDs via `crypto.randomUUID()`, imports supported parameters, and places unknown top-level fields into `generation.additional`.

- [ ] **Step 5: Write failing immutable message-operation tests**

```ts
it('adds a user message after the current final message');
it('copies content into a new message with a fresh id');
it('does not delete the final remaining message');
it('moves a message within bounds and ignores invalid moves');
```

- [ ] **Step 6: Implement message operations and verify all domain tests**

Run: `pnpm test -- src/domain`

Expected: PASS for payload and message suites.

- [ ] **Step 7: Commit the domain layer**

```powershell
git add src/domain
git commit -m "feat: add prompt payload domain"
```

### Task 3: Add Versioned Local Persistence, Presets, And Sanitized History

**Files:**
- Create: `src/storage/localStore.ts`
- Create: `src/storage/localStore.test.ts`
- Create: `src/hooks/usePersistentState.ts`

**Interfaces:**
- Consumes: `PromptDraft` from `src/domain/chat.ts`.
- Produces: `ConnectionSettings`, `PromptPreset`, `RequestHistory`, `loadWorkspace()`, `saveWorkspace(state)`, `sanitizeHistoryEntry(run)`, and `usePersistentState()`.

- [ ] **Step 1: Write failing storage tests**

```ts
it('loads DeepSeek defaults when storage is empty');
it('round-trips the version 1 workspace schema');
it('falls back safely when stored JSON is corrupt');
it('removes authorization values from history');
it('keeps only the newest 30 history entries');
it('does not copy an API key into a prompt preset');
```

- [ ] **Step 2: Run storage tests and verify failure**

Run: `pnpm test -- src/storage/localStore.test.ts`

Expected: FAIL because the versioned store is absent.

- [ ] **Step 3: Implement versioned persistence**

Use the key `deepseek-prompt-lab.workspace.v1`. Default connection state is:

```ts
{
  baseUrl: 'https://api.deepseek.com',
  apiKey: '',
  model: 'deepseek-chat'
}
```

Parse stored state through Zod, preserve unrelated browser storage, cap history after every write, and omit API keys from presets and history.

- [ ] **Step 4: Add the persistent React hook and verify**

Run: `pnpm test -- src/storage/localStore.test.ts`

Expected: PASS for all six cases.

- [ ] **Step 5: Commit persistence**

```powershell
git add src/storage src/hooks/usePersistentState.ts
git commit -m "feat: persist prompt presets and history"
```

### Task 4: Implement The Local Models And Chat Proxy

**Files:**
- Create: `server/upstream.ts`
- Create: `server/upstream.test.ts`
- Create: `server/app.ts`
- Create: `server/index.ts`

**Interfaces:**
- Consumes: request headers `x-provider-base-url` and `x-provider-api-key`; request body is the upstream JSON payload.
- Produces: `createApp(fetchImpl?: typeof fetch)`, `buildUpstreamUrl(baseUrl, resource)`, `GET /api/models`, `POST /api/chat/completions`, and `GET /api/health`.

- [ ] **Step 1: Write failing URL and forwarding tests**

Use Supertest and an injected fake fetch to cover:

```ts
it('joins a base URL with v1/models without duplicating v1');
it('rejects non-http provider URLs');
it('forwards bearer authorization and JSON chat payloads');
it('returns the upstream status and JSON error body');
it('pipes a text/event-stream response without JSON conversion');
it('rejects requests without a provider key');
```

- [ ] **Step 2: Run proxy tests and verify failure**

Run: `pnpm test -- server/upstream.test.ts`

Expected: FAIL because `createApp` and URL validation are missing.

- [ ] **Step 3: Implement target validation and forwarding**

`buildUpstreamUrl` accepts only `http:` and `https:`, removes trailing slashes, recognizes base URLs already ending in `/v1`, and appends either `/models` or `/chat/completions`. Express uses `express.json({ limit: '2mb' })`, binds only to `127.0.0.1`, and never logs incoming headers.

For SSE, copy `content-type`, upstream request IDs, and rate-limit headers, then pipe `Readable.fromWeb(upstream.body)` into the Express response. Abort upstream work when the client connection closes.

- [ ] **Step 4: Verify proxy tests and TypeScript build**

Run:

```powershell
pnpm test -- server/upstream.test.ts
pnpm build
```

Expected: proxy tests PASS and both browser and server compilation complete.

- [ ] **Step 5: Commit the proxy**

```powershell
git add server package.json vite.config.ts tsconfig.server.json
git commit -m "feat: add local compatible API proxy"
```

### Task 5: Build Connection Controls And Sortable Message Composition

**Files:**
- Create: `src/components/TopBar.tsx`
- Create: `src/components/ConnectionPanel.tsx`
- Create: `src/components/MessageComposer.tsx`
- Create: `src/components/MessageRow.tsx`
- Create: `src/components/GenerationControls.tsx`
- Create: `src/api/client.ts`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: domain operations, persistent connection state, `GET /api/models`.
- Produces: `listModels(connection)`, controlled connection fields, manual/fetched model combobox, sortable message list, and generation settings editor.

- [ ] **Step 1: Write failing user interaction tests**

```tsx
it('starts with DeepSeek connection defaults and system plus user messages');
it('keeps manual model entry available after model loading fails');
it('adds duplicates deletes and button-reorders messages');
it('changes a message among all four portable roles');
it('shows a conflict when additional parameters contain reserved fields');
```

- [ ] **Step 2: Run the interaction tests and verify failure**

Run: `pnpm test -- src/App.test.tsx`

Expected: FAIL because the workbench controls are not connected.

- [ ] **Step 3: Implement connection and model controls**

Implement `listModels(connection)` in `src/api/client.ts`. It fetches `/api/models` with provider values in headers and normalizes either `{ data: [{ id }] }` or a direct model array. Use labeled URL, password, and combobox inputs, sort returned IDs, and retain the current manual model when it is not in the fetched list.

- [ ] **Step 4: Implement the message composer**

Use `DndContext`, `SortableContext`, and keyboard/pointer sensors. Every icon command uses Lucide, a visible tooltip, and an accessible name. Keep row toolbar dimensions fixed so content edits never shift the list.

- [ ] **Step 5: Implement generation and additional JSON controls**

Use number inputs for standard values, a stream checkbox, a line-based stop editor, and a JSON object textarea for additional fields. Surface parse and reserved-field errors beside the control.

- [ ] **Step 6: Verify components and commit**

Run: `pnpm test -- src/App.test.tsx src/domain`

Expected: PASS for component and domain suites.

```powershell
git add src
git commit -m "feat: compose compatible chat requests"
```

### Task 6: Add Explicit Raw JSON Editing And Import

**Files:**
- Create: `src/components/RawRequestPanel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `buildPayload`, `importRawPayload`, and `PromptDraft`.
- Produces: raw text, `isRawDirty`, validation state, `Apply to structured editor`, `Rebuild from structured editor`, and `Send raw JSON` selection.

- [ ] **Step 1: Write failing synchronization tests**

```tsx
it('regenerates raw JSON while the raw editor is clean');
it('does not overwrite a dirty raw editor after structured edits');
it('imports valid raw JSON into structured controls explicitly');
it('rebuilds and clears dirty state only after confirmation');
it('blocks sending invalid raw JSON');
```

- [ ] **Step 2: Run synchronization tests and verify failure**

Run: `pnpm test -- src/App.test.tsx -t "raw JSON"`

Expected: FAIL because no raw request panel exists.

- [ ] **Step 3: Implement explicit synchronization state**

Initialize raw text with `JSON.stringify(buildPayload(draft), null, 2)`. Structured changes refresh it only when `isRawDirty` is false. Typing marks it dirty. Import replaces supported structured state only after successful validation. Rebuild replaces raw text from structured state and clears dirty state. A dirty valid draft exposes separate `Send raw JSON` and `Send structured request` commands.

- [ ] **Step 4: Verify synchronization and commit**

Run: `pnpm test -- src/App.test.tsx src/domain/payload.test.ts`

Expected: PASS for all raw synchronization cases.

```powershell
git add src/components/RawRequestPanel.tsx src/App.tsx src/App.test.tsx src/styles.css
git commit -m "feat: add explicit raw request editing"
```

### Task 7: Stream Requests And Present Response Diagnostics

**Files:**
- Modify: `src/api/client.ts`
- Create: `src/api/sse.ts`
- Create: `src/api/sse.test.ts`
- Create: `src/hooks/useChatRun.ts`
- Create: `src/components/ResponsePanel.tsx`
- Modify: `src/components/TopBar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: connection values and selected structured or raw payload.
- Produces: `listModels(connection)`, `runChat(connection, payload, callbacks, signal)`, `SseParser`, `useChatRun()`, send/stop state, accumulated text, raw events, and diagnostics.

- [ ] **Step 1: Write failing incremental SSE parser tests**

```ts
it('parses an event split across byte chunks');
it('handles multiple data frames in one chunk');
it('accumulates content and tool-call deltas');
it('recognizes data DONE and flushes the final partial buffer');
it('retains malformed frames as diagnostic errors without crashing');
```

- [ ] **Step 2: Run SSE tests and verify failure**

Run: `pnpm test -- src/api/sse.test.ts`

Expected: FAIL because `SseParser` is absent.

- [ ] **Step 3: Implement the streaming parser and API client**

Use `TextDecoder` with streaming mode, split frames on blank lines, combine repeated `data:` lines, parse standard `chat.completion.chunk` objects, and expose raw frames. `runChat` handles JSON and SSE based on response `content-type`, extracts response/request IDs from headers, and preserves upstream error bodies.

- [ ] **Step 4: Write failing send/cancel/diagnostic UI tests**

```tsx
it('sends the selected payload and renders assistant text');
it('appends streaming deltas and changes Send to Stop');
it('cancels through AbortController without clearing the draft');
it('shows status duration finish reason request id and usage');
it('renders response content as text rather than HTML');
```

- [ ] **Step 5: Implement `useChatRun` and response tabs**

Track `idle | sending | streaming | success | error | cancelled`, monotonic duration, active `AbortController`, text, raw frames, HTTP metadata, finish reason, token usage, and sanitized error details. Response tabs are Text, Raw, and Diagnostics; text uses a `<pre>` or text node without `dangerouslySetInnerHTML`.

- [ ] **Step 6: Verify request execution and commit**

Run: `pnpm test -- src/api src/App.test.tsx`

Expected: PASS for parser and request UI suites.

```powershell
git add src/api src/hooks/useChatRun.ts src/components/ResponsePanel.tsx src/components/TopBar.tsx src/App.tsx src/App.test.tsx
git commit -m "feat: stream responses with diagnostics"
```

### Task 8: Complete Presets, History, Responsive Polish, And Browser Verification

**Files:**
- Create: `src/components/MobileTabs.tsx`
- Create: `playwright.config.ts`
- Create: `tests/prompt-lab.spec.ts`
- Create: `README.md`
- Modify: `src/components/ConnectionPanel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`
- Modify: `server/index.ts`

**Interfaces:**
- Consumes: persistent workspace, completed run diagnostics, and all workbench components.
- Produces: named preset save/load/copy/delete, 30-item history load/resend/delete, mobile tabs, production static serving, setup documentation, and end-to-end evidence.

- [ ] **Step 1: Write failing preset and history tests**

```tsx
it('saves loads copies and deletes a preset without copying the key');
it('adds a sanitized record after success and failure');
it('loads resends and deletes a history record');
it('retains only the newest 30 records');
```

- [ ] **Step 2: Implement preset and history controls**

Use compact list rows with load as the primary action and icon buttons for copy and delete. Confirm destructive preset/history deletion in a small modal. History rows show timestamp, model, status, duration, and truncated response summary; loading a record restores its request payload but not any credential.

- [ ] **Step 3: Add responsive mobile tabs and finish styling**

At widths below 820px, show Connection, Compose, and Inspect tabs and render one work area at a time. Keep the top send/stop command sticky, ensure no fixed-width child exceeds the viewport, and test keyboard focus, reduced motion, empty states, loading states, long model IDs, and long unbroken output text.

- [ ] **Step 4: Write Playwright flows**

Mock upstream calls at the local proxy boundary and cover:

```ts
test('edits messages, applies raw JSON, and sends a streaming request');
test('falls back to manual model entry when models fail');
test('persists presets and sanitized history after reload');
test('cancels a stream and keeps the current draft');
test('fits desktop and 390px phone viewports without overlap');
```

- [ ] **Step 5: Run full verification**

Run:

```powershell
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Expected: all Vitest and Playwright tests PASS, `dist/` and `dist-server/` are produced, and screenshots show non-overlapping desktop and phone layouts.

- [ ] **Step 6: Document local use and security boundary**

README commands:

```powershell
pnpm install
pnpm dev
```

Document the browser-local API-key choice, localhost-only proxy, DeepSeek default, compatible-provider URL behavior, model-list fallback, raw synchronization controls, and production `pnpm build && pnpm start` flow.

- [ ] **Step 7: Commit the completed application**

```powershell
git add README.md playwright.config.ts tests src server package.json pnpm-lock.yaml
git commit -m "feat: complete local prompt debugging lab"
```

- [ ] **Step 8: Confirm the final repository state**

Run:

```powershell
git status --short --branch
git log --oneline -8
```

Expected: clean worktree with the design, plan, and implementation commits visible.
