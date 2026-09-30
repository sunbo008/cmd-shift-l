# cmd-shift-l

外部可安装的 DeepSeek Harness（dsh）插件仓库。入口 Bundle 在**仓库根目录**（`package.json` 含 `dsh.bundle`）。

## 约定

- **产物一律写在本仓库**（`/Users/zhifengleng/workspace/github/cmd-shift-l`），不要写入 `deepseek-harness`。
- **文档一律使用中文**；API 名、命令、代码标识符保持英文。
- `deepseek-harness` 仅作 API 与组合方式的只读参考。

## 文档

- [工作区代码搜索设计](docs/specs/2026-09-29-workspace-code-search-design.md)
- [工作区代码搜索实现计划](docs/plans/2026-09-30-workspace-code-search.md)
- [Bundle 排障与兼容矩阵](docs/bundle.md)

## 安装（推荐：GitHub）

不经过 npm，直接从本仓库装进 profile（示例用 `web`）：

```bash
dsh plugin --profile web add github:sunbo008/cmd-shift-l
```

指定分支：

```bash
dsh plugin --profile web add 'github:sunbo008/cmd-shift-l#main'
```

钉死某次提交（更安全）：

```bash
dsh plugin --profile web add 'github:sunbo008/cmd-shift-l#<commit-sha>'
```

说明：

- 入口 Bundle 在仓库根，**不需要** `#path:…`。
- shell 里有 `&` 时请给整个参数加引号。
- git 安装拉的是**源码**。若 pnpm 提示拒绝运行构建脚本，按 dsh / pnpm 输出把包名写进该 profile 的 `pnpm-workspace.yaml`（`allowBuilds`），再重跑上面的 `add`。
- 改完代码需重新 `add`（或升版本 / 换 commit）并**重启** `dsh web`；只刷新浏览器不够。

启动：

```bash
dsh --profile web web
# 或
dsh --profile web desktop
```

卸载：

```bash
dsh plugin --profile web remove @dsh-plugin/cmd-shift-l
```

（卸载时仍用 `package.json` 里的包名 `@dsh-plugin/cmd-shift-l`。）

开发者本机调试也可：clone 本仓库 → `pnpm install && pnpm build` →  
`dsh plugin --profile web add /绝对路径/cmd-shift-l`。

### UI 入口（仅此两处）

- 右侧栏顶栏（`+` 与分栏之间）的放大镜
- 快捷键：Desktop `Cmd/Ctrl+Shift+F`；Web `Cmd/Ctrl+Shift+L`

不在 files / document 路径栏或工具条再挂第二个放大镜。
