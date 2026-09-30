import { asAbsolutePath, type AbsolutePath } from '@dsh-plugin/workspace-code-search'

/**
 * Session workspace scope carried on the wire (same shape as workspace-files).
 * Host resolves `workspaceRoot` from Session cwd; Client never supplies an arbitrary root.
 */
export interface WorkspaceSearchScope {
  readonly sessionId: string
  readonly workspaceRoot: string
}

/**
 * Convert Session cwd / workspace root into AbsolutePath or throw.
 * @param scope - scope from Typert lookup (or undefined when no Session)
 */
export function requireWorkspaceRoot(scope: WorkspaceSearchScope | undefined): AbsolutePath {
  const cwd = scope?.workspaceRoot?.trim()
  if (cwd === undefined || cwd.length === 0) {
    throw new Error('workspaceCodeSearch: no Session workspace root')
  }
  return asAbsolutePath(cwd)
}

/** Remote search body — no root field. */
export interface RemoteSearchRequest {
  readonly query: string
  readonly kinds: readonly ('file' | 'content' | 'symbol')[]
  readonly limitPerKind?: number
}
