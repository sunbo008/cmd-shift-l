import { openCodegraph } from "./db.js";
import { searchFilesInWorker, searchSymbolsInWorker } from "./worker-search.js";
/**
 * @param ctx - Cordis context with workspaceCodeSearch
 */
export function registerCodegraphProvider(ctx) {
    ctx.effect(() => ctx.workspaceCodeSearch.register({
        id: 'codegraph',
        status(root) {
            const opened = openCodegraph(root);
            opened.db?.close();
            return opened.status;
        },
        async searchFiles(request) {
            const opened = openCodegraph(request.root);
            opened.db?.close();
            if (opened.dbPath === undefined || opened.status.codegraph !== 'ready') {
                return { hits: [], truncated: false };
            }
            return await searchFilesInWorker(opened.dbPath, request);
        },
        async searchSymbols(request) {
            const opened = openCodegraph(request.root);
            opened.db?.close();
            if (opened.dbPath === undefined || opened.status.codegraph !== 'ready') {
                return { hits: [], truncated: false };
            }
            return await searchSymbolsInWorker(opened.dbPath, request);
        },
    }), 'workspace-code-search-codegraph: register');
}
export { openCodegraph } from "./db.js";
export { isUnderRoot, scorePath, searchFiles, searchSymbols } from "./search.js";
//# sourceMappingURL=register.js.map