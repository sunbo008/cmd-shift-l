import { scorePath, toRelative } from "../content/path-util.js";
export { isUnderRoot, scorePath } from "../content/path-util.js";
function escapeLike(value) {
    return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}
/**
 * Search file paths in the codegraph `files` table.
 * @param db - open readonly database
 * @param request - provider request
 */
export async function searchFiles(db, request) {
    request.signal.throwIfAborted();
    const pattern = `%${escapeLike(request.query)}%`;
    const rows = db.prepare(`SELECT path FROM files WHERE path LIKE ? ESCAPE '\\' LIMIT ?`).all(pattern, request.limit * 4);
    request.signal.throwIfAborted();
    const scored = [];
    for (const row of rows) {
        const path = toRelative(request.root, row.path);
        if (path === undefined)
            continue;
        const score = scorePath(path, request.query);
        if (score === 0)
            continue;
        scored.push({ path, score });
    }
    scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.path.localeCompare(b.path));
    const truncated = scored.length > request.limit;
    return { hits: scored.slice(0, request.limit), truncated };
}
/**
 * Search symbols in the codegraph `nodes` table by name.
 * @param db - open readonly database
 * @param request - provider request
 */
export async function searchSymbols(db, request) {
    request.signal.throwIfAborted();
    const pattern = `%${escapeLike(request.query)}%`;
    const rows = db.prepare(`SELECT name, kind, file_path, start_line FROM nodes
     WHERE lower(name) LIKE lower(?) ESCAPE '\\'
     LIMIT ?`).all(pattern, request.limit * 4);
    request.signal.throwIfAborted();
    const scored = [];
    for (const row of rows) {
        const path = toRelative(request.root, row.file_path);
        if (path === undefined)
            continue;
        const score = scorePath(row.name, request.query);
        scored.push({
            path,
            name: row.name,
            kind: row.kind,
            line: row.start_line,
            score,
        });
    }
    scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.name.localeCompare(b.name));
    const truncated = scored.length > request.limit;
    return { hits: scored.slice(0, request.limit), truncated };
}
//# sourceMappingURL=search.js.map