import { createStorySession, type StorySessionDependencies } from './storySession';
import type { StoryChatMessage } from './storyTypes';

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} 不一致。\n实际: ${JSON.stringify(actual)}\n期望: ${JSON.stringify(expected)}`);
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createHarness(initial: StoryChatMessage[] = []) {
  const messages = initial.map(message => ({ ...message }));
  const operations: string[] = [];
  const hiddenReservations: number[] = [];
  const stopped: string[] = [];
  let generation = deferred<string>();
  let generationPrompt = '';

  const dependencies: StorySessionDependencies = {
    readMessages: () => messages.map(message => ({ ...message })),
    createMessages: async created => {
      for (const message of created) {
        const id = Math.max(0, ...messages.map(item => item.message_id)) + 1;
        messages.push({ message_id: id, role: message.role, message: message.message, is_hidden: false });
        operations.push(`create:${message.role}:${message.message}`);
      }
    },
    deleteMessages: async ids => {
      operations.push(`delete:${ids.join(',')}`);
      ids.forEach(id => {
        const index = messages.findIndex(message => message.message_id === id);
        if (index >= 0) messages.splice(index, 1);
      });
    },
    generate: async config => {
      generationPrompt = config.user_input;
      operations.push(`generate:${config.user_input}`);
      return generation.promise;
    },
    stopGeneration: id => stopped.push(id),
    carrierMessageId: () => 2,
    nextMessageId: () => Math.max(0, ...messages.map(item => item.message_id)) + 1,
    readHostHtml: id =>
      messages.find(message => message.message_id === id)?.role === 'assistant' ? `<p>#${id}</p>` : '',
    formatDisplayedMessage: text => `<p>${text}</p>`,
    listHostMessageIds: () => messages.map(message => message.message_id),
    reserveHostFloor: id => hiddenReservations.push(id),
    replaceHostFloors: () => undefined,
    clearHostFloors: () => undefined,
    createGenerationId: () => 'story-generation-1',
  };

  return {
    dependencies,
    messages,
    operations,
    hiddenReservations,
    stopped,
    getGenerationPrompt: () => generationPrompt,
    resolveGeneration: (text: string) => generation.resolve(text),
    rejectGeneration: (error: unknown) => generation.reject(error),
    resetGeneration: () => {
      generation = deferred<string>();
    },
  };
}

async function testSubmissionOrderAndStreamingFilter() {
  const harness = createHarness([{ message_id: 2, role: 'assistant', message: 'APP carrier' }]);
  const session = createStorySession(harness.dependencies);
  session.refresh();
  assertEqual(session.baseItems.value.length, 0, '载体楼层不进入正文');

  const running = session.submitPrompt('我要下单：雪夜套餐');
  await Promise.resolve();
  assertEqual(
    harness.operations.slice(0, 2),
    ['create:user:我要下单：雪夜套餐', 'generate:我要下单：雪夜套餐'],
    '先创建玩家楼层再调用生成',
  );
  assertEqual(harness.hiddenReservations, [3], '创建玩家前预留楼层');

  let acceptedBeforeGeneration: unknown;
  void running.then(result => {
    acceptedBeforeGeneration = result;
  });
  await Promise.resolve();
  await Promise.resolve();
  assertEqual(acceptedBeforeGeneration, { accepted: true }, '玩家楼层写入后立即接受并允许进入正文');

  session.updateStreamingText('错误生成', 'another-generation');
  assertEqual(session.streamingText.value, '', '忽略其他 generation id');
  session.updateStreamingText('<scene>雪', 'story-generation-1');
  assertEqual(session.streamingText.value, '<scene>雪', '接收当前生成快照');

  harness.resolveGeneration('故事回复');
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  assertEqual(
    harness.operations,
    ['create:user:我要下单：雪夜套餐', 'generate:我要下单：雪夜套餐', 'create:assistant:故事回复'],
    '完整发送顺序',
  );
  assertEqual(harness.hiddenReservations, [3, 4], '玩家与助手楼层都提前预留');
  assertEqual(session.baseItems.value.at(-1)?.finalHtml, '<p>#4</p>', '完成态优先宿主 HTML');
}

async function testCancellation() {
  const harness = createHarness([{ message_id: 2, role: 'assistant', message: 'APP carrier' }]);
  const session = createStorySession(harness.dependencies);
  const running = session.submitPrompt('行动');
  await Promise.resolve();
  await Promise.resolve();
  session.cancelGeneration();
  harness.rejectGeneration(new Error('aborted'));
  await running;
  assertEqual(harness.stopped, ['story-generation-1'], '按 generation id 停止');
  assertEqual(session.status.value, 'cancelled', '主动停止状态');
}

async function testRegenerateAndRollback() {
  const harness = createHarness([
    { message_id: 2, role: 'assistant', message: 'APP carrier' },
    { message_id: 3, role: 'user', message: '玩家行动' },
    { message_id: 4, role: 'assistant', message: '旧回复' },
  ]);
  const session = createStorySession(harness.dependencies);
  session.refresh();

  const regenerating = session.regenerate(4);
  await Promise.resolve();
  await Promise.resolve();
  assertEqual(harness.getGenerationPrompt(), '玩家行动', '重生复用前置玩家指令');
  harness.resolveGeneration('新回复');
  assertEqual(await regenerating, true, '重新生成完成');
  assertEqual(
    harness.operations,
    ['delete:4', 'generate:玩家行动', 'create:assistant:新回复'],
    '重生不重复创建玩家楼层',
  );

  harness.operations.length = 0;
  await session.rollbackFrom(2);
  assertEqual(harness.operations, [], '回退拒绝删除载体楼层');
  await session.rollbackFrom(3);
  assertEqual(harness.operations, ['delete:3,4'], '回退删除目标及后续正文楼层');
}

void Promise.resolve()
  .then(testSubmissionOrderAndStreamingFilter)
  .then(testCancellation)
  .then(testRegenerateAndRollback)
  .then(() => console.log('story session contract passed'));
