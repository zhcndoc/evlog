# 适配器源码模板

使用公共工具包原语 `defineHttpDrain` + `resolveAdapterConfig` 的 `packages/evlog/src/adapters/{name}.ts` 完整 TypeScript 模板。

将 `{Name}`、`{name}` 和 `{NAME}` 替换为实际的服务名称。

```typescript
import type { WideEvent } from '../types'
import type { ConfigField } from '../shared/config'
import { resolveAdapterConfig } from '../shared/config'
import { defineHttpDrain } from '../shared/drain'

// --- 1. 配置接口 -------------------------------------------------
// 服务特定字段。标准名称：apiKey、endpoint、serviceName、timeout。

export interface {Name}Config {
  /** {Name} API 密钥 */
  apiKey: string
  /** {Name} API 端点。默认值：https://api.{name}.com */
  endpoint?: string
  /** 请求超时时间（毫秒）。默认值：5000 */
  timeout?: number
  // 在此处添加服务特定字段（dataset、project、region 等）
}

// 字段清单 — 同时驱动 resolveAdapterConfig 和感知运行时配置的
// drain 初始化。
const FIELDS: ConfigField<{Name}Config>[] = [
  { key: 'apiKey', env: ['NUXT_{NAME}_API_KEY', '{NAME}_API_KEY'] },
  { key: 'endpoint', env: ['NUXT_{NAME}_ENDPOINT', '{NAME}_ENDPOINT'] },
  { key: 'timeout' },
]

// --- 2. 事件转换（可选） ----------------------------------
// 如果服务需要特定形状，请暴露一个转换器，以便能够单独测试。
// 否则在 encode 中直接传递 `events`。

export interface {Name}Event {
  timestamp: string
  level: string
  data: Record<string, unknown>
}

/** 将 WideEvent 转换为 {Name} 的事件格式。 */
export function to{Name}Event(event: WideEvent): {Name}Event {
  const { timestamp, level, ...rest } = event
  return { timestamp, level, data: rest }
}

// --- 3. Encode 辅助函数（纯函数，易于测试） -------------------------------
function build{Name}Payload(events: WideEvent[], config: {Name}Config) {
  const endpoint = (config.endpoint ?? 'https://api.{name}.com').replace(/\/$/, '')
  return {
    url: `${endpoint}/v1/ingest`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(events.map(to{Name}Event)),
  }
}

// --- 4. 直接发送辅助函数 ----------------------------------------------
// 导出以便直接使用和测试。

/** 向 {Name} 发送单个事件。 */
export async function sendTo{Name}(event: WideEvent, config: {Name}Config): Promise<void> {
  await sendBatchTo{Name}([event], config)
}

/** 向 {Name} 发送一批事件。 */
export async function sendBatchTo{Name}(
  events: WideEvent[],
  config: {Name}Config,
): Promise<void> {
  if (events.length === 0) return

  const { url, headers, body } = build{Name}Payload(events, config)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeout ?? 5000)

  try {
    const response = await fetch(url, { method: 'POST', headers, body, signal: controller.signal })
    if (!response.ok) {
      const text = await response.text().catch(() => 'Unknown error')
      const safe = text.length > 200 ? `${text.slice(0, 200)}...[truncated]` : text
      throw new Error(`{Name} API 错误：${response.status} ${response.statusText} - ${safe}`)
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

// --- 5. 基于 `defineHttpDrain` 构建工厂 ------------------------------
/**
 * 创建一个用于向 {Name} 发送日志的 drain 函数。
 *
 * 配置优先级（从高到低）：
 * 1. 传递给 create{Name}Drain() 的覆盖项
 * 2. runtimeConfig.evlog.{name}
 * 3. runtimeConfig.{name}
 * 4. 环境变量：NUXT_{NAME}_*、{NAME}_*
 *
 * @example
 * ```ts
 * import { create{Name}Drain } from 'evlog/{name}'
 *
 * // 零配置 — 设置 NUXT_{NAME}_API_KEY 环境变量
 * defineEvlog({ drain: create{Name}Drain() })
 *
 * // 使用覆盖项
 * defineEvlog({ drain: create{Name}Drain({ apiKey: 'my-key' }) })
 * ```
 */
export function create{Name}Drain(overrides?: Partial<{Name}Config>) {
  return defineHttpDrain<{Name}Config>({
    name: '{name}',
    timeout: overrides?.timeout,
    resolve: async () => {
      const config = await resolveAdapterConfig<{Name}Config>('{name}', FIELDS, overrides)
      if (!config.apiKey) {
        console.error('[evlog/{name}] 缺少 apiKey。请设置 NUXT_{NAME}_API_KEY 环境变量或传递给 create{Name}Drain()')
        return null
      }
      return config as {Name}Config
    },
    encode: (events, config) => build{Name}Payload(events, config),
  })
}
```

## 自定义说明

- **认证方式**：某些服务使用 `Authorization: Bearer`，其他服务使用自定义请求头，例如 `X-API-Key`。请调整 `build{Name}Payload` 中的 `headers`。
- **载荷格式**：某些服务接受原始 JSON 数组（Axiom），其他服务需要包装对象（PostHog `{ api_key, batch }`），还有些需要特定协议结构（OTLP）。请相应调整 `build{Name}Payload`。
- **事件转换**：如果服务期望特定的 schema，请实现 `to{Name}Event()`。如果它接受任意 JSON，则直接发送 `events`。
- **自定义传输**：如果服务确实无法适配 `defineHttpDrain`（例如二进制封装、gRPC），则改用 `../shared/drain` 中的 `defineDrain`，并显式调用 `httpPost`（来自 `../shared/http`）。
- **已弃用别名**：当重命名配置字段时（例如 `token` → `apiKey`），请同时保留两者作为 `ConfigField` 条目，并在 `resolve()` 中兼容处理。模式请参见 `axiom.ts` 和 `better-stack.ts`。
