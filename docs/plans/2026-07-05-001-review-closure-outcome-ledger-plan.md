---
doc_role: implementation-plan
plan_date: 2026-07-05
status: draft
origin: docs/项目审查/2026-07-05-系统性项目审查与优化方案.md
referenced_reviews:
  - review: docs/项目审查/2026-07-05-系统性项目审查与优化方案.md
    addresses_findings:
      - P0-outcome-evidence-insufficient
      - P1-evaluation-harness-aspirational
      - P1-user-friction-data-missing
freshness: current-worktree
---

# Outcome Ledger MVP 计划

## Goals

- 建立最小 dogfood outcome ledger，记录真实 `spec-*` workflow run 的输入、产物、验证、摩擦、残余风险和后续返工。
- 将 Evaluation Harness 从“contract/fixture shape 在场”推进到“有真实运行样本可复盘”。
- 为后续 LLM-as-judge、blind doc-review 或 artifact quality scoring 提供事实地板。

## Non-Goals

- 不让脚本判断 workflow 是否语义成功。
- 不要求一次性覆盖所有 host 或所有 workflow。
- 不把 outcome ledger 作为阻断用户工作的硬 gate。

## Implementation Units

| Unit | Scope | Source Files | Verification |
| --- | --- | --- | --- |
| U1 | 定义 ledger schema 与 authority 分级 | `docs/contracts/workflows/` 或 `src/cli/contracts/**` | schema/doc contract test |
| U2 | 记录 10 条 dogfood run 样本 | `docs/validation/` 或 `.spec-first/workflows/` 约定路径 | 手工审计 + path contract |
| U3 | 增加 summary report | `docs/validation/` | `git diff --check` |
| U4 | 抽样 doc/code review 复核 3 条 run | review artifact docs | finding 与 ledger 回链 |

## Acceptance

- 至少 10 条样本区分 `passed/failed/degraded/not_run`。
- 每条样本记录 `workflow`、`input_type`、`artifact_paths`、`verification_evidence`、`friction_points`、`followup_required`。
- 报告明确哪些结论是 confirmed，哪些只是 advisory。

