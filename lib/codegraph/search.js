import { relative, resolve, sep } from 'node:path';
function escapeLike(value) {
    return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}
/**
 * Return true when relativePath stays under root (no `..` escape).
 * @param root - workspace root
 * @param relativePath - candidate path relative to root
 */
export function isUnderRoot(root, relativePath) {
    if (relativePath.includes('\0'))
        return false;
    const normalized = relativePath.replaceAll('\\', '/');
    if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized))
        return false;
    const abs = resolve(root, normalized);
    const rootResolved = resolve(root);
    return abs === rootResolved || abs.startsWith(rootResolved + sep);
}
/**
 * Score a path for ranking: prefix / path-segment matches beat substring.
 * @param path - relative path
 * @param query - search query
 */
export function scorePath(path, query) {
    const p = path.toLowerCase();
    const q = query.toLowerCase();
    if (p === q)
        return 1000;
    const base = p.split('/').pop() ?? p;
    if (base === q)
        return 900;
    if (base.startsWith(q))
        return 800;
    if (p.startsWith(q))
        return 700;
    if (base.includes(q))
        return 500;
    if (p.includes(q))
        return 300;
    return 0;
}
function toRelative(root, stored) {
    const normalized = stored.replaceAll('\\', '/');
    if (!normalized.includes('/') && !normalized.includes('\\')) {
        return isUnderRoot(root, normalized) ? normalized : undefined;
    }
    if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) {
        const rel = relative(root, normalized).replaceAll('\\', '/');
        if (rel.startsWith('..') || rel === '')
            return undefined;
        return isUnderRoot(root, rel) ? rel : undefined;
    }
    return isUnderRoot(root, normalized) ? normalized : undefined;
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