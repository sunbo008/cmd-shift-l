# cmd-shift-l

外部可安装的 DeepSeek Harness（dsh）工作区代码搜索 Bundle。

根目录单包：`dsh.bundle` + Host/Client 同包。仓库已提交预构建 `lib/`，git 安装无需 `allowBuilds`。

## 安装

```bat
dsh plugin --profile web remove @dsh-plugin/cmd-shift-l
dsh plugin --profile web add "github:sunbo008/cmd-shift-l#main"
```

装完后**完全退出再开** `dsh web`。lock 版本须为 **`0.1.13-pin-e3e6a8f`**。

Chrome 请用终端打印的完整 `?token=` URL。

> **当前钉在 `e3e6a8f`（可用）。** `971172e`（0.1.12）在 Windows 上会卡界面，已回退。勿使用 `0.1.12-971172e`。

已知回归点：`971172e` 相对 `e3e6a8f` 只改了 Dock 放大镜挂载方式 + `status` 改 probe；其中至少一项在 Windows 上触发整页卡住。

## UI 入口

- 右侧栏顶栏放大镜
- Desktop `Cmd/Ctrl+Shift+F`；Web `Cmd/Ctrl+Shift+L`

## 开发

```bash
pnpm install && pnpm test && pnpm build
```
