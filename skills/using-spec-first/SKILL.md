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

根据用户已有输入和希望得到的结果选择入口；不要要求用户先理解完整 workflow 清单。明确点名的入口、当前进行中的 owner 和失败信号优先按现有边界处理：活跃 workflow 执行中出现的失败或报错由该 workflow 既有反馈回路处理，不重启路由；根因超出当前任务范围时才由该 owner 显式移交 `spec-debug` 并说明原因。只有缺少会改变入口的关键信息才问一个问题；需求到执行不自动串联。不确定环境能力时先判断当前任务是否必需，缺少可选能力允许披露限制后继续，缺少必需能力才交给 `spec-runtime-setup`。

```text
Recommended entrypoint: <spec-*, standalone skill, or terminal command>
Reason: <one concrete reason>
Next action: <one action the user can take now>
```

Use the repository's configured user language. **Checkpoint — wait:** after any recommendation, stop and yield; enter the recommended entrypoint only after the user asks to continue.

此等待仅适用于用户询问下一步、要求推荐或比较入口的场景。用户已明确要求执行任务时，选择入口后继续履行该任务已获授权的工作，不再把入口推荐当成一次新的审批。

首次获得任务相关的实质结果后，依据可回源的宿主、target、实际入口、时间、结果和来源说明完成范围及未完成项；欢迎语、入口推荐、setup receipt 和文件存在均不能证明首次任务成功。下一入口仍按 public route map 选择恰好一项建议，由当前 owner 承接已有执行授权；不为示例强制创建文件，也不自动提交、发布或升级为已验证知识。

## Exit Boundaries

Hard exit gates cover mutation, verification claims, source/runtime, handoff/context reset, and knowledge promotion. A route match never authorizes an exit. Never claim verification or completion without traceable evidence, and never fabricate tests, refreshes, evals, or routing evidence. Modify source-of-truth surfaces, never generated host runtime; scripts/tools prepare deterministic facts while LLMs judge semantic adequacy.

Before project-intelligence use, runtime maintenance, scenario-fingerprint interpretation, worker dispatch, the Codex startup reminder, ordinary-context exclusions, handoff/context reset, knowledge promotion, or any parent multi-repo write, test, autofix, or commit, read [Conditional Routing Boundaries](references/conditional-routing-boundaries.md) and apply the matching section.
