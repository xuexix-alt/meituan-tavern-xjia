import { buildPackageOrderPrompt, buildRepeatOrderPrompt } from './orderPrompts';
import { submitOrderToStory } from './orderSubmission';

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} 不一致。\n实际: ${JSON.stringify(actual)}\n期望: ${JSON.stringify(expected)}`);
  }
}

const packagePrompt = buildPackageOrderPrompt({
  itemName: '雪夜陪伴',
  itemDescription: '在暴雪夜提供陪伴',
  remark: '烛光晚餐',
});
assertEqual(packagePrompt, '我要下单：雪夜陪伴，详情介绍：在暴雪夜提供陪伴。备注：烛光晚餐', '套餐指令');
assertEqual(packagePrompt.includes('/send'), false, '套餐指令不含 send slash');
assertEqual(packagePrompt.includes('/trigger'), false, '套餐指令不含 trigger slash');

const repeatPrompt = buildRepeatOrderPrompt({
  girl: '林雪',
  age: 24,
  identity: '邻居',
  packageName: '雪夜陪伴',
  price: 520,
  remark: '和上次一样',
});
assertEqual(repeatPrompt, '再次下单：林雪，24，邻居，雪夜陪伴，订单价格：¥520。备注：和上次一样', '再次下单指令');

async function testNavigationAfterAcceptance() {
  const pushes: string[] = [];
  const accepted = await submitOrderToStory(
    { submitPrompt: async () => ({ accepted: true }) },
    {
      push: async path => {
        pushes.push(path);
      },
    },
    packagePrompt,
  );
  assertEqual(accepted, { accepted: true }, '接受结果');
  assertEqual(pushes, ['/story'], '接受后进入正文');

  pushes.length = 0;
  const rejected = await submitOrderToStory(
    { submitPrompt: async () => ({ accepted: false, error: '正文正在生成，请稍候。' }) },
    {
      push: async path => {
        pushes.push(path);
      },
    },
    packagePrompt,
  );
  assertEqual(rejected, { accepted: false, error: '正文正在生成，请稍候。' }, '拒绝结果');
  assertEqual(pushes, [], '拒绝时留在确认页');
}

void testNavigationAfterAcceptance().then(() => console.log('order submission contract passed'));
