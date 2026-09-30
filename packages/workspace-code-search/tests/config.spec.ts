import { describe, expect, it } from 'vitest'
import { Config } from '../src/config.ts'

describe('Config', () => {
  it('rejects non-positive limitPerKind', () => {
    expect(() => Config({ limitPerKind: 0 })).toThrow()
  })

  it('applies defaults for omitted fields', () => {
    const c = Config({})
    expect(c.maxQueryCodeUnits).toBe(500)
    expect(c.limitPerKind).toBe(50)
    expect(c.debounceMs).toBe(250)
    expect(c.searchTimeoutMs).toBe(10_000)
  })
})
