/**
 * Workspace code search Host service.
 */
import { Service, type Context } from '@deepseek-ai/cordis'
import { Config } from './config.ts'
import {
  clampLimitPerKind,
  normalizeQuery,
  orchestrateSearch,
  resolveCodegraphStatus,
  runContentLeg,
  runFileLeg,
  runSymbolLeg,
} from './orchestrate.ts'
import { iterateWorkspaceGrep } from '../content/grep.ts'
import type {
  AbsolutePath,
  CodegraphStatus,
  ContentLegResult,
  ContentSearchFrame,
  FileLegResult,
  SearchKind,
  SearchResult,
  SymbolLegResult,
  WorkspaceCodeSearch,
  WorkspaceCodeSearchProvider,
} from './types.ts'

export type {
  AbsolutePath,
  CodegraphStatus,
  ContentHit,
  ContentLegResult,
  ContentSearchFrame,
  FileHit,
  FileLegResult,
  ProviderSearchRequest,
  SearchKind,
  SearchResult,
  SymbolHit,
  SymbolLegResult,
  WorkspaceCodeSearch,
  WorkspaceCodeSearchProvider,
} from './types.ts'
export { asAbsolutePath } from './types.ts'
export { Config } from './config.ts'
export {
  clampLimitPerKind,
  normalizeQuery,
  orchestrateSearch,
  resolveCodegraphStatus,
  runContentLeg,
  runFileLeg,
  runSymbolLeg,
} from './orchestrate.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    workspaceCodeSearch: WorkspaceCodeSearch
  }
}

/** Cordis service: provider registry + partitioned search orchestration. */
export default class WorkspaceCodeSearchService extends Service implements WorkspaceCodeSearch {
  static inject = [] as const
  static Config = Config

  private readonly providers = new Map<string, WorkspaceCodeSearchProvider>()

  /**
   * @param ctx - Cordis context
   * @param config - validated plugin config
   */
  constructor(ctx: Context, public readonly config: Config) {
    super(ctx, 'workspaceCodeSearch')
  }

  /**
   * @param provider - provider contribution
   * @returns disposer removing the provider
   */
  register(provider: WorkspaceCodeSearchProvider): () => void {
    const dispose = this.ctx.effect(() => {
      if (this.providers.has(provider.id)) {
        throw new Error(`workspaceCodeSearch: duplicate provider "${provider.id}"`)
      }
      this.providers.set(provider.id, provider)
      return () => {
        this.providers.delete(provider.id)
      }
    }, `workspaceCodeSearch.register(${JSON.stringify(provider.id)})`)
    return () => {
      void dispose()
    }
  }

  /**
   * @param root - Session workspace root
   * @returns codegraph status
   */
  async status(root: AbsolutePath): Promise<CodegraphStatus> {
    return await resolveCodegraphStatus(this.providers.values(), root)
  }

  /**
   * @param request - search request
   * @returns partitioned results
   */
  async search(request: {
    root: AbsolutePath
    query: string
    kinds: readonly SearchKind[]
    limitPerKind?: number
    signal: AbortSignal
  }): Promise<SearchResult> {
    return await orchestrateSearch(this.providers.values(), this.config, request)
  }

  /**
   * @param request - file-leg request
   * @returns file hits
   */
  async searchFiles(request: {
    root: AbsolutePath
    query: string
    limitPerKind?: number
    signal: AbortSignal
  }): Promise<FileLegResult> {
    const query = normalizeQuery(request.query, this.config.maxQueryCodeUnits)
    const limit = clampLimitPerKind(request.limitPerKind, this.config.limitPerKind)
    return await runFileLeg(this.providers.values(), this.config, {
      root: request.root,
      query,
      limit,
      signal: request.signal,
    })
  }

  /**
   * @param request - symbol-leg request
   * @returns symbol hits
   */
  async searchSymbols(request: {
    root: AbsolutePath
    query: string
    limitPerKind?: number
    signal: AbortSignal
  }): Promise<SymbolLegResult> {
    const query = normalizeQuery(request.query, this.config.maxQueryCodeUnits)
    const limit = clampLimitPerKind(request.limitPerKind, this.config.limitPerKind)
    return await runSymbolLeg(this.providers.values(), this.config, {
      root: request.root,
      query,
      limit,
      signal: request.signal,
    })
  }

  /**
   * @param request - content-leg request
   * @returns content hits
   */
  async searchContent(request: {
    root: AbsolutePath
    query: string
    limitPerKind?: number
    signal: AbortSignal
  }): Promise<ContentLegResult> {
    const query = normalizeQuery(request.query, this.config.maxQueryCodeUnits)
    const limit = clampLimitPerKind(request.limitPerKind, this.config.limitPerKind)
    return await runContentLeg(this.providers.values(), this.config, {
      root: request.root,
      query,
      limit,
      signal: request.signal,
    })
  }

  /**
   * Stream content progress + final result (ripgrep JSON).
   * @param request - content-leg request
   */
  async *searchContentStream(request: {
    root: AbsolutePath
    query: string
    limitPerKind?: number
    signal: AbortSignal
  }): AsyncGenerator<ContentSearchFrame, void, void> {
    const query = normalizeQuery(request.query, this.config.maxQueryCodeUnits)
    const limit = clampLimitPerKind(request.limitPerKind, this.config.limitPerKind)
    const local = new AbortController()
    const timer = setTimeout(() => {
      local.abort(new DOMException(
        `workspaceCodeSearch timed out after ${String(this.config.searchTimeoutMs)}ms`,
        'TimeoutError',
      ))
    }, this.config.searchTimeoutMs)
    const onParentAbort = (): void => {
      local.abort(request.signal.reason)
    }
    if (request.signal.aborted) {
      clearTimeout(timer)
      throw request.signal.reason instanceof Error ? request.signal.reason : new Error('aborted')
    }
    request.signal.addEventListener('abort', onParentAbort, { once: true })
    try {
      yield* iterateWorkspaceGrep(
        { root: request.root, query, limit, signal: local.signal },
        { progressIntervalMs: 200 },
      )
    } finally {
      clearTimeout(timer)
      request.signal.removeEventListener('abort', onParentAbort)
    }
  }
}
