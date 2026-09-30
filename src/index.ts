/**
 * Host entry for @dsh-plugin/cmd-shift-l.
 *
 * Top-level imports stay light: never pull `node:sqlite`, Typert Remotes, or
 * providers during module evaluation. Windows Host previously stalled
 * `workspaceFiles.list` (Files「正在读取…」) when those loaded at plug-in boot.
 */
import type { Context } from '@deepseek-ai/cordis'
import { Config } from './config.ts'

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

/** Delay Host search wiring so Files / model RPC can finish first on Windows. */
const HOST_BOOT_DELAY_MS = 3_000

/**
 * @param ctx - Cordis host context
 * @param config - validated bundle config
 */
export function apply(ctx: Context, config: Config): void {
  ctx.effect(() => {
    const timer = setTimeout(() => {
      void import('./boot-host.ts')
        .then((mod) => {
          mod.bootHost(ctx, config)
        })
        .catch((error: unknown) => {
          console.error('[cmd-shift-l] deferred Host boot failed', error)
        })
    }, HOST_BOOT_DELAY_MS)
    return () => {
      clearTimeout(timer)
    }
  }, 'cmd-shift-l: deferred host boot')
}
