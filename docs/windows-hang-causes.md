# Windows 卡顿 / 卡界面原因记录

日期：2026-09-30  
范围：`@dsh-plugin/cmd-shift-l` 在 Windows + `dsh web`（Chrome）上的表现。  
**已知可用钉扎：`0.2.0`（Windows 实机确认；行为 = `d660b5c` + 分腿 unary 进度）。** 此后改动须单变量叠加并在 Windows 实机确认。

## 结论摘要

| 现象 | 最可能原因 | 引入 / 相关提交或版本 | 处理 |
|------|------------|----------------------|------|
| 整页空白 / 主区一直「选择一个工作区开始」 | Client `$mount` 挂了过多 Remote（含 stream / per-leg） | `2070c42` … `f54cc17` | Client/Host 只保留 `status`+`search` |
| 同上（整页卡） | Dock 放大镜改为 `setTimeout` 轮询挂载（去掉 MutationObserver 的那套 rewrite） | `971172e`、`0.1.15-no-mutobs` | **回退 Dock 改动**；勿再上这套 pump |
| Files 一直「正在读取…」 | Dock 对 `document.body` 做 `MutationObserver`（Files 树狂突变饿死 React） | `e3e6a8f` 及更早 Dock 实现；代码内已有注释 | 与上一行冲突：改 Observer 易整页卡，留 Observer 易 Files 卡 |
| 启动略顿一下 | Host 插件加载时静态 `import` `db.ts` → `node:sqlite` | `register.ts` 链 | `0.1.14-lazy-sqlite`：启动不加载 sqlite，仅 Worker 搜索时打开 |
| Chrome 像卡启动、Cursor 内置页正常 | 未带 `?token=` / 旧 cookie；与 Cursor 不共享登录态 | `dsh web` 鉴权 | 用终端完整 URL；重启浏览器 |

## 逐步验证时间线（Windows）

| 版本　　　　　　　　　 | 对应提交　　　　　　　　　　　　　　　　　　　　　　| 结果　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　|
| ------------------------| -----------------------------------------------------| -----------------------------------------------------------------------------|
| `0.1.7-a3f766b`　　　　| `a3f766b`　　　　　　　　　　　　　　　　　　　　　 | 可用（better-sidebar 单包对齐会话时点）　　　　　　　　　　　　　　　　　　 |
| `0.1.8-4be9cb8`　　　　| `4be9cb8`　　　　　　　　　　　　　　　　　　　　　 | 可用（Client zod/v4/mini）　　　　　　　　　　　　　　　　　　　　　　　　　|
| `0.1.9-9f5674a`　　　　| `9f5674a`　　　　　　　　　　　　　　　　　　　　　 | 可用（Dock 曾减弱 MutationObserver）　　　　　　　　　　　　　　　　　　　　|
| `0.1.10-f11dde2`　　　 | `f11dde2`　　　　　　　　　　　　　　　　　　　　　 | 可用（SQLite → worker）　　　　　　　　　　　　　　　　　　　　　　　　　　 |
| `0.1.11-e3e6a8f`　　　 | `e3e6a8f`　　　　　　　　　　　　　　　　　　　　　 | 可用；启动略卡　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　|
| `0.1.12-971172e`　　　 | `971172e`　　　　　　　　　　　　　　　　　　　　　 | **整页卡**（Dock pump + status probe）　　　　　　　　　　　　　　　　　　　|
| `0.1.13-pin-e3e6a8f`　 | 钉回 `e3e6a8f`　　　　　　　　　　　　　　　　　　　| 可用　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　|
| `0.1.14-lazy-sqlite`　 | probe + 去掉 Host 静态 sqlite　　　　　　　　　　　 | 启动不慢；**Files「正在读取…」**　　　　　　　　　　　　　　　　　　　　　　|
| `0.1.15-no-mutobs`　　 | 去掉 MutationObserver，改 setTimeout 轮询　　　　　 | **整页卡**（同 `971172e` Dock 方向）　　　　　　　　　　　　　　　　　　　　|
| `0.1.16-pin-e3e6a8f`　 | 提交 `d660b5c`，钉回 `e3e6a8f`　　　　　　　　　　　| **确认可用（安全基线）**　　　　　　　　　　　　　　　　　　　　　　　　　　|
| `0.1.17-progress-safe` | 在 `d660b5c` 上只加分腿进度 UI　　　　　　　　　　　| 三次 `search({ kinds: [one] })`；**不**增 Client/Host Remote；**不**改 Dock |
| `0.2.0`　　　　　　　　| tag = `0.1.17-progress-safe` 行为；Windows 实机可用 | **当前发布**　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　|

## 分项说明

### 1. Client 多 Remote `$mount`（已确认）

`971172e` 及更早可用面：Client 只 `$mount` `status` + `search`。

`2070c42` 起增加 `searchFiles` / `searchSymbols` / `searchContent` / stream。Windows 上 Client inject / `$mount` 易堵死整页。  
`385ac24` 只收窄 Client 不够：Host `@Remote` 仍注册多腿时也会出问题。应对齐为两边都只有两腿；分腿进度用三次 `search({ kinds: [one] })`。

### 2. Dock `MutationObserver` vs `setTimeout` 轮询（互斥，尚未两全）

**Observer（当前基线 Dock）：**

- 在 `document.body` 上 `childList + subtree` 观察，直到放大镜 host 插入。
- Files 面板渲染时 DOM 高频变化 → `requestAnimationFrame` 连打 → React 来不及提交 Files 列表 → 一直「正在读取…」。
- `0.1.14` 在 lazy sqlite 后更明显（启动快了，更快点开 Files）。

**`setTimeout` 轮询（`971172e` / `0.1.15`）：**

- 意图：不观察 document，避免饿死 React。
- Windows 实测：**整页卡在「选择一个工作区开始」**（会话/工作区列表或有，主输入不可用）。
- 与 `971172e` 整页卡症状一致；`0.1.15` 未改 Host Remote、只改 Dock，故 **Dock 这套 pump 本身即可复现整页卡**。

未解：需要一种既不 MutationObserver、又不走现 pump 实现的 Dock 挂载方式（例如官方 Cordis slot，或仅在 strip 已存在时挂一次、无轮询）。

### 3. Host 静态加载 `node:sqlite`（启动顿挫）

`register.ts` 若静态 `import './db.ts'`，插件 `apply` 时即加载 `DatabaseSync`。  
Windows 上表现为启动「顿一下」。  
`0.1.14` 改为 `probe`（`existsSync`/`accessSync`）+ Worker 内开库后，启动明显不慢。该方向可保留，但须与可用 Dock 组合验证，避免再次整页卡。

### 4. `status` 主线程 `openCodegraph`

在 `e3e6a8f`：`status()` 仍同步开库再 `close`。打开搜索弹窗时可能再顿。  
改为 probe 本身未单独证实会导致整页卡（`0.1.14` 整页能起来，只是 Files 卡）。

### 5. Chrome token / 会话

无 `?token=` 或过期 cookie 时，表现也像「打不开」。Cursor 内置预览与 Chrome 不共享 cookie。  
排查插件前先确认终端打印的完整 URL，必要时重启浏览器。

## 当前策略

1. **安全基线提交：`d660b5c`**（`0.1.16-pin-e3e6a8f` = `e3e6a8f` 行为）。  
2. **`0.2.0`（Windows 已确认）：** 分腿进度（三次 unary `search`）；Dock / Remote 面与 `d660b5c` 一致。  
3. 后续改动必须 **单变量** 发布，每档 Windows 实机确认。  
4. **禁止**在未验证前合并：`971172e` 式 Dock pump、多 Remote / stream Client `$mount`。  
5. Files「正在读取…」与整页卡的 Dock 两难写入上表，待有官方 strip slot 或更稳挂载后再解。

## 安装钉扎命令

```bat
dsh plugin --profile web remove @dsh-plugin/cmd-shift-l
dsh plugin --profile web add "github:sunbo008/cmd-shift-l#main"
```

确认 `%USERPROFILE%\.dsh\profiles\web\pnpm-lock.yaml` 中版本为当前 README 所写钉扎版本（应为 `0.2.0`）。
