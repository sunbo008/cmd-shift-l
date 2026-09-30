/**
 * Hand-written Client Remote contribution for `$mount`.
 * Descriptors must match {@link ./typert.host.ts} invocations for mounted methods.
 *
 * Only `status` + `search` are mounted on the Client. Extra Host leg methods stay
 * Host-only: expanding Client `$mount` previously hung Windows UI inject.
 */
import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import {
  scopeLookup,
  searchRequestSchema,
  searchResultSchema,
  statusResultSchema,
} from './schemas.ts'

/** Client contribution mounted by the UI plugin. */
export const TYPERT_REMOTE: TypertRemoteContribution = {
  package: '@dsh-plugin/cmd-shift-l',
  descriptors: [
    {
      id: '@dsh-plugin/cmd-shift-l#workspaceCodeSearch/status',
      service: 'workspaceCodeSearchController',
      namespace: 'workspaceCodeSearch',
      method: 'status',
      invocation: { kind: 'direct' },
      parameters: [scopeLookup],
      result: {
        mode: 'strict',
        typeSymbol: '@dsh-plugin/cmd-shift-l#CodegraphStatus',
        create: statusResultSchema,
      },
    },
    {
      id: '@dsh-plugin/cmd-shift-l#workspaceCodeSearch/search',
      service: 'workspaceCodeSearchController',
      namespace: 'workspaceCodeSearch',
      method: 'search',
      invocation: { kind: 'direct' },
      parameters: [
        scopeLookup,
        {
          name: 'request',
          wire: 'request',
          source: 'json',
          codec: {
            mode: 'strict',
            typeSymbol: '@dsh-plugin/cmd-shift-l#RemoteSearchRequest',
            create: searchRequestSchema,
          },
        },
      ],
      cancellation: { parameter: 'signal' },
      result: {
        mode: 'strict',
        typeSymbol: '@dsh-plugin/cmd-shift-l#SearchResult',
        create: searchResultSchema,
      },
    },
  ],
}

export default TYPERT_REMOTE
