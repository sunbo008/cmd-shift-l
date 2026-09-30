import type { AbsolutePath, CodegraphStatus, ContentLegResult, FileLegResult, SearchKind, SearchResult, SymbolLegResult, WorkspaceCodeSearchProvider } from './types.ts';
import type { Config } from './config.ts';
/** Shared inputs for a single search leg (query already normalized). */
export interface LegRequest {
    readonly root: AbsolutePath;
    readonly query: string;
    readonly limit: number;
    readonly signal: AbortSignal;
}
/** Normalize and validate a search query (session-search style). */
export declare function normalizeQuery(value: string, maxQueryCodeUnits: number): string;
/** Clamp requested limit to 1..=config.limitPerKind. */
export declare function clampLimitPerKind(requested: number | undefined, configLimit: number): number;
/**
 * Resolve codegraph status from registered providers (first that implements status).
 * @param providers - registered providers
 * @param root - workspace root
 */
export declare function resolveCodegraphStatus(providers: Iterable<WorkspaceCodeSearchProvider>, root: AbsolutePath): Promise<CodegraphStatus>;
/**
 * Run the file search leg only.
 * @param providers - registered providers
 * @param config - plugin config
 * @param request - normalized query + limit
 */
export declare function runFileLeg(providers: Iterable<WorkspaceCodeSearchProvider>, config: Config, request: LegRequest): Promise<FileLegResult>;
/**
 * Run the symbol search leg only.
 * @param providers - registered providers
 * @param config - plugin config
 * @param request - normalized query + limit
 */
export declare function runSymbolLeg(providers: Iterable<WorkspaceCodeSearchProvider>, config: Config, request: LegRequest): Promise<SymbolLegResult>;
/**
 * Run the content search leg only.
 * @param providers - registered providers
 * @param config - plugin config
 * @param request - normalized query + limit
 */
export declare function runContentLeg(providers: Iterable<WorkspaceCodeSearchProvider>, config: Config, request: LegRequest): Promise<ContentLegResult>;
/**
 * Orchestrate partitioned search across providers.
 * @param providers - registered providers
 * @param config - plugin config
 * @param request - search request
 */
export declare function orchestrateSearch(providers: Iterable<WorkspaceCodeSearchProvider>, config: Config, request: {
    root: AbsolutePath;
    query: string;
    kinds: readonly SearchKind[];
    limitPerKind?: number;
    signal: AbortSignal;
}): Promise<SearchResult>;
//# sourceMappingURL=orchestrate.d.ts.map