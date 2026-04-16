---
title: 就用他喵的 evlog
description: 为 TypeScript 提供的宽事件和结构化错误。每个操作一条日志（请求、任务或工作流），包含所有上下文，无需四处搜寻。
ogTitle: 就用他喵的 evlog
ogDescription: 为 TypeScript 提供的宽事件和结构化错误。每个操作一条日志，无需四处搜寻。
ogHeadline: 别再过度思考你的日志了
---

<p class="vitrine-eyebrow">别再过度思考你的日志了</p>

# 就用他喵的 evlog。

```bash [Terminal]
npx skills add https://www.evlog.dev
```

你被告知要“添加更多日志”，直到你的 stdout 看起来像 Twitch 聊天室。你在凌晨 3 点打开 Sentry，盯着一个毫无上下文的堆栈跟踪。你告诉初级工程师“按 request id 关联”，同时心里清楚一半的处理器根本没设置过它。那不是可观测性。那是带着 JSON 格式化器的希望。

**每个操作一条日志。所有上下文。无需四处搜寻。** 这就是 evlog 所做的。不是十行假装在讲故事的 `INFO`。不是“不明肉块”错误，客户端看到 `500` 而服务器看到 `Error: undefined`。一个结构化事件，包含 **为什么** 出错以及 **下一步该做什么**。

---

## 你的日志就是一场灾难。

生产环境出问题了。你打开日志查看器，盯着一墙的事件。数百行，零叙事。你滚动，你过滤，你打开三个标签页试图重建 *一个* 请求或 *一次* 任务运行发生了什么。你的一半输出是噪音（"handler started", "ok", "done"）。另一半缺失了 **user**、**cart**、**flags**，或任何能告诉你 *到底哪里坏了* 的信息。

```bash [Terminal]
$ node server.js
INFO  Starting handler
INFO  user loaded
INFO  db query ok
WARN  slow???
ERROR  Payment failed
ERROR  Error: undefined
INFO  done
```

七行。零叙事。你最后在 Slack 上问“谁动了结账？”，同时在脑海中跨日志条目拼凑碎片。**这就是你已经习惯的调试方式。** 行吧，但别再假装散落的 `console.log` 就“够用了”。

老实说，你的错误处理可能看起来是这样的：

```ts [checkout.ts]
try {
  const user = await getUser(id)
  console.log('user loaded') // 加载了什么？哪个用户？
  const result = await charge(user)
  console.log('charge ok') // 怎么 ok 的？多少金额？
} catch (e) {
  console.error(e) // 祝你好运，面对 "Error: undefined"
  throw e
}
```

没有用户上下文。没有业务数据。没有可操作的错误信息。当这在生产环境失败时，你会得到一个 Slack 讨论串，一个指向第 4 行的堆栈跟踪的 Sentry 警报，以及三位工程师花费 20 分钟拼凑发生了什么。

现在想象同样的结账流程，使用 evlog：

```json [wide-event.json]
{
  "level": "error",
  "method": "POST",
  "path": "/api/checkout",
  "status": 402,
  "duration": 142,
  "requestId": "req_8x2kf9",
  "user": { "id": "usr_29x8k2", "plan": "pro" },
  "cart": { "items": 3, "total": 9999 },
  "error": {
    "message": "Payment failed",
    "why": "Card declined by issuer",
    "fix": "Try a different payment method"
  }
}
```

一个事件。完整的故事。用户、购物车、错误、原因、修复方案。你打开仪表盘，点击该行，你 *知道* 发生了什么。无需拼凑，无需猜测。

::landing-mid-cta
::

---

## 工作原理：积累，然后发射。

你不需要手动构建那个 JSON。你在代码运行时调用 `log.set()`，在每一步添加上下文：认证结果、购物车状态、功能开关、下游延迟、同步记录。任何对 *这个* 操作重要的东西。最后，evlog 发射 **一个** 包含所有内容的事件。**level** 反映结果。错误携带 **why**、**fix** 和可选的 **link**，所以你的前端（以及凌晨 3 点的未来的你）停止逆向工程堆栈跟踪。

---

## 技术上来说，evlog 到底是个什么鬼？

TypeScript 优先的日志记录器，无处不在。框架钩子在请求边界自动创建并自动发射日志记录器。对于脚本、任务和工作流，你创建一个日志记录器，积累上下文，完成后发射。

::code-group

```ts [Nuxt]
export default defineEventHandler(async (event) => {
  const log = useLogger(event)
  const user = await getUser(event)
  log.set({ user: { id: user.id, plan: user.plan } })

  const cart = await getCart(user.id)
  log.set({ cart: { items: cart.length, total: cart.total } })

  const charge = await processPayment(cart)
  log.set({ payment: { provider: 'stripe', status: charge.status } })

  return { ok: true }
})
```

```ts [Next.js]
export const POST = withEvlog(async (request) => {
  const log = useLogger()
  const { userId } = await request.json()
  log.set({ user: { id: userId } })

  const cart = await getCart(userId)
  log.set({ cart: { items: cart.length, total: cart.total } })

  const charge = await processPayment(cart)
  log.set({ payment: { provider: 'stripe', status: charge.status } })

  return Response.json({ ok: true })
})
```

```ts [Express]
app.post('/api/checkout', async (req, res) => {
  req.log.set({ user: { id: req.body.userId } })

  const cart = await getCart(req.body.userId)
  req.log.set({ cart: { items: cart.length, total: cart.total } })

  const charge = await processPayment(cart)
  req.log.set({ payment: { provider: 'stripe', status: charge.status } })

  res.json({ ok: true })
})
```

```ts [Hono]
app.post('/api/checkout', async (c) => {
  const log = c.get('log')
  const { userId } = await c.req.json()
  log.set({ user: { id: userId } })

  const cart = await getCart(userId)
  log.set({ cart: { items: cart.length, total: cart.total } })

  const charge = await processPayment(cart)
  log.set({ payment: { provider: 'stripe', status: charge.status } })

  return c.json({ ok: true })
})
```

```ts [Fastify]
app.post('/api/checkout', async (request) => {
  request.log.set({ user: { id: request.body.userId } })

  const cart = await getCart(request.body.userId)
  request.log.set({ cart: { items: cart.length, total: cart.total } })

  const charge = await processPayment(cart)
  request.log.set({ payment: { provider: 'stripe', status: charge.status } })

  return { ok: true }
})
```

```ts [SvelteKit]
export const POST = (async ({ locals }) => {
  const log = locals.log
  const userId = locals.user.id
  log.set({ user: { id: userId } })

  const cart = await getCart(userId)
  log.set({ cart: { items: cart.length, total: cart.total } })

  const charge = await processPayment(cart)
  log.set({ payment: { provider: 'stripe', status: charge.status } })

  return json({ ok: true })
}) satisfies RequestHandler
```

```ts [React Router]
export async function action({ context }: Route.ActionArgs) {
  const log = context.get(loggerContext)
  const userId = formData.get('userId')
  log.set({ user: { id: userId } })

  const cart = await getCart(userId)
  log.set({ cart: { items: cart.length, total: cart.total } })

  const charge = await processPayment(cart)
  log.set({ payment: { provider: 'stripe', status: charge.status } })

  return { ok: true }
}
```

```json [Result]
{
  "level": "info",
  "method": "POST",
  "path": "/api/checkout",
  "status": 200,
  "duration": 94,
  "requestId": "req_8x2kf9",
  "user": { "id": "usr_29x8k2", "plan": "pro" },
  "cart": { "items": 3, "total": 9999 },
  "payment": { "provider": "stripe", "status": "succeeded" }
}
```

::

相同的代码模式，相同的输出，每个框架都是如此。开发环境中人类可读，生产环境中结构化 JSON。

::landing-stats
::

---

## 为什么它他喵的很棒

### 0 个传递依赖

没有 peer deps，没有 polyfills，没有打包工具麻烦。没什么可审计的，没什么会在下一个 Node LTS 上崩溃。只要一个 `bun add evlog` 你就完成了。

### 12 个框架，相同的 API

Nuxt, Next.js, SvelteKit, Nitro, Express, Fastify, Hono, Elysia, NestJS, React Router, TanStack Start, Cloudflare Workers。添加中间件，获得宽事件。切换框架，保持相同的 `log.set()` 模式。

### 8 个输出适配器，即插即用

Axiom, OTLP (Grafana, Honeycomb), Datadog, Sentry, PostHog, Better Stack, HyperDX, 文件系统。两行配置。异步，批量，带外。你的用户不需要等待你的日志管道。

### AI SDK 集成，内置

包装模型一次。Token 用量，工具调用，流式指标，成本估算，多步代理，缓存命中，推理 token — 全部落入 **同一个** 宽事件。添加工具执行耗时和总生成实际耗时的遥测集成。

```ts [server/api/chat.post.ts]
const ai = createAILogger(log, {
  toolInputs: { maxLength: 500 },
  cost: { 'claude-sonnet-4.6': { input: 3, output: 15 } },
})
const result = streamText({
  model: ai.wrap('anthropic/claude-sonnet-4.6'),
  messages,
})
```

多步代理，嵌入，成本估算 — 零额外代码。无回调冲突。无需单独的 AI 可观测性管道。

### PII 自动脱敏，零配置

生产环境默认启用。信用卡变成 `****1111`，邮箱变成 `a***@***.com`，IP，电话号码，JWT，IBAN — 全部在你的控制台或输出端看到之前智能掩码。无需记住标志，无需手动清理辅助函数，无需遗忘的字段泄露到 Axiom。GDPR 合规不应该需要一个冲刺阶段。

### 头部 + 尾部采样

在生产环境丢弃 90% 的 `info`，保留 100% 的错误，强制保留任何慢于 1 秒的内容。两个配置块，无自定义代码。停止存储噪音并错过事故。

### 带有 `why` 和 `fix` 的结构化错误

服务器端 `createError({ why, fix, link })`。客户端 `parseError()`。你的错误提示框终于告诉用户 *出了什么问题* 以及 *该怎么做*。你的值班人员终于停止逆向工程堆栈跟踪。

### 用于代理和脚本的文件系统输出端

写入 NDJSON 到磁盘。你的 AI 代理、脚本和队友查询结构化事件 **无需 Datadog 订阅**。宽事件适用于事故和评估。

---

## “但是等等…"

### “我已经在用 pino 了。”

pino 给你快速的逐行 JSON。evlog 给你那个 **加上** 宽事件，带有 `why`/`fix`/`link` 的结构化错误，头部 + 尾部采样，八个输出适配器，带有完整 o11y 的 AI SDK 集成，以及十二个框架的自动插桩。零传递依赖，更轻的安装，同样的工作做得更好。pino 是标准。evlog 是下一代。

### “我已经有 Sentry / Datadog 了。”

很好，他们会得到更好的数据。现在你的警报触发，你打开一个满是 `INFO handler started` 行的仪表盘。使用 evlog，一个宽事件作为 **单个可查询行** 落地：用户，购物车，耗时，开关，错误，修复。按 `status >= 400` 过滤，按 `user.plan` 分组，完成。Sentry 适配器和 OTLP 适配器各需两行配置。

### “又一个依赖项？”

一个包，零传递依赖。替代方案是又一个季度的猜测。你决定。

### “我们下个冲刺阶段会‘清理日志’。”

不，你不会。现在就发布这个模式，或者永远继续艰难地调试。

---

## 还在这儿？很好。

你读到了这里，这意味着你的日志可能很差，而且你知道。当你添加 evlog 时会发生什么：

**第 1 天**：你添加中间件。你的路由开始发射宽事件。你打开第一个仪表盘查询，意识到你可以按 `user.plan`，`cart.total`，`status` 过滤。你从未拥有过那个。

**第 1 周**：一个支付 bug 击中生产环境。代替通常的 30 分钟 Slack 讨论串，有人打开事件，看到 `why: "Card declined by issuer"`，并在两分钟内关闭工单。

**第 1 个月**：你的 AI 路由在每个事件中都有 token 用量和工具调用数据。你的采样配置丢弃 90% 的噪音。你的值班轮班变短了。你停止在冲刺复盘会中写“添加更好的日志”。

这不是空想。这是当你停止将日志记录视为事后补救时，结构化宽事件所做的。

::landing-badges
::

::landing-ctas
::
