# cmd-shift-l

外部可安装的 DeepSeek Harness（dsh）工作区代码搜索 Bundle。

布局对齐 [DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar)：**仓库根目录单包**，`dsh.bundle` + Host/Client 同包，依赖只走 npm registry。仓库已提交预构建 `lib/`，git 安装不跑构建脚本，**无需** `allowBuilds`。

## 安装

任选一种 specifier（等价）：

```bash
dsh plugin --profile web add github:sunbo008/cmd-shift-l
dsh plugin --profile web add sunbo008/cmd-shift-l
```

Windows（cmd / PowerShell）相同：

```bat
dsh plugin --profile web add github:sunbo008/cmd-shift-l
```

若之前装过旧版（含 `prepare`、曾报 `allowBuilds`），先卸再装：

```bat
dsh plugin --profile web remove @dsh-plugin/cmd-shift-l
dsh plugin --profile web add github:sunbo008/cmd-shift-l
```

指定分支 / commit：

```bash
dsh plugin --profile web add "github:sunbo008/cmd-shift-l#main"
dsh plugin --profile web add "github:sunbo008/cmd-shift-l#<commit-sha>"
```

装完后**重启** `dsh web`（仅刷新浏览器不够）。

本机调试：`pnpm install && pnpm build` →  
`dsh plugin --profile web add /绝对路径/cmd-shift-l`。

## UI 入口

- 右侧栏顶栏（`+` 与分栏之间）放大镜
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

改源码后请 `pnpm build` 并提交更新后的 `lib/`，再 push；否则 github 安装仍是旧产物。
