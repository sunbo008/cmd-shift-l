/**
 * Client plugin: modal overlay, Cmd/Ctrl+Shift+L (Web) / Shift+F (Desktop), dock-strip button.
 *
 * Uses structural Cordis faces so this package typechecks without linking the
 * full harness client tree; when installed into dsh the real services match.
 */
import type { Context } from '@deepseek-ai/cordis';
import { Config } from './config.ts';
/** Locale namespace. */
export declare const NS = "workspaceCodeSearch";
/** Cordis inject list for Client loaders. */
export declare const inject: readonly ["locale", "shortcuts", "slots", "sidebarRight", "remote", "sessions"];
export { Config };
export type { Config as ConfigType };
/**
 * Mount workspace code search UI and Client Remote contribution.
 * @param ctx - Client root context
 * @param config - validated Client Config
 * @returns disposer that withdraws Remote + UI effects
 */
export declare function apply(ctx: Context, config?: Config): Promise<() => Promise<void>>;
//# sourceMappingURL=index.d.ts.map