import type { DatabaseSync } from 'node:sqlite';
import type { FileHit, ProviderSearchRequest, SymbolHit } from '../service/types.ts';
export { isUnderRoot, scorePath } from '../content/path-util.ts';
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