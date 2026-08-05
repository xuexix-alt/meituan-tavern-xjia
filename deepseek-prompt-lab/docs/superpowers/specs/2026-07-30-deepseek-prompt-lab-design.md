# DeepSeek Prompt Lab Design

## Purpose

Build a local, single-user browser application for composing, sending, and debugging OpenAI-compatible Chat Completions requests. DeepSeek is the default provider, while the base URL and model remain editable for other compatible services.

The application prioritizes transparent request construction: the user can work through structured controls, inspect the exact JSON payload, edit that payload directly, and explicitly choose which representation is sent.

## Scope

### Included

- React, TypeScript, and Vite frontend.
- Minimal local Node proxy for upstream HTTP and streaming requests.
- DeepSeek defaults with editable OpenAI-compatible base URL.
- Browser-local persistence for API key, connection settings, prompt presets, and recent request records.
- Structured message editor for `system`, `user`, `assistant`, and `tool` messages.
- Add, edit, collapse, duplicate, delete, drag-sort, and button-sort message operations.
- Model list retrieval with a manual model-name fallback.
- Structured controls for common generation parameters.
- Editable raw request JSON with explicit two-way synchronization.
- Non-streaming and SSE streaming response handling with cancellation.
- Request and response diagnostics.
- Responsive desktop and small-screen layouts.

### Excluded

- User accounts, cloud synchronization, shared workspaces, or remote deployment.
- Server-side API-key persistence.
- Provider-specific APIs outside the OpenAI-compatible models and Chat Completions surfaces.
- Automatic execution of model tool calls.
- Rich Markdown plugins, arbitrary HTML rendering, or remote asset loading in model output.

## Architecture

The deliverable contains two processes managed by one development command:

1. A Vite-powered React single-page application.
2. A small Node HTTP proxy that accepts local requests and forwards them upstream.

The browser owns all user configuration and saved data. Each request supplies the selected base URL and API key to the local proxy. The proxy validates the target protocol, constructs the upstream URL, strips sensitive values from logs, forwards the request, and returns either JSON or the upstream event stream. It never writes credentials to disk.

The production command serves the built frontend and proxy from the same localhost origin. This avoids browser CORS restrictions between the frontend and local proxy.

## Interface Design

### Overall Layout

Desktop uses a quiet three-column workbench:

- Left: connection settings, saved presets, and recent requests.
- Center: ordered message composer and generation controls.
- Right: raw JSON, response, and diagnostics tabs.

The top toolbar contains the product name, connection indicator, current model, save-preset command, and send or stop command. On narrow screens, the three work areas become tabs while the send command stays accessible.

### Connection Settings

Fields and actions:

- Base URL, defaulting to `https://api.deepseek.com`.
- API key with masked display and an explicit reveal control.
- Model combobox supporting both fetched options and manual entry.
- Fetch-models command with loading, success, and failure states.
- Streaming toggle.

Failure to retrieve `/models` does not block chat requests. The UI explains the failure in the diagnostics area and keeps manual model entry enabled.

### Message Composer

Each message row contains:

- Stable drag handle and position indicator.
- Role selector.
- Multiline content editor.
- Collapse, duplicate, move-up, move-down, and delete controls.
- A token estimate indicator when available locally.

New messages default to `user`. The first empty workspace starts with one `system` message and one `user` message. Drag sorting and button sorting update the same ordered message state.

### Generation Controls

The primary controls are:

- `temperature`
- `top_p`
- maximum completion tokens
- `stop`
- stream mode

An additional-parameters JSON object supports compatible-provider extensions without adding a dedicated control for every field. Reserved fields such as `model`, `messages`, and `stream` cannot be silently overridden by additional parameters; conflicts are reported before sending.

### Structured And Raw JSON Synchronization

Structured edits regenerate the raw JSON while the raw editor is clean.

Once the user edits raw JSON manually:

- The raw editor is marked dirty.
- Further structured changes do not silently overwrite it.
- `Apply to structured editor` validates and imports supported fields.
- `Rebuild from structured editor` explicitly discards raw edits.
- `Send raw JSON` sends the current valid raw payload as-is.

Importing raw JSON preserves unsupported top-level fields inside additional parameters. Invalid JSON or invalid `messages` blocks import and sending and shows a field-specific error.

### Response And Diagnostics

The right panel provides:

- Rendered text view using plain text, never unsanitized HTML.
- Raw response or accumulated stream-events view.
- Diagnostics showing HTTP status, duration, model, request ID, finish reason, input tokens, output tokens, total tokens, and error details.
- Copy-response and copy-request commands.
- Stop-generation command while streaming.

For streaming responses, content deltas append incrementally. Tool-call deltas are retained in the raw view even though tools are not executed.

### Presets And History

A preset stores the base URL, model, structured messages, generation parameters, and additional parameters. API keys are not duplicated into presets.

Recent history stores a bounded list of the latest 30 attempts with timestamp, model, request payload, status, duration, and response summary. A record can be loaded, resent, or deleted. Sensitive authorization values are never included in history entries.

## Data Model

Primary browser state is divided into:

- `ConnectionSettings`: base URL, API key, selected model.
- `PromptDraft`: ordered messages and generation parameters.
- `RawDraft`: raw text, dirty state, parse status.
- `RequestRun`: active request state, abort controller, stream buffer, response metadata.
- `PromptPreset[]`: named reusable prompt configurations.
- `RequestHistory[]`: bounded sanitized run summaries.

Storage uses versioned keys so future schema migrations can be handled explicitly. Corrupt stored data falls back to defaults without deleting unrelated local storage.

## Request Flow

1. The structured editor creates a canonical payload unless raw mode is dirty.
2. The user chooses structured or raw sending when a dirty raw draft exists.
3. The frontend validates the base URL, API key, model, messages, and JSON fields.
4. The frontend sends the target base URL and API key to the localhost proxy using request headers; the chat payload remains the request body.
5. The proxy validates `http` or `https`, joins the provider path safely, and forwards authorization and content headers.
6. Non-stream responses return as JSON. Stream responses are piped back without buffering the whole result.
7. The frontend parses standard Chat Completions responses or SSE `data:` frames, updates diagnostics, and writes a sanitized history record.

## Error Handling

The application distinguishes:

- Local validation errors.
- Invalid raw JSON or unsupported structured shapes.
- Local proxy unavailable.
- DNS, connection, TLS, timeout, and upstream failures.
- Authentication and rate-limit responses.
- Model-list incompatibility.
- Malformed JSON and malformed SSE frames.
- User cancellation.

Upstream HTTP status and response bodies remain inspectable. Error messages never echo the API key. A failed request does not destroy the current draft or previous successful response.

## Security Boundaries

This is explicitly a localhost, single-user tool. Storing the API key in `localStorage` is accepted for convenience and disclosed in the interface. The app does not load third-party scripts at runtime, render model HTML, or transmit the key anywhere except the selected compatible endpoint through the localhost proxy.

The proxy only accepts requests from localhost, limits request body size, permits only `http` and `https` upstream URLs, and never logs authorization headers. These controls reduce accidental exposure but do not turn the tool into a safe multi-user or internet-facing service.

## Testing

### Unit Tests

- Canonical payload construction.
- Raw JSON import and unsupported-field preservation.
- Dirty-state synchronization rules.
- Message add, copy, delete, and reorder operations.
- Versioned storage parsing and fallback behavior.
- SSE frame parsing and response accumulation.

### Proxy Tests

- Models and chat URL construction.
- Authorization forwarding without logging secrets.
- JSON and streaming response forwarding.
- Invalid URL, oversized body, timeout, and upstream error handling.

### Browser Verification

- First-run defaults.
- Model retrieval success and manual fallback.
- Full structured edit, raw edit, explicit import, send, stream, and cancel flows.
- Preset and history restoration after reload.
- Desktop and phone viewport screenshots with no overlap or clipped controls.

## Success Criteria

- A user can start the application with one command and open a localhost URL.
- DeepSeek works after entering an API key and selecting or typing a model.
- Other OpenAI-compatible services work by changing base URL and model.
- The exact outgoing payload is always inspectable and never silently replaced.
- Streaming output, cancellation, diagnostics, presets, and recent history work without exposing credentials in logs or saved request records.
- Automated tests pass and the primary flows are visually verified in a real browser.
