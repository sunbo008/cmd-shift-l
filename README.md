# cmd-shift-l

外部可安装的 DeepSeek Harness（dsh）工作区代码搜索 Bundle。

根目录单包：`dsh.bundle` + Host/Client 同包，依赖只走 npm registry。仓库已提交预构建 `lib/`，git 安装不跑构建脚本，无需 `allowBuilds`。

## 安装

**必须**带 `#main`，避免 lock 钉死旧 commit：

```bat
dsh plugin --profile web remove @dsh-plugin/cmd-shift-l
dsh plugin --profile web add "github:sunbo008/cmd-shift-l#main"
```

装完后**完全退出再开** `dsh web`。lock 版本须为 **`0.1.5-two-remotes`**。

### 根因

Windows 曾可用（`971172e`）：Host/Client 都只有 **`status` + `search`** 两个 Remote。

`2070c42` 起在 **Host** 上又注册了 `searchFiles` / `searchSymbols` / `searchContent`（及曾有的 stream）。`385ac24` 只收窄了 Client `$mount`，**Host 侧多 Remote 仍在**——这就是「恢复 385ac24 仍卡」的原因。

**`0.1.5-two-remotes`**：Host 也收回只注册 `status`+`search`；Client 分腿仍用三次 `search({ kinds: [one] })`。

## UI 入口

- 右侧栏顶栏放大镜
- Desktop `Cmd/Ctrl+Shift+F`；Web `Cmd/Ctrl+Shift+L`

## 文档

- [设计说明](docs/specs/2026-09-29-workspace-code-search-design.md)
- [分腿进度设计](docs/specs/2026-09-30-search-progress-streaming-design.md)
- [实现计划](docs/plans/2026-09-30-workspace-code-search.md)
- [分腿进度实现计划](docs/plans/2026-09-30-search-progress-streaming.md)
- [发布到 npm](docs/publish-npm.md)

## 开发

```bash
pnpm install
pnpm test
pnpm build
```

改源码后请 `pnpm build` 并提交更新后的 `lib/`。
