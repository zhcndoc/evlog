# Surface：文档页面

`apps/docs/content/`。Docus + MDC。在修改 `apps/docs/` 下的任何内容（包括 prose）之前，请先阅读 `apps/docs/AGENTS.md`：其中的 MDC 规则适用于内容文件，而不仅仅是组件。

## 读者不欠你任何东西

他们可能是通过搜索或其他页面中的链接来到这里的，正处于任务进行中，只带着一个问题。他们会阅读前两句话，浏览标题，看一段代码块，然后要么复制粘贴，要么直接离开。

## 结构

```
frontmatter        title, description, navigation.icon, links[]
opening            2-4 sentences: the situation, then what this page gives them
callout (optional) the exception a portion of readers hit immediately
prompt (optional)  the agent-runnable version of this page's task
sections           each one a heading that names what the reader achieves
next               a link out, on the thing they will need after this
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

## 集成页面遵循相同的契约

每个框架集成都必须提供 `evlog()`、`useLogger()`、`log.fork()` 和完整的 `BaseEvlogOptions` 接口，同时提供框架原生的访问器。只记录原生访问器的框架页面是不完整的，而只记录 `useLogger()` 则遗漏了符合惯例的路径。`evlog/workers` 是有文档记录的例外：它没有 `useLogger()`，logger 会作为 handler 的第四个参数传入。

## 代码块

- 标注文件名：` ```typescript [server/api/checkout.post.ts] `
- 当相同任务因框架或运行时而有所差异时，使用 `::code-group`
- import 必须准确且公开：`evlog`、`evlog/toolkit`、`evlog/http`。绝不能使用 `evlog/shared`，也绝不能使用 `evlog/browser`
- 示例必须能够运行。如果无法验证，请在发布页面前对照 `packages/evlog/src` 或 `examples/` 进行验证

## 动画组件

`EnricherChain`、`DrainFanOut`、`StreamBus` 及其他类似组件必须遵循 `apps/docs/AGENTS.md` 中的严格规则：固定外部尺寸、预先分配每个插槽、使用 `useTimedSequence`，并遵循 reduced-motion。内容审查绝不能新增或编辑这些组件；这是组件变更，需要单独进行评审。
