# cmd-shift-l

外部可安装的 DeepSeek Harness（dsh）工作区代码搜索 Bundle。

根目录单包：`dsh.bundle` + Host/Client 同包，依赖只走 npm registry。仓库已提交预构建 `lib/`，git 安装不跑构建脚本，无需 `allowBuilds`。

## 安装

**推荐**带 `#main`，避免 `pnpm-lock` 钉死旧 commit：

```bash
dsh plugin --profile web add "github:sunbo008/cmd-shift-l#main"
```

Windows（cmd / PowerShell）相同。升级或界面异常时先卸再装：

```bat
dsh plugin --profile web remove @dsh-plugin/cmd-shift-l
dsh plugin --profile web add "github:sunbo008/cmd-shift-l#main"
```

指定 commit：

```bash
dsh plugin --profile web add "github:sunbo008/cmd-shift-l#<commit-sha>"
```

装完后**完全退出再开** `dsh web`（仅刷新浏览器不够）。若报 `EADDRINUSE:3080`，先结束占用该端口的旧进程，或 `dsh web --port 3081`。

> **临时：** 当前发布为 **Host-only**（已去掉 `dsh.client`），避免 Windows Desktop 加载 Client 插件时整页卡死。会话/Files 应正常；搜索放大镜暂不可用。恢复 Client UI 前请先确认本版在 Windows 上不再卡界面。

本机调试：`pnpm install && pnpm build` →  
`dsh plugin --profile web add /绝对路径/cmd-shift-l`。

### Windows 界面卡住 / 白屏

1. 确认 lock 已到最新：在 `%USERPROFILE%\.dsh\profiles\web\pnpm-lock.yaml` 搜 `cmd-shift-l`，应含本机刚 `add "#main"` 时拉到的 commit（勿停在 `bc1e978` 及更早）。
2. 看启动日志：`%USERPROFILE%\.dsh\logs\startup-*.log`（若只有 `EADDRINUSE` 是端口问题，不是本插件）。
3. 卸掉本插件后若界面恢复 → 再按上面「先卸再装 `#main`」强制升级。

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
