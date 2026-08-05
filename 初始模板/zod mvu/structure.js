import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

// 这是消息级 MVU 的唯一变量结构。店铺数据由 APP 的本地存储链路管理，不放进这里。
export const Schema = z.object({
  经济: z
    .object({
      账户余额: z.coerce.number(),
      订单消费: z.coerce.number().transform(v => Math.max(0, Math.trunc(v))),
    })
    .strict(),
  系统状态: z
    .object({
      多人服务触发: z.boolean(),
      复购记忆保留: z.boolean(),
      当前场景: z.string(),
      当前模式: z.string().prefault('PLAY'),
    })
    .strict(),
  订单模板: z
    .object({
      新订单原型: z
        .object({
          id: z.string(),
          订单状态: z.enum(['服务中', '服务结束']),
          基础信息: z
            .object({
              姓名: z.string(),
              年龄: z.coerce.number(),
              身份: z.string(),
              描述: z.string(),
            })
            .strict(),
          服装: z.record(z.string(), z.string()).prefault({}),
          套餐: z
            .object({
              套餐名称: z.string(),
              套餐价格: z.coerce.number(),
              折后价格: z.coerce.number(),
              玩法特色: z.array(z.string()),
              商品类型: z.string(),
            })
            .strict(),
          心理状态: z
            .object({
              当前所想: z.string(),
              好感度: z.coerce.number().transform(v => _.clamp(v, 0, 100)),
              兴奋度: z.coerce.number().transform(v => _.clamp(v, 0, 100)),
              性格类型: z.string(),
              // beta 旧结构将心跳放在这里；新结构统一写入服务统计。
              心跳: z.coerce
                .number()
                .transform(v => _.clamp(v, 60, 200))
                .optional(),
            })
            .strict(),
          身体特征: z
            .object({
              三围: z.object({ 描述: z.string(), 罩杯: z.string() }).strict(),
              乳房: z.object({ 形状: z.string() }).strict(),
              姿势: z.string(),
              胸部: z.string(),
              私处: z.string(),
            })
            .strict(),
          性经验: z
            .object({
              处女: z.enum(['是', '否']),
              性伴侣数量: z.coerce.number().transform(v => Math.max(0, Math.trunc(v))),
              初次性行为对象: z.string(),
              怀孕几率: z.coerce.number().transform(v => _.clamp(v, 0, 100)),
              下单次数: z.coerce.number().transform(v => Math.max(0, Math.trunc(v))),
            })
            .strict(),
          服务统计: z
            .object({
              // 服务心跳是 JSON Patch 的规范路径；缺失时兼容旧 beta 数据并回到基础值。
              心跳: z.coerce
                .number()
                .transform(v => _.clamp(v, 60, 200))
                .prefault(60),
              本次服务性交次数: z.coerce.number().transform(v => Math.max(0, Math.trunc(v))),
              内射次数: z.coerce.number().transform(v => Math.max(0, Math.trunc(v))),
            })
            .strict(),
        })
        .strict(),
    })
    .strict(),
  服务中的订单: z
    .record(
      z.string().describe('订单ID'),
      z
        .object({
          id: z.string(),
          订单状态: z.enum(['服务中', '服务结束']),
          基础信息: z
            .object({
              姓名: z.string(),
              年龄: z.coerce.number(),
              身份: z.string(),
              描述: z.string(),
            })
            .strict(),
          服装: z.record(z.string(), z.string()).prefault({}),
          套餐: z
            .object({
              套餐名称: z.string(),
              套餐价格: z.coerce.number(),
              折后价格: z.coerce.number(),
              玩法特色: z.array(z.string()),
              商品类型: z.string(),
            })
            .strict(),
          心理状态: z
            .object({
              当前所想: z.string(),
              好感度: z.coerce.number().transform(v => _.clamp(v, 0, 100)),
              兴奋度: z.coerce.number().transform(v => _.clamp(v, 0, 100)),
              性格类型: z.string(),
              // 兼容尚未迁移的 beta 订单；新输出不要再写此字段。
              心跳: z.coerce
                .number()
                .transform(v => _.clamp(v, 60, 200))
                .optional(),
            })
            .strict(),
          身体特征: z
            .object({
              三围: z.object({ 描述: z.string(), 罩杯: z.string() }).strict(),
              乳房: z.object({ 形状: z.string() }).strict(),
              姿势: z.string(),
              胸部: z.string(),
              私处: z.string(),
            })
            .strict(),
          性经验: z
            .object({
              处女: z.enum(['是', '否']),
              性伴侣数量: z.coerce.number().transform(v => Math.max(0, Math.trunc(v))),
              初次性行为对象: z.string(),
              怀孕几率: z.coerce.number().transform(v => _.clamp(v, 0, 100)),
              下单次数: z.coerce.number().transform(v => Math.max(0, Math.trunc(v))),
            })
            .strict(),
          服务统计: z
            .object({
              心跳: z.coerce
                .number()
                .transform(v => _.clamp(v, 60, 200))
                .prefault(60),
              本次服务性交次数: z.coerce.number().transform(v => Math.max(0, Math.trunc(v))),
              内射次数: z.coerce.number().transform(v => Math.max(0, Math.trunc(v))),
            })
            .strict(),
        })
        .strict(),
    )
    .prefault({}),
});

$(() => {
  registerMvuSchema(Schema);
});
