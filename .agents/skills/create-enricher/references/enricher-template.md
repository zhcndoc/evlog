# Enricher 源模板

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

1. **使用工具包原语**：来自 `../shared/enricher` 的 `defineEnricher<T>({ name, field, compute }, options)`（重新导出为 `evlog/toolkit`）。
2. **使用工具包辅助函数**：用于大小写不敏感请求头查找的 `getHeader()`，以及用于数字字符串的 `normalizeNumber()` —— 二者都来自 `../shared/headers`。
3. **单个事件字段** —— 每个 enricher 在 `ctx.event` 上写入一个顶级字段（通过 `field` 选项声明）。
4. **返回 `undefined` 以跳过** —— `compute` 返回 `undefined` 会使该 enricher 对该事件不执行任何操作（不合并字段，也不报错）。
5. **工厂模式** —— 始终将 `defineEnricher` 包装在 `create{Name}Enricher(options?)` 工厂中并返回其结果。
6. **不要使用 try/catch** —— `defineEnricher` 已经隔离了错误（记录为 `[evlog/{name}]`，且不会向管道抛出异常）。
7. **不要在 `compute` 之外进行修改** —— 让 `defineEnricher` 通过 `mergeEventField` 处理合并。

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

Enricher 通常从 `ctx` 中读取：

- **`ctx.headers`** — HTTP 请求头（敏感请求头已被过滤）
- **`ctx.response?.headers`** — HTTP 响应头
- **`ctx.response?.status`** — HTTP 响应状态码
- **`ctx.request`** — 请求元数据（方法、路径、requestId）
- **`process.env`** — 环境变量（用于部署元数据）
- **`ctx.event`** — 事件本身（用于计算/派生字段）
