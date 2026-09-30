/**
 * Portals a search control into the right-Sidebar dock strip (between + and split).
 * The strip has no public Cordis slot; this mounts into `data-dockkit-strip-fill`.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { SearchToolbarButton } from './SearchToolbarButton.tsx'

const HOST_ATTR = 'data-wcs-dock-search'

/** Props for {@link DockStripSearchButton}. */
export interface DockStripSearchButtonProps {
  onClick: () => void
  label: string
}

/**
 * Keep a host node before the strip fill of the chrome pane and portal the button into it.
 * @param props - open handler and label
 */
export function DockStripSearchButton(props: DockStripSearchButtonProps): ReactNode {
  const [host, setHost] = useState<HTMLElement | null>(null)

  useEffect(() => {
    let disposed = false
    const sync = (): void => {
      if (disposed) return
      const chrome = document.querySelector('[data-dockkit-strip-chrome]')
      const strip = chrome?.closest('[data-dockkit-strip]')
      const fill = strip?.querySelector('[data-dockkit-strip-fill]')
      if (strip === null || strip === undefined || fill === null || fill === undefined) {
        setHost(null)
        return
      }
      let next = strip.querySelector<HTMLElement>(`[${HOST_ATTR}]`)
      if (next === null) {
        next = document.createElement('div')
        next.setAttribute(HOST_ATTR, '')
        next.style.display = 'flex'
        next.style.flex = 'none'
        next.style.alignItems = 'center'
        strip.insertBefore(next, fill)
      }
      setHost(next)
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      disposed = true
      observer.disconnect()
      document.querySelectorAll(`[${HOST_ATTR}]`).forEach((node) => { node.remove() })
      setHost(null)
    }
  }, [])

  if (host === null) return null
  return createPortal(
    <SearchToolbarButton onClick={props.onClick} label={props.label} />,
    host,
  )
}
