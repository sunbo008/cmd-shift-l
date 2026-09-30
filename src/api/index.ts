/**
 * Session-scoped Typert Remote for workspace code search.
 * Reuses the `workspaceFileScope` lookup registered by dsh workspace-files (same wire shape).
 *
 * Compatible with `@deepseek-ai/dsh-typert-protocol@~0.2.0-rc.2` (Stage 3 `@Remote`,
 * no `RemoteError` export — failures rethrow as `Error`).
 */
import { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type {} from '../service/index.ts'
import type { CodegraphStatus, SearchResult } from '../service/types.ts'
import { requireWorkspaceRoot, type RemoteSearchRequest, type WorkspaceSearchScope } from './types.ts'

export type { RemoteSearchRequest, WorkspaceSearchScope } from './types.ts'
export type { WorkspaceCodeSearchRemote } from './client.ts'
export { requireWorkspaceRoot } from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    workspaceCodeSearchController: WorkspaceCodeSearchController
  }
}

/** No tunables beyond the Host search service Config. */
export interface Config {}

/** Empty schemastery schema for the Remote controller. */
export const Config: Schema<Config> = Schema.object({})

/**
 * Typert Remote controller. Client must not pass AbsolutePath roots.
 */
export default class WorkspaceCodeSearchController extends TypertRemoteService {
  static inject = ['workspaceCodeSearch', 'typert']
  static Config = Config

  /**
   * @param ctx - Host context
   * @param _config - empty validated config
   */
  constructor(ctx: Context, _config: Config) {
    super(ctx, 'workspaceCodeSearchController', { namespace: 'workspaceCodeSearch' })
  }

  /**
   * @param workspaceFileScope - Session-derived workspace root (lookup name matches workspace-files)
   */
  @Remote
  async status(workspaceFileScope: WorkspaceSearchScope): Promise<CodegraphStatus> {
    try {
      const root = requireWorkspaceRoot(workspaceFileScope)
      return await this.ctx.workspaceCodeSearch.status(root)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      throw new Error(`workspace-code-search/status-failed: ${reason}`, { cause: error })
    }
  }

  /**
   * @param workspaceFileScope - Session-derived workspace root
   * @param request - query without root
   * @param signal - cancellation
   */
  @Remote
  async search(
    workspaceFileScope: WorkspaceSearchScope,
    request: RemoteSearchRequest,
    signal: AbortSignal,
  ): Promise<SearchResult> {
    signal.throwIfAborted()
    try {
      const root = requireWorkspaceRoot(workspaceFileScope)
      return await this.ctx.workspaceCodeSearch.search({
        root,
        query: request.query,
        kinds: request.kinds,
        ...request.limitPerKind === undefined ? {} : { limitPerKind: request.limitPerKind },
        signal,
      })
    } catch (error) {
      signal.throwIfAborted()
      const reason = error instanceof Error ? error.message : String(error)
      throw new Error(`workspace-code-search/search-failed: ${reason}`, { cause: error })
    }
  }
}
