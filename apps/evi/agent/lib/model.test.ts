import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
})

describe('MODEL', () => {
  it('defaults to the production model', async () => {
    vi.stubEnv('EVI_MODEL', undefined)
    const { MODEL } = await import('./model')
    expect(MODEL).toBe('anthropic/claude-haiku-5.5')
  })

  it('EVI_MODEL overrides the default', async () => {
    vi.stubEnv('EVI_MODEL', 'openai/gpt-5')
    const { MODEL } = await import('./model')
    expect(MODEL).toBe('openai/gpt-5')
  })
})
