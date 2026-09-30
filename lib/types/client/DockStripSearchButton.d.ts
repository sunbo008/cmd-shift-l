/**
 * Portals a search control into the right-Sidebar dock strip (between + and split).
 * The strip has no public Cordis slot; this mounts into `data-dockkit-strip-fill`.
 */
import { type ReactNode } from 'react';
/** Props for {@link DockStripSearchButton}. */
export interface DockStripSearchButtonProps {
    onClick: () => void;
    label: string;
}
/**
 * Keep a host node before the strip fill of the chrome pane and portal the button into it.
 * @param props - open handler and label
 */
export declare function DockStripSearchButton(props: DockStripSearchButtonProps): ReactNode;
//# sourceMappingURL=DockStripSearchButton.d.ts.map