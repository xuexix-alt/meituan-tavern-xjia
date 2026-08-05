# APP Same-Layer Story Reader Design

## Goal

Add a root-owned same-layer story session and a dedicated `/story` reader route to `src/APP`. Existing order flows submit their assembled player instruction to this session, navigate to the reader, stream the reply in place, and persist real user and assistant chat messages while visually hiding their host Tavern floors.

Shop discovery generation and the debug lab remain unchanged and continue using their existing background generation and shop-cache paths.

## User Experience

### Story Entry

- Add a prominent `正文` entry centered above the main bottom navigation.
- The entry remains available from the main APP pages.
- Its state communicates idle, generating, completed, and error conditions without exposing implementation details.
- Confirming an order automatically navigates to `/story` after the story submission has been accepted.

### Reader Layout

- `/story` displays the latest assistant message as the primary reading body.
- The related preceding user message appears as a collapsed summary that can be expanded locally.
- A history overlay exposes the transcript window without replacing the current reading body.
- The bottom composer supports free-form follow-up actions.
- Stop generation, regenerate, and rollback controls are available where their operations are valid.
- The visual language follows the current APP light/dark themes and yellow accent instead of copying the Winter PRE theme.

### Vertical Pad Shell

- The normal APP shell keeps its current phone layout.
- On `/story`, the shell switches to a vertical Pad layout with a maximum width of `820px` and an aspect ratio of `3 / 4`.
- At narrow host widths the reader remains `width: 100%` and must not create horizontal scrolling.
- The layout must not use `vh` to force iframe height.
- Leaving `/story` restores the normal phone shell dimensions.

## Architecture

### Root-Owned Story Session

The story session is created once by `app.vue` and provided to route components. It remains alive while the user navigates between APP routes.

The session owns:

- transcript reads and normalized transcript items;
- the active generation ID and streaming snapshot;
- send, stop, regenerate, and rollback operations;
- Tavern message and streaming event subscriptions;
- host-floor visual hiding and lifecycle recovery;
- status and error state exposed to the reader and centered story entry.

Route components consume this session. They do not create their own generation listeners or host-floor controllers.

### Story Route

Add a lazy `/story` route. Its page is presentation-focused and consumes the root session for transcript data and commands.

The page does not own order parsing, shop cache writes, debug presets, MVU business panels, galleries, or Winter-specific opening logic.

### Host-Floor Visibility

Real story messages stay in the current Tavern chat with `is_hidden: false`. Their host DOM floors are visually collapsed while the APP carrier floor remains visible.

The visibility controller must:

- exclude `getCurrentMessageId()` from hiding and destructive operations;
- reserve the next host message ID before creating user and assistant messages;
- hide all matching duplicate host nodes for an ID;
- reapply hiding after host DOM replacement;
- temporarily reveal a floor during native editing and re-hide it when editing ends;
- clean up only the attributes and styles it owns when the APP unmounts.

This is visual same-layer play. It deliberately preserves real chat history for Tavern presets, MVU, plugins, editing, saving, rollback, and regeneration.

## Transcript Pipeline

### Reading

Read the latest three user/assistant pairs using `getChatMessages(..., { hide_state: 'all' })`. Exclude message zero, system messages, and the APP carrier floor from reader actions.

For persisted assistant messages:

1. Prefer the existing host `.mes_text.innerHTML` for the message ID.
2. Normalize only the small reading-specific compatibility rules.
3. Fall back to `formatAsDisplayedMessage(raw, { message_id })` only for a real, existing floor.
4. Fall back to escaped raw text if the host formatter fails.

User messages remain escaped literal text to avoid applying assistant display regexes or double-wrapping quotes.

Transcript refreshes are coalesced. Message update/edit/render events should refresh only affected loaded items when IDs are available; send, receive, delete, and chat-load events may rebuild the bounded window.

### Streaming

The streaming item is a temporary assistant item and is never treated as a real floor.

Apply display regexes directly to each throttled cumulative snapshot:

```ts
formatAsTavernRegexedString(text, 'ai_output', 'display', { depth: 0 })
```

The result contract is:

- API success with HTML: render the returned HTML;
- API success with an empty string: render an empty body because a hide regex may intentionally remove the entire snapshot;
- API success with unchanged source: render a safe literal streaming representation;
- API unavailable or throws: render safely escaped source and retain a diagnostic error for logging.

Do not call `formatAsDisplayedMessage` with the temporary next message ID. That API requires an existing floor.

Streaming updates use the full-snapshot event associated with the active generation ID and are throttled to avoid rebuilding the body for every token. Host-native stream events may support visual hiding, but must not attach another generation's text to this session.

Once generation completes and the assistant message is persisted, remove the temporary item and rebuild the final item through the persisted transcript pipeline.

## Story Send Pipeline

`submitPrompt(text)` accepts plain player instruction text without `/send` or `/trigger` syntax.

The operation is:

1. Reject blank input or a second submission while the story session is busy.
2. Allocate and expose a unique generation ID.
3. Reserve the next host-floor hide.
4. Create a real user message with `createChatMessages(..., { refresh: 'affected' })`.
5. Refresh the local transcript so the submitted instruction is visible in the reader.
6. Generate with the current Tavern API and preset, streaming enabled and associated with the generation ID.
7. Reserve the next host-floor hide.
8. Create a short user transport placeholder so `createChatMessages` does not emit a premature `MESSAGE_RECEIVED` for the final正文.
9. Rewrite that same message with `setChatMessages` as the assistant正文, then emit one controlled `MESSAGE_RECEIVED` event so MVUbeta can process the existing floor.
10. Clear the streaming item and refresh the final transcript.

The MVUbeta callback must never be persisted as a second assistant floor. Its normal return path is `setChatMessages` on the existing assistant message. If that callback or its extra model fails, the正文 remains saved and readable; the APP logs the MVU failure separately.

The APP only removes structurally invalid `UpdateVariable` blocks before saving. It does not call `Mvu.parseMessage` as a preflight, because that would execute a second variable pass before MVUbeta's `MESSAGE_RECEIVED` handler. MVUbeta remains the single owner of parsing, variable persistence, Zod listeners, and its final `setChatMessages` rewrite.

Generation failures keep the submitted user floor, show an actionable error in the reader, and permit retry. Cancellation targets the active generation ID and clears only transient streaming state.

Regeneration finds the user prompt preceding the chosen assistant, deletes the replaceable assistant and later story floors without deleting the APP carrier, then runs the same generation and persistence pipeline without creating a duplicate user floor.

Rollback requires confirmation and deletes the selected real floor and later deletable story floors, excluding message zero and the APP carrier.

## Order Integration

### Package Order

`ItemDetail.vue` retains its current modal and instruction wording. Both manual remarks and a selected featured-play suggestion reach the same confirmation handler.

On confirmation:

1. Build the plain instruction currently placed after `/send`.
2. Submit it to the root story session.
3. Close the modal after acceptance.
4. Navigate to `/story`.

Do not append `| /trigger await=true` and do not call `triggerSlash` for this flow.

### Repeat Order

`History.vue` retains its current repeat-order confirmation and wording. On confirmation it submits the plain repeat-order instruction to the story session and navigates to `/story`.

The current `Service.vue` contains active-order display but no repeat-order submission path. This integration changes the existing repeat-order path in `History.vue`; it does not invent a duplicate Service-page order flow.

### Failure Before Acceptance

If the session cannot accept a submission, keep the confirmation modal open and show the reason. Do not silently copy commands or navigate to an empty reader.

## Navigation

Use a shared centered story-entry component rather than independently implementing state logic in each page. It reads the root story session and routes to `/story`.

Existing bottom navigation destinations remain available. The story entry is visually elevated above the navigation axis so it is centered without removing or renaming an existing destination.

Detail pages that immediately navigate to the reader after order confirmation do not need a duplicate story button that competes with their fixed order footer.

## State Boundaries

- Story transcript truth remains the current Tavern chat, not global variables, local storage, or the shop cache.
- The story session does not continue across a different Tavern chat. A chat change clears transient generation state and rebuilds from the newly active chat.
- `shop_store_cache` remains global and independent.
- Debug-lab generation and shop ingestion continue to update Discover without creating story floors.
- Reader presentation state such as expanded user text or open history is local UI state and need not be persisted.

## Error Handling

- Missing Tavern Helper APIs produce a visible unavailable state and disable story submission.
- A failed user-floor write leaves the order modal open.
- A generation failure after user-floor creation leaves that instruction available for retry.
- A failed assistant-floor write retains the completed response in transient state until retry or refresh, instead of presenting it as durably saved.
- Rollback and regeneration errors preserve the current transcript and expose the operation-specific failure.
- All event listeners, observers, timers, and generation references are released on APP unmount.

## Testing

### Unit Tests

- Order and repeat-order builders preserve their current instruction text without slash syntax.
- Submission creates user, generates, then creates assistant in order.
- Regeneration reuses the preceding user prompt and does not duplicate it.
- Rollback excludes the APP carrier floor.
- Streaming regex rendering handles partial XML, replacement HTML, intentional empty output, unchanged output, and API failure.
- Transcript conversion prefers host-rendered HTML and only passes real IDs to `formatAsDisplayedMessage`.

### Source and Component Tests

- `/story` is registered lazily.
- `app.vue` owns and provides one story session.
- The centered story entry consumes session state and routes correctly.
- Item and repeat-order confirmation handlers use the session and no longer call the slash chain.
- Reader controls call session commands and respect busy/availability state.

### Browser Verification

In the live Tavern environment, verify:

- normal APP routes retain phone dimensions;
- `/story` switches to the vertical Pad shell on desktop and remains width-safe on mobile;
- order confirmation automatically opens the reader;
- partial XML is hidden or beautified by active Tavern display regexes during streaming;
- final HTML matches the host-rendered message;
- real user and assistant floors exist but never flash below the APP carrier;
- stop, retry, regenerate, rollback, history, and free-form follow-up work;
- Discover background generation and the debug lab still behave as before.

## Out of Scope

- Cross-chat story continuation.
- Replacing the debug lab or shop-generation API paths.
- Persisting story transcript data outside Tavern chat messages.
- Copying Winter PRE galleries, phone bridge, opening setup, map, or role panels.
- Adding a new repeat-order workflow to `Service.vue` where none currently exists.
