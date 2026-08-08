<!---
☝️ PR 标题应遵循 conventional commits（https://conventionalcommits.org）
以下是可用的类型和范围：


### 类型
- breaking（会导致现有功能发生变化的修复或功能）💥
- feat（添加功能的非破坏性变更）✨
- fix（修复问题的非破坏性变更）🐞
- build（影响构建系统或外部依赖的变更）🏗
- ci（更改我们的 CI 配置文件和脚本）🚀
- docs（更新文档或 readme）📖
- enhancement（改进现有功能）🌈
- chore（更新构建流程或辅助工具和库）📦
- perf（提升性能的代码变更）⚡️
- style（不影响代码含义的变更）💅
- test（新增或更新测试）🧪
- refactor（既不修复 bug 也不添加功能的代码变更）🛠
- revert（撤销之前的提交）🔄

### 范围
当变更具有跨切面影响或影响整个仓库时，请省略范围。仅在指向某一个子系统时使用范围；整个 monorepo 是 `evlog`，因此 `evlog` 不是一个范围。

- ai（AI SDK 集成）
- axiom（Axiom 日志排出适配器）
- bench（基准测试）
- better-auth（Better Auth 集成）
- better-stack（Better Stack 日志排出适配器）
- clickhouse（ClickHouse 日志排出适配器）
- cli（`@evlog/cli` 包）
- core（日志记录器、管道、错误、脱敏、目录内部模块）
- datadog（Datadog 日志排出适配器）
- deps（依赖项）
- docs（文档网站）
- dx（开发者体验改进）
- elysia（Elysia 插件）
- eve（eve 代理集成）
- evi（Evi 代理）
- express（Express 中间件）
- fastify（Fastify 插件）
- fs（文件系统日志排出适配器）
- hono（Hono 中间件）
- hyperdx（HyperDX 日志排出适配器）
- loki（Grafana Loki 日志排出适配器）
- nestjs（NestJS 中间件）
- next（Next.js 集成）
- nitro（Nitro 插件）
- nuxt（Nuxt 模块）
- orpc（oRPC 集成）
- otlp（OTLP 日志排出适配器）
- playground（playground 应用）
- posthog（PostHog 日志排出适配器）
- react-router（React Router 集成）
- release（发布工作流 / 发布）
- repo（仓库：工具、CI、脚本、根配置）
- sentry（Sentry 日志排出适配器）
- stream（进程内流和流服务器）
- sveltekit（SvelteKit 集成）
- tanstack-start（TanStack Start 集成）
- telemetry（`@evlog/telemetry` 包）
- vite（Vite 插件）
- workers（Cloudflare Workers 适配器）
-->

### 🔗 关联 issue

<!-- 如果它解决了一个未关闭的 issue，请在此处链接该 issue。例如“解决 #123” -->

### 📚 描述

<!-- 详细描述你的更改 -->
<!-- 为什么需要这次更改？它解决了什么问题？ -->

### 📝 清单

<!-- 请在所有适用的复选框中打上 `x`。 -->
<!-- 如果你的更改需要文档 PR，请以适当方式链接。 -->
<!-- 如果你对其中任何一项不确定，请随时提问。我们随时乐意帮助！ -->

- [ ] 我已关联一个 issue 或讨论。
- [ ] 我已相应更新文档。
