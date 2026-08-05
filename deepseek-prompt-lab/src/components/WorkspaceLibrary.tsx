import { Copy, History, RotateCw, Save, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import type { PromptPreset, RequestHistory } from '../storage/localStore';

interface WorkspaceLibraryProps {
  presets: PromptPreset[];
  history: RequestHistory[];
  onSavePreset: (name: string) => void;
  onLoadPreset: (preset: PromptPreset) => void;
  onCopyPreset: (preset: PromptPreset) => void;
  onDeletePreset: (id: string) => void;
  onLoadHistory: (entry: RequestHistory) => void;
  onResendHistory: (entry: RequestHistory) => void;
  onDeleteHistory: (id: string) => void;
}

type DeleteTarget = { type: 'preset' | 'history'; id: string; label: string };

const historyStatusLabels: Record<RequestHistory['status'], string> = {
  success: '成功',
  error: '错误',
  cancelled: '已取消',
};

export function WorkspaceLibrary(props: WorkspaceLibraryProps) {
  const [presetName, setPresetName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    props.onSavePreset(name);
    setPresetName('');
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'preset') props.onDeletePreset(deleteTarget.id);
    else props.onDeleteHistory(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="workspace-library">
      <section className="library-section" aria-labelledby="presets-heading">
        <div className="library-heading"><Save size={15} aria-hidden="true" /><h3 id="presets-heading">预设</h3></div>
        <div className="preset-create">
          <label className="sr-only" htmlFor="preset-name">预设名称</label>
          <input
            id="preset-name"
            value={presetName}
            placeholder="预设名称"
            onChange={(event) => setPresetName(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') savePreset(); }}
          />
          <button className="icon-button" type="button" title="保存预设" aria-label="保存预设" disabled={!presetName.trim()} onClick={savePreset}>
            <Save size={15} />
          </button>
        </div>
        {props.presets.length === 0
          ? <p className="library-empty">暂无已保存的预设</p>
          : <div className="library-list">{props.presets.map((preset) => (
            <div className="library-row" key={preset.id}>
              <div className="library-row-copy"><strong>{preset.name}</strong><span>{preset.draft.model}</span></div>
              <div className="library-actions">
                <IconAction label={`加载预设 ${preset.name}`} title="加载预设" onClick={() => props.onLoadPreset(preset)}><Upload size={14} /></IconAction>
                <IconAction label={`复制预设 ${preset.name}`} title="复制预设" onClick={() => props.onCopyPreset(preset)}><Copy size={14} /></IconAction>
                <IconAction danger label={`删除预设 ${preset.name}`} title="删除预设" onClick={() => setDeleteTarget({ type: 'preset', id: preset.id, label: preset.name })}><Trash2 size={14} /></IconAction>
              </div>
            </div>
          ))}</div>}
      </section>

      <section className="library-section" aria-labelledby="history-heading">
        <div className="library-heading"><History size={15} aria-hidden="true" /><h3 id="history-heading">历史记录</h3><span>{props.history.length}</span></div>
        {props.history.length === 0
          ? <p className="library-empty">暂无请求记录</p>
          : <div className="library-list">{props.history.map((entry) => (
            <div className="library-row history-row" key={entry.id}>
              <div className="library-row-copy">
                <strong>{historySummary(entry)}</strong>
                <span>{entry.model} · {historyStatusLabels[entry.status]} · {entry.durationMs} 毫秒</span>
              </div>
              <div className="library-actions">
                <IconAction label="加载历史请求" title="加载请求" onClick={() => props.onLoadHistory(entry)}><Upload size={14} /></IconAction>
                <IconAction label="重新发送历史请求" title="重新发送请求" onClick={() => props.onResendHistory(entry)}><RotateCw size={14} /></IconAction>
                <IconAction danger label="删除历史请求" title="删除请求" onClick={() => setDeleteTarget({ type: 'history', id: entry.id, label: historySummary(entry) })}><Trash2 size={14} /></IconAction>
              </div>
            </div>
          ))}</div>}
      </section>

      {deleteTarget && (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-label={deleteTarget.type === 'preset' ? '删除预设' : '删除历史记录'}>
            <h3>{deleteTarget.type === 'preset' ? '删除这个预设？' : '删除这条历史记录？'}</h3>
            <p>{deleteTarget.label}</p>
            <div className="dialog-actions">
              <button className="secondary-button" type="button" onClick={() => setDeleteTarget(null)}>取消</button>
              <button className="danger-button" type="button" onClick={confirmDelete}>确认删除</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function IconAction({ label, title, danger = false, onClick, children }: {
  label: string;
  title: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return <button className={`icon-button${danger ? ' danger' : ''}`} type="button" aria-label={label} title={title} onClick={onClick}>{children}</button>;
}

function historySummary(entry: RequestHistory): string {
  const messages = Array.isArray(entry.payload.messages) ? entry.payload.messages : [];
  const candidate = [...messages].reverse().find((message) => message && typeof message === 'object' && (message as { role?: unknown }).role === 'user');
  const content = candidate && typeof (candidate as { content?: unknown }).content === 'string'
    ? (candidate as { content: string }).content.trim()
    : '';
  return content.slice(0, 52) || new Date(entry.timestamp).toLocaleString();
}
