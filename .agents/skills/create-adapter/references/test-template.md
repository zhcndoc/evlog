# 测试模板

`packages/evlog/test/adapters/{name}.test.ts` 的完整测试模板。

将 `{Name}`、`{name}` 替换为实际的服务名称。

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WideEvent } from '../../src/types'
import { sendBatchTo{Name}, sendTo{Name} } from '../../src/adapters/{name}'

describe('{name} adapter', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  // --- 设置：模拟 globalThis.fetch 返回 200 ---
  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 }),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // --- 测试事件工厂 ---
  const createTestEvent = (overrides?: Partial<WideEvent>): WideEvent => ({
    timestamp: '2024-01-01T12:00:00.000Z',
    level: 'info',
    service: 'test-service',
    environment: 'test',
    ...overrides,
  })

  // --- 1. URL 构造 ---
  describe('sendTo{Name}', () => {
    it('发送事件到正确的 URL', async () => {
      const event = createTestEvent()

      await sendTo{Name}(event, {
        apiKey: 'test-key',
      })

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const [url] = fetchSpy.mock.calls[0] as [string, RequestInit]
      // 验证默认端点 URL
      expect(url).toBe('https://api.{name}.com/v1/ingest')
    })

    it('在提供自定义端点时使用自定义端点', async () => {
      const event = createTestEvent()

      await sendTo{Name}(event, {
        apiKey: 'test-key',
        endpoint: 'https://custom.{name}.com',
      })

      const [url] = fetchSpy.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('https://custom.{name}.com/v1/ingest')
    })

    // --- 2. 请求头 ---
    it('设置正确的 Authorization 请求头', async () => {
      const event = createTestEvent()

      await sendTo{Name}(event, {
        apiKey: 'my-secret-key',
      })

      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit]
      expect(options.headers).toEqual(expect.objectContaining({
        'Authorization': 'Bearer my-secret-key',
      }))
    })

    it('将 Content-Type 设置为 application/json', async () => {
      const event = createTestEvent()

      await sendTo{Name}(event, {
        apiKey: 'test-key',
      })

      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit]
      expect(options.headers).toEqual(expect.objectContaining({
        'Content-Type': 'application/json',
      }))
    })

    // 在此添加服务特定的请求头测试
    // 示例：orgId、project 请求头、region 请求头等。

    // --- 3. 请求体 ---
    it('以正确的格式发送事件', async () => {
      const event = createTestEvent({ action: 'test-action', userId: '123' })

      await sendTo{Name}(event, {
        apiKey: 'test-key',
      })

      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(options.body as string)
      // 验证请求体符合预期格式
      // 根据服务的预期负载结构进行调整
      expect(body).toBeInstanceOf(Array)
      expect(body).toHaveLength(1)
    })

    // --- 4. 错误处理（只有直接辅助函数会抛出错误——
    //      drain 本身会通过 `defineHttpDrain` 吞掉错误，
    //      因此请求流水线永远不会被中断；这一契约由
    //      `test/toolkit.test.ts` 覆盖。）
    it('在非 OK 响应时抛出错误', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response('Bad Request', { status: 400, statusText: 'Bad Request' }),
      )

      const event = createTestEvent()

      await expect(sendTo{Name}(event, {
        apiKey: 'test-key',
      })).rejects.toThrow('{Name} API error: 400 Bad Request')
    })
  })

  // --- 5. 批量操作 ---
  describe('sendBatchTo{Name}', () => {
    it('在单个请求中发送多个事件', async () => {
      const events = [
        createTestEvent({ requestId: '1' }),
        createTestEvent({ requestId: '2' }),
        createTestEvent({ requestId: '3' }),
      ]

      await sendBatchTo{Name}(events, {
        apiKey: 'test-key',
      })

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(options.body as string)
      expect(body).toHaveLength(3)
    })

    it('当事件数组为空时跳过 fetch', async () => {
      await sendBatchTo{Name}([], {
        apiKey: 'test-key',
      })

      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })

  // --- 6. 超时处理 ---
  describe('timeout handling', () => {
    it('使用默认 5000ms 超时', async () => {
      const event = createTestEvent()
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

      await sendTo{Name}(event, {
        apiKey: 'test-key',
      })

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 5000)
    })

    it('在提供自定义超时时使用自定义超时', async () => {
      const event = createTestEvent()
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

      await sendTo{Name}(event, {
        apiKey: 'test-key',
        timeout: 10000,
      })

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 10000)
    })
  })
})
```

## 自定义说明

- **URL 断言**：更新预期 URL 以匹配实际服务 API。
- **认证请求头**：如果服务使用自定义认证请求头（例如 `X-API-Key` 而不是 `Authorization: Bearer`），请更新请求头断言。
- **请求体格式**：调整请求体断言以匹配服务的预期负载。有些服务会将事件包装在对象中（PostHog：`{ api_key, batch }`），其他服务则接受原始数组（Axiom）。
- **空批次**：该模板断言对空数组时 `fetchSpy` 不会被调用。如果你的适配器会发送空数组（如 Axiom），请将其改为匹配实际行为。
- **事件转换**：如果你导出了 `to{Name}Event()` 转换器，请为其添加专门测试（可参考 `otlp.test.ts` 中的 `toOTLPLogRecord` 测试）。
- **服务特定测试**：为任何服务特定功能添加测试（例如：Axiom 的 `orgId` 请求头、OTLP 的严重级别映射、PostHog 的 `distinct_id`）。
