# 简易MVU触发器 Demo

> 使用 `generate()` 后台调用AI更新MVU变量，不触发新楼层的完整示例

## ✨ 特性

- ✅ **不触发新楼层**：使用 `generate()` 直接调用AI
- ✅ **JSON Patch支持**：完整的JSON Patch格式解析和应用
- ✅ **实时状态**：MVU连接状态和变量变化实时显示
- ✅ **详细日志**：操作日志帮助调试和追踪
- ✅ **错误处理**：完善的错误捕获和提示机制
- ✅ **Vue3实现**：使用Vue 3 + Composition API

## 📁 项目结构

```
src/简易MVU触发器/
├── index.html          # 静态HTML结构
├── index.ts            # Vue应用入口
├── app.vue             # 主组件（核心逻辑）
├── 使用说明.md          # 详细使用说明
└── README.md           # 本文件
```

## 🚀 快速开始

### 1. 打包项目

```bash
# 使用项目提供的打包工具
pnpm build
```

### 2. 在酒馆中挂载

1. 在酒馆助手中创建新的前端界面项目
2. 选择 `src/简易MVU触发器` 文件夹
3. 打包后的文件会生成到 `dist/简易MVU触发器/`

### 3. 在聊天中插入

在酒馆聊天界面中插入：
```
【前端占位符】
```

## 🎯 核心功能演示

### 按钮功能

| 按钮 | 功能 | 演示的JSON Patch操作 |
|------|------|---------------------|
| ❤️ 更新好感度 | 设置 `demo_test_value` 为 "好感度已更新" | `replace` |
| ➕ 添加测试数据 | 根据时间戳添加测试数据 | `add` |
| 🎨 自定义更新 | 生成复杂对象数据 | 多种操作组合 |

### 日志输出

界面实时显示：
- AI调用过程
- JSON Patch解析结果
- 变量更新状态
- 错误信息（如果有）

## 🔧 技术亮点

### 1. generate() 调用优化

```typescript
const result = await generate({
  user_input: systemPrompt,
  overrides: {
    char_description: '',
    char_personality: '',
    scenario: '',
    chat_history: {
      prompts: []
    }
  }
});
```

**优化点：**
- 清空所有角色相关提示词，避免AI理解偏差
- 不使用聊天历史，确保每次调用独立
- 自定义systemPrompt，精确控制AI输出格式

### 2. JSON Patch解析器

```typescript
const analysisMatch = result.match(/<update_analysis>([\s\S]*?)<\/update_analysis>/);
const patchMatch = result.match(/<json_patch>([\s\S]*?)<\/json_patch>/);

if (!patchMatch) {
  throw new Error('AI返回格式不正确：缺少<json_patch>标签');
}

const jsonStr = patchMatch[1].trim();
const updates = JSON.parse(jsonStr);
```

**特性：**
- 正则表达式精确提取标签内容
- Zod schema验证数据格式
- 完整的错误提示

### 3. MVU变量操作

```typescript
const mvuData = Mvu.getMvuData({ type: 'message', message_id: 'latest' });

for (const update of updates) {
  const path = update.path.replace(/^\//, '');

  if (update.op === 'replace') {
    _.set(mvuData.stat_data, path, update.value);
  } else if (update.op === 'add') {
    // 处理add操作
  } else if (update.op === 'remove') {
    // 处理remove操作
  }
}

await Mvu.replaceMvuData(mvuData, { type: 'message', message_id: 'latest' });
```

**优势：**
- 使用 lodash 的 `_.set()` 安全设置嵌套属性
- 支持三种JSON Patch操作
- 自动处理路径格式（JSON Pointer）

## 📊 对比：方法一 vs 方法二

| 特性 | 方法一（generate） | 方法二（triggerSlash） |
|------|-------------------|------------------------|
| 是否创建新楼层 | ❌ 否 | ✅ 是 |
| 是否触发AI回复 | ✅ 是 | ✅ 是 |
| 响应速度 | 快 | 慢（需要等待楼层渲染） |
| 控制精确度 | 高（可自定义提示词） | 低（依赖AI理解） |
| 适用场景 | 后台处理、定时任务 | 用户交互、剧情推进 |

## 🎓 学习价值

这个Demo展示了：

1. **酒馆助手API使用**：如何正确调用 `generate()` 和 MVU 接口
2. **Vue 3最佳实践**：Composition API、响应式数据、事件处理
3. **JSON Patch应用**：完整的JSON Patch解析和应用流程
4. **错误处理**：优雅的错误捕获和用户提示
5. **日志系统**：实时日志帮助调试和追踪

## 📚 扩展方向

基于此Demo，你可以开发：

1. **定时任务系统**：定期调用AI更新变量
2. **复杂业务流程**：订单处理、状态机
3. **数据同步工具**：多变量批量更新
4. **智能助手**：AI驱动的自动化操作
5. **调试工具**：变量监控和诊断

## ⚠️ 注意事项

1. **环境要求**：必须在酒馆环境中运行
2. **依赖**：需要MVU变量框架已安装并初始化
3. **网络**：调用AI需要网络连接
4. **性能**：大量变量更新可能影响性能

## 📖 更多资源

- [详细使用说明](./使用说明.md)
- [MVU变量框架](https://github.com/MagicalAstrogy/MagVarUpdate)
- [JSON Patch规范](https://tools.ietf.org/html/rfc6902)
- [酒馆助手文档](https://stagedog.github.io/青空莉/)

---

**Created with ❤️ for SillyTavern & Tavern Helper**
