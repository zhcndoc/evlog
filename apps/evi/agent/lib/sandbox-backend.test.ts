import { describe, expect, it, vi } from 'vitest'
import { createSandboxEnvironment } from './sandbox-backend'

const prepare = vi.fn(async () => {})

describe('sandbox backend', () => {
  it('uses microsandbox locally', () => {
    expect(createSandboxEnvironment(false, prepare).provider).toBe('microsandbox')
  })

  it('uses Vercel Sandbox when deployed', () => {
    expect(createSandboxEnvironment(true, prepare).provider).toBe('vercel')
  })
})
