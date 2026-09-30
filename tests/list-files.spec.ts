import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { asAbsolutePath } from '../src/service/index.ts'
import { escapeGlob, listFilesByQuery, scorePath } from '../src/content/list-files.ts'

const temps: string[] = []

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('escapeGlob / scorePath', () => {
  it('escapes glob metacharacters', () => {
    expect(escapeGlob('a*b?[c]')).toBe('a\\*b\\?\\[c\\]')
  })

  it('prefers basename matches', () => {
    expect(scorePath('python/development.md', 'development.md')).toBe(900)
    expect(scorePath('docs/other.md', 'development.md')).toBe(0)
  })
})

describe('listFilesByQuery', () => {
  it('finds markdown paths omitted from codegraph-style indexes', async () => {
    const root = mkdtempSync(join(tmpdir(), 'wcs-list-'))
    temps.push(root)
    mkdirSync(join(root, 'python'))
    writeFileSync(join(root, 'python', 'development.md'), '# docs\n')
    writeFileSync(join(root, 'python', 'development.i18n.yaml'), 'x: 1\n')
    writeFileSync(join(root, 'README.md'), 'hi\n')

    const { hits } = await listFilesByQuery({
      root: asAbsolutePath(root),
      query: 'development.md',
      limit: 10,
      signal: AbortSignal.timeout(10_000),
    })
    expect(hits.map(h => h.path)).toEqual(['python/development.md'])
  })
})
