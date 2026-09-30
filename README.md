# cmd-shift-l

外部可安装的 DeepSeek Harness（dsh）工作区代码搜索 Bundle。

根目录单包：`dsh.bundle` + Host/Client 同包。仓库已提交预构建 `lib/`，git 安装无需 `allowBuilds`。

## 安装

```bat
dsh plugin --profile web remove @dsh-plugin/cmd-shift-l
dsh plugin --profile web add "github:sunbo008/cmd-shift-l#main"
```

装完后**完全退出再开** `dsh web`。lock 版本须为 **`0.1.11-e3e6a8f`**。

Chrome 请用终端打印的完整 `?token=` URL。

> 本版：`e3e6a8f`（profile 内 rg、路径大小写兼容、Client 超时必结束）。上一档 `0.1.10-f11dde2` 已确认可用。

## UI 入口

- 右侧栏顶栏放大镜
- Desktop `Cmd/Ctrl+Shift+F`；Web `Cmd/Ctrl+Shift+L`

## 开发

```bash
pnpm install && pnpm test && pnpm build
```
