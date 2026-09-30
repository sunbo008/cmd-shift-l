import { describe, expect, it } from 'vitest'
import { Config } from '../src/config.ts'

describe('Config', () => {
  it('applies defaults', () => {
    const value = Config({})
    expect(value.maxQueryCodeUnits).toBe(500)
    expect(value.limitPerKind).toBe(50)
    expect(value.debounceMs).toBe(250)
    expect(value.searchTimeoutMs).toBe(10_000)
  })

  it('rejects zero maxQueryCodeUnits', () => {
    expect(() => Config({ maxQueryCodeUnits: 0 })).toThrow()
  })
})
