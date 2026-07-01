---
title: "plan 负责架构设计，work 负责架构适配检查"
date: 2026-07-01
category: docs/solutions/architecture-patterns
module: spec-plan/spec-work 工作流边界
problem_type: architecture_pattern
component: development_workflow
severity: medium
applies_when:
  - "work skill 优化要求执行阶段考虑架构、分层、解耦、复用或 source/runtime ownership"
  - "计划要新增轻量执行前检查，但不新增 schema、CLI、artifact 或 workflow"
  - "审查意见可能把 review 误变成架构授权来源"
  - "contract tests 和 examples-as-context 只验证 prompt 结构，不验证 runtime model 行为"
domain: spec-first 工作流职责边界
pattern: plan-architecture-work-fit-check
rejected_alternatives:
  - "让 spec-work 在实现中自由重做架构 — 拒绝，因为 public contract、跨模块抽象、schema/runtime/source-of-truth/provider 边界需要 plan 授权"
  - "把所有 architecture-fit 思考都推回 spec-plan — 拒绝，因为执行阶段仍需要发现 stale source、overbuild、错层修改和未授权 durable-surface 扩张"
  - "把 minimality 或 architecture fit 编成新的 schema/CLI/artifact — 拒绝，因为这是确定性事实之上的 LLM 语义判断"
  - "把 prose contract tests 当作行为证明 — 拒绝，因为它们只证明 source anchor 和 fixture shape"
applicable_versions:
  - "spec-first 1.12.x"
invalidation_condition: "如果 spec-work 获得确定性的 architecture-fit artifact/schema、spec-plan 不再负责架构设计决策，或 runtime 行为验证成为 source-contract closeout 前的强制项，则需要重估本学习。"
source_refs:
  - "docs/plans/2026-07-01-003-feat-spec-work-minimality-architecture-fit-plan.md"
  - "docs/brainstorms/2026-07-01-001-spec-work-minimality-preflight-requirements.md"
  - "skills/spec-plan/SKILL.md"
  - "skills/spec-work/SKILL.md"
  - "docs/10-prompt/结构化项目角色契约.md"
  - "docs/solutions/workflow-issues/skill-prose-rewrite-contract-test-coverage-2026-06-28.md"
tags: [spec-plan, spec-work, architecture-fit, minimality, source-runtime, workflow-boundary]
---

# plan 负责架构设计，work 负责架构适配检查

## 背景

`spec-work` minimality 优化最初是一个 YAGNI 风格请求：执行阶段避免新增不必要的 dependency、file、helper、wrapper 和 abstraction。随后用户提出了真正承重的问题：优化后的 work skill 也必须思考架构层面的设计约束，并严格遵循现有项目规范、架构、分层、解耦和复用。

这次计划沉淀的可复用经验是边界，而不是未来实现本身。`spec-plan` 仍然是负责架构设计和方案形态选择的阶段。`spec-work` 可以检查某个实现选择是否仍符合 plan、当前 source、confirmed standards、source/runtime ownership 和 nearby patterns。若执行中发现未授权的新架构决策，应停回 `spec-plan` 或 task-pack regeneration，而不是在实现阶段临场设计。

## 指引

给执行 workflow 增加架构敏感行为时，使用这个职责拆分：

| 职责 | 归属 | 实践规则 |
| --- | --- | --- |
| 架构设计与取舍选择 | `spec-plan` | 在实现前决定 module boundary、新 source surface、reuse/extend/new、public contract、schema/runtime surface 和 sequencing。 |
| 执行期 architecture-fit 检查 | `spec-work` | 检查具体实现选择是否符合 plan/task、当前 source、confirmed standards、source/runtime ownership、分层、依赖和复用证据。 |
| residual 或 implemented-diff 审查 | `spec-code-review` / shipping review | 审查已经实现的 diff，并承接 residual/follow-up focus；不能作为授权新架构的来源。 |
| 知识沉淀 | `spec-compound` | 在 plan/review 结果明确后沉淀已验证的可复用边界；不能声称未观察到的 implementation behavior。 |

work 侧检查应保持轻量。它应是 durable surface 上的注意力提醒，而不是新子系统：

- 触发点是新增或修改 durable surface，例如 dependency、file、abstraction、helper、wrapper、public contract、schema/runtime/config surface、source-of-truth entry、provider boundary 或 generated runtime delivery。
- 先问 minimality 问题：active scope 是否真的要求它；现有 source、platform、config、standard library 或 installed dependency 是否已经能承接；该 abstraction 是否有当前消费者，而不是未来想象中的消费者。
- 再基于证据问 architecture-fit 问题，而不是基于口号：plan/task authorization、source path、matched confirmed standard rule、owner/module boundary、nearby pattern 和 source/runtime ownership。
- 当证据冲突时应用优先级：confirmed active standard 或 source-of-truth 优先，其次是 explicit plan/task decision，再其次是 owner 或 source module boundary，nearby pattern 最后。
- 如果只有单个可疑 nearby pattern 支撑该选择，应标为 advisory 或停回 planning；不要把局部历史偶然变成硬架构规则。

完成声明需要拆成两层：

1. **Source contract completed** 表示 skill prose、examples-as-context、tests 和 changelog 已具备预期 anchor。
2. **Behavior/runtime delivery claimed** 需要更强证据：fresh-source eval、manual fresh-read eval、真实 work run，以及当宿主应加载新行为时的 runtime projection。

Contract tests 和 examples 有价值，但边界有限。它们可以钉住计划中的 heading、loop order、禁止的 schema/CLI/runtime expansion 和 fixture tags；它们不能证明 agent 会拒绝 overbuild、保留 protected code、对小改动保持零 note，或在未授权架构决策前停回。

## 为什么重要

缺少这个拆分时，很容易出现两个相反的失败模式：

- 执行过弱：`spec-work` 盲目跟随局部代码，因为 plan 没有重述每条边界，就新增不必要 abstraction 或错层 logic。
- 执行过强：`spec-work` 把 “architecture fit” 当成授权，在实现阶段设计 public contract、跨模块 abstraction、schema/runtime change 或 source-of-truth boundary。

这个边界能保持 workflow 链路一致：planning 负责 architecture design；work 负责 fit checking 和诚实 stop-back；review 负责 implemented-diff critique；compound 负责 verified learning。这符合 `Light contract + Explicit boundaries + Deterministic floor, LLM semantic judgment`。

## 适用场景

- 计划要求 execution skill 增加 preflight、minimality、YAGNI、reuse、layering 或 architecture-fit 行为。
- work run 发现 plan 或 task pack 未授权的 durable surface。
- review finding 指出计划让 review 变成了 architecture decision 授权来源。
- source-only skill prompt 改动 closeout 时，有人想仅凭绿色 prose tests 声称 runtime behavior 已生效。

## 示例

更好的 source-contract 表述：

```text
spec-plan owns architecture design. spec-work checks architecture fit against
plan/task authorization, current source, confirmed standards, source/runtime
ownership, and nearby patterns. If a new architecture decision is required,
stop back to spec-plan or task-pack regeneration.
```

应避免的较弱表述：

```text
spec-work enforces clean architecture and can decide the right abstraction.
```

这个较弱表述过宽，会把 generic architecture language 变成 hard rule，也会让执行阶段承担本应属于 planning 的 design decision。

完成声明也应保持精确：

```text
source contract updated; behavior_validation: not_run; runtime not refreshed
```

这比“只因 source prose 和 contract tests 已改，就声称优化后的 workflow 已经生效”更诚实。

## 相关资料

- `docs/plans/2026-07-01-003-feat-spec-work-minimality-architecture-fit-plan.md` — 定义该边界并集成多视角审查发现的 source plan。
- `docs/brainstorms/2026-07-01-001-spec-work-minimality-preflight-requirements.md` — minimality + architecture-fit preflight 的 verified origin PRD。
- `docs/solutions/architecture-patterns/competitor-skill-borrowing-judgment-2026-06-01.md` — 借鉴外部机制时先经过本地边界过滤的相关模式。
- `docs/solutions/workflow-issues/skill-prose-rewrite-contract-test-coverage-2026-06-28.md` — 绿色 prose contract tests 不证明新语义行为的相关警示。
- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md` — 本计划应用到 generated mirrors 的 source/runtime 边界。
