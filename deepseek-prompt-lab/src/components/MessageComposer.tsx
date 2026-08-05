import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { ChatMessage } from '../domain/chat';
import { addMessage, copyMessage, moveMessage, removeMessage } from '../domain/messages';
import { MessageRow } from './MessageRow';

interface MessageComposerProps {
  messages: ChatMessage[];
  onChange: (messages: ChatMessage[]) => void;
  macroName: string;
  macroValue: string;
  onMacroValueChange: (value: string) => void;
}

export function MessageComposer({ messages, onChange, macroName, macroValue, onMacroValueChange }: MessageComposerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onChange(moveMessage(messages, messages.findIndex((item) => item.id === active.id), messages.findIndex((item) => item.id === over.id)));
  };

  return (
    <div className="composer-body">
      <label className="field macro-field">
        <span>用户输入（宏变量内容）</span>
        <textarea
          rows={2}
          value={macroValue}
          aria-label="用户输入（宏变量内容）"
          placeholder={`在这里输入内容，发送时将替换消息中的 ${macroName}`}
          onChange={(event) => onMacroValueChange(event.target.value)}
        />
        <small>发送请求时，消息里出现的 {macroName} 会被替换成上面的输入内容；留空则替换为空。</small>
      </label>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={messages.map((message) => message.id)} strategy={verticalListSortingStrategy}>
          <div className="message-list">
            {messages.map((message, index) => (
              <MessageRow
                key={message.id}
                message={message}
                index={index}
                count={messages.length}
                onChange={(next) => onChange(messages.map((item) => item.id === next.id ? next : item))}
                onCopy={() => onChange(copyMessage(messages, message.id))}
                onDelete={() => onChange(removeMessage(messages, message.id))}
                onMove={(direction) => onChange(moveMessage(messages, index, index + direction))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button className="secondary-button add-message" type="button" onClick={() => onChange(addMessage(messages))}>
        <Plus size={16} /> 添加消息
      </button>
    </div>
  );
}

