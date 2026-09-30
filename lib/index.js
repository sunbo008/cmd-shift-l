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
    // Defer provider + Remote registration so Host boot (Sessions / Files) is not
    // delayed by this plugin's TYPERT wiring on Windows.
    ctx.inject(['workspaceCodeSearch'], (scoped) => {
        scoped.effect(() => {
            const timer = setTimeout(() => {
                registerCodegraphProvider(scoped);
                registerContentProvider(scoped);
                scoped.plugin(WorkspaceCodeSearchController, {});
            }, 0);
            return () => {
                clearTimeout(timer);
            };
        }, 'cmd-shift-l: deferred providers');
    });
}
//# sourceMappingURL=index.js.map