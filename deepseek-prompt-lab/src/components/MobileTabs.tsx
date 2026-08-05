import { Braces, MessagesSquare, PlugZap } from 'lucide-react';

export type WorkArea = 'connection' | 'compose' | 'inspect';

export function MobileTabs({ active, onChange }: { active: WorkArea; onChange: (area: WorkArea) => void }) {
  return (
    <div className="mobile-tabs" role="tablist" aria-label="工作区">
      <AreaTab area="connection" label="连接区" active={active} onChange={onChange}><PlugZap size={16} /></AreaTab>
      <AreaTab area="compose" label="编辑区" active={active} onChange={onChange}><MessagesSquare size={16} /></AreaTab>
      <AreaTab area="inspect" label="检查区" active={active} onChange={onChange}><Braces size={16} /></AreaTab>
    </div>
  );
}

function AreaTab({ area, label, active, onChange, children }: {
  area: WorkArea;
  label: string;
  active: WorkArea;
  onChange: (area: WorkArea) => void;
  children: React.ReactNode;
}) {
  const selected = area === active;
  const areaNames: Record<WorkArea, string> = { connection: '连接', compose: '编辑', inspect: '检查' };
  return <button type="button" role="tab" aria-label={label} aria-selected={selected} className={selected ? 'active' : ''} onClick={() => onChange(area)}>{children}<span>{areaNames[area]}</span></button>;
}
