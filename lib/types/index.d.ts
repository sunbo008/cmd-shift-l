/**
 * Host entry for @dsh-plugin/cmd-shift-l.
 *
 * TEMPORARY: apply is a no-op so Windows web can boot while we isolate the hang.
 * Search Host / Remote / providers are disabled until Sessions + Files stay responsive
 * with this package installed.
 */
import type { Context } from '@deepseek-ai/cordis';
import { Config } from './config.ts';
export declare const name = "cmd-shift-l";
export { Config };
export type { Config as ConfigType } from './config.ts';
export type { AbsolutePath, CodegraphStatus, ContentHit, FileHit, ProviderSearchRequest, SearchKind, SearchResult, SymbolHit, WorkspaceCodeSearch, WorkspaceCodeSearchProvider, } from './service/types.ts';
export { asAbsolutePath } from './service/types.ts';
/**
 * @param _ctx - Cordis host context (unused while inert)
 * @param _config - validated bundle config (unused while inert)
 */
export declare function apply(_ctx: Context, _config: Config): void;
//# sourceMappingURL=index.d.ts.map