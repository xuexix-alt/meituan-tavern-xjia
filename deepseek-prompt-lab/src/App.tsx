import { useEffect, useRef, useState } from 'react';
import type { GenerationSettings, PromptDraft } from './domain/chat';
import { buildPayload, importRawPayload } from './domain/payload';
import {
  HISTORY_LIMIT,
  sanitizeHistoryEntry,
  toPromptPreset,
  type ConnectionSettings,
  type PromptPreset,
  type RequestHistory,
} from './storage/localStore';
import { usePersistentState } from './hooks/usePersistentState';
import { ConnectionPanel } from './components/ConnectionPanel';
import { GenerationControls } from './components/GenerationControls';
import { MessageComposer } from './components/MessageComposer';
import { TopBar } from './components/TopBar';
import { RawRequestPanel } from './components/RawRequestPanel';
import { ResponsePanel } from './components/ResponsePanel';
import { useChatRun } from './hooks/useChatRun';
import { MobileTabs, type WorkArea } from './components/MobileTabs';
import { exportPlaygroundConfig, importPlaygroundConfig } from './domain/playgroundConfig';
import { DEFAULT_MACRO_NAME, applyMacroToPayload, resolveMacros } from './domain/macros';

export function App() {
  const [workspace, setWorkspace] = usePersistentState();
  const [rawText, setRawText] = useState(() => JSON.stringify(buildPayload(workspace.draft), null, 2));
  const [isRawDirty, setIsRawDirty] = useState(false);
  const [activeArea, setActiveArea] = useState<WorkArea>('compose');
  const [importError, setImportError] = useState('');
  const chatRun = useChatRun();
  const pendingPayload = useRef<{ payload: Record<string, unknown>; connection: ConnectionSettings } | null>(null);
  const recordedRunId = useRef(0);
  const running = chatRun.state.status === 'sending' || chatRun.state.status === 'streaming';

  useEffect(() => {
    if (!isRawDirty) setRawText(JSON.stringify(buildPayload(workspace.draft), null, 2));
  }, [workspace.draft, isRawDirty]);

  useEffect(() => {
    const status = chatRun.state.status;
    if (!['success', 'error', 'cancelled'].includes(status)) return;
    if (!pendingPayload.current || recordedRunId.current === chatRun.state.runId) return;
    recordedRunId.current = chatRun.state.runId;
    const pending = pendingPayload.current;
    const entry = sanitizeHistoryEntry({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      model: typeof pending.payload.model === 'string' ? pending.payload.model : pending.connection.model,
      baseUrl: pending.connection.baseUrl,
      status,
      durationMs: chatRun.state.durationMs,
      payload: structuredClone(pending.payload),
      responseText: chatRun.state.text,
      requestId: chatRun.state.requestId,
      httpStatus: chatRun.state.httpStatus,
      error: chatRun.state.error,
    } as RequestHistory);
    setWorkspace((current) => ({ ...current, history: [entry, ...current.history].slice(0, HISTORY_LIMIT) }));
  }, [chatRun.state, setWorkspace]);

  const updateDraft = (draft: PromptDraft) => {
    setWorkspace((current) => ({ ...current, draft }));
  };

  const updateConnection = (connection: ConnectionSettings) => {
    setWorkspace((current) => ({
      ...current,
      connection,
      draft: { ...current.draft, model: connection.model },
    }));
  };

  const updateGeneration = (generation: GenerationSettings) => {
    updateDraft({ ...workspace.draft, generation });
  };

  const applyRawDraft = (draft: PromptDraft) => {
    setWorkspace((current) => ({
      ...current,
      connection: { ...current.connection, model: draft.model },
      draft,
    }));
    setRawText(JSON.stringify(buildPayload(draft), null, 2));
    setIsRawDirty(false);
  };

  const rebuildRaw = () => {
    if (isRawDirty && !window.confirm('放弃尚未同步的原始 JSON 修改吗？')) return;
    setRawText(JSON.stringify(buildPayload(workspace.draft), null, 2));
    setIsRawDirty(false);
  };

  const runPayload = (payload: Record<string, unknown>, connection = workspace.connection) => {
    pendingPayload.current = { payload: structuredClone(payload), connection: { ...connection } };
    void chatRun.send(connection, payload);
  };

  const sendStructured = () => {
    const resolved = resolveMacros(workspace.draft, workspace.macroName, workspace.macroInput);
    runPayload(buildPayload(resolved) as Record<string, unknown>);
  };

  const sendRaw = () => {
    try {
      const payload = JSON.parse(rawText) as Record<string, unknown>;
      runPayload(applyMacroToPayload(payload, workspace.macroName, workspace.macroInput));
    } catch {
      // RawRequestPanel keeps this command disabled while the text is invalid.
    }
  };

  const importWorkspaceFile = async (file: File) => {
    setImportError('');
    try {
      const result = importPlaygroundConfig(await file.text());
      if (!result.success) {
        setImportError(result.error);
        return;
      }
      const { config } = result;
      setWorkspace((current) => ({
        ...current,
        connection: {
          ...current.connection,
          ...(config.baseUrl === undefined ? {} : { baseUrl: config.baseUrl }),
          model: config.draft.model,
        },
        draft: config.draft,
        ...(config.macroName === undefined ? {} : { macroName: config.macroName }),
        ...(config.appendReply === undefined ? {} : { appendReply: config.appendReply }),
      }));
      setRawText(JSON.stringify(buildPayload(config.draft), null, 2));
      setIsRawDirty(false);
    } catch {
      setImportError('无法读取这个 JSON 文件。');
    }
  };

  const exportWorkspaceFile = () => {
    const config = exportPlaygroundConfig({
      baseUrl: workspace.connection.baseUrl,
      draft: workspace.draft,
      macroName: workspace.macroName,
      appendReply: workspace.appendReply,
    });
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'prompt-playground.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const replaceDraft = (draft: PromptDraft, baseUrl = workspace.connection.baseUrl) => {
    setWorkspace((current) => ({
      ...current,
      connection: { ...current.connection, baseUrl, model: draft.model },
      draft,
    }));
    setRawText(JSON.stringify(buildPayload(draft), null, 2));
    setIsRawDirty(false);
  };

  const savePreset = (name: string) => {
    const preset = toPromptPreset(name, workspace.draft, workspace.connection);
    setWorkspace((current) => ({ ...current, presets: [preset, ...current.presets] }));
  };

  const loadPreset = (preset: PromptPreset) => replaceDraft(structuredClone(preset.draft), preset.baseUrl);

  const copyPreset = (preset: PromptPreset) => {
    const now = new Date().toISOString();
    const copy: PromptPreset = {
      ...structuredClone(preset),
      id: crypto.randomUUID(),
      name: `${preset.name} 副本`,
      createdAt: now,
      updatedAt: now,
    };
    setWorkspace((current) => ({ ...current, presets: [copy, ...current.presets] }));
  };

  const loadHistory = (entry: RequestHistory) => {
    const imported = importRawPayload(JSON.stringify(entry.payload));
    if (imported.success) replaceDraft(imported.draft, entry.baseUrl ?? workspace.connection.baseUrl);
  };

  const resendHistory = (entry: RequestHistory) => {
    const connection = {
      ...workspace.connection,
      baseUrl: entry.baseUrl ?? workspace.connection.baseUrl,
      model: entry.model,
    };
    setWorkspace((current) => ({ ...current, connection }));
    runPayload(structuredClone(entry.payload), connection);
  };

  return (
    <main className="app-shell">
      <TopBar
        statusText={`${workspace.connection.model || '未选择模型'} · ${workspace.connection.baseUrl || '未填写接口'}`}
        running={running}
        onSend={sendStructured}
        onStop={chatRun.cancel}
        onImport={importWorkspaceFile}
        onExport={exportWorkspaceFile}
        importError={importError}
      />

      <MobileTabs active={activeArea} onChange={setActiveArea} />

      <section aria-label="提示词调试工作区" className="workbench">
        <section className={`work-area connection-area${activeArea === 'connection' ? ' mobile-active' : ''}`} aria-labelledby="connection-heading">
          <header className="work-area-header">
            <div><span className="section-kicker">01</span><h2 id="connection-heading">连接</h2></div>
          </header>
          <ConnectionPanel
            connection={workspace.connection}
            onChange={updateConnection}
            presets={workspace.presets}
            history={workspace.history}
            onSavePreset={savePreset}
            onLoadPreset={loadPreset}
            onCopyPreset={copyPreset}
            onDeletePreset={(id) => setWorkspace((current) => ({ ...current, presets: current.presets.filter((preset) => preset.id !== id) }))}
            onLoadHistory={loadHistory}
            onResendHistory={resendHistory}
            onDeleteHistory={(id) => setWorkspace((current) => ({ ...current, history: current.history.filter((entry) => entry.id !== id) }))}
          />
        </section>

        <section className={`work-area compose-area${activeArea === 'compose' ? ' mobile-active' : ''}`} aria-labelledby="compose-heading">
          <header className="work-area-header">
            <div><span className="section-kicker">02</span><h2 id="compose-heading">编辑</h2></div>
            <span className="count-badge">{workspace.draft.messages.length} 条消息</span>
          </header>
          <MessageComposer
            messages={workspace.draft.messages}
            onChange={(messages) => updateDraft({ ...workspace.draft, messages })}
            macroName={workspace.macroName || DEFAULT_MACRO_NAME}
            macroValue={workspace.macroInput}
            onMacroValueChange={(macroInput) => setWorkspace((current) => ({ ...current, macroInput }))}
          />
          <GenerationControls generation={workspace.draft.generation} onChange={updateGeneration} />
        </section>

        <section className={`work-area inspect-area${activeArea === 'inspect' ? ' mobile-active' : ''}`} aria-labelledby="inspect-heading">
          <header className="work-area-header">
            <div><span className="section-kicker">03</span><h2 id="inspect-heading">检查</h2></div>
          </header>
          <RawRequestPanel
            text={rawText}
            isDirty={isRawDirty}
            onTextChange={(text) => { setRawText(text); setIsRawDirty(true); }}
            onApply={applyRawDraft}
            onRebuild={rebuildRaw}
            onSendRaw={sendRaw}
            onSendStructured={sendStructured}
          />
          <ResponsePanel run={chatRun.state} />
        </section>
      </section>
    </main>
  );
}


