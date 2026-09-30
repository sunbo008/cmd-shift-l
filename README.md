# cmd-shift-l

外部可安装的 DeepSeek Harness（dsh）工作区代码搜索 Bundle。

根目录单包：`dsh.bundle` + Host/Client 同包。仓库已提交预构建 `lib/`，git 安装无需 `allowBuilds`。

## 安装

```bat
dsh plugin --profile web remove @dsh-plugin/cmd-shift-l
dsh plugin --profile web add "github:sunbo008/cmd-shift-l#main"
```

装完后**完全退出再开** `dsh web`。lock 版本须为 **`0.1.17-progress-safe`**。

Chrome 请用终端打印的完整 `?token=` URL。

> **本版：** 在已确认可用的 `d660b5c`（`e3e6a8f` 行为）上恢复分腿进度：Client 对 `file` / `symbol` / `content` 各发一次 `search({ kinds: [one] })`，页脚显示完成态与软 ETA。  
> **未改：** Dock；Client/Host Remote 仍只有 `status` + `search`（禁止多 Remote / stream `$mount`）。  
> 卡顿原因与逐步验证记录见 [docs/windows-hang-causes.md](docs/windows-hang-causes.md)。

## UI 入口

- 右侧栏顶栏放大镜
- Desktop `Cmd/Ctrl+Shift+F`；Web `Cmd/Ctrl+Shift+L`
- 搜索弹窗：分腿先出结果；内容腿可显示匹配数与软 ETA

## 开发

```bash
pnpm install && pnpm test && pnpm build
```
