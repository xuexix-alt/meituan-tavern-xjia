import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, Copy, GripVertical, Trash2 } from 'lucide-react';
import type { ChatMessage, MessageRole } from '../domain/chat';

interface MessageRowProps {
  message: ChatMessage;
  index: number;
  count: number;
  onChange: (message: ChatMessage) => void;
  onCopy: () => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
}

const roles: MessageRole[] = ['system', 'user', 'assistant', 'tool'];
const roleLabels: Record<MessageRole, string> = { system: '系统', user: '用户', assistant: '助手', tool: '工具' };

export function MessageRow({ message, index, count, onChange, onCopy, onDelete, onMove }: MessageRowProps) {
  const sortable = useSortable({ id: message.id });
  const style = { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition };

  const changeRole = (role: MessageRole) => {
    const next = { ...message, role };
    if (role !== 'tool') delete next.tool_call_id;
    onChange(next);
  };

  return (
    <article ref={sortable.setNodeRef} style={style} className="message-row" data-testid="message-row">
      <div className="message-toolbar">
        <button
          type="button"
          className="drag-handle icon-button"
          aria-label="拖动消息"
          title="拖动排序"
          {...sortable.attributes}
          {...sortable.listeners}
        >
          <GripVertical size={16} />
        </button>
        <label className="role-field">
          <span className="sr-only">第 {index + 1} 条消息的角色</span>
          <select value={message.role} onChange={(event) => changeRole(event.target.value as MessageRole)}>
            {roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
          </select>
        </label>
        <span className="message-index">#{index + 1}</span>
        <div className="row-actions">
          <button className="icon-button" type="button" aria-label="上移消息" title="上移" disabled={index === 0} onClick={() => onMove(-1)}><ChevronUp size={16} /></button>
          <button className="icon-button" type="button" aria-label="下移消息" title="下移" disabled={index === count - 1} onClick={() => onMove(1)}><ChevronDown size={16} /></button>
          <button className="icon-button" type="button" aria-label="复制消息" title="复制消息" onClick={onCopy}><Copy size={16} /></button>
          <button className="icon-button danger" type="button" aria-label="删除消息" title="删除消息" disabled={count === 1} onClick={onDelete}><Trash2 size={16} /></button>
        </div>
      </div>
      {!message.collapsed && (
        <div className="message-content">
          <label className="field">
            <span className="sr-only">消息内容</span>
            <textarea
              aria-label="消息内容"
              rows={message.role === 'system' ? 6 : 5}
              value={message.content}
              placeholder={`${roleLabels[message.role]}消息`}
              onChange={(event) => onChange({ ...message, content: event.target.value })}
            />
          </label>
          {message.role === 'tool' && (
            <label className="field compact-field">
              <span>工具调用 ID</span>
              <input value={message.tool_call_id ?? ''} onChange={(event) => onChange({ ...message, tool_call_id: event.target.value })} />
            </label>
          )}
        </div>
      )}
    </article>
  );
}

