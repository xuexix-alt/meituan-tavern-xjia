import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { listModels } from '../api/client';
import type { ConnectionSettings } from '../storage/localStore';
import type { PromptPreset, RequestHistory } from '../storage/localStore';
import { WorkspaceLibrary } from './WorkspaceLibrary';

interface ConnectionPanelProps {
  connection: ConnectionSettings;
  onChange: (connection: ConnectionSettings) => void;
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

export function ConnectionPanel(props: ConnectionPanelProps) {
  const { connection, onChange } = props;
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revealKey, setRevealKey] = useState(false);
  const [manualModel, setManualModel] = useState(true);

  const patch = (next: Partial<ConnectionSettings>) => onChange({ ...connection, ...next });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const loadedModels = await listModels(connection);
      setModels(loadedModels);
      setManualModel(!loadedModels.includes(connection.model));
    } catch (reason) {
      setError(`无法拉取模型：${reason instanceof Error ? reason.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel-body stack">
      <label className="field">
        <span>接口地址（Base URL）</span>
        <input value={connection.baseUrl} onChange={(event) => patch({ baseUrl: event.target.value })} />
      </label>

      <div className="field">
        <label htmlFor="provider-api-key">API 密钥</label>
        <div className="input-with-action">
          <input
            id="provider-api-key"
            type={revealKey ? 'text' : 'password'}
            value={connection.apiKey}
            onChange={(event) => patch({ apiKey: event.target.value })}
            autoComplete="off"
          />
          <button
            className="icon-button"
            type="button"
            aria-label={revealKey ? '隐藏 API 密钥' : '显示 API 密钥'}
            title={revealKey ? '隐藏 API 密钥' : '显示 API 密钥'}
            onClick={() => setRevealKey((value) => !value)}
          >
            {revealKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {models.length > 0 ? (
        <>
          <label className="field">
            <span>模型</span>
            <select
              value={manualModel || !models.includes(connection.model) ? '__manual__' : connection.model}
              onChange={(event) => {
                if (event.target.value === '__manual__') {
                  setManualModel(true);
                  return;
                }
                setManualModel(false);
                patch({ model: event.target.value });
              }}
            >
              {models.map((model) => <option key={model} value={model}>{model}</option>)}
              <option value="__manual__">其他模型（手动输入）</option>
            </select>
          </label>
          {(manualModel || !models.includes(connection.model)) && (
            <label className="field">
              <span>手动模型名称</span>
              <input value={connection.model} onChange={(event) => patch({ model: event.target.value })} />
            </label>
          )}
        </>
      ) : (
        <label className="field">
          <span>模型</span>
          <input value={connection.model} onChange={(event) => patch({ model: event.target.value })} />
        </label>
      )}

      <button className="secondary-button" type="button" onClick={load} disabled={loading}>
        <RefreshCw size={16} className={loading ? 'spin' : undefined} aria-hidden="true" />
        {loading ? '正在拉取模型' : '拉取模型列表'}
      </button>
      {error && <p className="field-error" role="alert">{error}</p>}
      {models.length > 0 && <p className="field-note">已获取 {models.length} 个模型</p>}
      <WorkspaceLibrary {...props} />
    </div>
  );
}
