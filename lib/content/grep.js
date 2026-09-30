import { spawn } from 'node:child_process';
import { relative, resolve, sep } from 'node:path';
const PREVIEW_MAX_CHARS = 200;
/** Resolve the ripgrep binary: RG_PATH, then PATH `rg`. */
export function resolveRgBinary() {
    if (process.env.RG_PATH && process.env.RG_PATH.length > 0)
        return process.env.RG_PATH;
    return 'rg';
}
function isUnderRoot(root, relativePath) {
    if (relativePath.includes('\0'))
        return false;
    const normalized = relativePath.replaceAll('\\', '/');
    if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized))
        return false;
    if (normalized.split('/').includes('..'))
        return false;
    const abs = resolve(root, normalized);
    const rootResolved = resolve(root);
    return abs === rootResolved || abs.startsWith(rootResolved + sep);
}
function truncatePreview(text) {
    if (text.includes('\0'))
        return '';
    const flat = text.replaceAll('\r', '').replaceAll('\n', ' ');
    if (flat.length <= PREVIEW_MAX_CHARS)
        return flat;
    return flat.slice(0, PREVIEW_MAX_CHARS);
}
/**
 * Run workspace content search under `request.root` via ripgrep `--json`.
 * Does not follow symlinks. Paths in hits are relative to root.
 * @param request - provider search request
 */
export async function runWorkspaceGrep(request) {
    request.signal.throwIfAborted();
    const rg = resolveRgBinary();
    const argv = [
        '--json',
        '--no-config',
        `--regexp=${request.query}`,
        '--',
        '.',
    ];
    return await new Promise((resolvePromise, reject) => {
        const child = spawn(rg, argv, {
            cwd: request.root,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env },
            windowsHide: true,
        });
        let stdout = '';
        let stderr = '';
        const onAbort = () => {
            // Windows: SIGTERM is emulated; kill() without a signal still ends the process.
            child.kill();
        };
        request.signal.addEventListener('abort', onAbort, { once: true });
        child.stdout?.setEncoding('utf8');
        child.stderr?.setEncoding('utf8');
        child.stdout?.on('data', (chunk) => {
            stdout += chunk;
        });
        child.stderr?.on('data', (chunk) => {
            stderr += chunk;
        });
        child.on('error', (error) => {
            request.signal.removeEventListener('abort', onAbort);
            if (request.signal.aborted) {
                reject(error);
                return;
            }
            resolvePromise({
                hits: [],
                truncated: false,
                error: error instanceof Error ? error.message : String(error),
            });
        });
        child.on('close', (code) => {
            request.signal.removeEventListener('abort', onAbort);
            if (request.signal.aborted) {
                reject(new Error('aborted'));
                return;
            }
            // rg: 0 = matches, 1 = no matches, 2 = error
            if (code !== 0 && code !== 1) {
                resolvePromise({
                    hits: [],
                    truncated: false,
                    error: stderr.trim() || `rg exited with code ${String(code)}`,
                });
                return;
            }
            const hits = [];
            for (const line of stdout.split('\n')) {
                if (line.length === 0)
                    continue;
                let parsed;
                try {
                    parsed = JSON.parse(line);
                }
                catch {
                    continue;
                }
                if (parsed.type !== 'match' || parsed.data === undefined)
                    continue;
                const pathText = parsed.data.path?.text;
                const lineNumber = parsed.data.line_number;
                const previewRaw = parsed.data.lines?.text ?? '';
                if (pathText === undefined || lineNumber === undefined)
                    continue;
                const rel = pathText.replaceAll('\\', '/').replace(/^\.\//, '');
                if (!isUnderRoot(request.root, rel))
                    continue;
                // Drop absolute paths that rg might emit; normalize via relative().
                const normalized = (rel.startsWith('/') || /^[A-Za-z]:\//.test(rel)
                    ? relative(request.root, rel).replaceAll('\\', '/')
                    : rel).replace(/^\.\//, '');
                if (!isUnderRoot(request.root, normalized))
                    continue;
                const preview = truncatePreview(previewRaw);
                if (preview.length === 0)
                    continue;
                hits.push({ path: normalized, line: lineNumber, preview });
                if (hits.length > request.limit)
                    break;
            }
            const truncated = hits.length > request.limit;
            resolvePromise({
                hits: hits.slice(0, request.limit),
                truncated,
            });
        });
    });
}
//# sourceMappingURL=grep.js.map