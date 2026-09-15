# 修正

来自被拒绝的重写，以及后来证明错误的发现的经验教训。此文件会不断增长；技能中的其他内容都不会增长。

当评审指出某项本应通过的内容，重写导致页面退化，或维护者覆盖某条规则时，添加一条记录。一条记录四行，不作叙述。

```
## <date> · <rule or tell id> · <one-line title>
Flagged: what the review said.
Actual: why it was wrong, or what the maintainer wanted instead.
Applies to: the surfaces or pages this holds for.
```

一条记录如果重复三次，就说明需要修改的是规则，而不是再次重述修正。

---

## 2026-08-15 · T-06 · 共享模板不是模具

Flagged：51 个页面，“所有 N 个标题都是名词”。adapter 和 framework 页面按设计包含 Installation、Quick Start、Configuration、Troubleshooting 和 Next Steps。
Actual：一组页面采用同一种形状，并不意味着页面是从模具中压出来的。比较 Axiom 和 Datadog 的读者希望两次都能落到相同的章节，而其中 14 个标题还通过锚点被文档其他位置链接。
Applies to：任何包含同级页面的目录。`scripts/content-lint/lib/score.mjs` 现在会在判断剩余内容的形状之前，减去页面与三个或更多同级页面共享的标题，因此发现数量从 51 降到了 47。剩下的 47 个页面各自都有十个或更多专属标题，而且都是名词，这些才是真正的问题。

## 2026-08-15 · T-07 · 四个项目不足以看出模具

Flagged：四个列表，全都合规。基准页面上的受控变量（`Same output mode`、`Same warmup`、`Same tooling`、`Same machine`）、决策矩阵（`Pick evlog over pino`、`over winston`、`over consola`、`Stay on pino`）、一个 pitfalls 列表，以及一个示例消费者列表。
Actual：四个项目中，75% 的占比就是三个项目，而这正是并行内容发挥作用时的样子。真正的问题是把统一性强加给并不统一的内容，而四个项目无法展现这一点。
Applies to：每个表面。`score.mjs` 现在要求至少五个项目。另有两个 opener 是由结构而不是语气造成的，因此会先被剥离：编号列表中的序数，以及符号或带有 code 标签的链接留下的 `code` 占位符。

## 2026-08-15 · U-15 · codemod 重写了定义自身的规则

Flagged：无。这是通过阅读发现的。
Actual：全语料库范围的 `--fix` 扫描把 `terminology.md` 自身中的 `sink` 替换成了 `drain`，于是要避免的词语表列出了 `drain`，而 `universal.md` 中的示例对变成了 `Bad: "Register the drain"`。这条规则让评审拒绝了正确的词。
Applies to：任何 codemod。`corpusFiles` 已经排除了此目录，而强制执行这一点的保护措施是在扫描完成后才加入的。绝不要手动将 `--fix` 指向某个路径；传入语料库，让排除规则完成它们的工作。

## 2026-08-15 · U-15 · `transport` 不是 evlog 要夺回的词

Flagged：13 个页面使用了 `transport`。
Actual：这 13 处全部合规。迁移章节中的 pino transports、承载浏览器日志的 HTTP transport、HyperDX 自己的 exporter，以及表示“不是一种传输机制”的 `not a transport`。规则无法仅通过阅读一行来区分 evlog 的 drain 和 transport 层。
Applies to：仅扫描器。`terminology.md` 仍然优先使用 `drain`，评审仍应指出这一点。`sink` 和 `exporter` 继续保留在表中，因为在这里二者都没有合规的第二种含义。

## 2026-08-15 · T-03 · 以冒号结尾的更近结尾是在引出内容

Flagged：`Never log:`、`This enables:`、`In the Sentry dashboard:`。
Actual：以冒号结尾的简短最后一句，是下面表格或列表的句子，而不是一种修辞。八个候选项中有六个属于这种情况。
Applies to：每个表面。`metrics.mjs` 不再统计以冒号结尾的 closer。

## 2026-08-15 · T-06 · 编号序列不是模具

Flagged：标题为 `1. Route filtering`、`2. Logger creation`、`3. Emit` 的页面。
Actual：同一流程的步骤具有相同形状，是因为它们属于同一流程。`ai-tells.md` 已经将有序指南命名为 twin；扫描器之前并不知道这一点。
Applies to：任何以数字或 `Step N` 开头的标题。`metrics.mjs` 现在将其归类为 `sequence`，而 `T-06` 会忽略这种形状，因此数量从 44 降到了 35。

## 2026-08-15 · U-14 · 标点从来不是机械的

Flagged：codemod 将 `A — B — C` 替换为 `A, B, C`。
Actual：38 次替换中有 25 次把括号式列表变成了主语后面跟着四个裸名词的句子。正确的标记取决于带破折号的部分是同位语、列表、原因还是补充想法，只有读者才能判断。
Applies to：每个表面。规则现在会对替换进行排序，而 codemod 完全不会触碰标点。

## 2026-08-15 · U-15 · 附着于所属者的术语属于所属者

Flagged：HyperDX 和 eve 页面中的 `exporter`。
Actual：每一处都在指称他人的组成部分。`otlphttp` exporter 是 collector 配置中的一个键，而 PostHog 的 exporter 属于 PostHog。将任一项重命名为 `drain`，都会让读者去寻找一个不存在的配置键。
Applies to：`terminology.md` 中的每个术语。`corpus.mjs` 会丢弃段落中提到 evlog 所记录产品的命中，这与 alternatives 已有的例外形状相同，并将 collector 和 adapter 厂商加入了列表。

## 2026-08-15 · T-03 · 卡片正文就是说明文字

Flagged：frameworks 概览中的 `Zero config.` 结束了一个 `::card`。
Actual：卡片是一个链接磁贴，其正文大小受磁贴限制，因此每张卡片都会以一行短句结尾。统计它们衡量的是组件，而不是页面的节奏。
Applies to：每个表面上的 `::card`。`metrics.mjs` 将卡片正文排除在合格总体之外。

## 2026-08-15 · T-06 · 列表页面可以使用并列标题

Flagged：CLI 页面上的 `Exit codes`、`The JSON contract`、`The map file`、`Monorepos`，以及另外 19 个相同形状的页面。
Actual：`ai-tells.md` 已经命名了这个 twin：并行条目使用并行标题，而且在文件中看起来像是包含表格或代码围栏、几乎没有散文的章节。真正的问题是把模具套在进行论证的章节上。
Applies to：每个表面。`metrics.mjs` 会衡量采用列表的章节占比，达到 0.6 或更高时，`T-06` 就会放行，因此清除了 20 个页面。

## 2026-08-15 · U-14 · 项目符号也是散文

Flagged：一年以来没有任何发现。该规则只读取标题和段落，因此 276 个破折号在列表项目中原封不动，其中大多数位于页面底部的 `Next steps` 列表中。
Actual：其中 159 个是在破折号后对粗体术语作释义，而语料库其他地方使用冒号来书写。剩余的 117 个在破折号后放置了完整从句，需要读者判断。
Applies to：每个表面上的列表项目。表格单元格仍然排除在外：单元格是片段，两个组成部分之间的破折号属于布局。

## 2026-08-15 · U-14 · 两个连字符就是 em dash

Flagged：无。空格之间的 `--` 完全没有被处理，而 README 中有五处。
Actual：`is auto-imported -- no import needed` 是使用现有按键写出的同一个标记。表格单元格和围栏代码保留原样，因为 `evlog-map-disable-next-line wide-event -- reason` 是 CLI 自身的语法。
Applies to：每个表面上的散文。

## 2026-08-15 · D-12 · 重命名标题会破坏指向它的链接

Flagged：`Where the byte counts come from`、`Which number moves your bill`、`Try it against your numbers`、`Ask it from your editor`，以及 8 个相同类型的页面。
Actual：分类器只有在标题以 `?` 结尾时才会识别出疑问句，而其动词列表只有 42 个词，语料库中的写法远不止这些。这两点都让一个答案页面看起来像是名词页面。
Applies to：每个表面。`classifyHeading` 会将疑问句开头识别为问题，动词列表也增长到了 89 个。evlog 自身的名词优先排除在外（`log`、`route`、`stream`、`trace`、`filter`、`drain`），因为将 `## Route filtering` 统计为祈使句只会削弱规则，而不是纠正它。

## 2026-08-15 · U-12 · `without X` 是条件，而不是比较

Flagged：`Without \`setup\`, OpenTelemetry export is untouched`。
Actual：该句说明当某个选项缺失时 evlog 会做什么。`without` 和 `instead of` 只比较紧跟其后的内容，而这里紧跟其后的是 `setup`，不是逗号后提到的替代项。
Applies to：每个表面。`corpus.mjs` 仅在替代项是这两个词的宾语时报告它们，并保留无条件比较句不变。

## 2026-08-15 · T-11 · 接缝是针脚，不是页面

Flagged：两个段落相隔 87 行和 141 行，而页面上的其他段落都没有可供统计的收缩。
Actual：该指标遍历了具有机会的段落，并将其中任意两个称为相邻段落。页面两端的两种语域并不是针脚的样子；这个 tell 指的是一段文字被嵌入另一段文字中。
Applies to：每个表面。`metrics.mjs` 现在只报告页面上相隔不超过三段的段落之间的接缝。

## 2026-08-15 · U-14 · 两个连字符就是 em dash

Flagged：没有。空格之间的 `--` 完全没有被处理，而 README 中有五处。
Actual：`is auto-imported -- no import needed` 是使用现有按键写出的同一个标记。表格单元格和围栏代码保留原样，因为 `evlog-map-disable-next-line wide-event -- reason` 是 CLI 自身的语法。
Applies to：每个表面上的散文。

## 2026-08-15 · D-12 · 重命名标题会破坏指向它的链接

Flagged：没有。两个页面中的三个锚点指向了此分支重命名的标题，其中一个从更早之前就已经失效。
Actual：损坏的片段不会在任何地方报告错误。页面会加载，链接会解析，读者会到达页面顶部。扫描器完全没有检查锚点，而手动编写的审计只比较跨页面链接，因此同页面链接两次都保持不可见。
Applies to：`apps/docs/content/`。`reach.mjs` 现在会将每个片段与其目标页面的标题进行解析。重命名标题时，链接也要同步修改，而不是可选项。

## 2026-09-10 · U-04, D-01 · 准确性应保留产品承诺

Flagged：介绍性声明和迁移文案被重写成了实现限制；两个搜索入口页面重复了入门和参考资料。
Actual：保留自信、以收益为导向的介绍，纠正不受支持的声明，并将详细限制放在读者做出该决策的位置。让每篇指南都有独特的任务，并从现有文档提供上下文链接。
Applies to：介绍性页面、产品摘要和新的文档指南。事实纠正不要求将营销文案变成警告。
