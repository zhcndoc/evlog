import type { SandboxSession } from 'eve/sandbox'
import { MicrosandboxSandbox } from 'eve/sandbox/microsandbox'
import { VercelSandbox } from 'eve/sandbox/vercel'

type PrepareSandbox = (sandbox: SandboxSession) => Promise<void>

export function createSandboxEnvironment(deployedOnVercel: boolean, prepare: PrepareSandbox) {
  if (!deployedOnVercel) return MicrosandboxSandbox.environment({ prepare })
  return VercelSandbox.environment({
    prepare,
    resources: { vcpus: 4 },
    keepLastSnapshots: { count: 1, deleteEvicted: true },
    snapshotExpiration: 14 * 24 * 60 * 60 * 1000,
  })
}
