export const workspaceBootstrapCommand = [
  'cd repo',
  'corepack prepare --activate',
  'pnpm install --frozen-lockfile',
  'pnpm run dev:prepare',
].join(' && ')

export function agentBrowserInstallOptions(architecture: string) {
  const installBrowser = !['arm64', 'aarch64'].includes(architecture.trim())
  return { installBrowser, installSystemDependencies: installBrowser }
}
