import { describe, expect, it } from 'vitest'
import { agentBrowserInstallOptions, workspaceBootstrapCommand } from './workspace-bootstrap'

describe('workspace bootstrap', () => {
  it('activates the pinned package manager without writing global shims', () => {
    expect(workspaceBootstrapCommand).toContain('corepack prepare --activate')
    expect(workspaceBootstrapCommand).toContain('pnpm install --frozen-lockfile')
    expect(workspaceBootstrapCommand).toContain('pnpm run dev:prepare')
    expect(workspaceBootstrapCommand).not.toContain('corepack enable')
  })

  it('skips the unavailable Chrome for Testing build on Linux ARM64', () => {
    expect(agentBrowserInstallOptions('aarch64\n')).toEqual({
      installBrowser: false,
      installSystemDependencies: false,
    })
    expect(agentBrowserInstallOptions('x86_64\n')).toEqual({
      installBrowser: true,
      installSystemDependencies: true,
    })
  })
})
