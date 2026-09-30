import { spawn } from 'node:child_process'
import type { ContentHit, ContentSearchFrame, ProviderSearchRequest } from '../service/types.ts'
import { isUnderRoot, toRelative } from './path-util.ts'
import { resolveRgBinary } from './rg-path.ts'

const PREVIEW_MAX_CHARS = 200
const DEFAULT_PROGRESS_INTERVAL_MS = 200

export { resolveRgBinary } from './rg-path.ts'

/** Progress snapshot while ripgrep is still running. */
export interface GrepProgress {
  readonly matched: number
  readonly pathHint?: string
  readonly filesScanned?: number
}

/** Options for {@link runWorkspaceGrep} / {@link iterateWorkspaceGrep}. */
export interface GrepRunOptions {
  readonly onProgress?: (progress: GrepProgress) => void
  readonly progressIntervalMs?: number
}

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
 * Stream content-search frames from ripgrep `--json` under `request.root`.
 * Yields throttled `progress` frames, then a final `result` frame.
 * @param request - provider search request
 * @param options - progress throttle
 */
export async function* iterateWorkspaceGrep(
  request: ProviderSearchRequest,
  options?: GrepRunOptions,
): AsyncGenerator<ContentSearchFrame, void, void> {
  request.signal.throwIfAborted()
  const progressIntervalMs = options?.progressIntervalMs ?? DEFAULT_PROGRESS_INTERVAL_MS
  const rg = await resolveRgBinary()
  const argv = [
    '--json',
    '--no-config',
    `--regexp=${request.query}`,
    '--',
    '.',
  ]

  const child = spawn(rg, argv, {
    cwd: request.root,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
    windowsHide: true,
  })

  const onAbort = (): void => {
    child.kill()
  }
  request.signal.addEventListener('abort', onAbort, { once: true })

  let lineBuffer = ''
  let stderr = ''
  const hits: ContentHit[] = []
  let matched = 0
  let filesScanned = 0
  let pathHint: string | undefined
  let lastProgressAt = 0
  let spawnError: Error | undefined
  let exitCode: number | null = null

  const queue: ContentSearchFrame[] = []
  let wake: (() => void) | undefined
  let closed = false

  const enqueue = (frame: ContentSearchFrame): void => {
    queue.push(frame)
    wake?.()
  }

  const maybeProgress = (force: boolean): void => {
    const now = Date.now()
    if (!force && now - lastProgressAt < progressIntervalMs) return
    if (matched === 0 && filesScanned === 0 && !force) return
    lastProgressAt = now
    enqueue({
      type: 'progress',
      matched,
      ...pathHint === undefined ? {} : { pathHint },
      ...filesScanned === 0 ? {} : { filesScanned },
    })
  }

  child.stdout?.setEncoding('utf8')
  child.stderr?.setEncoding('utf8')
  child.stderr?.on('data', (chunk: string) => {
    stderr += chunk
  })
  child.stdout?.on('data', (chunk: string) => {
    lineBuffer += chunk
    let newline = lineBuffer.indexOf('\n')
    while (newline >= 0) {
      const line = lineBuffer.slice(0, newline)
      lineBuffer = lineBuffer.slice(newline + 1)
      newline = lineBuffer.indexOf('\n')
      if (line.length === 0) continue
      let parsed: RgMatchLine
      try {
        parsed = JSON.parse(line) as RgMatchLine
      } catch {
        continue
      }
      if (parsed.type === 'begin') {
        filesScanned += 1
        const beginPath = parsed.data?.path?.text
        if (beginPath !== undefined) {
          const normalized = toRelative(request.root, beginPath)
          if (normalized !== undefined) pathHint = normalized
        }
        maybeProgress(false)
        continue
      }
      if (parsed.type !== 'match' || parsed.data === undefined) continue
      if (hits.length > request.limit) continue
      const pathText = parsed.data.path?.text
      const lineNumber = parsed.data.line_number
      const previewRaw = parsed.data.lines?.text ?? ''
      if (pathText === undefined || lineNumber === undefined) continue
      const normalized = toRelative(request.root, pathText)
      if (normalized === undefined || !isUnderRoot(request.root, normalized)) continue
      const preview = truncatePreview(previewRaw)
      if (preview.length === 0) continue
      hits.push({ path: normalized, line: lineNumber, preview })
      matched = hits.length
      pathHint = normalized
      maybeProgress(false)
      if (hits.length > request.limit) {
        child.kill()
      }
    }
  })

  child.on('error', (error) => {
    spawnError = error instanceof Error ? error : new Error(String(error))
    closed = true
    wake?.()
  })

  child.on('close', (code) => {
    exitCode = code
    closed = true
    wake?.()
  })

  try {
    while (!closed || queue.length > 0) {
      if (queue.length === 0) {
        if (closed) break
        await new Promise<void>((resolve) => {
          wake = resolve
        })
        wake = undefined
        continue
      }
      yield queue.shift()!
    }

    if (request.signal.aborted) {
      throw Object.assign(new Error('aborted'), { name: 'AbortError' })
    }
    if (spawnError !== undefined) {
      yield {
        type: 'result',
        hits: [],
        truncated: false,
        error: spawnError.message,
      }
      return
    }
    if (exitCode !== 0 && exitCode !== 1) {
      yield {
        type: 'result',
        hits: [],
        truncated: false,
        error: stderr.trim() || `rg exited with code ${String(exitCode)}`,
      }
      return
    }

    maybeProgress(true)
    while (queue.length > 0) {
      yield queue.shift()!
    }

    const truncated = hits.length > request.limit
    yield {
      type: 'result',
      hits: hits.slice(0, request.limit),
      truncated,
    }
  } finally {
    request.signal.removeEventListener('abort', onAbort)
  }
}

/**
 * Run workspace content search under `request.root` via ripgrep `--json`.
 * Does not follow symlinks. Paths in hits are relative to root.
 * @param request - provider search request
 * @param options - optional progress callbacks
 */
export async function runWorkspaceGrep(
  request: ProviderSearchRequest,
  options?: GrepRunOptions,
): Promise<{ hits: ContentHit[]; truncated: boolean; error?: string }> {
  let result: { hits: ContentHit[]; truncated: boolean; error?: string } | undefined
  for await (const frame of iterateWorkspaceGrep(request, options)) {
    if (frame.type === 'progress') {
      options?.onProgress?.({
        matched: frame.matched,
        ...frame.pathHint === undefined ? {} : { pathHint: frame.pathHint },
        ...frame.filesScanned === undefined ? {} : { filesScanned: frame.filesScanned },
      })
      continue
    }
    result = {
      hits: [...frame.hits],
      truncated: frame.truncated,
      ...frame.error === undefined ? {} : { error: frame.error },
    }
  }
  return result ?? { hits: [], truncated: false, error: 'content search produced no result frame' }
}
