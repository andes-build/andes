export const INTERFACE_MODE_SIMPLE = 'simple'
export const INTERFACE_MODE_DEVELOPER = 'developer'

export type InterfaceMode = typeof INTERFACE_MODE_SIMPLE | typeof INTERFACE_MODE_DEVELOPER

const INTERFACE_MODE_VALUES: ReadonlySet<string> = new Set([
  INTERFACE_MODE_SIMPLE,
  INTERFACE_MODE_DEVELOPER
])

/** Missing or unrecognized values fall back to simple — the default mode. */
export function normalizeInterfaceMode(value: unknown): InterfaceMode {
  return typeof value === 'string' && INTERFACE_MODE_VALUES.has(value)
    ? (value as InterfaceMode)
    : INTERFACE_MODE_SIMPLE
}

/** Hidden developer-mode door: set at process launch, read once at settings load. */
export const INTERFACE_MODE_ENV_VAR = 'ANDES_INTERFACE_MODE'

export function readInterfaceModeFromEnv(
  env: NodeJS.ProcessEnv = process.env
): InterfaceMode | null {
  return env[INTERFACE_MODE_ENV_VAR] === INTERFACE_MODE_DEVELOPER ? INTERFACE_MODE_DEVELOPER : null
}
