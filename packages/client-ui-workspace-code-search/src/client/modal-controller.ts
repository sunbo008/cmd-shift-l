/** Modal open/close controller shared by shortcut, toolbar, and overlay. */
export interface SearchSessionScope {
  readonly sessionId: string
  readonly workspaceRoot: string
}

/** Mutable open-state for the search overlay. */
export interface ModalController {
  readonly getSnapshot: () => {
    open: boolean
    scope: SearchSessionScope | undefined
    generation: number
  }
  readonly subscribe: (listener: () => void) => () => void
  open(scope: SearchSessionScope): void
  close(): void
}

/**
 * Create a tiny external store for modal visibility.
 * @returns controller used by shortcut / toolbar / overlay host
 */
export function createModalController(): ModalController {
  let open = false
  let scope: SearchSessionScope | undefined
  let generation = 0
  const listeners = new Set<() => void>()
  const emit = (): void => {
    for (const listener of listeners) listener()
  }
  return {
    getSnapshot: () => ({ open, scope, generation }),
    subscribe: (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    open(next) {
      open = true
      scope = next
      generation += 1
      emit()
    },
    close() {
      if (!open) return
      open = false
      emit()
    },
  }
}
