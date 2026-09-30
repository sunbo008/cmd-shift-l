# cmd-shift-l

外部可安装的 DeepSeek Harness（dsh）工作区代码搜索 Bundle。

布局对齐 [DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar)：**仓库根目录单包**，`dsh.bundle` + Host/Client 同包，依赖只走 npm registry（无 monorepo `workspace:*` 子包）。

## 安装

```bash
dsh plugin --profile web add github:sunbo008/cmd-shift-l
```

指定分支 / commit：

```bash
dsh plugin --profile web add 'github:sunbo008/cmd-shift-l#main'
dsh plugin --profile web add 'github:sunbo008/cmd-shift-l#<commit-sha>'
```

卸载：

```bash
dsh plugin --profile web remove @dsh-plugin/cmd-shift-l
```

装完后**重启** `dsh web`（仅刷新浏览器不够）。若 pnpm 拦截构建脚本，按提示把包名写入 profile 的 `pnpm-workspace.yaml`（`allowBuilds`）后重跑 `add`。

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
