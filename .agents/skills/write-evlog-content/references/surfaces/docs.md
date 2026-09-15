# Surface：文档页面

`apps/docs/content/`。Docus + MDC。在修改 `apps/docs/` 下的任何内容（包括 prose）之前，请先阅读 `apps/docs/AGENTS.md`：其中的 MDC 规则适用于内容文件，而不仅仅是组件。

## 读者不欠你任何东西

他们可能是通过搜索或其他页面中的链接来到这里的，正处于任务进行中，只带着一个问题。他们会阅读前两句话，浏览标题，看一段代码块，然后要么复制粘贴，要么直接离开。

## 结构

```
frontmatter        标题、描述、navigation.icon、links[]
opening            2-4 句话：先说明情境，然后说明本页面能提供什么
callout (optional) 部分读者一开始就会遇到的例外情况
prompt (optional)  本页面任务的可由 agent 运行的版本
sections           每个 section 都是一个说明读者将实现什么的标题
next               一个指向他们接下来需要内容的链接
```

- `title` 是侧边栏中显示的内容。简短，不要使用营销话术
- `description` 用一句话给出答案。这是搜索摘要和 LLM 总结。参见 D-02
- frontmatter 中的 `links:` 是两个或三个相关页面，使用 `color: neutral` 和 `variant: subtle`，以匹配网站的其余部分

## 应归入哪个 section 目录

| 目录 | 读者身份 | 页面应提供给他们的内容 |
| --- | --- | --- |
| `1.start/` | 正在决定是否采用 | 坦诚说明成本和收益 |
| `2.learn/` | 正在学习一个概念 | 先展示错误的形式，再展示正确的形式 |
| `3.cli/` | 正在运行一个命令 | flags、退出码，以及 CI 如何处理它 |
| `4.integrate/` | 正在接入自己的技术栈 | 确切的安装方式和框架原生的访问器 |
| `5.use-cases/` | 正在识别自己的问题 | 一个端到端的具体场景 |
| `6.extend/` | 正在基于原语构建内容 | 契约及其保证 |
| `7.reference/` | 正在查阅事实 | 表格、默认值，不要进行说服 |

页面位于错误的目录中属于结构性问题，而不是措辞问题。

## 集成页面需遵循其层级的契约

契约取决于集成的构建方式，因此在指出页面不完整之前，请先检查其层级：

- 基于 `defineFrameworkIntegration` 构建的 first-class integrations（elysia、express、fastify、hono、next、nestjs、orpc、react-router、sveltekit、workers）采用完整的 `BaseEvlogOptions` 接口，并提供与请求绑定的 logger，但入口自身的访问器名称有所不同：orpc 使用 `evlog()` 和 `withEvlog()`，elysia、express、fastify、hono、react-router 和 sveltekit 使用 `evlog()`，next 使用 `createEvlog()` 和 `evlogMiddleware()`，nestjs 使用 `EvlogModule`，workers 使用 `withEvlog()` 和 `createWorkersLogger()`。只记录框架原生访问器的框架页面是不完整的，而只记录 `useLogger()` 则遗漏了惯用路径。
- `log.fork()` 在请求作用域由 `AsyncLocalStorage` 支持的地方接入：除了 workers 之外的每个 first-class integration 都是如此；workers 必须避免使用 `node:async_hooks`。
- Nuxt 和 Nitro 绑定于事件：使用 `useLogger(event)`，不使用 `log.fork()`。在那里记录 `log.fork()` 会声称存在一个实际不存在的 API。
- Astro、AWS Lambda 和 standalone 基于核心 API（`initLogger`、`createLogger`、`createRequestLogger`）提供指南级支持：没有 `evlog()`，没有 `useLogger()`，也没有 `log.fork()`。不要将它们添加到这些页面中。
- `evlog/workers` 将 logger 作为 handler 的第四个参数提供，而不是通过 `useLogger()` 提供。

## 代码块

- 标注文件名：` ```typescript [server/api/checkout.post.ts] `
- 当相同任务因框架或运行时而有所差异时，使用 `::code-group`
- import 必须准确且公开：`evlog`、`evlog/toolkit`、`evlog/http`。绝不能使用 `evlog/shared`，也绝不能使用 `evlog/browser`
- 示例必须能够运行。如果无法验证，请在发布页面前对照 `packages/evlog/src` 或 `examples/` 进行验证

## 动画组件

`EnricherChain`、`DrainFanOut`、`StreamBus` 及其他类似组件必须遵循 `apps/docs/AGENTS.md` 中的严格规则：固定外部尺寸、预先分配每个插槽、使用 `useTimedSequence`，并遵循 reduced-motion。内容审查绝不能新增或编辑这些组件；这是组件变更，需要单独进行评审。
