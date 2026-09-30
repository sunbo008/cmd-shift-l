# 工作区代码搜索（外部 Bundle）— 设计说明

一句话：以外部可安装 bundle 在 Web/Desktop 提供「文件 / 符号 / 内容」统一搜索弹窗；文件与符号走 codegraph，内容走 Host grep；缺索引只降级提示，不挡内容搜索。

日期：2026-09-29
状态：已实现（见 [bundle README](../../packages/cmd-shift-l/README.md)）；实现计划见 [docs/plans/2026-09-30-workspace-code-search.md](../plans/2026-09-30-workspace-code-search.md)
范围：可外部安装的 dsh bundle（不随 dsh 安装包下发）

约定：本仓库（`dsh-plugin`）产出的文档一律使用中文。标识符、API 名、命令与代码片段保持英文原文。

## 问题

用户需要在 Web/Desktop Client 中获得类似 VS Code 的工作区查找入口：打开搜索弹窗，按文件名、文件内容、符号名查询，点击结果后在右侧 Sidebar 文档预览中打开。文件名与符号优先使用本地 codegraph 索引；内容搜索使用现有 workspace grep。缺少 codegraph 时须提示创建索引，且不得阻塞内容搜索。

## 目标

- 快捷键（Desktop `Cmd/Ctrl+Shift+F`，Web `Cmd/Ctrl+Shift+L`）与右侧栏顶栏（`+` 与分栏之间）放大镜按钮打开同一弹窗。
- 同一弹窗可搜路径、符号、内容（三类开关，默认全开）。
- 点击结果 → `sidebarRight.openResource(fileAddressFor(...))`；有行号时带 `{ params: { line } }`。
- 外部 bundle：用户通过 `dsh plugin add` 安装；不进入安装自带的 `OPTIONAL_BUNDLES`；不进入默认 Web/Desktop profile。
- 缺少 codegraph → 横幅给出创建指引；内容搜索仍可用。

## 非目标（v1）

- 打进 dsh 安装包，或与 dsh 发版列车同版本升级。
- 注册面向模型的 tool。
- 在 UI 内一键执行 `codegraph init`（仅提示命令）。
- 高级正则 / 替换 / 跨 workspace 搜索。
- 打开文件后仍保持弹窗（修饰键「保持打开」）。
- 把 `dsh plugin allow-version` 写成常规升级路径。

## 产品现实约束

dsh 公共 API 为 pre-stable。外部插件无法保证每次 dsh 升级后仍可用。本设计优先兼容性预检时禁行（fail closed）与运行时降级，而非零破坏。

## 架构

能力缝（capability seam）+ bundle patch 组装 Host 与 Client 行：

| 包名（示意） | 角色 |
|--------------|------|
| `workspace-code-search` | Service Definition：`status` / `search` |
| `workspace-code-search-codegraph` | Provider：从工作区 `.codegraph/` 提供文件名与符号 |
| `workspace-code-search-content` | Provider：经 Host grep / fs-search 搜内容（v1 独立包；不与 codegraph Provider 合并） |
| `api-workspace-code-search` | 供浏览器调用的 Typert Remote |
| `client-ui-workspace-code-search` | 弹窗、快捷键、按钮、结果列表、打开 Sidebar |
| `@dsh-plugin/cmd-shift-l`（目录 `packages/cmd-shift-l`） | `package.json` 的 `dsh.bundle` + `cordis.patch.yml` + locale/icon |

以树外 npm（或 git）包发布。用 `dsh plugin --profile <name> add <spec>` 装入 profile。本插件的全部源码、文档与产物一律放在 `/Users/zhifengleng/workspace/dsh-plugin`。不要向 `deepseek-harness` 仓库添加包、patch 或文档（该仓库仅作 API / 组合参考阅读）。

### 数据流

```text
[Cmd/Ctrl+Shift+F 或按钮]
        │
        ▼
 Client UI ── Remote ──► api-workspace-code-search
                              │
                              ▼
                    workspace-code-search（Service）
                    ┌─────────┴─────────┐
                    ▼                   ▼
             codegraph Provider    content Provider
             （文件 / 符号）         （workspace grep）
             （两腿并行；各带同一 signal）
                    │                   │
                    └─────────┬─────────┘
                              ▼
                    统一的分区 SearchResult
                              │
                              ▼
         点击 → sidebarRight.openResource(fileAddressFor(...))
```

并发与容量：同一弹窗实例同一时刻最多一条 in-flight `search`（新查询 abort 旧查询）；两 Provider 腿并行执行并共享 `signal`。超时由 `Config` 驱动，超时记入对应分区 `errors`，不拖死整次 RPC。

## Service 与 Remote API

能力缝分层：Host 内 Service 可接收已解析的 `root`；浏览器侧 Remote 不得接受调用方传入的绝对根路径。

```ts
// Host Service（同进程；root 由 Session cwd/workspace 解析后注入）
status(root: AbsolutePath): {
  // v1：仅 ready | missing | error（stale 检测延后；见下方「索引过期」）
  codegraph: 'ready' | 'missing' | 'error'
  message?: string
}

search(request: {
  root: AbsolutePath
  query: string
  /** 分区开关；Service 内可用 Set，Remote 线传 ReadonlyArray（JSON 可序列化） */
  kinds: readonly ('file' | 'content' | 'symbol')[]
  /** 每分区上限；省略则用 Config.limitPerKind；Host 钳制到 1..=Config.limitPerKind */
  limitPerKind?: number
  signal: AbortSignal
}): SearchResult

type SearchResult = {
  files: FileHit[]      // { path, score? }
  symbols: SymbolHit[]  // { path, name, kind, line?, score? }
  content: ContentHit[] // { path, line, preview }；preview 为可打印 UTF-8 文本，二进制行跳过
  /** 任一分区因 limitPerKind 截断则为 true */
  truncated: boolean
  /** 分区级失败；未失败的分区仍可有命中。Aborted 不进入此字段。
   * 键：`file` | `symbol` | `content` 对应分区；`codegraph` 仅用于 status/横幅无法表达、且同时影响 file+symbol 的索引级失败（此时 file/symbol 数组为空，可省略重复的 file/symbol 键）。 */
  errors?: Partial<Record<'file' | 'symbol' | 'content' | 'codegraph', string>>
}

// Typert Remote（Session 作用域；无 root 参数）
status(): {
  codegraph: 'ready' | 'missing' | 'error'
  message?: string
}
search(request: {
  query: string
  kinds: readonly ('file' | 'content' | 'symbol')[]
  limitPerKind?: number
  signal: AbortSignal
}): SearchResult
```

规则：

- 打开弹窗时调用一次 Remote `status()` 以决定 codegraph 横幅；v1 不做自动轮询，关闭再开即刷新。搜索返回 `errors.codegraph` 时同步刷新横幅文案。
- 空查询或仅空白：不调用 Remote `search`；UI 显示「输入以搜索」（v1 不做最近打开列表）。
- `kinds` 为空数组：不调用 Remote `search`；UI 保持空结果（或提示打开至少一类开关）；不抛错。
- `kinds` 含 `file`/`symbol` 且 `codegraph !== 'ready'`：这两区返回空，UI 显示 codegraph 状态横幅；`content` 仍执行。
- 内容搜索永不依赖 codegraph。
- 取消三件套（Client 必达）：`Config` 校验的 debounce；每次新查询 `abort` 旧 `AbortController` 后新建；单调 `issuedSeq` / `renderedSeq`（或等价 generation）忽略迟到结果。仅 Abort 不够。`AbortError` / 取消不得进入错误横幅或 `errors`。
- 返回路径相对 Host 解析出的 `root`。打开时用 `fileAddressFor(sessionId, cwd, path)`；有行号时 `sidebarRight.openResource(address, { params: { line } })`。
- `Config` 字段（均经校验）：`maxQueryCodeUnits`、`limitPerKind`（请求缺省与硬顶）、`debounceMs`、`searchTimeoutMs`。请求体可带 `limitPerKind`，Host 钳制到 `1..=Config.limitPerKind`；插件体内不硬编码部署可调数值。
- Remote：Host 从活动 Session 的 cwd/workspace 解析 `root`。线传不得含任意绝对根。拒绝空查询、过长查询与 NUL（与 session-search `normalizeQuery` 同类约束）。
- 无活动 Session / 无 cwd：快捷键与按钮为 no-op（不打开弹窗）；不发起 Remote。
- 索引过期（v1）：能打开 `.codegraph/` 则报 `ready`，不做 stale 检测。用户可见风险：编辑后文件/符号/行号可能漂移；打开不存在文件走现有 unpreviewable。横幅仅覆盖 missing/error；README / 指引文案须注明「索引可能过期，可重建」。后续里程碑再加 `stale` 或轻量 mtime 探测。
- 排序（v1）：`score` 可选；文件/符号区按路径或名称的简单相关度排序即可（路径分量 / 前缀优先优于纯字母级 fuzzy 全库噪声）；不引入独立排序引擎。

## UI

- 快捷键：Desktop `Cmd/Ctrl+Shift+F`，Web `Cmd/Ctrl+Shift+L`，注册进 Client shortcuts。与按钮共用同一命令。Web 候选排查：`Shift+F` 撞 `session.fork`；`Alt+F` 撞 Chrome Search the web；`Shift+H` 撞 Chrome 主页 / macOS Finder Home；`Shift+L` 为 Chrome 官方未占用且 dsh 空闲（Safari 侧栏、Bitwarden 自动填充仍可能抢键，见 bundle README）。与 VS Code：Desktop 同键打开三态弹窗，Web 用 `Shift+L`。
- 按钮：右侧 Sidebar 顶栏 dock strip（`+` 与分栏之间）portal 放大镜；与快捷键共用同一 `openSearch`。
- 模态弹窗（居中略偏上）：
  1. 搜索框，打开即聚焦；Esc 关闭；↑/↓ 移动选中；Enter 打开。
  2. 开关：文件 / 符号 / 内容（默认全开）→ `kinds`。
  3. 分区结果（无命中且无该区 `errors` 则不显示该区）：文件（路径）；符号（名称 + 路径 + 可选行号）；内容（路径:行号 + preview）。有 `errors.file` / `errors.symbol` / `errors.content` 时该区显示短错误文案。
  4. 页脚 / 横幅：搜索中、无结果、已截断；`status().codegraph` 为 missing/error，或 `errors.codegraph` 出现时显示缺失/错误指引（例如在工作区运行 `codegraph init`）；取消中不闪错误。v1 横幅可不提供单独「刷新状态」按钮（关闭再开弹窗即重拉 `status()`）。
- 打开文件后关闭弹窗。
- 活动 Session 切换或 cwd 变更：关闭弹窗并丢弃 in-flight 查询（abort）；再次打开时按新 Session 解析 root。
- `preview` 与路径/符号名一律按纯文本渲染（React 文本节点或等价），禁止当 HTML 插入。
- 所有用户可见文案走 Client locale 字典。

## 错误处理与边界

| 情况 | 行为 |
|------|------|
| 无 / 不可读 `.codegraph/` | `missing` 横幅；文件/符号空；内容正常 |
| 索引损坏 / 不兼容 | `error` + 简短原因 |
| 索引过旧 | v1 不做；能打开则当 ready；文档/指引声明过期风险（见 Service 规则） |
| grep / content Provider 失败 | `errors.content`；文件/符号区不受影响 |
| codegraph Provider 抛错（非 missing） | `errors.codegraph`（file/symbol 数组空）；内容区不受影响 |
| 查询被新输入取代 | abort + 序列守卫；忽略迟到结果；不写入 `errors` |
| 路径越出 workspace | Provider 丢弃 |
| 点开文件不存在 | 走现有文档 unpreviewable 态 |
| 超出上限 | 该分区截断 + `truncated: true` |
| 无 grep 能力 | 内容区不可用（`errors.content` 或等价空+提示）；文件/符号仍可用 |
| 内容命中落在二进制 / 含 NUL 行 | 跳过该行，不把二进制塞进 preview |
| Host grep 排除 / VCS / symlink | 继承所用 Host workspace grep / fs-search 的既有策略（含 VCS 元数据排除）；本插件不另开 follow-symlink；零命中时不把「被 ignore」误报为引擎故障 |
| 活动 Session / cwd 变更 | 关闭弹窗；abort in-flight；不保留旧 root 结果 |
| bundle 未安装 / 已禁用 | 无快捷键、按钮、Remote |

安全：仅在 Host 解析出的 Session workspace root 下搜索；Remote 线传无 `root`；路径遍历结果在 Provider 侧相对 root 校验后丢弃越界项。

## 外部插件兼容策略

坦诚上限：本设计无法让外部 bundle 对 dsh 升级免疫，只能降低「升级后整应用起不来」的概率。

1. 收紧 `peerDependencies`：对实际导入的每个 `@deepseek-ai/dsh-*` 声明窄范围，对齐已测 dsh 版本，不用 `*`。peer 不满足时，dsh 兼容性预检禁行，不加载坏代码（`evaluatePluginCompatibility` / `prepareProfileEntries`）。
2. 需与宿主共享实例的 dsh 包装进 `peerDependencies` 与 `devDependencies`（见官方 publish 教程），运行时使用安装中的副本。
3. 窄 API 面：Remote + Client UI + search providers + shortcuts + `sidebarRight` / `fileAddressFor`。不改 agent-loop / Session 日志格式。
4. `apply` 只做注册。缺 codegraph、缺 grep、缺 Session 均为运行时降级，不为「可选能力缺失」在加载期抛错。
5. README 兼容矩阵：每个插件版本写明兼容的 dsh 版本区间。dsh breaking 时发新插件版，不靠豁免。
6. 恢复说明：升级后若启动异常，先在 Plugins 关闭或 `dsh plugin remove` 本 bundle，再安装匹配新 runtime 的插件构建。
7. 不把 `allow-version` 写成常规流程。豁免是精确的 package@version × 精确 dsh 版本，且明确有 crash / 数据损坏风险。

仍可能导致启动失败：peer 仍满足但范围内 API 变更导致加载期抛错；用户授予豁免；注册代码本身的缺陷。

## 测试

| 层 | 覆盖 |
|----|------|
| Providers | codegraph ready/missing/损坏；路径排序；越界丢弃；内容命中；内容失败隔离；二进制行跳过；abort |
| Service | kinds 过滤；缺 codegraph 时内容仍返回；`limitPerKind` / truncated；分区 `errors` 互不影响 |
| Remote | 无 Session；空/过长/NUL 查询；无 root 参数；取消；挂测试 provider 的组合 |
| Client UI | 开关弹窗；打开时 `status()`；快捷键注册与 dispose；分区；键盘导航；`openResource`（含 line）；缺失横幅；debounce + abort + 序列守卫（迟到结果不渲染）；AbortError 不进错误态；Session/cwd 切换关窗；preview 纯文本；kinds 全关不发 Remote |
| Bundle | patch 组装；装入测试 profile 后出现入口 |
| 快照 | 无模型 tool → 默认不要求 session snapshot；若日后挂进对话呈现再补 |

跑聚焦的包测与 Client spec；不默认跑全仓 suite。

## 实现备注

- 索引位置：Session workspace root 下的 `.codegraph/`。
- 内容后端：复用 Host workspace grep / fs-search；v1 不另起全文引擎；排除/VCS/symlink 行为跟随该后端，不在本插件硬编码第二套规则。
- 遵循 Cordis 插件导出规则（函数插件：具名 `name` / `inject` / `Config` / `apply`；服务包默认导出 class）。
- 注册均为 effect；fiber dispose 后移除快捷键、slot 与 Remote 贡献。
- Client 搜索请求：debounce（Config）→ AbortController 轮换 → `issuedSeq`/`renderedSeq` 守卫，三者缺一不可。

## 头脑风暴已决议

- 触发：按钮 + `Cmd/Ctrl+Shift+F`（非模型 tool）。
- 模式：文件 + 内容 + 符号。
- 后端：codegraph（文件/符号）+ grep（内容）；缺索引提示创建。
- 交付：外部可安装 bundle（已从「安装自带 optional」修订）。
- 做法：能力缝 + bundle patch。
- 产出位置：一律 `dsh-plugin`；文档一律中文。
