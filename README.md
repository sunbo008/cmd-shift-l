# cmd-shift-l

外部可安装的 DeepSeek Harness（dsh）插件仓库。

## 约定

- **产物一律写在本仓库**（`/Users/zhifengleng/workspace/github/cmd-shift-l`），不要写入 `deepseek-harness`。
- **文档一律使用中文**；API 名、命令、代码标识符保持英文。
- `deepseek-harness` 仅作 API 与组合方式的只读参考。

## 文档

- [工作区代码搜索设计](docs/specs/2026-09-29-workspace-code-search-design.md)
- [工作区代码搜索实现计划](docs/plans/2026-09-30-workspace-code-search.md)

## Bundle

排障与兼容矩阵见 [`@dsh-plugin/cmd-shift-l`](packages/cmd-shift-l/README.md)。

### 安装

```bash
dsh plugin --profile web add @dsh-plugin/cmd-shift-l
```

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

> 包需已发布到 npm；未发布时 `add` 会 404。

### UI 入口（仅此两处）

- 右侧栏顶栏（`+` 与分栏之间）的放大镜
- 快捷键：Desktop `Cmd/Ctrl+Shift+F`；Web `Cmd/Ctrl+Shift+L`

不在 files / document 路径栏或工具条再挂第二个放大镜。
