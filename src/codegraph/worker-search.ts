/**
 * Run codegraph file/symbol search in a worker thread (DatabaseSync is sync).
 */
import { Worker } from 'node:worker_threads'
import { fileURLToPath } from 'node:url'
import type { FileHit, ProviderSearchRequest, SymbolHit } from '../service/types.ts'

const workerUrl = new URL('./codegraph-worker.js', import.meta.url)

interface WorkerOk {
  readonly ok: true
  readonly hits: unknown[]
  readonly truncated: boolean
}

interface WorkerErr {
  readonly ok: false
  readonly error: string
}

function runWorker(
  kind: 'files' | 'symbols',
  request: ProviderSearchRequest,
  dbPath: string,
): Promise<{ hits: unknown[]; truncated: boolean }> {
  request.signal.throwIfAborted()
  return new Promise((resolve, reject) => {
    let settled = false
    const worker = new Worker(fileURLToPath(workerUrl), {
      workerData: {
        dbPath,
        kind,
        query: request.query,
        limit: request.limit,
        root: request.root,
      },
    })
    const finish = (fn: () => void): void => {
      if (settled) return
      settled = true
      request.signal.removeEventListener('abort', onAbort)
      fn()
    }
    const onAbort = (): void => {
      void worker.terminate().finally(() => {
        finish(() => {
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
        })
      })
    }
    if (request.signal.aborted) {
      onAbort()
      return
    }
    request.signal.addEventListener('abort', onAbort, { once: true })
    worker.once('message', (message: WorkerOk | WorkerErr) => {
      void worker.terminate()
      finish(() => {
        if (!message.ok) {
          reject(new Error(message.error))
          return
        }
        resolve({ hits: message.hits, truncated: message.truncated })
      })
    })
    worker.once('error', (error) => {
      finish(() => { reject(error) })
    })
    worker.once('exit', (code) => {
      finish(() => {
        if (code !== 0 && code !== null) {
          reject(new Error(`codegraph worker exited with code ${String(code)}`))
        }
      })
    })
  })
}

/**
 * Search file paths via worker-thread SQLite.
 * @param dbPath - absolute path to codegraph.db
 * @param request - provider request
 */
export async function searchFilesInWorker(
  dbPath: string,
  request: ProviderSearchRequest,
): Promise<{ hits: FileHit[]; truncated: boolean }> {
  const result = await runWorker('files', request, dbPath)
  return {
    hits: result.hits as FileHit[],
    truncated: result.truncated,
  }
}

/**
 * Search symbols via worker-thread SQLite.
 * @param dbPath - absolute path to codegraph.db
 * @param request - provider request
 */
export async function searchSymbolsInWorker(
  dbPath: string,
  request: ProviderSearchRequest,
): Promise<{ hits: SymbolHit[]; truncated: boolean }> {
  const result = await runWorker('symbols', request, dbPath)
  return {
    hits: result.hits as SymbolHit[],
    truncated: result.truncated,
  }
}
