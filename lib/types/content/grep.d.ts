import type { ContentHit, ContentSearchFrame, ProviderSearchRequest } from '../service/types.ts';
export { resolveRgBinary } from './rg-path.ts';
/** Progress snapshot while ripgrep is still running. */
export interface GrepProgress {
    readonly matched: number;
    readonly pathHint?: string;
    readonly filesScanned?: number;
}
/** Options for {@link runWorkspaceGrep} / {@link iterateWorkspaceGrep}. */
export interface GrepRunOptions {
    readonly onProgress?: (progress: GrepProgress) => void;
    readonly progressIntervalMs?: number;
}
/**
 * Stream content-search frames from ripgrep `--json` under `request.root`.
 * Yields throttled `progress` frames, then a final `result` frame.
 * @param request - provider search request
 * @param options - progress throttle
 */
export declare function iterateWorkspaceGrep(request: ProviderSearchRequest, options?: GrepRunOptions): AsyncGenerator<ContentSearchFrame, void, void>;
/**
 * Run workspace content search under `request.root` via ripgrep `--json`.
 * Does not follow symlinks. Paths in hits are relative to root.
 * @param request - provider search request
 * @param options - optional progress callbacks
 */
export declare function runWorkspaceGrep(request: ProviderSearchRequest, options?: GrepRunOptions): Promise<{
    hits: ContentHit[];
    truncated: boolean;
    error?: string;
}>;
//# sourceMappingURL=grep.d.ts.map