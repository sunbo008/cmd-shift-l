/** Modal open/close controller shared by shortcut, toolbar, and overlay. */
export interface SearchSessionScope {
    readonly sessionId: string;
    readonly workspaceRoot: string;
}
/** Mutable open-state for the search overlay. */
export interface ModalController {
    readonly getSnapshot: () => {
        open: boolean;
        scope: SearchSessionScope | undefined;
        generation: number;
    };
    readonly subscribe: (listener: () => void) => () => void;
    open(scope: SearchSessionScope): void;
    close(): void;
}
/**
 * Create a tiny external store for modal visibility.
 * @returns controller used by shortcut / toolbar / overlay host
 */
export declare function createModalController(): ModalController;
//# sourceMappingURL=modal-controller.d.ts.map