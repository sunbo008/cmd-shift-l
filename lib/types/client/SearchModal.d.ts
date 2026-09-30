import type { CodegraphStatus } from '@dsh-plugin/workspace-code-search';
import type { WorkspaceCodeSearchRemote, WorkspaceSearchScope } from '@dsh-plugin/api-workspace-code-search/client';
import type { WorkspaceCodeSearchCopy } from './locales.ts';
/** Open-resource callback matching sidebarRight.openResource. */
export type OpenResource = (address: string, options?: {
    params?: {
        line?: number;
    };
}) => void;
/** Props for {@link SearchModal}. */
export interface SearchModalProps {
    open: boolean;
    onClose: () => void;
    scope: WorkspaceSearchScope;
    remote: WorkspaceCodeSearchRemote;
    openResource: OpenResource;
    debounceMs: number;
    copy: WorkspaceCodeSearchCopy;
    /** Optional initial status from open-time fetch. */
    initialStatus?: CodegraphStatus;
}
/**
 * Unified search dialog: debounce + abort + seq; opens Sidebar on Enter/click.
 * @param props - modal wiring
 */
export declare function SearchModal({ open, onClose, scope, remote, openResource, debounceMs, copy, initialStatus, }: SearchModalProps): import("react").JSX.Element | null;
//# sourceMappingURL=SearchModal.d.ts.map