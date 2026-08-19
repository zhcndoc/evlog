# 测试模板

`packages/evlog/test/adapters/{name}.test.ts` 的完整测试模板，遵循 `packages/evlog/test/README.md` 中的约定。`loki.test.ts` 和 `clickhouse.test.ts` 是最新的参考实现。

将 `{Name}`、`{name}`、`{NAME}` 替换为实际的服务名称。

此处适用的测试 README 规则：

- 使用 `mockFetch()` + `getFetchCall` / `getFetchJson` / `getFetchHeaders`（来自 `../helpers/fetch`），不要在适配器测试中手动创建 fetch spy（少数较旧的文件仍然这样做；请遵循这些辅助函数，而不是参考旧文件）。
- 在 `afterEach` 中删除适配器读取的每一个环境变量。泄漏的环境变量会导致后续测试依赖执行顺序。
- 在独立的 `describe` 块中测试导出的纯辅助函数（`to{Name}Event`、`build{Name}Payload`、URL 解析器），但只测试适配器实际导出的函数。如果适配器没有转换器（服务接受任意 JSON），则完全删除 `to{Name}Event` 的导入及其 `describe` 块。
- 不要使用 `!` 非空断言；如果需要缩小类型范围，请使用来自 `../helpers/defined` 的 `defined()`。
- 在 `encode-parity.test.ts` 中注册适配器，以确保 drain 和 `sendBatchTo{Name}` 使用相同的编码器（目前并非每个已有适配器都已注册；新适配器应该注册）。

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WideEvent } from '../../src/types'
import { getFetchCall, getFetchHeaders, getFetchJson, mockFetch } from '../helpers/fetch'
import {
  create{Name}Drain,
  sendBatchTo{Name},
  sendTo{Name},
  to{Name}Event,
} from '../../src/adapters/{name}'

function createTestEvent(overrides?: Partial<WideEvent>): WideEvent {
  return {
    timestamp: '2024-01-01T12:00:00.000Z',
    level: 'info',
    service: 'api',
    environment: 'production',
    ...overrides,
  }
}

describe('{name} adapter', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = mockFetch(new Response(null, { status: 200 }))
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.NUXT_{NAME}_API_KEY
    delete process.env.NUXT_{NAME}_ENDPOINT
    delete process.env.{NAME}_API_KEY
    delete process.env.{NAME}_ENDPOINT
  })

  // --- 1. 纯函数辅助函数 ---------------------------------------------------
  describe('to{Name}Event', () => {
    it('maps a wide event to the service shape', () => {
      const event = createTestEvent({ path: '/api/users' })
      expect(to{Name}Event(event)).toEqual({
        timestamp: '2024-01-01T12:00:00.000Z',
        level: 'info',
        data: { service: 'api', environment: 'production', path: '/api/users' },
      })
    })
  })

  // --- 2. 直接发送：URL、请求头、请求体 ---------------------------------
  describe('sendTo{Name}', () => {
    it('sends to the default endpoint', async () => {
      await sendTo{Name}(createTestEvent(), { apiKey: 'test-key' })

      const { url } = getFetchCall(fetchSpy)
      expect(url).toBe('https://api.{name}.com/v1/ingest')
    })

    it('uses a custom endpoint and tolerates trailing slashes', async () => {
      await sendTo{Name}(createTestEvent(), {
        apiKey: 'test-key',
        endpoint: 'https://custom.{name}.com/',
      })

      const { url } = getFetchCall(fetchSpy)
      expect(url).toBe('https://custom.{name}.com/v1/ingest')
    })

    it('sets auth and content-type headers', async () => {
      await sendTo{Name}(createTestEvent(), { apiKey: 'my-secret-key' })

      const headers = getFetchHeaders(fetchSpy)
      expect(headers.Authorization).toBe('Bearer my-secret-key')
      expect(headers['Content-Type']).toBe('application/json')
    })

    it('sends the event in the service format', async () => {
      await sendTo{Name}(createTestEvent({ action: 'test-action' }), { apiKey: 'test-key' })

      const body = getFetchJson(fetchSpy)
      // 根据服务所需的请求负载结构进行调整
      expect(body).toBeInstanceOf(Array)
      expect(body).toHaveLength(1)
    })
  })

  // --- 3. 批量操作 -------------------------------------------------
  describe('sendBatchTo{Name}', () => {
    it('sends multiple events in one request', async () => {
      const events = [
        createTestEvent({ requestId: '1' }),
        createTestEvent({ requestId: '2' }),
        createTestEvent({ requestId: '3' }),
      ]

      await sendBatchTo{Name}(events, { apiKey: 'test-key' })

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(getFetchJson(fetchSpy)).toHaveLength(3)
    })

    it('skips fetch when the batch is empty', async () => {
      await sendBatchTo{Name}([], { apiKey: 'test-key' })
      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })

  // --- 4. Drain 工厂：配置解析 + 跳过行为 ------------------
  describe('create{Name}Drain', () => {
    it('resolves config from env vars', async () => {
      process.env.{NAME}_API_KEY = 'env-key'
      const drain = create{Name}Drain()

      await drain({ event: createTestEvent() })

      const headers = getFetchHeaders(fetchSpy)
      expect(headers.Authorization).toBe('Bearer env-key')
    })

    // “跳过”意味着：不发起请求，也不抛出异常。适配器仍会针对缺失的密钥调用 console.error
    // （已由 beforeEach 中的 spy 抑制），以便让配置错误可见。
    it('skips the request when apiKey is missing', async () => {
      const drain = create{Name}Drain()

      await drain({ event: createTestEvent() })

      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('accepts an array of drain contexts', async () => {
      const drain = create{Name}Drain({ apiKey: 'test-key' })

      await drain([
        { event: createTestEvent({ requestId: '1' }) },
        { event: createTestEvent({ requestId: '2' }) },
      ])

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(getFetchJson(fetchSpy)).toHaveLength(2)
    })
  })
})
```

## 自定义说明

- **URL 断言**：将预期 URL 更新为实际的服务 API；如果编码器能够容忍路径已存在的情况，也要包含该情况（参见 `resolveLokiPushUrl`）。
- **身份验证请求头**：与服务保持一致（`X-API-Key`、HTTP Basic、`X-ClickHouse-User` 等）。
- **请求体格式**：包装对象（PostHog 的 `{ api_key, batch }`）、原始数组（Axiom）、NDJSON（ClickHouse）。断言真实结构，而不只是断言“是一个数组”。
- **已弃用的别名**：如果适配器支持别名（`token` → `apiKey`），添加测试以确保别名仍然能够解析，并且同时设置两者时规范名称优先。
- **错误吞噬**：drain 本身永远不会抛出异常。该约定由 `defineHttpDrain` 实现，并在 `test/toolkit/toolkit.test.ts` 中覆盖；不要在每个适配器中重复测试。只有直接辅助函数会暴露错误。
- **服务专用辅助函数**：每个导出的辅助函数（`buildLokiPayload`、`toClickHouseRow`、严重性映射器等）都应有自己的 `describe`，并覆盖边界情况（空输入、格式错误的时间戳、基数限制）。

## 超越单元测试

- **编码一致性**：将适配器添加到 `test/adapters/encode-parity.test.ts`。
- **端到端测试**：创建由适配器环境变量控制的 `test/e2e/{name}.e2e.ts`；当服务可自行托管时，扩展 `test/e2e/docker-compose.yml` + `seed.mjs`。
