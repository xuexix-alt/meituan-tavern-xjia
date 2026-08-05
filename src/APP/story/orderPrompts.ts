interface PackageOrderPromptInput {
  itemName: unknown;
  itemDescription: unknown;
  remark: unknown;
}

interface RepeatOrderPromptInput {
  orderId: unknown;
  girl: unknown;
  age: unknown;
  identity: unknown;
  packageName: unknown;
  price: unknown;
  remark: unknown;
}

function text(value: unknown, fallback: string): string {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

export function buildPackageOrderPrompt(input: PackageOrderPromptInput): string {
  return `我要下单：${text(input.itemName, '未知套餐')}，详情介绍：${text(input.itemDescription, '无详情')}。备注：${text(input.remark, '无')}`;
}

export function buildRepeatOrderPrompt(input: RepeatOrderPromptInput): string {
  return `再次下单：订单ID ${text(input.orderId, '未知订单')}，${text(input.girl, '未知')}，${text(input.age, '-')}，${text(input.identity, '未知')}，${text(input.packageName, '未知套餐')}，订单价格：¥${text(input.price, '-')}。备注：${text(input.remark, '无')}`;
}
