import { loadOrdersFromMVU, selectActiveOrLatestOrders } from './serviceOrders.ts';

function assertEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} 不一致。\n实际: ${JSON.stringify(actual)}\n期望: ${JSON.stringify(expected)}`);
  }
}

const order = {
  id: 'inner-id',
  订单状态: '服务结束',
  基础信息: { 姓名: '林雪', 身份: '邻居', 年龄: 0, 描述: '' },
  服装: {},
  套餐: { 套餐名称: '雪夜陪伴', 套餐价格: 520, 折后价格: 0, 玩法特色: [], 商品类型: '陪伴' },
  心理状态: { 当前所想: '', 好感度: 0, 兴奋度: 0, 性格类型: '' },
  身体特征: { 三围: { 描述: '', 罩杯: '' }, 乳房: { 形状: '' }, 姿势: '', 胸部: '', 私处: '' },
  性经验: { 处女: '是', 性伴侣数量: 0, 初次性行为对象: '', 怀孕几率: 0, 下单次数: 0 },
  服务统计: { 心跳: 60, 本次服务性交次数: 0, 内射次数: 0 },
};

const staleOrder = { ...order, id: 'STALE_ORDER', 基础信息: { ...order.基础信息, 姓名: '旧楼层' } };

const globalScope = globalThis;
globalScope.waitGlobalInitialized = async () => undefined;
globalScope.getCurrentMessageId = () => 0;
globalScope.getScriptId = () => 'service-orders-test';
globalScope.getVariables = () => ({});
globalScope.replaceVariables = () => undefined;
globalScope.Mvu = {
  getMvuData: ({ message_id }) =>
    message_id === 'latest'
      ? { stat_data: { 服务中的订单: { ORDER_001: order } } }
      : { stat_data: { 服务中的订单: { STALE_ORDER: staleOrder } } },
};

const orders = await loadOrdersFromMVU();
assertEqual(orders.length, 1, '记录型订单数量');
assertEqual(orders[0].id, 'ORDER_001', '记录键必须作为真实订单 ID');
assertEqual(orders[0].基础信息.年龄, 0, '年龄 0 必须保留');
assertEqual(orders[0].性经验.性伴侣数量, 0, '性伴侣数量 0 必须保留');
assertEqual(orders[0].服务统计.本次服务性交次数, 0, '服务性交次数 0 必须保留');
assertEqual(orders[0].套餐.折后价格, 0, '折后价格 0 必须保留');

const finishedOld = { ...orders[0], id: 'ORDER_OLD' };
const finishedLatest = { ...orders[0], id: 'ORDER_LATEST' };
const active = { ...orders[0], id: 'ORDER_ACTIVE', status: '服务中' };

const activeDisplay = selectActiveOrLatestOrders([finishedOld, active, finishedLatest]);
assertEqual(activeDisplay.mode, 'active', '活动订单显示模式');
assertEqual(
  activeDisplay.orders.map(order => order.id),
  ['ORDER_ACTIVE'],
  '活动订单优先',
);

const recentDisplay = selectActiveOrLatestOrders([finishedOld, finishedLatest]);
assertEqual(recentDisplay.mode, 'recent', '最近订单显示模式');
assertEqual(
  recentDisplay.orders.map(order => order.id),
  ['ORDER_LATEST'],
  '原始 record 最后一项为最近订单',
);

const cachedDisplay = selectActiveOrLatestOrders([
  { ...finishedOld, __cachedAt: 10 },
  { ...finishedLatest, __cachedAt: 30 },
  { ...active, status: '服务结束', __cachedAt: 20 },
]);
assertEqual(
  cachedDisplay.orders.map(order => order.id),
  ['ORDER_LATEST'],
  '缓存按 __cachedAt 取最新订单',
);

assertEqual(selectActiveOrLatestOrders([]), { orders: [], mode: 'empty' }, '空订单集合保持空状态');

globalScope.Mvu = {
  getMvuData: ({ message_id }) =>
    message_id === 'latest'
      ? { stat_data: { 服务中的订单: {} } }
      : { stat_data: { 服务中的订单: { STALE_ORDER: staleOrder } } },
};
const emptyOrders = await loadOrdersFromMVU();
assertEqual(emptyOrders, [], '最新楼层为空时不应回退到旧订单缓存');

console.log('service orders MVU record contract passed');
