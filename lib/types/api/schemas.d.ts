/** Typert descriptors expect a classic-shaped `ZodType`; mini schemas satisfy `.parse` at runtime. */
type ZodType = {
    parse(data: unknown): unknown;
};
/** SessionId wire codec (workspaceFileScope lookup). */
export declare const sessionIdSchema: () => ZodType;
/** {@link CodegraphStatus} wire codec. */
export declare const statusResultSchema: () => ZodType;
/** Client search request (no workspace root). */
export declare const searchRequestSchema: () => ZodType;
/** Partitioned search result. */
export declare const searchResultSchema: () => ZodType;
/** Shared `workspaceFileScope` lookup parameter for status/search. */
export declare const scopeLookup: {
    name: string;
    wire: string;
    source: "lookup";
    lookup: string;
    codec: {
        mode: "strict";
        typeSymbol: string;
        create: () => ZodType;
    };
};
export {};
//# sourceMappingURL=schemas.d.ts.map