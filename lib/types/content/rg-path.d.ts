/**
 * @returns absolute path to a ripgrep binary, or a PATH name (`rg` / `rg.exe`)
 */
export declare function resolveRgBinary(): Promise<string>;
/** Test-only: drop the memoized resolution. */
export declare function resetRgBinaryCache(): void;
//# sourceMappingURL=rg-path.d.ts.map