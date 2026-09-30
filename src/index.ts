/**
 * Host entry for @dsh-plugin/cmd-shift-l.
 * Registers search service, providers, and Typert Remote in one Cordis plugin.
 */
import type { Context } from '@deepseek-ai/cordis'
import { Config } from './config.ts'
import WorkspaceCodeSearchService from './service/index.ts'
import WorkspaceCodeSearchController from './api/index.ts'
import { registerCodegraphProvider } from './codegraph/register.ts'
import { registerContentProvider } from './content/register.ts'

export const name = 'cmd-shift-l'
export { Config }
export type { Config as ConfigType } from './config.ts'

export type {
  AbsolutePath,
  CodegraphStatus,
  ContentHit,
  FileHit,
  ProviderSearchRequest,
  SearchKind,
  SearchResult,
  SymbolHit,
  WorkspaceCodeSearch,
  WorkspaceCodeSearchProvider,
} from './service/types.ts'
export { asAbsolutePath } from './service/types.ts'

/**
 * @param ctx - Cordis host context
 * @param config - validated bundle config
 */
export function apply(ctx: Context, config: Config): void {
  ctx.plugin(WorkspaceCodeSearchService, {
    maxQueryCodeUnits: config.maxQueryCodeUnits,
    limitPerKind: config.limitPerKind,
    debounceMs: config.debounceMs,
    searchTimeoutMs: config.searchTimeoutMs,
  })
  ctx.inject(['workspaceCodeSearch'], (scoped) => {
    registerCodegraphProvider(scoped)
    registerContentProvider(scoped)
    scoped.plugin(WorkspaceCodeSearchController, {})
  })
}
