// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SearchResult } from '../src/service/index.ts'
import type { WorkspaceCodeSearchRemote } from '../src/api/client.ts'
import { SearchModal } from '../src/client/SearchModal.tsx'
import { SearchRequestController } from '../src/client/search-controller.ts'
import { en } from '../src/client/locales.ts'
import { fileAddressFor } from '../src/client/file-address.ts'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const SCOPE = { sessionId: 's1', workspaceRoot: '/ws' }

function mockRemote(overrides: Partial<WorkspaceCodeSearchRemote> = {}): WorkspaceCodeSearchRemote {
  return {
    status: vi.fn().mockResolvedValue({ codegraph: 'ready' }),
    search: vi.fn().mockImplementation((_scope, request: { kinds: string[] }) => {
      const kinds = new Set(request.kinds)
      const result: SearchResult = {
        files: kinds.has('file') ? [] : [],
        symbols: kinds.has('symbol') ? [] : [],
        content: kinds.has('content')
          ? [{ path: 'a.ts', line: 1, preview: 'hit-body' }]
          : [],
        truncated: false,
      }
      return Promise.resolve(result)
    }),
    ...overrides,
  } as WorkspaceCodeSearchRemote
}

describe('SearchRequestController', () => {
  it('does not call remote.search for whitespace query', async () => {
    vi.useFakeTimers()
    const search = vi.fn()
    const remote = mockRemote({ search })
    const controller = new SearchRequestController(
      remote,
      SCOPE,
      { debounceMs: 50 },
      () => {},
      () => {},
    )
    controller.schedule('   ', ['file', 'content'])
    await vi.advanceTimersByTimeAsync(100)
    expect(search).not.toHaveBeenCalled()
    controller.dispose()
  })

  it('surfaces symbols before content finishes', async () => {
    vi.useFakeTimers()
    let finishContent!: (value: SearchResult) => void
    const search = vi.fn().mockImplementation((_scope, request: { kinds: string[] }) => {
      if (request.kinds.includes('symbol')) {
        return Promise.resolve({
          files: [],
          symbols: [{ path: 'a.ts', name: 'Foo', kind: 'class' }],
          content: [],
          truncated: false,
        } satisfies SearchResult)
      }
      if (request.kinds.includes('content')) {
        return new Promise<SearchResult>((resolve) => { finishContent = resolve })
      }
      return Promise.resolve({
        files: [],
        symbols: [],
        content: [],
        truncated: false,
      } satisfies SearchResult)
    })
    const remote = mockRemote({ search })
    const snapshots: Array<{ symbols: number; searching: boolean }> = []
    const controller = new SearchRequestController(
      remote,
      SCOPE,
      { debounceMs: 0, clientTimeoutMs: 20_000 },
      (s) => {
        snapshots.push({ symbols: s.result.symbols.length, searching: s.searching })
      },
      () => {},
    )
    controller.schedule('Foo', ['file', 'symbol', 'content'])
    await vi.advanceTimersByTimeAsync(1)
    await Promise.resolve()
    await Promise.resolve()
    expect(snapshots.some(s => s.symbols === 1 && s.searching)).toBe(true)
    finishContent({
      files: [],
      symbols: [],
      content: [{ path: 'b.ts', line: 1, preview: 'x' }],
      truncated: false,
    })
    await Promise.resolve()
    await Promise.resolve()
    controller.dispose()
  })

  it('ignores stale responses via seq guard', async () => {
    vi.useFakeTimers()
    let resolveFirst!: (value: SearchResult) => void
    const search = vi.fn()
      .mockImplementationOnce(() => new Promise<SearchResult>((r) => { resolveFirst = r }))
      .mockResolvedValueOnce({
        files: [],
        symbols: [],
        content: [{ path: 'a.ts', line: 1, preview: 'second' }],
        truncated: false,
      } satisfies SearchResult)
    const remote = mockRemote({ search })
    const seen: string[] = []
    const controller = new SearchRequestController(
      remote,
      SCOPE,
      { debounceMs: 10 },
      (state) => {
        const preview = state.result.content[0]?.preview
        if (preview !== undefined) seen.push(preview)
      },
      () => {},
    )
    controller.schedule('a', ['content'])
    await vi.advanceTimersByTimeAsync(15)
    controller.schedule('ab', ['content'])
    await vi.advanceTimersByTimeAsync(15)
    await Promise.resolve()
    resolveFirst({
      files: [],
      symbols: [],
      content: [{ path: 'a.ts', line: 1, preview: 'first' }],
      truncated: false,
    })
    await Promise.resolve()
    await Promise.resolve()
    expect(seen).toEqual(['second'])
    expect(seen).not.toContain('first')
    controller.dispose()
  })
})

describe('SearchModal', () => {
  it('opens resource with line and closes modal', async () => {
    const openResource = vi.fn()
    const onClose = vi.fn()
    render(
      <SearchModal
        open
        onClose={onClose}
        scope={SCOPE}
        remote={mockRemote()}
        openResource={openResource}
        debounceMs={0}
        copy={en}
        initialStatus={{ codegraph: 'ready' }}
      />,
    )
    await userEvent.type(screen.getByRole('textbox'), 'hit')
    await waitFor(() => expect(screen.getByText('hit-body')).toBeTruthy())
    await userEvent.click(screen.getByText('hit-body'))
    expect(openResource).toHaveBeenCalledWith(
      fileAddressFor('s1', '/ws', 'a.ts'),
      { params: { line: 1 } },
    )
    expect(onClose).toHaveBeenCalled()
  })

  it('does not show no-results while content still running', async () => {
    let finishContent!: (value: SearchResult) => void
    const search = vi.fn().mockImplementation((_scope, request: { kinds: string[] }) => {
      if (request.kinds.includes('content')) {
        return new Promise<SearchResult>((resolve) => { finishContent = resolve })
      }
      return Promise.resolve({
        files: [],
        symbols: [],
        content: [],
        truncated: false,
      } satisfies SearchResult)
    })
    render(
      <SearchModal
        open
        onClose={() => {}}
        scope={SCOPE}
        remote={mockRemote({ search })}
        openResource={() => {}}
        debounceMs={0}
        copy={en}
        initialStatus={{ codegraph: 'ready' }}
      />,
    )
    await userEvent.type(screen.getByRole('textbox'), 'zzz')
    await waitFor(() => expect(screen.getByText(/Searching/)).toBeTruthy())
    expect(screen.queryByText(en.noResults)).toBeNull()
    finishContent({ files: [], symbols: [], content: [], truncated: false })
    await waitFor(() => expect(screen.getByText(en.noResults)).toBeTruthy())
  })

  it('shows symbols section before content result frame', async () => {
    let finishContent!: (value: SearchResult) => void
    const search = vi.fn().mockImplementation((_scope, request: { kinds: string[] }) => {
      if (request.kinds.includes('symbol')) {
        return Promise.resolve({
          files: [],
          symbols: [{ path: 'sym.ts', name: 'Bar', kind: 'function', line: 2 }],
          content: [],
          truncated: false,
        } satisfies SearchResult)
      }
      if (request.kinds.includes('content')) {
        return new Promise<SearchResult>((resolve) => { finishContent = resolve })
      }
      return Promise.resolve({
        files: [],
        symbols: [],
        content: [],
        truncated: false,
      } satisfies SearchResult)
    })
    render(
      <SearchModal
        open
        onClose={() => {}}
        scope={SCOPE}
        remote={mockRemote({ search })}
        openResource={() => {}}
        debounceMs={0}
        copy={en}
        initialStatus={{ codegraph: 'ready' }}
      />,
    )
    await userEvent.type(screen.getByRole('textbox'), 'Bar')
    await waitFor(() => expect(screen.getByText(/Bar · sym\.ts:2/)).toBeTruthy())
    expect(screen.queryByText(en.noResults)).toBeNull()
    finishContent({ files: [], symbols: [], content: [], truncated: false })
  })
})
