import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { load } from 'js-yaml'

type PatchDoc = Array<{ insert?: Array<{ id: string; name: string }> }>

describe('@dsh-plugin/cmd-shift-l patch', () => {
  it('inserts the single root package row', () => {
    const raw = readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
    const doc = load(raw) as PatchDoc
    const rows = doc.flatMap(entry => entry.insert ?? [])
    expect(rows).toEqual([
      expect.objectContaining({
        id: 'cmd-shift-l',
        name: '@dsh-plugin/cmd-shift-l',
      }),
    ])
  })
})
