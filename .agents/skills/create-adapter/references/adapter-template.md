# 适配器源码模板

适用于 `packages/evlog/src/adapters/{name}.ts` 的完整 TypeScript 模板，使用公共工具包原语 `defineHttpDrain` + `resolveAdapterConfig`。参考最新的适配器（`loki.ts`、`clickhouse.ts`）。

将 `{Name}`、`{name}` 和 `{NAME}` 替换为实际的服务名称。

```typescript
import type { WideEvent } from '../types'
import type { ConfigField } from '../shared/config'
import { formatPublicEnvKeys, resolveAdapterConfig } from '../shared/config'
import type { HttpDrainRequest } from '../shared/drain'
import { defineHttpDrain, sendEncodedDrainRequest } from '../shared/drain'

// --- 1. 配置接口 ---------------------------------------------------------
// 服务专用字段。标准名称：apiKey、endpoint、serviceName、
// timeout、retries。

export interface {Name}Config {
  /** {Name} API 密钥 */
  apiKey: string
  /** {Name} API 端点。默认值：https://api.{name}.com */
  endpoint?: string
  /** 请求超时时间（毫秒）。默认值：5000 */
  timeout?: number
  /** 发生临时故障时的重试次数。默认值：2 */
  retries?: number
  // 在此处添加服务专用字段（dataset、project、region 等）
}

// 字段清单——驱动 resolveAdapterConfig（覆盖项 → runtimeConfig.evlog.{name}
// → runtimeConfig.{name} → 环境变量）。优先使用 NUXT_-前缀的键，以便静默兼容 Nuxt。
const {NAME}_FIELDS: ConfigField<{Name}Config>[] = [
  { key: 'apiKey', env: ['NUXT_{NAME}_API_KEY', '{NAME}_API_KEY'] },
  { key: 'endpoint', env: ['NUXT_{NAME}_ENDPOINT', '{NAME}_ENDPOINT'] },
  { key: 'timeout' },
  { key: 'retries' },
]

// --- 2. 事件转换（条件性内容——当服务接受任意 JSON 时删除整个部分）----
// 如果服务需要特定的数据结构，请导出一个转换器，以便单独进行测试。
// 如果删除此部分，编码器主体将变为
// `JSON.stringify(events)`，并且 test-template.md 中的转换器测试也会被删除——
// 不要为了保持对称性而保留一个透传转换器。

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

// --- 3. 编码器（私有，由 drain 和直接发送辅助函数共享）-----------------
// 包含请求所需的一切内容，不执行 I/O。这个单一函数确保
// createXDrain() 和 sendBatchToX() 始终保持一致——编码一致性由
// test/adapters/encode-parity.test.ts 固定测试。

function encode{Name}Request(events: WideEvent[], config: {Name}Config): HttpDrainRequest {
  const endpoint = (config.endpoint ?? 'https://api.{name}.com').replace(/\/+$/, '')
  return {
    url: `${endpoint}/v1/ingest`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(events.map(to{Name}Event)),
  }
}

// --- 4. 基于 `defineHttpDrain` 构建工厂函数 ------------------------------
/**
 * 创建一个将宽事件发送到 [{Name}](https://{name}.com/docs) 的 drain。
 *
 * 配置优先级（从高到低）：
 * 1. 传递给 create{Name}Drain() 的覆盖项
 * 2. runtimeConfig.evlog.{name}
 * 3. runtimeConfig.{name}
 * 4. 环境变量：{NAME}_*
 *
 * @example
 * ```ts
 * import { create{Name}Drain } from 'evlog/{name}'
 *
 * // 零配置——设置 {NAME}_API_KEY 环境变量
 * initLogger({ drain: create{Name}Drain() })
 *
 * // 使用覆盖项
 * initLogger({ drain: create{Name}Drain({ apiKey: 'my-key' }) })
 * ```
 */
export function create{Name}Drain(overrides?: Partial<{Name}Config>) {
  return defineHttpDrain<{Name}Config>({
    name: '{name}',
    label: '{Name}',
    resolve: async () => {
      const config = await resolveAdapterConfig<{Name}Config>('{name}', {NAME}_FIELDS, overrides)
      if (!config.apiKey) {
        // 返回 null 会跳过此批次：不发送请求，也不会抛出异常——但会记录
        // 缺失信息，以便在控制台中发现配置错误的部署。
        console.error(`[evlog/{name}] Missing apiKey. Set ${formatPublicEnvKeys(['NUXT_{NAME}_API_KEY', '{NAME}_API_KEY'])} env var or pass apiKey to create{Name}Drain()`)
        return null
      }
      return config as {Name}Config
    },
    encode: encode{Name}Request,
  })
}

// --- 5. 直接发送辅助函数 ----------------------------------------------
// 使用相同的编码器和传输包装器——绝不能使用单独的 fetch 路径。

/** 向 {Name} 发送单个宽事件。 */
export async function sendTo{Name}(event: WideEvent, config: {Name}Config): Promise<void> {
  await sendBatchTo{Name}([event], config)
}

/** 在一个请求中向 {Name} 发送一批宽事件。 */
export async function sendBatchTo{Name}(events: WideEvent[], config: {Name}Config): Promise<void> {
  if (events.length === 0) return
  await sendEncodedDrainRequest(encode{Name}Request(events, config), {
    label: '{Name}',
    source: '{name}',
    timeout: config.timeout,
    retries: config.retries,
  })
}
```

## `defineHttpDrain` / `sendEncodedDrainRequest` 为你处理的事项

- 规范化 `DrainContext | DrainContext[]`，并在批次为空时提前返回
- 当 `resolve()` 返回 `null` 时静默跳过
- 通过 `httpPost`（`../shared/http`）传输：超时（默认 5000ms）、重试（默认 2 次）、evlog 身份标头（`User-Agent: evlog/x.y.z`、`X-Evlog-Source`）
- 错误日志记录（`[evlog/{name}] Failed to send events:`），且不会将异常抛入请求处理流程中

## 自定义说明

- **认证方式**：某些服务使用 `Authorization: Bearer`，其他服务使用自定义请求头（`X-API-Key`、ClickHouse 的 `X-ClickHouse-User`/`X-ClickHouse-Key`）或 HTTP Basic（Loki + Grafana Cloud）。调整 `encode{Name}Request` —— 优先使用请求头而不是查询参数，以确保凭据不会出现在服务器端查询日志中。
- **负载格式**：原始 JSON 数组（Axiom）、包装对象（PostHog `{ api_key, batch }`）、协议结构（OTLP）、NDJSON 风格的请求体（ClickHouse `JSONEachRow`）。调整编码器；当转换并非简单操作时，导出中间构建器（`build{Name}Payload`）。
- **非 HTTP 传输**：如果服务无法适配 `defineHttpDrain`，请使用 `defineDrain<TConfig>({ name, resolve, send })` —— 参见 `fs.ts` 和 `memory.ts`。
- **已弃用的别名**：重命名配置字段时（例如 `token` → `apiKey`），保留两个 `ConfigField` 条目，并通过 `../shared/config` 中的 `applyDeprecatedAlias(config, { adapter, from, to })` 进行映射。参见 `axiom.ts` 和 `better-stack.ts`。
- **边缘环境安全性**：不要使用 `Buffer`（使用 `TextEncoder` + `btoa` 实现 Basic 认证 —— 参见 `loki.ts` 中的 `toBasicCredentials`），不要导入仅适用于 Node 的模块。如果某个运行时确实无法支持，请在 `resolve()` 中返回 `null`，并发出一次性警告（参见 `fs.ts` 中的 `isEdgeRuntime()`）。
