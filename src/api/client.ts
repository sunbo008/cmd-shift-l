/**
 * Client-facing Remote face (hand-written until Typert codegen is wired for this package).
 */
import type {
  CodegraphStatus,
  ContentLegResult,
  FileLegResult,
  SearchResult,
  SymbolLegResult,
} from '../service/types.ts'
import type { RemoteLegRequest, RemoteSearchRequest, WorkspaceSearchScope } from './types.ts'

/** Browser Remote methods for workspace code search. */
export interface WorkspaceCodeSearchRemote {
  /**
   * @param scope - Session workspace scope from Typert lookup
   */
  status(scope: WorkspaceSearchScope): Promise<CodegraphStatus>
  /**
   * Full partitioned search (Agent / tools). UI prefers per-leg methods.
   * @param scope - Session workspace scope
   * @param request - query payload without root
   * @param signal - cancellation
   */
  search(
    scope: WorkspaceSearchScope,
    request: RemoteSearchRequest,
    signal: AbortSignal,
  ): Promise<SearchResult>
  /**
   * @param scope - Session workspace scope
   * @param request - query without kinds
   * @param signal - cancellation
   */
  searchFiles(
    scope: WorkspaceSearchScope,
    request: RemoteLegRequest,
    signal: AbortSignal,
  ): Promise<FileLegResult>
  /**
   * @param scope - Session workspace scope
   * @param request - query without kinds
   * @param signal - cancellation
   */
  searchSymbols(
    scope: WorkspaceSearchScope,
    request: RemoteLegRequest,
    signal: AbortSignal,
  ): Promise<SymbolLegResult>
  /**
   * Content leg (unary Promise — stream Remote broke Client `$mount` / inject).
   * @param scope - Session workspace scope
   * @param request - query without kinds
   * @param signal - cancellation
   */
  searchContent(
    scope: WorkspaceSearchScope,
    request: RemoteLegRequest,
    signal: AbortSignal,
  ): Promise<ContentLegResult>
}

export type { RemoteLegRequest, RemoteSearchRequest, WorkspaceSearchScope } from './types.ts'
