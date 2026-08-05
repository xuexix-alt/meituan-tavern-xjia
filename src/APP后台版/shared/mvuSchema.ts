import _ from 'lodash';
import { z } from 'zod';

// Define the schema based on structure.js
// Note: 'prefault' is replaced with 'default' as it is the standard Zod method.

export const MvuSchema = z.object({
  经济: z
    .object({
      账户余额: z.coerce.number(),
      订单消费: z.coerce.number(),
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
          服装: z.record(z.string(), z.string()),
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
              性伴侣数量: z.coerce.number(),
              初次性行为对象: z.string(),
              怀孕几率: z.coerce.number().transform(v => _.clamp(v, 0, 100)),
              下单次数: z.coerce.number(),
            })
            .strict(),
          服务统计: z
            .object({
              心跳: z.coerce.number().transform(v => _.clamp(v, 60, 200)),
              本次服务性交次数: z.coerce.number(),
              内射次数: z.coerce.number(),
            })
            .strict(),
        })
        .strict(),
    })
    .strict(),
  系统状态: z
    .object({
      多人服务触发: z.boolean(),
      复购记忆保留: z.boolean(),
      当前场景: z.string(),
      当前模式: z.string(),
    })
    .strict(),
  推荐标签: z.array(z.string()).default(['zod店铺集成']),
  店铺列表: z
    .record(
      z.string().describe('店铺ID'),
      z
        .object({
          shopname: z.string(),
          shop_id: z.coerce.number(),
          shoptags: z.array(z.string()),
          packages: z.array(
            z
              .object({
                name: z.string(),
                price: z.coerce.number(),
                stars: z.coerce.number().transform(v => _.clamp(v, 1, 5)),
                icon: z.string(),
                tags: z.array(z.string()),
                image1: z.string(),
                image2: z.string(),
                image3: z.string(),
                description: z.string(),
                content: z.array(z.string()),
                reviews: z.array(z.string()),
              })
              .strict(),
          ),
        })
        .strict(),
    )
    .default({}),
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
          服装: z.record(z.string(), z.string()),
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
              性伴侣数量: z.coerce.number(),
              初次性行为对象: z.string(),
              怀孕几率: z.coerce.number().transform(v => _.clamp(v, 0, 100)),
              下单次数: z.coerce.number(),
            })
            .strict(),
          服务统计: z
            .object({
              心跳: z.coerce.number().transform(v => _.clamp(v, 60, 200)),
              本次服务性交次数: z.coerce.number(),
              内射次数: z.coerce.number(),
            })
            .strict(),
        })
        .strict(),
    )
    .default({}),
});

// Export inferred types for usage in the app
export type MvuState = z.infer<typeof MvuSchema>;
