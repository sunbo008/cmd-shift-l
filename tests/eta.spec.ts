import { describe, expect, it } from 'vitest'
import { estimateEtaSec } from '../src/client/eta.ts'

describe('estimateEtaSec', () => {
  it('returns undefined with fewer than 2 samples or zero matched', () => {
    expect(estimateEtaSec([{ atMs: 0, matched: 0 }], 50, 1000)).toBeUndefined()
    expect(estimateEtaSec([
      { atMs: 0, matched: 0 },
      { atMs: 2000, matched: 0 },
    ], 50, 2000)).toBeUndefined()
  })

  it('estimates seconds from match rate toward limit', () => {
    const samples = [
      { atMs: 0, matched: 10 },
      { atMs: 2000, matched: 30 },
    ]
    // rate = 10/s, remaining to 50 = 20 → ~2s
    expect(estimateEtaSec(samples, 50, 2000)).toBe(2)
  })
})
