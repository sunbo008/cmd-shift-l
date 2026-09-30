# 发布到 npm

单包发布（与 [DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) 相同）：根目录即 `@dsh-plugin/cmd-shift-l`。

```bash
pnpm install
pnpm build
pnpm publish --access public
```

`prepublishOnly` 会再跑一遍 `build`。发布前确认 `lib/` 已更新并（若走 github 安装）已提交。

用户也可不经 npm，直接：

```bash
dsh plugin --profile web add github:sunbo008/cmd-shift-l
```

github 安装使用仓库内已提交的 `lib/`，不执行 `prepare`，Windows / macOS 均无需改 `allowBuilds`。
