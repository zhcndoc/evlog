---
"evlog": minor
---

`evlog/eve` 记录调用方，并与另一个可观测性后端组合使用。

一个 agent 恰好只有一个 `agent/instrumentation.ts`，而 eve 注册表中的每个可观测性项目都会写入该文件。`defineEvlogInstrumentation()` 负责管理该文件，因此它只适用于其 instrumentation 完全由 evlog 独占的 agent。新的 `evlogRuntimeContext` 会像其他集成一样，将 evlog 的 span 属性添加到你已有的 instrumentation 中：

```ts
import { defineInstrumentation } from 'eve/instrumentation'
import { evlogRuntimeContext } from 'evlog/eve'

export default defineInstrumentation({
  setup: ({ agentName }) => registerOTel({ serviceName: agentName, spanProcessors: [...] }),
  events: {
    'step.started': input => ({
      runtimeContext: {
        ...evlogRuntimeContext(input),
        posthog_distinct_id: input.session.auth.current?.principalId ?? '',
      },
    }),
  },
})
```

在跟踪中的 turn 之外，它会返回 `undefined`，因此展开它不会添加任何内容。

现在，turn 和 session 事件都会携带 `eve.caller`，其中包含在 dispatch 时解析出的 principal eve：`principalId`、`principalType` 和 `authenticator`。在多用户频道中，你可以按此维度对成本、数量和拒绝次数进行分组；此前这一信息无法获取——enrich hook 采用 HTTP 形态，并且没有通往 eve session 的路径。`subject` 和 `attributes` 被有意排除，因为频道可能会在其中放入姓名或电子邮件地址。
