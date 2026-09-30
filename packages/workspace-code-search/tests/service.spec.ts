import { describe, expect, it, vi } from 'vitest'
import { asAbsolutePath, Config } from '../src/index.ts'
import { clampLimitPerKind, normalizeQuery, orchestrateSearch } from '../src/orchestrate.ts'
import type { WorkspaceCodeSearchProvider } from '../src/types.ts'

const root = asAbsolutePath('/tmp/ws')

describe('normalizeQuery', () => {
  it('rejects empty / NUL / overlong', () => {
    expect(() => normalizeQuery('  ', 500)).toThrow(/non-whitespace/)
    expect(() => normalizeQuery('a\0b', 500)).toThrow(/NUL/)
    expect(() => normalizeQuery('x'.repeat(10), 5)).toThrow(/maxQueryCodeUnits/)
  })
})

describe('clampLimitPerKind', () => {
  it('clamps to Config hard ceiling', () => {
    expect(clampLimitPerKind(99, 2)).toBe(2)
    expect(clampLimitPerKind(undefined, 50)).toBe(50)
  })
})

describe('orchestrateSearch', () => {
  const config = Config({})

  it('returns content when codegraph missing and kinds include all', async () => {
    const providers: WorkspaceCodeSearchProvider[] = [
      {
        id: 'codegraph',
        status: () => ({ codegraph: 'missing' }),
        searchFiles: vi.fn(async () => ({ hits: [{ path: 'should-not-run.ts' }], truncated: false })),
        searchSymbols: vi.fn(async () => ({ hits: [], truncated: false })),
      },
      {
        id: 'content',
        searchContent: async () => ({
          hits: [{ path: 'a.txt', line: 1, preview: 'x' }],
          truncated: false,
        }),
      },
    ]
    const result = await orchestrateSearch(providers, config, {
      root,
      query: 'x',
      kinds: ['file', 'symbol', 'content'],
      signal: AbortSignal.timeout(1000),
    })
    expect(result.files).toEqual([])
    expect(result.symbols).toEqual([])
    expect(result.content).toHaveLength(1)
    expect(result.errors?.content).toBeUndefined()
    expect(providers[0]!.searchFiles).not.toHaveBeenCalled()
  })

  it('isolates content failure from files', async () => {
    const providers: WorkspaceCodeSearchProvider[] = [
      {
        id: 'codegraph',
        status: () => ({ codegraph: 'ready' }),
        searchFiles: async () => ({ hits: [{ path: 'a.ts' }], truncated: false }),
        searchSymbols: async () => ({ hits: [], truncated: false }),
      },
      {
        id: 'content',
        searchContent: async () => ({ hits: [], truncated: false, error: 'rg failed' }),
      },
    ]
    const result = await orchestrateSearch(providers, config, {
      root,
      query: 'x',
      kinds: ['file', 'content'],
      signal: AbortSignal.timeout(1000),
    })
    expect(result.files).toEqual([{ path: 'a.ts' }])
    expect(result.errors?.content).toBe('rg failed')
  })

  it('passes clamped limit to providers', async () => {
    const seen: number[] = []
    const providers: WorkspaceCodeSearchProvider[] = [
      {
        id: 'codegraph',
        status: () => ({ codegraph: 'ready' }),
        searchFiles: async (req) => {
          seen.push(req.limit)
          return { hits: [], truncated: false }
        },
      },
    ]
    const tight = Config({ limitPerKind: 2 })
    await orchestrateSearch(providers, tight, {
      root,
      query: 'x',
      kinds: ['file'],
      limitPerKind: 99,
      signal: AbortSignal.timeout(1000),
    })
    expect(seen).toEqual([2])
  })

  it('merges codegraph and filesystem file hits when index is ready', async () => {
    const providers: WorkspaceCodeSearchProvider[] = [
      {
        id: 'codegraph',
        status: () => ({ codegraph: 'ready' }),
        searchFiles: async () => ({ hits: [{ path: 'src/a.ts', score: 500 }], truncated: false }),
      },
      {
        id: 'content',
        searchFiles: async () => ({
          hits: [
            { path: 'src/a.ts', score: 500 },
            { path: 'docs/a.md', score: 900 },
          ],
          truncated: false,
        }),
        searchContent: async () => ({ hits: [], truncated: false }),
      },
    ]
    const result = await orchestrateSearch(providers, config, {
      root,
      query: 'a',
      kinds: ['file'],
      signal: AbortSignal.timeout(1000),
    })
    expect(result.files.map(h => h.path)).toEqual(['docs/a.md', 'src/a.ts'])
  })
})
