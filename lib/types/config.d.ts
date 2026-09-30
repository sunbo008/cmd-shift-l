import Schema from '@deepseek-ai/schemastery';
/** Bundle config shared by Host search and Client UI debounce. */
export interface Config {
    maxQueryCodeUnits: number;
    limitPerKind: number;
    debounceMs: number;
    searchTimeoutMs: number;
}
/** Schemastery schema; Cordis fills defaults before apply. */
export declare const Config: Schema<Config>;
//# sourceMappingURL=config.d.ts.map