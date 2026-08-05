import type { StorySubmitResult } from './storyTypes';

interface StorySubmitter {
  submitPrompt: (text: string) => Promise<StorySubmitResult>;
}

interface StoryRouter {
  push: (path: string) => unknown | Promise<unknown>;
}

export async function submitOrderToStory(
  session: StorySubmitter,
  router: StoryRouter,
  text: string,
): Promise<StorySubmitResult> {
  const result = await session.submitPrompt(text);
  if (!result.accepted) return result;
  await router.push('/story');
  return result;
}
