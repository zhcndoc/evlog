# 术语

evlog 为其各个部分所使用的名称。使用其他人的词来称呼其中任何一个，都会让读者付出双倍代价：他们先学会一个 API 不使用的术语，然后又无法在文档中找到它。

规则 ID：`U-15`。扫描器从 `scripts/content-lint/lib/corpus.mjs` 中提出候选项，该文件包含相同的表格。

| evlog 的说法 | 不要使用 | 原因 |
| --- | --- | --- |
| **drain** | sink、exporter | drain 是事件离开进程的地方。`exporter` 是 OpenTelemetry 的说法，并且自带其模型。相比 pino 的 `transport`，也应优先使用 drain，但扫描器不会检查这一项：见下方的说明。 |
| **enricher** | enrichment plugin、context provider、middleware | enricher 会在事件发出前向其中添加字段。称其为 middleware 会把它放进请求链中，但它并不在那里。 |
| **error catalog** | error registry、error map、error dictionary | `defineErrorCatalog` 才是 API。其他任何说法都是读者无法通过 grep 找到的术语。 |
| **`log.fork()`** | child logger、sub-logger | pino 的 `child()` 会继承绑定项。`fork()` 会分支出已累积的上下文，并且可以被丢弃。这一区别正是该功能。 |
| **wide event** | wide log、fat event、structured log | 每个工作单元对应一个事件，其中包含该工作触及的每个字段。`structured log` 是类别，而不是这里所说的对象。 |
| **pipeline** | chain、middleware stack | `createDrainPipeline` 会组合 drains。 |
| **evlog/toolkit** | evlog/shared | `evlog/shared` 不是入口点。`T-15`，始终是 critical。 |
| **evlog/http** | evlog/browser | 已弃用的入口点。`T-15`。 |

## 成对项

描述其他工具的句子会使用该工具的词汇，而且必须如此。“pino writes through a transport that runs in a worker thread”是正确的，扫描器会放过它：检查会跳过任何提及替代工具的句子。

剩下的则是使用其他工具的词来描述 evlog 的句子。“Register the sink”就是要报告的问题，无论它出现在哪个页面。

## 当确实缺少该词时

有时，读者使用的词在 evlog 中没有对应说法，而页面需要搭建一座桥梁。用读者的词写一次这座桥，然后使用 evlog 的说法：

> A drain is where events leave the process. If you come from pino, it sits where a transport sat.

每个页面只需要一座桥。不断进行翻译的页面，永远不会教会读者这个术语。

## 为什么不扫描 `transport`

它既是 pino 对目标位置的称呼，也是表示移动字节的普通英语词，而在此语料库中，每次出现都属于后者：HTTP transport、提到 pino 的迁移段落、HyperDX 自己的 exporter。十三个问题，十三个都合规。

这项指导仍然有效，当某个句子把 evlog 的 drain 称为 transport 时，审阅者仍应指出这一点。扫描器无法仅凭一行内容区分两者，而一个只会产生自身误报的提示，会教会审阅者略过列表。
