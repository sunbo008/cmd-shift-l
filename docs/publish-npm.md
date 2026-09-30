# 发布到 npm

本文说明如何把本仓库的 Bundle 发到 [npm](https://www.npmjs.com)，让用户可以这样安装：

```bash
dsh plugin --profile web add @dsh-plugin/cmd-shift-l
```

只推 GitHub **不够**：`dsh plugin add @scope/name` 走的是 registry；用户不会从本仓库源码树自动拿到已构建的 `lib/`。

日常用户更推荐直接 [从 GitHub 安装](../README.md#安装推荐github)（根目录 Bundle，无需 npm）。根包对子包使用 `github:sunbo008/cmd-shift-l#path:packages/…`，以便 profile 侧 git 安装能解析 monorepo 子包；本仓库内由 `pnpm-workspace.yaml` 的 `overrides` 改回 `workspace:*`。

## 要发布的包

入口包是 **`@dsh-plugin/cmd-shift-l`**（**仓库根目录**，含 `dsh.bundle`）。  
它依赖同仓库其它包，因此 **至少发布下面整组**（版本需对齐，当前均为 `0.1.0`）：

| npm 包名 | 目录 |
|----------|------|
| `@dsh-plugin/workspace-code-search` | `packages/workspace-code-search` |
| `@dsh-plugin/workspace-code-search-codegraph` | `packages/workspace-code-search-codegraph` |
| `@dsh-plugin/workspace-code-search-content` | `packages/workspace-code-search-content` |
| `@dsh-plugin/api-workspace-code-search` | `packages/api-workspace-code-search` |
| `@dsh-plugin/client-ui-workspace-code-search` | `packages/client-ui-workspace-code-search` |
| `@dsh-plugin/cmd-shift-l` | 仓库根（`package.json`） |

根目录即入口包，**需要**随同组一并发布（`pnpm -r publish` 默认不含根包，脚本里另有 `pnpm publish`）。

仓库内依赖使用 `workspace:*`；用 **pnpm 递归 publish** 时会改写成真实版本号写入 registry 元数据。

## 前置条件

1. **npm 账号**且已登录：

   ```bash
   npm login
   npm whoami
   ```

2. **`@dsh-plugin` scope 权限**  
   - 在 npm 创建或加入组织 `dsh-plugin`，并对上述包有 publish 权限。  
   - 无权限会 `403`。也可改用你有权限的 scope（同时改全部 `package.json` 的 `name` 与文档）。

3. **scoped 包公开发布**  
   六个可发布包均已声明：

   ```json
   "publishConfig": {
     "access": "public"
   }
   ```

   发布命令仍建议带 `--access public`，与之一致。

4. **本机已能构建**（根与 `packages/*/lib/` 在磁盘上存在；`lib/` 被 gitignore，但 `npm pack` / publish 仍会按 `files` 打进 tarball）。

## 发布步骤

在仓库根目录执行：

```bash
cd /Users/zhifengleng/workspace/github/cmd-shift-l

# 1. 依赖
pnpm install

# 2. 干跑（会先 build；不上传）
pnpm run publish:dry-run

# 3. 正式发布（需已 npm login，且对 @dsh-plugin 有权限）
pnpm run publish:packages
```

脚本定义在根 `package.json`：`publish:dry-run` / `publish:packages`（均含 `build`、工作区 `-r publish` 与根包 `pnpm publish`）。

说明：

- `-r`：递归发布 `packages/*` 中非 private 工作区包。  
- 随后的 `pnpm publish`：发布根入口 `@dsh-plugin/cmd-shift-l`。  
- `--access public`：scoped 包对匿名用户可见。  
- **同版本不可覆盖**：已发布过的 `0.1.0` 再发会失败，需先改各包 `version`（保持一致）再发。

### 只检查根包的 tarball 内容

```bash
pnpm pack
tar -tzf dsh-plugin-cmd-shift-l-0.1.0.tgz | head
# 确认含 cordis.patch.yml、locale、lib/index.js 等
```

Client 包还应确认含 `lib/client.js`（浏览器半侧）。

## 发布后验证

```bash
npm view @dsh-plugin/cmd-shift-l version
npm view @dsh-plugin/cmd-shift-l dependencies

# 装进 profile（示例 web）
dsh plugin --profile web remove @dsh-plugin/cmd-shift-l   # 若以前是 link，先卸掉
dsh plugin --profile web add @dsh-plugin/cmd-shift-l

# 重启 dsh 后再看功能
dsh --profile web web
```

## 升版再发

1. 同步提高 **全部 6 个包** 的 `version`（例如 `0.1.0` → `0.1.1`），含根 `package.json`。  
2. `pnpm install`（刷新 lockfile）。  
3. `pnpm build` → `pnpm run publish:packages`。  
4. 更新 [README](../README.md) / [Bundle 说明](bundle.md) 中如有写死的版本说明。  
5. git tag（可选）：`git tag v0.1.1 && git push --tags`。

可用 `pnpm -r exec npm version patch --no-git-tag-version` 批量改 `packages/*`，再手改根 `version`（发布前再检查一遍）。

## 常见失败

| 现象 | 处理 |
|------|------|
| `ENEEDAUTH` / need auth | `npm login` |
| `403` Forbidden | 无 `@dsh-plugin` 权限，或未 `--access public` |
| `cannot publish over existing version` | 升 `version` 后再发 |
| 用户 `add` 后 `failed to import` | 发布前未 `pnpm build`，或 `files`/`exports` 漏了 `lib/` |
| 用户装上缺依赖 | 未发布全部 6 个包，或 `workspace:*` 未正确改写（应用 `pnpm -r publish` + 根 `pnpm publish`） |
| Client 半侧空白 | 确认 `client-ui` 的 `lib/client.js` 进了 tarball |

## 与 GitHub 安装的关系

| 方式 | 命令 | 何时用 |
|------|------|--------|
| **GitHub（推荐）** | `dsh plugin add github:sunbo008/cmd-shift-l` | 默认；根目录 Bundle |
| npm | `dsh plugin add @dsh-plugin/cmd-shift-l` | 已 publish `@dsh-plugin` |
