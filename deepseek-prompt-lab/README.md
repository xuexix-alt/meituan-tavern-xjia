# DeepSeek 提示词调试台

一个在本机浏览器中运行的调试工具，支持 DeepSeek 和其他 OpenAI Chat Completions 兼容接口。

## 本地运行

需要 Node.js 22+ 和 pnpm 10+。

```powershell
pnpm install
pnpm dev
```

打开 `http://127.0.0.1:5173`。Vite 提供 React 页面，并将 `/api` 请求转发到 `127.0.0.1:4174` 上的本地代理。

生产构建方式：

```powershell
pnpm build
pnpm start
```

然后打开 `http://127.0.0.1:4174`。

## 接口连接

- DeepSeek 默认接口为 `https://api.deepseek.com`，默认模型为 `deepseek-chat`。
- 其他服务商可填写任意 HTTP 或 HTTPS 的 OpenAI 兼容接口地址；缺少版本路径时，代理会自动补充 `/v1`。
- 模型列表通过 `GET /v1/models` 拉取。若服务商不支持该接口，仍可手动填写模型名。
- 按照个人本机使用的需求，API 密钥保存在当前浏览器的 `localStorage` 中。本地代理只在请求期间使用密钥，不会写入文件或日志。
- 应用只监听本机地址，不适合直接部署到公网。

## 提示词调试

- 可编辑、排序、复制、删除和添加 `system`、`user`、`assistant`、`tool` 消息。
- 可调整常用生成参数，也可添加服务商特有的兼容 JSON 字段。
- 原始编辑器没有改动时，结构化编辑会自动更新原始 JSON。
- 修改原始 JSON 后会成为待同步草稿，可明确选择“应用到结构化编辑器”或“从结构化编辑器重建”。
- 支持普通 JSON 与 SSE 流式请求，可停止正在进行的请求，并查看文本、原始数据、请求 ID、Token 用量和错误信息。
- 预设和最近 30 条脱敏请求历史会保存在本地，均不包含 API 密钥。

## 验证

```powershell
pnpm test
pnpm build
pnpm test:e2e
```

浏览器测试使用本机安装的 Google Chrome。
