import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { load } from 'js-yaml'

describe('@dsh-plugin/cmd-shift-l patch', () => {
  it('is empty so Host never loads (Windows startup hang isolation)', () => {
    const raw = readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
    expect(load(raw)).toEqual([])
  })
})
