/**
 * Client plugin: modal overlay, Cmd/Ctrl+Shift+L (Web) / Shift+F (Desktop), dock-strip button.
 *
 * Uses structural Cordis faces so this package typechecks without linking the
 * full harness client tree; when installed into dsh the real services match.
 */
import type { Context } from '@deepseek-ai/cordis'
import workspaceCodeSearchRemote from '../api/remote.ts'
import type { WorkspaceCodeSearchRemote } from '../api/client.ts'
import type { CodegraphStatus, SearchResult } from '../service/types.ts'
import type { RemoteSearchRequest, WorkspaceSearchScope } from '../api/client.ts'
import { SearchModalHost } from './SearchModalHost.tsx'
import { resolveDebounceMs, type ClientConfig } from './client-config.ts'
import { en, zh } from './locales.ts'
import { createModalController, type SearchSessionScope } from './modal-controller.ts'

/** Locale namespace. */
export const NS = 'workspaceCodeSearch'

/** Cordis inject list for Client loaders. */
export const inject = ['locale', 'shortcuts', 'slots', 'sidebarRight', 'remote', 'sessions'] as const

export type { ClientConfig }

const MOUNT_TIMEOUT_MS = 8_000

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * Reject if `promise` does not settle within `ms`.
 * @param promise - work to bound
 * @param ms - timeout
 * @param label - error label
 */
async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return await Promise.race([
    promise,
    delay(ms).then(() => {
      throw new Error(`${label} timed out after ${String(ms)}ms`)
    }),
  ])
}

/**
 * Mount workspace code search UI and Client Remote contribution.
 *
 * Never block Client boot on Windows: `$mount` / inject failures degrade to
 * "search unavailable" instead of freezing Sessions / Files.
 * @param ctx - Client root context
 * @param config - optional Client debounce (Host owns search Config)
 * @returns disposer that withdraws Remote + UI effects
 */
export async function apply(
  ctx: Context,
  config: ClientConfig = {},
): Promise<() => Promise<void>> {
  const debounceMs = resolveDebounceMs(config)
  const face = ctx as unknown as ClientFace

  let disposeRemote: (() => Promise<void>) | undefined
  try {
    disposeRemote = await withTimeout(
      face.remote.$mount(workspaceCodeSearchRemote),
      MOUNT_TIMEOUT_MS,
      'workspace-code-search $mount',
    )
  } catch (error) {
    console.error('[workspace-code-search] Client Remote $mount failed; UI continues without search', error)
    return async () => {}
  }

  // Do not inject `remote.workspaceCodeSearch` — waiting on that namespace has
  // hung Windows Desktop/Client boot (Sessions blank, Files stuck on 正在读取).
  const ui = ctx.inject(
    ['locale', 'shortcuts', 'slots', 'sidebarRight', 'remote', 'sessions'],
    (scoped) => {
      try {
        registerUi(scoped as unknown as ClientFace, debounceMs)
      } catch (error) {
        console.error('[workspace-code-search] registerUi failed', error)
      }
    },
  )
  try {
    await withTimeout(Promise.resolve(ui as PromiseLike<unknown>), MOUNT_TIMEOUT_MS, 'workspace-code-search inject')
  } catch (error) {
    await ui.dispose()
    await disposeRemote()
    console.error('[workspace-code-search] UI inject failed; UI continues without search', error)
    return async () => {}
  }
  return async () => {
    await ui.dispose()
    await disposeRemote()
  }
}

/**
 * Register shortcuts, overlay, and dock-strip button once Remote is mounted.
 * @param face - structural Client services
 * @param debounceMs - search debounce from Config
 */
function registerUi(face: ClientFace, debounceMs: number): void {
  const { locale, shortcuts, slots, sidebarRight, sessions, remote } = face
  if (remote.workspaceCodeSearch === undefined) {
    throw new Error('workspace-code-search: remote.workspaceCodeSearch missing after $mount')
  }
  const searchRemote = adaptRemote(remote.workspaceCodeSearch)

  face.effect(() => locale.register(NS, { zh, en }), 'workspace-code-search: dictionaries')
  const t = locale.bind(NS)
  const modal = createModalController()

  const resolveScope = (target: Element | null): SearchSessionScope | undefined => {
    const list = sessions.list.getSnapshot()
    const main = Object.values(list.byId).find(row => (row.retainedBy.mainView ?? 0) > 0)
    if (main !== undefined) {
      const cwd = main.cwd?.trim()
      if (cwd !== undefined && cwd.length > 0) {
        return { sessionId: main.id, workspaceRoot: cwd }
      }
    }
    const cmd = sidebarRight.commandTarget?.(target)
    if (cmd?.sessionId !== undefined && cmd.sessionId !== '') {
      const row = list.byId[cmd.sessionId]
      const cwd = row?.cwd?.trim()
      if (cwd !== undefined && cwd.length > 0) {
        return { sessionId: cmd.sessionId, workspaceRoot: cwd }
      }
    }
    return undefined
  }

  face.effect(() => shortcuts.register({
    id: 'workspace.codeSearch',
    label: () => t('shortcutLabel'),
    aliases: ['workspace search', 'code search'],
    defaults: {
      // Desktop: VS Code–like find-in-files (session.fork uses primary+alt+F there).
      // Web: primary+shift+L — checked against dsh defaults + Chrome docs.
      //   Free in Chrome; conflicts: Safari sidebar, Bitwarden autofill (extension).
      //   Rejected earlier: Shift+F (session.fork), Alt+F (Chrome “Search the web”),
      //   Shift+H (Chrome homepage / macOS Finder Home).
      //   web:linux omitted — isWebBindingAllowed rejects primary+shift+KeyL there.
      'desktop:macos': { code: 'KeyF', modifiers: ['primary', 'shift'] },
      'desktop:windows': { code: 'KeyF', modifiers: ['primary', 'shift'] },
      'desktop:linux': { code: 'KeyF', modifiers: ['primary', 'shift'] },
      'web:macos': { code: 'KeyL', modifiers: ['primary', 'shift'] },
      'web:windows': { code: 'KeyL', modifiers: ['primary', 'shift'] },
    },
    regions: ['page', 'editable', 'terminal'],
    modals: [],
    resolve: ({ target }: { target: Element | null }) => {
      const session = resolveScope(target)
      if (session === undefined) {
        return { status: 'blocked', reason: t('shortcutNoSession') }
      }
      return {
        status: 'handled',
        run: () => { modal.open(session) },
      }
    },
  }), 'workspace-code-search: shortcut')

  const openSearch = (): void => {
    const session = resolveScope(null)
    if (session === undefined) return
    modal.open(session)
  }
  // slots.inject already owns a Cordis effect; do not wrap it in ctx.effect.
  slots.inject('shell.overlay', () => slots.register({
    name: 'shell.overlay',
    id: 'workspace-code-search',
    locale: NS,
    inject: () => ({
      modal,
      remote: searchRemote,
      openSearch,
      openResource: (address: string, options?: { params?: { line?: number } }) => {
        sidebarRight.openResource(address, options)
      },
      debounceMs,
      copy: {
        title: t('title'),
        placeholder: t('placeholder'),
        kindFile: t('kindFile'),
        kindSymbol: t('kindSymbol'),
        kindContent: t('kindContent'),
        searching: t('searching'),
        searchingLegs: t('searchingLegs'),
        legRunning: t('legRunning'),
        legDone: t('legDone'),
        matchedCount: t('matchedCount'),
        aboutEta: t('aboutEta'),
        noResults: t('noResults'),
        truncated: t('truncated'),
        codegraphMissing: t('codegraphMissing'),
        codegraphError: t('codegraphError'),
        codegraphStaleHint: t('codegraphStaleHint'),
        openKindsHint: t('openKindsHint'),
        shortcutLabel: t('shortcutLabel'),
        shortcutNoSession: t('shortcutNoSession'),
      },
    }),
  }, SearchModalHost))

  // Close on right-sidebar Session target changes when the host exposes mounted.
  face.effect(() => {
    const mounted = sidebarRight.mounted
    if (mounted?.subscribe === undefined) return () => {}
    let last = mounted.getSnapshot()
    return mounted.subscribe(() => {
      const next = mounted.getSnapshot()
      if (next !== last) {
        last = next
        modal.close()
      }
    })
  }, 'workspace-code-search: close on sidebar session change')

  face.effect(() => {
    const list = sessions.list
    let lastId: string | undefined
    let lastCwd: string | undefined
    const main = Object.values(list.getSnapshot().byId).find(row => (row.retainedBy.mainView ?? 0) > 0)
    lastId = main?.id
    lastCwd = main?.cwd
    return list.subscribe(() => {
      const next = Object.values(list.getSnapshot().byId).find(row => (row.retainedBy.mainView ?? 0) > 0)
      const nextId = next?.id
      const nextCwd = next?.cwd
      if (nextId !== lastId || nextCwd !== lastCwd) {
        lastId = nextId
        lastCwd = nextCwd
        modal.close()
      }
    })
  }, 'workspace-code-search: close on session/cwd change')
}

/** Wire RemoteResult + sessionId face into the UI's scope-based face. */
function adaptRemote(ns: WireWorkspaceCodeSearch): WorkspaceCodeSearchRemote {
  return {
    async status(scope: WorkspaceSearchScope): Promise<CodegraphStatus> {
      const result = await ns.status(scope.sessionId)
      if (!result.ok) throw result.error
      return result.value
    },
    async search(
      scope: WorkspaceSearchScope,
      request: RemoteSearchRequest,
      signal: AbortSignal,
    ): Promise<SearchResult> {
      const result = await ns.search(scope.sessionId, request, signal)
      if (!result.ok) throw result.error
      return result.value
    },
  }
}

/** Generated Client Remote methods after `$mount`. */
interface WireWorkspaceCodeSearch {
  status(sessionId: string): Promise<RemoteOk<CodegraphStatus>>
  search(
    sessionId: string,
    request: RemoteSearchRequest,
    signal: AbortSignal,
  ): Promise<RemoteOk<SearchResult>>
}

type RemoteOk<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: Error }

/** Structural Client services used by apply. */
interface ClientFace {
  effect(callback: () => (() => void) | void, label?: string): () => void
  locale: {
    register(ns: string, dicts: Record<string, Record<string, string>>): () => void
    bind(ns: string): (key: string) => string
  }
  shortcuts: {
    register(command: Record<string, unknown>): () => void
  }
  slots: {
    inject(name: string, register: () => () => void): () => void
    register(options: Record<string, unknown>, component: unknown): () => void
  }
  sidebarRight: {
    openResource(address: string, options?: { params?: { line?: number } }): void
    commandTarget?(element: Element | null): { sessionId: string } | undefined
    mounted?: {
      getSnapshot(): string | undefined
      subscribe(listener: () => void): () => void
    }
  }
  sessions: {
    list: {
      getSnapshot(): {
        byId: Record<string, {
          id: string
          cwd?: string
          retainedBy: { mainView?: number }
        }>
      }
      subscribe(listener: () => void): () => void
    }
  }
  remote: {
    $mount(contribution: unknown): Promise<() => Promise<void>>
    workspaceCodeSearch?: WireWorkspaceCodeSearch
  }
}
