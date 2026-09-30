import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { asAbsolutePath } from '../src/service/index.ts'
import { resolveRgBinary, runWorkspaceGrep } from '../src/content/grep.ts'
import { spawnSync } from 'node:child_process'

function rgAvailable(): boolean {
  const rg = resolveRgBinary()
  const probe = spawnSync(rg, ['--version'], { encoding: 'utf8' })
  return probe.status === 0
}

describe.skipIf(!rgAvailable())('content grep', () => {
  it('returns path:line:preview for a text hit', async () => {
    const root = await mkdtemp(join(tmpdir(), 'wcs-'))
    await writeFile(join(root, 'a.txt'), 'hello uniqueToken world\n')
    const { hits } = await runWorkspaceGrep({
      root: asAbsolutePath(root),
      query: 'uniqueToken',
      limit: 10,
      signal: AbortSignal.timeout(5000),
    })
    expect(hits).toEqual([
      { path: 'a.txt', line: 1, preview: expect.stringContaining('uniqueToken') },
    ])
  })

  it('skips binary-ish NUL lines', async () => {
    const root = await mkdtemp(join(tmpdir(), 'wcs-'))
    await writeFile(join(root, 'b.bin'), Buffer.from([0x68, 0x00, 0x69]))
    const { hits } = await runWorkspaceGrep({
      root: asAbsolutePath(root),
      query: 'h',
      limit: 10,
      signal: AbortSignal.timeout(5000),
    })
    expect(hits.every(h => !h.preview.includes('\0'))).toBe(true)
  })
})
