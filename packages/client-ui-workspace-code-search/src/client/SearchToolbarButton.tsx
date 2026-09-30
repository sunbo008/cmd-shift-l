/** Shared search control glyph + button used in dock strip and tab toolbars. */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import css from './SearchToolbarButton.module.css'

/** Hover delay before the shortcut tip appears. */
const TIP_DELAY_MS = 3000

/** Props for {@link SearchToolbarButton}. */
export interface SearchToolbarButtonProps {
  onClick: () => void
  label: string
}

/** Outline magnifying-glass matching the product IconSearchOutline path. */
function SearchGlyph(): ReactNode {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6.58727 11.8586C9.55061 11.8586 11.9529 9.45637 11.9529 6.49304C11.9529 3.5297 9.55061 1.12744 6.58727 1.12744C3.62394 1.12744 1.22168 3.5297 1.22168 6.49304C1.22168 9.45637 3.62394 11.8586 6.58727 11.8586Z"
        stroke="currentColor"
      />
      <path d="M10.2991 10.3933L14.7783 14.8725" stroke="currentColor" />
    </svg>
  )
}

/**
 * Web shortcut keycaps for workspace search (primary+shift+L).
 * @returns platform-formatted key labels
 */
function webShortcutKeys(): readonly string[] {
  const apple = typeof navigator !== 'undefined'
    && /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
  return apple ? ['⌘', '⇧', 'L'] : ['Ctrl', '+', 'Shift', '+', 'L']
}

/**
 * 28×28 icon button for workspace code search.
 * Hover highlights the control; after {@link TIP_DELAY_MS} a tip shows the Web shortcut.
 * @param props - click handler and accessible label
 */
export function SearchToolbarButton(props: SearchToolbarButtonProps): ReactNode {
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [tipPos, setTipPos] = useState<{ left: number; top: number } | null>(null)
  const keys = webShortcutKeys()

  const clearTipTimer = (): void => {
    if (timerRef.current === null) return
    clearTimeout(timerRef.current)
    timerRef.current = null
  }

  const hideTip = (): void => {
    clearTipTimer()
    setTipPos(null)
  }

  const showTip = (): void => {
    const el = buttonRef.current
    if (el === null) return
    const rect = el.getBoundingClientRect()
    setTipPos({
      left: rect.left + rect.width / 2,
      top: rect.bottom + 8,
    })
  }

  useEffect(() => () => { clearTipTimer() }, [])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={css.button}
        onClick={(event) => {
          event.stopPropagation()
          hideTip()
          props.onClick()
        }}
        onMouseEnter={() => {
          clearTipTimer()
          timerRef.current = setTimeout(() => {
            timerRef.current = null
            showTip()
          }, TIP_DELAY_MS)
        }}
        onMouseLeave={hideTip}
        onBlur={hideTip}
        aria-label={props.label}
        data-workspace-code-search-button
      >
        <SearchGlyph />
      </button>
      {tipPos !== null && createPortal(
        <span
          className={css.tip}
          role="tooltip"
          style={{ left: tipPos.left, top: tipPos.top }}
        >
          <span className={css.tipLabel}>{props.label}</span>
          <span className={css.tipKeys} aria-hidden="true">
            {keys.map((key, index) => (
              <kbd key={index} className={key === '+' ? css.tipSep : css.tipKey}>{key}</kbd>
            ))}
          </span>
        </span>,
        document.body,
      )}
    </>
  )
}
