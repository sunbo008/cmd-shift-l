# @dsh-plugin/cmd-shift-l

外部可安装的 dsh Bundle：在 Web / Desktop 提供统一工作区搜索弹窗（文件 / 符号 / 内容）。

**不进入** dsh 内置 `OPTIONAL_BUNDLES` 或默认 profile；需显式安装到目标 profile。

## 兼容矩阵

| 组件 | 已测 / 声明范围 |
|------|----------------|
| Node | `^22.19.0 \|\| >=24.0.0`（与本仓库 `engines` 一致） |
| `@deepseek-ai/cordis` | `~4.0.4`（peer；实现时对照本机已装 dsh） |
| dsh | `>=0.1.0-rc.0`（声明区间；以你本机安装的 dsh 实测为准） |
| 系统 `rg`（ripgrep） | 内容搜索需要；缺失时内容区报 `errors.content`，文件/符号仍可用 |
| codegraph 索引 | 可选；缺 `.codegraph/codegraph.db` 时文件/符号降级，内容不受影响 |

不要把 `allow-version` / 强制跳过 peer 检查当作常规安装路径。

## 安装

```bash
dsh plugin --profile <name> add @dsh-plugin/cmd-shift-l
```

启动：

```bash
dsh --profile <name> web
# 或
dsh --profile <name> desktop
```

包需已发布到 npm；未发布时 `add` 会找不到包。维护者发布步骤见仓库 [docs/publish-npm.md](../../docs/publish-npm.md)。

## 恢复 / 卸载

- 在 Plugins 管理页关闭本 Bundle；或
- `dsh plugin --profile <name> remove @dsh-plugin/cmd-shift-l`

关闭后快捷键、顶栏放大镜与 Remote 一并消失。

## 使用说明

- **UI 入口**：右侧栏顶栏（`+` 与分栏之间）放大镜；**不**再注册 files / document 工具条上的第二个放大镜。
- 快捷键：Desktop `Cmd/Ctrl+Shift+F`；Web `Cmd/Ctrl+Shift+L`（id：`workspace.codeSearch`）。
- **快捷键冲突调查（Web）**
  | 组合 | 结论 |
  |------|------|
  | `Shift+F` | 撞 dsh `session.fork`（分叉会话） |
  | `Alt+F` | 撞 Chrome「Search the web」 |
  | `Shift+H` | 撞 Chrome 主页 / macOS Finder「个人文件夹」 |
  | `Shift+L`（选用） | Chrome 官方未占用；dsh 无同键。已知冲突：Safari 显示/隐藏侧栏、Bitwarden 自动填充（扩展，可在 `chrome://extensions/shortcuts` 改） |
- **与 VS Code 的差异**：VS Code 的 `Cmd/Ctrl+Shift+F` 打开侧栏全文 Search；本产品 Desktop 同键打开统一三态弹窗，Web 用 `Shift+L`。以快捷键参考为准。
- 无活动 Session / 无 workspace cwd：快捷键为 blocked / no-op，不打开弹窗。
- 打开弹窗时拉取一次 codegraph `status()`；缺索引时显示「在工作区运行 `codegraph init`」类横幅；内容搜索仍可用。
- **索引过期风险（v1）**：能打开 `.codegraph/` 即报 `ready`，不做 stale 检测。编辑后文件/符号/行号可能漂移；需要时重建索引。文案见 Client locale `codegraphStaleHint`。

## 已知限制

- **入口**：右侧栏顶栏（`+` 与分栏之间）portal 放大镜；快捷键见上文。顶栏 dock strip 无正式 Cordis slot，portal 依赖 `data-dockkit-strip-*` 标记。
- **Session / cwd 变更关窗**：若 Host 暴露 `sidebarRight.mounted` 或 `sessions.activeWorkspaceRoot` 可订阅快照，切换时关闭弹窗并 abort；否则依赖再次打开时按新 Session 解析 root。
- **Host grep**：内容搜索走 Host 侧 `rg`；无 `rg` 时内容区失败，文件/符号不受影响。
- **SQLite**：codegraph Provider 使用 Node 内置 `node:sqlite` 只读打开索引；无需 `better-sqlite3` 原生编译。
- Client / Host Typert 描述符目前为手写（`./typert` + `./remote`）；完整 codegen 可后续对齐 harness 流程。Client UI 在 apply 时 `$mount` Remote，并按 `sessions.list` 主视图 Session 的 `cwd` 解析作用域。
- **文件分区**：codegraph 优先；索引就绪时再合并 `rg --files` 路径匹配，以覆盖 codegraph 未收录的类型（例如本仓库索引中无任何 `.md`）。无 codegraph 时文件/符号仍为空并显示横幅。
- 本仓库 vitest 覆盖 Providers / Service / Remote / Client 取消三件套 / Bundle patch；全 GUI 安装冒烟见上方清单，需在已装 dsh 的环境手工执行。

## 启动日志（排障）

`pnpm dsh web` 的终端输出即 Host 加载日志。本 Bundle 相关常见行：

| 日志 | 含义 |
|------|------|
| `disabling profile plugin row "api-workspace-code-search": ... peerDependencies ... typert-protocol` | Remote 被兼容性预检禁行；对齐 `peerDependencies` 到当前 dsh（现为 `~0.2.0-rc.2`）后重建重启 |
| `client-ui-workspace-code-search (...): failed to import` | Host 半侧 import 失败（常见原因：误把带 CSS 的 Client 半侧当 Host 入口）。应只加载空 `apply` 的 `lib/index.js`，浏览器半侧为 `lib/client.js` |
| `warning: 1 entry did not activate` | 上两条之一导致条目未激活；快捷键不会注册 |
| 快捷键无反应、无 toast | 常见：无主视图 Session / 无 `cwd`（resolve 返回 blocked）；或 Client 未 `$mount` `workspaceCodeSearch`（打开弹窗即崩）。确认终端无禁用行，且已有带 cwd 的活动会话 |

改完后须**重启** `pnpm dsh web`（仅刷新浏览器不够）。启动成功时不应再出现上述禁用 / failed to import 行。

## 组成包

| 包 | 职责 |
|----|------|
| `@dsh-plugin/workspace-code-search` | Service 定义与编排 |
| `@dsh-plugin/workspace-code-search-codegraph` | 文件 + 符号 Provider |
| `@dsh-plugin/workspace-code-search-content` | 内容 grep Provider |
| `@dsh-plugin/api-workspace-code-search` | Session 作用域 Typert Remote（线传无 `root`） |
| `@dsh-plugin/client-ui-workspace-code-search` | 弹窗、顶栏放大镜、快捷键、locale、取消三件套 |

## 冒烟清单

1. 安装 Bundle 并启动 profile；确认终端无 `failed to import` / `disabling ... api-workspace-code-search`。
2. 有 Session 时：顶栏仅一个放大镜；Desktop `Cmd/Ctrl+Shift+F`，Web `Cmd/Ctrl+Shift+L` 打开弹窗。路径栏 / document 工具条不应再出现搜索图标。
3. 无 codegraph：内容可搜；文件/符号区空 + 横幅。
4. 有索引：文件/符号有命中；点击结果在右侧 Sidebar 打开（含行号时跳行）。
5. 快速连续输入：无迟到结果闪烁；Abort 不进错误横幅。
