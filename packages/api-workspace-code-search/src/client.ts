/**
 * Client-facing Remote face (hand-written until Typert codegen is wired for this package).
 */
import type { CodegraphStatus, SearchResult } from '@dsh-plugin/workspace-code-search'
import type { RemoteSearchRequest, WorkspaceSearchScope } from './types.ts'

/** Browser Remote methods for workspace code search. */
export interface WorkspaceCodeSearchRemote {
  /**
   * @param scope - Session workspace scope from Typert lookup
   */
  status(scope: WorkspaceSearchScope): Promise<CodegraphStatus>
  /**
   * @param scope - Session workspace scope
   * @param request - query payload without root
   * @param signal - cancellation
   */
  search(
    scope: WorkspaceSearchScope,
    request: RemoteSearchRequest,
    signal: AbortSignal,
  ): Promise<SearchResult>
}

export type { RemoteSearchRequest, WorkspaceSearchScope } from './types.ts'
