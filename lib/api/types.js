import { asAbsolutePath } from "../service/types.js";
/**
 * Convert Session cwd / workspace root into AbsolutePath or throw.
 * @param scope - scope from Typert lookup (or undefined when no Session)
 */
export function requireWorkspaceRoot(scope) {
    const cwd = scope?.workspaceRoot?.trim();
    if (cwd === undefined || cwd.length === 0) {
        throw new Error('workspaceCodeSearch: no Session workspace root');
    }
    return asAbsolutePath(cwd);
}
//# sourceMappingURL=types.js.map