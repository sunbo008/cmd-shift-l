/**
 * Deferred Host wiring (service, providers, Typert Remote).
 * Loaded only after {@link apply} schedules a timer — keeps plugin entry light.
 */
import type { Context } from '@deepseek-ai/cordis';
import type { Config } from './config.ts';
/**
 * Register search service + providers + Remote on an already-running Host.
 * @param ctx - Cordis host context
 * @param config - validated bundle config
 */
export declare function bootHost(ctx: Context, config: Config): void;
//# sourceMappingURL=boot-host.d.ts.map