# Surface：博客文章

尚未上线。此文件在第一篇文章发布之前定义这一体裁，因此它不会被第一篇文章碰巧呈现出的样子所定义。

## 谁会阅读

以 TypeScript 为生，并且至少有过一次糟糕的日志解决方案的人。他们是通过链接而不是搜索找到这篇文章的。他们读过很多库介绍自己的文章，并且默认会对所有这类文章打折扣。

这种折扣就是设计约束。用具体内容来逐步消除它：真实的数字、真实的代码，以及一次诚实的承认。

## 起草之前

用各自一句话回答下面四个问题。如果其中任何一个很难回答，这篇文章就还没准备好。

1. **发生了什么？** 发布、测量、决策、Bug。文章需要一个事件。
2. **它准确面向谁？** “开发者”不是受众。“运行 Nitro 应用且从未在任何地方排空日志的人”才是。
3. **他们现在怎么想，之后又会怎么想？** 一个发生改变的信念。
4. **说出这件事对我们有什么代价？** 约束、权衡、目前还不起作用的东西。参见 B-03。

然后从 `rules/blog.md` 中选择一种形态：发布、决策、调查或模式，并让它决定开场方式。

## 结构

```
title           the claim or the concrete thing, never a topic label
description     the reason to read, as a sentence. This is the social preview
opening         situation or number, 2-4 sentences, no definition
body            sections that mark the turns in the argument
code            real, pasted from the repo or the bench
admission       what it costs or what we got wrong, where it belongs
close           what changes for the reader, or what is next
```

## 长度

和论证一样长，但不要更长。一篇用 400 个词把事情说明白的发布文章，就是一篇好的发布文章。为了显得内容充实而填充篇幅的文章，读起来就是在凑字数，而填充内容总是那些泛泛的段落，这正是 `ai-tells.md` 会抓到的东西。

## 库博客反复出现的失败模式

- **把文章写成文档页面。** 如果读者能从 `/learn` 获取这些内容，就链接到 `/learn`。参见 B-05。
- **针对稻草人论点写文章。** 比较时要点名真实的工具，并且准确描述它。参见 U-12。
- **文章中没有作者。** 一篇没有任何人做出决策的决策文章读起来像是生成的，因为这正是生成文本所缺少的东西。
- **没有代价的复盘。** 每个失败都在自己的段落中被干净利落地解决，这是文档层面的特征，而不是故事。

## 审阅

和任何其他表面的审阅相同，同时加载 `rules/blog.md`，并提高 `ai-tells.md` 的权重。博客文案没有参考登记表可以躲在后面：在文档页面上，句子长度统一是体裁特征；在文章中，它却是一种发现。
