<template>
  <div class="debug-lab">
    <div class="lab-back-row">
      <button class="lab-back" type="button" @click="$router.push('/me')">
        <i class="fas fa-chevron-left" aria-hidden="true"></i>
        <span>返回</span>
      </button>
    </div>

    <DebugTopBar
      :status-text="statusText"
      :running="running"
      :import-error="importError"
      @send="sendStructured"
      @stop="cancel"
      @import="importWorkspaceFile"
      @export="exportWorkspaceFile"
    />

    <div class="mobile-tabs" role="tablist" aria-label="工作区">
      <button
        type="button"
        role="tab"
        :aria-selected="activeArea === 'connection'"
        :class="{ active: activeArea === 'connection' }"
        @click="activeArea = 'connection'"
      >
        <i class="fas fa-plug" aria-hidden="true"></i><span>连接</span>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeArea === 'compose'"
        :class="{ active: activeArea === 'compose' }"
        @click="activeArea = 'compose'"
      >
        <i class="fas fa-comments" aria-hidden="true"></i><span>编辑</span>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeArea === 'inspect'"
        :class="{ active: activeArea === 'inspect' }"
        @click="activeArea = 'inspect'"
      >
        <i class="fas fa-code" aria-hidden="true"></i><span>检查</span>
      </button>
    </div>

    <section class="workbench">
      <section
        class="work-area connection-area"
        :class="{ 'mobile-active': activeArea === 'connection' }"
        aria-labelledby="connection-heading"
      >
        <header class="work-area-header">
          <div>
            <span class="section-kicker">01</span>
            <h2 id="connection-heading">连接</h2>
          </div>
        </header>
        <ConnectionPanel
          :connection="workspace.connection"
          :presets="workspace.presets"
          :history="workspace.history"
          :send-mode="sendMode"
          :tavern-available="tavernAvailable"
          :tavern-error="tavernError"
          @send-mode-change="setSendMode"
          @change="updateConnection"
          @save-preset="savePreset"
          @load-preset="loadPreset"
          @copy-preset="copyPreset"
          @delete-preset="deletePreset"
          @load-history="loadHistory"
          @resend-history="resendHistory"
          @delete-history="deleteHistory"
        />
      </section>

      <section
        class="work-area compose-area"
        :class="{ 'mobile-active': activeArea === 'compose' }"
        aria-labelledby="compose-heading"
      >
        <header class="work-area-header">
          <div>
            <span class="section-kicker">02</span>
            <h2 id="compose-heading">编辑</h2>
          </div>
          <span class="count-badge">{{ workspace.draft.messages.length }} 条消息</span>
        </header>
        <MessageComposer
          :messages="workspace.draft.messages"
          :macro-name="workspace.macroName || DEFAULT_MACRO_NAME"
          :macro-value="workspace.macroInput"
          @change="onMessagesChange"
          @macro-value-change="onMacroValueChange"
        />
        <GenerationControls :generation="workspace.draft.generation" @change="updateGeneration" />
      </section>

      <section
        class="work-area inspect-area"
        :class="{ 'mobile-active': activeArea === 'inspect' }"
        aria-labelledby="inspect-heading"
      >
        <header class="work-area-header">
          <div>
            <span class="section-kicker">03</span>
            <h2 id="inspect-heading">检查</h2>
          </div>
        </header>
        <RawRequestPanel
          :text="rawText"
          :is-dirty="isRawDirty"
          @text-change="onRawTextChange"
          @apply="applyRawDraft"
          @rebuild="rebuildRaw"
          @send-raw="sendRaw"
          @send-structured="sendStructured"
        />
        <ResponsePanel :run="chatState" />
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ChatMessage } from './调试台/domain/chat';
import { DEFAULT_MACRO_NAME } from './调试台/domain/macros';
import { useDebugLab } from './调试台/useDebugLab';
import DebugTopBar from './调试台/components/TopBar.vue';
import ConnectionPanel from './调试台/components/ConnectionPanel.vue';
import MessageComposer from './调试台/components/MessageComposer.vue';
import GenerationControls from './调试台/components/GenerationControls.vue';
import RawRequestPanel from './调试台/components/RawRequestPanel.vue';
import ResponsePanel from './调试台/components/ResponsePanel.vue';

const {
  workspace,
  rawText,
  isRawDirty,
  activeArea,
  importError,
  chatState,
  running,
  cancel,
  sendMode,
  setSendMode,
  tavernAvailable,
  tavernError,
  updateDraft,
  updateConnection,
  updateGeneration,
  applyRawDraft,
  rebuildRaw,
  sendStructured,
  sendRaw,
  importWorkspaceFile,
  exportWorkspaceFile,
  savePreset,
  loadPreset,
  copyPreset,
  deletePreset,
  loadHistory,
  resendHistory,
  deleteHistory,
} = useDebugLab();

const statusText = computed(
  () => `${workspace.value.connection.model || '未选择模型'} · ${workspace.value.connection.baseUrl || '未填写接口'}`,
);

function onRawTextChange(text: string) {
  rawText.value = text;
  isRawDirty.value = true;
}

function onMessagesChange(messages: ChatMessage[]) {
  updateDraft({ ...workspace.value.draft, messages });
}

function onMacroValueChange(value: string) {
  workspace.value = { ...workspace.value, macroInput: value };
}
</script>

<style lang="scss">
.debug-lab {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  min-width: 320px;
  padding: 14px 18px 24px;
  color-scheme: light;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  color: #26332e;
  background: #e7ece9;
  --paper: #e7ece9;
  --surface: #e7ece9;
  --surface-soft: #edf2ef;
  --ink: #26332e;
  --muted: #6a7770;
  --border: rgb(255 255 255 / 0.58);
  --border-strong: #c7d0ca;
  --green: #246b4d;
  --green-dark: #18533a;
  --amber: #936316;
  --red: #b0433a;
  --blue: #2d628f;
  --focus: #1d6b9f;
  --shadow-light: #ffffff;
  --shadow-dark: #c8d1cb;
  --shadow-raised: 8px 8px 16px var(--shadow-dark), -8px -8px 16px var(--shadow-light);
  --shadow-raised-small: 4px 4px 9px var(--shadow-dark), -4px -4px 9px var(--shadow-light);
  --shadow-inset: inset 3px 3px 7px var(--shadow-dark), inset -3px -3px 7px var(--shadow-light);
  --radius: 8px;
  --toolbar-height: 68px;
}

.debug-lab,
.debug-lab *,
.debug-lab *::before,
.debug-lab *::after {
  box-sizing: border-box;
}

.debug-lab button,
.debug-lab input,
.debug-lab textarea,
.debug-lab select {
  font: inherit;
}

.debug-lab button {
  cursor: pointer;
}

.debug-lab button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.debug-lab button:focus-visible,
.debug-lab input:focus-visible,
.debug-lab textarea:focus-visible,
.debug-lab select:focus-visible,
.debug-lab summary:focus-visible {
  outline: 3px solid rgb(65 179 138 / 0.58);
  outline-offset: 2px;
}

.debug-lab .sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.debug-lab .top-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--toolbar-height);
  gap: 20px;
  max-width: 1680px;
  margin: 0 auto;
  padding: 9px 0;
  border-bottom: 0;
  background: rgb(231 236 233 / 0.92);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  box-shadow: 0 5px 10px rgb(174 188 180 / 0.18);
}

.debug-lab .lab-back-row {
  display: flex;
  padding: 4px 0 2px;
}

.debug-lab .lab-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  border: 0;
  border-radius: var(--radius);
  padding: 0 10px;
  background: var(--surface);
  color: var(--muted);
  font-size: 0.75rem;
  box-shadow: var(--shadow-raised-small);
}

.debug-lab .lab-back:hover {
  color: var(--ink);
}

.debug-lab .brand-block {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.debug-lab .brand-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: var(--radius);
  background: var(--green-dark);
  color: #fff;
  font:
    700 16px/1 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  box-shadow: var(--shadow-raised-small);
}

.debug-lab h1,
.debug-lab h2,
.debug-lab p {
  margin-top: 0;
}

.debug-lab h1 {
  margin: 0;
  font-size: 1.08rem;
  line-height: 1.2;
  letter-spacing: 0;
}

.debug-lab .connection-summary {
  max-width: min(62vw, 760px);
  margin: 3px 0 0;
  overflow: hidden;
  color: var(--muted);
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.debug-lab .send-button,
.debug-lab .stop-button,
.debug-lab .secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  gap: 7px;
  border: 0;
  border-radius: var(--radius);
  padding: 0 13px;
  font-weight: 650;
  box-shadow: var(--shadow-raised-small);
  transition:
    box-shadow 0.16s ease,
    transform 0.16s ease,
    background-color 0.16s ease;
}

.debug-lab .top-actions {
  display: flex;
  align-items: center;
  gap: 7px;
  position: relative;
}

.debug-lab .compact-action {
  min-height: 36px;
  padding: 0 10px;
  font-size: 0.74rem;
}

.debug-lab .top-error {
  position: absolute;
  right: 0;
  bottom: -22px;
  color: var(--red);
  font-size: 0.7rem;
  white-space: nowrap;
}

.debug-lab .send-button {
  background: var(--green);
  color: #fff;
}

.debug-lab .send-button:hover {
  background: var(--green-dark);
}

.debug-lab .stop-button {
  background: var(--red);
  color: #fff;
}

.debug-lab .secondary-button {
  background: var(--surface);
  color: var(--ink);
}

.debug-lab .secondary-button:hover {
  background: var(--surface-soft);
}

.debug-lab .send-button:active,
.debug-lab .stop-button:active,
.debug-lab .secondary-button:active,
.debug-lab .icon-button:active {
  box-shadow: var(--shadow-inset);
  transform: translateY(1px);
}

.debug-lab .workbench {
  display: grid;
  grid-template-columns: minmax(250px, 0.76fr) minmax(420px, 1.42fr) minmax(280px, 0.9fr);
  align-items: start;
  gap: 18px;
  max-width: 1680px;
  margin: 16px auto 0;
}

.debug-lab .work-area {
  min-width: 0;
  border: 0;
  border-radius: var(--radius);
  background: var(--surface);
  overflow: clip;
  box-shadow: var(--shadow-raised);
}

.debug-lab .work-area-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 50px;
  gap: 12px;
  padding: 0 14px;
  border-bottom: 0;
  background: var(--surface);
  box-shadow: inset 0 -2px 4px rgb(197 208 201 / 0.35);
}

.debug-lab .work-area-header > div {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.debug-lab .work-area h2 {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.2;
}

.debug-lab .section-kicker {
  color: var(--green);
  font:
    700 0.68rem/1 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
}

.debug-lab .count-badge {
  color: var(--muted);
  font-size: 0.72rem;
  white-space: nowrap;
}

.debug-lab .panel-body,
.debug-lab .composer-body,
.debug-lab .generation-controls {
  padding: 16px;
}

.debug-lab .stack {
  display: grid;
  gap: 13px;
}

.debug-lab .field {
  display: grid;
  min-width: 0;
  gap: 6px;
  color: #3f4843;
  font-size: 0.76rem;
  font-weight: 600;
}

.debug-lab .field small {
  color: var(--muted);
  font-weight: 400;
}

.debug-lab input,
.debug-lab textarea,
.debug-lab select {
  width: 100%;
  min-width: 0;
  border: 0;
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-inset);
}

.debug-lab input,
.debug-lab select {
  min-height: 36px;
  padding: 0 9px;
}

.debug-lab textarea {
  display: block;
  resize: vertical;
  padding: 9px;
  line-height: 1.45;
}

.debug-lab input:not(.raw-editor):hover,
.debug-lab textarea:not(.raw-editor):hover,
.debug-lab select:hover {
  background: var(--surface-soft);
}

.debug-lab .input-with-action {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 36px;
}

.debug-lab .input-with-action input {
  border-radius: 5px 0 0 5px;
}

.debug-lab .input-with-action .icon-button {
  border-left: 0;
  border-radius: 0 5px 5px 0;
}

.debug-lab .icon-button {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  border: 0;
  border-radius: var(--radius);
  background: var(--surface);
  color: #4e5953;
  box-shadow: var(--shadow-raised-small);
}

.debug-lab .icon-button:hover {
  background: #eef1ed;
  color: var(--ink);
}

.debug-lab .icon-button.danger:hover {
  background: #fff1ef;
  color: var(--red);
}

.debug-lab .field-error {
  margin: 0;
  color: var(--red);
  font-size: 0.76rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.debug-lab .field-note {
  margin: 0;
  color: var(--muted);
  font-size: 0.74rem;
}

.debug-lab .compose-area {
  min-height: 560px;
}

.debug-lab .composer-body {
  display: grid;
  gap: 10px;
}

.debug-lab .message-list {
  display: grid;
  gap: 9px;
}

.debug-lab .macro-field {
  margin-bottom: 14px;
}

.debug-lab .macro-field textarea {
  min-height: 58px;
}

.debug-lab .message-row {
  min-width: 0;
  border: 0;
  border-radius: var(--radius);
  background: var(--surface);
  overflow: hidden;
  box-shadow: var(--shadow-raised-small);
}

.debug-lab .message-toolbar {
  display: flex;
  align-items: center;
  min-height: 42px;
  gap: 7px;
  padding: 4px 7px;
  border-bottom: 0;
  background: var(--surface-soft);
  box-shadow: inset 0 -2px 4px rgb(197 208 201 / 0.28);
}

.debug-lab .role-field {
  width: 112px;
}

.debug-lab .role-field select {
  min-height: 32px;
  padding-left: 7px;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.75rem;
}

.debug-lab .message-index {
  color: var(--muted);
  font:
    0.7rem/1 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
}

.debug-lab .row-actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.debug-lab .message-content {
  display: grid;
  gap: 8px;
  padding: 8px;
}

.debug-lab .message-content textarea {
  border: 0;
  min-height: 112px;
  padding: 8px;
  box-shadow: var(--shadow-inset);
}

.debug-lab .message-content textarea:focus {
  outline-offset: 0;
}

.debug-lab .compact-field input {
  min-height: 32px;
}

.debug-lab .add-message {
  justify-self: stretch;
}

.debug-lab .generation-controls {
  border-top: 0;
  margin-top: 4px;
  box-shadow: inset 0 2px 4px rgb(197 208 201 / 0.3);
}

.debug-lab .generation-controls summary {
  cursor: pointer;
  color: #38423d;
  font-size: 0.8rem;
  font-weight: 700;
}

.debug-lab .generation-controls[open] summary {
  margin-bottom: 12px;
}

.debug-lab .generation-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px;
  margin-bottom: 10px;
}

.debug-lab .checkbox-field {
  display: flex;
  grid-column: 1 / -1;
  align-items: center;
  gap: 8px;
  color: #3f4843;
  font-size: 0.78rem;
}

.debug-lab .checkbox-field input {
  width: 16px;
  min-height: 16px;
}

.debug-lab .generation-controls > .field {
  margin-top: 10px;
}

.debug-lab .code-input {
  font:
    0.75rem/1.5 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  tab-size: 2;
}

.debug-lab .empty-state {
  display: grid;
  place-items: center;
  min-height: 310px;
  padding: 30px;
  text-align: center;
  color: var(--muted);
}

.debug-lab .empty-state strong {
  color: #3a433f;
  font-size: 0.85rem;
}

.debug-lab .empty-state span:last-child {
  max-width: 250px;
  font-size: 0.76rem;
  line-height: 1.5;
}

.debug-lab .empty-glyph {
  color: var(--blue);
  font:
    700 1.6rem/1 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
}

.debug-lab .raw-panel {
  border-bottom: 0;
}

.debug-lab .subpanel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
  gap: 10px;
  padding: 0 12px;
  border-bottom: 0;
  box-shadow: inset 0 -2px 4px rgb(197 208 201 / 0.3);
}

.debug-lab .subpanel-heading > div {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.debug-lab .subpanel-heading h3 {
  margin: 0;
  font-size: 0.8rem;
}

.debug-lab .dirty-badge,
.debug-lab .synced-badge {
  border: 1px solid;
  border-radius: 999px;
  padding: 3px 7px;
  font-size: 0.65rem;
  font-weight: 700;
  white-space: nowrap;
}

.debug-lab .dirty-badge {
  border-color: #d9b76e;
  background: #fff8e9;
  color: var(--amber);
}

.debug-lab .synced-badge {
  border-color: #a9cbbb;
  background: #edf8f2;
  color: var(--green);
}

.debug-lab .raw-body {
  display: grid;
  gap: 9px;
  padding: 10px;
}

.debug-lab .raw-editor-wrap {
  position: relative;
  min-height: 260px;
  border-radius: var(--radius);
  background: #202725;
  box-shadow:
    inset 4px 4px 10px rgb(8 14 12 / 0.55),
    inset -2px -2px 5px rgb(71 88 80 / 0.24);
}

.debug-lab .raw-editor-wrap:hover {
  box-shadow:
    inset 3px 3px 8px rgb(8 14 12 / 0.45),
    inset -3px -3px 8px rgb(71 88 80 / 0.3);
}

.debug-lab .raw-editor-highlight,
.debug-lab .raw-editor {
  margin: 0;
  border: 0;
  padding: 9px;
  font:
    0.72rem/1.52 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  tab-size: 2;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.debug-lab .raw-editor-highlight {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: var(--radius);
  color: #e9efeb;
  pointer-events: none;
}

.debug-lab .raw-editor {
  position: relative;
  display: block;
  width: 100%;
  min-width: 0;
  min-height: 260px;
  resize: vertical;
  background: transparent;
  color: transparent;
  caret-color: #e9efeb;
  box-shadow: none;
}

.debug-lab .raw-editor::selection {
  background: rgb(233 239 235 / 0.18);
}

.debug-lab .tk-key {
  color: #8fd6b0;
}

.debug-lab .tk-string {
  color: #f2c879;
}

.debug-lab .tk-number {
  color: #93bce8;
}

.debug-lab .tk-literal {
  color: #d9a6e0;
}

.debug-lab .tk-punct {
  color: #9fb0a8;
}

.debug-lab .raw-actions,
.debug-lab .send-choice {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}

.debug-lab .raw-actions .secondary-button,
.debug-lab .send-choice .secondary-button {
  min-height: 34px;
  padding: 5px 7px;
  font-size: 0.7rem;
  line-height: 1.2;
}

.debug-lab .secondary-button.accent {
  background: #edf6fb;
  color: #245b84;
}

.debug-lab .visually-hidden-action {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.debug-lab .response-empty {
  min-height: 190px;
}

.debug-lab .response-panel {
  min-width: 0;
}

.debug-lab .response-status-row {
  display: flex;
  align-items: center;
  min-height: 40px;
  gap: 7px;
  padding: 0 11px;
  border-bottom: 0;
  box-shadow: inset 0 -2px 4px rgb(197 208 201 / 0.3);
  font-size: 0.73rem;
}

.debug-lab .response-status-row strong {
  font-size: 0.76rem;
}

.debug-lab .response-status-row span:last-child {
  margin-left: auto;
  color: var(--muted);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
}

.debug-lab .status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--muted);
}

.debug-lab .status-success {
  background: var(--green);
}

.debug-lab .status-error {
  background: var(--red);
}

.debug-lab .status-cancelled {
  background: var(--amber);
}

.debug-lab .status-sending,
.debug-lab .status-streaming {
  background: var(--blue);
  animation: debug-pulse 1s ease-in-out infinite alternate;
}

@keyframes debug-pulse {
  to {
    opacity: 0.35;
  }
}

.debug-lab .response-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  padding: 7px 10px;
}

.debug-lab .response-tabs button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 35px;
  gap: 5px;
  border: 0;
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--muted);
  font-size: 0.7rem;
  box-shadow: var(--shadow-raised-small);
}

.debug-lab .response-tabs button:last-child {
  border-right: 0;
}

.debug-lab .response-tabs button.active {
  box-shadow: var(--shadow-inset);
  background: var(--surface-soft);
  color: var(--ink);
  font-weight: 700;
}

.debug-lab .response-content {
  min-width: 0;
  min-height: 170px;
  padding: 10px;
}

.debug-lab .response-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.debug-lab .response-actions .secondary-button {
  min-height: 32px;
  padding: 0 10px;
  font-size: 0.72rem;
}

.debug-lab .response-text,
.debug-lab .response-raw,
.debug-lab .tool-output {
  max-height: 430px;
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  font:
    0.76rem/1.55 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
}

.debug-lab .response-raw,
.debug-lab .tool-output {
  padding: 9px;
  border-radius: 5px;
  background: #202725;
  color: #e9efeb;
}

.debug-lab .tool-output {
  margin-top: 10px;
}

.debug-lab .response-error {
  margin: 0;
  color: var(--red);
  font-size: 0.78rem;
  overflow-wrap: anywhere;
}

.debug-lab .muted-state {
  color: var(--muted);
  font-size: 0.8rem;
}

.debug-lab .diagnostics-grid {
  display: grid;
  grid-template-columns: minmax(100px, auto) minmax(0, 1fr);
  margin: 0;
  font-size: 0.72rem;
}

.debug-lab .diagnostics-grid dt,
.debug-lab .diagnostics-grid dd {
  min-width: 0;
  margin: 0;
  padding: 6px 7px;
  border-bottom: 1px solid #eceeeb;
  overflow-wrap: anywhere;
}

.debug-lab .diagnostics-grid dt {
  color: var(--muted);
}

.debug-lab .diagnostics-grid dd {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
}

.debug-lab .spin {
  animation: debug-spin 0.8s linear infinite;
}

@keyframes debug-spin {
  to {
    transform: rotate(360deg);
  }
}

.debug-lab .mobile-tabs {
  display: none;
}

.debug-lab .workspace-library {
  display: grid;
  gap: 15px;
  margin: 2px -16px -16px;
  border-top: 0;
  box-shadow: inset 0 2px 4px rgb(197 208 201 / 0.3);
}

.debug-lab .library-section {
  min-width: 0;
  padding-top: 12px;
}

.debug-lab .library-heading {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 14px 8px;
  color: #424c46;
}

.debug-lab .library-heading h3 {
  margin: 0;
  font-size: 0.78rem;
}

.debug-lab .library-heading > span {
  margin-left: auto;
  color: var(--muted);
  font:
    0.68rem/1 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
}

.debug-lab .preset-create {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 36px;
  padding: 0 14px 9px;
}

.debug-lab .preset-create input {
  border-radius: var(--radius) 0 0 var(--radius);
}

.debug-lab .preset-create .icon-button {
  width: 36px;
  height: 36px;
  border-left: 0;
  border-radius: 0 var(--radius) var(--radius) 0;
  box-shadow: var(--shadow-raised-small);
}

.debug-lab .library-list {
  border-top: 0;
  padding: 0 10px;
}

.debug-lab .library-row {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 7px;
  margin-bottom: 7px;
  padding: 8px 10px 8px 14px;
  border-bottom: 0;
  border-radius: var(--radius);
  box-shadow: var(--shadow-raised-small);
}

.debug-lab .library-row:last-child {
  border-bottom: 0;
}

.debug-lab .library-row-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
  flex: 1;
}

.debug-lab .library-row-copy strong,
.debug-lab .library-row-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.debug-lab .library-row-copy strong {
  font-size: 0.72rem;
}

.debug-lab .library-row-copy span {
  color: var(--muted);
  font-size: 0.64rem;
}

.debug-lab .library-actions {
  display: flex;
  gap: 3px;
}

.debug-lab .library-actions .icon-button {
  width: 28px;
  height: 28px;
  flex-basis: 28px;
}

.debug-lab .library-empty {
  margin: 0;
  padding: 8px 14px 12px;
  color: var(--muted);
  font-size: 0.7rem;
}

.debug-lab .modal-backdrop {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgb(19 25 22 / 0.38);
}

.debug-lab .confirm-dialog {
  width: min(360px, 100%);
  padding: 18px;
  border: 0;
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-raised);
}

.debug-lab .confirm-dialog h3 {
  margin: 0 0 7px;
  font-size: 0.92rem;
}

.debug-lab .confirm-dialog p {
  margin: 0 0 17px;
  color: var(--muted);
  font-size: 0.76rem;
  overflow-wrap: anywhere;
}

.debug-lab .dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
}

.debug-lab .danger-button {
  min-height: 38px;
  border: 0;
  border-radius: var(--radius);
  padding: 0 13px;
  background: var(--red);
  color: #fff;
  font-weight: 650;
  box-shadow: var(--shadow-raised-small);
}

@media (max-width: 1100px) {
  .debug-lab .workbench {
    grid-template-columns: minmax(230px, 0.72fr) minmax(390px, 1.28fr);
  }

  .debug-lab .inspect-area {
    grid-column: 1 / -1;
  }

  .debug-lab .empty-state {
    min-height: 180px;
  }
}

@media (max-width: 819px) {
  .debug-lab {
    padding: 12px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }

  .debug-lab .top-bar {
    padding-top: 4px;
  }

  .debug-lab .connection-summary {
    max-width: 56vw;
  }

  .debug-lab .mobile-tabs {
    display: grid;
    position: sticky;
    top: calc(var(--toolbar-height) + 8px);
    z-index: 19;
    grid-template-columns: repeat(3, 1fr);
    max-width: 520px;
    margin: 8px auto 0;
    border: 0;
    border-radius: var(--radius);
    background: var(--surface);
    box-shadow: var(--shadow-raised);
    overflow: hidden;
  }

  .debug-lab .mobile-tabs button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    gap: 6px;
    border: 0;
    border-right: 0;
    background: var(--surface);
    color: var(--muted);
    font-size: 0.7rem;
  }

  .debug-lab .mobile-tabs button:last-child {
    border-right: 0;
  }

  .debug-lab .mobile-tabs button.active {
    background: var(--surface-soft);
    color: var(--ink);
    box-shadow: var(--shadow-inset);
    font-weight: 700;
  }

  .debug-lab .workbench {
    grid-template-columns: minmax(0, 1fr);
    margin-top: 10px;
  }

  .debug-lab .work-area:not(.mobile-active) {
    display: none;
  }

  .debug-lab .inspect-area {
    grid-column: auto;
  }

  .debug-lab .compose-area {
    min-height: 0;
  }

  /* iOS Safari 聚焦时不会放大页面：输入控件字体提到 16px */
  .debug-lab input,
  .debug-lab select,
  .debug-lab textarea {
    font-size: 16px;
  }

  .debug-lab .code-input,
  .debug-lab .raw-editor,
  .debug-lab .raw-editor-highlight {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .debug-lab .brand-mark {
    display: none;
  }

  .debug-lab .connection-summary {
    max-width: 52vw;
  }

  .debug-lab .send-button,
  .debug-lab .stop-button {
    padding-inline: 10px;
  }

  .debug-lab .compact-action {
    padding-inline: 7px;
  }

  .debug-lab .compact-action {
    font-size: 0;
    gap: 0;
  }

  .debug-lab .message-toolbar {
    gap: 4px;
  }

  .debug-lab .role-field {
    width: 92px;
  }

  .debug-lab .message-index {
    display: none;
  }

  .debug-lab .row-actions {
    gap: 2px;
  }

  .debug-lab .icon-button {
    width: 30px;
    height: 30px;
    flex-basis: 30px;
  }

  .debug-lab .generation-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .debug-lab *,
  .debug-lab *::before,
  .debug-lab *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
