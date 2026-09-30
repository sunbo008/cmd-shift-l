/**
 * Host entry for @dsh-plugin/cmd-shift-l.
 * Registers search service, providers, and Typert Remote in one Cordis plugin.
 */
import type { Context } from '@deepseek-ai/cordis';
import { Config } from './config.ts';
export declare const name = "cmd-shift-l";
export { Config };
export type { Config as ConfigType } from './config.ts';
export type { AbsolutePath, CodegraphStatus, ContentHit, FileHit, ProviderSearchRequest, SearchKind, SearchResult, SymbolHit, WorkspaceCodeSearch, WorkspaceCodeSearchProvider, } from './service/types.ts';
export { asAbsolutePath } from './service/types.ts';
/**
 * @param ctx - Cordis host context
 * @param config - validated bundle config
 */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map