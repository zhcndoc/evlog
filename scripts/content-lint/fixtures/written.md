---
title: 在测试中检查事件
description: 在内存中捕获结构化事件，并断言其字段
---

# 在测试中检查事件

测试需要事件字段，但解析终端输出会使断言与格式耦合。内存 drain 会将事件保存在命名存储区中，测试可以直接读取这些事件。

## 捕获事件

这个 Node.js 示例通过 drain 写入一个事件，并检查其 action。它直接调用 drain，因此不会测试中间件或请求生命周期处理。

```js
import assert from 'node:assert/strict'
import { clearMemoryLogs, createMemoryDrain, readMemoryLogs } from 'evlog/memory'

const store = 'checkout-test'
clearMemoryLogs(store)
const drain = createMemoryDrain({ store, maxEvents: 100 })

await drain({
  event: {
    timestamp: new Date().toISOString(),
    level: 'info',
    action: 'checkout.completed',
  },
  request: { method: 'POST', path: '/checkout', requestId: 'test-1' },
  headers: {},
})

const events = readMemoryLogs({ store })
assert.equal(events.length, 1)
assert.equal(events[0].action, 'checkout.completed')
clearMemoryLogs(store)
```

使用 await 的 drain 调用会在断言读取存储区之前写入事件。此示例不需要网络凭据。

## 限制缓冲区

共享进程的测试会受到三个细节的影响。

`maxEvents: 100` 的存储区最多保留 100 个事件。后续写入会丢弃最早的事件，因此应选择能够容纳断言所需记录的上限。

存储区名称很重要。两个使用相同名称的 drain 会共享一个缓冲区，因此并发测试需要使用不同的名称，并且每个测试都应在断言后清理自己的存储区。

缓冲区位于进程内存中。它适用于断言，但进程退出后不会保留事件。

## 检查子集

`readMemoryLogs({ store, level: 'error', limit: 10 })` 最多返回十个最近的匹配事件，并按从最早到最晚的顺序排列。当缺少事件时应使测试失败，请对完整事件数量进行断言。
