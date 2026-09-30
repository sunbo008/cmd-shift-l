# 架构审查报告

## 概述

**审查目标**: `docs/specs/2026-09-29-workspace-code-search-design.md`  
**审查类型**: 设计文档  
**审查规模**: 小规模（~216 行，1 文件）  
**聚焦维度**: SEC, PERF, REL, DATA, API, QUAL, CONS, ROB, DR  
**语言专项**: 无（非 C++）  
**写作专项**: plan-deai（已通过）  
**总轮次**: 7  
**收敛状态**: 已收敛（`C-STABLE-EXIT`；round=7；R6–R7 零 CRITICAL/WARNING；`coverage_diff=[]`）

## 领域研究简报 (Phase 0)

- **文档类型**: design_spec  
- **技术领域**: IDE 工作区搜索 UX、符号索引+grep 混合检索、Abortable 并发、Cordis/dsh 外部 bundle、peer 兼容  
- **联网状态**: web_access=available，来源约 12  

要点：search-as-you-type 需 debounce + Abort + 序列守卫；peer 窄范围 fail-closed；v1 跳过 stale 有体验风险。

## 维度覆盖

| 维度 | 状态 |
|------|------|
| SEC / PERF / REL / DATA / API / QUAL / CONS / ROB | 已覆盖 |
| DR | 已覆盖（Phase 0） |
| AIPM / ESC / ALOOP / IPLAN | N-A（非 AI Skill / Agent Loop / 实现计划；目标为产品设计说明） |
| 语言专项 | N-A（无 C++） |
| rob-scan | 跳过（设计文档，无 tests/ 实现树；`C-HARNESS-NO-LINT`） |

## 已修复的关键问题

| 严重度 | 问题 | 修复 |
|--------|------|------|
| CRITICAL | Remote 可传 `AbsolutePath root` | Remote 去掉 `root`；Host 从 Session 解析 |
| CRITICAL | `ReadonlySet` 线传不可序列化；`limit` 与「每类 limit」矛盾 | 改为 `readonly ...[]`；`limitPerKind?` + Config 钳制 |
| WARNING | 仅 Abort、无序列守卫 | debounce + AbortController + issued/rendered seq |
| WARNING | stale 风险未写清；分区失败无契约 | 文档化过期风险；`errors` 分区字段 |
| WARNING | Session 切换残留；preview XSS；两腿并发未定 | 关窗 abort；纯文本渲染；并行 + 单 in-flight |
| WARNING | `status` 时机 / `errors.codegraph` UI | 开窗拉 status；横幅承接 codegraph 错误 |

## 改进建议（未自动改范围外项）

- 文件区排序实现时优先路径分量/前缀，避免纯字母 fuzzy 噪声。  
- 用户文档标明与 VS Code `Cmd/Ctrl+Shift+F` 语义差异。

## 写作 gate（DEAI）

已补一句话概括；去掉正文粗体与「粗体标题列表」；目标词/因果自证未命中。通过。

## 约束门控

- round_index: 7  
- coverage_diff: []  
- findings_fingerprint: `d29a0939bcb51176`（R6/R7 空发现）  
- constraints_checked: [C-ROUND-MIN, C-STABLE-EXIT, C-COVERAGE-DIFF, C-DEAI-GATE, C-NO-SELF-EXIT]  
- escape_violations: 0  

## 下一步

按本设计写实现计划（`docs/**/plans/`），再进入分包实现。
