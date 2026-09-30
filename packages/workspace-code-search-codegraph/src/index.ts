/**
 * Registers the codegraph file/symbol provider on `ctx.workspaceCodeSearch`.
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@dsh-plugin/workspace-code-search'
import { openCodegraph } from './db.ts'
import { searchFiles, searchSymbols } from './search.ts'

export const name = 'workspace-code-search-codegraph'
export const inject = ['workspaceCodeSearch']

/**
 * @param ctx - Cordis context with workspaceCodeSearch
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.workspaceCodeSearch.register({
    id: 'codegraph',
    status(root) {
      const opened = openCodegraph(root)
      opened.db?.close()
      return opened.status
    },
    async searchFiles(request) {
      const opened = openCodegraph(request.root)
      if (opened.db === undefined) {
        return { hits: [], truncated: false }
      }
      try {
        return await searchFiles(opened.db, request)
      } finally {
        opened.db.close()
      }
    },
    async searchSymbols(request) {
      const opened = openCodegraph(request.root)
      if (opened.db === undefined) {
        return { hits: [], truncated: false }
      }
      try {
        return await searchSymbols(opened.db, request)
      } finally {
        opened.db.close()
      }
    },
  }), 'workspace-code-search-codegraph: register')
}

export { openCodegraph } from './db.ts'
export { isUnderRoot, scorePath, searchFiles, searchSymbols } from './search.ts'
