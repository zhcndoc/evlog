# 结构化错误指南

结构化错误提供上下文，帮助开发者理解发生了**什么**、发生的**原因**以及**如何修复**。

## 通用错误的问题

```typescript
// ❌ Useless errors
throw new Error('Something went wrong')
throw new Error('Failed')
throw new Error('Invalid input')

// ❌ Missing context
throw new Error('Payment failed')  // Why? How do I fix it?
```

当这些错误出现在日志或监控中时，你完全不知道：

- 实际失败了什么
- 为什么失败
- 如何修复
- 去哪里查找更多信息

## 结构化错误剖析

```typescript
import { createError } from 'evlog'

throw createError({
  message: 'Payment failed',              // What happened
  status: 402,                            // HTTP status code
  why: 'Card declined by issuer',         // Why it happened
  fix: 'Try a different payment method',  // How to fix it
  link: 'https://docs.example.com/...',   // More information
  cause: originalError,                   // Original error
  internal: {                             // Optional: backend / logs only
    correlationId: 'pay_abc',
    processorCode: 'card_declined',
  },
})
```

### `internal`（仅后端）

- 使用 `internal` 存放绝不能出现在 HTTP 错误正文或客户端 `parseError()` 结果中的 ID、网关代码或诊断信息
- 在服务端代码中通过 **`error.internal`** 访问。值会从 **`toJSON()`** 和框架序列化器中省略；当使用 **`log.error()`**（或等效的自动捕获）捕获错误时，这些值会出现在宽事件的 **`error.internal`** 中
- 值通过不可枚举的 symbol 存储，因此 `JSON.stringify(error)` 不会泄露 `internal`；开发者工具可能会将其显示为 `[Symbol(evlog.error.internal)]`

### 控制台输出（开发环境）

```
Error: Payment failed
Why: Card declined by issuer
Fix: Try a different payment method
More info: https://docs.example.com/payments/declined

Caused by: StripeCardError: card_declined
```

### JSON 输出（生产环境）

```json
{
  "name": "EvlogError",
  "message": "Payment failed",
  "why": "Card declined by issuer",
  "fix": "Try a different payment method",
  "link": "https://docs.example.com/payments/declined",
  "cause": {
    "name": "StripeCardError",
    "message": "card_declined"
  },
  "stack": "..."
}
```

## 字段指南

### `message`——发生了什么

面向用户的错误描述。

```typescript
// ✅ Good - clear, actionable
message: 'Failed to sync repository'
message: 'Unable to process payment'
message: 'User not found'

// ❌ Bad - vague, unhelpful
message: 'Error'
message: 'Something went wrong'
message: 'Failed'
```

### `why`——为什么发生

用于调试的技术说明。

```typescript
// ✅ Good - specific, technical
why: 'GitHub API rate limit exceeded (403)'
why: 'Card declined by issuer: insufficient_funds'
why: 'No user with ID "user_123" exists in database'

// ❌ Bad - just restating the message
why: 'It failed'
why: 'Error occurred'
```

### `fix`——如何修复

解决问题的可执行步骤。

```typescript
// ✅ Good - specific actions
fix: 'Wait 1 hour or use a different API token'
fix: 'Use a different payment method or contact your bank'
fix: 'Check the user ID and try again'

// ❌ Bad - not actionable
fix: 'Fix the error'
fix: 'Try again'
```

### `link`——更多信息

用于详细故障排查的文档 URL。

```typescript
// ✅ Good - specific documentation
link: 'https://docs.github.com/en/rest/rate-limit'
link: 'https://docs.stripe.com/declines/codes'
link: 'https://your-app.com/docs/errors/user-not-found'
```

### `cause`——原始错误

触发当前错误的底层错误。

```typescript
try {
  await stripe.charges.create(...)
} catch (error) {
  throw createError({
    message: 'Payment failed',
    why: `Stripe error: ${error.code}`,
    fix: 'Contact support with error code',
    cause: error,  // Preserves original stack trace
  })
}
```

## 常见错误模式

### API／外部服务错误

```typescript
// Rate limiting
throw createError({
  message: 'GitHub sync temporarily unavailable',
  status: 429,
  why: 'API rate limit exceeded (5000/hour)',
  fix: 'Wait until rate limit resets or use authenticated requests',
  link: 'https://docs.github.com/en/rest/rate-limit',
  cause: error,
})

// Authentication
throw createError({
  message: 'Unable to connect to Stripe',
  status: 503,
  why: 'Invalid API key provided',
  fix: 'Check STRIPE_SECRET_KEY environment variable',
  link: 'https://docs.stripe.com/keys',
  cause: error,
})

// Network
throw createError({
  message: 'Failed to fetch user data',
  status: 504,
  why: 'Connection timeout after 30s',
  fix: 'Check network connectivity and try again',
  cause: error,
})
```

### 验证错误

```typescript
// Missing required field
throw createError({
  message: 'Invalid checkout request',
  status: 400,
  why: 'Required field "email" is missing',
  fix: 'Include a valid email address in the request body',
  link: 'https://your-api.com/docs/checkout#request-body',
})

// Invalid format
throw createError({
  message: 'Invalid email format',
  status: 422,
  why: `"${email}" is not a valid email address`,
  fix: 'Provide an email in the format user@example.com',
})

// Business rule violation
throw createError({
  message: 'Cannot cancel subscription',
  status: 409,
  why: 'Subscription has already been cancelled',
  fix: 'No action needed - subscription is already inactive',
})
```

### 数据库错误

```typescript
// Not found
throw createError({
  message: 'User not found',
  status: 404,
  why: `No user with ID "${userId}" exists`,
  fix: 'Verify the user ID is correct',
})

// Constraint violation
throw createError({
  message: 'Cannot create duplicate account',
  status: 409,
  why: `User with email "${email}" already exists`,
  fix: 'Use a different email or log in to existing account',
  link: 'https://your-app.com/login',
})

// Connection
throw createError({
  message: 'Database unavailable',
  status: 503,
  why: 'Connection pool exhausted',
  fix: 'Reduce concurrent connections or increase pool size',
  cause: error,
})
```

### 权限错误

```typescript
throw createError({
  message: 'Access denied',
  status: 403,
  why: 'User lacks "admin" role required for this action',
  fix: 'Contact an administrator to request access',
  link: 'https://your-app.com/docs/permissions',
})
```

## 转换示例

### 转换前：通用错误

```typescript
async function processPayment(cart, user) {
  try {
    return await stripe.charges.create({
      amount: cart.total,
      currency: 'usd',
      source: user.paymentMethodId,
    })
  } catch (error) {
    throw new Error('Payment failed')  // ❌ No context
  }
}
```

### 转换后：结构化错误

```typescript
async function processPayment(cart, user) {
  try {
    return await stripe.charges.create({
      amount: cart.total,
      currency: 'usd',
      source: user.paymentMethodId,
    })
  } catch (error) {
    throw createError({
      message: 'Payment failed',
      why: getStripeErrorReason(error),
      fix: getStripeErrorFix(error),
      link: 'https://docs.stripe.com/declines/codes',
      cause: error,
    })
  }
}

function getStripeErrorReason(error) {
  const reasons = {
    card_declined: 'Card was declined by the issuer',
    insufficient_funds: 'Card has insufficient funds',
    expired_card: 'Card has expired',
    // ...
  }
  return reasons[error.code] ?? `Stripe error: ${error.code}`
}

function getStripeErrorFix(error) {
  const fixes = {
    card_declined: 'Try a different payment method or contact your bank',
    insufficient_funds: 'Use a different card or add funds',
    expired_card: 'Update your card details with a valid expiration date',
    // ...
  }
  return fixes[error.code] ?? 'Contact support with error code'
}
```

## 与宽事件集成

结构化错误可以无缝集成到宽事件中：

```typescript
// server/api/checkout.post.ts
// Nuxt: useLogger and createError are auto-imported
// Nitro v3: import { useLogger } from 'evlog/nitro/v3'
// Nitro v2: import { useLogger } from 'evlog/nitro'
import { createError } from 'evlog'

export default defineEventHandler(async (event) => {
  const log = useLogger(event)

  try {
    // ... business logic ...
  } catch (error) {
    // EvlogError fields are automatically captured
    log.error(error, { step: 'payment' })
    throw createError({
      message: 'Payment failed',
      why: error.message,
      fix: 'Try a different payment method',
    })
  }
  // emit() called automatically
})
```

宽事件将包含：

```json
{
  "error": {
    "name": "EvlogError",
    "message": "Payment failed",
    "why": "Card declined by issuer",
    "fix": "Try a different payment method",
    "link": "https://docs.stripe.com/declines/codes",
    "internal": {
      "stripeRequestId": "req_123"
    }
  },
  "step": "payment"
}
```

如果你使用 `createError({ ..., internal: { ... } })`，但没有自行调用 `log.error(error)`，那么将抛出错误附加到宽事件的框架集成仍会在触发时将 **`internal`** 合并到 **`error.internal`** 中。

## 最佳实践

### 应该做

- 至少始终提供 `message` 和 `why`
- 存在可执行的解决方案时，包含 `fix`
- 对于复杂错误，添加指向文档的 `link`
- 包装错误时保留 `cause`
- 具体说明失败的内容及其原因
- 将仅供操作人员使用或敏感的诊断信息放入 `internal`，而不是 `why`／`fix`／`message`

### 不应该做

- 使用诸如“Error”或“Failed”之类的通用消息
- 泄露敏感数据（密码、令牌、PII）
- 不要期待在 HTTP JSON 或 `parseError()` 中获取 `internal`。它仅用于服务端日志和数据接收端
- 不要让 `why` 和 `message` 完全相同
- 不要建议实际上无法执行的修复方案
- 不要创建完全没有上下文的错误

## Nitro 兼容性

evlog 错误适用于任何基于 Nitro 的框架。在 API 路由中抛出错误时，该错误会自动转换为 HTTP 响应：

```typescript
// Backend - just throw
throw createError({
  message: 'Payment failed',
  status: 402,
  why: 'Card declined',
  fix: 'Try another card',
  link: 'https://docs.example.com/payments',
})

// HTTP Response:
// Status: 402
// Body: {
//   statusCode: 402,
//   message: "Payment failed",
//   data: { why: "Card declined", fix: "Try another card", link: "..." }
// }
```

### 前端集成

使用 `parseError()` 将所有字段提取到顶层：

```typescript
import { parseError } from 'evlog'

try {
  await $fetch('/api/checkout')
} catch (err) {
  const error = parseError(err)

  // Direct access: error.message, error.why, error.fix, error.link
  toast.add({
    title: error.message,
    description: error.why,
    color: 'error',
    actions: error.link
      ? [{ label: 'Learn more', onClick: () => window.open(error.link) }]
      : undefined,
  })

  if (error.fix) console.info(`💡 Fix: ${error.fix}`)
}
```

**区别**：通用错误只显示“发生错误”。结构化错误会显示消息、解释原因、提供修复建议，并链接到文档。

## 错误消息模板

常见模式，以及针对每种情况调整后的字段：

| 模式 | 状态 | 字段 |
|---------|--------|--------|
| 找不到资源 | 404 | `why`：缺少什么，`fix`：验证标识符 |
| 外部服务失败 | 503 | `why`：服务错误，`fix`：可执行步骤，`link`：服务文档，`cause`：原始错误 |
| 验证失败 | 400 | `why`：什么无效，`fix`：预期格式 |
| 权限被拒绝 | 403 | `why`：需要什么，`fix`：如何获得访问权限 |
