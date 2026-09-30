/**
 * Session-scoped Typert Remote for workspace code search.
 * Reuses the `workspaceFileScope` lookup registered by dsh workspace-files (same wire shape).
 *
 * Compatible with `@deepseek-ai/dsh-typert-protocol@~0.2.0-rc.2` (Stage 3 `@Remote`,
 * no `RemoteError` export — failures rethrow as `Error`).
 */
import { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { CodegraphStatus, SearchResult } from '../service/types.ts';
import { type RemoteSearchRequest, type WorkspaceSearchScope } from './types.ts';
export type { RemoteSearchRequest, WorkspaceSearchScope } from './types.ts';
export type { WorkspaceCodeSearchRemote } from './client.ts';
export { requireWorkspaceRoot } from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        workspaceCodeSearchController: WorkspaceCodeSearchController;
    }
}
/** No tunables beyond the Host search service Config. */
export interface Config {
}
/** Empty schemastery schema for the Remote controller. */
export declare const Config: Schema<Config>;
/**
 * Typert Remote controller. Client must not pass AbsolutePath roots.
 */
export default class WorkspaceCodeSearchController extends TypertRemoteService {
    static inject: string[];
    static Config: Schema<Config>;
    /**
     * @param ctx - Host context
     * @param _config - empty validated config
     */
    constructor(ctx: Context, _config: Config);
    /**
     * @param workspaceFileScope - Session-derived workspace root (lookup name matches workspace-files)
     */
    status(workspaceFileScope: WorkspaceSearchScope): Promise<CodegraphStatus>;
    /**
     * @param workspaceFileScope - Session-derived workspace root
     * @param request - query without root
     * @param signal - cancellation
     */
    search(workspaceFileScope: WorkspaceSearchScope, request: RemoteSearchRequest, signal: AbortSignal): Promise<SearchResult>;
}
//# sourceMappingURL=index.d.ts.map