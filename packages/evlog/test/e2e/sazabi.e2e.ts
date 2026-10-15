/**
 * E2E smoke test for the Sazabi adapter.
 *
 * The intake URL only accepts writes, so this is a one-way smoke test: we post
 * a batch to the real OTLP/HTTP intake and treat the absence of an HTTP error
 * as the payload format being accepted.
 *
 * Required env vars:
 *   - SAZABI_INTAKE_URL (the log stream's intake URL; its public key is part of the URL)
 */
import { expect } from 'vitest'
import { sendBatchToSazabi } from '../../src/adapters/sazabi'
import { describeIfEnv, itWithCorrelationId, makeEvent, readEnv } from './_shared'

describeIfEnv('sazabi e2e (smoke)', ['SAZABI_INTAKE_URL'], () => {
  const endpoint = readEnv('SAZABI_INTAKE_URL')!

  itWithCorrelationId('Sazabi intake accepts our OTLP payload', async () => {
    const events = (['info', 'warn', 'error'] as const).map(level =>
      makeEvent('sazabi-otlp', {
        level,
        action: 'e2e_otlp_smoke',
      }),
    )

    await expect(
      sendBatchToSazabi(events, { endpoint }),
    ).resolves.toBeUndefined()
  }, 30_000)
})
