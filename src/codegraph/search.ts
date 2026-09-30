import type { DatabaseSync } from 'node:sqlite'
import type {
  AbsolutePath,
  FileHit,
  ProviderSearchRequest,
  SymbolHit,
} from '../service/types.ts'
import { isUnderRoot, scorePath, toRelative } from '../content/path-util.ts'

export { isUnderRoot, scorePath } from '../content/path-util.ts'

function escapeLike(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')
}

/**
 * Search file paths in the codegraph `files` table.
 * @param db - open readonly database
 * @param request - provider request
 */
export async function searchFiles(
  db: DatabaseSync,
  request: ProviderSearchRequest,
): Promise<{ hits: FileHit[]; truncated: boolean }> {
  request.signal.throwIfAborted()
  const pattern = `%${escapeLike(request.query)}%`
  const rows = db.prepare(
    `SELECT path FROM files WHERE path LIKE ? ESCAPE '\\' LIMIT ?`,
  ).all(pattern, request.limit * 4) as Array<{ path: string }>
  request.signal.throwIfAborted()
  const scored: FileHit[] = []
  for (const row of rows) {
    const path = toRelative(request.root, row.path)
    if (path === undefined) continue
    const score = scorePath(path, request.query)
    if (score === 0) continue
    scored.push({ path, score })
  }
  scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.path.localeCompare(b.path))
  const truncated = scored.length > request.limit
  return { hits: scored.slice(0, request.limit), truncated }
}

/**
 * Search symbols in the codegraph `nodes` table by name.
 * @param db - open readonly database
 * @param request - provider request
 */
export async function searchSymbols(
  db: DatabaseSync,
  request: ProviderSearchRequest,
): Promise<{ hits: SymbolHit[]; truncated: boolean }> {
  request.signal.throwIfAborted()
  const pattern = `%${escapeLike(request.query)}%`
  const rows = db.prepare(
    `SELECT name, kind, file_path, start_line FROM nodes
     WHERE lower(name) LIKE lower(?) ESCAPE '\\'
     LIMIT ?`,
  ).all(pattern, request.limit * 4) as Array<{
    name: string
    kind: string
    file_path: string
    start_line: number
  }>
  request.signal.throwIfAborted()
  const scored: SymbolHit[] = []
  for (const row of rows) {
    const path = toRelative(request.root as AbsolutePath, row.file_path)
    if (path === undefined) continue
    const score = scorePath(row.name, request.query)
    scored.push({
      path,
      name: row.name,
      kind: row.kind,
      line: row.start_line,
      score,
    })
  }
  scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.name.localeCompare(b.name))
  const truncated = scored.length > request.limit
  return { hits: scored.slice(0, request.limit), truncated }
}
