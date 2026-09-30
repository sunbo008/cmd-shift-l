import { existsSync, accessSync, constants } from 'node:fs'
import { join } from 'node:path'
import type { AbsolutePath, CodegraphStatus } from '../service/types.ts'

/** Codegraph DB path under a workspace root (no SQLite open). */
export function codegraphDbPath(root: AbsolutePath): string {
  return join(root, '.codegraph', 'codegraph.db')
}

/**
 * Probe codegraph availability without loading `node:sqlite` on the Host.
 * Table validity is checked inside the search worker on first query.
 * @param root - Session workspace absolute root
 */
export function probeCodegraphStatus(root: AbsolutePath): CodegraphStatus & { dbPath?: string } {
  const dbPath = codegraphDbPath(root)
  if (!existsSync(dbPath)) {
    return { codegraph: 'missing', message: 'No .codegraph/codegraph.db under workspace root' }
  }
  try {
    accessSync(dbPath, constants.R_OK)
  } catch {
    return { codegraph: 'error', message: 'codegraph.db is not readable' }
  }
  return { codegraph: 'ready', dbPath }
}
