/**
 * Wire codecs for Typert Remote (Host TYPERT + Client `$mount`).
 * Uses `zod/v4/mini` so the Client bundle stays small (~17KB vs classic ~750KB).
 */
import * as z from 'zod/v4/mini';
const asZodType = (schema) => schema;
/** SessionId wire codec (workspaceFileScope lookup). */
export const sessionIdSchema = () => asZodType(z.intersection(z.string(), z.unknown()));
/** {@link CodegraphStatus} wire codec. */
export const statusResultSchema = () => asZodType(z.object({
    codegraph: z.union([z.literal('ready'), z.literal('missing'), z.literal('error')]),
    message: z.optional(z.string()),
}));
/** Client search request (no workspace root). */
export const searchRequestSchema = () => asZodType(z.object({
    query: z.string(),
    kinds: z.array(z.union([z.literal('file'), z.literal('content'), z.literal('symbol')])),
    limitPerKind: z.optional(z.number()),
}));
/** Single-leg Remote request (no kinds, no root). */
export const legRequestSchema = () => asZodType(z.object({
    query: z.string(),
    limitPerKind: z.optional(z.number()),
}));
/** File-leg result. */
export const fileLegResultSchema = () => asZodType(z.object({
    hits: z.array(z.object({
        path: z.string(),
        score: z.optional(z.number()),
    })),
    truncated: z.boolean(),
    error: z.optional(z.string()),
}));
/** Symbol-leg result. */
export const symbolLegResultSchema = () => asZodType(z.object({
    hits: z.array(z.object({
        path: z.string(),
        name: z.string(),
        kind: z.string(),
        line: z.optional(z.number()),
        score: z.optional(z.number()),
    })),
    truncated: z.boolean(),
    error: z.optional(z.string()),
}));
/** Content-leg unary result. */
export const contentLegResultSchema = () => asZodType(z.object({
    hits: z.array(z.object({
        path: z.string(),
        line: z.number(),
        preview: z.string(),
    })),
    truncated: z.boolean(),
    error: z.optional(z.string()),
}));
/** One streaming content-search frame (Host-local / future use). */
export const contentFrameSchema = () => asZodType(z.union([
    z.object({
        type: z.literal('progress'),
        matched: z.number(),
        pathHint: z.optional(z.string()),
        filesScanned: z.optional(z.number()),
    }),
    z.object({
        type: z.literal('result'),
        hits: z.array(z.object({
            path: z.string(),
            line: z.number(),
            preview: z.string(),
        })),
        truncated: z.boolean(),
        error: z.optional(z.string()),
    }),
]));
/** Partitioned search result. */
export const searchResultSchema = () => asZodType(z.object({
    files: z.array(z.object({
        path: z.string(),
        score: z.optional(z.number()),
    })),
    symbols: z.array(z.object({
        path: z.string(),
        name: z.string(),
        kind: z.string(),
        line: z.optional(z.number()),
        score: z.optional(z.number()),
    })),
    content: z.array(z.object({
        path: z.string(),
        line: z.number(),
        preview: z.string(),
    })),
    truncated: z.boolean(),
    errors: z.optional(z.object({
        file: z.optional(z.string()),
        symbol: z.optional(z.string()),
        content: z.optional(z.string()),
        codegraph: z.optional(z.string()),
    })),
}));
/** Shared `workspaceFileScope` lookup parameter for status/search. */
export const scopeLookup = {
    name: 'workspaceFileScope',
    wire: 'workspaceFileScopeId',
    source: 'lookup',
    lookup: 'workspaceFileScope',
    codec: {
        mode: 'strict',
        typeSymbol: '@deepseek-ai/dsh-session/types#SessionId',
        create: sessionIdSchema,
    },
};
//# sourceMappingURL=schemas.js.map