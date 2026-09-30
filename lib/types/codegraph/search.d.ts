import type { DatabaseSync } from 'node:sqlite';
import type { AbsolutePath, FileHit, ProviderSearchRequest, SymbolHit } from '../service/types.ts';
/**
 * Return true when relativePath stays under root (no `..` escape).
 * @param root - workspace root
 * @param relativePath - candidate path relative to root
 */
export declare function isUnderRoot(root: AbsolutePath, relativePath: string): boolean;
/**
 * Score a path for ranking: prefix / path-segment matches beat substring.
 * @param path - relative path
 * @param query - search query
 */
export declare function scorePath(path: string, query: string): number;
/**
 * Search file paths in the codegraph `files` table.
 * @param db - open readonly database
 * @param request - provider request
 */
export declare function searchFiles(db: DatabaseSync, request: ProviderSearchRequest): Promise<{
    hits: FileHit[];
    truncated: boolean;
}>;
/**
 * Search symbols in the codegraph `nodes` table by name.
 * @param db - open readonly database
 * @param request - provider request
 */
export declare function searchSymbols(db: DatabaseSync, request: ProviderSearchRequest): Promise<{
    hits: SymbolHit[];
    truncated: boolean;
}>;
//# sourceMappingURL=search.d.ts.map