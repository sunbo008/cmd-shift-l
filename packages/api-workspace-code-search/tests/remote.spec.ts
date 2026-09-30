import { describe, expect, it } from 'vitest'
import { requireWorkspaceRoot, type RemoteSearchRequest } from '../src/types.ts'

describe('requireWorkspaceRoot', () => {
  it('rejects missing scope / empty cwd', () => {
    expect(() => requireWorkspaceRoot(undefined)).toThrow(/no Session workspace root/)
    expect(() => requireWorkspaceRoot({ sessionId: 's', workspaceRoot: '  ' })).toThrow(/no Session/)
  })

  it('returns AbsolutePath for a cwd', () => {
    const root = requireWorkspaceRoot({ sessionId: 's', workspaceRoot: '/tmp/ws' })
    expect(root).toBe('/tmp/ws')
  })
})

describe('RemoteSearchRequest', () => {
  it('does not require a root field on the public request type', () => {
    const request: RemoteSearchRequest = {
      query: 'foo',
      kinds: ['content'],
    }
    expect('root' in request).toBe(false)
  })
})
