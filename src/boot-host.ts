/**
 * Deferred Host wiring (service, providers, Typert Remote).
 * Loaded only after {@link apply} schedules a timer — keeps plugin entry light.
 */
import type { Context } from '@deepseek-ai/cordis'
import type { Config } from './config.ts'
import WorkspaceCodeSearchService from './service/index.ts'
import WorkspaceCodeSearchController from './api/index.ts'
import { registerCodegraphProvider } from './codegraph/register.ts'
import { registerContentProvider } from './content/register.ts'

/**
 * Register search service + providers + Remote on an already-running Host.
 * @param ctx - Cordis host context
 * @param config - validated bundle config
 */
export function bootHost(ctx: Context, config: Config): void {
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
