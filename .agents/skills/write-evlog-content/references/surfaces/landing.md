# Surface：landing page

`apps/docs/content/0.landing.md`。带有命名插槽（`#title`、`#description`、`#headline`）的 MDC 组件、用于受控换行的 `:br`，以及 `---` 区块中的 props。

## 它是什么

一组承诺，每个承诺都附着在一个能够兑现它的页面上。这个框架决定了每一次编辑：对于一张卡片，问题不是“读起来是否顺畅”，而是“哪个页面能够证明这一点，以及那个页面是否真的证明了它”。

## 结构

```
landing-hero        the position, in a line that could not be a competitor's
landing-logos       social proof, no copy
landing-features    one card per capability: headline, title, description, link
...                 subsequent sections
```

每张 `features-feature-*` 卡片都会在其 prop 区块中包含 `link` 和 `link-label`。这个链接就是该承诺的凭据。如果一张卡片的链接指向一个无法证明该主张的页面，这就是一个 L-01 发现项，并且属于严重问题。

## 编写卡片

- **headline**：类别，两个词，不含动词。“Simple API”，“Drain Pipeline”。
- **title**：压缩后的前后对比，使用 `:br` 换行。“Set context。:br Get answers”。这是唯一一个片段本身就是重点的地方。
- **description**：机制。用两到三个句子说明实际发生的事情：API 调用、它阻止的失败、具体数字。技术读者会在这里判断标题是否真实。

当前页面上有效的模式是标题表达结果，描述表达机制。一张卡片如果反过来，把抽象描述放在具体标题下方，就是一个发现项。

## 自动化检查在这里可以做什么

报告。只有严重问题才会变成编辑：失效链接、没有页面兑现的承诺、与来源相矛盾的主张、过时的版本或数量。landing page 上关于语气和节奏的发现项交由人工处理，因为这个页面所编码的品牌决策，没有记录在任何审阅者可以阅读的地方。参见 L-06。

## 这个页面上最难的判断

营销文案和生成式文案会以完全相同的方式失败：一句听起来像是在传达价值、却没有说明任何具体内容的句子。这里不会因为它是营销界面就放宽这个判断标准列表。相反，这里的标准会执行得更严格，但有一个例外。`#title` 插槽中刻意使用的片段节奏是一项设计决策，并且每次都要落实一个能力点。检查它是否落实了一个。两张卡片如果使用同一种手法表达同一类主张，那么第二张卡片就属于发现项。
