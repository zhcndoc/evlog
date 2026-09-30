import { z } from 'zod'
import { REPO_DIR, runOutput } from '../workspace'

const revisionSchema = z.string().regex(/^[a-f0-9]{40}$/)

interface RevisionSandbox {
  run: (input: { command: string }) => PromiseLike<{ exitCode: number, stdout?: unknown, stderr?: unknown }>
}

export async function verifyCheckoutRevision(sandbox: RevisionSandbox, expectedRevision: string) {
  revisionSchema.parse(expectedRevision)

  const result = await sandbox.run({ command: `cd ${REPO_DIR} && git rev-parse --verify HEAD^{commit}` })
  if (result.exitCode !== 0) throw new Error(`Cannot identify checkout revision: ${runOutput(result)}`)

  const revision = revisionSchema.parse(String(result.stdout ?? '').trim())
  if (revision !== expectedRevision) {
    throw new Error(`Shared checkout revision ${revision} does not match requested revision ${expectedRevision}.`)
  }

  return { revision }
}
