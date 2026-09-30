/**
 * Registers the content (workspace grep) provider on `ctx.workspaceCodeSearch`.
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '../service/index.ts'
import { runWorkspaceGrep } from './grep.ts'
import { listFilesByQuery } from './list-files.ts'

/**
 * @param ctx - Cordis context with workspaceCodeSearch
 */
export function registerContentProvider(ctx: Context): void {
  ctx.effect(() => ctx.workspaceCodeSearch.register({
    id: 'content',
    async searchFiles(request) {
      try {
        return await listFilesByQuery(request)
      } catch (error) {
        if (request.signal.aborted) throw error
        return { hits: [], truncated: false }
      }
    },
    async searchContent(request) {
      try {
        return await runWorkspaceGrep(request)
      } catch (error) {
        if (request.signal.aborted) throw error
        return {
          hits: [],
          truncated: false,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    },
  }), 'workspace-code-search-content: register')
}

export { resolveRgBinary, runWorkspaceGrep } from './grep.ts'
export { escapeGlob, listFilesByQuery, scorePath } from './list-files.ts'
