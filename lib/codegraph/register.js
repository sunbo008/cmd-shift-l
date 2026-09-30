import { probeCodegraphStatus } from "./probe.js";
import { searchFilesInWorker, searchSymbolsInWorker } from "./worker-search.js";
/**
 * @param ctx - Cordis context with workspaceCodeSearch
 */
export function registerCodegraphProvider(ctx) {
    ctx.effect(() => ctx.workspaceCodeSearch.register({
        id: 'codegraph',
        status(root) {
            const { dbPath: _dbPath, ...status } = probeCodegraphStatus(root);
            return status;
        },
        async searchFiles(request) {
            const probed = probeCodegraphStatus(request.root);
            if (probed.codegraph !== 'ready' || probed.dbPath === undefined) {
                return { hits: [], truncated: false };
            }
            return await searchFilesInWorker(probed.dbPath, request);
        },
        async searchSymbols(request) {
            const probed = probeCodegraphStatus(request.root);
            if (probed.codegraph !== 'ready' || probed.dbPath === undefined) {
                return { hits: [], truncated: false };
            }
            return await searchSymbolsInWorker(probed.dbPath, request);
        },
    }), 'workspace-code-search-codegraph: register');
}
export { openCodegraph } from "./db.js";
export { probeCodegraphStatus, codegraphDbPath } from "./probe.js";
export { isUnderRoot, scorePath, searchFiles, searchSymbols } from "./search.js";
//# sourceMappingURL=register.js.map