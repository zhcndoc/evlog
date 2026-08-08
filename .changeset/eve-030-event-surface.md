---
"evlog": minor
---

覆盖 eve 0.30 的事件面。**`evlog/eve` 现在要求 eve >= 0.30** ——对等依赖范围从 `>=0.24.3` 提升。eve 集成仍处于 beta 阶段，其对等依赖最低版本也随之提升，因此此版本作为 minor 发布；`evlog/eve` 之外的部分不受影响。使用旧版 eve 的 agent 会继续基于之前的 evlog 正常工作——请先升级 eve。

现在的宽事件包含了 eve 自 0.24 起开始报告的信息：

- `eve.runtime` ——来自 `session.started` 的 eve 版本、agent id、模型，以及部署时的 git sha、分支和日期
- `eve.parent` ——子 agent 运行的父会话 id 和根会话 id，使 drain 能够重建委派树
- `eve.authorizations` ——连接登录及其结果、原因和持续时间；在其中一个连接上暂停的 turn 会以 `eve.phase: 'awaiting-authorization'` 结束
- `eve.compaction` ——执行了多少次压缩、使用了哪个模型，以及第一次触发压缩时上下文有多满
- `eve.contextCleared`、`eve.stepFailures` 和 `eve.failedSteps` ——一次失败并重试的模型调用，不会再从最终成功的 turn 中消失
- `ai.costUsd` ——eve 报告的成本；如果可用，则取代 `cost` 定价映射。`ai.model` 会回退到会话开始时报告的模型，因此只有动态模型 agent 才需要 `model`
- 子 agent 会记录 `durationMs` 和 `started` 状态

`message` 取代 `redactMessage`，提供三种模式：`'omit'`（默认）、`'preview'`（将文本截断至 `messagePreviewLength`，附件缩减为其类型和媒体类型）以及 `'full'`。此前完全不会对附件部分进行脱敏。`redactMessage` 仍然可用，但已弃用。

`sessionEvent: true` 会在每个会话的逐 turn 事件之上，再为每个会话添加一个宽事件，汇总 turn、token、成本、使用的工具、压缩和授权信息——每个会话一行，这正是 tail sampling 对 agent 有用的原因。
