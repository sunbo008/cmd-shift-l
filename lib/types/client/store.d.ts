import type { CodegraphStatus, SearchKind, SearchResult } from '@dsh-plugin/workspace-code-search';
/** Kind toggles for the modal. */
export interface KindFlags {
    file: boolean;
    symbol: boolean;
    content: boolean;
}
/** Modal UI state. */
export interface SearchModalState {
    open: boolean;
    query: string;
    kinds: KindFlags;
    searching: boolean;
    result: SearchResult | undefined;
    error: string | undefined;
    codegraph: CodegraphStatus | undefined;
    selectedIndex: number;
    sessionId: string;
    workspaceRoot: string;
}
/** Create the initial closed modal state. */
export declare function createInitialState(seed?: {
    sessionId?: string;
    workspaceRoot?: string;
}): SearchModalState;
/** Flatten visible hits for keyboard navigation. */
export declare function flattenHits(result: SearchResult | undefined): Array<{
    kind: SearchKind;
    path: string;
    line?: number;
    label: string;
    preview?: string;
}>;
//# sourceMappingURL=store.d.ts.map