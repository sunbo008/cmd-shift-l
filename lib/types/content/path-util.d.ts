import type { AbsolutePath } from '../service/types.ts';
/**
 * Return true when relativePath stays under root (no `..` escape).
 * On Windows, compares case-insensitively (drive letter / path casing).
 * @param root - workspace root
 * @param relativePath - candidate path relative to root
 */
export declare function isUnderRoot(root: string, relativePath: string): boolean;
/**
 * Score a path for ranking: prefix / path-segment matches beat substring.
 * @param path - relative path
 * @param query - search query
 */
export declare function scorePath(path: string, query: string): number;
/**
 * Normalize a stored / rg-emitted path to a root-relative path, or undefined.
 * @param root - workspace root
 * @param stored - path from index or rg
 */
export declare function toRelative(root: AbsolutePath | string, stored: string): string | undefined;
//# sourceMappingURL=path-util.d.ts.map