import { z } from 'zod';

declare const registerMvuSchema: (schema: any) => void;
declare const $: any;

/**
 * MVU Zod Schema 定义
 * 用于店铺生成Demo的变量结构验证
 */
export const ShopSchema = z.object({
  经济: z
    .object({
      账户余额: z.coerce.number(),
      订单消费: z.coerce.number(),
    })
    .strict(),
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
});

/**
 * 注册MVU Schema
 * 必须在jQuery ready后调用
 */
export function registerShopSchema() {
  if (typeof $ !== 'undefined') {
    $(() => {
      if (typeof registerMvuSchema === 'function') {
        console.log('[ShopSchema] 正在注册MVU Schema...');
        registerMvuSchema(ShopSchema);
        console.log('[ShopSchema] MVU Schema注册成功');
      } else {
        console.warn('[ShopSchema] registerMvuSchema函数未找到，请确保MVU Zod框架已加载');
      }
    });
  }
}
