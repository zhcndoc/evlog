# 视觉

Evi 如何查看图像。基础模型（`EVI_MODEL`、GLM 5.3 Flash）原生接收图像部分，因此无需进行选择：传入的附件或工具在本轮返回的截图会原样到达模型，并与本轮的其余内容一起在同一次调用中发送。

基础模型必须是既能接收图像又能运行完整回合（包括工具）的模型，而不能只是为图片生成描述的模型：图像会留在每个后续步骤都会读取的历史记录中。纯文本基础模型需要为携带图像部分的回合使用第二个模型，并在之后使用中间件将这些部分从历史记录中清除，因为它会拒绝直接接收这些内容——原生视觉能力正是免除了这套机制。

图像部分会在会话中的每次后续模型调用时重新发送，这就是为什么 `images__view` 会限制其内联内容，以及为什么 eve 会压缩掉旧载荷（见下方限制）。

## 按渠道

| 渠道 | 图像如何到达 Evi |
| --- | --- |
| Linear（agent session） | eve 使用 Linear token 从会话提示中获取 `uploads.linear.app` Markdown 图像，并将其作为图像部分附加。应用无需进行任何操作。 |
| Linear（通过 MCP 读取的文档、issue 正文） | MCP 工具返回包含 `uploads.linear.app` URL 的 Markdown。`images__view` 使用应用 token 获取这些图像；仅限管理员会话，与 Linear 连接本身保持一致。 |
| GitHub（issues、PR、评论） | 该渠道没有传入附件；图像以 Markdown URL 的形式存在于正文中。`images__view` 获取 `github.com/user-attachments` 和 `*.githubusercontent.com` 中的图像，社区的首位响应者回合也同样如此。 |
| iMessage（Photon） | 不会传递。Photon webhook 发送的附件元数据不包含字节数据或 URL，而适配器只保留名称／mimeType／size，因此 eve 会丢弃该附件（纯图像消息会被完全丢弃）。请通过 Slack 发送图像，eve 可以原生读取。上游修复方案是让 eve 使用 chat-sdk 的 `data`／`fetchData` 附件契约。 |
| Browser（sandbox） | `@agent-browser` 扩展启用了 `inlineScreenshots: true`；截图会作为工具内容部分返回。 |

## 有意设置的限制

- `images__view` 只获取上述附件主机，且仅支持 https。URL 来自不受信任的 Markdown；使用允许列表优于开放式获取器。
- 原始大小上限为 2 MB（`MAX_INLINE_IMAGE_BYTES`），因此 base64 内容部分会保持在 eve 的 3 MiB 会话历史警告阈值以下：图像部分会在之后的每次模型调用中重新发送。
- 字节内容必须能被识别为完整的 png／jpg／webp／gif（与 blob 上传使用相同的检查）；绝不信任服务器的 content-type 标头。不支持 svg。
- 失败会明确返回，绝不静默处理：工具会返回具体错误（不支持的主机、HTTP 状态、大小超限、不是图像），并且指令要求报告该错误，而不是描述未实际看到的图像。
- 被压缩的图像会消失：eve 会将载荷替换为文本占位符。会话可能需要再次使用的图像应放在沙盒中，而不是历史记录里。
