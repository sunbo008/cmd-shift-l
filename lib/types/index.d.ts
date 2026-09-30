/**
 * Pure Host half: Cordis loads this entry on the Node side.
 * Browser UI lives in the `./client` export (`lib/client.js` factory bundle).
 */
import { Config } from './client/config.ts';
/** Host plugin body: no Host-side contributions. */
export declare function apply(): void;
export { Config };
export type { Config as ConfigType } from './client/config.ts';
//# sourceMappingURL=index.d.ts.map