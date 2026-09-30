import { describe, expect, it, vi } from 'vitest'
import { verifyCheckoutRevision } from './revision'

const expectedRevision = 'a'.repeat(40)

describe('simplification checkout revision', () => {
  it('returns the current commit without changing the checkout', async () => {
    const run = vi.fn(() => Promise.resolve({ exitCode: 0, stdout: `${expectedRevision}\n` }))

    await expect(verifyCheckoutRevision({ run }, expectedRevision)).resolves.toEqual({
      revision: expectedRevision,
    })
    expect(run).toHaveBeenCalledWith({
      command: 'cd /workspace/repo && git rev-parse --verify HEAD^{commit}',
    })
  })

  it('rejects a different checkout revision', async () => {
    const revision = 'b'.repeat(40)
    const run = vi.fn(() => Promise.resolve({ exitCode: 0, stdout: `${revision}\n` }))

    await expect(verifyCheckoutRevision({ run }, expectedRevision)).rejects.toThrow(
      `Shared checkout revision ${revision} does not match requested revision ${expectedRevision}.`,
    )
  })

  it('rejects malformed revisions before running Git', async () => {
    const run = vi.fn()

    await expect(verifyCheckoutRevision({ run }, 'HEAD')).rejects.toThrow()
    expect(run).not.toHaveBeenCalled()
  })
})
