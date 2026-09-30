/**
 * Registers the content (workspace grep) provider on `ctx.workspaceCodeSearch`.
 */
import type { Context } from '@deepseek-ai/cordis';
/**
 * @param ctx - Cordis context with workspaceCodeSearch
 */
export declare function registerContentProvider(ctx: Context): void;
export { resolveRgBinary, runWorkspaceGrep } from './grep.ts';
export { escapeGlob, listFilesByQuery, scorePath } from './list-files.ts';
//# sourceMappingURL=register.d.ts.map