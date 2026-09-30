import { ConnectorInstallationRequiredError } from '@vercel/connect'
import { type ConnectGitHubCredentialsParams, connectGitHubCredentials } from '@vercel/connect/eve'
import type { GitHubChannelCredentials } from 'eve/channels/github'
import { homeRepository, type Repository } from '../repo'
import { mintInstallationToken } from './push'

/** The Connect connector shared by the GitHub channel, the extension, and the git tools. */
export const GITHUB_CONNECTOR = 'github/evi-github-production'

// A GitHub App token is minted per installation and reaches that account only.
// Connect resolves the installation from the account named here, so no
// installation id is held anywhere in Evi.
export function installationParams(repository: Repository, repositories?: readonly string[]): ConnectGitHubCredentialsParams {
  return {
    authorizationDetails: [
      {
        type: 'github_app_installation',
        org: repository.owner,
        ...(repositories === undefined ? {} : { repositories: [...repositories] }),
      },
    ],
  }
}

/** Credentials Connect mints from the installation covering `repository`, narrowed to that repository. */
export function githubCredentialsFor(repository: Repository): GitHubChannelCredentials {
  return connectGitHubCredentials(GITHUB_CONNECTOR, installationParams(repository, [repository.repo]))
}

/** A token for `repository`; null when the App is not installed on its account. */
export async function repositoryToken(repository: Repository): Promise<string | null> {
  try {
    return await mintInstallationToken(githubCredentialsFor(repository))
  } catch (error) {
    if (error instanceof ConnectorInstallationRequiredError) return null
    throw error
  }
}

/** The home account's installation, for the surfaces that take one credential: the channel and the `github__*` extension. */
export const homeInstallationParams = installationParams(homeRepository())

export const githubCredentials = connectGitHubCredentials(GITHUB_CONNECTOR, homeInstallationParams)
