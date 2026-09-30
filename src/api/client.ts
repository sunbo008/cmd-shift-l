/**
 * Client-facing Remote face (hand-written until Typert codegen is wired for this package).
 */
import type { CodegraphStatus, SearchResult } from '../service/types.ts'
import type { RemoteSearchRequest, WorkspaceSearchScope } from './types.ts'

/** Browser Remote methods for workspace code search. */
export interface WorkspaceCodeSearchRemote {
  /**
   * @param scope - Session workspace scope from Typert lookup
   */
  status(scope: WorkspaceSearchScope): Promise<CodegraphStatus>
  /**
   * Partitioned search. UI fans out parallel calls with a single kind each.
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

export type { RemoteLegRequest, RemoteSearchRequest, WorkspaceSearchScope } from './types.ts'
