/** Files / document toolbar search button. */
import type { ReactNode } from 'react';
/** Props for the files/document toolbar search control. */
export interface FilesToolbarButtonProps {
    onClick: () => void;
    label: () => string;
}
/**
 * Compact search control for `sidebar.right.tab.files.actions` /
 * `sidebar.right.tab.document.actions`.
 * @param props - click handler and localized label thunk
 */
export declare function FilesToolbarButton(props: FilesToolbarButtonProps): ReactNode;
//# sourceMappingURL=FilesToolbarButton.d.ts.map