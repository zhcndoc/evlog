# Enricher 源代码模板

用于使用 `defineEnricher` 向 `packages/evlog/src/enrichers/index.ts` 添加新的 enricher 的模板。

将 `{Name}`、`{name}` 和 `{DISPLAY}` 替换为实际的 enricher 名称。

## 信息接口

定义输出形状：

```typescript
export interface {Name}Info {
  /** 字段的描述 */
  field1?: string
  /** 字段的描述 */
  field2?: number
}
```

## 工厂函数

```typescript
import type { EnrichContext } from '../types'
import { defineEnricher, type EnricherOptions } from '../shared/enricher'
import { getHeader, normalizeNumber } from '../shared/headers'

/**
 * 使用 {DISPLAY} 数据丰富事件。
 * 使用 `{Name}Info` 形状设置 `event.{name}`：`{ field1?, field2? }`。
 */
export function create{Name}Enricher(options: EnricherOptions = {}): (ctx: EnrichContext) => void {
  return defineEnricher<{Name}Info>({
    name: '{name}',
    field: '{name}',
    compute: ({ headers }) => {
      const value = getHeader(headers, 'x-my-header')
      if (!value) return undefined
      return {
        field1: value,
        field2: normalizeNumber(value),
      }
    },
  }, options)
}
```

## 架构规则

1. **使用工具包原语**：使用来自 `../shared/enricher`（重新导出为 `evlog/toolkit`）的 `defineEnricher<T>({ name, field, compute }, options)`。
2. **使用工具包辅助函数**：使用来自 `../shared/headers` 的 `getHeader()` 进行不区分大小写的请求头查找，并使用 `normalizeNumber()` 处理数字字符串。
3. **单一事件字段**——每个 enrichers 在 `ctx.event` 上写入一个顶层字段（通过 `field` 选项声明）。
4. **返回 `undefined` 以跳过**——`compute` 返回 `undefined` 时，enricher 对该事件不执行任何操作（不合并字段，不产生错误）。
5. **工厂模式**——始终将 `defineEnricher` 包装在 `create{Name}Enricher(options?)` 工厂中，并返回其结果（直接返回，或在固定顶层字段时通过规则 7 的闭包包装器返回）。
6. **不要使用 try/catch**——`defineEnricher` 已经隔离错误（记录为 `[evlog/{name}] enrich failed:`，且永远不会向管道抛出错误）。
7. **不要在 `compute` 之外进行变更**——让 `defineEnricher` 通过 `mergeEventField` 处理合并。唯一允许的例外是：除了 enrichers 自身的字段外固定顶层字段，此操作通过将 `defineEnricher` 的结果包装在闭包中完成（参见 `createTraceContextEnricher`，它还会设置 `event.traceId` / `event.spanId`）。
8. **组合**——要将多个 enrichers 组合到一个回调中，请使用来自 `../shared/compose` 的 `composeEnrichers`（`createDefaultEnrichers()` 正是以此方式构建的），而不是手动循环。

## 可用辅助函数

这些辅助函数从 `../shared/headers`（以及 `evlog/toolkit`）导出：

```typescript
// 不区分大小写的请求头查找
function getHeader(headers: Record<string, string> | undefined, name: string): string | undefined

// 将字符串解析为数字，对非有限值返回 undefined
function normalizeNumber(value: string | undefined): number | undefined
```

对于更底层的合并（很少需要），工具包还从 `../shared/event` 导出 `mergeEventField`。

## 数据源

增强器通常从 `ctx` 中读取：

- **`ctx.headers`** — HTTP 请求头（敏感请求头已被过滤）
- **`ctx.response?.headers`** — HTTP 响应头
- **`ctx.response?.status`** — HTTP 响应状态码
- **`ctx.request`** — 请求元数据（方法、路径、requestId）
- **`process.env`** — 环境变量（用于部署元数据）
- **`ctx.event`** — 事件本身（用于计算/派生字段）。
