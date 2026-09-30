/**
 * Workspace code search Host service.
 */
import { Service, type Context } from '@deepseek-ai/cordis'
import { Config } from './config.ts'
import { orchestrateSearch, resolveCodegraphStatus } from './orchestrate.ts'
import type {
  AbsolutePath,
  CodegraphStatus,
  SearchKind,
  SearchResult,
  WorkspaceCodeSearch,
  WorkspaceCodeSearchProvider,
} from './types.ts'

export type {
  AbsolutePath,
  CodegraphStatus,
  ContentHit,
  FileHit,
  ProviderSearchRequest,
  SearchKind,
  SearchResult,
  SymbolHit,
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
}
