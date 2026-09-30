import { Config } from "./config.js";
export const name = 'cmd-shift-l';
export { Config };
export { asAbsolutePath } from "./service/types.js";
/**
 * @param _ctx - Cordis host context (unused while inert)
 * @param _config - validated bundle config (unused while inert)
 */
export function apply(_ctx, _config) {
    // Intentionally empty: previous Host wiring (service + Typert Remote) still
    // coincided with Windows web UI stalls after Client was removed.
}
//# sourceMappingURL=index.js.map