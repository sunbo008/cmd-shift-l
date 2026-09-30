/**
 * Registers the content (workspace grep) provider on `ctx.workspaceCodeSearch`.
 * Also supplies `searchFiles` via `rg --files` so paths omitted from codegraph
 * (e.g. Markdown) still appear under the file partition when the index is ready.
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@dsh-plugin/workspace-code-search'
import { runWorkspaceGrep } from './grep.ts'
import { listFilesByQuery } from './list-files.ts'

export const name = 'workspace-code-search-content'
export const inject = ['workspaceCodeSearch']

/**
 * @param ctx - Cordis context with workspaceCodeSearch
 */
export function apply(ctx: Context): void {
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
