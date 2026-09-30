/** Client-only Config face — no schemastery (keeps browser bundle small). */
export interface ClientConfig {
  /** Search input debounce in milliseconds. */
  debounceMs?: number
}

/** Defaults when Cordis omits Client Config fields. */
export const CLIENT_CONFIG_DEFAULTS = {
  debounceMs: 250,
} as const

/**
 * Resolve debounce from Client Config.
 * @param config - optional Cordis-validated Client config
 */
export function resolveDebounceMs(config: ClientConfig = {}): number {
  const value = config.debounceMs
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value
  return CLIENT_CONFIG_DEFAULTS.debounceMs
}
