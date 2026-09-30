import { Config } from "./config.js";
export const name = 'cmd-shift-l';
export { Config };
export { asAbsolutePath } from "./service/types.js";
/** Delay Host search wiring so Files / model RPC can finish first on Windows. */
const HOST_BOOT_DELAY_MS = 3_000;
/**
 * @param ctx - Cordis host context
 * @param config - validated bundle config
 */
export function apply(ctx, config) {
    ctx.effect(() => {
        const timer = setTimeout(() => {
            void import("./boot-host.js")
                .then((mod) => {
                mod.bootHost(ctx, config);
            })
                .catch((error) => {
                console.error('[cmd-shift-l] deferred Host boot failed', error);
            });
        }, HOST_BOOT_DELAY_MS);
        return () => {
            clearTimeout(timer);
        };
    }, 'cmd-shift-l: deferred host boot');
}
//# sourceMappingURL=index.js.map