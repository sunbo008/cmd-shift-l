import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { load } from 'js-yaml'

describe('@dsh-plugin/cmd-shift-l patch', () => {
  it('is temporarily empty so Host apply never loads (Windows hang isolation)', () => {
    const raw = readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
    const doc = load(raw)
    expect(doc).toEqual([])
  })
})
