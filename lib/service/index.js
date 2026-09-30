/**
 * Workspace code search Host service.
 */
import { Service } from '@deepseek-ai/cordis';
import { Config } from "./config.js";
import { orchestrateSearch, resolveCodegraphStatus } from "./orchestrate.js";
export { asAbsolutePath } from "./types.js";
export { Config } from "./config.js";
export { clampLimitPerKind, normalizeQuery, orchestrateSearch, resolveCodegraphStatus, } from "./orchestrate.js";
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
}
//# sourceMappingURL=index.js.map