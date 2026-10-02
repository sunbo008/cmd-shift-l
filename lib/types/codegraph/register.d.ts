/**
 * Registers the codegraph file/symbol provider on `ctx.workspaceCodeSearch`.
 *
 * Do not import `./db.ts` here — that pulls `node:sqlite` into Host plugin load
 * and stalls Windows startup. SQLite opens only inside the search worker.
 */
import type { Context } from '@deepseek-ai/cordis';
/**
 * @param ctx - Cordis context with workspaceCodeSearch
 */
export declare function registerCodegraphProvider(ctx: Context): void;
export { probeCodegraphStatus, codegraphDbPath } from './probe.ts';
export { isUnderRoot, scorePath, searchFiles, searchSymbols } from './search.ts';
//# sourceMappingURL=register.d.ts.map