import { beforeAll, describe, expect, it } from 'vitest'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { asAbsolutePath } from '../src/service/index.ts'
import { openCodegraph } from '../src/codegraph/db.ts'
import { searchFiles, searchSymbols } from '../src/codegraph/search.ts'

const testsDir = resolve(fileURLToPath(new URL('.', import.meta.url)))
const fixtures = resolve(testsDir, 'fixtures')

beforeAll(() => {
  execFileSync(process.execPath, [resolve(testsDir, 'make-fixtures.mjs')], { stdio: 'inherit' })
})

describe('codegraph provider', () => {
  it('reports missing when .codegraph absent', () => {
    const root = asAbsolutePath(resolve(fixtures, 'missing'))
    expect(openCodegraph(root).status.codegraph).toBe('missing')
  })

  it('reports error for corrupt database', () => {
    const root = asAbsolutePath(resolve(fixtures, 'corrupt'))
    expect(openCodegraph(root).status.codegraph).toBe('error')
  })

  it('finds file path by substring with basename preferred', async () => {
    const root = asAbsolutePath(resolve(fixtures, 'ready'))
    const { db } = openCodegraph(root)
    expect(db).toBeDefined()
    const { hits } = await searchFiles(db!, {
      root,
      query: 'foo',
      limit: 10,
      signal: AbortSignal.timeout(5000),
    })
    db!.close()
    expect(hits[0]?.path).toBe('src/foo.ts')
  })

  it('finds symbol by name', async () => {
    const root = asAbsolutePath(resolve(fixtures, 'ready'))
    const { db } = openCodegraph(root)
    const { hits } = await searchSymbols(db!, {
      root,
      query: 'Bar',
      limit: 10,
      signal: AbortSignal.timeout(5000),
    })
    db!.close()
    expect(hits.some(h => h.name === 'Bar' && h.path === 'src/foo.ts' && h.line === 10)).toBe(true)
  })
})
