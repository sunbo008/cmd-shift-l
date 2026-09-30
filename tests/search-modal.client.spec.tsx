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

function emptyResult(mark: string): SearchResult {
  return {
    files: [],
    symbols: [],
    content: [{ path: 'a.ts', line: 1, preview: mark }],
    truncated: false,
  }
}

describe('SearchRequestController', () => {
  it('does not call remote.search for whitespace query', async () => {
    vi.useFakeTimers()
    const search = vi.fn()
    const remote = { search, status: vi.fn() } as unknown as WorkspaceCodeSearchRemote
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

  it('ignores stale responses via seq guard', async () => {
    vi.useFakeTimers()
    let resolveFirst!: (v: SearchResult) => void
    const search = vi.fn()
      .mockImplementationOnce(() => new Promise<SearchResult>((r) => { resolveFirst = r }))
      .mockResolvedValueOnce(emptyResult('second'))
    const remote = { search, status: vi.fn() } as unknown as WorkspaceCodeSearchRemote
    const seen: string[] = []
    const controller = new SearchRequestController(
      remote,
      SCOPE,
      { debounceMs: 10 },
      (result) => {
        if (result?.content[0]?.preview !== undefined) seen.push(result.content[0].preview)
      },
      () => {},
    )
    controller.schedule('a', ['content'])
    await vi.advanceTimersByTimeAsync(15)
    controller.schedule('ab', ['content'])
    await vi.advanceTimersByTimeAsync(15)
    await Promise.resolve()
    resolveFirst(emptyResult('first'))
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
    const result = emptyResult('hit-body')
    const remote = {
      search: vi.fn().mockResolvedValue(result),
      status: vi.fn().mockResolvedValue({ codegraph: 'ready' }),
    } as unknown as WorkspaceCodeSearchRemote
    render(
      <SearchModal
        open
        onClose={onClose}
        scope={SCOPE}
        remote={remote}
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
})
