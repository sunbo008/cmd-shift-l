import { DatabaseSync } from 'node:sqlite';
import { existsSync, accessSync, constants } from 'node:fs';
import { join } from 'node:path';
/**
 * Probe and optionally open the codegraph SQLite database under root.
 * v1: readable DB → ready (no stale detection).
 * @param root - Session workspace absolute root
 */
export function openCodegraph(root) {
    const dbPath = join(root, '.codegraph', 'codegraph.db');
    if (!existsSync(dbPath)) {
        return { status: { codegraph: 'missing', message: 'No .codegraph/codegraph.db under workspace root' } };
    }
    try {
        accessSync(dbPath, constants.R_OK);
    }
    catch {
        return { status: { codegraph: 'error', message: 'codegraph.db is not readable' } };
    }
    try {
        const db = new DatabaseSync(dbPath, { readOnly: true });
        const row = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN ('files','nodes')`).all();
        const names = new Set(row.map(r => r.name));
        if (!names.has('files') || !names.has('nodes')) {
            db.close();
            return { status: { codegraph: 'error', message: 'codegraph.db missing files/nodes tables' } };
        }
        return { status: { codegraph: 'ready' }, db, dbPath };
    }
    catch (error) {
        return {
            status: {
                codegraph: 'error',
                message: error instanceof Error ? error.message : String(error),
            },
        };
    }
}
//# sourceMappingURL=db.js.map