/**
 * Overlay host: dock-strip search button + modal when open.
 */
import { type ReactNode } from 'react';
import type { WorkspaceCodeSearchRemote } from '@dsh-plugin/api-workspace-code-search/client';
import type { WorkspaceCodeSearchCopy } from './locales.ts';
import type { ModalController } from './modal-controller.ts';
import { type OpenResource } from './SearchModal.tsx';
/** Injected face for the shell.overlay registration. */
export interface SearchModalHostInjected {
    modal: ModalController;
    remote: WorkspaceCodeSearchRemote;
    openResource: OpenResource;
    /** Open search for the active Session (no-op without cwd). */
    openSearch: () => void;
    debounceMs: number;
    copy: WorkspaceCodeSearchCopy;
}
/**
 * Always mount the dock-strip control; render SearchModal while open.
 * @param props - injected services and copy
 */
export declare function SearchModalHost(props: SearchModalHostInjected): ReactNode;
//# sourceMappingURL=SearchModalHost.d.ts.map