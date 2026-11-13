---
title: "Boundary 落地措辞（U1/U2/U3/U4）"
type: archive
status: superseded
created: 2026-06-11
archived_at: 2026-06-14
superseded_by: docs/plans/2026-06-11-002-feat-project-graph-consumption-protocol-plan.md
archive_reason: "legacy plan-status backfill; retained as historical evidence only, not an active implementation plan"
---
# Boundary 落地措辞（U1/U2/U3/U4）

> Lifecycle: historical plan archive. This document is retained as historical evidence only and is not an active implementation plan.

英文为 authoritative（写入 skill/合同）；中文仅供审阅。落地前需 U1 先建合同 `docs/contracts/project-graph-consumption.md`。

## U1 — 合同正文：三层接力链承重句

```markdown
This relay is a trust-elevation direction, not a call-priority order. Trust rises from project-graph (advisory orientation — "where to look first") through code-graph / `rg` / ast-grep (tactical locating — "where exactly, connected to what") to source / tests / logs / docs (confirmed truth — "is it actually so"); the funnel narrows scope as trust rises. Any workflow may start directly at a lower layer — reading source first is always valid, and skipping project-graph is not a violation; whether to issue a project-graph query is an LLM judgment based on readiness facts and task shape. The one hard rule is no skip-layer elevation: a project-graph candidate must not enter a conclusion-tier claim without lower-layer confirmation.
```

中文：该接力是信任抬升方向，不是调用优先级顺序。信任自 project-graph（advisory 定向）经 code-graph/`rg`/ast-grep（tactical 定位）升至 source/tests/logs/docs（confirmed truth），漏斗随信任升高而收窄。任何 workflow 可直接从更低层开始（先读 source 永远合法，跳过 project-graph 不违规）；唯一硬规则是禁止跳层抬升。

## U3/U4 — 新四段：骨架 + 专属动词

```markdown
## Capability-Class Evidence Boundary

Follows `docs/contracts/project-graph-consumption.md`: `capability-class` candidates such as `code-graph` or `project-graph` are advisory only. Check `readiness_status` before use; {{SCOPE}}. Record used candidates as `provider_untrusted`, never-block on availability, keep setup-side `lifecycle.fallback_used` separate; fall back to direct source reads on missing/`unknown`/`unverified`/failure/disabled.
```

> 完整两档信任/stale 映射/fallback 枚举/接力链全在合同；本段只留 token 锚点 + 专属动词。

| Skill | 挂载点 | `{{SCOPE}}` (EN authoritative) |
|---|---|---|
| spec-work | `## Direct Evidence Boundary` 后 | `the basis for any change must be the plan/task/source/tests, never the candidate alone` |
| spec-prd | `## Invocation Boundary` 邻接 | `PRD conclusions must be re-grounded in source, and a candidate must never decide scope authority` |
| spec-brainstorm | `## Scenario Capability` 后 | `the WHAT must come from user dialogue and source confirmation, never the candidate` |
| spec-ideate | `## Dispatch Boundary` 邻接 | `option evaluation and the chosen direction must be re-grounded in source, never the candidate` |

## U2 — 既有三段：只改两处

对 `spec-plan`(governance-boundaries.md)、`spec-debug`、`spec-code-review` 既有 boundary 段：(1) 段首插入 `Follows \`docs/contracts/project-graph-consumption.md\`. `；(2) 整句替换旧 `If the capability is absent, stale, unknown, or unverified, continue with <原工具列表>.` 为下表句；其余不动。

| Skill | 替换句 (EN authoritative) |
|---|---|
| spec-plan | `A \`stale\` graph still serves exploration-tier orientation when you annotate that it lags HEAD, but conclusion-tier planning claims must be re-grounded regardless. When the capability is missing, when readiness facts are unavailable or self-reported as \`unknown\`/\`unverified\`, on call failure, or when disabled/unsafe, continue with bounded direct source reads, \`rg\`, ast-grep, tests/logs, and user evidence.` |
| spec-debug | `A \`stale\` graph still serves exploration-tier orientation when you annotate that it lags HEAD, but a root-cause conclusion must be re-grounded regardless. When the capability is missing, when readiness facts are unavailable or self-reported as \`unknown\`/\`unverified\`, on call failure, or when disabled/unsafe, continue with reproduction, direct source reads, \`rg\`, ast-grep, focused tests, probes, and logs.` |
| spec-code-review | `A \`stale\` graph still serves exploration-tier orientation when you annotate that it lags HEAD, but a review conclusion must be re-grounded regardless. When the capability is missing, when readiness facts are unavailable or self-reported as \`unknown\`/\`unverified\`, on call failure, or when disabled/unsafe, continue with bounded diff/source reads, \`rg\`, ast-grep, package/test facts, and logs.` |

## 落地要点

- `capability-aware-provider-contracts.test.js`：`WORKFLOW_SKILLS` 扩到 7，保留 spec-plan 双文件特例，新增负向断言 `not.toContain('absent, stale, unknown, or unverified')`。
- brainstorm/ideate 先在父方案 §6 登记（U4）。
- skill prose 变更，落地后按 R13 fresh-source eval。
