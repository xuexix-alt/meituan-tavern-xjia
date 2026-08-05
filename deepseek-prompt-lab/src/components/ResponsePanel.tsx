import { Activity, Braces, Download, MessageSquareText } from 'lucide-react';
import { useState } from 'react';
import type { ChatRunState } from '../hooks/useChatRun';

type ResponseTab = 'text' | 'raw' | 'diagnostics';

const statusLabels: Record<ChatRunState['status'], string> = {
  idle: '待命',
  sending: '正在发送',
  streaming: '正在接收',
  success: '成功',
  error: '错误',
  cancelled: '已取消',
};

function responseFileName(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `deepseek-response-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.txt`;
}

function downloadTextFile(content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = responseFileName();
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ResponsePanel({ run }: { run: ChatRunState }) {
  const [tab, setTab] = useState<ResponseTab>('text');

  if (run.status === 'idle') {
    return (
      <div className="empty-state response-empty">
        <span className="empty-glyph" aria-hidden="true">›_</span>
        <strong>等待发送请求</strong>
        <span>响应文本、原始事件和诊断信息将显示在这里。</span>
      </div>
    );
  }

  return (
    <section className="response-panel" aria-label="响应结果">
      <div className="response-status-row">
        <span className={`status-dot status-${run.status}`} aria-hidden="true" />
        <strong>{statusLabels[run.status]}</strong>
        <span>{run.durationMs} 毫秒</span>
      </div>
      <div className="response-tabs" role="tablist" aria-label="响应视图">
        <TabButton active={tab === 'text'} onClick={() => setTab('text')} icon={<MessageSquareText size={14} />}>文本</TabButton>
        <TabButton active={tab === 'raw'} onClick={() => setTab('raw')} icon={<Braces size={14} />}>原始数据</TabButton>
        <TabButton active={tab === 'diagnostics'} onClick={() => setTab('diagnostics')} icon={<Activity size={14} />}>诊断</TabButton>
      </div>
      <div className="response-content">
        {tab === 'text' && (
          <>
            {run.error && <p className="response-error">{run.error}</p>}
            {run.status === 'cancelled' && !run.text && <p className="muted-state">已取消</p>}
            {run.text && (
              <>
                <div className="response-actions">
                  <button className="secondary-button" type="button" onClick={() => downloadTextFile(run.text)}>
                    <Download size={14} /> 导出 TXT
                  </button>
                </div>
                <pre className="response-text">{run.text}</pre>
              </>
            )}
            {run.toolCalls.length > 0 && <pre className="tool-output">{JSON.stringify(run.toolCalls, null, 2)}</pre>}
          </>
        )}
        {tab === 'raw' && <pre className="response-raw">{run.rawFrames.join('\n\n') || run.errorBody || '没有原始响应内容。'}</pre>}
        {tab === 'diagnostics' && (
          <dl className="diagnostics-grid">
            <dt>状态</dt><dd>{statusLabels[run.status]}</dd>
            <dt>HTTP 状态码</dt><dd>{run.httpStatus ?? '—'}</dd>
            <dt>耗时</dt><dd>{run.durationMs} 毫秒</dd>
            <dt>结束原因</dt><dd>{run.finishReason ?? '—'}</dd>
            <dt>请求 ID</dt><dd>{run.requestId ?? '—'}</dd>
            <dt>输入 Token</dt><dd>{run.usage?.prompt_tokens ?? '—'}</dd>
            <dt>输出 Token</dt><dd>{run.usage?.completion_tokens ?? '—'}</dd>
            <dt>Token 总数</dt><dd>{run.usage?.total_tokens ?? '—'}</dd>
            <dt>解析错误</dt><dd>{run.parserErrors.length}</dd>
          </dl>
        )}
      </div>
    </section>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return <button type="button" role="tab" aria-selected={active} className={active ? 'active' : ''} onClick={onClick}>{icon}{children}</button>;
}
