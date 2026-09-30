import Schema from '@deepseek-ai/schemastery'

/** Client-side search UX tunables (aligned with Host defaults). */
export interface Config {
  /** Debounce before Remote.search; schemastery default 250. */
  debounceMs?: number
}

/** Schemastery schema for the Client plugin Config. */
export const Config: Schema<Config> = Schema.object({
  debounceMs: Schema.natural().min(0).max(5_000).default(250),
})
