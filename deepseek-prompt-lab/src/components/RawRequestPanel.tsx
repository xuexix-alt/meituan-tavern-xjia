import { Braces, Download, RefreshCw, Send } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import type { PromptDraft } from '../domain/chat';
import { highlightJson } from '../domain/jsonHighlight';
import { importRawPayload } from '../domain/payload';

interface RawRequestPanelProps {
  text: string;
  isDirty: boolean;
  onTextChange: (text: string) => void;
  onApply: (draft: PromptDraft) => void;
  onRebuild: () => void;
  onSendRaw?: () => void;
  onSendStructured?: () => void;
}

export function RawRequestPanel({
  text,
  isDirty,
  onTextChange,
  onApply,
  onRebuild,
  onSendRaw,
  onSendStructured,
}: RawRequestPanelProps) {
  const parsed = useMemo(() => importRawPayload(text), [text]);
  const highlighted = useMemo(() => highlightJson(text), [text]);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    syncHighlightScroll();
  }, [text]);

  function syncHighlightScroll() {
    const editor = editorRef.current;
    const highlight = highlightRef.current;
    if (editor && highlight) {
      highlight.scrollTop = editor.scrollTop;
      highlight.scrollLeft = editor.scrollLeft;
    }
  }

  return (
    <section className="raw-panel" aria-labelledby="raw-request-heading">
      <div className="subpanel-heading">
        <div><Braces size={15} aria-hidden="true" /><h3 id="raw-request-heading">原始请求</h3></div>
        {isDirty ? <span className="dirty-badge">原始 JSON 未同步</span> : <span className="synced-badge">已同步</span>}
      </div>
      <div className="raw-body">
        <label className="field">
          <span className="sr-only">原始请求 JSON</span>
          <div className="raw-editor-wrap">
            <pre
              className="raw-editor-highlight"
              aria-hidden="true"
              ref={highlightRef}
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
            <textarea
              className="raw-editor"
              aria-label="原始请求 JSON"
              spellCheck={false}
              ref={editorRef}
              onScroll={syncHighlightScroll}
              value={text}
              onChange={(event) => onTextChange(event.target.value)}
            />
          </div>
        </label>
        {!parsed.success && <p className="field-error" role="alert">{parsed.error}</p>}
        <div className="raw-actions">
          <button className="secondary-button" type="button" disabled={!parsed.success} onClick={() => parsed.success && onApply(parsed.draft)}>
            <Download size={15} /> 应用到结构化编辑器
          </button>
          <button className="secondary-button" type="button" onClick={onRebuild}>
            <RefreshCw size={15} /> 从结构化编辑器重建
          </button>
        </div>
        {isDirty && (
          <div className="send-choice">
            <button className="secondary-button" type="button" onClick={onSendStructured}><Send size={15} /> 发送结构化请求</button>
            <button className="secondary-button accent" type="button" disabled={!parsed.success} onClick={onSendRaw}><Braces size={15} /> 发送原始 JSON</button>
          </div>
        )}
        {!isDirty && (
          <button className="visually-hidden-action" type="button" disabled={!parsed.success} onClick={onSendRaw}>发送原始 JSON</button>
        )}
      </div>
    </section>
  );
}
