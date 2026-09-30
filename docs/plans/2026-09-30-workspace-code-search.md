# 工作区代码搜索 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `dsh-plugin` 交付可外部安装的 dsh bundle：Web/Desktop 统一搜索弹窗（文件 / 符号 / 内容），点击结果在右侧 Sidebar 打开。

**Architecture:** 能力缝：Service Definition 聚合两个 Provider（codegraph 管文件+符号；content 管 grep）。Session 作用域 Typert Remote 不接受客户端 `root`。Client UI 负责弹窗、快捷键、取消三件套与 locale。Bundle patch 组装 Host+Client 行；不进入 `OPTIONAL_BUNDLES` / 默认 profile。

**Tech Stack:** TypeScript ESM、pnpm workspaces、Cordis 插件、`@deepseek-ai/schemastery` Config、`better-sqlite3`（只读打开 `.codegraph/codegraph.db`）、Host 侧 ripgrep（参考 harness `tool-fs-search` 的 argv 构造，不注册 model tool）、Typert Remote、Client slots/shortcuts/locale、vitest。

**规格:** [docs/specs/2026-09-29-workspace-code-search-design.md](../specs/2026-09-29-workspace-code-search-design.md)  
**参考（只读）:** `/Users/zhifengleng/workspace/deepseek-harness` — publish 教程、`voice-input-bundle`、`ui-sidebar-files`、`tool-fs-search`、`fileAddressFor`。

## Global Constraints

- 全部源码/文档/产物只写 `/Users/zhifengleng/workspace/dsh-plugin`；禁止改 `deepseek-harness`。
- 文档中文；标识符与 API 英文。
- npm 包名：`@dsh-plugin/workspace-code-search*`（见文件结构）；`peerDependencies` 对实际导入的每个 `@deepseek-ai/dsh-*` / `@deepseek-ai/cordis` 写窄范围（对齐本机已测 dsh 版本，禁用 `*`）。
- Remote 线传无 `root`；查询拒空/过长/NUL；路径相对 Session workspace root。
- 内容搜索永不依赖 codegraph；缺索引只降级文件/符号区。
- Client：debounce + AbortController 轮换 + `issuedSeq`/`renderedSeq`；`AbortError` 不进错误 UI。
- 不注册面向模型的 tool；不进 `OPTIONAL_BUNDLES`。
- 注册均为 `ctx.effect`；dispose 后快捷键/slot/Remote 消失。
- 聚焦包测；不默认全仓 suite。

## 执行模式

推荐 **subagent-driven-development**：每 Task 一个新 subagent，Task 间人工/主 agent 门控。也可本会话 **executing-plans** 批量执行。

---

## File Structure

```text
dsh-plugin/
  package.json                          # pnpm workspace root
  pnpm-workspace.yaml
  tsconfig.base.json
  vitest.config.ts
  packages/
    workspace-code-search/              # Service Definition + 编排实现
      package.json                      # @dsh-plugin/workspace-code-search
      src/types.ts                      # 纯类型：SearchKind, hits, SearchResult, provider 接口
      src/index.ts                      # default-export Service class
      src/config.ts                     # Config schema
      tests/*.spec.ts
    workspace-code-search-codegraph/    # Provider：files + symbols
      package.json                      # @dsh-plugin/workspace-code-search-codegraph
      src/index.ts                      # function plugin：register provider
      src/db.ts                         # 打开/探测 .codegraph/codegraph.db
      src/search.ts                     # 文件路径 + nodes 查询与排序
      tests/*.spec.ts
    workspace-code-search-content/      # Provider：content grep
      package.json                      # @dsh-plugin/workspace-code-search-content
      src/index.ts
      src/grep.ts                       # 工作区 root 内 rg；越界丢弃；二进制跳过
      tests/*.spec.ts
    api-workspace-code-search/          # Typert Remote（Session 作用域）
      package.json                      # @dsh-plugin/api-workspace-code-search
      src/index.ts                      # Host Remote 实现
      src/client.ts                     # Client 类型面（若 harness 模式要求）
      tests/*.spec.ts
    client-ui-workspace-code-search/    # 弹窗 UI + 快捷键 + 按钮
      package.json                      # @dsh-plugin/client-ui-workspace-code-search
      src/client/index.ts               # apply / inject
      src/client/SearchModal.tsx
      src/client/store.ts
      src/client/locales.ts             # zh/en 字典
      src/client/*.module.css
      tests/*.client.spec.tsx
    workspace-code-search-bundle/       # dsh.bundle + patch + locale/icon
      package.json                      # @dsh-plugin/workspace-code-search-bundle
      cordis.patch.yml
      icon.svg
      locale/zh.json
      locale/en.json
      README.md                         # 兼容矩阵 + 恢复说明 + VS Code 快捷键差异
  docs/plans/                           # 本计划
```

各包职责一句话：`types` 锁契约；`codegraph`/`content` 只注册 Provider；Service 并行两腿并合并 `SearchResult`；Remote 解析 Session cwd；Client 只谈 Remote；Bundle 只组装行。

---

### Task 1: 仓库脚手架 + 共享类型与 Config

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `vitest.config.ts`
- Create: `packages/workspace-code-search/package.json`
- Create: `packages/workspace-code-search/src/types.ts`
- Create: `packages/workspace-code-search/src/config.ts`
- Create: `packages/workspace-code-search/src/index.ts`（先空 Service 壳，Task 4 填满）
- Create: `packages/workspace-code-search/tests/types.spec.ts`
- Modify: `README.md`（链到本计划）
- Modify: `docs/specs/2026-09-29-workspace-code-search-design.md`（状态改为「实现中」，链到本计划）

**Interfaces:**
- Consumes: 无
- Produces:
  - `SearchKind = 'file' | 'content' | 'symbol'`
  - `FileHit`, `SymbolHit`, `ContentHit`, `SearchResult`
  - `WorkspaceCodeSearchProvider`（`id`, `status?`, `searchFiles?`, `searchSymbols?`, `searchContent?`）
  - `Config`: `{ maxQueryCodeUnits, limitPerKind, debounceMs, searchTimeoutMs }`
  - Service 名：`workspaceCodeSearch`（`ctx.workspaceCodeSearch`）

- [ ] **Step 1: 写失败测试（类型契约与 Config 校验）**

```ts
// packages/workspace-code-search/tests/config.spec.ts
import { describe, it, expect } from 'vitest'
import { Config } from '../src/config.ts'

describe('Config', () => {
  it('rejects non-positive limitPerKind', () => {
    expect(() => Config({ limitPerKind: 0 })).toThrow()
  })
  it('applies defaults for omitted fields', () => {
    const c = Config({})
    expect(c.maxQueryCodeUnits).toBe(500)
    expect(c.limitPerKind).toBe(50)
    expect(c.debounceMs).toBe(250)
    expect(c.searchTimeoutMs).toBe(10_000)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd /Users/zhifengleng/workspace/dsh-plugin && pnpm exec vitest run packages/workspace-code-search/tests/config.spec.ts`  
Expected: FAIL（模块/包尚不存在）

- [ ] **Step 3: 脚手架 + 最小实现**

根 `package.json`：

```json
{
  "name": "dsh-plugin",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10",
  "engines": { "node": "^22.19 || >=24" },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc -b",
    "build": "pnpm -r run build"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "vitest": "^3.2.0",
    "@types/node": "^22.0.0"
  }
}
```

`packages/workspace-code-search/src/types.ts`（完整契约）：

```ts
export type SearchKind = 'file' | 'content' | 'symbol'

export type AbsolutePath = string & { readonly __brand: 'AbsolutePath' }

export interface FileHit {
  readonly path: string
  readonly score?: number
}

export interface SymbolHit {
  readonly path: string
  readonly name: string
  readonly kind: string
  readonly line?: number
  readonly score?: number
}

export interface ContentHit {
  readonly path: string
  readonly line: number
  readonly preview: string
}

export interface SearchResult {
  readonly files: readonly FileHit[]
  readonly symbols: readonly SymbolHit[]
  readonly content: readonly ContentHit[]
  readonly truncated: boolean
  readonly errors?: Partial<Record<'file' | 'symbol' | 'content' | 'codegraph', string>>
}

export interface CodegraphStatus {
  readonly codegraph: 'ready' | 'missing' | 'error'
  readonly message?: string
}

export interface ProviderSearchRequest {
  readonly root: AbsolutePath
  readonly query: string
  readonly limit: number
  readonly signal: AbortSignal
}

/** Provider 按能力实现子集；注册进 Service。 */
export interface WorkspaceCodeSearchProvider {
  readonly id: string
  status?(root: AbsolutePath): CodegraphStatus | Promise<CodegraphStatus>
  searchFiles?(request: ProviderSearchRequest): Promise<{ hits: FileHit[]; truncated: boolean }>
  searchSymbols?(request: ProviderSearchRequest): Promise<{ hits: SymbolHit[]; truncated: boolean }>
  searchContent?(request: ProviderSearchRequest): Promise<{ hits: ContentHit[]; truncated: boolean; error?: string }>
}

export interface WorkspaceCodeSearch {
  register(provider: WorkspaceCodeSearchProvider): () => void
  status(root: AbsolutePath): Promise<CodegraphStatus>
  search(request: {
    root: AbsolutePath
    query: string
    kinds: readonly SearchKind[]
    limitPerKind?: number
    signal: AbortSignal
  }): Promise<SearchResult>
}
```

`packages/workspace-code-search/src/config.ts`：

```ts
import z from '@deepseek-ai/schemastery'

export const Config = z.object({
  maxQueryCodeUnits: z.natural().min(1).max(10_000).default(500),
  limitPerKind: z.natural().min(1).max(500).default(50),
  debounceMs: z.natural().min(0).max(5_000).default(250),
  searchTimeoutMs: z.natural().min(100).max(120_000).default(10_000),
})
export type Config = z.infer<typeof Config>
```

`peerDependencies` / `devDependencies` 列入本机 `pnpm list` 测得的 `@deepseek-ai/cordis`、`@deepseek-ai/schemastery` 精确窄范围（实现时从已安装 dsh 读版本写入，禁止 `*`）。

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm install && pnpm exec vitest run packages/workspace-code-search/tests/config.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json vitest.config.ts \
  packages/workspace-code-search README.md docs/specs/2026-09-29-workspace-code-search-design.md
git commit -m "$(cat <<'EOF'
chore: scaffold workspace-code-search types and Config

EOF
)"
```

---

### Task 2: Codegraph Provider（文件 + 符号）

**Files:**
- Create: `packages/workspace-code-search-codegraph/**`
- Test: `packages/workspace-code-search-codegraph/tests/search.spec.ts`

**Interfaces:**
- Consumes: `WorkspaceCodeSearchProvider`, `register` from Task 1 Service（本 Task 先单测 db/search 纯函数；Task 4 再接线）
- Produces:
  - `openCodegraph(root): { status, db? }` — 找 `root/.codegraph/codegraph.db`
  - `searchFiles` / `searchSymbols`：路径相对 root；越界丢弃；前缀/路径分量优先排序
  - `status`: 无库→`missing`；打不开/坏 schema→`error`；能打开→`ready`（v1 不做 stale）

- [ ] **Step 1: 写失败测试（fixture 目录）**

在 `tests/fixtures/` 造三套目录：`ready/`（最小 sqlite 含 `files`/`nodes`）、`missing/`（无 `.codegraph`）、`corrupt/`（坏文件）。

```ts
import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import { AbsolutePath, openCodegraph, searchFiles, searchSymbols } from '../src/db.ts'

const ready = resolve(import.meta.dirname, 'fixtures/ready') as AbsolutePath

describe('codegraph provider', () => {
  it('reports missing when .codegraph absent', () => {
    const root = resolve(import.meta.dirname, 'fixtures/missing') as AbsolutePath
    expect(openCodegraph(root).status.codegraph).toBe('missing')
  })
  it('finds file path by substring with prefix preferred', async () => {
    const { db } = openCodegraph(ready)
    const { hits } = await searchFiles(db!, {
      root: ready, query: 'foo', limit: 10, signal: AbortSignal.timeout(5000),
    })
    expect(hits[0]?.path).toMatch(/foo/)
  })
  it('finds symbol by name', async () => {
    const { db } = openCodegraph(ready)
    const { hits } = await searchSymbols(db!, {
      root: ready, query: 'Bar', limit: 10, signal: AbortSignal.timeout(5000),
    })
    expect(hits.some(h => h.name.includes('Bar'))).toBe(true)
  })
})
```

Fixture 生成脚本（测试 setup）：用 `better-sqlite3` 创建表（列对齐 codegraph：`files.path`、`nodes.name/kind/file_path/start_line`），插入 `src/foo.ts` 与 symbol `Bar`。

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm exec vitest run packages/workspace-code-search-codegraph/tests/search.spec.ts`  
Expected: FAIL

- [ ] **Step 3: 实现 db + search**

要点：
- 只读打开：`new Database(path, { readonly: true, fileMustExist: true })`
- 文件查询：`SELECT path FROM files WHERE path LIKE '%' || ? || '%' LIMIT ?`，再在 JS 侧按「路径分量匹配 / 前缀」打分排序
- 符号：`SELECT name, kind, file_path, start_line FROM nodes WHERE lower(name) LIKE lower(?) LIMIT ?`（或 `nodes_fts MATCH` 若 query 适合 FTS）
- 结果 `path` 必须相对 root；若库内存绝对路径则 strip root 前缀；`path` 含 `..` 或越出 root → 丢弃
- `signal.throwIfAborted()` 在查询前后检查

`src/index.ts` function plugin：

```ts
export const name = 'workspace-code-search-codegraph'
export const inject = ['workspaceCodeSearch']
export function apply(ctx) {
  ctx.effect(() => ctx.workspaceCodeSearch.register({
    id: 'codegraph',
    status(root) { return openCodegraph(root).status },
    async searchFiles(req) { /* open + searchFiles */ },
    async searchSymbols(req) { /* open + searchSymbols */ },
  }), 'workspace-code-search-codegraph: register')
}
```

- [ ] **Step 4: 跑测试确认通过**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/workspace-code-search-codegraph
git commit -m "$(cat <<'EOF'
feat: add codegraph provider for file and symbol search

EOF
)"
```

---

### Task 3: Content Provider（workspace grep）

**Files:**
- Create: `packages/workspace-code-search-content/**`
- Test: `packages/workspace-code-search-content/tests/grep.spec.ts`

**Interfaces:**
- Consumes: `WorkspaceCodeSearchProvider`
- Produces: `searchContent` → `ContentHit[]`；失败时 `{ hits: [], truncated: false, error: string }`；不依赖 codegraph

- [ ] **Step 1: 写失败测试**

```ts
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { runWorkspaceGrep } from '../src/grep.ts'

describe('content grep', () => {
  it('returns path:line:preview for a text hit', async () => {
    const root = await mkdtemp(join(tmpdir(), 'wcs-'))
    await writeFile(join(root, 'a.txt'), 'hello uniqueToken world\n')
    const { hits } = await runWorkspaceGrep({
      root: root as never, query: 'uniqueToken', limit: 10, signal: AbortSignal.timeout(5000),
    })
    expect(hits).toEqual([{ path: 'a.txt', line: 1, preview: expect.stringContaining('uniqueToken') }])
  })
  it('skips binary-ish NUL lines', async () => {
    const root = await mkdtemp(join(tmpdir(), 'wcs-'))
    await writeFile(join(root, 'b.bin'), Buffer.from([0x68, 0x00, 0x69]))
    const { hits } = await runWorkspaceGrep({
      root: root as never, query: 'h', limit: 10, signal: AbortSignal.timeout(5000),
    })
    expect(hits.every(h => !h.preview.includes('\0'))).toBe(true)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Expected: FAIL

- [ ] **Step 3: 实现 grep 适配**

实现策略（写进 README Known Limitations）：
- 使用系统 `rg`（`RG_PATH` 或 `PATH`）；argv 参考 harness `packages/fs/tool-fs-search/src/grep.ts` 的固定 flags（`--no-config`、行号、路径相对 cwd），**cwd = Session root**，禁止 follow symlink 环（`--follow` 不开启）。
- VCS 排除跟随所用 rg 默认 / 与参考实现一致的 glob 排除；本包不第二套 ignore 引擎。
- 解析每行 `path:line:text`；`preview` 截断到合理长度；含 `\0` 的行跳过。
- `limit` 截断 → `truncated: true`。
- abort：传 `signal` 给 `spawn`；abort 时 kill 子进程，调用方视为取消（Service 层不把 Abort 写入 `errors`）。

```ts
export const name = 'workspace-code-search-content'
export const inject = ['workspaceCodeSearch']
export function apply(ctx) {
  ctx.effect(() => ctx.workspaceCodeSearch.register({
    id: 'content',
    async searchContent(req) {
      try {
        return await runWorkspaceGrep(req)
      } catch (error) {
        if (req.signal.aborted) throw error
        return { hits: [], truncated: false, error: String(error) }
      }
    },
  }), 'workspace-code-search-content: register')
}
```

- [ ] **Step 4: 跑测试确认通过**

Expected: PASS（无 `rg` 的环境：测试 `skip` 并在 README 注明）

- [ ] **Step 5: Commit**

```bash
git add packages/workspace-code-search-content
git commit -m "$(cat <<'EOF'
feat: add workspace grep content provider

EOF
)"
```

---

### Task 4: Service 编排（并行两腿、kinds、errors、limit）

**Files:**
- Modify: `packages/workspace-code-search/src/index.ts`
- Create: `packages/workspace-code-search/tests/service.spec.ts`

**Interfaces:**
- Consumes: providers from Tasks 2–3 via `register`
- Produces: 完整 `WorkspaceCodeSearch.status` / `search` 行为（规格 §Service）

- [ ] **Step 1: 写失败测试**

```ts
describe('WorkspaceCodeSearchService', () => {
  it('returns content when codegraph missing and kinds include all', async () => {
    // 挂 mock providers：codegraph status missing；content 返回 1 hit
    const result = await service.search({
      root, query: 'x', kinds: ['file', 'symbol', 'content'], signal: AbortSignal.timeout(1000),
    })
    expect(result.files).toEqual([])
    expect(result.symbols).toEqual([])
    expect(result.content).toHaveLength(1)
    expect(result.errors?.content).toBeUndefined()
  })
  it('isolates content failure from files', async () => {
    // content provider returns error string；file provider returns hits
    expect(result.files.length).toBeGreaterThan(0)
    expect(result.errors?.content).toBeTruthy()
  })
  it('clamps limitPerKind to Config', async () => {
    // Config.limitPerKind=2；请求 99；assert provider 收到 limit===2
  })
  it('rejects empty / NUL / overlong query', async () => {
    await expect(service.search({ root, query: '  ', kinds: ['content'], signal })).rejects.toThrow()
    await expect(service.search({ root, query: 'a\0b', kinds: ['content'], signal })).rejects.toThrow()
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Expected: FAIL

- [ ] **Step 3: 实现 Service class**

```ts
export default class WorkspaceCodeSearchService extends Service implements WorkspaceCodeSearch {
  static inject = [] // Config via plugin config
  static Config = Config
  private readonly providers = new Map<string, WorkspaceCodeSearchProvider>()
  constructor(ctx: Context, private readonly config: Config) {
    super(ctx, 'workspaceCodeSearch')
  }
  register(provider: WorkspaceCodeSearchProvider): () => void {
    return this.ctx.effect(() => {
      if (this.providers.has(provider.id)) throw new Error(`duplicate provider ${provider.id}`)
      this.providers.set(provider.id, provider)
      return () => { this.providers.delete(provider.id) }
    }, `workspaceCodeSearch.register(${provider.id})`) as unknown as () => void
  }
  // status: 找任一实现 status 的 provider；都没有 → missing
  // search:
  //  1. normalizeQuery（trim、拒空、拒 NUL、拒 length>maxQueryCodeUnits）
  //  2. limit = clamp(request.limitPerKind ?? config.limitPerKind, 1, config.limitPerKind)
  //  3. 按 kinds 启动 Promise.all 腿；每腿包 timeout（AbortSignal.any([signal, AbortSignal.timeout(config.searchTimeoutMs)])）
  //  4. codegraph !== ready 且 kinds 含 file/symbol → 两区空数组，不调 searchFiles/Symbols
  //  5. 合并 truncated / errors（codegraph 腿抛错 → errors.codegraph）
}
```

并行：`file`+`symbol` 可同用 codegraph provider 的两个方法；与 `content` 并行。同一 `signal`。

- [ ] **Step 4: 跑测试确认通过**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/workspace-code-search
git commit -m "$(cat <<'EOF'
feat: orchestrate parallel search providers in workspaceCodeSearch

EOF
)"
```

---

### Task 5: Typert Remote（Session 作用域，无 root）

**Files:**
- Create: `packages/api-workspace-code-search/**`
- Test: `packages/api-workspace-code-search/tests/remote.spec.ts`

**Interfaces:**
- Consumes: `ctx.workspaceCodeSearch`；Session cwd（实现时对照 harness Session / workspace Remote 如何取 cwd——只读参考 `session-controller` / 现有 session-scoped remotes）
- Produces:
  - Remote `status(): CodegraphStatus`
  - Remote `search({ query, kinds, limitPerKind?, signal }): SearchResult`
  - 无活动 Session / 无 cwd → 抛明确错误（Client 在打开前 no-op，不调用）

- [ ] **Step 1: 写失败测试**

```ts
it('does not accept root in the public request type', () => {
  // 编译期：SearchRemoteRequest 无 root 字段（用 expectTypeOf 或简单对象赋值断言）
})
it('resolves root from session cwd and forwards to service', async () => {
  // mock session cwd=/tmp/ws；assert service.search 收到该 root
})
it('rejects empty query before calling service', async () => { ... })
```

- [ ] **Step 2: 跑测试确认失败**

Expected: FAIL

- [ ] **Step 3: 实现 Remote 插件**

实现时打开 harness 中一个最小 Session 作用域 Remote 包（例如 workspace files Remote）对照 `@Remote` / face 生成方式；本仓复制**同等模式**，包名换成本包。关键代码形状：

```ts
// Host：从当前 Session 取 cwd，as AbsolutePath，再调 ctx.workspaceCodeSearch
async search(request: { query: string; kinds: readonly SearchKind[]; limitPerKind?: number }, signal: AbortSignal) {
  const root = requireSessionRoot(this.ctx) // 无则 throw
  return this.ctx.workspaceCodeSearch.search({ root, ...request, signal })
}
```

Client 导出类型供 UI `ctx.remote.workspaceCodeSearch`（确切 remote 命名空间在实现时与 Typert 生成约定对齐，写入本包 README）。

- [ ] **Step 4: 跑测试确认通过**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/api-workspace-code-search
git commit -m "$(cat <<'EOF'
feat: add session-scoped workspace code search Remote

EOF
)"
```

---

### Task 6: Client UI（弹窗、快捷键、取消三件套）

**Files:**
- Create: `packages/client-ui-workspace-code-search/**`
- Test: `packages/client-ui-workspace-code-search/tests/*.client.spec.tsx`

**Interfaces:**
- Consumes: `remote.workspaceCodeSearch`（Task 5）、`shortcuts`、`sidebarRight`、`locale`、`slots`；`fileAddressFor` from `@deepseek-ai/dsh-workspace-path`（peer）
- Produces: 规格 §UI 全部行为

- [ ] **Step 1: 写失败测试（核心行为）**

用 jsdom + 直接喂 props（对照 `ui-sidebar-files` 测试风格）：

```ts
// @vitest-environment jsdom
it('does not call remote.search for whitespace query', async () => {
  const search = vi.fn()
  renderModal({ search, status: async () => ({ codegraph: 'missing' }) })
  await userEvent.type(screen.getByRole('textbox'), '   ')
  await wait(debounceMs + 20)
  expect(search).not.toHaveBeenCalled()
})
it('ignores stale responses via seq guard', async () => {
  let resolveFirst!: (v: SearchResult) => void
  const search = vi.fn()
    .mockImplementationOnce(() => new Promise(r => { resolveFirst = r }))
    .mockResolvedValueOnce(emptyResultWithContent('second'))
  // type "a" then "ab"；resolve first after second
  resolveFirst!(emptyResultWithContent('first'))
  await flush()
  expect(screen.queryByText('first')).toBeNull()
  expect(screen.getByText('second')).toBeTruthy()
})
it('opens resource with line and closes modal', async () => {
  const openResource = vi.fn()
  // click content hit → openResource(address, { params: { line: N } })；modal closed
})
```

- [ ] **Step 2: 跑测试确认失败**

Expected: FAIL

- [ ] **Step 3: 实现 Client 插件**

要点清单（实现必须覆盖）：
- 快捷键 id：`workspace.codeSearch`；defaults：`Cmd/Ctrl+Shift+F`（`KeyF` + `primary` + `shift`）；无 Session → `blocked` / no-op（与 files 快捷键同模式）
- 打开时 `status()` 一次；横幅 missing/error；`errors.codegraph` 刷新横幅
- Config：`debounceMs` 从插件 Config 来（Client 包可镜像 Host 默认或读 remote 旁路——v1 Client 包自带相同 Config 字段，与 Host 对齐默认值）
- 取消三件套：见规格
- kinds 全关：不发 search
- Session/cwd 变更：关窗 + abort（订阅 sessions/workspace 的现有 client 钩子）
- preview/路径：React 文本节点
- locale：`workspaceCodeSearch` NS，中英字典含「输入以搜索」「运行 codegraph init」「索引可能过期」等
- 按钮：向 files 工具条 slot 注册（实现时在 harness 只读查找 files toolbar slot 名；若无稳定 slot，v1 仅快捷键 + files guide 旁 slot，并在 README 记录）

`SearchModal` 分区渲染：`files` / `symbols` / `content`；键盘 ↑↓ Enter Esc。

- [ ] **Step 4: 跑测试确认通过**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/client-ui-workspace-code-search
git commit -m "$(cat <<'EOF'
feat: add workspace code search modal and shortcut

EOF
)"
```

---

### Task 7: Bundle patch + 安装冒烟 + README 兼容矩阵

**Files:**
- Create: `packages/workspace-code-search-bundle/package.json`
- Create: `packages/workspace-code-search-bundle/cordis.patch.yml`
- Create: `packages/workspace-code-search-bundle/README.md`
- Create: `packages/workspace-code-search-bundle/icon.svg`
- Create: `packages/workspace-code-search-bundle/tests/patch.spec.ts`（解析 YAML，断言 insert id 列表）

**Interfaces:**
- Consumes: 全部包名
- Produces: 用户可 `dsh plugin --profile <name> add ./packages/workspace-code-search-bundle`（或 workspace 协议）装入 profile

- [ ] **Step 1: 写失败测试**

```ts
import { readFileSync } from 'node:fs'
import yaml from 'js-yaml'
it('inserts host and client plugin rows', () => {
  const doc = yaml.load(readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8'))
  const ids = /* flatten insert ids */
  expect(ids).toEqual(expect.arrayContaining([
    'workspace-code-search',
    'workspace-code-search-codegraph',
    'workspace-code-search-content',
    'api-workspace-code-search',
    'client-ui-workspace-code-search',
  ]))
})
```

- [ ] **Step 2: 跑测试确认失败**

Expected: FAIL

- [ ] **Step 3: 实现 bundle**

`cordis.patch.yml`（形状对照 `voice-input-bundle`）：

```yaml
- insert:
    - id: workspace-code-search
      name: '@dsh-plugin/workspace-code-search'
      config:
        maxQueryCodeUnits: 500
        limitPerKind: 50
        debounceMs: 250
        searchTimeoutMs: 10000
    - id: workspace-code-search-codegraph
      name: '@dsh-plugin/workspace-code-search-codegraph'
    - id: workspace-code-search-content
      name: '@dsh-plugin/workspace-code-search-content'
    - id: api-workspace-code-search
      name: '@dsh-plugin/api-workspace-code-search'
    - id: client-ui-workspace-code-search
      name: '@dsh-plugin/client-ui-workspace-code-search'
```

`package.json`：`dsh.bundle.patch`、`dependencies` 列出五个包、`peerDependencies` 含 `@deepseek-ai/cordis` 窄范围。

README（中文）必须含：
- 兼容 dsh 版本区间（填写实现时实测版本）
- 安装：`dsh plugin --profile <name> add <spec>`
- 恢复：Plugins 关闭 / `dsh plugin remove`
- 与 VS Code `Cmd/Ctrl+Shift+F` 差异
- 索引过期风险；`codegraph init` 提示
- 明确不把 `allow-version` 当常规路径

手动冒烟（写入 Task 完成标准，不自动化全 GUI）：

```bash
# 在已安装 dsh 的环境
dsh plugin --profile wcs-demo add /Users/zhifengleng/workspace/dsh-plugin/packages/workspace-code-search-bundle
dsh --profile wcs-demo web   # 或 desktop
# 验证：快捷键打开弹窗；无 codegraph 时内容可搜；有索引时文件/符号有命中
```

- [ ] **Step 4: 跑测试确认通过**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/workspace-code-search-bundle docs/plans README.md
git commit -m "$(cat <<'EOF'
feat: ship workspace-code-search external bundle

EOF
)"
```

---

### Task 8: 规格覆盖自检（计划执行末）

**Files:** 无新代码；核对清单

- [x] **Step 1: 对照规格逐条打勾**

| 规格项 | Task | 结果 |
|--------|------|------|
| 文件/符号 codegraph + 内容 grep | 2, 3 | 通过包测 |
| 缺索引不挡内容 | 4 | Service 编排测 |
| Remote 无 root / Session cwd | 5 | Remote 测 |
| 取消三件套 + 纯文本 preview | 6 | Client 测 + 文本节点渲染 |
| 快捷键 + 弹窗 + locale | 6 | 已实现；locale zh/en |
| 外部 bundle / 非 OPTIONAL_BUNDLES | 7 | patch + README |
| peer 窄范围 + README 矩阵 | 1, 7 | cordis ~4.0.4 |
| 分区 errors / limitPerKind / abort | 4, 6 | 已实现 |
| 测试层（Providers/Service/Remote/Client/Bundle） | 2–7 | `vitest run` 20 passed |
| files 工具条 slot 降级 | 6, 7 | README Known Limitations |

- [x] **Step 2: 若有缺口，开修补 commit（禁止留下 TBD）** — Session/cwd 关窗尽力接线；其余限制写入 bundle README。

- [x] **Step 3: 更新设计状态为「已实现（见 bundle README）」**

实现偏离计划原文：codegraph 库用 `node:sqlite`（非 better-sqlite3），避免 native 构建阻塞。
---

## 计划自检（作者已跑）

1. **Spec coverage:** 上表覆盖目标/非目标/API/UI/错误表/兼容策略/测试层；按钮若 files toolbar slot 不存在，Task 6 规定降级并写 README——不静默丢需求。
2. **Placeholder scan:** 无 TBD/TODO；「对照 harness 某包」均给出包路径与要复制的行为。
3. **Type consistency:** `SearchKind` / `SearchResult` / `limitPerKind?` / `errors` 键与规格一致；Remote 无 `root`。

## 风险与实现时决策点

- **Client Remote 命名空间 / Typert 生成流程**以 harness 同构 api 包为准；Task 5 开头先只读复制最小样板再改名。
- **files 工具条 slot** 若不稳定：v1 快捷键必达，按钮尽力；记入 bundle README Known Limitations。
- **无 rg：** content 测试 skip；运行时 `errors.content` 提示。
- **better-sqlite3：** 实现改用 Node 内置 `node:sqlite`；README 写明 Node engines。
