/**
 * Host entry for @dsh-plugin/cmd-shift-l.
 *
 * Top-level imports stay light: never pull `node:sqlite`, Typert Remotes, or
 * providers during module evaluation. Windows Host previously stalled
 * `workspaceFiles.list` (Files「正在读取…」) when those loaded at plug-in boot.
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