import type { SearchKind, SearchResult } from '../service/types.ts'
import type { WorkspaceCodeSearchRemote, WorkspaceSearchScope } from '../api/client.ts'

/** Client search knobs (mirrors Host Config defaults). */
export interface SearchUiConfig {
  readonly debounceMs: number
  /**
   * Client-side failsafe so the UI never stays on「搜索中…」if Host Remote hangs
   * (e.g. sync SQLite blocking the event loop before a Host timeout can fire).
   */
  readonly clientTimeoutMs?: number
}

const DEFAULT_CLIENT_TIMEOUT_MS = 15_000

/** Collect enabled kinds from toggle flags. */
export function kindsFromFlags(flags: {
  file: boolean
  symbol: boolean
  content: boolean
}): SearchKind[] {
  const kinds: SearchKind[] = []
  if (flags.file) kinds.push('file')
  if (flags.symbol) kinds.push('symbol')
  if (flags.content) kinds.push('content')
  return kinds
}

/** True when the query should not hit Remote.search. */
export function shouldSkipSearch(query: string, kinds: readonly SearchKind[]): boolean {
  return query.trim().length === 0 || kinds.length === 0
}

/**
 * Debounced Remote search with AbortController rotation and issued/rendered seq.
 */
export class SearchRequestController {
  private debounceTimer: ReturnType<typeof setTimeout> | undefined
  private clientTimeoutTimer: ReturnType<typeof setTimeout> | undefined
  private controller: AbortController | undefined
  private issuedSeq = 0
  private renderedSeq = 0

  constructor(
    private readonly remote: WorkspaceCodeSearchRemote,
    private readonly scope: WorkspaceSearchScope,
    private readonly config: SearchUiConfig,
    private readonly onResult: (result: SearchResult | undefined, searching: boolean) => void,
    private readonly onError: (message: string | undefined) => void,
  ) {}

  /** Cancel in-flight work and timers. */
  dispose(): void {
    if (this.debounceTimer !== undefined) clearTimeout(this.debounceTimer)
    this.debounceTimer = undefined
    this.clearClientTimeout()
    this.controller?.abort()
    this.controller = undefined
  }

  /**
   * Schedule a search; empty query / empty kinds skip Remote.
   * @param query - raw input
   * @param kinds - enabled partitions
   */
  schedule(query: string, kinds: readonly SearchKind[]): void {
    if (this.debounceTimer !== undefined) clearTimeout(this.debounceTimer)
    this.debounceTimer = undefined
    if (shouldSkipSearch(query, kinds)) {
      this.controller?.abort()
      this.controller = undefined
      this.clearClientTimeout()
      this.onResult(undefined, false)
      this.onError(undefined)
      return
    }
    const trimmed = query.trim()
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined
      void this.run(trimmed, kinds)
    }, this.config.debounceMs)
  }

  private async run(query: string, kinds: readonly SearchKind[]): Promise<void> {
    this.controller?.abort()
    this.clearClientTimeout()
    const controller = new AbortController()
    this.controller = controller
    const seq = ++this.issuedSeq
    this.onResult(undefined, true)
    this.onError(undefined)
    const timeoutMs = this.config.clientTimeoutMs ?? DEFAULT_CLIENT_TIMEOUT_MS
    try {
      const result = await new Promise<SearchResult>((resolve, reject) => {
        this.clientTimeoutTimer = setTimeout(() => {
          this.clientTimeoutTimer = undefined
          controller.abort()
          reject(Object.assign(
            new Error(`Search timed out after ${String(timeoutMs)}ms`),
            { name: 'TimeoutError' },
          ))
        }, timeoutMs)
        void this.remote.search(this.scope, { query, kinds }, controller.signal).then(
          (value) => { resolve(value) },
          (error: unknown) => { reject(error) },
        )
      })
      this.clearClientTimeout()
      if (!this.accept(seq)) return
      this.onResult(result, false)
    } catch (error) {
      this.clearClientTimeout()
      if (!this.accept(seq)) return
      if (error instanceof Error && error.name === 'AbortError') {
        this.onResult(undefined, false)
        return
      }
      this.onResult(undefined, false)
      this.onError(error instanceof Error ? error.message : String(error))
    }
  }

  private clearClientTimeout(): void {
    if (this.clientTimeoutTimer !== undefined) clearTimeout(this.clientTimeoutTimer)
    this.clientTimeoutTimer = undefined
  }

  private accept(seq: number): boolean {
    if (seq !== this.issuedSeq) return false
    if (seq <= this.renderedSeq) return false
    this.renderedSeq = seq
    return true
  }
}
