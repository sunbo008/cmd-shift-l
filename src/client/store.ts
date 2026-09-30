import type {
  CodegraphStatus,
  SearchKind,
  SearchResult,
} from '../service/types.ts'

/** Kind toggles for the modal. */
export interface KindFlags {
  file: boolean
  symbol: boolean
  content: boolean
}

/** Modal UI state. */
export interface SearchModalState {
  open: boolean
  query: string
  kinds: KindFlags
  searching: boolean
  result: SearchResult | undefined
  error: string | undefined
  codegraph: CodegraphStatus | undefined
  selectedIndex: number
  sessionId: string
  workspaceRoot: string
}

/** Create the initial closed modal state. */
export function createInitialState(seed?: {
  sessionId?: string
  workspaceRoot?: string
}): SearchModalState {
  return {
    open: false,
    query: '',
    kinds: { file: true, symbol: true, content: true },
    searching: false,
    result: undefined,
    error: undefined,
    codegraph: undefined,
    selectedIndex: 0,
    sessionId: seed?.sessionId ?? '',
    workspaceRoot: seed?.workspaceRoot ?? '',
  }
}

/** Flatten visible hits for keyboard navigation. */
export function flattenHits(result: SearchResult | undefined): Array<{
  kind: SearchKind
  path: string
  line?: number
  label: string
  preview?: string
}> {
  if (result === undefined) return []
  const rows: Array<{
    kind: SearchKind
    path: string
    line?: number
    label: string
    preview?: string
  }> = []
  for (const hit of result.files) {
    rows.push({ kind: 'file', path: hit.path, label: hit.path })
  }
  for (const hit of result.symbols) {
    rows.push({
      kind: 'symbol',
      path: hit.path,
      ...hit.line === undefined ? {} : { line: hit.line },
      label: `${hit.name} · ${hit.path}${hit.line === undefined ? '' : `:${hit.line}`}`,
    })
  }
  for (const hit of result.content) {
    rows.push({
      kind: 'content',
      path: hit.path,
      line: hit.line,
      label: `${hit.path}:${hit.line}`,
      preview: hit.preview,
    })
  }
  return rows
}
