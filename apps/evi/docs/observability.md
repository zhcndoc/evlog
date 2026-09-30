# 可观测性

Evi 目前记录的内容、无法记录的内容，以及值得在上游弥补的空白。

## 哪些功能可用

`agent/hooks/evlog.ts` 每轮发出一个 evlog 宽事件。一条轮次事件包含
`eve.{sessionId,turnId,turnSequence,sessionTurns,runtime,reasoning}`、
`ai.{calls,steps,inputTokens,outputTokens,cacheReadTokens,costUsd,model,tools[],finishReason}`、
`channel.kind`、`status`、`durationMs`，以及 `service` 和 `environment`。

仅凭日志，这些信息足以回答：一轮运行花费了多少、调用了哪些工具以及每个工具是否成功、
上下文中有多少由缓存提供，以及它来自哪个界面。本项目中的所有成本声明都来自这些事件的实际测量，
而不是估算。

工具执行会把结果写入同一事件，遵循 `tools/memory.ts` 中的模式：每个领域使用独立命名空间，
记录计数、原因代码和由 Evi 生成的标识符。不会记录原始错误字符串、工具负载或不受信任的 URL，
因此符合 PostHog 仅元数据策略。命名空间包括：
`git.{branch,pushed,sha,reason,exitCode}`、
`git.checkout.{repository,done,sha,reason,exitCode}`、
`git.install.{repository,done,reason,exitCode}`、
`capture.{published,viewport,target,beforeHost,afterHost,reason}`、
`blob.{uploaded,bytes,reason}`、`turbo.{remoteCache,reason}`、
`vercel.{env,key,project,target,reason,status}`、
`gateway.report.{mode,groupBy,matchedRows}`、
`content.{scanned,candidates,eligible,targets,group,surface,reason}`、
`image.{host,fetched,bytes,mediaType,reason}`，以及
`memory.{saved,refused,searched,hits}`。仅凭轮次事件，就能绘制一次完整保留内容的内容处理，
或一次被拒绝的推送。`useLogger()` 在契约上只保证可用于工具执行（见下方调用方差距）；hooks
和子代理仍没有埋点，而轮次外运行的两项工作会各自发出事件。

`environment` 来自 `agent/lib/environment.ts`，也就是构建 gateway spend 标签的同一个函数。
这是有意为之：一次按 `eval` 计费的运行也会记录为 `eval`，因此两个视图能够对应起来。此前，宽事件会将
eval 和本地流量都报告为 `development`，而支出报告却将它们分开，这种偏差会让 dashboard 在不知不觉中说谎。

## 错误记录

Evi 生成的错误都来自 `agent/lib/errors.ts` 中的目录（`defineErrorCatalog('evi', …)`），因此 `reason` 字段始终是目录代码（如 `evi.GITHUB_NOT_INSTALLED`、`evi.GIT_COMMAND_FAILED`），不会是临时字符串。工具通过 `refusal(eviErrors.X(...))` 拒绝操作，返回 `{ success: false, code, error }`。模型读取 `error`，其中包含消息和目录项的 `fix`；轮次事件则在工具命名空间下记录 `code`。错误消息由 Evi 编写。第三方响应正文会放入 `internal`，而 `EvlogError` 会在 `toJSON` 中排除该字段，因此它不会进入工具结果。

`log.error(error)` 的处理路径不同：它会序列化错误对象的 getter，包括 `internal`，因此轮次外处理器记录的是消息和代码，而不是错误对象。类型系统还无法阻止一类命名冲突：模板参数不能使用覆盖字段的名称，例如 `status`、`message` 或 `fix`，因为工厂会在模板替换前移除这些字段。

当前错误目录无法进入 eve 的失败事件。`turn.failed` 携带结束轮次的 harness 错误代码（`MODEL_CALL_FAILED`、`EVENT_HANDLER_FAILED` 等）；抛出的工具错误会在传给模型以及写入 `ai.tools[].error` 前被简化为 `error.message`（eve harness 中的 `createRuntimeToolResultFromToolError`）。因此，抛出的目录错误只能以文本而不是代码的形式出现。工具只要需要自行报告失败，就返回 refusal 而不抛出错误。`lib/failure.ts` 中的 `_Error code:` 行打印的是 eve 的代码，而不是 Evi 的代码。下方列出了提交给 eve 的提案。

## 轮次外事件

有两项工作没有可附加事件的轮次：失败的自主分流会静默升级（`lib/github/escalate.ts`），计划任务会将任务交接到 Slack（`lib/schedule.ts`）。两者都会通过 `jobLogger()` 发出一个宽事件。该 logger 位于 `agent/lib/job.ts`，是带有 `job` 字段（`github.escalate`、`schedule.send`）的 evlog 全局 logger。`agent/hooks/evlog.ts` 为它配置独立 drain，目标与轮次事件使用相同的 fs 和 PostHog，但事件名为 `evi_job`，因此轮次图表不会把计划任务交接计入轮次。轮次事件会通过 `_deferDrain` 绕过全局 drain，避免重复投递。







fs drain 只会在存在持久磁盘的环境中挂载。在 Vercel 上，`/tmp` 之外的所有位置都是只读的，
而 `createFsDrain` 对其 `mkdir` 和 `appendFile` 都没有防护，因此在那里发送它会导致每轮抛出一次异常，
并写入无人能够读取的事件。在托管环境中，stdout 是传输方式，平台会捕获它。

`agent/instrumentation/` 启用 eve 的 OpenTelemetry 接口：`otel.ts` 保存进程级的仅元数据追踪策略，
`posthog.ts` 配置 PostHog 目标。缺少这两个文件时不会生成 span 树。Agent Runs 标签页由 Workflow
运行标签提供数据，这是独立的系统。启用这些文件后，每轮会产生 `invoke_agent`、每个步骤对应的
`agent.step`、模型调用对应的 `chat`，以及每个工具对应的 `agent.action` 和 `execute_tool`。
只有 span 树会显示每个工具的耗时和每个步骤的模型输入；宽事件只会说明一轮调用了六个工具，
span 树则会说明它们分别在哪个步骤运行，以及模型最先看到了什么。将 `evlogRuntimeContext`
展开到目标的 `runtimeContext` 后，每个 span 都会带有 `evlog.request_id` 和 `evlog.session_id`，
因此可以在 span 和宽事件之间相互追溯。未设置 `POSTHOG_API_KEY` 时，PostHog 目标会自行停用，
eve 会将追踪保留在本地。

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

`evlog/eve` 现在会自行记录 `eve.caller`，`agent/instrumentation/posthog.ts` 也会在 span 上写入相同主体。这带来两个影响：主体是会在日志和追踪中重复出现的稳定个人标识符，因此会继承 drain 的保留策略。添加保留时间长于平台的 drain 前，请先确定该策略。未经身份验证的调用者会被省略，而不是写入空值；空属性看起来像是调用者的 ID 恰好为空。

## 提案

### evlog/eve：让 `defineEvlogInstrumentation` 接受 `events`

在有人着手处理前就已被取代：受支持的组合方式已经发布。`evlogRuntimeContext(input)` 从 `evlog/eve` 导出；
不只使用 evlog instrumentation 的调用方可以舍弃包装器，并将其展开到自己的 `defineInstrumentation` 中。
提案所需的合并由调用方完成，相关说明位于
`packages/evlog/src/eve/index.ts` 的 `defineEvlogInstrumentation` 文档中。

### evlog/eve：让 enrichment 访问 eve session

已落地：`defineEvlogHook()` 提供 `enrichTurn`。这是一个轮次级回调，在创建轮次 logger 时运行，并可访问 eve session：

```ts
defineEvlogHook({
  enrichTurn: (ctx) => ({ caller: ctx.session.auth.current?.principalId }),
})
```

返回字段会合并到轮次事件中，并覆盖内置字段；它们不会传递到同一会话的后续轮次。`enrich` 保持 HTTP 形态，
因为它属于所有框架集成共享的 `BaseEvlogOptions`。如果扩展它来携带 eve session，就会把 eve session
加入每种 HTTP 集成的契约。将轮次级选项放在 eve hook 中，可以把能力限制在 eve 集成内，并免去对 hook
执行顺序的猜测。

### evlog/eve：将输入 token 归因给产生它们的工具

已落地（#622，EVL-289）：`ai.tools[]` 条目现在携带 `inputTokens`，这是在提供模型输入的工具之间拆分的步骤增量。

### evlog/eve：记录解析后的 provider

已落地（#622）：提供该调用的 deployment 会在事件中以 `ai.provider` 记录。

### eve：在工具结果和 `turn.failed` 中保留抛出错误的 `code`

工具抛出的错误如果带有 `code`（例如 evlog 的 `EvlogError`，或任何带有该字段的 `Error` 子类），
会在 harness 边界丢失该字段：`createRuntimeToolResultFromToolError` 只保留 `message`，而
`turn.failed` 携带的是 harness 自己的代码。如果运行时工具结果能保留 `code`，失败事件能保留
`details.code`，`evlog/eve` 就可以将其写入 `ai.tools[]`，频道中的失败评论也能打印应用自己的代码，
而不是 `EVENT_HANDLER_FAILED`。在此之前，Evi 的错误目录只能通过 refusal 结果和 `reason` 字段查看。

### github-tools：在工具结果中展示 GitHub 速率限制状态

已在 github-tools extension 上游落地（EVL-343，2026-08-27）：工具的结果界面现在公开速率限制状态，eve extension 也会记录该状态。

### github-tools：按 session 限定工具范围

这在 [authorization.md](./authorization.md) 中被描述为一项安全修复。它同样也是一项可观测性改进：通过依赖调用方的工具范围，日志可以记录某个等级实际拥有的工具，因此“Evi 拒绝了”和“Evi 从未拥有该工具”不再看起来完全相同。

### eve：eval 运行会将 session 泄漏到本地环境

`pnpm eval` 会让它打开的每个 session 持续存活：按照设计，`t.succeeded()` 会接受一个健康且仍处于打开状态的 session。每个 session 都会向一个已经不存在的开发服务器排队一个
`sessionTimeoutWorkflow`，因此后续运行会打印越来越长的一面
`[world-local] Queue delivery failed ... TypeError: fetch failed`。在这里，一次包含 16 个 eval 的运行达到了 409 行，并且每次运行都会继续增长。

排队的工作会随着每次运行不断增加，并掩盖输出中的真实失败，因此它造成的是对真实失败的遮蔽，而不是失败本身。要么 eval runner 应关闭它打开的 session，要么本地环境应丢弃目标运行已经不存在的消息。另一个相关的一次性问题也会出现：`Cannot set attributes on run in
terminal state "completed"`。

## 当数据量足以支持时

这里没有采样：每一轮都会保留。以当前数据量来说这是合适的，数据量达到 100 倍时则未必如此。
`defineEvlogHook` 接受用于尾部采样的 `keep` 谓词。建议保留所有有价值的信息：工具失败、步骤失败、
审批、授权，以及成本超过阈值的轮次；对其余轮次采样。在有数据可丢弃之前加入采样，只会白白丢失数据。
