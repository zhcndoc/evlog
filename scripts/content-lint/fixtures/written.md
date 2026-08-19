---
title: 将事件发送到 Axiom
description: 配置 Axiom drain，选择批处理内容，并了解相关成本
---

# 将事件发送到 Axiom

你的处理器已经会为每个请求发出一个包含大量字段的事件。在接入 drain 之前，该事件会随着进程终止而消失，这在开发环境中没问题，但一旦部署就毫无用处。

## 接入 drain

```ts [server/plugins/evlog.ts]
import { createAxiomDrain } from 'evlog/axiom'

export default createAxiomDrain({
  token: process.env.AXIOM_TOKEN,
  dataset: 'requests',
})
```

drain 会将事件保存在内存中，并在 2 秒计时器到期或达到 100 个事件时刷新，以先达到者为准。刷新会在响应处理之外运行，因此 Axiom 响应缓慢不会影响你的 p99。

## 成本

启用后有三件事会发生变化。

刷新失败后会使用退避策略重试 3 次，然后丢弃该批次，并在本地记录一行日志。事件不会在重试期间持久化，因此进程如果在刷新过程中退出，会丢失当时暂存的内容。

令牌会在启动时读取一次。轮换令牌需要重启。

你累积的每个字段都会成为 Axiom 的索引字段，而 Axiom 按摄取的字节数计费。转储 `request.headers` 通常会让账单翻三倍。

## 检查是否送达

```bash
pnpm evlog tail --drain axiom
```

CLI 会读取相同的配置，并打印 drain 将要发送的内容。如果数据集名称错误，你可以在这里看到，而不是一小时后才在空白的 Axiom 视图中发现问题。
