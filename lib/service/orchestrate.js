/** Normalize and validate a search query (session-search style). */
export function normalizeQuery(value, maxQueryCodeUnits) {
    if (typeof value !== 'string') {
        throw new Error('workspaceCodeSearch: query must be text');
    }
    const query = value.trim().replace(/\s+/gu, ' ');
    if (query.length === 0) {
        throw new Error('workspaceCodeSearch: query must contain non-whitespace text');
    }
    if (query.includes('\0')) {
        throw new Error('workspaceCodeSearch: query must not contain NUL');
    }
    if (query.length > maxQueryCodeUnits) {
        throw new Error(`workspaceCodeSearch: query exceeds maxQueryCodeUnits (${String(maxQueryCodeUnits)})`);
    }
    return query;
}
/** Clamp requested limit to 1..=config.limitPerKind. */
export function clampLimitPerKind(requested, configLimit) {
    const raw = requested ?? configLimit;
    if (!Number.isFinite(raw) || raw < 1)
        return 1;
    return Math.min(Math.floor(raw), configLimit);
}
function emptyResult() {
    return { files: [], symbols: [], content: [], truncated: false };
}
async function withTimeout(run, ms, signal) {
    const local = new AbortController();
    const timer = setTimeout(() => {
        local.abort(new DOMException(`workspaceCodeSearch timed out after ${String(ms)}ms`, 'TimeoutError'));
    }, ms);
    const onParentAbort = () => {
        local.abort(signal.reason);
    };
    if (signal.aborted) {
        clearTimeout(timer);
        throw signal.reason instanceof Error ? signal.reason : new Error('aborted');
    }
    signal.addEventListener('abort', onParentAbort, { once: true });
    try {
        return await run(local.signal);
    }
    catch (error) {
        // Prefer the timeout reason when our timer fired (providers often wrap as AbortError).
        if (local.signal.aborted && !signal.aborted) {
            const reason = local.signal.reason;
            throw reason instanceof Error ? reason : new DOMException(`workspaceCodeSearch timed out after ${String(ms)}ms`, 'TimeoutError');
        }
        throw error;
    }
    finally {
        clearTimeout(timer);
        signal.removeEventListener('abort', onParentAbort);
    }
}
/**
 * Resolve codegraph status from registered providers (first that implements status).
 * @param providers - registered providers
 * @param root - workspace root
 */
export async function resolveCodegraphStatus(providers, root) {
    for (const provider of providers) {
        if (provider.status === undefined)
            continue;
        return await provider.status(root);
    }
    return { codegraph: 'missing', message: 'No codegraph status provider registered' };
}
/**
 * Orchestrate partitioned search across providers.
 * @param providers - registered providers
 * @param config - plugin config
 * @param request - search request
 */
export async function orchestrateSearch(providers, config, request) {
    request.signal.throwIfAborted();
    const query = normalizeQuery(request.query, config.maxQueryCodeUnits);
    const kinds = new Set(request.kinds);
    if (kinds.size === 0)
        return emptyResult();
    const limit = clampLimitPerKind(request.limitPerKind, config.limitPerKind);
    const list = [...providers];
    const status = await resolveCodegraphStatus(list, request.root);
    const codegraphReady = status.codegraph === 'ready';
    const fileProviders = list.filter(p => p.searchFiles !== undefined);
    const symbolsProvider = list.find(p => p.searchSymbols !== undefined);
    const contentProvider = list.find(p => p.searchContent !== undefined);
    let files = [];
    let symbols = [];
    let content = [];
    let truncated = false;
    const errors = {};
    const leg = async (label, run) => {
        try {
            await withTimeout(run, config.searchTimeoutMs, request.signal);
        }
        catch (error) {
            // Parent cancellation aborts the whole search; per-leg timeout stays isolated.
            if (request.signal.aborted)
                throw error;
            if (label === 'codegraph') {
                errors.codegraph = error instanceof Error ? error.message : String(error);
            }
            else if (label === 'content') {
                errors.content = error instanceof Error ? error.message : String(error);
            }
            else {
                errors[label] = error instanceof Error ? error.message : String(error);
            }
        }
    };
    const tasks = [];
    if (kinds.has('file') || kinds.has('symbol')) {
        if (!codegraphReady) {
            // Index missing: still offer filesystem path search via the content provider.
            if (kinds.has('file')) {
                const fsProvider = list.find(p => p.id === 'content' && p.searchFiles !== undefined);
                if (fsProvider?.searchFiles !== undefined) {
                    const searchFiles = fsProvider.searchFiles.bind(fsProvider);
                    tasks.push(leg('file', async (signal) => {
                        const result = await searchFiles({
                            root: request.root,
                            query,
                            limit,
                            signal,
                        });
                        files = result.hits;
                        if (result.truncated)
                            truncated = true;
                        if (result.error !== undefined)
                            errors.file = result.error;
                    }));
                }
            }
        }
        else {
            // Merge every searchFiles provider (codegraph first, then rg --files fill-in
            // for paths the index omits such as Markdown).
            if (kinds.has('file') && fileProviders.length > 0) {
                tasks.push(leg('file', async (signal) => {
                    const seen = new Set();
                    const merged = [];
                    let anyTruncated = false;
                    for (const provider of fileProviders) {
                        const searchFiles = provider.searchFiles.bind(provider);
                        const result = await searchFiles({
                            root: request.root,
                            query,
                            limit,
                            signal,
                        });
                        if (result.truncated)
                            anyTruncated = true;
                        for (const hit of result.hits) {
                            if (seen.has(hit.path))
                                continue;
                            seen.add(hit.path);
                            merged.push(hit);
                        }
                    }
                    merged.sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.path.localeCompare(b.path));
                    files = merged.slice(0, limit);
                    if (anyTruncated || merged.length > limit)
                        truncated = true;
                }));
            }
            if (kinds.has('symbol') && symbolsProvider?.searchSymbols) {
                const searchSymbols = symbolsProvider.searchSymbols.bind(symbolsProvider);
                tasks.push(leg('symbol', async (signal) => {
                    const result = await searchSymbols({
                        root: request.root,
                        query,
                        limit,
                        signal,
                    });
                    symbols = result.hits;
                    if (result.truncated)
                        truncated = true;
                }));
            }
            if ((kinds.has('file') && fileProviders.length === 0)
                || (kinds.has('symbol') && symbolsProvider === undefined)) {
                // ready status but no provider methods — treat as codegraph error surface
                if (kinds.has('file') && fileProviders.length === 0)
                    errors.file = 'No file search provider';
                if (kinds.has('symbol') && symbolsProvider === undefined) {
                    errors.symbol = 'No symbol search provider';
                }
            }
        }
    }
    if (kinds.has('content')) {
        if (contentProvider?.searchContent === undefined) {
            errors.content = 'No content search provider';
        }
        else {
            const searchContent = contentProvider.searchContent.bind(contentProvider);
            tasks.push(leg('content', async (signal) => {
                const result = await searchContent({
                    root: request.root,
                    query,
                    limit,
                    signal,
                });
                content = result.hits;
                if (result.truncated)
                    truncated = true;
                if (result.error !== undefined)
                    errors.content = result.error;
            }));
        }
    }
    await Promise.all(tasks);
    request.signal.throwIfAborted();
    return {
        files,
        symbols,
        content,
        truncated,
        ...Object.keys(errors).length > 0 ? { errors } : {},
    };
}
//# sourceMappingURL=orchestrate.js.map