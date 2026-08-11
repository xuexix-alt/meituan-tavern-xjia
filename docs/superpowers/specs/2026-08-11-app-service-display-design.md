# APP 服务页最近订单与移动端信息密度优化设计

## 背景与根因

`src/shared/serviceOrders.ts` 已按 Zod MVU 的 `服务中的订单` record 结构读取并规范化订单。该 record 没有时间字段，JavaScript 的对象枚举顺序保留了订单插入顺序。当前 `src/APP/Service.vue` 在加载后只调用 `filterActiveOrders`，因此当全部订单状态为 `服务结束` 时，页面会把完整订单集合过滤成空数组并显示空状态。

本次设计把“活动订单优先、没有活动订单时展示最近记录”定义为 APP 的派生显示规则，不把展示需求反向写入 MVU Schema 或世界书规则。

## 目标

- 有一个或多个 `服务中` 订单时，继续展示全部活动订单。
- 没有活动订单但 `服务中的订单` record 非空时，展示 record 最后插入的一条订单。
- 通过脚本缓存读取时，按 `__cachedAt` 选择最新订单。
- MVU 明确返回 `服务中的订单: {}` 时保持空状态，不用旧缓存覆盖当前空数据。
- 移动设备优先压缩服务页首屏高度，优先展示姓名、身份、订单状态、套餐和关键指标。
- 详细信息按需渲染，减少首次 DOM、样式计算和滚动内容负担。
- 保留现有 MVU 更新监听、订单复购入口、主题变量、APP 单一纵向滚动容器和 44px 触控目标约束。

## 非目标

- 不增加订单时间戳、序号或其他字段到 `src/美人团/schema.ts`。
- 不修改 `initvar.yaml`、变量更新规则、变量输出格式或 JSON Patch 路径。
- 不重构 History、Me 或共享 APP 壳层的既有布局。
- 不建立新的轮询机制或缓存真相源。

## 数据设计

在 `src/shared/serviceOrders.ts` 增加可测试的显示选择器：

```ts
export type ServiceOrderDisplayMode = 'active' | 'recent' | 'empty';

export interface ServiceOrderDisplay {
  orders: ServiceOrder[];
  mode: ServiceOrderDisplayMode;
}

export function selectActiveOrLatestOrders(orders: ServiceOrder[]): ServiceOrderDisplay;
```

选择顺序：

1. 先调用现有 `filterActiveOrders`；结果非空时返回全部活动订单和 `active`。
2. 输入为空时返回空数组和 `empty`。
3. 如果订单带有 `__cachedAt`，取数值最大的订单；否则取输入数组最后一项，返回单项数组和 `recent`。

`Service.vue` 使用该选择器统一处理 MVU 正常返回和异常时的缓存回退。页面保存 `displayMode`，并在订单集合切换后把 `currentGirlIndex` 限制在有效范围内，避免从多订单切换到最近单项时出现空的当前卡片。

## 服务页 UI 设计

### 首屏摘要

- 头部保留标题和刷新按钮。
- `recent` 模式下，在内容区顶部显示非阻塞提示：“当前无服务中的订单，展示最近一次服务记录”。
- 多订单标签使用稳定订单 ID 作为 key，并改用可聚焦的按钮语义；单个最近订单不显示标签栏。
- 状态卡片首屏保留姓名、身份、年龄、订单状态、心跳、套餐名称、价格和四项关键指标。
- 套餐价格区改为紧凑摘要行，玩法特色使用紧凑标签换行，不再占用大块垂直空间。
- 指标区继续使用移动端两列网格，缩小卡片内边距、标题和数值字号，避免窄屏横向溢出。

### 详细信息

- 详细信息总面板默认折叠，让首屏先呈现可行动状态。
- 只有用户展开详细信息时才渲染详细内容；心理状态、身体特征、性经验与服务统计继续按分组折叠，并在各自展开时再渲染内容。
- 着装、身体特征和统计网格统一使用 `minmax(0, 1fr)`、`min-width: 0` 和可换行文本，保证中文长内容不把布局撑宽。
- 保持 APP 壳层的 `.app-content` 作为唯一页面滚动容器，不在服务页子项目中增加嵌套滚动。
- 触控目标沿用 APP 壳层的 44px 规则；触屏设备移除无效 hover 位移，减少不必要动画。

## 错误与空态

- MVU 有效且订单存在：正常展示活动订单或最近记录。
- MVU 有效但 record 为空：显示原有空状态和重试入口。
- MVU 读取失败但缓存存在：沿用现有缓存降级，并使用同一选择器决定显示活动订单或最近缓存订单。
- MVU 和缓存都不可用：显示错误信息和重试入口，不渲染状态卡片。
- MVU 更新事件触发刷新时不弹出重复 toast；手动刷新仍保留成功/缓存提示。

## 测试与验证

- 在 `src/shared/serviceOrders.test.mjs` 先增加失败测试，覆盖：活动订单优先、原始 record 最后一项作为最近订单、缓存 `__cachedAt` 优先、空 record 不产生回退订单。
- 新增 `src/APP/servicePageSource.test.mjs`，检查服务页使用共享选择器、渲染最近服务提示、详细区按需渲染、稳定订单 key 和移动端紧凑布局标记。
- 按 TDD 顺序运行单测：先确认新增测试因缺少选择器/页面契约而失败，再实现最小代码使其通过。
- 运行 APP 与共享订单相关 Node 测试、`pnpm build`、`git diff --check`。
- 构建后只保留与本次 APP 修改绑定的 `dist/APP/index.html` 产物，审查并保留工作区中已有的无关修改和删除。

## 修改范围

- 修改：`src/shared/serviceOrders.ts`
- 修改：`src/shared/serviceOrders.test.mjs`
- 修改：`src/APP/Service.vue`
- 新增：`src/APP/servicePageSource.test.mjs`
- 生成并审查：`dist/APP/index.html`

