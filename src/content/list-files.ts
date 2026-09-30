import { spawn } from 'node:child_process'
import { relative, resolve, sep } from 'node:path'
import type { FileHit, ProviderSearchRequest } from '../service/types.ts'
import { resolveRgBinary } from './grep.ts'

function isUnderRoot(root: string, relativePath: string): boolean {
  if (relativePath.includes('\0')) return false
  const normalized = relativePath.replaceAll('\\', '/')
  if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) return false
  if (normalized.split('/').includes('..')) return false
  const abs = resolve(root, normalized)
  const rootResolved = resolve(root)
  return abs === rootResolved || abs.startsWith(rootResolved + sep)
}

/** Escape ripgrep `--glob` metacharacters in a user query fragment. */
export function escapeGlob(value: string): string {
  return value.replace(/[\\*?[\]{}]/g, '\\$&')
}

/**
 * Score a path for ranking (mirrors codegraph basename / substring preference).
 * @param path - relative path
 * @param query - search query
 */
export function scorePath(path: string, query: string): number {
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

/**
 * List workspace files whose relative path matches the query (via `rg --files`).
 * Complements codegraph file search for types the index omits (e.g. `.md`).
 * @param request - provider search request
 */
export async function listFilesByQuery(
  request: ProviderSearchRequest,
): Promise<{ hits: FileHit[]; truncated: boolean; error?: string }> {
  request.signal.throwIfAborted()
  const rg = resolveRgBinary()
  const glob = `*${escapeGlob(request.query)}*`
  const argv = [
    '--files',
    '--no-config',
    '--color=never',
    `--glob=${glob}`,
    '--',
    '.',
  ]

  return await new Promise((resolvePromise, reject) => {
    const child = spawn(rg, argv, {
      cwd: request.root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''
    const onAbort = (): void => {
      child.kill()
    }
    request.signal.addEventListener('abort', onAbort, { once: true })

    child.stdout?.setEncoding('utf8')
    child.stderr?.setEncoding('utf8')
    child.stdout?.on('data', (chunk: string) => {
      stdout += chunk
    })
    child.stderr?.on('data', (chunk: string) => {
      stderr += chunk
    })

    child.on('error', (error) => {
      request.signal.removeEventListener('abort', onAbort)
      if (request.signal.aborted) {
        reject(error)
        return
      }
      resolvePromise({
        hits: [],
        truncated: false,
        error: error instanceof Error ? error.message : String(error),
      })
    })

    child.on('close', (code) => {
      request.signal.removeEventListener('abort', onAbort)
      if (request.signal.aborted) {
        reject(new Error('aborted'))
        return
      }
      // rg --files: 0 = listed, 1 = none, 2 = error
      if (code !== 0 && code !== 1) {
        resolvePromise({
          hits: [],
          truncated: false,
          error: stderr.trim() || `rg exited with code ${String(code)}`,
        })
        return
      }

      const scored: FileHit[] = []
      for (const line of stdout.split('\n')) {
        if (line.length === 0) continue
        const rel = line.replaceAll('\\', '/').replace(/^\.\//, '')
        const normalized = (rel.startsWith('/') || /^[A-Za-z]:\//.test(rel)
          ? relative(request.root, rel).replaceAll('\\', '/')
          : rel).replace(/^\.\//, '')
        if (!isUnderRoot(request.root, normalized)) continue
        const score = scorePath(normalized, request.query)
        if (score === 0) continue
        scored.push({ path: normalized, score })
      }
      scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.path.localeCompare(b.path))
      const truncated = scored.length > request.limit
      resolvePromise({
        hits: scored.slice(0, request.limit),
        truncated,
      })
    })
  })
}
