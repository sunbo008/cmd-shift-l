import type { FileHit, ProviderSearchRequest } from '../service/types.ts';
/** Escape ripgrep `--glob` metacharacters in a user query fragment. */
export declare function escapeGlob(value: string): string;
export { scorePath } from './path-util.ts';
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