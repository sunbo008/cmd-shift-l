/**
 * Portals a search control into the right-Sidebar dock strip (between + and split).
 * The strip has no public Cordis slot; this mounts into `data-dockkit-strip-fill`.
 *
 * Never watch `document` with MutationObserver — on Windows a busy Files tree
 * mutates constantly and starves React, leaving the panel on「正在读取…」.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { SearchToolbarButton } from './SearchToolbarButton.tsx'

const HOST_ATTR = 'data-wcs-dock-search'
/** Poll while the dock chrome is missing. */
const SEEK_MS = 1_000
/** Occasional remount recovery after the host was found. */
const HEALTH_MS = 5_000

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
    let timer: ReturnType<typeof setTimeout> | undefined

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
        strip.insertBefore(next, fill)
      }
      return next
    }

    const publish = (next: HTMLElement | null): void => {
      setHost((prev) => (prev === next ? prev : next))
    }

    const pump = (delayMs: number): void => {
      if (disposed) return
      timer = setTimeout(() => {
        if (disposed) return
        const next = ensureHost()
        publish(next)
        pump(next === null ? SEEK_MS : HEALTH_MS)
      }, delayMs)
    }

    const next = ensureHost()
    publish(next)
    pump(next === null ? SEEK_MS : HEALTH_MS)

    return () => {
      disposed = true
      if (timer !== undefined) clearTimeout(timer)
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
