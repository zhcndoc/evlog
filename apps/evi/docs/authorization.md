# GitHub 频道上的授权

设计说明分为两部分。当前运行的是主体门控（`agent/lib/trust.ts` 中的
`isMaintainer`，由 `MAINTAINER_PRINCIPALS` 支持）、GitHub 扩展中的按工具
`requireApproval` 映射（`agent/extensions/github.ts`），以及
`agent/lib/github/label-approval.ts` 中的 `writePolicy`：它会自动批准维护者，询问其他人，并直接拒绝自主回合。本文其余内容建立在 `tier` / `threadTier` 属性之上，这部分仍是提案。Evi 仍限制为单个用户（`onComment` 会拒绝除 `hugorcd` 之外的所有人），解除该限制前必须先加入层级属性。它不是自主 hook 的前置条件：`onIssue` 已接入，`writePolicy` 会覆盖这些回合。

## 此处的批准并不是授权控制

Evi 具备维护者工具权限面，而 GitHub 扩展会通过 `requireApproval` 中自己的谓词处理几乎所有写入。只有被省略的 `closeIssue` 和 `createPullRequestReview` 会回退到 SDK 的 `always()` 默认值。在 Slack 或 Web 上，这是真正的控制措施。
但在 GitHub 上并非如此，原因有三，而且会相互叠加：

1. **不存在批准卡片。** 根据 eve 的 GitHub channel 文档，`input.requested` 事件“会以评论提示的形式发布，而用户的回复评论会映射回待处理的输入请求。”它就是一条评论。
2. **谁先回复，谁就回答。** 上游存在绑定机制：eve 会在待处理请求中记录请求者的 auth，并导出 `ApprovalResponsePolicy`，由它决定回复者能否完成调用。当前部署没有配置该策略，因此攻击者可以在 GitHub 上批准自己的写入操作。
3. **自主运行的交互轮次无人可询问。** 频道已经接入 `onIssue`，其处理方式是直接拒绝而不是显示卡片：`writePolicy` 会拒绝除标签和分流工作之外的所有自主写入，因为审批请求会永远停留在没有人批准的状态。

批准是一种适用于受信任的一对一频道的交互模式。在公开线程中，它无法确认任何事情。这里需要的是授权：由服务器端根据执行者无法自行选择的身份来决定。

## 在调度时决定，而不是在工具中决定

`onComment` 运行在 GitHub 已签名的 webhook 上，此时任何模型都尚未创建，并且它可能是异步的。`defaultGitHubAuth(ctx)` 已将执行者映射为 `principalId: "github:<sender.id>"`（使用数字 id，因此登录名重命名或重新注册不会改变该身份），同时设置 `principalType: "user"`（机器人则为 `"service"`），并将仓库元数据放入 `attributes`。

因此：在那里解析层级，将其写入 `auth.attributes`，让下游所有逻辑读取它。

```ts
// agent/channels/github.ts
const ADMIN_IDS = new Set([/* 数字形式的 GitHub 用户 id */])

async function tierFor(ctx: GitHubInboundContext): Promise<'admin' | 'public'> {
  if (ADMIN_IDS.has(ctx.sender.id)) return 'admin'
  // 询问 GitHub 谁可以推送。调用失败时默认关闭权限。
  const permission = await collaboratorPermission(ctx).catch(() => null)
  return permission === 'admin' || permission === 'write' ? 'admin' : 'public'
}
```

特意保留这两条路径：硬编码集合可以在 API 调用失败或触发速率限制时继续工作，
而权限查询意味着只要在 GitHub 上添加维护者即可——不需要有人记得编辑此文件。

**按执行者 id 缓存查询结果，绝不要按会话缓存。** GitHub 线程是一个会话，
不同的人可以在其中发表评论，因此缓存在会话中的层级会被交给下一个发表评论的人。
应以 `ctx.sender.id` 为键，并在执行者发生变化时重新解析；该 id 是数字且不可变，
因此是安全的缓存键。否则，维护者的操作会为同一线程中之后的所有评论者提升层级。

然后将层级合并到钩子返回的 auth 中：

```ts
const auth = defaultGitHubAuth(ctx)
return { auth: { ...auth, attributes: { ...auth.attributes, tier } } }
```

## 使用审批谓词强制执行，并将其作为策略

`requireApproval` 接受一个按工具设置的谓词，该谓词接收
`{ session, toolName, toolInput, approvedTools, callId }`。其中两个返回值无需人工介入即可完成解析：

- `'not-applicable'` — 立即运行，不弹出提示
- `{ type: 'denied', reason }` — 在服务端拒绝，任何评论都无法推翻

这已经足以构建完整的门控机制：

```ts
const tier = (s) => s.auth.current?.attributes?.tier
const trusted = (s) => s.auth.current?.attributes?.threadTier === 'admin'
const DENY = { type: 'denied', reason: 'Only repository maintainers can ask Evi to do that.' }

requireApproval: {
  // 可逆操作，因此不弹出提示——但仅限于维护者创建的线程。参见
  // “为什么 admin 不能简单地被允许执行所有操作”，了解来源为何重要。
  addLabels: ({ session }) =>
    tier(session) !== 'admin' ? DENY : trusted(session) ? 'not-applicable' : 'user-approval',
  createPullRequest: ({ session }) => tier(session) === 'admin' ? 'user-approval' : DENY,
  // …
}
```

这意味着 `onComment` 会记录两个值，而不是一个：调用者的层级，以及
创建该线程的用户的层级。后者正是阻止维护者在攻击者的问题中提及 Evi 后无阻碍执行操作的关键。

`toolName` 会带有命名空间（`github__addLabels`），因此如果你编写的是单个捕获全部情况的谓词，而不是按工具分别设置条目，请使用 `.endsWith()`
进行匹配，而不要使用 `===`。

**拒绝公共层级的所有写操作，并不能阻止 Evi 回答这些请求。** 她的回复由频道发布，而不是由工具发布；`addIssueComment` 仅用于在当前线程以外的某处发表评论。公共用户仍然可以获得完整且有依据的回答。

## 管理员无需询问即可执行的操作

仅限可逆操作，且仅限于维护者发起的线程。在其他任何线程中，
出于以下原因，此列表中的操作仍需获得批准：

`addIssueComment`, `updateIssueComment`, `addPullRequestComment`,
`updatePullRequestComment`, `addIssueReaction`, `addCommentReaction`,
`addLabels`, `removeLabel`, `addAssignees`, `removeAssignees`,
`addDiscussionComment`.

`requestReviewers` 在所有类型的运行中都无需批准，而不仅限于管理员：
请求审查是可逆的，也不会授予任何权限，并且指令要求在每个非草稿 PR
中执行此操作。

其他所有操作即使对于管理员也仍需获得实际批准：`createIssue`、`closeIssue`、
`deleteIssueComment`、`deletePullRequestComment`、`createPullRequest`、
`updatePullRequest`、`createPullRequestReview`。代码本身不会通过 API 移动：
它会通过 `git__push` 从沙盒发布，而该工具仅挂载在通过
`agent/lib/trust.ts` 中的 `canAccessAdminTools` 的会话上：维护者，以及会推送功能分支来交付 PR 的计划会话。它会对所有调用者拒绝 `main` 和 `master`。

发布相关的写入操作根本不在列表中：`AGENTS.md` 禁止代理创建发布版本，
因此工具集只提供读取这些内容的能力。

此外，“可逆”指的是仓库记录，而不是副作用。评论会触发
`issue_comment` 工作流并通知关注者；之后删除评论并不能撤销这些影响。
对于由该层级之外的人员发起的线程，应将其视为即使可逆操作列表也必须
经过批准的理由。

这个划分中有一个陷阱：**`updateIssue` 也会设置 `state`**，因此自动批准
它也就等于授予了 `closeIssue` 的权限，因为提供 `state` 就会关闭议题。
应根据输入而不是工具名称进行控制：

```ts
updateIssue: ({ session, toolInput }) => {
  if (tier(session) !== 'admin') return DENY
  return toolInput?.state === undefined ? 'not-applicable' : 'user-approval'
},
```

## 为什么管理员并不是被简单地允许执行所有操作

一旦 Evi 拥有写入工具，并且会读取由其他人编写的问题描述、评论和源代码，那么提示注入就只是一个精心构造的问题描述。

层级门槛阻止攻击者提升*自身权限*。但它无法阻止真正关键的情况：**维护者在攻击者创建的问题中提及 Evi。** 此时，会话在读取攻击者控制的文本时以管理员层级运行，而权限提升来自维护者，而不是攻击者。这就是为什么“管理员意味着没有任何阻力”站不住脚，也是为什么自动批准列表只覆盖可逆操作。一次成功注入的影响范围应该是某人可以删除的一条评论，而绝不能是强制推送或发布版本。

等有了真实流量后，值得重新考虑：标记内容来源（该讨论串是否由层级之外的人开启？），并无论是谁发起请求，都降低这些讨论串的权限上限。

## 自主回合使用自己的身份主体

`onIssue` 会使用 `defaultGitHubAuth(ctx)` 调度，然后覆盖其投影：
`principalId` 变为 `AUTONOMOUS_GITHUB_PRINCIPAL`（`github:evlogai`），
`principalType` 变为 `"service"`（`agent/channels/github.ts`）。分流回合以机器人身份运行，而不是 issue 创建者的身份。`onPullRequest` 和 `onCheckSuite` 尚未接入；接入时也需要相同的覆盖，否则它们会按照上述逻辑，以 issue 创建者或提交推送者的层级运行。

该主体可以运行什么仍是开放问题。当前门控采用保守答案：`writePolicy` 会拒绝自主回合路由的每项写入，只有扩展按工具谓词允许的狭窄集合例外，包括创建和应用标签、创建文档缺口 issue 以及分配维护者。扩展权限时，应根据任务选择层级，而不是继承触发 webhook 的人的层级，并保持其*低于*管理员。没有人在监视，也没有人可以批准操作，因此它只能访问适合无人值守运行的工具。

## @github-tools/eve-extension 中的缺口

上面的所有机制都在审批层执行，这意味着每个工具仍然存在于每个调用者的上下文中，包括 schema；一次被拒绝的调用还会浪费模型的一步，让它得知该调用被拒绝。

真正干净的解决方案是让工具界面因调用者而异。该扩展已经在 `step.started` 上的动态解析器中解析工具，只是忽略了 eve 传递给它的上下文。如果 `include` / `exclude` / `preset` 能够接受一个基于该上下文的解析器以及静态值，那么代理就可以向管理员提供完整的工具界面，而向其他人提供只读界面，并匹配相应的 schema。值得向上游提议——这对任何公共仓库中的代理都有用，而不仅仅是这个代理。


## 仍待解决

- 中间层级（组织成员、曾经的贡献者）是否能获得任何权限，还是仅有
  admin/public 就足够。目前先从两个层级开始，之后添加第三个层级很容易。
- 速率限制是另一个尚未解决的问题：它需要一个生命周期超出单次会话的存储，
  而 `defineState` 并不具备这一点。
- 目前还没有任何评测覆盖层级门控。`safety/write-requires-approval` 已经
  覆盖了审批暂存，但没有断言公共调用者会被拒绝，也没有断言审批来自触发该轮次的维护者，
  而不是第一个回复的人。
