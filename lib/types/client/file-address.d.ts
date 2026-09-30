/**
 * Browser-safe session file address (mirrors @deepseek-ai/dsh-util-workspace-path).
 * Kept local so this package typechecks without linking the full harness util tree.
 */
/**
 * Build `dsh-resource://file/session/<sessionId>/<path>`.
 * @param sessionId - Session id
 * @param path - relative or absolute path
 */
export declare function sessionFileAddress(sessionId: string, path: string): string;
/**
 * Address for opening a hit in the right Sidebar.
 * @param sessionId - active Session
 * @param cwd - Session workspace root
 * @param path - hit path (relative preferred)
 */
export declare function fileAddressFor(sessionId: string, cwd: string | undefined, path: string): string;
//# sourceMappingURL=file-address.d.ts.map