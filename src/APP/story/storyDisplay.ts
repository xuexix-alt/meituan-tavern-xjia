export type StoryRole = 'assistant' | 'user' | 'system';

export type StoryDisplayRegex = (
  text: string,
  source: 'ai_output' | 'user_input' | 'world_info',
  destination: 'display',
  options: { depth: number },
) => string;

export function escapeStoryHtml(text: string): string {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function regexSourceForRole(role: StoryRole): 'ai_output' | 'user_input' | 'world_info' {
  if (role === 'user') return 'user_input';
  if (role === 'system') return 'world_info';
  return 'ai_output';
}

function resolveDisplayRegex(): StoryDisplayRegex | null {
  if (typeof formatAsTavernRegexedString !== 'function') return null;
  return formatAsTavernRegexedString as StoryDisplayRegex;
}

export function renderStreamingStoryHtml(
  text: string,
  role: StoryRole,
  applyRegex: StoryDisplayRegex | null = resolveDisplayRegex(),
): string {
  const source = String(text ?? '');
  if (!source.trim()) return '';
  if (!applyRegex) return escapeStoryHtml(source);

  try {
    const regexed = applyRegex(source, regexSourceForRole(role), 'display', { depth: 0 });
    if (typeof regexed !== 'string') return escapeStoryHtml(source);
    if (regexed === source) return escapeStoryHtml(source);
    return regexed;
  } catch (error) {
    console.warn('[APP story] streaming display regex failed', error);
    return escapeStoryHtml(source);
  }
}
