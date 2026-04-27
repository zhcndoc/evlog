import { getNitroRuntimeConfigRecord } from '../shared/nitroConfigBridge'

/**
 * Adapter runtime-config reads go through `getNitroRuntimeConfigRecord` in
 * `shared/nitroConfigBridge.ts` (documented there — Workers-safe dynamic imports).
 *
 * Drain handlers remain non-blocking when the host provides `waitUntil`.
 */

export function getRuntimeConfig(): Promise<Record<string, any> | undefined> {
  return getNitroRuntimeConfigRecord()
}

export interface ConfigField<T> {
  key: keyof T & string
  env?: string[]
}

export async function resolveAdapterConfig<T>(
  namespace: string,
  fields: ConfigField<T>[],
  overrides?: Partial<T>,
): Promise<Partial<T>> {
  const runtimeConfig = shouldProbeRuntimeConfig(fields, overrides)
    ? await getRuntimeConfig()
    : undefined
  const evlogNs = runtimeConfig?.evlog?.[namespace]
  const rootNs = runtimeConfig?.[namespace]

  const config: Record<string, unknown> = {}

  for (const { key, env } of fields) {
    config[key] =
      overrides?.[key]
      ?? evlogNs?.[key]
      ?? rootNs?.[key]
      ?? resolveEnv(env)
  }

  return config as Partial<T>
}

function shouldProbeRuntimeConfig<T>(
  fields: ConfigField<T>[],
  overrides?: Partial<T>,
): boolean {
  // Optional tuning fields (e.g. timeout/retries) should not trigger Nitro
  // virtual-module imports when env/overrides already resolve the env-backed
  // adapter fields in non-Nitro runtimes.
  return fields.some(({ key, env }) => {
    if (overrides?.[key] !== undefined) return false
    if (!env) return false
    return resolveEnv(env) === undefined
  })
}

function resolveEnv(envKeys?: string[]): string | undefined {
  if (!envKeys) return undefined
  for (const key of envKeys) {
    const val = process.env[key]
    if (val) return val
  }
  return undefined
}
