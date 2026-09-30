import type { SearchKind, SearchResult } from '@dsh-plugin/workspace-code-search';
import type { WorkspaceCodeSearchRemote, WorkspaceSearchScope } from '@dsh-plugin/api-workspace-code-search/client';
/** Client search knobs (mirrors Host Config defaults). */
export interface SearchUiConfig {
    readonly debounceMs: number;
}
/** Collect enabled kinds from toggle flags. */
export declare function kindsFromFlags(flags: {
    file: boolean;
    symbol: boolean;
    content: boolean;
}): SearchKind[];
/** True when the query should not hit Remote.search. */
export declare function shouldSkipSearch(query: string, kinds: readonly SearchKind[]): boolean;
/**
 * Debounced Remote search with AbortController rotation and issued/rendered seq.
 */
export declare class SearchRequestController {
    private readonly remote;
    private readonly scope;
    private readonly config;
    private readonly onResult;
    private readonly onError;
    private debounceTimer;
    private controller;
    private issuedSeq;
    private renderedSeq;
    constructor(remote: WorkspaceCodeSearchRemote, scope: WorkspaceSearchScope, config: SearchUiConfig, onResult: (result: SearchResult | undefined, searching: boolean) => void, onError: (message: string | undefined) => void);
    /** Cancel in-flight work and timers. */
    dispose(): void;
    /**
     * Schedule a search; empty query / empty kinds skip Remote.
     * @param query - raw input
     * @param kinds - enabled partitions
     */
    schedule(query: string, kinds: readonly SearchKind[]): void;
    private run;
    private accept;
}
//# sourceMappingURL=search-controller.d.ts.map