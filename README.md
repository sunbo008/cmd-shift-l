# cmd-shift-l

外部可安装的 DeepSeek Harness（dsh）工作区代码搜索 Bundle。

根目录单包：`dsh.bundle` + Host/Client 同包。仓库已提交预构建 `lib/`，git 安装无需 `allowBuilds`。

## 安装

```bat
dsh plugin --profile web remove @dsh-plugin/cmd-shift-l
dsh plugin --profile web add "github:sunbo008/cmd-shift-l#main"
```

装完后**完全退出再开** `dsh web`。lock 版本须为 **`0.1.14-lazy-sqlite`**。

Chrome 请用终端打印的完整 `?token=` URL。

> **`0.1.14-lazy-sqlite`：** 在可用的 `e3e6a8f` 基础上，Host 启动不再静态加载 `node:sqlite`；`status` 只做文件探测，SQLite 仅在搜索 Worker 里打开。未改 Dock 挂载（`971172e` 那套曾卡界面）。

## UI 入口

- 右侧栏顶栏放大镜
- Desktop `Cmd/Ctrl+Shift+F`；Web `Cmd/Ctrl+Shift+L`

## 开发

```bash
pnpm install && pnpm test && pnpm build
```
