/**
 * Workspace code search Host service.
 */
import { Service, type Context } from '@deepseek-ai/cordis';
import { Config } from './config.ts';
import type { AbsolutePath, CodegraphStatus, SearchKind, SearchResult, WorkspaceCodeSearch, WorkspaceCodeSearchProvider } from './types.ts';
export type { AbsolutePath, CodegraphStatus, ContentHit, FileHit, ProviderSearchRequest, SearchKind, SearchResult, SymbolHit, WorkspaceCodeSearch, WorkspaceCodeSearchProvider, } from './types.ts';
export { asAbsolutePath } from './types.ts';
export { Config } from './config.ts';
export { clampLimitPerKind, normalizeQuery, orchestrateSearch, resolveCodegraphStatus, } from './orchestrate.ts';
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
}
//# sourceMappingURL=index.d.ts.map