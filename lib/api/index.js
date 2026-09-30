var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import Schema from '@deepseek-ai/schemastery';
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { requireWorkspaceRoot, } from "./types.js";
export { requireWorkspaceRoot } from "./types.js";
/** Empty schemastery schema for the Remote controller. */
export const Config = Schema.object({});
let WorkspaceCodeSearchController = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _status_decorators;
    let _search_decorators;
    let _searchFiles_decorators;
    let _searchSymbols_decorators;
    let _searchContent_decorators;
    return class WorkspaceCodeSearchController extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _status_decorators = [Remote];
            _search_decorators = [Remote];
            _searchFiles_decorators = [Remote];
            _searchSymbols_decorators = [Remote];
            _searchContent_decorators = [Remote({ mode: 'stream' })];
            __esDecorate(this, null, _status_decorators, { kind: "method", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _search_decorators, { kind: "method", name: "search", static: false, private: false, access: { has: obj => "search" in obj, get: obj => obj.search }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _searchFiles_decorators, { kind: "method", name: "searchFiles", static: false, private: false, access: { has: obj => "searchFiles" in obj, get: obj => obj.searchFiles }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _searchSymbols_decorators, { kind: "method", name: "searchSymbols", static: false, private: false, access: { has: obj => "searchSymbols" in obj, get: obj => obj.searchSymbols }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _searchContent_decorators, { kind: "method", name: "searchContent", static: false, private: false, access: { has: obj => "searchContent" in obj, get: obj => obj.searchContent }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static inject = ['workspaceCodeSearch', 'typert'];
        static Config = Config;
        /**
         * @param ctx - Host context
         * @param _config - empty validated config
         */
        constructor(ctx, _config) {
            super(ctx, 'workspaceCodeSearchController', { namespace: 'workspaceCodeSearch' });
            __runInitializers(this, _instanceExtraInitializers);
        }
        /**
         * @param workspaceFileScope - Session-derived workspace root (lookup name matches workspace-files)
         */
        async status(workspaceFileScope) {
            try {
                const root = requireWorkspaceRoot(workspaceFileScope);
                return await this.ctx.workspaceCodeSearch.status(root);
            }
            catch (error) {
                const reason = error instanceof Error ? error.message : String(error);
                throw new Error(`workspace-code-search/status-failed: ${reason}`, { cause: error });
            }
        }
        /**
         * @param workspaceFileScope - Session-derived workspace root
         * @param request - query without root
         * @param signal - cancellation
         */
        async search(workspaceFileScope, request, signal) {
            signal.throwIfAborted();
            try {
                const root = requireWorkspaceRoot(workspaceFileScope);
                return await this.ctx.workspaceCodeSearch.search({
                    root,
                    query: request.query,
                    kinds: request.kinds,
                    ...request.limitPerKind === undefined ? {} : { limitPerKind: request.limitPerKind },
                    signal,
                });
            }
            catch (error) {
                signal.throwIfAborted();
                const reason = error instanceof Error ? error.message : String(error);
                throw new Error(`workspace-code-search/search-failed: ${reason}`, { cause: error });
            }
        }
        /**
         * @param workspaceFileScope - Session workspace scope
         * @param request - query without root
         * @param signal - cancellation
         */
        async searchFiles(workspaceFileScope, request, signal) {
            signal.throwIfAborted();
            try {
                const root = requireWorkspaceRoot(workspaceFileScope);
                return await this.ctx.workspaceCodeSearch.searchFiles({
                    root,
                    query: request.query,
                    ...request.limitPerKind === undefined ? {} : { limitPerKind: request.limitPerKind },
                    signal,
                });
            }
            catch (error) {
                signal.throwIfAborted();
                const reason = error instanceof Error ? error.message : String(error);
                throw new Error(`workspace-code-search/search-files-failed: ${reason}`, { cause: error });
            }
        }
        /**
         * @param workspaceFileScope - Session workspace scope
         * @param request - query without root
         * @param signal - cancellation
         */
        async searchSymbols(workspaceFileScope, request, signal) {
            signal.throwIfAborted();
            try {
                const root = requireWorkspaceRoot(workspaceFileScope);
                return await this.ctx.workspaceCodeSearch.searchSymbols({
                    root,
                    query: request.query,
                    ...request.limitPerKind === undefined ? {} : { limitPerKind: request.limitPerKind },
                    signal,
                });
            }
            catch (error) {
                signal.throwIfAborted();
                const reason = error instanceof Error ? error.message : String(error);
                throw new Error(`workspace-code-search/search-symbols-failed: ${reason}`, { cause: error });
            }
        }
        /**
         * Stream content progress then a final result frame.
         * @param workspaceFileScope - Session workspace scope
         * @param request - query without root
         * @param signal - cancellation
         */
        searchContent(workspaceFileScope, request, signal) {
            signal.throwIfAborted();
            const root = requireWorkspaceRoot(workspaceFileScope);
            return this.ctx.workspaceCodeSearch.searchContentStream({
                root,
                query: request.query,
                ...request.limitPerKind === undefined ? {} : { limitPerKind: request.limitPerKind },
                signal,
            });
        }
    };
})();
/**
 * Typert Remote controller. Client must not pass AbsolutePath roots.
 */
export default WorkspaceCodeSearchController;
//# sourceMappingURL=index.js.map