import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

export const Schema = z.object({
  // 基础变量
  日期: z.string(),
  时间: z.string(),

  // 用户状态
  user: z.object({
    身份: z.string(),
    当前位置: z.string(),
    好感度: z.coerce.number().transform(v => _.clamp(v, 0, 100)),
  }),

  // 物品系统 (推荐使用 z.record)
  物品栏: z
    .record(
      z.string().describe('物品名'),
      z.object({
        描述: z.string(),
        数量: z.coerce.number(),
      }),
    )
    .prefault({}),
});

$(() => {
  registerMvuSchema(Schema);
});
