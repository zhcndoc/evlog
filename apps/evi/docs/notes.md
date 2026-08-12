# 备注

那些需要花时间才能发现的事情。每一条都是此代理中的某些代码行之所以如此的原因——将它们保留在这里，这样代码就不必承载这些说明。

## eve

**已编写的通道报告为 `channel:<name>`，框架通道则报告不带前缀的名称。**
`agent/channels/github.ts` 是 `channel:github`，而 `http`、`schedule` 和
`subagent` 则直接以名称出现。比较 `ctx.channel.kind === 'github'` 永远不会匹配，
而且不会发出任何提示。`agent/lib/channel.ts` 会对其进行规范化；工作区指令和
花费标签都会经过它。

**内置工具不会被 `eve info` 统计。**它只报告已编写的工具，
因此 `Tools 0` 仍然意味着 `bash`、`read_file`、`write_file`、`glob`、`grep`、
`web_fetch`、`todo` 和 `load_skill` 全部存在。

**只有 GitHub 通道会检出仓库。**这发生在第一次模型调用之前，使用触发时的 ref，
并在多轮对话中增量进行，而且仅限于支持防火墙的后端。在本地以及其他所有通道中，
`/workspace` 都是空的。沙箱文件工具会拒绝相对于仓库的路径。

**`disableTool()` 是静态的。**没有按会话移除内置工具的方法，因此某个工具在某个通道上
没有用处时，仍会占用该通道的上下文。

**推理级别按模型区分。**`GET /v1/models` 会公开 `reasoning_options`；
DeepSeek V4 Flash 只声明了 `high` 和 `xhigh`。设置为 `low` 或 `medium` 不会报错，
而是产生异常且不单调的推理量。

**会话限制默认为 4000 万个输入 token，且没有输出上限**，按当前价格计算，
一次失控的会话费用可能接近 8 美元。

**评估运行会泄漏会话。**`t.succeeded()` 会接受一个健康的开放会话，因此每次运行都会
留下一个针对已失效开发服务器、排队等待执行的 `sessionTimeoutWorkflow`。后续运行会输出
越来越多的 `[world-local] Queue delivery failed`。排队的工作会在每次运行中增长，并掩盖
输出中的真实失败。

**从未观察到 `sessionEvent` 触发。**它会在会话完成时发出，而评估运行器从未到达
会话完成这一步。

### 动态工具：执行保持内联

eve 的打包器转换只有在动态工具的 `execute` 函数位于解析器主体内联位置时，
才会将其注册为持久步骤函数。由工厂构建的工具映射（`return myTools()`）能够通过类型检查，
并且在新会话中正常工作，但在任何恢复的会话中都会失败，并显示
`references step function "..." which is not registered`。因此，每个
`agent/tools/*.ts` 动态文件都会在单个 `turn.started` 解析器中以内联方式定义其工具。

## 计划

**Chat-sdk 频道的目标是来自计划的 provider-native `threadId`。**
`to(photon, target).send(...)` 接收 `{ adapterName: 'imessage', threadId }`，
而不是会话句柄。对于直接聊天，该 id 可以推导出来，无需捕获：
Spectrum 直接聊天的 guid 是 `any;-;<address>`，因此线程是
`imessage:any;-;<phone>`。完整格式中可选的 `~<phone>` 后缀用于选择发送线路；
由于 Photon 项目目前只有一个号码，因此无关紧要。

**Vercel 会以 UTC 评估计划 cron。** `0 5 * * *` 在夏季（BST）会于伦敦时间
06:00 触发，在冬季（GMT）则变为 05:00。`eve dev` 永远不会触发 cron；
`POST /eve/v1/dev/schedules/digest` 可在本地触发一次。

**上游同步和自审计划会在没有审批卡的情况下将推送功能分支转换为 PR。**
该推送不会产生实际影响：它只会创建一个分支，`validatePushBranch`
会拒绝 `main`/`master`，而引用该分支的草稿 PR 会携带审批卡。
计划轮次的身份是 `eve:app`，而不是维护者，因此
`github__createPullRequest` 仍会向线程发布审批卡。

## AI 网关

**`sort: 'cost'` 优于硬编码的提供商顺序。** 路由请求落到了
$0.20/$0.40 的部署上，而更便宜的 1M 上下文部署也能提供同一个模型。一轮基于事实的对话从 $0.084 降至 $0.006。排序会随着部署和促销活动的变化持续遵循价格。

**`GET /v1/models` 返回真实的费率表**，包括 `input_cache_read`。
根据它重建一次观测到的对话后，其结果与 eve 报告的 `costUsd` 精确到小数点后四位，这正是发现超支的方式。

**报告中的 `group_by: tag` 会针对每个标签值返回一行。** 对于限定为
`evi:env:*` 的结果，它会返回环境总计行，以及每个表面对应的一行
`evi:surface:*`，每行都包含费用、token 和 `request_count` 列，因此只需再调用两次，
即可获得表面细分和按模型划分的构成（`group_by: model`）。成本监控技能会读取这两者；
表面集合必须从这些行中获取，绝不能自行假定。

## github-tools

**`maintainer` 预设附带的 gist 工具通过 Connect 时始终返回 403**——
Gists API 会拒绝安装令牌——此外还包括仓库创建和合并功能。

**`updateIssue` 还会设置 `state`**，因此自动批准它也会授予
`closeIssue`，因为提供 `state` 就会关闭 issue。应根据输入进行限制，而不是根据工具名称。

**`*Context` 工具可以减少往返次数。** `getIssueContext` 一次调用即可返回 issue、
其标签以及最近的评论。

## Vercel Connect

**连接器类型不可互换。** Linear 通道的类型是 `Linear`
（由代理应用加 Webhook 管理）；Linear MCP 的类型是 `OAuth`。`eve add
linear` 会分别配置一个 — 这是一个命令，而不是一个连接器。

**当连接器无法生成应用令牌时，应用范围的身份验证会静默失败。**
由于应用范围的身份验证是非交互式的，eve 永远不会发出质询：
`connection_search` 会成功，并报告 `needsAuthorization: true`，但没有任何
人可以批准，在每一轮中都是如此。用户范围的身份验证至少会通过
`principal_required` 明确失败。

**配置错误的 OAuth 连接不会降级，而是会破坏整个运行过程。**
在 EVL-213 中，Linear MCP 连接连带导致所有 GitHub 工具都不可用：五次
调用全部抛出 `Cannot read properties of undefined (reading 'toLowerCase')`，
错误源自
`@vercel/connect/dist/eve/provision-oauth-connector.js` 中的
`isProvisionableConnectorUid`。本地评估从未发现这一问题，因为没有 OIDC 令牌时，
`provisionEveOAuthConnector` 会提前返回；而在生产环境中它会运行。在 Connect
能够生成令牌之前，该连接会被移除 — 假设代理在没有该连接的情况下直接作答是错误的。

**CLI 中的 `vercel connect token` 无法证明应用范围的身份验证有效** — 它
通过你自己的 Vercel 身份进行解析，也就是用户范围的路径。

## 遥测

**代理的遥测 MCP 使用其 Vercel OIDC 令牌进行身份验证，而不是共享密码。**连接会发送 `process.env.VERCEL_OIDC_TOKEN`（与 turbo 远程缓存工具使用的令牌相同）；遥测应用会根据 Vercel 的团队 JWKS 对其进行验证，并且仅信任 `evi` 项目的生产环境（`apps/telemetry/server/utils/vercel-oidc.ts`）。本地没有 OIDC 令牌，而仪表板采用软身份验证，因此无密码的本地仪表板会保持打开状态。如果 `evi` 项目的 OIDC issuer 模式发生变化，`vercel-oidc.ts` 中的常量也会随之调整。

## evlog

**文件系统写入端既没有防护其 `mkdir`，也没有防护其 `appendFile`。** 在 Vercel
上，`/tmp` 之外的所有位置都是只读的，因此将其附加到那里会在每轮抛出一次异常，并写入无人能够读取的事件。

必须显式设置 `environment`，否则宽泛事件会将本地流量和评估流量都报告为
`development`，而支出标签会将两者区分开来。现在两者都会读取
`agent/lib/environment.ts`。

## MCP 通道

外部工具（Raycast AI、Claude Code、Cursor）通过带有
`Authorization: Bearer $EVI_MCP_TOKEN` 的 `POST /eve/v1/mcp` 访问 Evi：这是一个在
`mcp:hugo` 主体下运行真实会话的单一 `evi`
工具，仅在设置了该令牌环境变量期间受信任为维护者。`initialize` 返回的
`mcp-session-id` 用于标识会话，因此一次 Raycast 聊天对应一个 Evi 会话。
设置方法：生成一个令牌（`openssl rand -hex 32`），在项目中设置
`EVI_MCP_TOKEN`，然后在客户端中添加一个指向生产 URL 的 HTTP MCP 服务器，并配置
Authorization 标头。更换环境变量即可轮换令牌。这里特意没有 OAuth AS：这是单用户界面，使用静态 bearer 是合适的方案。

## 待处理

- 每个工具的输入令牌归因。`ai.tools[]` 记录了名称、耗时和成功与否，但没有记录每个结果增加了多少上下文；`docs__list-pages` 约占一次基于依据的交互输入的 85%，而这是通过手动差异对比才确认的。
- 事件中的 `ai.provider`。系统记录了网关标识，但没有记录实际提供服务的部署。
- 工具结果中的 GitHub 速率限制标头。对于一个即将开始大量运行 Webhook 的代理来说，这通常是最先、也最悄无声息地出问题的部分。
- 提供一个 `toTelemetry(output)`，作为 `toModelOutput` 的镜像，这样工具就可以携带诊断信息，而不会消耗上下文令牌。
