# 框架接线

每个框架中的审计管道结构都相同：注册 `auditEnricher()`，接入主 drain，并添加仅用于审计的 drain。选择与用户技术栈匹配的章节。

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

- drain 之间的故障隔离来自 `initLogger({ drain: [...] })` 对每个 drain 的独立调用。如果改用 `Promise.all`，单个 rejection 会导致其他 drain 一并失败。请使用 `Promise.allSettled` 并记录失败，或者坚持使用数组形式。
- `auditOnly` 上的 `await: true` 会使被包装的 drain 阻塞请求，直到事件完成 flush。对防篡改 drain 使用它，这样崩溃时不会丢失审计记录；可查询的 drain 则可以保持异步。
- 对于使用 hash-chain 的多进程部署，请持久化 `state.{load,save}`（Redis 是常见选择），这样链条才能跨越重启和滚动部署而持续存在。
