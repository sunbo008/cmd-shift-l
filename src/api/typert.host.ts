/**
 * Hand-written Host Typert manifest (no codegen yet).
 * Registers status/search over namespace `workspaceCodeSearch`, reusing
 * workspace-files' `workspaceFileScope` lookup (wire = SessionId).
 */
import {
  contentFrameSchema,
  fileLegResultSchema,
  legRequestSchema,
  scopeLookup,
  searchRequestSchema,
  searchResultSchema,
  statusResultSchema,
  symbolLegResultSchema,
} from './schemas.ts'

const legRequestParam = {
  name: 'request',
  wire: 'request',
  source: 'json' as const,
  codec: {
    mode: 'strict' as const,
    typeSymbol: '@dsh-plugin/cmd-shift-l#RemoteLegRequest',
    create: legRequestSchema,
  },
}

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
    {
      id: '@dsh-plugin/cmd-shift-l#workspaceCodeSearch/searchFiles',
      service: 'workspaceCodeSearchController',
      namespace: 'workspaceCodeSearch',
      method: 'searchFiles',
      invocation: { kind: 'direct' as const },
      parameters: [scopeLookup, legRequestParam],
      cancellation: { parameter: 'signal' as const },
      result: {
        mode: 'strict' as const,
        typeSymbol: '@dsh-plugin/cmd-shift-l#FileLegResult',
        create: fileLegResultSchema,
      },
    },
    {
      id: '@dsh-plugin/cmd-shift-l#workspaceCodeSearch/searchSymbols',
      service: 'workspaceCodeSearchController',
      namespace: 'workspaceCodeSearch',
      method: 'searchSymbols',
      invocation: { kind: 'direct' as const },
      parameters: [scopeLookup, legRequestParam],
      cancellation: { parameter: 'signal' as const },
      result: {
        mode: 'strict' as const,
        typeSymbol: '@dsh-plugin/cmd-shift-l#SymbolLegResult',
        create: symbolLegResultSchema,
      },
    },
    {
      id: '@dsh-plugin/cmd-shift-l#workspaceCodeSearch/searchContent',
      service: 'workspaceCodeSearchController',
      namespace: 'workspaceCodeSearch',
      method: 'searchContent',
      mode: 'stream' as const,
      invocation: { kind: 'direct' as const },
      parameters: [scopeLookup, legRequestParam],
      cancellation: { parameter: 'signal' as const },
      result: {
        mode: 'strict' as const,
        typeSymbol: '@dsh-plugin/cmd-shift-l#ContentSearchFrame',
        create: contentFrameSchema,
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
          {
            kind: 'method',
            name: 'searchFiles',
            signature: '@Remote searchFiles(workspaceFileScope, request, signal): FileLegResult',
          },
          {
            kind: 'method',
            name: 'searchSymbols',
            signature: '@Remote searchSymbols(workspaceFileScope, request, signal): SymbolLegResult',
          },
          {
            kind: 'method',
            name: 'searchContent',
            signature:
              '@Remote({ mode: "stream" }) searchContent(workspaceFileScope, request, signal): AsyncIterable<ContentSearchFrame>',
          },
        ],
        types: [],
      },
    ],
    events: [],
    objects: [],
  },
}
