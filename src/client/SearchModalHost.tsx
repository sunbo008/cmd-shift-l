/**
 * Overlay host: dock-strip search button + modal when open.
 */
import { useEffect, useState, type ReactNode } from 'react'
import type { CodegraphStatus } from '../service/types.ts'
import type { WorkspaceCodeSearchRemote } from '../api/client.ts'
import type { WorkspaceCodeSearchCopy } from './locales.ts'
import type { ModalController } from './modal-controller.ts'
import { DockStripSearchButton } from './DockStripSearchButton.tsx'
import { SearchModal, type OpenResource } from './SearchModal.tsx'

/** Injected face for the shell.overlay registration. */
export interface SearchModalHostInjected {
  modal: ModalController
  remote: WorkspaceCodeSearchRemote
  openResource: OpenResource
  /** Open search for the active Session (no-op without cwd). */
  openSearch: () => void
  debounceMs: number
  copy: WorkspaceCodeSearchCopy
}

/**
 * Always mount the dock-strip control; render SearchModal while open.
 * @param props - injected services and copy
 */
export function SearchModalHost(props: SearchModalHostInjected): ReactNode {
  const { modal, remote, openResource, openSearch, debounceMs, copy } = props
  const [snap, setSnap] = useState(() => modal.getSnapshot())
  const [status, setStatus] = useState<CodegraphStatus | undefined>()

  useEffect(() => modal.subscribe(() => { setSnap(modal.getSnapshot()) }), [modal])

  useEffect(() => {
    if (!snap.open || snap.scope === undefined) {
      setStatus(undefined)
      return
    }
    let cancelled = false
    void remote.status(snap.scope).then((next) => {
      if (!cancelled) setStatus(next)
    }).catch(() => {
      if (!cancelled) setStatus({ codegraph: 'error' })
    })
    return () => { cancelled = true }
  }, [snap.open, snap.generation, snap.scope, remote])

  return (
    <>
      <DockStripSearchButton onClick={openSearch} label={copy.shortcutLabel} />
      {snap.open && snap.scope !== undefined && (
        <SearchModal
          open={snap.open}
          onClose={() => { modal.close() }}
          scope={snap.scope}
          remote={remote}
          openResource={openResource}
          debounceMs={debounceMs}
          copy={copy}
          {...status === undefined ? {} : { initialStatus: status }}
        />
      )}
    </>
  )
}
