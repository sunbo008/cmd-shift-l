/** Locale dictionary for workspace code search UI. */
export const zh = {
  title: '工作区搜索',
  placeholder: '输入以搜索',
  kindFile: '文件',
  kindSymbol: '符号',
  kindContent: '内容',
  searching: '搜索中…',
  noResults: '无结果',
  truncated: '结果已截断',
  codegraphMissing: '未找到 codegraph 索引。在工作区运行 codegraph init 后可搜文件与符号；内容搜索仍可用。',
  codegraphError: 'codegraph 索引不可用',
  codegraphStaleHint: '索引可能过期，可重建。',
  openKindsHint: '请至少打开一类搜索开关',
  shortcutLabel: '工作区搜索',
  shortcutNoSession: '无活动会话时无法搜索',
} as const

export const en = {
  title: 'Workspace search',
  placeholder: 'Type to search',
  kindFile: 'Files',
  kindSymbol: 'Symbols',
  kindContent: 'Content',
  searching: 'Searching…',
  noResults: 'No results',
  truncated: 'Results truncated',
  codegraphMissing: 'No codegraph index. Run codegraph init in the workspace for files/symbols; content search still works.',
  codegraphError: 'codegraph index unavailable',
  codegraphStaleHint: 'Index may be stale; rebuild if needed.',
  openKindsHint: 'Enable at least one search kind',
  shortcutLabel: 'Workspace search',
  shortcutNoSession: 'No active session',
} as const

export type WorkspaceCodeSearchCopy = typeof en
