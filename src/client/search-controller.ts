import type {
  ContentHit,
  FileHit,
  SearchKind,
  SearchResult,
  SymbolHit,
} from '../service/types.ts'
import type { WorkspaceCodeSearchRemote, WorkspaceSearchScope } from '../api/client.ts'

/** Client search knobs (mirrors Host Config defaults). */
export interface SearchUiConfig {
  readonly debounceMs: number
  /**
   * Client-side failsafe so the UI never stays busy if Host Remote hangs.
   * Defaults to Host searchTimeoutMs + 5000 when unset.
   */
  readonly clientTimeoutMs?: number
}

const DEFAULT_CLIENT_TIMEOUT_MS = 15_000

/** Per-leg UI status. */
export type LegStatus = 'idle' | 'running' | 'done' | 'error'

/** Content-leg live progress for the footer (reserved; unary content has none). */
export interface ContentLegProgress {
  readonly matched: number
  readonly pathHint?: string
  readonly etaSec?: number
}

/** Snapshot pushed to the modal on each leg update. */
export interface SearchUiState {
  readonly searching: boolean
  readonly result: SearchResult
  readonly legs: {
    readonly file: LegStatus
    readonly symbol: LegStatus
    readonly content: LegStatus
  }
  readonly contentProgress?: ContentLegProgress
}

function emptyPartial(): SearchResult {
  return { files: [], symbols: [], content: [], truncated: false }
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

/** True when the query should not hit Remote. */
export function shouldSkipSearch(query: string, kinds: readonly SearchKind[]): boolean {
  return query.trim().length === 0 || kinds.length === 0
}

/**
 * Debounced parallel per-kind Remote.search with AbortController + seq.
 * Uses three unary `search({ kinds: [one] })` calls so Client `$mount` stays
 * on the historical status+search surface (Windows-safe).
 */
export class SearchRequestController {
  private debounceTimer: ReturnType<typeof setTimeout> | undefined
  private clientTimeoutTimer: ReturnType<typeof setTimeout> | undefined
  private controller: AbortController | undefined
  private issuedSeq = 0

  constructor(
    private readonly remote: WorkspaceCodeSearchRemote,
    private readonly scope: WorkspaceSearchScope,
    private readonly config: SearchUiConfig,
    private readonly onUpdate: (state: SearchUiState) => void,
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
      this.onUpdate({
        searching: false,
        result: emptyPartial(),
        legs: { file: 'idle', symbol: 'idle', content: 'idle' },
      })
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
    const kindSet = new Set(kinds)
    const legs: { file: LegStatus; symbol: LegStatus; content: LegStatus } = {
      file: kindSet.has('file') ? 'running' : 'idle',
      symbol: kindSet.has('symbol') ? 'running' : 'idle',
      content: kindSet.has('content') ? 'running' : 'idle',
    }
    let files: readonly FileHit[] = []
    let symbols: readonly SymbolHit[] = []
    let content: readonly ContentHit[] = []
    let truncated = false
    const errors: NonNullable<SearchResult['errors']> = {}

    const emit = (searching: boolean): void => {
      if (seq !== this.issuedSeq) return
      this.onUpdate({
        searching,
        result: {
          files,
          symbols,
          content,
          truncated,
          ...Object.keys(errors).length > 0 ? { errors } : {},
        },
        legs: { ...legs },
      })
    }

    emit(true)
    this.onError(undefined)

    const timeoutMs = this.config.clientTimeoutMs ?? DEFAULT_CLIENT_TIMEOUT_MS
    this.clientTimeoutTimer = setTimeout(() => {
      this.clientTimeoutTimer = undefined
      controller.abort()
      if (seq !== this.issuedSeq) return
      this.onError(`Search timed out after ${String(timeoutMs)}ms`)
      emit(false)
    }, timeoutMs)

    const runKind = async (kind: SearchKind): Promise<void> => {
      try {
        const result = await this.remote.search(
          this.scope,
          { query, kinds: [kind] },
          controller.signal,
        )
        if (seq !== this.issuedSeq) return
        if (kind === 'file') {
          files = result.files
          if (result.errors?.file !== undefined) errors.file = result.errors.file
          legs.file = result.errors?.file !== undefined ? 'error' : 'done'
        } else if (kind === 'symbol') {
          symbols = result.symbols
          if (result.errors?.symbol !== undefined) errors.symbol = result.errors.symbol
          legs.symbol = result.errors?.symbol !== undefined ? 'error' : 'done'
        } else {
          content = result.content
          if (result.errors?.content !== undefined) errors.content = result.errors.content
          legs.content = result.errors?.content !== undefined ? 'error' : 'done'
        }
        if (result.truncated) truncated = true
        if (result.errors?.codegraph !== undefined) errors.codegraph = result.errors.codegraph
      } catch (error) {
        if (seq !== this.issuedSeq) return
        if (controller.signal.aborted) {
          legs[kind] = 'idle'
          return
        }
        legs[kind] = 'error'
        errors[kind] = error instanceof Error ? error.message : String(error)
      }
      emit(legs.file === 'running' || legs.symbol === 'running' || legs.content === 'running')
    }

    const tasks = kinds.map(kind => runKind(kind))
    try {
      await Promise.all(tasks)
    } finally {
      if (seq === this.issuedSeq) {
        this.clearClientTimeout()
        const still = legs.file === 'running' || legs.symbol === 'running' || legs.content === 'running'
        if (still) {
          if (legs.file === 'running') legs.file = 'idle'
          if (legs.symbol === 'running') legs.symbol = 'idle'
          if (legs.content === 'running') legs.content = 'idle'
          emit(false)
        }
      }
    }
  }

  private clearClientTimeout(): void {
    if (this.clientTimeoutTimer !== undefined) clearTimeout(this.clientTimeoutTimer)
    this.clientTimeoutTimer = undefined
  }
}
