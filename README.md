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

> **临时（`0.1.2-host-lazy`）：** Host 延迟 3s 再动态加载搜索逻辑，避免堵死 Files；**Client / 放大镜仍关闭**。先确认右侧「文件」能列出；放大镜下一版再加回。

本机调试：`pnpm install && pnpm build` →  
`dsh plugin --profile web add /绝对路径/cmd-shift-l`。

### Windows 界面卡住 / 白屏

| 现象 | 含义 |
|------|------|
| 会话空白 / 「选择一个工作区开始」 | Client `$mount` 堵 boot（旧版） |
| 会话正常，Files「正在读取…」，无查找放大镜 | Host 在启动时同步加载 `node:sqlite`/Remote，堵了 `workspaceFiles.list`；或仍是空包未装到 lazy Host |
| 无放大镜 | 当前发布刻意未开 Client |

1. lock 搜 `cmd-shift-l`，版本应为 **`0.1.2-host-lazy`**。
2. 启动日志：`%USERPROFILE%\.dsh\logs\startup-*.log`。
3. 先卸再装 `#main`，完全退出后重开。

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
