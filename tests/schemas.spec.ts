import { describe, expect, it } from 'vitest'
import {
  searchRequestSchema,
  searchResultSchema,
  statusResultSchema,
} from '../src/api/schemas.ts'

describe('Typert wire schemas (zod mini)', () => {
  it('accepts a ready status', () => {
    expect(statusResultSchema().parse({ codegraph: 'ready' })).toEqual({ codegraph: 'ready' })
  })

  it('rejects empty search kinds', () => {
    // kinds may be empty at the codec layer; orchestrate rejects empty query separately
    expect(searchRequestSchema().parse({ query: 'foo', kinds: [] })).toEqual({
      query: 'foo',
      kinds: [],
    })
  })

  it('round-trips a minimal search result', () => {
    const value = {
      files: [{ path: 'a.ts' }],
      symbols: [],
      content: [],
      truncated: false,
    }
    expect(searchResultSchema().parse(value)).toEqual(value)
  })
})
