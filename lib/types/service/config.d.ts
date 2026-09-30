import Schema from '@deepseek-ai/schemastery';
/** Validated deployment tunables for workspace code search. */
export interface Config {
    maxQueryCodeUnits: number;
    limitPerKind: number;
    debounceMs: number;
    searchTimeoutMs: number;
}
/** Schemastery schema; Cordis fills defaults before the plugin constructor. */
export declare const Config: Schema<Config>;
//# sourceMappingURL=config.d.ts.map