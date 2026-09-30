import { openCodegraph } from "./db.js";
import { searchFiles, searchSymbols } from "./search.js";
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
            if (opened.db === undefined) {
                return { hits: [], truncated: false };
            }
            try {
                return await searchFiles(opened.db, request);
            }
            finally {
                opened.db.close();
            }
        },
        async searchSymbols(request) {
            const opened = openCodegraph(request.root);
            if (opened.db === undefined) {
                return { hits: [], truncated: false };
            }
            try {
                return await searchSymbols(opened.db, request);
            }
            finally {
                opened.db.close();
            }
        },
    }), 'workspace-code-search-codegraph: register');
}
export { openCodegraph } from "./db.js";
export { isUnderRoot, scorePath, searchFiles, searchSymbols } from "./search.js";
//# sourceMappingURL=register.js.map