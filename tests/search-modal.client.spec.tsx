// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    search: vi.fn(),
    searchFiles: vi.fn().mockResolvedValue({ hits: [], truncated: false }),
    searchSymbols: vi.fn().mockResolvedValue({ hits: [], truncated: false }),
    searchContent: vi.fn().mockResolvedValue({
      hits: [{ path: 'a.ts', line: 1, preview: 'hit-body' }],
      truncated: false,
    }),
    ...overrides,
  } as WorkspaceCodeSearchRemote
}

describe('SearchRequestController', () => {
  it('does not call per-leg remotes for whitespace query', async () => {
    vi.useFakeTimers()
    const searchFiles = vi.fn()
    const searchSymbols = vi.fn()
    const searchContent = vi.fn()
    const remote = mockRemote({ searchFiles, searchSymbols, searchContent })
    const controller = new SearchRequestController(
      remote,
      SCOPE,
      { debounceMs: 50 },
      () => {},
      () => {},
    )
    controller.schedule('   ', ['file', 'content'])
    await vi.advanceTimersByTimeAsync(100)
    expect(searchFiles).not.toHaveBeenCalled()
    expect(searchSymbols).not.toHaveBeenCalled()
    expect(searchContent).not.toHaveBeenCalled()
    controller.dispose()
  })

  it('surfaces symbols before content finishes', async () => {
    vi.useFakeTimers()
    let finishContent!: (value: {
      hits: Array<{ path: string; line: number; preview: string }>
      truncated: boolean
    }) => void
    const remote = mockRemote({
      searchSymbols: vi.fn().mockResolvedValue({
        hits: [{ path: 'a.ts', name: 'Foo', kind: 'class' }],
        truncated: false,
      }),
      searchContent: vi.fn().mockImplementation(() => new Promise((resolve) => {
        finishContent = resolve
      })),
    })
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
    finishContent({ hits: [{ path: 'b.ts', line: 1, preview: 'x' }], truncated: false })
    await Promise.resolve()
    await Promise.resolve()
    controller.dispose()
  })

  it('ignores stale responses via seq guard', async () => {
    vi.useFakeTimers()
    let resolveFirst!: (value: {
      hits: Array<{ path: string; line: number; preview: string }>
      truncated: boolean
    }) => void
    const searchContent = vi.fn()
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve }))
      .mockResolvedValueOnce({
        hits: [{ path: 'a.ts', line: 1, preview: 'second' }],
        truncated: false,
      })
    const remote = mockRemote({ searchContent })
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
      hits: [{ path: 'a.ts', line: 1, preview: 'first' }],
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
    let finishContent!: (value: { hits: []; truncated: boolean }) => void
    const remote = mockRemote({
      searchFiles: vi.fn().mockResolvedValue({ hits: [], truncated: false }),
      searchSymbols: vi.fn().mockResolvedValue({ hits: [], truncated: false }),
      searchContent: vi.fn().mockImplementation(() => new Promise((resolve) => {
        finishContent = resolve
      })),
    })
    render(
      <SearchModal
        open
        onClose={() => {}}
        scope={SCOPE}
        remote={remote}
        openResource={() => {}}
        debounceMs={0}
        copy={en}
        initialStatus={{ codegraph: 'ready' }}
      />,
    )
    await userEvent.type(screen.getByRole('textbox'), 'zzz')
    await waitFor(() => expect(screen.getByText(/Searching/)).toBeTruthy())
    expect(screen.queryByText(en.noResults)).toBeNull()
    finishContent({ hits: [], truncated: false })
    await waitFor(() => expect(screen.getByText(en.noResults)).toBeTruthy())
  })

  it('shows symbols section before content result frame', async () => {
    let finishContent!: (value: { hits: []; truncated: boolean }) => void
    const remote = mockRemote({
      searchSymbols: vi.fn().mockResolvedValue({
        hits: [{ path: 'sym.ts', name: 'Bar', kind: 'function', line: 2 }],
        truncated: false,
      }),
      searchContent: vi.fn().mockImplementation(() => new Promise((resolve) => {
        finishContent = resolve
      })),
    })
    render(
      <SearchModal
        open
        onClose={() => {}}
        scope={SCOPE}
        remote={remote}
        openResource={() => {}}
        debounceMs={0}
        copy={en}
        initialStatus={{ codegraph: 'ready' }}
      />,
    )
    await userEvent.type(screen.getByRole('textbox'), 'Bar')
    await waitFor(() => expect(screen.getByText(/Bar · sym\.ts:2/)).toBeTruthy())
    expect(screen.queryByText(en.noResults)).toBeNull()
    finishContent({ hits: [], truncated: false })
  })
})
