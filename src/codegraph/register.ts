/**
 * Registers the codegraph file/symbol provider on `ctx.workspaceCodeSearch`.
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '../service/index.ts'
import { probeCodegraphStatus } from './probe.ts'
import { searchFilesInWorker, searchSymbolsInWorker } from './worker-search.ts'

/**
 * @param ctx - Cordis context with workspaceCodeSearch
 */
export function registerCodegraphProvider(ctx: Context): void {
  ctx.effect(() => ctx.workspaceCodeSearch.register({
    id: 'codegraph',
    status(root) {
      const { dbPath: _dbPath, ...status } = probeCodegraphStatus(root)
      return status
    },
    async searchFiles(request) {
      const probed = probeCodegraphStatus(request.root)
      if (probed.codegraph !== 'ready' || probed.dbPath === undefined) {
        return { hits: [], truncated: false }
      }
      return await searchFilesInWorker(probed.dbPath, request)
    },
    async searchSymbols(request) {
      const probed = probeCodegraphStatus(request.root)
      if (probed.codegraph !== 'ready' || probed.dbPath === undefined) {
        return { hits: [], truncated: false }
      }
      return await searchSymbolsInWorker(probed.dbPath, request)
    },
  }), 'workspace-code-search-codegraph: register')
}

export { probeCodegraphStatus, codegraphDbPath } from './probe.ts'
export { isUnderRoot, scorePath, searchFiles, searchSymbols } from './search.ts'
