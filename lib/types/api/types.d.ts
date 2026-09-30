import { type AbsolutePath } from '../service/types.ts';
/**
 * Session workspace scope carried on the wire (same shape as workspace-files).
 * Host resolves `workspaceRoot` from Session cwd; Client never supplies an arbitrary root.
 */
export interface WorkspaceSearchScope {
    readonly sessionId: string;
    readonly workspaceRoot: string;
}
/**
 * Convert Session cwd / workspace root into AbsolutePath or throw.
 * @param scope - scope from Typert lookup (or undefined when no Session)
 */
export declare function requireWorkspaceRoot(scope: WorkspaceSearchScope | undefined): AbsolutePath;
/** Remote search body — no root field. */
export interface RemoteSearchRequest {
    readonly query: string;
    readonly kinds: readonly ('file' | 'content' | 'symbol')[];
    readonly limitPerKind?: number;
}
/** Single-leg Remote body — no root, no kinds. */
export interface RemoteLegRequest {
    readonly query: string;
    readonly limitPerKind?: number;
}
//# sourceMappingURL=types.d.ts.map