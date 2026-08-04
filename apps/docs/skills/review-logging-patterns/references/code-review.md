# 代码审查清单

在审查代码的日志记录最佳实践和 evlog 采用情况时，请使用此清单。

## 如果可以，请优先使用 `evlog map`

在 **Nuxt、Nitro、Next.js App Router 和 TanStack Start** 中，如果用户愿意，先使用 `@evlog/cli` —— 一条命令就能找出薄弱入口点并命名需要修复的地方：

```bash
npx @evlog/cli map --no-write
npx @evlog/cli map <file> --no-write   # 单个入口点的建议形式
```

**要求**（将分数移至下方的反模式）：

| Map 规则 ID | 权重 | 预期内容 | 相关反模式 |
|-------------|--------|-----------------|----------------------|
| `wide-event` | 40 | `useLogger()` / 请求日志记录器 | 处理程序中没有日志记录 |
| `audit` | 25 | 在敏感路由上使用 `log.audit(...)` | auth/billing 缺少审计 |
| `structured-errors` | 20 | `createError({ why, fix })` | `throw new Error('...')` |
| `page-error-handling` | 20 | 页面上的 fetch 错误处理 | 未处理的页面 fetch |
| `context` | 15 | `log.set(...)` | 请求上下文扁平或缺失 |
| `error-handling` | 15 | 在 `catch` 中记录日志或重新抛出 | `console.error(e); throw e` |

**机会项**（绝不会扣分；仅在项目已经使用该功能时触发）——将其作为建议而不是缺陷展示：

| Map 规则 ID | 触发条件 | 相关技能章节 |
|-------------|-----------|-----------------------|
| `error-catalog` | 已声明错误目录，且相同的内联错误出现在 2 个或更多文件中 | 相关能力 → 错误目录 |
| `audit-coverage` | 项目记录审计日志，但某个改变状态的处理程序没有审计记录 | 审计日志 |
| `ai-logging` | `ai` 是依赖项，且调用 AI SDK 时未使用 `evlog/ai` | AI SDK 集成 |
| `auth-identity` | `better-auth` 是依赖项，但未使用 `evlog/better-auth` | 相关能力 → Better Auth |

完整规则参考：https://www.evlog.dev/cli/rules

Map 只能告诉你**形态**存在 —— 不能说明这些上下文在运行时是否有用。对于没有适配器的框架、上下文质量、drain、redaction 以及 AI SDK 的使用，请继续查看下面的扫描项。如果用户跳过 CLI，就只使用这份检查清单。

## 快速扫描

先通过这些检查来识别可改进的地方：

### 1. 控制台语句审计

搜索以下模式：

```typescript
// ❌ 需要查找并转换的模式
console.log(...)
console.error(...)
console.warn(...)
console.info(...)
console.debug(...)
```

**需要问的问题：**

- 一个函数里是否有多个控制台语句？
- 它们是否在记录请求/响应数据？
- 能否将它们整合为一个宽事件？

### 2. 错误模式审计

搜索以下模式：

```typescript
// ❌ 通用错误
throw new Error('...')
throw Error('...')

// ❌ 不带上下文地重新抛出
catch (error) {
  throw error
}

// ❌ 记录后再抛出
catch (error) {
  console.error(error)
  throw error
}
```

**需要问的问题：**

- 错误消息是否解释了发生了什么？
- 是否有说明根本原因的 `why`？
- 是否有建议解决方案的 `fix`？
- 原始错误是否作为 `cause` 被保留？

### 3. 请求处理器审计

对于每个 API 路由/处理器，检查：

```typescript
// ❌ 缺少请求上下文
export default defineEventHandler(async (event) => {
  // 没有任何日志，或者零散的 console.logs
})
```

**需要问的问题：**

- 是否有按请求作用域划分的 logger？
- 上下文是否在整个请求过程中累积？
- 是否在结束时只发出一次？

## 详细审查

### console.log 转换

#### 单个调试日志

```typescript
// ❌ 转换前
console.log('处理用户：', userId)

// ✅ 转换后 - 如果是较大操作的一部分
log.set({ user: { id: userId } })

// ✅ 转换后 - 如果是独立调试
log.debug('user', `处理用户 ${userId}`)
```

#### 多个相关日志

```typescript
// ❌ 转换前
console.log('开始结账')
console.log('用户：', user.id)
console.log('购物车商品：', cart.items.length)
console.log('总计：', cart.total)

// ✅ 转换后
log.info({
  action: 'checkout',
  user: { id: user.id },
  cart: { items: cart.items.length, total: cart.total },
})
```

#### 请求生命周期日志

```typescript
// server/api/process.post.ts

// ❌ 转换前
export default defineEventHandler(async (event) => {
  console.log('请求已开始')
  const user = await getUser(event)
  console.log('用户已加载')
  const result = await processData(user)
  console.log('处理完成')
  return result
})

// ✅ 转换后（Nuxt - 自动导入，无需导入）
// 对于 Nitro v3：import { useLogger } from 'evlog/nitro/v3'
// 对于 Nitro v2：import { useLogger } from 'evlog/nitro'

export default defineEventHandler(async (event) => {
  const log = useLogger(event)

  const user = await getUser(event)
  log.set({ user: { id: user.id } })

  const result = await processData(user)
  log.set({ result: { id: result.id } })

  return result
  // emit() 会自动调用
})
```

### 错误转换

#### 通用错误

```typescript
// ❌ 转换前
throw new Error('创建用户失败')

// ✅ 转换后
throw createError({
  message: '创建用户失败',
  why: '电子邮件地址已注册',
  fix: '请使用其他电子邮件或登录现有账户',
  link: 'https://your-app.com/docs/registration',
})
```

#### 无上下文的包装错误

```typescript
// ❌ 转换前
try {
  await externalApi.call()
} catch (error) {
  throw new Error('API 调用失败')
}

// ✅ 转换后
try {
  await externalApi.call()
} catch (error) {
  throw createError({
    message: '外部 API 调用失败',
    why: `API 返回：${error.message}`,
    fix: '检查 API 凭据后重试',
    link: 'https://api-docs.example.com/errors',
    cause: error,
  })
}
```

#### 记录后抛出反模式

```typescript
// ❌ 转换前
try {
  await riskyOperation()
} catch (error) {
  console.error('操作失败：', error)
  throw error
}

// ✅ 转换后
try {
  await riskyOperation()
} catch (error) {
  log.error(error, { step: 'riskyOperation' })
  throw createError({
    message: '操作失败',
    why: error.message,
    fix: '检查输入后重试',
    cause: error,
  })
}
```

### 请求处理器转换

#### 无日志

```typescript
// server/api/orders.post.ts

// ❌ 转换前
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = await processOrder(body)
  return result
})

// ✅ 转换后（Nuxt - 自动导入，无需导入）
// 对于 Nitro v3：import { useLogger } from 'evlog/nitro/v3'
// 对于 Nitro v2：import { useLogger } from 'evlog/nitro'
import { createError } from 'evlog'

export default defineEventHandler(async (event) => {
  const log = useLogger(event)

  const body = await readBody(event)
  log.set({ order: { items: body.items?.length } })

  try {
    const result = await processOrder(body)
    log.set({ result: { orderId: result.id, status: result.status } })
    return result
  } catch (error) {
    log.error(error, { step: 'processOrder' })
    throw createError({
      message: '订单处理失败',
      why: error.message,
      fix: '检查订单数据后重试',
    })
  }
  // emit() 会自动调用
})
```

## 审查清单摘要

### 日志记录

- [ ] 生产代码中没有原始的 `console.log` 语句
- [ ] 请求处理器使用 `useLogger(event)`（Nuxt/Nitro）或 `createRequestLogger()`（独立模式）
- [ ] 在整个请求过程中，使用 `log.set()` 累积上下文
- [ ] 使用 `useLogger()` 时 `emit()` 是自动的，使用 `createRequestLogger()` 时需要手动调用
- [ ] 宽泛事件包括：用户、业务上下文、结果

### 错误

- [ ] 所有错误都使用 `createError()`，而不是 `new Error()`（从 `evlog` 导入）
- [ ] 每个错误都有清晰的 `message` 和合适的 `status` 状态码
- [ ] 复杂错误包含解释根本原因的 `why`
- [ ] 可修复错误包含带有可执行步骤的 `fix`
- [ ] 已文档化的错误包含指向文档的 `link`
- [ ] 包装后的错误保留 `cause`
- [ ] 仅供支持人员使用或敏感的诊断信息使用 `internal`，而不是 `message` / `why` / `fix`

### 前端错误处理

- [ ] API 错误会被捕获并以完整上下文（message、why、fix）展示
- [ ] Toast 或错误组件使用来自 `error.data.data` 的结构化数据
- [ ] 指向文档的链接是可执行的（toast 中的按钮/链接）

### 上下文

- [ ] 用户上下文包括：id、套餐/订阅、相关业务数据
- [ ] 请求上下文包括：method、path、requestId
- [ ] 业务上下文是特定领域的，并且对调试有帮助
- [ ] 日志中没有敏感数据（密码、令牌、完整卡号）。

## 反模式总结

| 反模式 | 修复 |
|--------------|-----|
| 在一个函数中多次 `console.log` | 使用 `useLogger(event).set()` 记录单个宽事件 |
| `throw new Error('...')` | `throw createError({ message, status, why, fix })` |
| `console.error(e); throw e` | `log.error(e); throw createError(...)` |
| 请求处理器中没有日志记录 | 添加 `useLogger(event)`（Nuxt/Nitro）或 `createRequestLogger()`（独立使用） |
| 平铺的日志数据 | 分组对象：`{ user: {...}, cart: {...} }` |
| 缩写字段名 | 使用描述性名称：`userId` 而不是 `uid` |

## 建议的审查评论

在留下审查反馈时使用这些内容：

### 发现了 Console.log

> 考虑在这里使用 evlog 的宽事件模式。不要使用多个 console.log 语句，而是使用 `useLogger(event)` 来累积上下文并发出一个单一、完整的事件。

### 通用错误

> 这个错误会受益于 evlog 的结构化错误模式。考虑使用 `import { createError } from 'evlog'` 和 `createError({ message, status, why, fix })` 来提供更多调试上下文。

### 缺少请求上下文

> 这个处理函数会受益于按请求范围的日志记录。在开始时添加 `useLogger(event)`，以便在整个请求生命周期中捕获上下文。

### 良好的日志记录（正面反馈）

> 这里对宽事件的使用很棒！上下文结构良好，并且对于调试会非常有帮助。
