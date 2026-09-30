/**
 * Hand-written Client Remote contribution for `$mount`.
 * Descriptors must match {@link ./typert.host.ts} invocations.
 */
import { z } from 'zod'
import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'

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

/** Client contribution mounted by the UI plugin. */
export const TYPERT_REMOTE: TypertRemoteContribution = {
  package: '@dsh-plugin/api-workspace-code-search',
  descriptors: [
    {
      id: '@dsh-plugin/api-workspace-code-search#workspaceCodeSearch/status',
      service: 'workspaceCodeSearchController',
      namespace: 'workspaceCodeSearch',
      method: 'status',
      invocation: { kind: 'direct' },
      parameters: [scopeLookup],
      result: {
        mode: 'strict',
        typeSymbol: '@dsh-plugin/workspace-code-search#CodegraphStatus',
        create: statusResultSchema,
      },
    },
    {
      id: '@dsh-plugin/api-workspace-code-search#workspaceCodeSearch/search',
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
            typeSymbol: '@dsh-plugin/api-workspace-code-search#RemoteSearchRequest',
            create: searchRequestSchema,
          },
        },
      ],
      cancellation: { parameter: 'signal' },
      result: {
        mode: 'strict',
        typeSymbol: '@dsh-plugin/workspace-code-search#SearchResult',
        create: searchResultSchema,
      },
    },
  ],
}

export default TYPERT_REMOTE
