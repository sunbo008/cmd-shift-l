import { DatabaseSync } from 'node:sqlite';
import type { AbsolutePath, CodegraphStatus } from '../service/types.ts';
/** Open result for a workspace root's `.codegraph/codegraph.db`. */
export interface OpenedCodegraph {
    readonly status: CodegraphStatus;
    readonly db?: DatabaseSync;
    readonly dbPath?: string;
}
/**
 * Probe and optionally open the codegraph SQLite database under root.
 * v1: readable DB → ready (no stale detection).
 * @param root - Session workspace absolute root
 */
export declare function openCodegraph(root: AbsolutePath): OpenedCodegraph;
//# sourceMappingURL=db.d.ts.map