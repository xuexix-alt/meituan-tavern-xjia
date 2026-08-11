# meituan APP 正文页面「生图持久化」适配方案

> 目标：让 st-chatu8（智绘姬）文生图插件在你的正文页面（`StoryReader`）正常工作——生成、持久化、展示，并兼容你"隐藏真实楼层"的正文呈现方式。
>
> 前提结论（已核实代码）：
> - 你的正文每层是独立 iframe（`TH-message--<id>--`），真实楼层被 `hostFloorVisibility` 用 `visibility:hidden + height:0` 隐藏。
> - st-chatu8 的正文扫描 `processMesTextElements`（`index.js:36298`）对 `.mes_text` 做 `isElementVisible` 视口检查，隐藏楼层 `height:0` 时是否被处理不可靠 → **不能依赖插件的 DOM 自动扫描**。
> - 但插件的**事件总线与你的 APP 共享**：`window.SillyTavern.getContext().eventSource` 与插件 `import { eventSource }` 是同一个单例（见 `@types/iframe/exported.sillytavern.d.ts`）。
> - 插件**后端处理函数内**会 `setItemImg(prompt, imageUrl, ...)` 自动把图写入自身缓存（`index.js:64097 / 68748 / 62734 / 63571`），key = `MD5(prompt)` → **持久化完全沿用插件，无需 APP 自建存储**。
> - 插件的生成按钮 `triggerGeneration`（`index.js:35521`）先 `getItemImg(prompt)` 查缓存（命中即显示、跳过生成）→ 天然**复用插件缓存**。

---

## 一、核心思路：借道插件按钮点击，APP 只补"触发 + 刷新展示"

插件机制照常工作，APP 补三个缺口：

```
消息持久化(persistAssistantMessage) / refresh
  │
  ├─ ① 确保楼层被插件处理（按钮出现）
  ├─ ② 触发生图：跟随插件设置
  │      · 插件 auto-click(zidongdianji)=on → 什么都不做，等插件自动点
  │      · off → APP 找到隐藏楼层里的 .st-chatu8-image-button 并 .click()
  │      · （按钮不存在时 → 兜底：APP 直接 emit generate-image-request，插件后端同样会持久化）
  ├─ ③ 等生成完成（监听 generate-image-response / 轮询 readHostHtml）
  └─ ④ refresh() 重读楼层 HTML → 正文显示 <img>（持久化已由插件完成）
```

插件负责：缓存查重（`getItemImg`）、调后端生图、`setItemImg` 写缓存、往隐藏楼层 `.mes_text` 插 `<img>`。APP 负责：找到按钮、按设置决定是否点击、感知"图好了"、刷新自己的 transcript。

---

## 二、事件 / 数据契约速查（对接 st-chatu8）

| 项 | 值 | 说明 |
|---|---|---|
| 事件总线 | `SillyTavern.getContext().eventSource` | 与插件同一实例；`on/removeListener/emit` |
| 生图请求 | `emit('generate-image-request', { id, prompt, width?, height?, change?, negative_prompt? })` | 当前 mode 的后端自动响应 |
| 生图响应 | `on('generate-image-response', data)` | `{ id, success, imageData(dataURL), prompt, change?, isVideo?, format?, originalUrl?, fromCache?, error? }`，按 `id` 关联 |
| 触发标记 | `settings.startTag ?? 'image###'` … `settings.endTag ?? '###'` | 另兼容 `<image>…</image>` / `<images>…</images>` 块 |
| 插件设置 | `SillyTavern.getContext().extensionSettings['st-chatu8']` | 读 `zidongdianji` / `enablePregen` / `startTag` / `endTag` 等 |
| 楼层定位 | `parent.document.querySelector(".mes[mesid='<id>'] .mes_text")` | 复用 `storyTavern.ts` 已有的 `hostDocuments()` 模式 |
| CSRF（若走 `/api/*`） | `SillyTavern.getContext().getRequestHeaders()` | 兜底上传时用 |

---

## 三、改动点（文件清单 + 设计）

### 3.1 新增 `src/APP/story/storyImageSync.ts`

职责：对指定 `messageId` 完成"确保处理 → 触发 → 等完成"。

```ts
// 伪代码骨架（实现时补全类型）
export interface StoryImageSyncDeps {
  eventSource: Pick<EventSource, 'on' | 'removeListener' | 'emit'>; // SillyTavern.getContext().eventSource
  hostDocuments: () => Document[];
  readHostHtml: (messageId: number) => string;
  getPluginSetting: <K extends keyof Settings>(key: K) => Settings[K]; // extensionSettings['st-chatu8']
}

export function createStoryImageSync(deps: StoryImageSyncDeps) {
  const pending = new Map<string, number>(); // requestId -> messageId

  // ① 找该楼层里插件生成的生成按钮
  function imageButtonsOf(messageId: number): HTMLButtonElement[] { /* query .mes[mesid] .st-chatu8-image-button */ }

  // ② 触发（跟随插件设置）
  async function triggerMessageImages(messageId: number): Promise<void> {
    const buttons = await waitForButtons(messageId, /* timeout 5s */);
    if (deps.getPluginSetting('zidongdianji') === 'true') return; // 插件会自动点
    for (const b of buttons) {
      const reqId = b.dataset.requestId;
      if (reqId) pending.set(reqId, messageId);
      b.click(); // 程序化 click，隐藏元素也可用
    }
  }

  // ③ 等完成
  function waitImages(messageId: number, requestIds: string[]): Promise<void> { /* 监听 response / 轮询 readHostHtml */ }

  // 兜底：按钮迟迟不出现 → 直接发事件（插件后端照样 setItemImg 持久化）
  async function fallbackEmit(messageId: number): Promise<void> { /* 提取标记 → emit request → 等 response → 通知刷新 */ }

  function onImageResponse(data): void { /* pending 命中 → refresh */ }
}
```

### 3.2 `src/APP/story/storySession.ts` —— 接两根线

- `persistAssistantMessage` 成功后（`refresh('assistant_persisted')` 前后）调用：
  `void triggerMessageImages(nextId).then(() => refresh('image_synced'))`
- `refresh()` 时对已持久化、且 `finalHtml` 里仍含 `image###`（未出图）的 assistant 楼层，补调 `triggerMessageImages`（首屏历史补图）。

### 3.3 `src/APP/story/storyTranscript.ts` —— 展示净化

`finalHtml` 来自 `readHostHtml`，可能含插件残留的生成按钮：
- 新增 `stripPluginArtifacts(html)`：移除 `.st-chatu8-image-button`、`.st-chatu8-collapse-wrapper` 里的按钮头（可选保留折叠）、加载态文本。
- 这样正文只显示 `<img>/<video>`，不显示"生成图片"按钮。

### 3.4 `src/APP/story/StoryMessageBody.vue` —— 兜底渲染（可选）

若走 `fallbackEmit`（按钮没出现、APP 直接拿到的 `imageData`），需要 APP 自己渲染：
- 在 `storyDisplay` 的 `resolveStoryImages(html, messageId)` 里，把 `image###prompt###` 标记替换为 `<img src="<imageData>">`（数据来自临时内存态或 APP 自己记的 Map）。
- 这是**降级路径**：正常情况插件会把 `<img>` 写回楼层，`readHostHtml` 直接读到，不需要这一步。

### 3.5 取消链（可选）

`StoryReader` 的"停止生成"目前只停 LLM。生图是插件异步任务，若想一并停：
- 对每个已触发的 `requestId`，`emit('st_chatu8_cancel_task', { taskId: requestId })`（插件直连客户端通用取消，当前无监听者，属预留；或等插件补齐按 prompt 取消）。`cancelGeneration` 里顺带调。

---

## 四、三种持久化语义的落点（对应你的三个选择）

| 你的选择 | 方案落点 |
|---|---|
| **沿用插件持久化** | 插件后端 `setItemImg` 自动写 `chatu8_gallery`（IndexedDB）/服务器 `user/images`。APP 不建存储层。 |
| **跟随插件设置** | 触发前读 `extension_settings['st-chatu8'].zidongdianji`；开→不点，关→点。也尊重 `enablePregen`（流式预生成由插件自己跑）。 |
| **复用插件缓存** | 按钮路径天然复用（`triggerGeneration` 先 `getItemImg`）。兜底路径也由后端 `setItemImg` 写入缓存，下次按钮命中。 |

---

## 五、已知边界与风险

1. **隐藏楼层能否被插件处理**（按钮是否出现）：楼层折叠后 `height:0`，`isElementVisible`（视口检查）在"用户正看着 APP（载体楼层在视口内）"时通过；若主页面滚动使载体出视口，可能不处理 → 走兜底。
2. **按钮 `.click()` 在隐藏元素上有效**（程序化 click 不要求可见性），已确认插件按钮是普通 `button` + 事件委托/直绑，`.click()` 可触发 `triggerGeneration`。
3. **`readHostHtml` 时序**：消息刚落库时读到的是原始标记文本，图好后再 refresh 才有 `<img>`。需要"等完成 → refresh"闭环，别在 persist 后立刻依赖图片。
4. **双触发保护**：插件自身有 `isGenerating(prompt)` + `data-loading` 防重复；APP 点击时先判 `zidongdianji`，避免和自动点击叠加。
5. **`collapseImage` 折叠**：若插件开了折叠，`readHostHtml` 会带回折叠头 HTML，可选择性剥离。

---

## 六、验收清单

- [ ] 正文出现 `image###<prompt>###` → 自动生成 → 正文显示 `<img>`，无"生成图片"按钮残留
- [ ] 刷新页面后正文图仍在（插件缓存命中，`readHostHtml` 直接读到 `<img>`）
- [ ] 插件 auto-click 开 → APP 不重复点；关 → APP 点
- [ ] 同一 prompt 复用：改改提示词重生成一次，再次触发不重复消耗
- [ ] `StoryReader` 历史回看（`StoryHistoryOverlay`）也能显示已生成图
