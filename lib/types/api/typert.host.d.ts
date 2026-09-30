/**
 * Hand-written Host Typert manifest (no codegen yet).
 * Registers status/search over namespace `workspaceCodeSearch`, reusing
 * workspace-files' `workspaceFileScope` lookup (wire = SessionId).
 */
import { z } from 'zod';
/** Host face registered by typert-loader when this package is an active Cordis entry. */
export declare const TYPERT: {
    package: string;
    face: "host";
    schemas: never[];
    invocations: ({
        id: string;
        service: string;
        namespace: string;
        method: string;
        invocation: {
            kind: "direct";
        };
        parameters: {
            name: string;
            wire: string;
            source: "lookup";
            lookup: string;
            codec: {
                mode: "strict";
                typeSymbol: string;
                create: () => z.ZodType;
            };
        }[];
        result: {
            mode: "strict";
            typeSymbol: string;
            create: () => z.ZodType;
        };
        cancellation?: undefined;
    } | {
        id: string;
        service: string;
        namespace: string;
        method: string;
        invocation: {
            kind: "direct";
        };
        parameters: ({
            name: string;
            wire: string;
            source: "lookup";
            lookup: string;
            codec: {
                mode: "strict";
                typeSymbol: string;
                create: () => z.ZodType;
            };
        } | {
            name: string;
            wire: string;
            source: "json";
            codec: {
                mode: "strict";
                typeSymbol: string;
                create: () => z.ZodType;
            };
        })[];
        cancellation: {
            parameter: "signal";
        };
        result: {
            mode: "strict";
            typeSymbol: string;
            create: () => z.ZodType;
        };
    })[];
    model: {
        services: {
            key: string;
            exportName: string;
            tags: never[];
            members: {
                kind: string;
                name: string;
                signature: string;
            }[];
            types: never[];
        }[];
        events: never[];
        objects: never[];
    };
};
//# sourceMappingURL=typert.host.d.ts.map