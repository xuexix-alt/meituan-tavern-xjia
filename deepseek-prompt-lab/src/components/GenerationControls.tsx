import { useEffect, useState } from 'react';
import type { GenerationSettings } from '../domain/chat';
import { RESERVED_PAYLOAD_FIELDS } from '../domain/payload';

interface GenerationControlsProps {
  generation: GenerationSettings;
  onChange: (generation: GenerationSettings) => void;
}

export function GenerationControls({ generation, onChange }: GenerationControlsProps) {
  const [additionalText, setAdditionalText] = useState(() => JSON.stringify(generation.additional, null, 2));
  const [additionalError, setAdditionalError] = useState('');

  useEffect(() => {
    setAdditionalText(JSON.stringify(generation.additional, null, 2));
  }, [generation.additional]);

  const numberValue = (key: 'temperature' | 'top_p' | 'max_tokens', value: string) => {
    onChange({ ...generation, [key]: value === '' ? undefined : Number(value) });
  };

  const updateAdditional = (text: string) => {
    setAdditionalText(text);
    try {
      const parsed: unknown = JSON.parse(text);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('请输入 JSON 对象。');
      const conflict = Object.keys(parsed).find((key) => RESERVED_PAYLOAD_FIELDS.has(key));
      if (conflict) throw new Error(`“${conflict}” 是保留的请求字段。`);
      setAdditionalError('');
      onChange({ ...generation, additional: parsed as Record<string, unknown> });
    } catch (error) {
      setAdditionalError(error instanceof Error ? error.message : 'JSON 对象无效。');
    }
  };

  return (
    <details className="generation-controls" open>
      <summary>生成参数</summary>
      <div className="generation-grid">
        <label className="field"><span>随机性（Temperature）</span><input type="number" step="0.1" value={generation.temperature ?? ''} onChange={(event) => numberValue('temperature', event.target.value)} /></label>
        <label className="field"><span>核采样（Top P）</span><input type="number" step="0.1" value={generation.top_p ?? ''} onChange={(event) => numberValue('top_p', event.target.value)} /></label>
        <label className="field"><span>最大 Token 数</span><input type="number" step="1" value={generation.max_tokens ?? ''} onChange={(event) => numberValue('max_tokens', event.target.value)} /></label>
        <label className="checkbox-field"><input type="checkbox" checked={generation.stream} onChange={(event) => onChange({ ...generation, stream: event.target.checked })} /><span>流式响应</span></label>
      </div>
      <label className="field"><span>停止序列 <small>每行一个</small></span><textarea rows={2} value={generation.stop.join('\n')} onChange={(event) => onChange({ ...generation, stop: event.target.value.split('\n').filter(Boolean) })} /></label>
      <label className="field"><span>附加参数 JSON</span><textarea className="code-input" rows={5} value={additionalText} onChange={(event) => updateAdditional(event.target.value)} /></label>
      {additionalError && <p className="field-error" role="alert">{additionalError}</p>}
    </details>
  );
}
