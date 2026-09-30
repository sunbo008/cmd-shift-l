import { runWorkspaceGrep } from "./grep.js";
import { listFilesByQuery } from "./list-files.js";
/**
 * @param ctx - Cordis context with workspaceCodeSearch
 */
export function registerContentProvider(ctx) {
    ctx.effect(() => ctx.workspaceCodeSearch.register({
        id: 'content',
        async searchFiles(request) {
            try {
                return await listFilesByQuery(request);
            }
            catch (error) {
                if (request.signal.aborted)
                    throw error;
                return {
                    hits: [],
                    truncated: false,
                    error: error instanceof Error ? error.message : String(error),
                };
            }
        },
        async searchContent(request) {
            try {
                return await runWorkspaceGrep(request);
            }
            catch (error) {
                if (request.signal.aborted)
                    throw error;
                return {
                    hits: [],
                    truncated: false,
                    error: error instanceof Error ? error.message : String(error),
                };
            }
        },
    }), 'workspace-code-search-content: register');
}
export { resolveRgBinary, runWorkspaceGrep } from "./grep.js";
export { escapeGlob, listFilesByQuery, scorePath } from "./list-files.js";
//# sourceMappingURL=register.js.map