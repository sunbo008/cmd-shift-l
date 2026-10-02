# cmd-shift-l

外部可安装的 DeepSeek Harness（dsh）工作区代码搜索 Bundle。

根目录单包：`dsh.bundle` + Host/Client 同包。仓库已提交预构建 `lib/`，git 安装无需 `allowBuilds`。

## 安装

```bat
dsh plugin --profile web remove @dsh-plugin/cmd-shift-l
dsh plugin --profile web add "github:sunbo008/cmd-shift-l#main"
```

装完后**完全退出再开** `dsh web`。lock 版本须为 **`0.2.1-lazy-sqlite`**。

Chrome 请用终端打印的完整 `?token=` URL。

> **`0.2.1-lazy-sqlite`（待 Windows 验证）：** 在 `0.2.0` 上**只**叠 Host 启动不加载 `node:sqlite`（`probe` + Worker 内开库）。  
> **未改：** Dock；Remote 仍只有 `status` + `search`；分腿进度同 `0.2.0`。  
> 若再现 Files「正在读取…」，回钉 `0.2.0` / tag。记录见 [docs/windows-hang-causes.md](docs/windows-hang-causes.md)。

## UI 入口

- 右侧栏顶栏放大镜
- Desktop `Cmd/Ctrl+Shift+F`；Web `Cmd/Ctrl+Shift+L`
- 搜索弹窗：分腿先出结果；内容腿可显示匹配数与软 ETA

## 开发

```bash
pnpm install && pnpm test && pnpm build
```
