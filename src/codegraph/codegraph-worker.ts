/**
 * Worker-thread codegraph queries so Host event loop stays responsive
 * (DatabaseSync is sync; a large Windows index otherwise freezes Remote).
 */
import { parentPort, workerData } from 'node:worker_threads'
import { DatabaseSync } from 'node:sqlite'
import { relative, resolve, sep } from 'node:path'

interface WorkerRequest {
  readonly dbPath: string
  readonly kind: 'files' | 'symbols'
  readonly query: string
  readonly limit: number
  readonly root: string
}

interface FileRow { path: string; score: number }
interface SymbolRow {
  path: string
  name: string
  kind: string
  line: number
  score: number
}

function escapeLike(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')
}

function isUnderRoot(root: string, relativePath: string): boolean {
  if (relativePath.includes('\0')) return false
  const normalized = relativePath.replaceAll('\\', '/').replace(/^\.\//, '')
  if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) return false
  const abs = resolve(root, normalized)
  const rootResolved = resolve(root)
  if (process.platform === 'win32') {
    const a = abs.toLowerCase()
    const r = rootResolved.toLowerCase()
    return a === r || a.startsWith(r.endsWith('\\') ? r : `${r}\\`)
  }
  return abs === rootResolved || abs.startsWith(rootResolved + sep)
}

function scorePath(path: string, query: string): number {
  const p = path.toLowerCase()
  const q = query.toLowerCase()
  if (p === q) return 1000
  const base = p.split('/').pop() ?? p
  if (base === q) return 900
  if (base.startsWith(q)) return 800
  if (p.startsWith(q)) return 700
  if (base.includes(q)) return 500
  if (p.includes(q)) return 300
  return 0
}

function toRelative(root: string, stored: string): string | undefined {
  const normalized = stored.replaceAll('\\', '/')
  if (!normalized.includes('/') && !normalized.includes('\\')) {
    return isUnderRoot(root, normalized) ? normalized : undefined
  }
  if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) {
    const rel = relative(root, normalized).replaceAll('\\', '/')
    if (rel.startsWith('..') || rel === '') return undefined
    return isUnderRoot(root, rel) ? rel : undefined
  }
  return isUnderRoot(root, normalized) ? normalized : undefined
}

function run(request: WorkerRequest): { hits: FileRow[] | SymbolRow[]; truncated: boolean } {
  const db = new DatabaseSync(request.dbPath, { readOnly: true })
  try {
    const pattern = `%${escapeLike(request.query)}%`
    if (request.kind === 'files') {
      const rows = db.prepare(
        `SELECT path FROM files WHERE path LIKE ? ESCAPE '\\' LIMIT ?`,
      ).all(pattern, request.limit * 4) as Array<{ path: string }>
      const scored: FileRow[] = []
      for (const row of rows) {
        const path = toRelative(request.root, row.path)
        if (path === undefined) continue
        const score = scorePath(path, request.query)
        if (score === 0) continue
        scored.push({ path, score })
      }
      scored.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
      return {
        hits: scored.slice(0, request.limit),
        truncated: scored.length > request.limit,
      }
    }
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
    const scored: SymbolRow[] = []
    for (const row of rows) {
      const path = toRelative(request.root, row.file_path)
      if (path === undefined) continue
      scored.push({
        path,
        name: row.name,
        kind: row.kind,
        line: row.start_line,
        score: scorePath(row.name, request.query),
      })
    }
    scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    return {
      hits: scored.slice(0, request.limit),
      truncated: scored.length > request.limit,
    }
  } finally {
    db.close()
  }
}

const request = workerData as WorkerRequest
try {
  parentPort?.postMessage({ ok: true, ...run(request) })
} catch (error) {
  parentPort?.postMessage({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  })
}
