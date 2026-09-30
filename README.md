# cmd-shift-l

外部可安装的 DeepSeek Harness（dsh）工作区代码搜索 Bundle。

根目录单包：`dsh.bundle` + Host/Client 同包，依赖只走 npm registry。仓库已提交预构建 `lib/`，git 安装不跑构建脚本，无需 `allowBuilds`。

## 安装

**必须**带 `#main`（或下方版本），避免 `pnpm-lock` 钉死旧 commit：

```bash
dsh plugin --profile web add "github:sunbo008/cmd-shift-l#main"
```

升级或界面异常时先卸再装：

```bat
dsh plugin --profile web remove @dsh-plugin/cmd-shift-l
dsh plugin --profile web add "github:sunbo008/cmd-shift-l#main"
```

装完后**完全退出再开** `dsh web`。若报 `EADDRINUSE:3080`，结束旧进程或换端口。

> **当前：`0.1.4-restore`** — 恢复到 `385ac24` 行为（Windows 曾可用的 Client 面）：`$mount` **仅** `status` + `search`；分腿进度用三次 `search({ kinds: [one] })`，不再往 Client 挂 stream/多腿 Remote。

本机调试：`pnpm install && pnpm build` →  
`dsh plugin --profile web add /绝对路径/cmd-shift-l`。

### 根因（Windows 卡界面）

| 阶段 | Commit | 结果 |
|------|--------|------|
| 可用 | `971172e` 及更早 | Client 只 mount `status`/`search`，放大镜与查找正常 |
| 引入卡死 | `2070c42` … `f54cc17` | Client `$mount` 增加 per-leg / stream Remote，Windows 上 inject/`$mount` 堵死整页 |
| 已收回 Client 面 | `385ac24` | 回到只 mount `status`/`search`；分腿改走三次 `search` |
| 误伤 | `bc1e978` 之后 | fail-open / Host-only / 空 patch 等「止血」拆掉 Client，放大镜消失，问题更乱 |

若 lock 仍停在 `f54cc17` / `db2097e` 等，会一直卡——请卸装 `#main` 并确认版本为 **`0.1.4-restore`**。

## UI 入口

- 右侧栏顶栏（`+` 与分栏之间）放大镜
- Desktop `Cmd/Ctrl+Shift+F`；Web `Cmd/Ctrl+Shift+L`

搜索弹窗按**文件 / 符号 / 内容**分腿并行（三次 `search` 各带一种 `kinds`）：某一腿结束即刷新该分区。改词会立即取消旧搜。

## 文档

- [设计说明](docs/specs/2026-09-29-workspace-code-search-design.md)
- [分腿进度设计](docs/specs/2026-09-30-search-progress-streaming-design.md)
- [实现计划](docs/plans/2026-09-30-workspace-code-search.md)
- [分腿进度实现计划](docs/plans/2026-09-30-search-progress-streaming.md)
- [发布到 npm](docs/publish-npm.md)

## 开发

```bash
pnpm install
pnpm test
pnpm build
```

改源码后请 `pnpm build` 并提交更新后的 `lib/`，再 push；否则 github 安装仍是旧产物。
