# 通用规则

应用于每个 evlog 表面。每条规则都有一个用于 findings 的 id、一个严重级别和一组示例对照。

---

**U-01 · 读者是 `you`** · `standard`

规则：使用第二人称称呼读者，并让系统作为自身动词的主语。
错误：“Context can be accumulated over the lifetime of a request, and an event is emitted at the end.”
改进：“You accumulate context over the request. evlog emits one event when it ends.”
原因：被动语态隐藏了动作的执行者，而在日志库中，执行者是你还是框架集成，这正是关键所在。

---

**U-02 · 抽象概念永远不是执行者** · `standard`

规则：句子的主语应当是人、进程或系统中命名的部分，而不是质量、概念或收益。
错误：“Observability becomes achievable once structure is in place.”
改进：“Once every handler emits a wide event, you can query the field instead of grepping the line.”
原因：抽象主语会让句子在不指出发生了什么变化的情况下宣称取得了进展。

---

**U-03 · 已存在的行为使用现在时** · `standard`

规则：使用一般现在时描述已经发布的行为。只有确实尚未构建的内容才使用将来时。
错误：“The adapter will retry failed batches with exponential backoff.”
改进：“The adapter retries failed batches with exponential backoff.”
原因：对已发布行为使用将来时读起来像路线图，会让读者不确定今天能得到什么。

---

**U-04 · 每个断言都要说明机制、数字或页面** · `critical`

规则：关于行为或性能的陈述必须说明其成立依据，也就是机制、带有来源的测量数字，或指向演示该行为的页面的链接。
错误：“evlog is extremely fast and adds virtually no overhead.”
改进：“Emitting a wide event costs one object merge and one serialization at flush time. See [Performance](/reference/performance) for the bench numbers.”
原因：没有依据的断言是失去技术读者信任的最快方式，也是读者无法在不离开当前页面的情况下自行验证的内容。

---

**U-05 · 从读者的处境开始，而不是从主题开始** · `standard`

规则：第一句话描述读者所处的情况或正在承担的成本，之后再给出定义。
错误：“Sampling is a technique used to reduce the volume of telemetry data.”
改进：“Your log bill scales with traffic, and 98% of those events are successful requests nobody will read.”
原因：定义式开头要求读者先产生兴趣，却没有先给出让他们在意的理由。

---

**U-06 · 每句话只表达一个命题** · `standard`

规则：一句话只承载一个断言。如果后一半只是复述前一半，就删掉后一半。
错误：“The pipeline batches events before sending them, which means events are grouped together rather than sent one by one.”
改进：“The pipeline batches events before sending them.”
原因：复述是生成式文本中最常见的填充内容，因为两部分都正确，所以读者阅读时很容易让它混过去。

---

**U-07 · 只在确实存在不确定性时使用模糊措辞** · `critical`

规则：`often`、`typically`、`generally`、`in most cases`、`may` 只能用于确实会变化的内容，例如运行时、框架或用户配置。不要用于确定性行为。
错误：“Redaction generally masks emails before they reach a drain.”
改进：“Redaction masks emails before they reach a drain.” 或者，在确实存在变化时：“On Workers without `nodejs_als`, `useLogger()` is unavailable, so the integration passes the logger as the fourth argument instead.”
原因：在保证性行为上使用模糊措辞，会迫使读者防御性地重新实现这项保证。

---

**U-08 · 根据链接目标命名链接** · `standard`

规则：链接文本应当说明链接指向哪里。不要使用“点击这里”“查看文档”“此页面”“阅读更多”。
错误：“For more information about draining, see [here](/integrate/adapters/overview).”
改进：“See [drain adapters](/integrate/adapters/overview) for the full list.”
原因：读者会扫描链接文本，而不是按顺序阅读它。

---

**U-09 · 正文中不要使用装饰性标点或表情符号** · `standard`

规则：不要使用表情符号，不要使用感叹号，不要用粗体强调整句话。粗体用于标记读者之后还会再次查找的术语。
原因：到处都是的强调就等于什么都没有强调，而参考文档中的表情符号读起来像填充内容。

---

**U-10 · 代码示例可运行且保持最新** · `critical`

规则：导入必须能解析，符号必须存在于 `packages/evlog/src` 中，入口点必须是公开入口（`evlog/toolkit`，不能是 `evlog/shared`），示例必须能够针对当前 API 编译。
原因：读者复制示例后却无法运行，这会消耗的信任多于页面带来的信任。

---

**U-11 · 标题要说明该部分为读者完成了什么** · `standard`

规则：标题应当命名所回答的问题或所实现的事情，而不是信息量更少的名词标签。
错误：“## Configuration”
改进：“## Choose what reaches the drain”
原因：标题是读者真正会阅读的目录，而一页名词标签会迫使读者线性阅读。
例外：参考页面的标题可以是 API 符号。`## defineErrorCatalog` 就是正确的标题。

---

**U-12 · 比较必须准确描述替代方案** · `critical`

规则：提到 pino、winston、consola 或任何其他工具时，应当描述它今天实际执行的行为，并附上相关链接。不要拿对方已经修复的弱点进行比较。事实记录在 `references/landscape/` 中，每个工具对应一个文件。不在档案中的断言都未经验证，不能发布。
错误：“Unlike pino, evlog does not make you assemble transports by hand.”
改进：“pino writes through a transport you assemble ([transports](https://getpino.io/#/docs/transports)). evlog ships the adapter and the pipeline that batches and retries it.”
原因：一个不公平的比较就会让整页内容在了解另一款工具的读者眼中失去可信度，而这正是本页面要面向的读者。
注意：扫描器会对任何提到工具、但所在行没有数字和链接的比较句提出候选项。它无法判断断言是否错误，只能指出没有任何内容为其提供依据。

---

**U-13 · 说明成本** · `standard`

规则：如果某个功能存在代价，例如标志、依赖、运行时限制、需要维护的字段或性能权衡，页面应当在介绍该功能的旁边说明，而不是放在脚注中。
原因：承认代价能让页面其余内容更可信，而 evlog 的限制（Workers 上的 `nodejs_als`、drain 的异步边界）本来就是读者迟早会遇到的事情。

---

**U-14 · 不要使用 em dash 和 en dash** · `standard`

规则：任何语言的正文中都不要使用 `—` 和 `–`。复合词中的连字符可以使用，代码块中、逐字引用中以及两个数字之间也可以使用短横线，在数字范围中 en dash 表示范围时也可以使用（`~30–80 lines`）。
错误：“The drain batches events, then retries with backoff, before it gives up.” 写成 “The drain batches events — then retries with backoff — before it gives up.”
改进：“The drain batches events, retries with backoff, then gives up.”
原因：这是维护者对 evlog 表达风格的决定，也是最容易让人联想到机器生成文本的标点。每次出现都会生成一个 finding，不存在可以争论的密度阈值。

**替代方式**，按以下顺序尝试：

1. **逗号**，当从句继续当前句子时。“the integration path for oRPC v1, and it remains the entrypoint”
2. **句号**，当后半句表达独立想法时。两句短句胜过一句依赖连接的长句。
3. **冒号**，当后半句解释或列出前半句提到的内容时。
4. **不使用任何标点**，当 em dash 连接的是本来就不需要连接的两个部分时。删掉是有效的修复方式，也是唯一不会引入新痕迹的方式。

**绝不要使用分号。** 这种文体不使用分号。分号读起来像作者无法在逗号和句号之间做出选择，而用另一种不常见的标记替换原标记，只会让句子保持原有的僵硬感。如果替换后的标点会被读者注意到，那就不算修复。

**没有 codemod 会处理这条规则**，而且这个原因值得保留。我们曾在整个语料库中尝试用逗号替换成对的短横线：38 次替换中有 25 次把括号式列表变成了主语后面跟着四个裸名词的句子。“It finds every entry point, API handlers, pages that fetch, middleware, checks each one” 并不是修复方案，而扫描器也无法区分这样的片段和同位语。这里应该使用哪个标点需要人工阅读判断，因此每个短横线都会作为 finding 出现。
注意：语料库早于这条规则，大多数页面仍然包含这些标记。内容处理会移除所处理页面中的相关标记，但不会仅仅为了全面清理它们而创建 PR。

---

**U-15 · evlog 的组成部分保留 evlog 的名称** · `standard`

规则：drain、enricher、error catalog、`log.fork()`、wide event、pipeline。完整表格以及每个替代名称为何不正确的原因，位于 `references/terminology.md` 中。
错误：“Register the sink and every event reaches it.”
改进：“Register the drain and every event reaches it.”
原因：读者在这里学会一个术语，却无法在 API 中找到它，这会让他们多做一次搜索。
例外：描述其他工具的句子使用该工具自己的词汇。扫描器会忽略提到替代工具的句子中的任何匹配项，也会忽略属于某个产品的术语，例如 HyperDX 的 `otlphttp` exporter。

---

**U-16 · 每个链接都能解析** · `critical`

规则：内部链接必须指向存在的页面，或指向 `apps/docs/config/redirects.ts` 中的路径。skill 或 AGENTS.md 中的相对链接必须指向磁盘上的文件。
原因：失效链接是读者无法绕过、也无法有效报告的问题，而且是扫描器能够确定发现的问题。
注意：这是一个漂移 finding，由机械方式生成。它从来不是判断题，也从来没有对应的 twin。
