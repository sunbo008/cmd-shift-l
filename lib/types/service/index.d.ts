/**
 * Workspace code search Host service.
 */
import { Service, type Context } from '@deepseek-ai/cordis';
import { Config } from './config.ts';
import type { AbsolutePath, CodegraphStatus, ContentLegResult, ContentSearchFrame, FileLegResult, SearchKind, SearchResult, SymbolLegResult, WorkspaceCodeSearch, WorkspaceCodeSearchProvider } from './types.ts';
export type { AbsolutePath, CodegraphStatus, ContentHit, ContentLegResult, ContentSearchFrame, FileHit, FileLegResult, ProviderSearchRequest, SearchKind, SearchResult, SymbolHit, SymbolLegResult, WorkspaceCodeSearch, WorkspaceCodeSearchProvider, } from './types.ts';
export { asAbsolutePath } from './types.ts';
export { Config } from './config.ts';
export { clampLimitPerKind, normalizeQuery, orchestrateSearch, resolveCodegraphStatus, runContentLeg, runFileLeg, runSymbolLeg, } from './orchestrate.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        workspaceCodeSearch: WorkspaceCodeSearch;
    }
}
/** Cordis service: provider registry + partitioned search orchestration. */
export default class WorkspaceCodeSearchService extends Service implements WorkspaceCodeSearch {
    readonly config: Config;
    static inject: readonly [];
    static Config: import("@deepseek-ai/schemastery").default<Config>;
    private readonly providers;
    /**
     * @param ctx - Cordis context
     * @param config - validated plugin config
     */
    constructor(ctx: Context, config: Config);
    /**
     * @param provider - provider contribution
     * @returns disposer removing the provider
     */
    register(provider: WorkspaceCodeSearchProvider): () => void;
    /**
     * @param root - Session workspace root
     * @returns codegraph status
     */
    status(root: AbsolutePath): Promise<CodegraphStatus>;
    /**
     * @param request - search request
     * @returns partitioned results
     */
    search(request: {
        root: AbsolutePath;
        query: string;
        kinds: readonly SearchKind[];
        limitPerKind?: number;
        signal: AbortSignal;
    }): Promise<SearchResult>;
    /**
     * @param request - file-leg request
     * @returns file hits
     */
    searchFiles(request: {
        root: AbsolutePath;
        query: string;
        limitPerKind?: number;
        signal: AbortSignal;
    }): Promise<FileLegResult>;
    /**
     * @param request - symbol-leg request
     * @returns symbol hits
     */
    searchSymbols(request: {
        root: AbsolutePath;
        query: string;
        limitPerKind?: number;
        signal: AbortSignal;
    }): Promise<SymbolLegResult>;
    /**
     * @param request - content-leg request
     * @returns content hits
     */
    searchContent(request: {
        root: AbsolutePath;
        query: string;
        limitPerKind?: number;
        signal: AbortSignal;
    }): Promise<ContentLegResult>;
    /**
     * Stream content progress + final result (ripgrep JSON).
     * @param request - content-leg request
     */
    searchContentStream(request: {
        root: AbsolutePath;
        query: string;
        limitPerKind?: number;
        signal: AbortSignal;
    }): AsyncGenerator<ContentSearchFrame, void, void>;
}
//# sourceMappingURL=index.d.ts.map