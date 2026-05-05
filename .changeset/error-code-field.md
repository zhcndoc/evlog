---
'evlog': minor
---

为 `createError` / `EvlogError` 添加一个可选的 `code` 字段，这样结构化错误就可以携带一个稳定、机器可读的标识符，用于客户端分支逻辑、仪表盘以及未来的错误目录工具。为即将推出的 `defineErrorCatalog` 原语打下基础。

```ts
import { createError, parseError } from 'evlog'

throw createError({
  code: 'PAYMENT_DECLINED',
  message: 'Payment failed',
  status: 402,
  why: 'Card declined by issuer',
  fix: 'Try a different payment method',
})

// 客户端
const err = parseError(caught)
if (err.code === 'PAYMENT_DECLINED') retryWithDifferentCard()
```

`code` 是公开字段，并且会通过现有的每一条序列化路径传播，且不会引入破坏性变更：

- **HTTP responses** — 通过现有的 `EvlogError.data` getter 显示在 `data.code` 下（Nitro v2/v3、Next.js，以及任何使用 `serializeEvlogErrorResponse` 的框架都会自动获得该字段）。
- **`parseError(err)`** — 在 `ParsedError` 上新增 `code` 字段。该字段会从 EvlogError JSON、h3 风格的 `data.code`、以及 Node 风格的 `Error.code`（例如 `'ENOENT'`、`'ECONNRESET'`）中提取，因此现有的系统错误也会通过同样的客户端分支流转。
- **Wide events** — 复制到 `event.error.code`，这样 drains 和 dashboards 就可以按 code 进行分组、告警和绘图，而无需解析自由文本消息。
- **`toString()`** — 为终端的 pretty-print 渲染一行 `Code:`。

此处不包含的内容（计划在下一步）：用于集中式、带类型的 code 联合的 `defineErrorCatalog`，以及用于审计动作的等价方案。
