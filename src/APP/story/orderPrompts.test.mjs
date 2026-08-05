import { buildRepeatOrderPrompt } from './orderPrompts.ts';

const prompt = buildRepeatOrderPrompt({
  orderId: 'ORDER_001',
  girl: '林雪',
  age: 24,
  identity: '邻居',
  packageName: '雪夜陪伴',
  price: 520,
  remark: '和上次一样',
});

const expected = '再次下单：订单ID ORDER_001，林雪，24，邻居，雪夜陪伴，订单价格：¥520。备注：和上次一样';
if (prompt !== expected) {
  throw new Error(`复购指令不一致。\n实际: ${prompt}\n期望: ${expected}`);
}

console.log('repeat order prompt ID contract passed');
