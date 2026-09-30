# 分腿进度与流式结果 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Client 并行调用文件/符号/内容三腿 Remote，分腿先出结果；内容腿流式 progress + 软 ETA；改词立即 abort。

**Architecture:** 从 `orchestrateSearch` 抽出单腿函数供 Service/Remote 复用；整包 `search` 仍 `Promise.all`。内容 rg 增量解析 `--json` 并 `yield` progress/result 帧。UI 的 `SearchRequestController` 按开关并行三腿，页脚展示分腿状态与软 ETA。

**Tech Stack:** TypeScript ESM、Vitest、Typert `@Remote` / `@Remote({ mode: 'stream' })`、zod/v4/mini、React Testing Library、ripgrep `--json`。

**规格:** [docs/specs/2026-09-30-search-progress-streaming-design.md](../specs/2026-09-30-search-progress-streaming-design.md)

## Global Constraints

- 产物只写 `/Users/zhifengleng/workspace/github/cmd-shift-l`；禁止改 `deepseek-harness`。
- 文档中文；标识符与 API 英文。
- 整包 `search` 语义不变（Agent/工具路径）。
- Remote 线传无 `root`；取消走 `AbortSignal` / stream `dispose`。
- Client 文案走 `locales` zh/en；`verify` 式硬编码禁止。
- Client failsafe：`searchTimeoutMs + 5_000`。
- 内容 `progress` 节流 ≥150ms；`progress` 帧不含 hits。
- 聚焦包测：`pnpm test` / 指定 spec；改完跑 `pnpm build` 更新 `lib/`（本仓库提交预构建）。

## 执行模式

推荐 **subagent-driven-development**。也可本会话 **executing-plans**。

---

## File Structure

```text
src/service/types.ts              # + ContentSearchFrame, LegResult*, Service 单腿方法
src/service/orchestrate.ts        # 抽出 runFileLeg / runSymbolLeg / runContentLeg；search 复用
src/service/index.ts              # 暴露 searchFiles / searchSymbols / searchContentStream
src/content/grep.ts               # 增量 JSON + onProgress；可 async iterate
src/content/register.ts           # 若 provider 需流式，转发；否则 Service 直接调 grep
src/api/schemas.ts                # 单腿 request/result + content frame codec
src/api/types.ts                  # Remote 单腿请求类型
src/api/index.ts                  # + searchFiles / searchSymbols / searchContent(stream)
src/api/remote.ts + typert.host.ts
src/api/client.ts                 # Client Remote 面
src/client/index.ts               # adaptRemote 接三腿 + stream
src/client/search-controller.ts   # 并行腿 + seq + failsafe
src/client/eta.ts                 # 软 ETA（纯函数）
src/client/SearchModal.tsx        # 分腿 UI / 页脚 / 无结果时机
src/client/locales.ts             # 进度文案键
src/client/store.ts               # partial 状态辅助（若需要）
tests/grep.spec.ts
tests/service.spec.ts / orchestrate 相关
tests/schemas.spec.ts
tests/search-modal.client.spec.tsx
tests/eta.spec.ts                 # 新建
docs/specs/…                      # 已有；README 一句进度说明（可选）
```

---

### Task 1: 类型 + 单腿编排抽出

**Files:**
- Modify: `src/service/types.ts`
- Modify: `src/service/orchestrate.ts`
- Modify: `src/service/index.ts`
- Test: `tests/service.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export type ContentSearchFrame =
    | { readonly type: 'progress'; readonly matched: number; readonly pathHint?: string; readonly filesScanned?: number }
    | { readonly type: 'result'; readonly hits: readonly ContentHit[]; readonly truncated: boolean; readonly error?: string }

  export interface FileLegResult {
    readonly hits: readonly FileHit[]
    readonly truncated: boolean
    readonly error?: string
  }
  export interface SymbolLegResult {
    readonly hits: readonly SymbolHit[]
    readonly truncated: boolean
    readonly error?: string
  }

  // orchestrate.ts
  export function runFileLeg(...): Promise<FileLegResult>
  export function runSymbolLeg(...): Promise<SymbolLegResult>
  export function runContentLeg(...): Promise<{ hits: ContentHit[]; truncated: boolean; error?: string }>
  // WorkspaceCodeSearch += searchFiles / searchSymbols / searchContent (Promise 包装 runContentLeg，流式在 Task 2–3)
  ```
- Consumes: 现有 `WorkspaceCodeSearchProvider`、`Config`、`withTimeout`/`leg` 模式

- [ ] **Step 1: Write the failing test**

在 `tests/service.spec.ts` 增加：

```ts
it('runSymbolLeg returns hits without waiting for content providers', async () => {
  let contentStarted = false
  const providers: WorkspaceCodeSearchProvider[] = [
    {
      id: 'codegraph',
      status: () => ({ codegraph: 'ready' }),
      searchFiles: async () => ({ hits: [], truncated: false }),
      searchSymbols: async () => ({
        hits: [{ path: 'a.ts', name: 'Foo', kind: 'class' }],
        truncated: false,
      }),
    },
    {
      id: 'content',
      searchContent: async () => {
        contentStarted = true
        await new Promise(() => {}) // never resolves
        return { hits: [], truncated: false }
      },
    },
  ]
  const symbols = await runSymbolLeg(providers, Config({}), {
    root,
    query: 'Foo',
    limit: 50,
    signal: AbortSignal.timeout(1000),
  })
  expect(symbols.hits).toEqual([{ path: 'a.ts', name: 'Foo', kind: 'class' }])
  expect(contentStarted).toBe(false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/service.spec.ts -t 'runSymbolLeg'`  
Expected: FAIL（`runSymbolLeg` 未导出）

- [ ] **Step 3: Write minimal implementation**

1. 在 `types.ts` 增加 `FileLegResult` / `SymbolLegResult` / `ContentSearchFrame`（frame 可先定义，本 Task 内容腿仍返回 Promise 结果）。
2. 把 `orchestrateSearch` 内文件/符号/内容逻辑拆成 `runFileLeg` / `runSymbolLeg` / `runContentLeg`（保留现有 missing-index / merge / timeout 行为）。
3. `orchestrateSearch` 改为 `Promise.all` 调用三函数后组装 `SearchResult`。
4. `WorkspaceCodeSearch` + Service 增加：

```ts
searchFiles(request: { root; query; limitPerKind?; signal }): Promise<FileLegResult>
searchSymbols(...): Promise<SymbolLegResult>
searchContent(...): Promise<{ hits; truncated; error? }>
```

内部调用对应 `run*Leg` + `normalizeQuery` / `clampLimitPerKind`。

- [ ] **Step 4: Run tests**

Run: `pnpm test -- tests/service.spec.ts`  
Expected: PASS（含原有 orchestrate 回归）

- [ ] **Step 5: Commit**

```bash
git add src/service/types.ts src/service/orchestrate.ts src/service/index.ts tests/service.spec.ts
git commit -m "$(cat <<'EOF'
refactor: extract per-leg search orchestration

EOF
)"
```

---

### Task 2: rg 增量解析 + progress 回调

**Files:**
- Modify: `src/content/grep.ts`
- Test: `tests/grep.spec.ts`

**Interfaces:**
- Consumes: `ProviderSearchRequest`、`resolveRgBinary`
- Produces:
  ```ts
  export type GrepProgress = {
    readonly matched: number
    readonly pathHint?: string
    readonly filesScanned?: number
  }

  export async function runWorkspaceGrep(
    request: ProviderSearchRequest,
    options?: {
      readonly onProgress?: (progress: GrepProgress) => void
      readonly progressIntervalMs?: number // default 200
    },
  ): Promise<{ hits: ContentHit[]; truncated: boolean; error?: string }>
  ```

- [ ] **Step 1: Write the failing test**

在 `tests/grep.spec.ts` 用临时目录写若干文件，或 mock `spawn`：断言 `onProgress` 在 resolve 前至少被调用一次且 `matched` 递增；`signal.abort()` 后 Promise reject/`AbortError`。

若现有测试已用真实 rg，优先真实 fixture：

```ts
it('emits onProgress before completing', async () => {
  const progress: GrepProgress[] = []
  const result = await runWorkspaceGrep(request, {
    onProgress: (p) => { progress.push(p) },
    progressIntervalMs: 1,
  })
  expect(result.hits.length).toBeGreaterThan(0)
  expect(progress.length).toBeGreaterThan(0)
  expect(progress.at(-1)!.matched).toBeGreaterThan(0)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/grep.spec.ts -t 'onProgress'`  
Expected: FAIL（无 `onProgress` 或从不回调）

- [ ] **Step 3: Write minimal implementation**

- `stdout` 按行缓冲，逐行 `JSON.parse`；`type === 'match'` 时 push hit、更新 `matched`/`pathHint`。
- `type === 'begin'` 且带 path 时可选递增 `filesScanned`。
- 节流：距上次 `onProgress` ≥ `progressIntervalMs` 才回调；结束前再 flush 一次。
- 达到 `limit+1` 后 `child.kill()`，`truncated=true`。
- 保留 abort → kill 行为。

- [ ] **Step 4: Run tests**

Run: `pnpm test -- tests/grep.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/content/grep.ts tests/grep.spec.ts
git commit -m "$(cat <<'EOF'
feat: stream ripgrep JSON with throttled progress

EOF
)"
```

---

### Task 3: Service 内容流 + Remote 三腿（含 stream）

**Files:**
- Modify: `src/service/index.ts`, `src/service/types.ts`, `src/service/orchestrate.ts`（若需 `iterateContentLeg`）
- Modify: `src/api/schemas.ts`, `src/api/types.ts`, `src/api/index.ts`, `src/api/remote.ts`, `src/api/typert.host.ts`, `src/api/client.ts`
- Test: `tests/schemas.spec.ts`, `tests/remote.spec.ts`（类型/schema）；可选轻量 Host 单测若易搭

**Interfaces:**
- Produces:
  ```ts
  // Service
  searchContentStream(request: {
    root: AbsolutePath
    query: string
    limitPerKind?: number
    signal: AbortSignal
  }): AsyncGenerator<ContentSearchFrame, void, void>

  // Remote (Host)
  @Remote searchFiles(scope, request: { query; limitPerKind? }, signal): Promise<FileLegResult>
  @Remote searchSymbols(...): Promise<SymbolLegResult>
  @Remote({ mode: 'stream' }) searchContent(scope, request, signal): RemoteStream<ContentSearchFrame>
  // 保留 @Remote search(...)

  // schemas: legRequestSchema (query + optional limit), fileLegResultSchema, symbolLegResultSchema, contentFrameSchema
  ```

- [ ] **Step 1: Write the failing schema/type tests**

```ts
it('contentFrameSchema accepts progress and result', () => {
  const parse = contentFrameSchema().parse
  expect(parse({ type: 'progress', matched: 2, pathHint: 'a.ts' })).toMatchObject({ type: 'progress' })
  expect(parse({ type: 'result', hits: [], truncated: false })).toMatchObject({ type: 'result' })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/schemas.spec.ts -t 'contentFrameSchema'`  
Expected: FAIL

- [ ] **Step 3: Implement schemas + Service stream + Remote methods**

`searchContentStream` 伪码：

```ts
async *searchContentStream(request) {
  const query = normalizeQuery(...)
  const limit = clampLimitPerKind(...)
  let lastEmit = 0
  const pending: ContentSearchFrame[] = []
  // 用 Promise + queue 或直接在 onProgress 无法 yield：改为内部 async queue
  // 推荐：grep 改为 async function* 或回调写入 AsyncQueue
  for await (const frame of iterateWorkspaceGrep(...)) {
    yield frame
  }
}
```

若 Task 2 的回调 API 不便 `yield`，在 `grep.ts` 增加：

```ts
export async function* iterateWorkspaceGrep(
  request: ProviderSearchRequest,
  options?: { progressIntervalMs?: number },
): AsyncGenerator<ContentSearchFrame>
```

（progress 帧 + 最终 result 帧；`runWorkspaceGrep` 可消费该 generator 拼 Promise。）

Host：

```ts
@Remote({ mode: 'stream' })
async *searchContent(scope, request, signal): AsyncIterable<ContentSearchFrame> {
  const root = requireWorkspaceRoot(scope)
  yield* this.ctx.workspaceCodeSearch.searchContentStream({ root, query: request.query, ... })
}
```

更新 `TYPERT_REMOTE` / `typert.host.ts`：为 `searchFiles`/`searchSymbols` 增加 unary descriptors；`searchContent` descriptor 含 `mode: 'stream'`、`cancellation: { parameter: 'signal' }`、`result` codec = `contentFrameSchema`。

`client.ts`：

```ts
searchFiles(...): Promise<FileLegResult>
searchSymbols(...): Promise<SymbolLegResult>
searchContent(...): AsyncIterable<ContentSearchFrame> // 或 RemoteStreamHandle<ContentSearchFrame, never>
```

- [ ] **Step 4: Run tests**

Run: `pnpm test -- tests/schemas.spec.ts tests/remote.spec.ts tests/service.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/service src/content/grep.ts src/api tests/schemas.spec.ts tests/remote.spec.ts
git commit -m "$(cat <<'EOF'
feat: expose per-leg and streaming content Remotes

EOF
)"
```

---

### Task 4: 软 ETA 纯函数

**Files:**
- Create: `src/client/eta.ts`
- Test: `tests/eta.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface EtaSample {
    readonly atMs: number
    readonly matched: number
  }
  /** @returns whole seconds remaining, or undefined if insufficient signal */
  export function estimateEtaSec(
    samples: readonly EtaSample[],
    limitPerKind: number,
    nowMs: number,
  ): number | undefined
  ```

- [ ] **Step 1: Write the failing test**

```ts
it('returns undefined with fewer than 2 samples or zero matched', () => {
  expect(estimateEtaSec([{ atMs: 0, matched: 0 }], 50, 1000)).toBeUndefined()
})

it('estimates seconds from match rate toward limit', () => {
  const samples = [
    { atMs: 0, matched: 10 },
    { atMs: 2000, matched: 30 },
  ]
  // rate = 10/s, remaining to 50 = 20 → ~2s
  expect(estimateEtaSec(samples, 50, 2000)).toBe(2)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/eta.spec.ts`  
Expected: FAIL

- [ ] **Step 3: Implement**

- 只用窗口内最近 ≤3s 的样本。
- `rate = (matchedLast - matchedFirst) / ((tLast - tFirst)/1000)`；`rate <= 0` → undefined。
- `remaining = max(0, limitPerKind - matchedLast)`；`sec = ceil(remaining / rate)`。
- `matchedLast === 0` → undefined。

- [ ] **Step 4: Run tests**

Run: `pnpm test -- tests/eta.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/client/eta.ts tests/eta.spec.ts
git commit -m "$(cat <<'EOF'
feat: soft ETA from content match rate

EOF
)"
```

---

### Task 5: SearchRequestController 并行三腿

**Files:**
- Modify: `src/client/search-controller.ts`
- Modify: `src/client/index.ts`（`adaptRemote` / `WireWorkspaceCodeSearch`）
- Modify: `src/api/client.ts`（若 Task 3 未完）
- Test: `tests/search-modal.client.spec.tsx`

**Interfaces:**
- Consumes: `WorkspaceCodeSearchRemote` 三腿 + `estimateEtaSec`
- Produces: 回调改为 partial 更新，例如：
  ```ts
  onUpdate(state: {
    searching: boolean
    result: SearchResult // 分区可部分填充
    legs: { file: LegUi; symbol: LegUi; content: LegUi }
  }): void
  // LegUi = idle | running | done | error；content 可带 progress/etaSec
  ```

- [ ] **Step 1: Write the failing tests**

替换/扩展 controller 测试（不再 mock 整包 `search`）：

```ts
it('surfaces symbols before content finishes', async () => {
  vi.useFakeTimers()
  let finishContent!: () => void
  const remote = {
    status: vi.fn(),
    searchFiles: vi.fn().mockResolvedValue({ hits: [], truncated: false }),
    searchSymbols: vi.fn().mockResolvedValue({
      hits: [{ path: 'a.ts', name: 'Foo', kind: 'class' }],
      truncated: false,
    }),
    searchContent: vi.fn().mockImplementation(async function* () {
      yield { type: 'progress', matched: 1, pathHint: 'b.ts' }
      await new Promise<void>((r) => { finishContent = r })
      yield { type: 'result', hits: [{ path: 'b.ts', line: 1, preview: 'x' }], truncated: false }
    }),
  } as unknown as WorkspaceCodeSearchRemote
  const snapshots: Array<{ symbols: number; searching: boolean }> = []
  const controller = new SearchRequestController(remote, SCOPE, { debounceMs: 0, clientTimeoutMs: 20_000 }, (s) => {
    snapshots.push({ symbols: s.result.symbols.length, searching: s.searching })
  }, () => {})
  controller.schedule('Foo', ['file', 'symbol', 'content'])
  await vi.advanceTimersByTimeAsync(1)
  await Promise.resolve()
  await Promise.resolve()
  expect(snapshots.some(s => s.symbols === 1 && s.searching)).toBe(true)
  finishContent()
  await Promise.resolve()
  controller.dispose()
})

it('ignores stale leg callbacks after query change', async () => { /* 同现网 seq 思路，改三腿 */ })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/search-modal.client.spec.tsx -t 'surfaces symbols'`  
Expected: FAIL

- [ ] **Step 3: Implement controller + adaptRemote**

- `schedule`：abort 旧 controller；清空；对启用 kinds 并行：
  - `searchFiles` / `searchSymbols` → Promise
  - `searchContent` → `for await (frame of …)`；`progress` 更新 legs.content；`result` 写 content hits
- 共享 `AbortSignal`；stream 在 abort 时 `handle.dispose?.()`（若 wire 返回 handle）。
- failsafe：`setTimeout(searchTimeoutMs + 5000)` abort 整次。
- **不再调用** `remote.search`（UI 路径）。
- `adaptRemote`：把 `$mount` 的 `searchFiles`/`searchSymbols`/`searchContent` 转成 UI 面；stream 方法把 wire handle 暴露为 `AsyncIterable`（`for await`），abort 时 `dispose()`。

Wire 类型示例：

```ts
searchContent(sessionId, request, signal): RemoteStreamHandle<ContentSearchFrame, never>
// 或 Promise<RemoteOk<...>> 若 mount 包装不同——以本机 $mount 实测为准，适配层消化差异
```

- [ ] **Step 4: Run tests**

Run: `pnpm test -- tests/search-modal.client.spec.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/client/search-controller.ts src/client/index.ts src/api/client.ts tests/search-modal.client.spec.tsx
git commit -m "$(cat <<'EOF'
feat: parallel per-leg search controller

EOF
)"
```

---

### Task 6: SearchModal 页脚与无结果时机 + locales

**Files:**
- Modify: `src/client/SearchModal.tsx`, `src/client/locales.ts`, `src/client/store.ts`（若 flatten/状态需要）
- Test: `tests/search-modal.client.spec.tsx`

**Interfaces:**
- Consumes: Task 5 的 `onUpdate` 状态、`estimateEtaSec`（可在 controller 内算好 `etaSec`）
- Produces: 页脚文案键，例如 `legDone`/`legRunning`/`progressFooter`（zh/en 成对）

- [ ] **Step 1: Write the failing UI tests**

```ts
it('does not show no-results while content still running', async () => {
  // mock：symbols done 空，content generator 挂起
  // assert：screen.queryByText(en.noResults) === null
  // assert：footer 含内容进行中文案
})

it('shows symbols section before content result frame', async () => {
  // symbols resolve with one hit; content still pending
  // assert：可见符号 label
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/search-modal.client.spec.tsx -t 'no-results while content'`  
Expected: FAIL

- [ ] **Step 3: Implement UI**

- `showNoResults`：所有启用腿 `done|error` 且 hits 合计 0。
- 页脚：用 locale 拼分腿状态；内容 `matched` / `约 Ns`（有 `etaSec` 时）。
- 分区标题旁 running 显示 `…`。
- 选中下标：结果变长时 clamp；尽量保持同一 path+kind+line。
- 更新 `SearchModal` 对 controller 回调签名。

- [ ] **Step 4: Run tests**

Run: `pnpm test -- tests/search-modal.client.spec.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/client/SearchModal.tsx src/client/locales.ts src/client/store.ts tests/search-modal.client.spec.tsx
git commit -m "$(cat <<'EOF'
feat: progressive search footer and no-results gating

EOF
)"
```

---

### Task 7: 构建产物、文档、验收

**Files:**
- Modify: `README.md`（一句：搜索分腿进度 / 软 ETA）
- Modify: `docs/specs/2026-09-30-search-progress-streaming-design.md` 状态 → 实现中/已实现
- Run: `pnpm build`（提交 `lib/`）

- [ ] **Step 1: Build**

Run: `pnpm typecheck && pnpm test && pnpm build`  
Expected: 全部通过；`lib/` 更新

- [ ] **Step 2: Manual smoke（有 dsh 时）**

1. 安装/链上最新插件，打开搜索，同时开符号+内容。
2. 确认符号区先于内容结束出现。
3. 内容搜索时页脚有进度；改词后旧结果不残留。
4. 关弹窗后无残留 rg（可用进程列表粗查）。

- [ ] **Step 3: Doc touch-up**

README 增加一行行为说明；规格状态改为「已实现」。

- [ ] **Step 4: Commit**

```bash
git add lib README.md docs/specs/2026-09-30-search-progress-streaming-design.md
git commit -m "$(cat <<'EOF'
chore: build lib and document progressive search

EOF
)"
```

---

## Spec coverage（自审）

| 规格要求 | Task |
|----------|------|
| Client 三腿并行 Remote | 3, 5 |
| 分腿先出结果 | 5, 6 |
| 内容流式 progress + 终帧 result | 2, 3 |
| 软 ETA「约」 | 4, 5, 6 |
| 改词 abort 清空 | 5 |
| 整包 `search` 保留 | 1, 3 |
| 无结果时机 | 6 |
| 每腿 timeout / Client failsafe +5s | 1（leg timeout）, 5 |
| progress 节流 | 2 |
| 内容 hits 仅终帧 | 2, 3, 5 |
| 测试要点 | 各 Task 测试 |

无 TBD/占位。类型名在 Task 间一致：`ContentSearchFrame`、`FileLegResult`、`SymbolLegResult`、`estimateEtaSec`。
