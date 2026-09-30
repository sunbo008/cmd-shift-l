/**
 * Path safety helpers shared by codegraph / content providers.
 */
import { relative, resolve, sep } from 'node:path';
/**
 * Return true when relativePath stays under root (no `..` escape).
 * On Windows, compares case-insensitively (drive letter / path casing).
 * @param root - workspace root
 * @param relativePath - candidate path relative to root
 */
export function isUnderRoot(root, relativePath) {
    if (relativePath.includes('\0'))
        return false;
    const normalized = relativePath.replaceAll('\\', '/').replace(/^\.\//, '');
    if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized))
        return false;
    const abs = resolve(root, normalized);
    const rootResolved = resolve(root);
    if (process.platform === 'win32') {
        const a = abs.toLowerCase();
        const r = rootResolved.toLowerCase();
        return a === r || a.startsWith(r.endsWith('\\') ? r : `${r}\\`);
    }
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
/**
 * Normalize a stored / rg-emitted path to a root-relative path, or undefined.
 * @param root - workspace root
 * @param stored - path from index or rg
 */
export function toRelative(root, stored) {
    const normalized = stored.replaceAll('\\', '/').replace(/^\.\//, '');
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
//# sourceMappingURL=path-util.js.map