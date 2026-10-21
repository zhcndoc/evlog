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

**技能发现会跳过符号链接。**`discover/project-source` 会把符号链接归类为 `other` 并视为缺失，因此链接到 `skills/<x>` 的 `agent/skills/<x>` 不会被公布。静态 `defineSkill` 模块会在编译时求值，因此 `agent/skills/<x>.ts` 通过 `agent/lib/published-skill.ts` 读取已发布包；eve 从 `apps/evi` 运行，该目录用于确定读取路径。

**GitHub 频道不会投影元数据。**`githubChannel()` 调用 `defineChannel` 时没有提供 `metadata` 投影，也没有提供设置投影的选项；continuation token 只携带 `repositoryId`。因此，GitHub 回合中的动态工具和指令片段读到的 `ctx.channel.metadata` 为空，讨论串的 `owner` / `repo` 只会通过 `channel.state` 传给频道自己的事件处理器。这也是升级流程会跟随讨论串仓库（`repositoryOf(state)`），而 `git__checkout`、`git__push` 和 `github__*` 默认值使用 `EVI_REPOSITORY` 并要求显式指定其他仓库的原因。上游需要为 GitHub 频道添加 `{ owner, repo, installationId }` 元数据投影；完成后，`repositoryOf` 可通过 `isChannel` 从 `ctx.channel` 取值，无需这些显式输入。

**GitHub App 令牌按安装实例签发，每次只访问一个账号。**Connect 根据 `github_app_installation` 授权详情选择安装实例：优先使用显式的 `installationId`，然后使用 `org`（或限定仓库的 owner），最后才使用连接器默认值。`lib/github/credentials.ts` 中的 `installationParams` 会指定仓库 owner，因此安装该 App 的账号无需额外登记；`repositories` 会将 git 工具令牌限制到一个仓库。找不到安装实例时会抛出 `ConnectorInstallationRequiredError`，不会回退到其他账号。此选择顺序已在 Connect API 的 vercel/api#93139 中实现；此前会忽略 `org`，并对所有账号使用默认安装实例。`github__*` 扩展和频道只使用主账号的凭据；操作其他账号仓库时，扩展的写入工具（首先是 `createPullRequest`）会返回 403。上游还需要为 `@github-tools/eve-extension` 添加按调用解析 `installationId` 的能力。

**`disableTool()` 是静态的。**没有按会话移除内置工具的方法，因此某个工具在某个通道上
没有用处时，仍会占用该通道的上下文。

**iMessage 附件永远不会到达模型。**Photon 适配器的聊天映射会保留 name/mimeType/size，而 eve 的 `messageToUserContent` 只读取 `attachment.url`，但 Photon 从未提供该属性。在已连接的（pump）路径中，带有经过身份验证的 `read()` 的已解析内容节点会保留在 `message.raw.content` 上；在 webhook 路径中，`raw` 是投递 JSON，其中从不包含这些节点。通过 `adapter.fetchMessage()` 重新解析可以恢复它们，但这是 eve 需要完成的工作：上游修复方案是使用 chat-sdk 的 `data`/`fetchData` 附件契约。在此之前，图片会通过 Slack 发送。


**会话限制默认允许 4000 万输入 token，且不限制输出 token**，按当前价格计算，一个失控的会话可能花费近 8 美元。Evi 保留 4000 万输入 token 上限，并将输出上限设为 100 万。输出 token 包含推理 token；每次模型步骤中，eve 会把父级剩余窗口平均分给子任务。因此，一个内容任务跨多个审阅器累计消耗约 46 万推理 token 时，25 万上限会反复中止任务：子任务只分到约 1.4 万 token，并向一个无人查看的线程请求批准。批准后会获得同样大小的新窗口，因此上限决定的是提示频率，而非总支出。




**推理级别是按模型划分的。**`GET /v1/models` 会公开 `reasoning_options`；DeepSeek V4 Flash 只声明了 `high` 和 `xhigh`。设置 `low` 或 `medium` 不会报错，而是会产生异常且非单调的推理量。

**会话限制默认为 4000 万个输入 token，且没有输出上限**，按当前价格计算，
一次失控的会话费用可能接近 8 美元。

**评估运行会泄漏会话。**`t.succeeded()` 会接受一个健康的开放会话，因此每次运行都会
留下一个针对已失效开发服务器、排队等待执行的 `sessionTimeoutWorkflow`。后续运行会输出
越来越多的 `[world-local] Queue delivery failed`。排队的工作会在每次运行中增长，并掩盖
输出中的真实失败。

**从未观察到 `sessionEvent` 触发。**它会在会话完成时发出，而评估运行器从未到达
会话完成这一步。

### 动态工具：执行保持内联

eve 的打包器转换只有在动态工具的 `execute` 函数以内联形式位于解析器主体中时，才会将其注册为持久步骤函数。由工厂构建的工具映射（`return myTools()`）可以通过类型检查，并能在新会话中工作，但在任何恢复的会话中都会失败，并显示 `references step function "..." which is not registered`。隐式箭头返回（`() => ({ ... })`）也会以相同方式使转换失效；解析器需要使用带代码块主体且包含显式 `return` 的形式。因此，每个 `agent/tools/*.ts` 动态文件都会在单个带代码块主体的 `turn.started` 解析器中以内联方式定义其工具。

## 计划

**计划运行会在主仓库中推送功能分支并创建 PR，且不会显示审批卡片。**
`validatePushBranch` 会拒绝 `main`/`master`。计划轮次使用 `eve:app` 主体，而不是维护者。
`createPullRequestPolicy` 会跳过针对 `EVI_REPOSITORY` 的就绪 PR 和草稿 PR 的审批（包括省略 owner/repo 的默认情况）。其他仓库仍需要审批。其他写入门控保持不变，工具界面中不包含合并操作。

**使用 `initialMessage` 发送到 Slack 的计划会拥有自己的线程和会话。**`to(slack, { channelId, initialMessage }).send(...)` 会先发布卡片，将会话锚定到该消息，并在其下创建该轮对话。如果没有 `initialMessage`（并且没有 `threadTs`），第一条代理消息会成为锚点，这会导致在任何上下文出现之前，频道中先出现一条孤立回复。`threadTs` 和 `initialMessage` 互斥。发送到现有的 `threadTs` 会恢复该线程的会话，这正是旧版 iMessage 投递对每次运行所做的事情：一个长期存在的会话，其中还包括过时的上下文和待处理请求，因此过去每个任务都带有结尾段落。

**Slack 主体是 `slack:<team>:<member>`。**`defaultSlackAuth` 根据事件的 `team_id` 和执行者的用户 id 生成该主体，而 `trust.ts` 信任 `EVI_SLACK_TEAM_ID` 的每个真人主体，而不是某一个成员：该工作区是私有的，只有 Hugo 可以安装连接器或邀请成员加入，因此工作区本身就是允许列表。Evi 所有的线程中的回复需要连接器的触发器订阅带有 `channels:history` 的 `message.channels`（对于私有频道，还需要 `message.groups` 和 `groups:history`）；没有这些权限，只有提及和私信会到达代理。

**Vercel 会以 UTC 评估计划 cron。** `0 5 * * *` 在夏季（BST）会于伦敦时间
06:00 触发，在冬季（GMT）则变为 05:00。`eve dev` 永远不会触发 cron；
`POST /eve/v1/dev/schedules/digest` 可在本地触发一次。

**报告中的 `group_by: tag` 会按每个标签值返回一行。** 限定为 `evi:env:*` 时，结果包括环境总计行、每个表面一行 `evi:surface:*`，以及每个 agent 一行 `evi:agent:*`；每行都包含费用、token 和 `request_count` 列。因此，只需再调用两次即可获得表面和 agent 明细，以及按模型划分的构成（`group_by: model`）。不同维度的行会相互重叠：只能在同一前缀内求和，不能跨前缀求和。成本监控 skill 会读取两类明细；表面和 agent 集合必须从返回行中获取，不能自行假定。报告不支持 session 维度：`group_by` 会拒绝 `session_id`，而 `session_id` 过滤器会被静默忽略。


## github-tools

**`maintainer` 预设附带的 gist 工具通过 Connect 时始终返回 403**——
Gists API 会拒绝安装令牌——此外还包括仓库创建和合并功能。

**`updateIssue` 还会设置 `state`**，因此自动批准它也会授予
`closeIssue`，因为提供 `state` 就会关闭 issue。应根据输入进行限制，而不是根据工具名称。

**`*Context` 工具可以减少往返次数。** `getIssueContext` 一次调用即可返回 issue、
其标签以及最近的评论。

## Vercel Connect

**连接器类型不可互换。**Linear 通道的类型是 `Linear`（由代理应用管理并使用 webhooks）；Linear MCP 的类型是 `OAuth`。`eve add linear` 会分别配置这两者：这是一个命令，而不是一个连接器。

**当连接器无法生成应用令牌时，应用范围的身份验证会静默失败。**
由于应用范围的身份验证是非交互式的，eve 永远不会发出质询：
`connection_search` 会成功，并报告 `needsAuthorization: true`，但没有任何
人可以批准，在每一轮中都是如此。用户范围的身份验证至少会通过
`principal_required` 明确失败。

**由配置错误的 OAuth 连接导致的整个运行崩溃已在 `@vercel/connect` 2.0.0 中修复。**在 EVL-213 中，Linear MCP 连接连带关闭了所有 GitHub 工具：五次调用全部抛出 `Cannot read properties of undefined (reading 'toLowerCase')`，异常来自 `@vercel/connect/dist/eve/provision-oauth-connector.js` 中的 `isProvisionableConnectorUid`。这是主动配置路径：除非设置 `autoProvision: false`，否则 0.8.x 会在每次令牌调用之前运行 `provisionEveOAuthConnector`。2.0.0 将配置改为可选并由失败触发（`autoProvision: true`，且仅在连接器缺失或项目未链接错误之后触发），而 Evi 从不选择启用它，因此不会触发该崩溃。实际情况仍然成立：无法生成应用令牌的连接器对于需要它的工具仍然会失败，因此在 Connect 能够生成令牌之前应移除该连接；假定代理只是不使用该连接器也能回答是错误的。

**CLI 中的 `vercel connect token` 无法证明应用范围身份验证有效**：它通过你自己的 Vercel 身份解析，使用的是用户范围路径。

## 遥测

**代理的遥测 MCP 使用其 Vercel OIDC 令牌进行身份验证，而不是共享密码。**连接会发送 `process.env.VERCEL_OIDC_TOKEN`（与 turbo 远程缓存工具使用的令牌相同）；遥测应用会根据 Vercel 的团队 JWKS 对其进行验证，并且仅信任 `evi` 项目的生产环境（`apps/telemetry/server/utils/vercel-oidc.ts`）。本地没有 OIDC 令牌，而仪表板采用软身份验证，因此无密码的本地仪表板会保持打开状态。如果 `evi` 项目的 OIDC issuer 模式发生变化，`vercel-oidc.ts` 中的常量也会随之调整。

## evlog

**文件系统 drain 会在目录只读时自动禁用。**如果写入因 `EROFS`、`EACCES` 或
`EPERM` 失败，目录会被标记为不可写；发出一次警告后，drain 会在该进程的剩余时间内禁用。因此在 Vercel 上接入它是安全的，但事件不会有去处：只有临时目录可写，而且不会跨实例保留。

必须显式设置 `environment`，否则宽泛事件会将本地流量和评估流量都报告为
`development`，而支出标签会将两者区分开来。现在两者都会读取
`agent/lib/environment.ts`。

## MCP 通道

外部工具（Raycast AI、Claude Code、Cursor）通过 `/eve/v1/mcp` 访问 Evi，并使用 `Authorization: Bearer $EVI_MAINTAINER_TOKEN`，该端点由 eve 的原生 MCP 通道（`mcpChannel`）提供服务。客户端会获得持久调用工具——`agent_start`、`agent_get`、`agent_update`、`agent_cancel`：启动会立即返回调用 id，工具端通过轮询 `agent_get` 获取结果，而人工输入请求会以 `input_required` 的形式出现，不会让 HTTP 调用一直挂起。每个 `agent_start` 都是一个由 `mcp:hugo` 主体拥有的任务模式会话，只有在设置了 token 环境变量时才会被信任为维护者；调用之间不存在跨调用对话，因此请求必须携带自身的上下文。设置方法：生成 token（`openssl rand -hex 32`），在项目中设置 `EVI_MAINTAINER_TOKEN`，然后在客户端中添加一个 HTTP MCP 服务器，指向生产 URL，并设置 Authorization 标头。通过更改环境变量进行轮换。这里有意不使用 OAuth AS：这是单用户界面，静态 bearer 的规模正合适。

## 待处理

- `toTelemetry(output)` 作为 `toModelOutput` 的镜像，让工具可以携带不会消耗上下文 token 的诊断信息（由 EVL-509 跟踪；EVL-366 已关闭，但该能力尚未实现，因此保留此项）。
