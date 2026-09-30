# cmd-shift-l

外部可安装的 DeepSeek Harness（dsh）工作区代码搜索 Bundle。

根目录单包：`dsh.bundle` + Host/Client 同包。仓库已提交预构建 `lib/`，git 安装无需 `allowBuilds`。

## 安装

```bat
dsh plugin --profile web remove @dsh-plugin/cmd-shift-l
dsh plugin --profile web add "github:sunbo008/cmd-shift-l#main"
```

装完后**完全退出再开** `dsh web`。lock 版本须为 **`0.1.6-971172e`**。

> 本版整树回退到 `971172e`（2026-09-30 15:27，分腿/stream Remote 之前）。那是 better-sidebar 单包对齐之后、Windows 上放大镜与查找仍正常的最后一版。

## UI 入口

- 右侧栏顶栏放大镜
- Desktop `Cmd/Ctrl+Shift+F`；Web `Cmd/Ctrl+Shift+L`

## 文档

- [设计说明](docs/specs/2026-09-29-workspace-code-search-design.md)
- [实现计划](docs/plans/2026-09-30-workspace-code-search.md)
- [发布到 npm](docs/publish-npm.md)

## 开发

```bash
pnpm install
pnpm test
pnpm build
```

改源码后请 `pnpm build` 并提交更新后的 `lib/`。
