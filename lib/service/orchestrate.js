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
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
/**
 * Run the file search leg only.
 * @param providers - registered providers
 * @param config - plugin config
 * @param request - normalized query + limit
 */
export async function runFileLeg(providers, config, request) {
    request.signal.throwIfAborted();
    const list = [...providers];
    const status = await resolveCodegraphStatus(list, request.root);
    const codegraphReady = status.codegraph === 'ready';
    const fileProviders = list.filter(p => p.searchFiles !== undefined);
    try {
        return await withTimeout(async (signal) => {
            if (!codegraphReady) {
                const fsProvider = list.find(p => p.id === 'content' && p.searchFiles !== undefined);
                if (fsProvider?.searchFiles === undefined) {
                    return { hits: [], truncated: false };
                }
                const result = await fsProvider.searchFiles({
                    root: request.root,
                    query: request.query,
                    limit: request.limit,
                    signal,
                });
                return {
                    hits: result.hits,
                    truncated: result.truncated,
                    ...result.error === undefined ? {} : { error: result.error },
                };
            }
            if (fileProviders.length === 0) {
                return { hits: [], truncated: false, error: 'No file search provider' };
            }
            const seen = new Set();
            const merged = [];
            let anyTruncated = false;
            let providerError;
            for (const provider of fileProviders) {
                const searchFiles = provider.searchFiles.bind(provider);
                const result = await searchFiles({
                    root: request.root,
                    query: request.query,
                    limit: request.limit,
                    signal,
                });
                if (result.truncated)
                    anyTruncated = true;
                if (result.error !== undefined)
                    providerError = result.error;
                for (const hit of result.hits) {
                    if (seen.has(hit.path))
                        continue;
                    seen.add(hit.path);
                    merged.push(hit);
                }
            }
            merged.sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.path.localeCompare(b.path));
            return {
                hits: merged.slice(0, request.limit),
                truncated: anyTruncated || merged.length > request.limit,
                ...providerError === undefined ? {} : { error: providerError },
            };
        }, config.searchTimeoutMs, request.signal);
    }
    catch (error) {
        if (request.signal.aborted)
            throw error;
        return { hits: [], truncated: false, error: errorMessage(error) };
    }
}
/**
 * Run the symbol search leg only.
 * @param providers - registered providers
 * @param config - plugin config
 * @param request - normalized query + limit
 */
export async function runSymbolLeg(providers, config, request) {
    request.signal.throwIfAborted();
    const list = [...providers];
    const status = await resolveCodegraphStatus(list, request.root);
    if (status.codegraph !== 'ready') {
        return { hits: [], truncated: false };
    }
    const symbolsProvider = list.find(p => p.searchSymbols !== undefined);
    if (symbolsProvider?.searchSymbols === undefined) {
        return { hits: [], truncated: false, error: 'No symbol search provider' };
    }
    const searchSymbols = symbolsProvider.searchSymbols.bind(symbolsProvider);
    try {
        return await withTimeout(async (signal) => {
            const result = await searchSymbols({
                root: request.root,
                query: request.query,
                limit: request.limit,
                signal,
            });
            return { hits: result.hits, truncated: result.truncated };
        }, config.searchTimeoutMs, request.signal);
    }
    catch (error) {
        if (request.signal.aborted)
            throw error;
        return { hits: [], truncated: false, error: errorMessage(error) };
    }
}
/**
 * Run the content search leg only.
 * @param providers - registered providers
 * @param config - plugin config
 * @param request - normalized query + limit
 */
export async function runContentLeg(providers, config, request) {
    request.signal.throwIfAborted();
    const list = [...providers];
    const contentProvider = list.find(p => p.searchContent !== undefined);
    if (contentProvider?.searchContent === undefined) {
        return { hits: [], truncated: false, error: 'No content search provider' };
    }
    const searchContent = contentProvider.searchContent.bind(contentProvider);
    try {
        return await withTimeout(async (signal) => {
            const result = await searchContent({
                root: request.root,
                query: request.query,
                limit: request.limit,
                signal,
            });
            return {
                hits: result.hits,
                truncated: result.truncated,
                ...result.error === undefined ? {} : { error: result.error },
            };
        }, config.searchTimeoutMs, request.signal);
    }
    catch (error) {
        if (request.signal.aborted)
            throw error;
        return { hits: [], truncated: false, error: errorMessage(error) };
    }
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
    const legRequest = {
        root: request.root,
        query,
        limit,
        signal: request.signal,
    };
    const tasks = [];
    let files = [];
    let symbols = [];
    let content = [];
    let truncated = false;
    const errors = {};
    if (kinds.has('file')) {
        tasks.push((async () => {
            const result = await runFileLeg(list, config, legRequest);
            files = result.hits;
            if (result.truncated)
                truncated = true;
            if (result.error !== undefined)
                errors.file = result.error;
        })());
    }
    if (kinds.has('symbol')) {
        tasks.push((async () => {
            const result = await runSymbolLeg(list, config, legRequest);
            symbols = result.hits;
            if (result.truncated)
                truncated = true;
            if (result.error !== undefined)
                errors.symbol = result.error;
        })());
    }
    if (kinds.has('content')) {
        tasks.push((async () => {
            const result = await runContentLeg(list, config, legRequest);
            content = result.hits;
            if (result.truncated)
                truncated = true;
            if (result.error !== undefined)
                errors.content = result.error;
        })());
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