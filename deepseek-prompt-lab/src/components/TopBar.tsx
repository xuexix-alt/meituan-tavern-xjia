import { Download, Play, Square, Upload } from 'lucide-react';
import { useRef } from 'react';

interface TopBarProps {
  running?: boolean;
  statusText?: string;
  onSend?: () => void;
  onStop?: () => void;
  onImport?: (file: File) => void;
  onExport?: () => void;
  importError?: string;
}

export function TopBar({ running = false, statusText = '就绪', onSend, onStop, onImport, onExport, importError }: TopBarProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  return (
    <header className="top-bar" aria-describedby={importError ? 'import-error' : undefined}>
      <div className="brand-block">
        <span className="brand-mark" aria-hidden="true">P</span>
        <div>
          <h1>提示词调试台</h1>
          <p className="connection-summary">本地代理 · {statusText}</p>
        </div>
      </div>
      <div className="top-actions">
        <input
          ref={fileInput}
          className="visually-hidden-action"
          type="file"
          accept="application/json,.json"
          aria-label="选择工作台 JSON 文件"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImport?.(file);
            event.currentTarget.value = '';
          }}
        />
        <button className="secondary-button compact-action" type="button" onClick={() => fileInput.current?.click()}>
          <Upload aria-hidden="true" size={15} /> 导入 JSON
        </button>
        <button className="secondary-button compact-action" type="button" onClick={onExport}>
          <Download aria-hidden="true" size={15} /> 导出 JSON
        </button>
        <button className={running ? 'stop-button' : 'send-button'} type="button" onClick={running ? onStop : onSend}>
          {running ? <Square aria-hidden="true" size={16} /> : <Play aria-hidden="true" size={16} />}
          {running ? '停止请求' : '发送请求'}
        </button>
      </div>
      {importError && <span id="import-error" className="top-error" role="alert">{importError}</span>}
    </header>
  );
}
