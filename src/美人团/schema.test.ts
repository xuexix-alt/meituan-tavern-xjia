import { Schema } from './schema';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const template = {
  id: 'TEMPLATE',
  订单状态: '服务中',
  基础信息: { 姓名: '模板角色', 年龄: 20, 身份: '模板', 描述: '' },
  服装: {},
  套餐: { 套餐名称: '', 套餐价格: 0, 折后价格: 0, 玩法特色: [], 商品类型: '' },
  心理状态: { 当前所想: '', 好感度: 0, 兴奋度: 0, 性格类型: '' },
  身体特征: { 三围: { 描述: '', 罩杯: '' }, 乳房: { 形状: '' }, 姿势: '', 胸部: '', 私处: '' },
  性经验: { 处女: '是', 性伴侣数量: 0, 初次性行为对象: '', 怀孕几率: 0, 下单次数: 0 },
  服务统计: { 心跳: 60, 本次服务性交次数: 0, 内射次数: 0 },
};

const base = {
  经济: { 账户余额: 10000, 订单消费: 0 },
  系统状态: { 多人服务触发: true, 复购记忆保留: false, 当前场景: '', 当前模式: 'PLAY' },
  订单模板: { 新订单原型: template },
};

const minimalOrder = {
  id: 'ORDER_001',
  订单状态: '服务结束',
  基础信息: { 姓名: '李静怡', 年龄: 29, 身份: '隔壁栋住户，已婚人妻' },
};

const parsed = Schema.safeParse({ ...base, 服务中的订单: { ORDER_001: minimalOrder } });
assert(parsed.success, `最小订单应该可以通过 schema: ${JSON.stringify(parsed.error?.issues)}`);

const order = parsed.data.服务中的订单.ORDER_001;
assert(order.基础信息.描述 === '', '缺失的基础信息.描述应回填为空字符串');
assert(order.服装 && Object.keys(order.服装).length === 0, '缺失的服装应回填为空对象');
assert(order.套餐.套餐价格 === 0 && order.套餐.玩法特色.length === 0, '缺失的套餐字段应回填为空值');
assert(order.心理状态.好感度 === 0 && order.服务统计.心跳 === 60, '缺失的心理状态和服务统计应回填默认值');

const missingRequired = Schema.safeParse({
  ...base,
  服务中的订单: { ORDER_002: { 订单状态: '服务结束', 基础信息: { 姓名: '缺少 ID', 年龄: 20, 身份: '测试' } } },
});
assert(!missingRequired.success, '缺失 id 的订单仍必须被拒绝');

console.log('美人团订单 schema 最小必填字段契约通过');
