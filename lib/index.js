import { Config } from "./config.js";
import WorkspaceCodeSearchService from "./service/index.js";
import WorkspaceCodeSearchController from "./api/index.js";
import { registerCodegraphProvider } from "./codegraph/register.js";
import { registerContentProvider } from "./content/register.js";
export const name = 'cmd-shift-l';
export { Config };
export { asAbsolutePath } from "./service/types.js";
/**
 * @param ctx - Cordis host context
 * @param config - validated bundle config
 */
export function apply(ctx, config) {
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
//# sourceMappingURL=index.js.map