import type { AbsolutePath, CodegraphStatus, SearchKind, SearchResult, WorkspaceCodeSearchProvider } from './types.ts';
import type { Config } from './config.ts';
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