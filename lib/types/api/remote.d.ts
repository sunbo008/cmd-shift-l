/**
 * Hand-written Client Remote contribution for `$mount`.
 * Descriptors must match {@link ./typert.host.ts} invocations for mounted methods.
 *
 * Only `status` + `search` are mounted on the Client. Extra Host leg methods stay
 * Host-only: expanding Client `$mount` previously hung Windows UI inject.
 */
import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol';
/** Client contribution mounted by the UI plugin. */
export declare const TYPERT_REMOTE: TypertRemoteContribution;
export default TYPERT_REMOTE;
//# sourceMappingURL=remote.d.ts.map