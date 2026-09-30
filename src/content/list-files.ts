import { spawn } from 'node:child_process'
import type { FileHit, ProviderSearchRequest } from '../service/types.ts'
import { isUnderRoot, scorePath, toRelative } from './path-util.ts'
import { resolveRgBinary } from './rg-path.ts'

/** Escape ripgrep `--glob` metacharacters in a user query fragment. */
export function escapeGlob(value: string): string {
  return value.replace(/[\\*?[\]{}]/g, '\\$&')
}

export { scorePath } from './path-util.ts'

/**
 * List workspace files whose relative path matches the query (via `rg --files`).
 * Complements codegraph file search for types the index omits (e.g. `.md`).
 * @param request - provider search request
 */
export async function listFilesByQuery(
  request: ProviderSearchRequest,
): Promise<{ hits: FileHit[]; truncated: boolean; error?: string }> {
  request.signal.throwIfAborted()
  const rg = await resolveRgBinary()
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
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
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
        const normalized = toRelative(request.root, line.trim())
        if (normalized === undefined || !isUnderRoot(request.root, normalized)) continue
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
