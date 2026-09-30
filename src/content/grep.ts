import { spawn } from 'node:child_process'
import type { ContentHit, ProviderSearchRequest } from '../service/types.ts'
import { isUnderRoot, toRelative } from './path-util.ts'
import { resolveRgBinary } from './rg-path.ts'

const PREVIEW_MAX_CHARS = 200

export { resolveRgBinary } from './rg-path.ts'

function truncatePreview(text: string): string {
  if (text.includes('\0')) return ''
  const flat = text.replaceAll('\r', '').replaceAll('\n', ' ')
  if (flat.length <= PREVIEW_MAX_CHARS) return flat
  return flat.slice(0, PREVIEW_MAX_CHARS)
}

interface RgMatchLine {
  type?: string
  data?: {
    path?: { text?: string }
    line_number?: number
    lines?: { text?: string }
  }
}

/**
 * Run workspace content search under `request.root` via ripgrep `--json`.
 * Does not follow symlinks. Paths in hits are relative to root.
 * @param request - provider search request
 */
export async function runWorkspaceGrep(
  request: ProviderSearchRequest,
): Promise<{ hits: ContentHit[]; truncated: boolean; error?: string }> {
  request.signal.throwIfAborted()
  const rg = await resolveRgBinary()
  const argv = [
    '--json',
    '--no-config',
    `--regexp=${request.query}`,
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
      // rg: 0 = matches, 1 = no matches, 2 = error
      if (code !== 0 && code !== 1) {
        resolvePromise({
          hits: [],
          truncated: false,
          error: stderr.trim() || `rg exited with code ${String(code)}`,
        })
        return
      }

      const hits: ContentHit[] = []
      for (const line of stdout.split('\n')) {
        if (line.length === 0) continue
        let parsed: RgMatchLine
        try {
          parsed = JSON.parse(line) as RgMatchLine
        } catch {
          continue
        }
        if (parsed.type !== 'match' || parsed.data === undefined) continue
        const pathText = parsed.data.path?.text
        const lineNumber = parsed.data.line_number
        const previewRaw = parsed.data.lines?.text ?? ''
        if (pathText === undefined || lineNumber === undefined) continue
        const normalized = toRelative(request.root, pathText)
        if (normalized === undefined || !isUnderRoot(request.root, normalized)) continue
        const preview = truncatePreview(previewRaw)
        if (preview.length === 0) continue
        hits.push({ path: normalized, line: lineNumber, preview })
        if (hits.length > request.limit) break
      }
      const truncated = hits.length > request.limit
      resolvePromise({
        hits: hits.slice(0, request.limit),
        truncated,
      })
    })
  })
}
