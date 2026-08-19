# 视觉

Evi 如何查看图像。基础模型（`EVI_MODEL`、DeepSeek V4 Flash）仅支持文本，因此视觉并不是更换模型：`agent/agent.ts` 中的动态模型解析器会在每一步重新评估，并在*当前轮次*携带图像部分时选择视觉备用模型（`EVI_VISION_MODEL`、Qwen 3.7 Flash），这些图像部分可能来自传入的附件，或工具在本轮返回的屏幕截图。模型选择逻辑位于 `agent/lib/model.ts`（`modelForMessages`、`modelForStep`）。从未看到图像的会话无需为图像付费。

下一轮会返回基础模型：`modelForStep` 会将其包装在一个中间件中，把更早轮次中的视觉载荷替换为文本占位符，因为基础模型会拒绝历史记录中的原始图像部分。因此，图像只能在传递它的那一轮中被读取；占位符会告诉模型再次请求该图像。这样也能避免同一张屏幕截图在后续每次调用中反复为其 base64 载荷计费，并避免让一个长期线程在备用模型上持续数天。

备用模型必须能够运行完整的一轮，包括工具，而不只是为图片生成说明：当图像存在于当前轮次中时，每一步都在该模型上运行。Qwen 3.7 Flash 原生支持视觉，具备代理能力，且费率不高于基础模型。

## 按渠道

| 渠道 | 图像如何到达 Evi |
| --- | --- |
| Linear（代理会话） | eve 使用 Linear token 从会话提示中获取 `uploads.linear.app` 的 Markdown 图像，并将其作为图像部分附加。应用无需进行任何操作。 |
| Linear（通过 MCP 读取的文档、议题正文） | MCP 工具返回包含 `uploads.linear.app` URL 的 Markdown。`images__view` 使用应用 token 获取这些图像；仅限管理员会话，与 Linear 连接本身的权限保持一致。 |
| GitHub（议题、PR、评论） | 该渠道没有传入附件；图像以 Markdown URL 的形式存在于正文中。`images__view` 获取 `github.com/user-attachments` 和 `*.githubusercontent.com` 的内容，社区首位响应者轮次也一样。 |
| iMessage（Photon） | 由 `patches/` 中的 eve 补丁传递。Photon webhook 发送的附件元数据不包含字节或 URL，而适配器只保留名称、mimeType、大小，因此标准 eve 会丢弃附件（并完全丢弃纯图像消息）。当消息声明包含图像附件时，修补后的 `photonInboundContent` 会通过适配器的 spectrum 客户端（`fetchMessage`）重新解析它；其解析出的内容节点带有经过身份验证的 `read()`，并将字节作为文件部分传递。待 eve 消费 chat-sdk 的 `data`／`fetchData` 附件契约后即可移除该补丁。 |
| 浏览器（沙盒） | `@agent-browser` 扩展启用了 `inlineScreenshots: true`；屏幕截图会作为工具内容部分返回。 |

## 有意设置的限制

- `images__view` 只获取上述附件主机，且仅支持 https。URL 来自不受信任的 Markdown；使用允许列表优于开放式获取器。
- 原始大小上限为 2 MB（`MAX_INLINE_IMAGE_BYTES`），因此 base64 内容部分会保持在 eve 的 3 MiB 会话历史警告阈值以下：图像部分会在之后的每次模型调用中重新发送。
- 字节内容必须能被识别为完整的 png／jpg／webp／gif（与 blob 上传使用相同的检查）；绝不信任服务器的 content-type 标头。不支持 svg。
- 失败会明确返回，绝不静默处理：工具会返回具体错误（不支持的主机、HTTP 状态、大小超限、不是图像），并且指令要求报告该错误，而不是描述未实际看到的图像。
- 被压缩的图像会消失：eve 会将载荷替换为文本占位符。会话可能需要再次使用的图像应放在沙盒中，而不是历史记录里。
