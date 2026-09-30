import type { SearchKind, SearchResult } from '@dsh-plugin/workspace-code-search'
import type { WorkspaceCodeSearchRemote, WorkspaceSearchScope } from '@dsh-plugin/api-workspace-code-search/client'

/** Client search knobs (mirrors Host Config defaults). */
export interface SearchUiConfig {
  readonly debounceMs: number
}

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
    const controller = new AbortController()
    this.controller = controller
    const seq = ++this.issuedSeq
    this.onResult(undefined, true)
    this.onError(undefined)
    try {
      const result = await this.remote.search(
        this.scope,
        { query, kinds },
        controller.signal,
      )
      if (!this.accept(seq, controller.signal)) return
      this.onResult(result, false)
    } catch (error) {
      if (!this.accept(seq, controller.signal)) return
      if (error instanceof Error && error.name === 'AbortError') return
      this.onResult(undefined, false)
      this.onError(error instanceof Error ? error.message : String(error))
    }
  }

  private accept(seq: number, signal: AbortSignal): boolean {
    if (signal.aborted) return false
    if (seq !== this.issuedSeq) return false
    if (seq <= this.renderedSeq) return false
    this.renderedSeq = seq
    return true
  }
}
