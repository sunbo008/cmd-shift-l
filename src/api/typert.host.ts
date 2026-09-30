/**
 * Hand-written Host Typert manifest (no codegen yet).
 * Registers status/search over namespace `workspaceCodeSearch`, reusing
 * workspace-files' `workspaceFileScope` lookup (wire = SessionId).
 */
import { z } from 'zod'

const sessionIdSchema = (): z.ZodType => z.intersection(z.string(), z.unknown())

const statusResultSchema = (): z.ZodType => z.object({
  codegraph: z.union([z.literal('ready'), z.literal('missing'), z.literal('error')]).readonly(),
  message: z.string().readonly().optional(),
})

const searchRequestSchema = (): z.ZodType => z.object({
  query: z.string().readonly(),
  kinds: z.array(z.union([z.literal('file'), z.literal('content'), z.literal('symbol')])).readonly(),
  limitPerKind: z.number().readonly().optional(),
})

const searchResultSchema = (): z.ZodType => z.object({
  files: z.array(z.object({
    path: z.string().readonly(),
    score: z.number().readonly().optional(),
  }).readonly()).readonly(),
  symbols: z.array(z.object({
    path: z.string().readonly(),
    name: z.string().readonly(),
    kind: z.string().readonly(),
    line: z.number().readonly().optional(),
    score: z.number().readonly().optional(),
  }).readonly()).readonly(),
  content: z.array(z.object({
    path: z.string().readonly(),
    line: z.number().readonly(),
    preview: z.string().readonly(),
  }).readonly()).readonly(),
  truncated: z.boolean().readonly(),
  errors: z.object({
    file: z.string().readonly().optional(),
    symbol: z.string().readonly().optional(),
    content: z.string().readonly().optional(),
    codegraph: z.string().readonly().optional(),
  }).readonly().optional(),
})

const scopeLookup = {
  name: 'workspaceFileScope',
  wire: 'workspaceFileScopeId',
  source: 'lookup' as const,
  lookup: 'workspaceFileScope',
  codec: {
    mode: 'strict' as const,
    typeSymbol: '@deepseek-ai/dsh-session/types#SessionId',
    create: sessionIdSchema,
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
