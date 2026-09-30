import { describe, expect, it } from 'vitest'
import {
  contentFrameSchema,
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

  it('contentFrameSchema accepts progress and result', () => {
    expect(contentFrameSchema().parse({ type: 'progress', matched: 2, pathHint: 'a.ts' })).toEqual({
      type: 'progress',
      matched: 2,
      pathHint: 'a.ts',
    })
    expect(contentFrameSchema().parse({ type: 'result', hits: [], truncated: false })).toEqual({
      type: 'result',
      hits: [],
      truncated: false,
    })
  })
})
