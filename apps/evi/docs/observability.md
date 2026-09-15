# 可观测性

Evi 目前记录的内容、无法记录的内容，以及值得在上游弥补的空白。

## 哪些功能可用

`agent/hooks/evlog.ts`` 每轮发出一个 evlog 宽事件。一条轮次事件包含
`eve.{sessionId,turnId,turnSequence,sessionTurns,runtime,reasoning}`、
`ai.{calls,steps,inputTokens,outputTokens,cacheReadTokens,costUsd,model,tools[],finishReason}`、
`channel.kind`、`status`、`durationMs`，以及 `service` 和 `environment`。

仅凭日志，这些信息足以回答：一轮运行花费了多少、调用了哪些工具以及每个工具是否成功、
上下文中有多少由缓存提供，以及它来自哪个界面。本项目中的所有成本声明都来自这些事件的实际测量，
而不是估算。

工具执行会以如下模式使用其结果丰富同一事件：`tools/memory.ts` 集合：每个领域一个命名空间，
其中包含计数、原因代码，以及由 Evi 编写的标识符。绝不包含原始错误字符串、工具负载或不受信任的 URL，
因此符合仅元数据 PostHog 策略。这些命名空间包括：
`git.{branch,pushed,sha,reason}`、
`capture.{published,viewport,target,beforeHost,afterHost,reason}`、
`blob.{uploaded,bytes}`、`turbo.{remoteCache,reason}`、
`gateway.report.{mode,groupBy,matchedRows}`、
`content.{scanned,candidates,eligible,targets,group,surface}`、
`image.{host,fetched,bytes,mediaType}`，以及
`memory.{saved,refused,searched,hits}`。一次保留了所有内容的内容处理，或一次被拒绝的推送，
都可以仅凭轮次事件绘制出来。工具执行是 `useLogger()` 在契约上绑定的唯一位置（见下方的调用方差距），
这也是 hooks、schedules 和 subagents 没有埋点的原因。

`environment` 来自 `agent/lib/environment.ts`，也就是构建 gateway spend 标签的同一个函数。
这是有意为之：一次按 `eval` 计费的运行也会记录为 `eval`，因此两个视图能够对应起来。此前，宽事件会将
eval 和本地流量都报告为 `development`，而支出报告却将它们分开——这种偏差会让 dashboard 在不知不觉中说谎。

fs drain 只会在存在持久磁盘的环境中挂载。在 Vercel 上，`/tmp` 之外的所有位置都是只读的，
而 `createFsDrain` 对其 `mkdir` 和 `appendFile` 都没有防护，因此在那里发送它会导致每轮抛出一次异常，
并写入无人能够读取的事件。在托管环境中，stdout 是传输方式，平台会捕获它。

`agent/instrumentation.ts` 启用 eve 的 OpenTelemetry 接口。没有这个文件，根本不会有 span 树——
Agent Runs 标签页由 Workflow 运行标签提供数据，它们是一个独立的系统。有了它，一轮运行会产生
`ai.eve.turn` → `ai.streamText`（每个步骤）→ `ai.streamText.doStream` 和 `ai.toolCall`（每个工具）。
这是唯一能看到每个工具耗时和每个步骤模型输入的地方；宽事件只会说明一轮调用了六个工具，
而 span 树会说明每个工具在哪个步骤中运行，以及模型最先看到了什么。`defineEvlogInstrumentation` 会在每个 span 上标记
`evlog.request_id` 和 `evlog.session_id`，因此可以将一个缓慢的 span 追溯到对应的宽事件，反之亦然。
没有注册 `setup`，因此在选定后端之前，eve 会将追踪保留在本地。

## 尚未验证

已设置 `sessionEvent: true`，但从未观察到其触发。它会在
`session.completed` / `session.failed` 时发出，而评估运行器按设计会保持会话打开，因此完整测试套件中的 17 个轮次事件产生了零个汇总。它已完成配置，但尚未确认。请使用一个确实结束的 GitHub 讨论串对其进行检查。

## 差距：没有任何信息标识调用者

turn 事件说明发生了什么以及付出了什么代价，但没有说明**是谁发起的**。
对于一个仓库机器人而言，这是你最希望用来分组的维度——每位
用户的成本、每位用户的使用量、每位用户的拒绝次数，以及在
[authorization.md](./authorization.md) 中完成层级工作之后，一次 turn 运行所在的层级。

这不是配置中的疏漏；目前没有受支持的路径。
`evlog/eve` 从 eve 流构建事件，而它提供的 enrich hook 是 HTTP 形态的——`{ event, request, headers, response }`——其中没有对 eve 会话的引用，因此无法从中访问 `session.auth`。我们尝试了三种方案，全部来自一个调用 `useLogger().set({ caller })` 的自定义 eve hook：

| 方案 | 添加注释的 turn 数 |
| --- | --- |
| `turn.started` 上的 `useLogger()` | 2 个中有 1 个 |
| `turn.started` 上的 `useLogger({ session: { id, turn } })` | 16 个中有 0 个 |
| `step.started` 上的 `useLogger()` | 16 个中有 1 个 |

`useLogger()` 的文档化契约是工具的 `execute()` 处理程序，在那里可以保证
AsyncLocalStorage 已绑定。Hook 位于其外部，而 evlog hook 会在 `turn.started` 上自行注册 turn logger，因此两个 hook 会在同一事件上产生竞争。我们没有发布这一尝试，而是将其移除：只有 6%
的 turn 带有注释比完全没有更糟，因为它看起来像数据，实际上却是有偏的样本。

`evlog/eve` 现在会自行记录 `eve.caller`，而 `agent/instrumentation.ts` 会将同一个主体放到 spans 上。由此产生两点影响。该主体是一个跨日志和追踪重复出现的稳定个人标识符，因此会继承 drain 的任何保留策略——在添加一个比平台保留事件更久的 drain 之前，请先决定这一点。对于未认证的调用者，则会将其省略，而不是写入空值：空属性看起来像是调用者的 id 恰好为空。

## 提案

### evlog/eve — 让 `defineEvlogInstrumentation` 接受 `events`

在任何人着手处理之前就已被取代：受支持的组合路径已经发布。`evlogRuntimeContext(input)` 从 `evlog/eve` 导出，
而 instrumentation 不是单独使用 evlog 的调用方会丢弃该包装器，并将其展开到自己的 `defineInstrumentation` 中——
也就是提案所希望的合并，由调用方完成（记录在
`packages/evlog/src/eve/index.ts` 的 `defineEvlogInstrumentation` 上）。

### evlog/eve — 从 enrichment 中获取 eve session

常见情况已基本解决：`evlog/eve` 会在事件本身记录 `eve.caller`（见上面的差距部分），因此按用户分组成本不再需要 hook。这里剩下的是面向希望获取 turn 上 principal 之外更多信息的消费者的一般需求。Spans 仍然不是宽事件，而 `enrich` 仍保持 HTTP 形态。可以为 eve 集成拓宽它以携带 eve session，或者公开一个 turn 作用域的回调，在已知 logger 存在的位置运行：

```ts
defineEvlogHook({
  enrichTurn: (ctx) => ({ caller: ctx.session.auth.current?.principalId }),
})
```

任何能够避免消费者猜测 hook 执行顺序的方案都可以。每个运行在多用户频道上的 agent 都需要这一点，而不只是这一个 agent。

### evlog/eve — 将输入 token 归因给导致它们产生的工具

已落地（#622，EVL-289）：`ai.tools[]` 条目现在携带 `inputTokens`，这是在提供模型输入的工具之间拆分的步骤增量。

### evlog/eve — 记录解析后的 provider

已落地（#622）：提供该调用的 deployment 会在事件中以 `ai.provider` 记录。

### github-tools — 在工具结果上展示 GitHub 速率限制状态

已在 github-tools extension 上游落地（EVL-343，2026-08-27）：工具的结果界面现在公开速率限制状态，eve extension 也会记录该状态。

### github-tools — 按 session 限定工具范围

这在 [authorization.md](./authorization.md) 中被描述为一项安全修复。它同样也是一项可观测性改进：通过依赖调用方的工具范围，日志可以记录某个等级实际拥有的工具，因此“Evi 拒绝了”和“Evi 从未拥有该工具”不再看起来完全相同。

### eve — eval 运行会将 session 泄漏到本地环境

`pnpm eval` 会让它打开的每个 session 持续存活：按照设计，`t.succeeded()` 会接受一个健康且仍处于打开状态的 session。每个 session 都会向一个已经不存在的开发服务器排队一个
`sessionTimeoutWorkflow`，因此后续运行会打印越来越长的一面
`[world-local] Queue delivery failed ... TypeError: fetch failed`。在这里，一次包含 16 个 eval 的运行达到了 409 行，并且每次运行都会继续增长。

排队的工作会随着每次运行不断增加，并掩盖输出中的真实失败，因此它造成的是对真实失败的遮蔽，而不是失败本身。要么 eval runner 应关闭它打开的 session，要么本地环境应丢弃目标运行已经不存在的消息。另一个相关的一次性问题也会出现：`Cannot set attributes on run in
terminal state "completed"`。

## 当数据量足以支持时

这里没有任何采样：每一轮都会保留。在当前数据量下这是正确的，但数据量达到 100 倍时就不再适用了。`defineEvlogHook` 接受一个用于尾部采样的 `keep` 谓词——应采用的形式是保留所有有价值的信息：工具失败、步骤失败、审批、授权，以及成本超过阈值的轮次，其余内容进行采样。在有数据可丢弃之前就加入它，只会白白丢失数据。
