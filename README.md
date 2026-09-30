# cmd-shift-l

外部可安装的 DeepSeek Harness（dsh）工作区代码搜索 Bundle。

根目录单包：`dsh.bundle` + Host/Client 同包。仓库已提交预构建 `lib/`，git 安装无需 `allowBuilds`。

## 安装

```bat
dsh plugin --profile web remove @dsh-plugin/cmd-shift-l
dsh plugin --profile web add "github:sunbo008/cmd-shift-l#main"
```

装完后**完全退出再开** `dsh web`。lock 版本须为 **`0.1.15-no-mutobs`**。

Chrome 请用终端打印的完整 `?token=` URL。

> **`0.1.15`：** 保留 lazy SQLite；去掉 Dock 对 `document` 的 `MutationObserver`（Files 树刷新会饿死 React，卡在「正在读取…」），改为 1s/5s 轮询。

## UI 入口

- 右侧栏顶栏放大镜
- Desktop `Cmd/Ctrl+Shift+F`；Web `Cmd/Ctrl+Shift+L`

## 开发

```bash
pnpm install && pnpm test && pnpm build
```
