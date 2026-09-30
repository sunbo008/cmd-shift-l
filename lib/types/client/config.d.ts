import Schema from '@deepseek-ai/schemastery';
/** Client-side search UX tunables (aligned with Host defaults). */
export interface Config {
    /** Debounce before Remote.search; schemastery default 250. */
    debounceMs?: number;
}
/** Schemastery schema for the Client plugin Config. */
export declare const Config: Schema<Config>;
//# sourceMappingURL=config.d.ts.map