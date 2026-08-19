# Surface：changeset

`.changeset/*.md`。简短，并面向两类读者：扫描发布内容以了解哪些变化会影响自己的消费者，以及逐字引用它的发布说明。

## 结构

```markdown
---
"evlog": minor
---

One line stating what the consumer can now do, or what changed for them.

Optional: the one thing they need to know to use it: the import, the option, the migration step.
```

## 规则

- **从消费者的角度撰写。** 写他们可以做什么，而不是实现了什么。“为 Grafana Loki 添加 `createLokiDrain`”，而不是“实现 Loki 适配器”
- **使用现在时，不要叙述过程。** 不要写一段关于变化如何产生的内容。那属于 PR 正文
- **破坏性变更要在一行中说明迁移方式**，并写明变更前和变更后
- **`apps/*` 或 `examples/*` 不创建 changeset**，包括文档。对于确实无需说明的已发布包变更，使用 `pnpm changeset add --empty`
- 版本升级类型：修复使用 `patch`，功能使用 `minor`，破坏性变更使用 `major`

## 这里会出现的明显迹象

Changeset 足够简短，因此自动生成的内容很容易被发现：PR 实际只做了一件事，却列出了三项内容；结尾的句子重复了开头；以及在机械性变更后附加了“……改善开发者体验”之类的收益描述。删掉这部分。变更本身就是说明。
