# 工作区搜索：分腿进度与流式结果 — 设计说明

一句话：Client 并行调用文件 / 符号 / 内容三腿 Remote，谁先完成谁先刷分区；内容腿流式推送进度与软 ETA；改词立即取消旧搜。

日期：2026-09-30  
状态：已实现  
范围：`@dsh-plugin/cmd-shift-l` 搜索弹窗与相关 Host/Client Remote（不改 Agent 整包 `search` 语义）

约定：本仓库文档一律中文。标识符、API 名、命令与代码片段保持英文原文。

## 问题

当前 UI 一次调用整包 `Remote.search`，Host 内 `Promise.all` 等齐文件 / 符号 / 内容后才返回。符号与文件往往已结束，仍被内容（rg）拖住，弹窗长期停在「搜索中…」，用户不知道搜到哪、何时大致结束。

## 目标

- 分腿先出结果：某一腿结束即更新对应分区（符号可先于内容出现）。
- 细粒度进度：页脚展示各腿状态；内容腿展示匹配数、路径提示、软 ETA（「约」）。
- 改词即取消：新查询 abort 全部在途腿，清空结果后再填，不闪旧结果。
- 保留整包 `search`：供 Agent / 工具使用；模态框 UI 不再走该路径。

## 非目标

- Host 统一 job 事件总线（曾评估为方案 1，未采用）。
- 硬倒计时条或保证单调递减的 ETA。
- 分区拖拽排序、无限滚动、搜索历史、子目录作用域选择器。
- 改变 Agent 工具侧整包 `search` 的请求/响应契约。
- 在 UI 内一键 `codegraph init`。

## 决策摘要

| 项 | 选择 |
|----|------|
| 总体路径 | 方案 2：Client 三腿并行 Remote |
| 结果呈现 | 分腿流式出结果 + 细进度 |
| 「何时结束」 | 软 ETA（速率估算，文案「约」） |
| 改词 / 取消 | 改词立即 abort 旧搜并清空 |

## 架构

### Remote（UI 路径）

对浏览器拆成三腿（请求体仍无 `root`，由 `workspaceFileScope` 解析）：

| 方法 | 语义 |
|------|------|
| `searchFiles(scope, { query, … }, signal)` | 返回 `{ hits, truncated, error? }`；合并 codegraph 与 rg `--files`（沿用现有文件编排） |
| `searchSymbols(scope, { query, … }, signal)` | 符号 hits；worker 内 SQLite |
| `searchContent(scope, { query, … }, signal)` | **流式**：进度帧 + 最终结果帧（见下） |

整包 `search(scope, request, signal) → SearchResult` **保留**，内部仍可 `Promise.all`；仅 UI 改走三腿。

### 内容腿流式帧

内容使用 Typert `@Remote({ mode: 'stream' })`（或本仓库已验证的等价流式 Remote）：

1. **progress**（节流 ≥150–250ms）：`matched`、可选 `pathHint`、可选速率相关计数；Client 据此算软 ETA。
2. **result**（最后一帧）：`{ hits, truncated, error? }`。

Host 侧 rg 改为增量解析 `--json` stdout；`signal` abort 时杀掉子进程。

### Client `SearchRequestController`

1. debounce（默认 250ms）后发起；空查询 / 无启用种类 → 不发 Remote，清空状态。
2. 改词 → `abort()` 共享 `AbortController` → 新 seq → 清空三分区与进度 → `searching=true`。
3. 按开关并行发起启用的腿（同一 `signal`）。
4. 任一腿完成 → 只写入该分区；过期 seq 丢弃。
5. 全部结束或 abort → `searching=false`。
6. Client failsafe：整次作业上限 `searchTimeoutMs + 5_000`（可配置，默认如此），防止 Remote 挂死。

### 状态模型

```text
legs: {
  file:    idle | running | done | error
  symbol:  idle | running | done | error
  content: idle | running | done | error
           + optional progress { matched, pathHint, etaSec? }
}
partial: { files[], symbols[], content[], truncated, errors? }
```

## 进度文案、软 ETA、超时

### 页脚

| 情形 | 行为 |
|------|------|
| 部分腿进行中 | 分腿状态文案（完成短标 / 进行中省略），走 locale |
| 内容有 progress | 追加「匹配 N · 约 Mm Ss」；有路径则截断展示 |
| 样本不足 / 速率过低 | 只显示「内容…」，不编造 ETA |
| 全部完成 | 清除忙碌文案；若 `truncated` 显示截断提示 |
| 某腿超时/错误 | 分区级错误；其它分区结果保留 |
| 改词 abort | 立刻清空三区与进度 |

### 软 ETA（仅内容腿）

- 主信号：滑动窗口（约最近 2–3s）内 `matched` 增速，估算距 `limitPerKind` 的剩余秒数。
- 若 Host 提供 `filesScanned` 且能估计总量，可辅以扫盘进度；否则不把「扫完」当作必达终点。
- `matched === 0` 或窗口样本不足：不显示具体秒数。
- 文案前缀「约」；允许跳变；不保证单调。
- 不做硬倒计时条。

### 超时

- 每腿 Host `searchTimeoutMs`（默认 10s）：超时只失败该腿。
- Client 整次 failsafe 防止永久「搜索中」。
- 关模态 / `dispose` → abort 在途腿。

## UI 分区与打开行为

- 开关关闭的种类：不发起 Remote，不渲染分区。
- `running`：标题旁「…」；可先空列表。
- `done` 有 hits：立即渲染该段。
- `done` 无 hits：不占位（除非有分区错误）。
- 「无结果」仅当**所有启用腿均已结束**、合计 0 条、且无全局错误时显示。
- `flattenHits` 顺序：文件 → 符号 → 内容；后到腿插入后，尽量保持当前选中命中，否则夹到合法下标。
- 文件 / 符号腿 `done` 后即可点开该段 hits。内容 hits 仅在终帧 `result` 到达后出现并可点开（`progress` 帧不含 hits，避免半截列表）。
- ↑↓ / Enter / 点击 → `openResource`（可带行号）并关模态。
- Escape / 点遮罩：关模态并 abort。

## 错误与降级

- codegraph missing：文件/符号腿行为与现网一致（文件可走 fs 回退）；横幅不变；内容不受阻。
- 单腿错误写入 `errors.file|symbol|content`；不清空其它腿结果。
- 流式中途 abort：不把部分内容当成最终成功态写回新 seq。

## 测试要点

- Client：三腿并行时符号先 resolve → UI 已有符号、内容仍 `running`；改词 abort 后旧回调不写回。
- Client：「无结果」不在内容仍 running 时出现。
- Host：内容流至少一帧 progress + 终帧 result；abort 杀掉 rg。
- 软 ETA：样本不足时不显示具体秒数。
- 回归：整包 `search` 仍返回完整 `SearchResult`（工具路径）。

## 实现边界

| 改 | 不动（本设计） |
|----|----------------|
| `api` Remote 面与 schemas | Agent 整包 `search` 语义 |
| `orchestrate` 抽出可复用的单腿函数 | dock 按钮安装逻辑 |
| `grep` 增量 JSON + 进度回调 | codegraph worker 协议大改 |
| `search-controller` / `SearchModal` / locales | 新可视化主题 |

## 验收标准

1. 同时开启符号与内容时，符号分区在内容腿结束前即可出现（不再被整包 `Promise.all` 挡住）。
2. 内容搜索期间页脚可见分腿状态；有足够样本时出现「约」ETA。
3. 连续改词不会把旧查询结果刷进新查询。
4. 关弹窗或改词后，Host 侧 rg 进程被取消（可测 abort / 无泄漏）。
