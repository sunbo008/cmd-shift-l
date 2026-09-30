/**
 * Hand-written Host Typert manifest (no codegen yet).
 * Registers status/search over namespace `workspaceCodeSearch`, reusing
 * workspace-files' `workspaceFileScope` lookup (wire = SessionId).
 */
import {
  scopeLookup,
  searchRequestSchema,
  searchResultSchema,
  statusResultSchema,
} from './schemas.ts'

/** Host face registered by typert-loader when this package is an active Cordis entry. */
export const TYPERT = {
  package: '@dsh-plugin/cmd-shift-l',
  face: 'host' as const,
  schemas: [],
  invocations: [
    {
      id: '@dsh-plugin/cmd-shift-l#workspaceCodeSearch/status',
      service: 'workspaceCodeSearchController',
      namespace: 'workspaceCodeSearch',
      method: 'status',
      invocation: { kind: 'direct' as const },
      parameters: [scopeLookup],
      result: {
        mode: 'strict' as const,
        typeSymbol: '@dsh-plugin/cmd-shift-l#CodegraphStatus',
        create: statusResultSchema,
      },
    },
    {
      id: '@dsh-plugin/cmd-shift-l#workspaceCodeSearch/search',
      service: 'workspaceCodeSearchController',
      namespace: 'workspaceCodeSearch',
      method: 'search',
      invocation: { kind: 'direct' as const },
      parameters: [
        scopeLookup,
        {
          name: 'request',
          wire: 'request',
          source: 'json' as const,
          codec: {
            mode: 'strict' as const,
            typeSymbol: '@dsh-plugin/cmd-shift-l#RemoteSearchRequest',
            create: searchRequestSchema,
          },
        },
      ],
      cancellation: { parameter: 'signal' as const },
      result: {
        mode: 'strict' as const,
        typeSymbol: '@dsh-plugin/cmd-shift-l#SearchResult',
        create: searchResultSchema,
      },
    },
  ],
  model: {
    services: [
      {
        key: 'workspaceCodeSearchController',
        exportName: 'default',
        tags: [],
        members: [
          {
            kind: 'method',
            name: 'status',
            signature: '@Remote status(workspaceFileScope): CodegraphStatus',
          },
          {
            kind: 'method',
            name: 'search',
            signature: '@Remote search(workspaceFileScope, request, signal): SearchResult',
          },
        ],
        types: [],
      },
    ],
    events: [],
    objects: [],
  },
}
