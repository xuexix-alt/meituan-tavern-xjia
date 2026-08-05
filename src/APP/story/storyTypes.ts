import type { ComputedRef, Ref } from 'vue';
import type { StoryRole } from './storyDisplay';

export type StoryStatus = 'idle' | 'preparing' | 'streaming' | 'persisting' | 'done' | 'error' | 'cancelled';

export interface StoryChatMessage {
  message_id: number;
  role: StoryRole;
  message: string;
  is_hidden?: boolean;
}

export interface StoryTranscriptItem {
  messageId: number;
  role: StoryRole;
  raw: string;
  preview: string;
  finalHtml: string;
  hidden: boolean;
  isStreaming: boolean;
  isLatest: boolean;
  canRollback: boolean;
  canRegenerate: boolean;
  options: string[];
}

export interface StorySubmitResult {
  accepted: boolean;
  error?: string;
}

export interface StorySession {
  baseItems: Ref<StoryTranscriptItem[]>;
  items: ComputedRef<StoryTranscriptItem[]>;
  composerText: Ref<string>;
  streamingText: Ref<string>;
  status: Ref<StoryStatus>;
  error: Ref<string>;
  activeGenerationId: Ref<string | null>;
  busy: ComputedRef<boolean>;
  latestAssistant: ComputedRef<StoryTranscriptItem | null>;
  refresh: (reason?: string) => void;
  submitPrompt: (text?: string) => Promise<StorySubmitResult>;
  updateStreamingText: (text: string, generationId?: string) => void;
  cancelGeneration: () => void;
  regenerate: (messageId?: number) => Promise<boolean>;
  rollbackFrom: (messageId: number) => Promise<boolean>;
  bind: () => void;
  dispose: () => void;
}
