# 框架接线

审计流水线在每个框架中的形态都一样：注册 `auditEnricher()`，连接一个主输出，并添加一个仅审计的 sink。请选择与用户技术栈匹配的部分。

## Hono

```ts
import { Hono } from 'hono'
import { evlog, type EvlogVariables } from 'evlog/hono'
import { auditEnricher, auditOnly, signed } from 'evlog'
import { createAxiomDrain } from 'evlog/axiom'
import { createFsDrain } from 'evlog/fs'

const main = createAxiomDrain({ dataset: 'logs' })
const auditSink = auditOnly(
  signed(createFsDrain({ dir: '.audit/' }), { strategy: 'hash-chain' }),
  { await: true },
)

const app = new Hono<EvlogVariables>()
app.use(evlog({
  enrich: ctx => auditEnricher({ tenantId: c => c.headers?.['x-tenant-id'] })(ctx),
  drain: async (ctx) => { await Promise.all([main(ctx), auditSink(ctx)]) },
}))
```

## Express

```ts
import express from 'express'
import { evlog } from 'evlog/express'
import { auditEnricher, auditOnly, signed } from 'evlog'
import { createAxiomDrain } from 'evlog/axiom'
import { createFsDrain } from 'evlog/fs'

const main = createAxiomDrain({ dataset: 'logs' })
const auditSink = auditOnly(
  signed(createFsDrain({ dir: '.audit/' }), { strategy: 'hash-chain' }),
  { await: true },
)

const app = express()
app.use(evlog({
  enrich: auditEnricher({ tenantId: ctx => ctx.headers?.['x-tenant-id'] }),
  drain: async (ctx) => { await Promise.all([main(ctx), auditSink(ctx)]) },
}))
```

## Next.js（App Router）

```ts
// lib/evlog.ts
import { createEvlog } from 'evlog/next'
import { auditEnricher, auditOnly, signed } from 'evlog'
import { createAxiomDrain } from 'evlog/axiom'
import { createFsDrain } from 'evlog/fs'

const main = createAxiomDrain({ dataset: 'logs' })
const auditSink = auditOnly(
  signed(createFsDrain({ dir: '.audit/' }), { strategy: 'hash-chain' }),
  { await: true },
)

export const { withEvlog, useLogger } = createEvlog({
  service: 'my-app',
  enrich: auditEnricher({ tenantId: ctx => ctx.headers?.['x-tenant-id'] }),
  drain: async (ctx) => { await Promise.all([main(ctx), auditSink(ctx)]) },
})
```

## 独立脚本 / 队列 worker / CLI

没有请求 → 不需要 enricher。`audit()`（或 `withAudit()`）替代 `log.audit()`：

```ts
import { initLogger, audit } from 'evlog'
import { signed } from 'evlog'
import { createFsDrain } from 'evlog/fs'

initLogger({
  env: { service: 'billing-worker' },
  drain: signed(createFsDrain({ dir: '.audit/' }), { strategy: 'hash-chain' }),
})

audit({
  action: 'cron.cleanup',
  actor: { type: 'system', id: 'cron' },
  target: { type: 'job', id: 'cleanup-stale-sessions' },
  outcome: 'success',
})
```

## 适用于所有场景的注意事项

- `initLogger({ drain: [...] })` 会独立调用每个 drain，因此可以实现 drain 之间的故障隔离。若你改用 `Promise.all`，任意一个拒绝都会拖垮其他的 drain——请用 `Promise.allSettled` 并记录失败，或者坚持使用数组形式。
- `auditOnly` 上的 `await: true` 会让被包装的 drain 阻塞请求，直到事件刷出。对防篡改 sink 应该这样用，这样就不会在崩溃时丢失审计；可查询的 sink 可以保持异步。
- 对于位于 hash-chain 之后的多进程部署，请持久化 `state.{load,save}`（Redis 是常见选择），这样链在重启和滚动发布后仍能保持连续。
