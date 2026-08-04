---
title: spec-plan 治理头部 capability 清单与 keep/extract/remove 矩阵
date: 2026-06-11
category: docs/solutions/architecture-patterns
module: spec-plan
problem_type: architecture_pattern
component: workflow_prompt_governance
severity: medium
type: architecture-pattern
spec_id: 2026-06-11-004-spec-plan-skill-slimming
plan: docs/plans/2026-06-11-004-refactor-spec-plan-skill-slimming-plan.md
status: U1 deliverable
applies_when:
  - "workflow skill 的治理头部 prose 膨胀且跨节点重复"
  - "需要决定某段 prose 应 keep、extract 还是 remove"
  - "要把 prompt 收束从审美判断改为 consumer/eval/runtime-carrier 证据"
tags: [spec-plan, governance-header, prompt-slimming, architecture-pattern, runtime-copied-reference, ablation]
---

# spec-plan 治理头部 capability 清单(U1)

## Context

范围:`skills/spec-plan/SKILL.md` 治理头部 **L17-101(85 行 / 10.6KB)**。本清单是 U3(绑能力测试)与 U4/U5(抽取/删除)的事实底座。实现载体已按计划修订收敛为 `skills/spec-plan/references/governance-boundaries.md`,因为现有 Claude/Codex projection 会递归复制 `skills/spec-plan/**` 到终端 runtime。

## Guidance

判定规则:
- **KEEP** = 有可验证消费者(lint / hook / audit / router 机读其内容)。
- **EXTRACT** = 无消费者 + 跨 skill 重复 + 非全局层冗余(语义须随共享载体投影到终端)。
- **REMOVE** = 无消费者 + 全局层冗余 + clean-room 证明模型先验在终端运行时仍可复现(本轮无一满足——见下方"收敛结论")。

## 裁决矩阵

| 节 | 行号 | 行数 | owner_consumer | cross_skill | global_dup | ablation | 裁决 |
|---|---|---|---|---|---|---|---|
| Plan-Only Safety Contract | 17-24 | 8 | **`spec-plan-guard` hook**(运行时注意力增强,非硬阻断)+ hot-path contract test | 1/37(独有) | 否(003 owns) | — | **KEEP** |
| Workflow Contract Summary | 25-57 | 34 | **`lint-skill-structure.js` REQUIRED_SECTIONS**(When To Use/When Not To Use/Outputs/Workflow=P1;Inputs/Failure Modes=P2)+ retired-skill-review | 18/37 | 否 | — | **KEEP**(内联;各 skill 内容不同) |
| Scenario Capability | 59-62 | 5 | retired-skill-review + 指向 `scenario-capability-matrix.md` | 18/37 | 否 | — | **KEEP**(已是引用范式) |
| Context Orientation Anchor | 64-70 | 8 | 无 | 4/37 | 否(intake 顺序不在全局) | 6-run A/B 弱/null(两臂都正确降级 graph/mirror;A 臂更明确 intake order) | **EXTRACT** |
| Domain Language And Decision Ledger | 72-76 | 6 | 无 | 6/37 | 否(决策账本不在全局) | 未决(未完成 formal backlog) | **EXTRACT** |
| Runtime Context Exclusion | 78-80 | 4 | 无 | 7/37 | **是**(CLAUDE.md L234 逐字) | 仓内 NULL(全局泄漏;未 clean-room) | **EXTRACT**(收敛,见下) |
| Cache-Friendly Context Layout | 82-86 | 6 | 无 | 3/37 | 否(context-bundle/稳定前缀不在全局) | 未决(未完成 formal backlog) | **EXTRACT** |
| Summary-First Handoff | 88-92 | 6 | 无 | 4/37 | 否(artifact-summary 先读不在全局) | 未决(未完成 formal backlog) | **EXTRACT** |
| Recall Trust Boundary | 94-96 | 4 | 无 | 3/37 | **是**(CLAUDE.md L63 核心同款) | 弱效果(非 null) | **EXTRACT** |
| Capability-Class Evidence Boundary | 98-100 | 4 | 无 | 3/37 | 部分(advisory 同族,provider 特化不在全局) | 判定未决(任务混淆) | **EXTRACT**(特化语义须载体) |

合计:**KEEP 3 节(47 行)/ EXTRACT 7 节(38 行 ≈ ~4KB)/ 确认 REMOVE 0 节。**

## 收敛结论:remove 档基本塌缩为 extract

「REMOVE」三候选(Runtime Context Exclusion / Recall Trust Boundary / Capability-Class)经实测与运行时约束分析,**均不裸删安全**:

1. **终端运行时无其他载体**:终端用户 repo 无 spec-first `CLAUDE.md`,注入的 bootstrap 只含路由、无治理语义。一旦从 per-skill 删掉,终端运行时无人接住——除非模型通用先验可靠复现。
2. **spec-first 特化语义模型先验覆盖不到**:Runtime Context Exclusion(哪些目录是 generated mirror)、Capability-Class(`provider-untrusted`/readiness)是 spec-first 特化,clean-room 下通用先验大概率覆盖不了 → 必须由载体承载 = EXTRACT。
3. **通用语义 section 仍有锐化作用**:Recall Trust Boundary 首轮 ablation 显示弱效果(有节臂 skepticism-first vs 无节臂"先采纳再核")→ 仍值得 EXTRACT,不删。

故正确架构是:**7 个无消费者节全部 EXTRACT 到一个能投影到终端的渐进披露 runtime-copied reference;3 个有消费者节保留内联。** 本试点只改 `spec-plan`,跨重型节点(plan/work/code-review/debug)共用或复制引用是 follow-up。「裸删」仅在 clean-room 证明某节模型先验在终端可靠复现 *且* 全局冗余时才成立——本轮无一满足。

## KEEP 三节的消费链路(R6 守护对象,不得断)

- **Plan-Only Safety Contract** → `templates/claude/hooks/spec-plan-guard`(Claude `UserPromptExpansion` planning-only additionalContext,非硬阻断;Codex 侧为 prose 约束)。
- **Workflow Contract Summary** → `skills/retired-skill-review/scripts/lint-skill-structure.js` 的 `REQUIRED_SECTIONS`(P1/P2 机读校验);删任一子节产 audit finding。
- **Scenario Capability** → `docs/contracts/workflows/scenario-capability-matrix.md`(audit 据此判 capability)。

## 共享载体设计要求(U4 输入 + 001 复用接口)

- 目标:`skills/spec-plan/references/governance-boundaries.md`,渐进披露,`spec-plan` spine 用 `STOP. read ...` 引用一次。
- **必须随 command projection / `spec-first init` 投影到终端 runtime**(R4/R5);否则 EXTRACT 等于在终端丢治理。现有 `planDirectoryWithTransform` 递归复制 `skills/spec-plan/**`,可覆盖此载体;若后续改用 `docs/contracts/**`,必须先新增 generator/projection 机制。
- **必须设计得足够通用**,能承载 001(decision-surface-coverage)之后的 conditional 内容(surface-coverage lens / module model),不得做成只装治理 prose 的私有形态。

## 跨节点推广候选(follow-up,非本计划)

| 节 | 重型节点覆盖 | 推广形态 |
|---|---|---|
| Workflow Contract Summary / Scenario Capability | 18/37(plan/work/code-review/debug + 14) | 18-skill 一致性收束(各 skill 内容不同,统一结构与 lint) |
| 7 个 EXTRACT 节 | 主要在 plan(10)/work(8)/code-review(8)/debug(7) | 同一 governance-boundaries.md 被 4 节点共引 |

## orphan 检查

- 无 orphan capability:KEEP 3 节均有 consumer;EXTRACT 7 节均有迁移去向(共享 reference)。
- 无 orphan prose:L17-101 全部 85 行已归类(47 keep + 38 extract);无"待删但无归属"内容。
- 注:Phase 0.7 / 5.1.5 / 5.3 等对治理概念的 in-spine 引用不在本清单范围(它们是 workflow 步骤,非治理头部节);U4 抽取时若 spine 引用了被外置概念,须保留自包含定义避免孤儿引用。

## Why This Matters

治理头部收束如果只按行数或主观可读性操作,容易误删 hook/lint/audit 真正消费的契约,或把终端 runtime 需要的语义藏在不会投影的开发仓文档里。keep/extract/remove 必须同时看 consumer、ablation 结果和 runtime carrier。

## When to Apply

适用于重型 workflow skill 的头部治理 prose、跨 skill 重复边界、以及需要从 inline prompt 迁移到 runtime-copied reference 的场景。不适用于有明确机器消费者的契约节,也不适用于 workflow 主体步骤或用户可见行为尚未定义清楚的功能设计。

## Examples

- 有 lint/hook/audit 消费的 `Workflow Contract Summary`、`Plan-Only Safety Contract`、`Scenario Capability` 留在 spine。
- 无消费者但终端 runtime 仍需要的 context orientation、summary-first handoff、recall trust 等语义抽到 `skills/spec-plan/references/governance-boundaries.md`。
- 即使某节与全局 `CLAUDE.md` 重复,没有 clean-room null 和终端载体证据时也不裸删。
