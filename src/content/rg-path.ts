/**
 * Resolve a ripgrep binary without depending on `@vscode/ripgrep` at install time
 * (its postinstall would trip pnpm allowBuilds on github installs).
 *
 * Order: `RG_PATH` → dsh/`pkg` sidecar → hoisted `@vscode/ripgrep` near this
 * package or cwd → bare `rg` / `rg.exe` on PATH.
 */
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, parse } from 'node:path'
import { fileURLToPath } from 'node:url'

let cached: Promise<string> | undefined

function tryVscodeRipgrep(from: string): string | undefined {
  try {
    const require = createRequire(join(from, 'noop.js'))
    const mod = require('@vscode/ripgrep') as { rgPath?: string }
    if (typeof mod.rgPath === 'string' && mod.rgPath.length > 0 && existsSync(mod.rgPath)) {
      return process.versions.electron === undefined
        ? mod.rgPath
        : mod.rgPath.replace(/\.asar(?=[\\/])/u, '.asar.unpacked')
    }
  } catch {
    // Not installed in this node_modules root.
  }
  return undefined
}

function searchAncestors(start: string): string | undefined {
  let dir = start
  for (let i = 0; i < 10; i++) {
    const hit = tryVscodeRipgrep(dir)
    if (hit !== undefined) return hit
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return undefined
}

/**
 * @returns absolute path to a ripgrep binary, or a PATH name (`rg` / `rg.exe`)
 */
export function resolveRgBinary(): Promise<string> {
  cached ??= Promise.resolve().then(() => {
    if (process.env.RG_PATH && process.env.RG_PATH.length > 0) return process.env.RG_PATH

    const executable = parse(process.execPath)
    const sidecar = process.platform === 'win32'
      ? join(executable.dir, `${executable.name}-rg.exe`)
      : `${process.execPath}-rg`
    if (existsSync(sidecar)) return sidecar

    const here = dirname(fileURLToPath(import.meta.url))
    const fromPackage = searchAncestors(here)
    if (fromPackage !== undefined) return fromPackage
    const fromCwd = searchAncestors(process.cwd())
    if (fromCwd !== undefined) return fromCwd

    return process.platform === 'win32' ? 'rg.exe' : 'rg'
  })
  return cached
}

/** Test-only: drop the memoized resolution. */
export function resetRgBinaryCache(): void {
  cached = undefined
}
