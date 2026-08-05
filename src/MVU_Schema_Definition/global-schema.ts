import _ from 'lodash';
import { z } from 'zod';

// 专门用于全局作用域的店铺列表校验 Schema
export const GlobalSchema = z
  .object({
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
  })
  .strict();

export type GlobalSchemaType = z.infer<typeof GlobalSchema>;
