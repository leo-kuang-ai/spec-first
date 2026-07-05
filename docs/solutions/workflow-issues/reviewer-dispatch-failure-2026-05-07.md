---
title: "reviewer dispatch failure during spec-doc-review fallback (2026-05-07)"
type: solution
category: workflow-issues
date: 2026-05-07
status: open
problem_type: workflow_issue
component: spec-doc-review
severity: medium
applies_when:
  - "reviewer dispatch fails because the host gateway rejects large context or concurrent subagent calls"
  - "a doc-review workflow must fall back to single-agent report-only review without losing findings"
related_plan: docs/plans/2026-05-07-001-feat-skill-agent-quality-governance-plan.md
related_tracker: docs/plans/2026-05-08-001-source-code-deferred-tracker.md
tracker_entry: dispatch-failure-1
---

# reviewer dispatch failure during spec-doc-review fallback

## Symptom

2026-05-07 在 Claude Code (Opus 4.7 1M context) 宿主下执行 `spec-doc-review` 评审 `docs/plans/2026-05-07-001-feat-skill-agent-quality-governance-plan.md`。一次性并行 dispatch 6 个 reviewer agent（spec-coherence-reviewer / spec-feasibility-reviewer / spec-scope-guardian-reviewer / spec-adversarial-document-reviewer / spec-product-lens-reviewer / spec-security-lens-reviewer），全部失败：

- 3 个返回 `API Error: 400 {"error":"1m 上下文已经全量可用，请启用 1m 上下文后重试","type":"error"}`
- 3 个返回 `API Error: 500 Panic detected, error: runtime error: invalid memory address or nil pointer dereference`（来自 `Calcium-Ion/new-api` 网关）

无 reviewer 返回 findings。fallback 触发：按 spec-doc-review SKILL.md 的 dispatch capability gate 规则，切换到 single-agent report-only fallback，由 orchestrator 内联完成 6 类 persona checklist 审查。

## Context

- 宿主：Claude Code，模型 `claude-opus-4-7[1m]`
- 网关：`Calcium-Ion/new-api`（中转 API）
- 父任务上下文较大（已加载 plan + 两份 review report + skill template + schema + decision primer）
- dispatch 时未指定 `model` override；默认走父 agent 当前模型

## Likely Root Causes

待 reviewer 恢复后正式验证。当前假设：

1. 上下文超过 200K 默认窗口但未 enable 1m，导致部分 dispatch 命中 400。
2. 网关侧 panic：`nil pointer dereference` 是网关 bug，不是 Anthropic 上游问题；可能与 1m context 路由分支有关。
3. 6 个并发 dispatch 同时上下文很大，网关并发处理崩溃。

## Workaround Used This Session

按 spec-doc-review fallback 协议执行 single-agent report-only 审查，输出 13 条 finding（P1×6 + P2×5 + P2-Security×2 + FYI×3）。fallback 在父计划 `## Review Reception` 第 1 轮明示。

## Guidance

- reviewer dispatch 失败时，不等待不确定的网关恢复；按 `spec-doc-review` 的 fallback 协议切换到 single-agent report-only。
- fallback 输出必须明确标注能力降级来源、未执行的 multi-persona cross-check，以及需要后续重跑的 trigger。
- 如果失败信号来自上下文窗口或网关 panic，下一轮优先缩小 subagent prompt 输入，并让 reviewer 自行读取 source 文件。

## Why This Matters

doc-review 的价值来自可追溯的 findings，而不是强依赖某一种 dispatch 机制。把 fallback 作为显式 workflow 行为，可以在宿主能力不稳定时保住审查闭环，同时避免读者误把单 agent 输出当成多 reviewer 共识。

## When to Apply

当 reviewer agent 全部失败、部分失败但无可信 findings、或宿主网关对大上下文并发 dispatch 不稳定时，使用这条记录作为降级处理参考。若至少有足够的独立 reviewer findings 返回，优先合并真实 reviewer 输出，而不是直接降级。

## Examples

```text
dispatch result: 6 reviewer agents failed
fallback: single-agent report-only
required disclosure: dispatch failure reason + residual multi-persona rerun action
```

## Followup Actions

- 在网关恢复正常 1m + 多并发 dispatch 后，对父计划重做一轮 multi-persona cross-check（tracker entry `review-rerun-1`）。
- 排查上下文使用：审查时是否可避免把 subagent template + schema 全文塞 prompt（让 subagent 自行 Read），降低单次 dispatch 上下文。
- 若网关 500 持续：报告 `Calcium-Ion/new-api` issue 或暂时切换网关。
- 在父计划 Risks 表追加 "reviewer dispatch 失败 → fallback" 行（已应用；父计划当前 revision 3 保留该风险行）。

## Lessons

- spec-doc-review 的 fallback 协议工作良好：findings 没有丢，只是降级了交叉验证。
- 多 persona dispatch 失败不应阻塞整个 workflow；fallback 优先于干等。
- fallback 输出必须显式标 "single-agent report-only fallback"，避免读者误把单 orchestrator 输出当 multi-persona 共识。
