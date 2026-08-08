---
"evlog": minor
---

补齐 eve 集成中剩余的缺口，并添加 `defineEvlogInstrumentation()`。

一个宽事件和一个 Agent Runs span 描述的是同一轮交互，但之前它们没有关联起来：你无法从 Braintrust、Datadog 或 Vercel 控制面板中的 trace 跳转到 drain 中的事件。请从 `agent/instrumentation.ts` 导出新的定义，这样每个模型调用 span 都会携带 `evlog.request_id` 和 `evlog.session_id`，其值分别对应宽事件中的 `requestId` 和 `eve.sessionId`：

```ts
// agent/instrumentation.ts
import { defineEvlogInstrumentation } from 'evlog/eve'

export default defineEvlogInstrumentation()
```

如果没有 `setup`，OpenTelemetry 导出不会受到影响，eve 仍会继续写入本地 trace。`functionId`、`recordInputs`、`recordOutputs` 和 `traceChannelRequests` 会透传给 eve。

eve 的另外三个流事件现在也会到达宽事件：

- `eve.reasoning` — `blocks` 和 `chars`，即模型思考内容的大小。推理文本本身不会被记录。
- `message.responseChars`，以及当 `message` 为 `'preview'` 或 `'full'` 时的 `message.response` — 代理的回答，其处理规则与传入消息相同。
- `eve.result` — 带有输出 schema 的代理的结构化结果。
