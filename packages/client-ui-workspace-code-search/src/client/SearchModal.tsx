/**
 * Workspace code search modal — pure props surface for tests and Cordis slots.
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import type {
  CodegraphStatus,
  SearchResult,
} from '@dsh-plugin/workspace-code-search'
import type { WorkspaceCodeSearchRemote, WorkspaceSearchScope } from '@dsh-plugin/api-workspace-code-search/client'
import { fileAddressFor } from './file-address.ts'
import type { WorkspaceCodeSearchCopy } from './locales.ts'
import { kindsFromFlags, SearchRequestController } from './search-controller.ts'
import { flattenHits, type KindFlags } from './store.ts'
import css from './SearchModal.module.css'

/** Open-resource callback matching sidebarRight.openResource. */
export type OpenResource = (
  address: string,
  options?: { params?: { line?: number } },
) => void

/** Props for {@link SearchModal}. */
export interface SearchModalProps {
  open: boolean
  onClose: () => void
  scope: WorkspaceSearchScope
  remote: WorkspaceCodeSearchRemote
  openResource: OpenResource
  debounceMs: number
  copy: WorkspaceCodeSearchCopy
  /** Optional initial status from open-time fetch. */
  initialStatus?: CodegraphStatus
}

/**
 * Unified search dialog: debounce + abort + seq; opens Sidebar on Enter/click.
 * @param props - modal wiring
 */
export function SearchModal({
  open,
  onClose,
  scope,
  remote,
  openResource,
  debounceMs,
  copy,
  initialStatus,
}: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [kinds, setKinds] = useState<KindFlags>({ file: true, symbol: true, content: true })
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<SearchResult | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [codegraph, setCodegraph] = useState<CodegraphStatus | undefined>(initialStatus)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const controllerRef = useRef<SearchRequestController | undefined>(undefined)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setResult(undefined)
    setError(undefined)
    setSearching(false)
    setSelectedIndex(0)
    setKinds({ file: true, symbol: true, content: true })
    setCodegraph(initialStatus)
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open, initialStatus, scope.sessionId, scope.workspaceRoot])

  useEffect(() => {
    if (!open) {
      controllerRef.current?.dispose()
      controllerRef.current = undefined
      return
    }
    const controller = new SearchRequestController(
      remote,
      scope,
      { debounceMs },
      (next, busy) => {
        setResult(next)
        setSearching(busy)
        if (next?.errors?.codegraph !== undefined) {
          setCodegraph({ codegraph: 'error', message: next.errors.codegraph })
        }
        setSelectedIndex(0)
      },
      (message) => { setError(message) },
    )
    controllerRef.current = controller
    return () => { controller.dispose() }
  }, [open, remote, scope, debounceMs])

  useEffect(() => {
    if (!open) return
    controllerRef.current?.schedule(query, kindsFromFlags(kinds))
  }, [open, query, kinds])

  const rows = useMemo(() => flattenHits(result), [result])

  const openHit = (index: number): void => {
    const hit = rows[index]
    if (hit === undefined) return
    const address = fileAddressFor(scope.sessionId, scope.workspaceRoot, hit.path)
    openResource(address, hit.line === undefined ? undefined : { params: { line: hit.line } })
    onClose()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, Math.max(rows.length - 1, 0)))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      openHit(selectedIndex)
    }
  }

  if (!open) return null

  const enabledKinds = kindsFromFlags(kinds)
  const banner = codegraphBanner(codegraph, copy)
  const showEmptyHint = !searching && query.trim().length === 0
  const showKindsHint = enabledKinds.length === 0
  const showNoResults = !searching
    && query.trim().length > 0
    && enabledKinds.length > 0
    && rows.length === 0
    && error === undefined

  return (
    <div className={css.overlay} role="presentation" onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose()
    }}>
      <div
        className={css.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        onKeyDown={onKeyDown}
      >
        <div className={css.header}>
          <h2 className={css.title}>{copy.title}</h2>
          <button type="button" className={css.close} aria-label="Close" onClick={onClose}>×</button>
        </div>
        <input
          ref={inputRef}
          className={css.input}
          role="textbox"
          value={query}
          placeholder={copy.placeholder}
          onChange={(e) => { setQuery(e.target.value) }}
        />
        <div className={css.toggles}>
          <Toggle label={copy.kindFile} checked={kinds.file}
            onChange={(v) => { setKinds(k => ({ ...k, file: v })) }} />
          <Toggle label={copy.kindSymbol} checked={kinds.symbol}
            onChange={(v) => { setKinds(k => ({ ...k, symbol: v })) }} />
          <Toggle label={copy.kindContent} checked={kinds.content}
            onChange={(v) => { setKinds(k => ({ ...k, content: v })) }} />
        </div>
        {banner !== undefined && <div className={css.banner} role="status">{banner}</div>}
        {error !== undefined && <div className={css.banner} role="alert">{error}</div>}
        <div className={css.results}>
          {showEmptyHint && <div className={css.hint}>{copy.placeholder}</div>}
          {showKindsHint && <div className={css.hint}>{copy.openKindsHint}</div>}
          {showNoResults && <div className={css.hint}>{copy.noResults}</div>}
          <ResultSections result={result} rows={rows} selectedIndex={selectedIndex}
            openHit={openHit} copy={copy} />
        </div>
        <div className={css.footer}>
          {searching ? copy.searching : result?.truncated === true ? copy.truncated : null}
        </div>
      </div>
    </div>
  )
}

function Toggle(props: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}): ReactNode {
  return (
    <label>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => { props.onChange(e.target.checked) }}
      />
      {props.label}
    </label>
  )
}

function codegraphBanner(
  status: CodegraphStatus | undefined,
  copy: WorkspaceCodeSearchCopy,
): string | undefined {
  if (status === undefined || status.codegraph === 'ready') return undefined
  if (status.codegraph === 'missing') return copy.codegraphMissing
  return status.message ?? copy.codegraphError
}

function ResultSections(props: {
  result: SearchResult | undefined
  rows: ReturnType<typeof flattenHits>
  selectedIndex: number
  openHit: (index: number) => void
  copy: WorkspaceCodeSearchCopy
}): ReactNode {
  const { result, rows, selectedIndex, openHit, copy } = props
  if (result === undefined) return null
  const sections: Array<{ title: string; kind: 'file' | 'symbol' | 'content'; error?: string }> = [
    { title: copy.kindFile, kind: 'file', ...result.errors?.file === undefined ? {} : { error: result.errors.file } },
    { title: copy.kindSymbol, kind: 'symbol', ...result.errors?.symbol === undefined ? {} : { error: result.errors.symbol } },
    { title: copy.kindContent, kind: 'content', ...result.errors?.content === undefined ? {} : { error: result.errors.content } },
  ]
  return (
    <>
      {sections.map((section) => {
        const indices = rows
          .map((row, index) => (row.kind === section.kind ? index : -1))
          .filter(index => index >= 0)
        if (indices.length === 0 && section.error === undefined) return null
        return (
          <div key={section.kind}>
            <div className={css.sectionTitle}>{section.title}</div>
            {section.error !== undefined && (
              <div className={css.banner} role="status">{section.error}</div>
            )}
            {indices.map((index) => {
              const row = rows[index]!
              const selected = index === selectedIndex
              return (
                <button
                  key={`${section.kind}-${index}-${row.label}`}
                  type="button"
                  className={selected ? `${css.hit} ${css.hitSelected}` : css.hit}
                  onClick={() => { openHit(index) }}
                >
                  {row.label}
                  {row.preview !== undefined && (
                    <span className={css.preview}>{row.preview}</span>
                  )}
                </button>
              )
            })}
          </div>
        )
      })}
    </>
  )
}
