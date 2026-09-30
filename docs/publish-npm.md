# 发布到 npm

单包发布（与 [DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) 相同）：根目录即 `@dsh-plugin/cmd-shift-l`。

```bash
pnpm install
pnpm build
pnpm publish --access public
```

用户也可不经 npm，直接：

```bash
dsh plugin --profile web add github:sunbo008/cmd-shift-l
```
