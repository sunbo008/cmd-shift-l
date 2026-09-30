/** Shared search control glyph + button used in dock strip and tab toolbars. */
import { type ReactNode } from 'react';
/** Props for {@link SearchToolbarButton}. */
export interface SearchToolbarButtonProps {
    onClick: () => void;
    label: string;
}
/**
 * 28×28 icon button for workspace code search.
 * Hover highlights the control; after {@link TIP_DELAY_MS} a tip shows the Web shortcut.
 * @param props - click handler and accessible label
 */
export declare function SearchToolbarButton(props: SearchToolbarButtonProps): ReactNode;
//# sourceMappingURL=SearchToolbarButton.d.ts.map