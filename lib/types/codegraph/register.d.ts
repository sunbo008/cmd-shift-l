/**
 * Registers the codegraph file/symbol provider on `ctx.workspaceCodeSearch`.
 */
import type { Context } from '@deepseek-ai/cordis';
/**
 * @param ctx - Cordis context with workspaceCodeSearch
 */
export declare function registerCodegraphProvider(ctx: Context): void;
export { openCodegraph } from './db.ts';
export { probeCodegraphStatus, codegraphDbPath } from './probe.ts';
export { isUnderRoot, scorePath, searchFiles, searchSymbols } from './search.ts';
//# sourceMappingURL=register.d.ts.map