---
name: using-spec-first
description: Standalone entry governor for spec-first. Use before substantial work in a spec-first repo or when the user asks what to run next; choose one public `spec-*` workflow, standalone skill, terminal command, or Direct Lane. Do not use to reroute active public workflows or bounded workers, or for lightweight facts, current-context explanations, narrow lookups, user-supplied single-document cleanup, or clearly scoped low-risk edits.
---

# Using Spec-First

`using-spec-first` is a standalone entry governor, not a command-backed workflow. It selects one next entrypoint and yields control; it creates no workflow artifact. It is a semantic map, not a rigid state machine.

## Workflow Contract Summary

- **输入：** 当前用户意图、已有 workflow 状态、artifact 类型、失败/环境信号与项目级路由规则。
- **输出：** 恰好一个 public `spec-*` workflow、standalone skill、terminal command 或 Direct Lane 入口；进入后立即把控制权交给该 owner。
- **硬出口：** 入口选择不授权 mutation、verification claim、runtime maintenance、handoff、knowledge promotion、commit 或 landing；低置信且会改变 route 时最多询问一个问题。
- **权威：** 用户意图与项目 source rules 决定 route；本 skill 只做语义路由，不创建 workflow state 或执行下游工作。
- **消费者：** 当前用户、所有 public workflow、standalone skill 与 host runtime entrypoint。

## Fast Paths

- Continue an active public workflow or bounded worker; do not restart routing.
- Use the Direct Lane only for current-context explanations, lightweight facts, one-off how-to explanations, command-output explanations, narrow lookups, one user-supplied document, or a single low-risk edit whose target, change, and root cause are already clear.
- Do **not** use the Direct Lane when the request includes document review/critique, a failure/error/stack trace, environment/setup/runtime concerns, an explicit workflow name, handoff/context reset, knowledge promotion, or an unresolved build goal, target user, success/acceptance criterion, or mutually exclusive implementation direction. If a Direct Lane task expands to multi-file behavior, architecture, governance, runtime, an unknown root cause, or a sensitive surface, stop and route again.

## Route Selection

For every request outside the fast paths, and to validate an explicit public route or answer “what next?”, read [Public Route Map](references/public-route-map.md). Select exactly one entrypoint; do not automatically chain the flow. Prefer readiness, failure, or review routes when they match; otherwise use immediate intent and artifact type. **Checkpoint — ask:** at low confidence, ask at most one route-changing question, then stop and wait for the answer before routing further.

For active work, announce one localized line equivalent to `Entering <entrypoint>: <one concrete reason>`, then follow the selected route. If a standalone skill is user-invoked only, recommend it and wait. For recommendation-only requests, return exactly one recommendation and wait:

```text
Recommended entrypoint: <spec-*, standalone skill, or terminal command>
Reason: <one concrete reason>
Next action: <one action the user can take now>
```

Use the repository's configured user language. **Checkpoint — wait:** after any recommendation, stop and yield; enter the recommended entrypoint only after the user asks to continue.

## Exit Boundaries

Hard exit gates cover mutation, verification claims, source/runtime, handoff/context reset, and knowledge promotion. A route match never authorizes an exit. Never claim verification or completion without traceable evidence, and never fabricate tests, refreshes, evals, or routing evidence. Modify source-of-truth surfaces, never generated host runtime; scripts/tools prepare deterministic facts while LLMs judge semantic adequacy.

Before runtime maintenance, scenario-fingerprint interpretation, worker dispatch, the Codex startup reminder, ordinary-context exclusions, handoff/context reset, knowledge promotion, or any parent multi-repo write, test, autofix, or commit, read [Conditional Routing Boundaries](references/conditional-routing-boundaries.md) and apply the matching section.
