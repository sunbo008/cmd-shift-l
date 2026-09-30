import type { ContentHit, ProviderSearchRequest } from '../service/types.ts';
/** Resolve the ripgrep binary: RG_PATH, then PATH `rg`. */
export declare function resolveRgBinary(): string;
/**
 * Run workspace content search under `request.root` via ripgrep `--json`.
 * Does not follow symlinks. Paths in hits are relative to root.
 * @param request - provider search request
 */
export declare function runWorkspaceGrep(request: ProviderSearchRequest): Promise<{
    hits: ContentHit[];
    truncated: boolean;
    error?: string;
}>;
//# sourceMappingURL=grep.d.ts.map