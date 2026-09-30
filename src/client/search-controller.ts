import type {
  ContentHit,
  FileHit,
  SearchKind,
  SearchResult,
  SymbolHit,
} from '../service/types.ts'
import type { WorkspaceCodeSearchRemote, WorkspaceSearchScope } from '../api/client.ts'
import { estimateEtaSec, type EtaSample } from './eta.ts'

/** Client search knobs (mirrors Host Config defaults). */
export interface SearchUiConfig {
  readonly debounceMs: number
  /**
   * Client-side failsafe so the UI never stays busy if Host Remote hangs.
   * Defaults to Host searchTimeoutMs + 5000 when unset.
   */
  readonly clientTimeoutMs?: number
  /** Content-leg limit used for soft ETA (Host default 50). */
  readonly limitPerKind?: number
}

const DEFAULT_CLIENT_TIMEOUT_MS = 15_000
const DEFAULT_LIMIT_PER_KIND = 50

/** Per-leg UI status. */
export type LegStatus = 'idle' | 'running' | 'done' | 'error'

/** Content-leg live progress for the footer. */
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
 * Debounced parallel per-leg Remote search with AbortController + seq.
 */
export class SearchRequestController {
  private debounceTimer: ReturnType<typeof setTimeout> | undefined
  private clientTimeoutTimer: ReturnType<typeof setTimeout> | undefined
  private controller: AbortController | undefined
  private streamDispose: (() => void) | undefined
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
    this.streamDispose?.()
    this.streamDispose = undefined
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
      this.streamDispose?.()
      this.streamDispose = undefined
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
    this.streamDispose?.()
    this.streamDispose = undefined
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
    let contentProgress: ContentLegProgress | undefined
    const etaSamples: EtaSample[] = []
    const limitPerKind = this.config.limitPerKind ?? DEFAULT_LIMIT_PER_KIND

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
        ...contentProgress === undefined ? {} : { contentProgress },
      })
    }

    emit(true)
    this.onError(undefined)

    const timeoutMs = this.config.clientTimeoutMs ?? DEFAULT_CLIENT_TIMEOUT_MS
    this.clientTimeoutTimer = setTimeout(() => {
      this.clientTimeoutTimer = undefined
      controller.abort()
      this.streamDispose?.()
      this.streamDispose = undefined
      if (seq !== this.issuedSeq) return
      this.onError(`Search timed out after ${String(timeoutMs)}ms`)
      emit(false)
    }, timeoutMs)

    const tasks: Array<Promise<void>> = []

    if (kindSet.has('file')) {
      tasks.push((async () => {
        try {
          const result = await this.remote.searchFiles(
            this.scope,
            { query },
            controller.signal,
          )
          if (seq !== this.issuedSeq) return
          files = result.hits
          if (result.truncated) truncated = true
          if (result.error !== undefined) errors.file = result.error
          legs.file = result.error !== undefined ? 'error' : 'done'
        } catch (error) {
          if (seq !== this.issuedSeq) return
          if (controller.signal.aborted) {
            legs.file = 'idle'
            return
          }
          legs.file = 'error'
          errors.file = error instanceof Error ? error.message : String(error)
        }
        emit(legs.file === 'running' || legs.symbol === 'running' || legs.content === 'running')
      })())
    }

    if (kindSet.has('symbol')) {
      tasks.push((async () => {
        try {
          const result = await this.remote.searchSymbols(
            this.scope,
            { query },
            controller.signal,
          )
          if (seq !== this.issuedSeq) return
          symbols = result.hits
          if (result.truncated) truncated = true
          if (result.error !== undefined) errors.symbol = result.error
          legs.symbol = result.error !== undefined ? 'error' : 'done'
        } catch (error) {
          if (seq !== this.issuedSeq) return
          if (controller.signal.aborted) {
            legs.symbol = 'idle'
            return
          }
          legs.symbol = 'error'
          errors.symbol = error instanceof Error ? error.message : String(error)
        }
        emit(legs.file === 'running' || legs.symbol === 'running' || legs.content === 'running')
      })())
    }

    if (kindSet.has('content')) {
      tasks.push((async () => {
        try {
          const stream = this.remote.searchContent(
            this.scope,
            { query },
            controller.signal,
          )
          const disposable = stream as { dispose?: () => void }
          if (typeof disposable.dispose === 'function') {
            this.streamDispose = () => { disposable.dispose!() }
          }
          for await (const frame of stream) {
            if (seq !== this.issuedSeq) return
            if (frame.type === 'progress') {
              const atMs = Date.now()
              etaSamples.push({ atMs, matched: frame.matched })
              const etaSec = estimateEtaSec(etaSamples, limitPerKind, atMs)
              contentProgress = {
                matched: frame.matched,
                ...frame.pathHint === undefined ? {} : { pathHint: frame.pathHint },
                ...etaSec === undefined ? {} : { etaSec },
              }
              emit(true)
              continue
            }
            content = frame.hits
            if (frame.truncated) truncated = true
            if (frame.error !== undefined) {
              errors.content = frame.error
              legs.content = 'error'
            } else {
              legs.content = 'done'
            }
            contentProgress = undefined
          }
          if (seq !== this.issuedSeq) return
          if (legs.content === 'running') legs.content = 'done'
        } catch (error) {
          if (seq !== this.issuedSeq) return
          if (controller.signal.aborted) {
            legs.content = 'idle'
            contentProgress = undefined
            return
          }
          legs.content = 'error'
          errors.content = error instanceof Error ? error.message : String(error)
          contentProgress = undefined
        }
        emit(legs.file === 'running' || legs.symbol === 'running' || legs.content === 'running')
      })())
    }

    try {
      await Promise.all(tasks)
    } finally {
      if (seq === this.issuedSeq) {
        this.clearClientTimeout()
        this.streamDispose = undefined
        const still = legs.file === 'running' || legs.symbol === 'running' || legs.content === 'running'
        if (still) {
          if (legs.file === 'running') legs.file = 'idle'
          if (legs.symbol === 'running') legs.symbol = 'idle'
          if (legs.content === 'running') legs.content = 'idle'
          contentProgress = undefined
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
