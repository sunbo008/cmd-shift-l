import type { AbsolutePath, CodegraphStatus } from '../service/types.ts';
/** Codegraph DB path under a workspace root (no SQLite open). */
export declare function codegraphDbPath(root: AbsolutePath): string;
/**
 * Probe codegraph availability without opening SQLite on the Host event loop.
 * Large Windows indexes previously blocked Remote (Files panel stuck on「正在读取…」).
 * Table validity is checked inside the search worker on first query.
 * @param root - Session workspace absolute root
 */
export declare function probeCodegraphStatus(root: AbsolutePath): CodegraphStatus & {
    dbPath?: string;
};
//# sourceMappingURL=probe.d.ts.map