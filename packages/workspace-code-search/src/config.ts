import Schema from '@deepseek-ai/schemastery'

/** Validated deployment tunables for workspace code search. */
export interface Config {
  maxQueryCodeUnits: number
  limitPerKind: number
  debounceMs: number
  searchTimeoutMs: number
}

/** Schemastery schema; Cordis fills defaults before the plugin constructor. */
export const Config: Schema<Config> = Schema.object({
  maxQueryCodeUnits: Schema.natural().min(1).max(10_000).default(500),
  limitPerKind: Schema.natural().min(1).max(500).default(50),
  debounceMs: Schema.natural().min(0).max(5_000).default(250),
  searchTimeoutMs: Schema.natural().min(100).max(120_000).default(10_000),
})
