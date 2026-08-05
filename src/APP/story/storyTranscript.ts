import { escapeStoryHtml } from './storyDisplay';
import type { StoryChatMessage, StoryTranscriptItem } from './storyTypes';

const OPTION_BLOCK_RE = /<option(?:\s[^>]*)?>([\s\S]*?)(?:<\/option>|$)/gi;
const OPTION_MARKER_RE = /^(?:[-*]+|\d+[.)、]|[（(]?\d+[)）、]|(?:【|\[)?[A-Da-d](?:】|\]|\.|、|\)))\s*/;

function preview(text: string, maxLength = 100): string {
  const normalized = String(text ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function extractOptions(text: string): string[] {
  const options: string[] = [];
  for (const match of String(text ?? '').matchAll(OPTION_BLOCK_RE)) {
    const lines = String(match[1] ?? '')
      .replace(/<br\s*\/?>/gi, '\n')
      .split('\n')
      .map(line =>
        line
          .replace(/<[^>]+>/g, ' ')
          .replace(OPTION_MARKER_RE, '')
          .replace(/\s+/g, ' ')
          .trim(),
      )
      .filter(Boolean);
    for (const line of lines) {
      if (!options.includes(line)) options.push(line);
      if (options.length >= 8) return options;
    }
  }
  return options;
}

export interface TranscriptRenderDependencies {
  carrierMessageId: () => number | null;
  readHostHtml: (messageId: number) => string;
  formatDisplayedMessage: (text: string, messageId: number) => string;
}

export function buildStoryTranscript(
  messages: StoryChatMessage[],
  dependencies: TranscriptRenderDependencies,
  limit = 6,
): StoryTranscriptItem[] {
  const carrier = dependencies.carrierMessageId();
  const selected = messages
    .filter(
      message =>
        message.message_id > 0 &&
        message.message_id !== carrier &&
        (message.role === 'user' || message.role === 'assistant'),
    )
    .sort((a, b) => a.message_id - b.message_id)
    .slice(-limit);
  const latestId = selected.at(-1)?.message_id ?? -1;

  return selected.map(message => {
    const raw = String(message.message ?? '');
    let finalHtml = '';
    if (message.role === 'user') {
      finalHtml = escapeStoryHtml(raw);
    } else {
      finalHtml = dependencies.readHostHtml(message.message_id);
      if (!finalHtml) {
        try {
          finalHtml = dependencies.formatDisplayedMessage(raw, message.message_id);
        } catch {
          finalHtml = escapeStoryHtml(raw);
        }
      }
    }
    return {
      messageId: message.message_id,
      role: message.role,
      raw,
      preview: preview(raw),
      finalHtml,
      hidden: Boolean(message.is_hidden),
      isStreaming: false,
      isLatest: message.message_id === latestId,
      canRollback: message.message_id > 0 && message.message_id !== carrier,
      canRegenerate: message.role === 'assistant' && message.message_id > 0 && message.message_id !== carrier,
      options: message.role === 'assistant' ? extractOptions(raw) : [],
    } satisfies StoryTranscriptItem;
  });
}
