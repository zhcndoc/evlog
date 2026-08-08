---
"evlog": patch
---

为未以 `turn.completed` 或 `turn.failed` 结束的 eve 回合发送宽事件。

被 eve 取消的回合不会生成宽事件，其日志记录器、累加器和会话槽位也会永久留在内存中：LRU 驱逐会跳过仍有活动回合的会话，因此这些内容永远不会被回收。现在，`turn.cancelled` 会在自身的终止路径上关闭回合——状态为 `499`，`eve.phase: 'cancelled'`，级别为 `info`，因为在 eve 的模型中，取消并不算失败。

`session.failed` 和 `session.completed` 会刷新该会话仍处于打开状态的所有回合，并丢弃其延续上下文，这也终止了已完成会话的快照被无限期保留的问题。
