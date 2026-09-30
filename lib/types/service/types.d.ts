/** Search partition kinds exposed to Remote and UI. */
export type SearchKind = 'file' | 'content' | 'symbol';
/** Host-resolved absolute workspace root (branded for documentation). */
export type AbsolutePath = string & {
    readonly __brand: 'AbsolutePath';
};
/** Cast a verified absolute path string to {@link AbsolutePath}. */
export declare function asAbsolutePath(path: string): AbsolutePath;
/** One file-path hit from the codegraph file index. */
export interface FileHit {
    readonly path: string;
    readonly score?: number;
}
/** One symbol hit from the codegraph node index. */
export interface SymbolHit {
    readonly path: string;
    readonly name: string;
    readonly kind: string;
    readonly line?: number;
    readonly score?: number;
}
/** One content hit from workspace grep. */
export interface ContentHit {
    readonly path: string;
    readonly line: number;
    readonly preview: string;
}
/** Unified partitioned search response. */
export interface SearchResult {
    readonly files: readonly FileHit[];
    readonly symbols: readonly SymbolHit[];
    readonly content: readonly ContentHit[];
    readonly truncated: boolean;
    readonly errors?: Partial<Record<'file' | 'symbol' | 'content' | 'codegraph', string>>;
}
/** codegraph availability for banners. */
export interface CodegraphStatus {
    readonly codegraph: 'ready' | 'missing' | 'error';
    readonly message?: string;
}
/** Per-leg provider request (Host-resolved root). */
export interface ProviderSearchRequest {
    readonly root: AbsolutePath;
    readonly query: string;
    readonly limit: number;
    readonly signal: AbortSignal;
}
/**
 * Provider registers a subset of capabilities.
 * codegraph providers implement status + files + symbols; content implements searchContent.
 */
export interface WorkspaceCodeSearchProvider {
    readonly id: string;
    status?(root: AbsolutePath): CodegraphStatus | Promise<CodegraphStatus>;
    searchFiles?(request: ProviderSearchRequest): Promise<{
        hits: FileHit[];
        truncated: boolean;
        error?: string;
    }>;
    searchSymbols?(request: ProviderSearchRequest): Promise<{
        hits: SymbolHit[];
        truncated: boolean;
    }>;
    searchContent?(request: ProviderSearchRequest): Promise<{
        hits: ContentHit[];
        truncated: boolean;
        error?: string;
    }>;
}
/** Host service API. */
export interface WorkspaceCodeSearch {
    /**
     * Register a search provider; disposer removes it.
     * @param provider - provider contribution
     */
    register(provider: WorkspaceCodeSearchProvider): () => void;
    /**
     * Report codegraph status under root.
     * @param root - Session workspace root
     */
    status(root: AbsolutePath): Promise<CodegraphStatus>;
    /**
     * Run a partitioned search.
     * @param request - query, kinds, optional limit, abort signal
     */
    search(request: {
        root: AbsolutePath;
        query: string;
        kinds: readonly SearchKind[];
        limitPerKind?: number;
        signal: AbortSignal;
    }): Promise<SearchResult>;
}
//# sourceMappingURL=types.d.ts.map