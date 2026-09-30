import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { load } from 'js-yaml'

type PatchDoc = Array<{ insert?: Array<{ id: string; name: string }> }>

describe('@dsh-plugin/cmd-shift-l patch', () => {
  it('inserts host and client plugin rows', () => {
    const raw = readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
    const doc = load(raw) as PatchDoc
    const ids = doc.flatMap(entry => (entry.insert ?? []).map(row => row.id))
    expect(ids).toEqual(expect.arrayContaining([
      'workspace-code-search',
      'workspace-code-search-codegraph',
      'workspace-code-search-content',
      'api-workspace-code-search',
      'client-ui-workspace-code-search',
    ]))
    expect(ids).toHaveLength(5)
  })
})
