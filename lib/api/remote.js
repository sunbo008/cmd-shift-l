import { contentFrameSchema, fileLegResultSchema, legRequestSchema, scopeLookup, searchRequestSchema, searchResultSchema, statusResultSchema, symbolLegResultSchema, } from "./schemas.js";
const legRequestParam = {
    name: 'request',
    wire: 'request',
    source: 'json',
    codec: {
        mode: 'strict',
        typeSymbol: '@dsh-plugin/cmd-shift-l#RemoteLegRequest',
        create: legRequestSchema,
    },
};
/** Client contribution mounted by the UI plugin. */
export const TYPERT_REMOTE = {
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
        {
            id: '@dsh-plugin/cmd-shift-l#workspaceCodeSearch/searchFiles',
            service: 'workspaceCodeSearchController',
            namespace: 'workspaceCodeSearch',
            method: 'searchFiles',
            invocation: { kind: 'direct' },
            parameters: [scopeLookup, legRequestParam],
            cancellation: { parameter: 'signal' },
            result: {
                mode: 'strict',
                typeSymbol: '@dsh-plugin/cmd-shift-l#FileLegResult',
                create: fileLegResultSchema,
            },
        },
        {
            id: '@dsh-plugin/cmd-shift-l#workspaceCodeSearch/searchSymbols',
            service: 'workspaceCodeSearchController',
            namespace: 'workspaceCodeSearch',
            method: 'searchSymbols',
            invocation: { kind: 'direct' },
            parameters: [scopeLookup, legRequestParam],
            cancellation: { parameter: 'signal' },
            result: {
                mode: 'strict',
                typeSymbol: '@dsh-plugin/cmd-shift-l#SymbolLegResult',
                create: symbolLegResultSchema,
            },
        },
        {
            id: '@dsh-plugin/cmd-shift-l#workspaceCodeSearch/searchContent',
            service: 'workspaceCodeSearchController',
            namespace: 'workspaceCodeSearch',
            method: 'searchContent',
            mode: 'stream',
            invocation: { kind: 'direct' },
            parameters: [scopeLookup, legRequestParam],
            cancellation: { parameter: 'signal' },
            result: {
                mode: 'strict',
                typeSymbol: '@dsh-plugin/cmd-shift-l#ContentSearchFrame',
                create: contentFrameSchema,
            },
        },
    ],
};
export default TYPERT_REMOTE;
//# sourceMappingURL=remote.js.map