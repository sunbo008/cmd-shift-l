import type { FileHit, ProviderSearchRequest, SymbolHit } from '../service/types.ts';
/**
 * Search file paths via worker-thread SQLite.
 * @param dbPath - absolute path to codegraph.db
 * @param request - provider request
 */
export declare function searchFilesInWorker(dbPath: string, request: ProviderSearchRequest): Promise<{
    hits: FileHit[];
    truncated: boolean;
}>;
/**
 * Search symbols via worker-thread SQLite.
 * @param dbPath - absolute path to codegraph.db
 * @param request - provider request
 */
export declare function searchSymbolsInWorker(dbPath: string, request: ProviderSearchRequest): Promise<{
    hits: SymbolHit[];
    truncated: boolean;
}>;
//# sourceMappingURL=worker-search.d.ts.map