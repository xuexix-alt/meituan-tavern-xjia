# Chrome DevTools MCP 服务器配置指南

## 当前状态说明

- ✅ **SillyTavern**: http://localhost:6622/ （正常运行）
- ❌ **Chrome DevTools MCP**: 需要单独配置和启动

## 配置步骤

### 1. 启动Chrome DevTools MCP服务器

进入MCP项目目录并启动服务器：

```bash
cd chrome-devtools-mcp-main

# 安装依赖（如果还没安装）
npm install

# 启动MCP服务器（连接到本地Chrome实例）
npm run start -- --browserUrl http://localhost:9222
```

### 2. MCP服务器选项

MCP服务器支持以下连接方式：

#### 选项A：连接到运行中的Chrome实例
```bash
npm run start -- --browserUrl http://localhost:9222
```

#### 选项B：使用WebSocket端点
```bash
npm run start -- --wsEndpoint ws://127.0.0.1:9222/devtools/browser/xxxx
```

#### 选项C：启动新的Chrome实例
```bash
npm run start -- --headless
```

### 3. 酒馆助手中的配置

在酒馆助手的MCP设置中，您需要：

1. **添加MCP服务器**：
   - 名称：`Chrome DevTools`
   - 类型：`stdio` 或 `websocket`
   - 命令：如果使用stdio，需要指定启动命令的路径

2. **WebSocket连接**：
   - 如果使用WebSocket，需要指定正确的WebSocket端点

### 4. 常见问题

**Q: 为什么6622端口不在监听列表中？**
A: 因为MCP服务器不是HTTP服务，它使用stdio或WebSocket通信。

**Q: SillyTavern和MCP服务器的关系？**
A: 它们是两个独立的服务：
- SillyTavern (6622): 酒馆主程序
- Chrome DevTools MCP: 浏览器自动化工具

**Q: 如何验证MCP服务器正在运行？**
A: 查看终端输出，MCP服务器启动后会显示可用的工具列表。

### 5. 可用的MCP工具

启动成功后，您将可以使用以下26个Chrome DevTools工具：

#### 输入自动化 (8个)
- `click` - 点击元素
- `drag` - 拖拽元素
- `fill` - 输入文本
- `fill_form` - 批量表单填充
- `handle_dialog` - 处理对话框
- `hover` - 悬停
- `press_key` - 按键操作
- `upload_file` - 文件上传

#### 导航自动化 (6个)
- `close_page` - 关闭页面
- `list_pages` - 列出页面
- `navigate_page` - 页面导航
- `new_page` - 新建页面
- `select_page` - 选择页面
- `wait_for` - 等待文本出现

#### 模拟 (2个)
- `emulate` - 模拟条件
- `resize_page` - 调整窗口大小

#### 性能分析 (3个)
- `performance_analyze_insight` - 分析性能洞察
- `performance_start_trace` - 开始性能跟踪
- `performance_stop_trace` - 停止性能跟踪

#### 网络请求 (2个)
- `get_network_request` - 获取网络请求
- `list_network_requests` - 列出网络请求

#### 调试 (5个)
- `evaluate_script` - 执行JavaScript
- `get_console_message` - 获取控制台消息
- `list_console_messages` - 列出控制台消息
- `take_screenshot` - 截图
- `take_snapshot` - 获取页面快照

## 故障排除

如果遇到问题：
1. 确保Chrome浏览器正在运行
2. 检查端口9222是否可用于调试
3. 验证MCP服务器日志输出
4. 确认酒馆助手的MCP配置正确

---

**注意**: MCP服务器默认通过stdio通信，不需要HTTP端口。如果您在酒馆助手中添加MCP服务器，应该使用正确的连接方式而不是HTTP URL。