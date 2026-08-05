import { createGenerationTask } from './generationTask';

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

async function testSuccessAndDuplicateGuard() {
  const response = deferred<{ text: string; mode: 'tavern'; payload: Record<string, unknown> }>();
  const scheduled: Array<() => void> = [];
  const task = createGenerationTask({
    generate: () => response.promise,
    ingest: () => ({ parsedCount: 2, savedCount: 2, packageCount: 6, shops: [] }),
    schedule: callback => {
      scheduled.push(callback);
      return scheduled.length;
    },
    clearSchedule: () => undefined,
  });

  const running = task.start('搜索：职场', '职场');
  assertEqual(task.state.value.status, 'running', '开始后进入运行状态');
  assertEqual(task.isBusy.value, true, '运行状态忙碌');
  assertEqual(await task.start('搜索：路人', '路人'), false, '运行中拒绝第二个任务');

  response.resolve({ text: '店铺回复', mode: 'tavern', payload: {} });
  assertEqual(await running, true, '首个任务完成');
  assertEqual(task.state.value.status, 'success', '完成后进入成功状态');
  assertEqual(task.state.value.parsedCount, 2, '记录店铺数量');
  assertEqual(task.state.value.packageCount, 6, '记录套餐数量');
  assertEqual(task.isBusy.value, false, '成功后解除忙碌');

  scheduled[0]();
  assertEqual(task.state.value.status, 'idle', '成功状态定时收起');
}

async function testExplicitCancellation() {
  let capturedSignal: AbortSignal | undefined;
  const task = createGenerationTask({
    generate: (_input, options) => {
      capturedSignal = options.signal;
      return new Promise((_resolve, reject) => {
        options.signal?.addEventListener('abort', () => reject(new DOMException('已取消', 'AbortError')), {
          once: true,
        });
      });
    },
    ingest: () => ({ parsedCount: 0, savedCount: 0, packageCount: 0, shops: [] }),
    schedule: () => 1,
    clearSchedule: () => undefined,
  });

  const running = task.start('搜索：测试', '测试');
  task.cancel();
  await running;
  assertEqual(capturedSignal?.aborted, true, '停止按钮中止请求');
  assertEqual(task.state.value.status, 'cancelled', '主动停止是取消状态');
}

async function testParseFailure() {
  const task = createGenerationTask({
    generate: async () => ({ text: '无法解析', mode: 'tavern', payload: {} }),
    ingest: () => ({ parsedCount: 0, savedCount: 0, packageCount: 0, shops: [] }),
    schedule: () => 1,
    clearSchedule: () => undefined,
  });

  await task.start('搜索：测试', '测试');
  assertEqual(task.state.value.status, 'error', '空解析结果进入错误状态');
  assertEqual(task.state.value.error, '模型回复未解析出有效店铺，请检查调试台预设与回复格式。', '空解析错误文案');
}

void Promise.resolve()
  .then(testSuccessAndDuplicateGuard)
  .then(testExplicitCancellation)
  .then(testParseFailure)
  .then(() => console.log('generation task contract passed'));
