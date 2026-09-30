import WorkspaceCodeSearchService from "./service/index.js";
import WorkspaceCodeSearchController from "./api/index.js";
import { registerCodegraphProvider } from "./codegraph/register.js";
import { registerContentProvider } from "./content/register.js";
/**
 * Register search service + providers + Remote on an already-running Host.
 * @param ctx - Cordis host context
 * @param config - validated bundle config
 */
export function bootHost(ctx, config) {
    ctx.plugin(WorkspaceCodeSearchService, {
        maxQueryCodeUnits: config.maxQueryCodeUnits,
        limitPerKind: config.limitPerKind,
        debounceMs: config.debounceMs,
        searchTimeoutMs: config.searchTimeoutMs,
    });
    ctx.inject(['workspaceCodeSearch'], (scoped) => {
        registerCodegraphProvider(scoped);
        registerContentProvider(scoped);
        scoped.plugin(WorkspaceCodeSearchController, {});
    });
}
//# sourceMappingURL=boot-host.js.map