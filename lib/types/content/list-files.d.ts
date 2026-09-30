import type { FileHit, ProviderSearchRequest } from '../service/types.ts';
/** Escape ripgrep `--glob` metacharacters in a user query fragment. */
export declare function escapeGlob(value: string): string;
/**
 * Score a path for ranking (mirrors codegraph basename / substring preference).
 * @param path - relative path
 * @param query - search query
 */
export declare function scorePath(path: string, query: string): number;
/**
 * List workspace files whose relative path matches the query (via `rg --files`).
 * Complements codegraph file search for types the index omits (e.g. `.md`).
 * @param request - provider search request
 */
export declare function listFilesByQuery(request: ProviderSearchRequest): Promise<{
    hits: FileHit[];
    truncated: boolean;
    error?: string;
}>;
//# sourceMappingURL=list-files.d.ts.map