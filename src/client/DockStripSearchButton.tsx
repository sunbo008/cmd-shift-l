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
    let raf = 0
    /** Skip observer callbacks caused by our own insertBefore. */
    let ignoreMutations = false

    const locateFill = (): { strip: Element; fill: Element } | undefined => {
      const chrome = document.querySelector('[data-dockkit-strip-chrome]')
      const strip = chrome?.closest('[data-dockkit-strip]')
      const fill = strip?.querySelector('[data-dockkit-strip-fill]')
      if (strip == null || fill == null) return undefined
      return { strip, fill }
    }

    const ensureHost = (): HTMLElement | null => {
      const located = locateFill()
      if (located === undefined) return null
      const { strip, fill } = located
      let next = strip.querySelector<HTMLElement>(`[${HOST_ATTR}]`)
      if (next === null) {
        next = document.createElement('div')
        next.setAttribute(HOST_ATTR, '')
        next.style.display = 'flex'
        next.style.flex = 'none'
        next.style.alignItems = 'center'
        ignoreMutations = true
        strip.insertBefore(next, fill)
        ignoreMutations = false
      }
      return next
    }

    const publish = (next: HTMLElement | null): void => {
      setHost((prev) => (prev === next ? prev : next))
    }

    const sync = (): void => {
      if (disposed) return
      const next = ensureHost()
      publish(next)
      // Once the strip host exists, drop the document-wide observer. Continuous
      // body+subtree observation starves React/remote work on busy UIs (files
      // panel stuck on「正在读取…」), especially on Windows.
      if (next !== null) observer.disconnect()
    }

    const schedule = (): void => {
      if (disposed || ignoreMutations) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(sync)
    }

    const observer = new MutationObserver(schedule)
    sync()
    if (!disposed && document.querySelector(`[${HOST_ATTR}]`) === null) {
      observer.observe(document.body, { childList: true, subtree: true })
    }

    // Sidebar chrome can remount without a full page reload; cheap recovery.
    const retry = window.setInterval(() => {
      if (disposed) return
      publish(ensureHost())
    }, 2000)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.clearInterval(retry)
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
