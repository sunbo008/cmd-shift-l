/** Files / document toolbar search button. */
import type { ReactNode } from 'react'
import { SearchToolbarButton } from './SearchToolbarButton.tsx'

/** Props for the files/document toolbar search control. */
export interface FilesToolbarButtonProps {
  onClick: () => void
  label: () => string
}

/**
 * Compact search control for `sidebar.right.tab.files.actions` /
 * `sidebar.right.tab.document.actions`.
 * @param props - click handler and localized label thunk
 */
export function FilesToolbarButton(props: FilesToolbarButtonProps): ReactNode {
  return <SearchToolbarButton onClick={props.onClick} label={props.label()} />
}
