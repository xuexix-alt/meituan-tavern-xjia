import { inject, provide, type InjectionKey } from 'vue';
import type { StorySession } from './storyTypes';

const STORY_SESSION_KEY: InjectionKey<StorySession> = Symbol('meituan-story-session');

export function provideStorySession(session: StorySession): void {
  provide(STORY_SESSION_KEY, session);
}

export function useStorySession(): StorySession {
  const session = inject(STORY_SESSION_KEY, null);
  if (!session) throw new Error('正文会话尚未初始化。');
  return session;
}
