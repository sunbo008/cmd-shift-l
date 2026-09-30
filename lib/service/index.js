/**
 * Workspace code search Host service.
 */
import { Service } from '@deepseek-ai/cordis';
import { Config } from "./config.js";
import { clampLimitPerKind, normalizeQuery, orchestrateSearch, resolveCodegraphStatus, runContentLeg, runFileLeg, runSymbolLeg, } from "./orchestrate.js";
import { iterateWorkspaceGrep } from "../content/grep.js";
export { asAbsolutePath } from "./types.js";
export { Config } from "./config.js";
export { clampLimitPerKind, normalizeQuery, orchestrateSearch, resolveCodegraphStatus, runContentLeg, runFileLeg, runSymbolLeg, } from "./orchestrate.js";
/** Cordis service: provider registry + partitioned search orchestration. */
export default class WorkspaceCodeSearchService extends Service {
    config;
    static inject = [];
    static Config = Config;
    providers = new Map();
    /**
     * @param ctx - Cordis context
     * @param config - validated plugin config
     */
    constructor(ctx, config) {
        super(ctx, 'workspaceCodeSearch');
        this.config = config;
    }
    /**
     * @param provider - provider contribution
     * @returns disposer removing the provider
     */
    register(provider) {
        const dispose = this.ctx.effect(() => {
            if (this.providers.has(provider.id)) {
                throw new Error(`workspaceCodeSearch: duplicate provider "${provider.id}"`);
            }
            this.providers.set(provider.id, provider);
            return () => {
                this.providers.delete(provider.id);
            };
        }, `workspaceCodeSearch.register(${JSON.stringify(provider.id)})`);
        return () => {
            void dispose();
        };
    }
    /**
     * @param root - Session workspace root
     * @returns codegraph status
     */
    async status(root) {
        return await resolveCodegraphStatus(this.providers.values(), root);
    }
    /**
     * @param request - search request
     * @returns partitioned results
     */
    async search(request) {
        return await orchestrateSearch(this.providers.values(), this.config, request);
    }
    /**
     * @param request - file-leg request
     * @returns file hits
     */
    async searchFiles(request) {
        const query = normalizeQuery(request.query, this.config.maxQueryCodeUnits);
        const limit = clampLimitPerKind(request.limitPerKind, this.config.limitPerKind);
        return await runFileLeg(this.providers.values(), this.config, {
            root: request.root,
            query,
            limit,
            signal: request.signal,
        });
    }
    /**
     * @param request - symbol-leg request
     * @returns symbol hits
     */
    async searchSymbols(request) {
        const query = normalizeQuery(request.query, this.config.maxQueryCodeUnits);
        const limit = clampLimitPerKind(request.limitPerKind, this.config.limitPerKind);
        return await runSymbolLeg(this.providers.values(), this.config, {
            root: request.root,
            query,
            limit,
            signal: request.signal,
        });
    }
    /**
     * @param request - content-leg request
     * @returns content hits
     */
    async searchContent(request) {
        const query = normalizeQuery(request.query, this.config.maxQueryCodeUnits);
        const limit = clampLimitPerKind(request.limitPerKind, this.config.limitPerKind);
        return await runContentLeg(this.providers.values(), this.config, {
            root: request.root,
            query,
            limit,
            signal: request.signal,
        });
    }
    /**
     * Stream content progress + final result (ripgrep JSON).
     * @param request - content-leg request
     */
    async *searchContentStream(request) {
        const query = normalizeQuery(request.query, this.config.maxQueryCodeUnits);
        const limit = clampLimitPerKind(request.limitPerKind, this.config.limitPerKind);
        const local = new AbortController();
        const timer = setTimeout(() => {
            local.abort(new DOMException(`workspaceCodeSearch timed out after ${String(this.config.searchTimeoutMs)}ms`, 'TimeoutError'));
        }, this.config.searchTimeoutMs);
        const onParentAbort = () => {
            local.abort(request.signal.reason);
        };
        if (request.signal.aborted) {
            clearTimeout(timer);
            throw request.signal.reason instanceof Error ? request.signal.reason : new Error('aborted');
        }
        request.signal.addEventListener('abort', onParentAbort, { once: true });
        try {
            yield* iterateWorkspaceGrep({ root: request.root, query, limit, signal: local.signal }, { progressIntervalMs: 200 });
        }
        finally {
            clearTimeout(timer);
            request.signal.removeEventListener('abort', onParentAbort);
        }
    }
}
//# sourceMappingURL=index.js.map