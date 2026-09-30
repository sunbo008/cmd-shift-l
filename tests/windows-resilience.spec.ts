import { beforeAll, describe, expect, it, vi } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { asAbsolutePath } from '../src/service/index.ts'
import { searchFilesInWorker, searchSymbolsInWorker } from '../src/codegraph/worker-search.ts'
import { isUnderRoot } from '../src/content/path-util.ts'
import { SearchRequestController } from '../src/client/search-controller.ts'
import type { WorkspaceCodeSearchRemote } from '../src/api/client.ts'
import type { SearchResult } from '../src/service/types.ts'

const testsDir = resolve(fileURLToPath(new URL('.', import.meta.url)))
const fixtures = resolve(testsDir, 'fixtures')
const readyDb = resolve(fixtures, 'ready', '.codegraph', 'codegraph.db')

beforeAll(() => {
  if (!existsSync(readyDb)) {
    execFileSync(process.execPath, [resolve(testsDir, 'make-fixtures.mjs')], { stdio: 'inherit' })
  }
})

describe('codegraph worker search', () => {
  it('finds files and symbols off the Host event loop', async () => {
    const root = asAbsolutePath(resolve(fixtures, 'ready'))
    // Do not open SQLite on the test process: parallel specs share fixtures/ready,
    // and a Host-side handle races the worker ("database is locked").
    const run = async () => {
      const files = await searchFilesInWorker(readyDb, {
        root,
        query: 'foo',
        limit: 10,
        signal: AbortSignal.timeout(10_000),
      })
      expect(files.hits[0]?.path).toBe('src/foo.ts')
      const symbols = await searchSymbolsInWorker(readyDb, {
        root,
        query: 'Bar',
        limit: 10,
        signal: AbortSignal.timeout(10_000),
      })
      expect(symbols.hits.some(h => h.name === 'Bar')).toBe(true)
    }
    try {
      await run()
    } catch (error) {
      if (!(error instanceof Error) || !/database is locked/i.test(error.message)) throw error
      await new Promise(resolve => setTimeout(resolve, 50))
      await run()
    }
  })
})

describe('isUnderRoot', () => {
  it('rejects parent escapes and accepts normalized relatives', () => {
    expect(isUnderRoot('/ws', '../etc/passwd')).toBe(false)
    expect(isUnderRoot('/ws', 'src/../foo.ts')).toBe(true)
  })
})

describe('SearchRequestController client timeout', () => {
  it('clears searching when Remote never settles', async () => {
    vi.useFakeTimers()
    const search = vi.fn(() => new Promise<SearchResult>(() => { /* hang */ }))
    const remote = { search, status: vi.fn() } as unknown as WorkspaceCodeSearchRemote
    const states: boolean[] = []
    const errors: Array<string | undefined> = []
    const controller = new SearchRequestController(
      remote,
      { sessionId: 's1', workspaceRoot: '/ws' },
      { debounceMs: 0, clientTimeoutMs: 100 },
      (state) => { states.push(state.searching) },
      (message) => { errors.push(message) },
    )
    controller.schedule('needle', ['content'])
    await vi.advanceTimersByTimeAsync(1)
    expect(states.at(-1)).toBe(true)
    await vi.advanceTimersByTimeAsync(120)
    await Promise.resolve()
    await Promise.resolve()
    expect(states.at(-1)).toBe(false)
    expect(errors.at(-1)).toMatch(/timed out/i)
    controller.dispose()
    vi.useRealTimers()
  })
})
