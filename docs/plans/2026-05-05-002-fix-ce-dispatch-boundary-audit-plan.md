---
title: fix: 修复 CE 血缘带来的 skill 调度边界漂移
date: 2026-05-05
status: completed
type: fix
spec_id: 2026-05-05-002-ce-dispatch-boundary-audit
origin: docs/brainstorms/2026-04-13-spec-first-sync-compound-engineering-updates-requirements.md
target_repo: spec-first
priority: P0
scope: dispatch-boundary-control-plane
completed_at: 2026-05-12
completion_evidence: docs/validation/2026-05-05-ce-dispatch-boundary-audit-matrix.md
---

# fix: 修复 CE 血缘带来的 skill 调度边界漂移

## Overview

`spec-first` 源于 Compound Engineering，因此部分 workflow skill 继承了 CE 的多 agent、parallel reviewer、worker、resolver、research dispatch 等设计模式。

随着 `spec-first` 自身演化，部分 skill 已经出现 **调度语义漂移**：

```text
source skill 里描述的是 multi-agent / reviewer / research dispatch
generated Codex runtime 中却被降级为 inline profile application

source skill 里仍然暗示 Codex 不应 dispatch
但当前 Codex 已经可以通过 spawn_agent 支持 agent dispatch

read-only reviewer workflow 的边界
被 mutating worker / resolver workflow 误用

parallel / subagent / worker 语义没有绑定 isolation、write-set、fallback、orchestrator integration
```

本计划不是完整 CE feature sync，也不是把 CE 的能力整批搬回 `spec-first`。

本计划的目标是：

```text
修复 spec-first skills 中 inherited-from-CE 的 dispatch control-plane drift，
让每个 skill 的 agent / subagent / parallel / worker / resolver 语义重新受控。
```

一句话目标：

```text
先把 skill 调度控制权收回来，再谈能力扩展。
```

## 收口记录

2026-05-12 lifecycle cleanup 复核后，本计划状态收口为 `completed`。`docs/validation/2026-05-05-ce-dispatch-boundary-audit-matrix.md` 已覆盖主要 dispatch 边界矩阵，`spec-doc-review`、`spec-code-review`、`spec-plan`、`spec-ideate`、`resolve-pr-feedback`、`spec-work`、`spec-work-beta`、`agent-native-audit` 等 P0/P1 语义漂移已由 source 与 contract tests 固化。此前矩阵中的 `spec-optimize` P2 watch item 现已由 `skills/spec-optimize/SKILL.md`、`tests/unit/spec-optimize-contracts.test.js` 和 `tests/unit/spec-dispatch-boundary-contracts.test.js` 覆盖 optional backend、fallback 与 orchestrator-owned integration 边界。

---

## Problem Frame

当前问题不是：

```text
CE 有什么新能力，spec-first 是否要同步？
```

而是：

```text
spec-first 继承了 CE 的 workflow / agent / dispatch 形态，
但 source skill、runtime adapter、generated runtime、tests 之间的调度边界不再一致。
```

风险主要体现在四类：

### Source / Runtime 语义漂移

例如 source skill 中的：

```text
Task spec-xxx(...)
parallel reviewer agents
research subagents
resolver agents
```

在 Codex runtime rendering 后可能变成：

```text
Read .codex/agents/... and apply that agent profile inline
```

这会导致：

```text
本应是多 agent dispatch 的 workflow
被静默降级成单 agent profile simulation
```

这是本计划的 P0 风险。

---

### Codex 能力假设过期

部分 skill 仍然带有旧假设：

```text
旧假设 A：把 Codex 等同为无 dispatch 能力
旧假设 B：把 Codex reviewer persona 固定降级为 inline profile simulation
旧假设 C：把 workflow documented dispatch phase 写成需要额外用户确认
```

但当前边界应改为：

```text
Codex can dispatch through spawn_agent when host capability and session policy allow it.
Codex must not be downgraded solely because the host is Codex.
```

---

### Read-only dispatch 与 mutating dispatch 混淆

`spec-doc-review`、`spec-code-review`、`spec-plan`、`spec-ideate` 更多是：

```text
read-only reviewer / research dispatch
```

而 `spec-work`、`spec-work-beta`、`resolve-pr-feedback` 涉及：

```text
mutating worker / resolver dispatch
```

二者边界不能混用。

read-only dispatch 可以更容易 fallback：

```text
report-only
sequential
inline current-agent analysis
```

mutating dispatch 必须额外考虑：

```text
write-set
workspace isolation
conflict avoidance
final integration
project-level validation
staging / commit ownership
```

---

### CE 血缘与 spec-first 产品边界混淆

CE 是 lineage evidence，不是 truth source。

本次审计不能机械做：

```text
CE 怎么写，spec-first 就怎么改
```

而必须坚持：

```text
spec-first 当前产品定位
source skill contract
runtime adapter behavior
tests
用户可见 workflow 语义
```

才是真相源。

---

## Goals

本计划的目标是建立一套轻量但可验证的 skill dispatch 控制面。

### G1. 建立 dispatch-boundary audit matrix

对所有含以下语义的 skill 建立矩阵：

```text
agent
subagent
parallel
dispatch
delegation
reviewer
resolver
worker
researcher
fork workspace
worktree isolation
persona
spawn_agent
Task
```

---

### G2. 修复 P0 漂移点

优先修复：

```text
spec-code-review 的 Codex dispatch 旧假设
Codex adapter 对 Task / dispatch 的 silent inline-profile rewrite
source skill 与 generated runtime 的语义不一致
```

---

### G3. 明确统一的 dispatch control-plane contract

任何 skill 只要涉及 agent / subagent / dispatch / parallel，必须明确：

```text
host capability
workflow-owned documented phase authorization
explicit user no-agents / report-only override
fallback behavior
mutation boundary
artifact boundary
cost boundary
```

---

### G4. 保持 source/runtime 边界

只修改：

```text
skills/
agents/
src/cli/
tests/
docs/
CHANGELOG.md
```

不手改：

```text
.claude/
.codex/
.agents/skills/
generated runtime mirrors
```

---

### G5. 防止后续 CE sync 重新引入旧假设

通过 matrix、contract tests、runtime rendering tests 防止回归：

```text
Codex means no dispatch
parallel means unbounded
Task means inline profile application
mutating subagents can share write directory without isolation
```

---

## Non-Goals

本计划明确不做：

```text
完整 CE feature parity sync
整文件复制 CE skills
新增中心化 dispatch state machine
新增通用 agent 调度框架
新增 CE-only 能力，例如 ce-simplify-code
修改公开 workflow entrypoint 名称
手动修改 generated runtime assets
放宽当前 session / developer / runtime restrictions
```

本计划也不默认执行：

```text
spec-first init --codex
spec-first init --claude
runtime mirror regeneration
fresh host-session behavioral validation
```

这些应在 source 和 tests 修复后，由用户明确触发。

---

## Core Principle

本计划遵循 `spec-first` 的基本原则：

```text
Light contract
Explicit boundaries
Scripts prepare, LLM decides
```

因此不会引入重型规则引擎，也不会把 skill 写成不可维护的 policy state machine。

本计划只要求：

```text
每个 skill 清楚说明自己何时可以 dispatch，
何时不可以 dispatch，
失败时如何 fallback，
是否允许写文件，
谁负责最终集成。
```

---

## Skill Control Charter

这是本次修复后应长期遵守的 skill 控制章程。

任何 `spec-first` skill 只要涉及 agent / subagent / dispatch / parallel / worker / resolver / reviewer，必须显式回答以下问题。

---

### Responsibility Boundary

该 skill 负责什么，不负责什么。

示例：

```text
spec-code-review 负责结构化审查和报告。
它不负责直接修改代码，除非 workflow 明确进入 fixer phase。
```

---

### Invocation Boundary

直接调用该 workflow 是否授权内部 dispatch。

必须区分：

```text
用户直接调用 /spec-code-review
父 workflow 调用 spec-code-review
当前 agent 自己 inline 读取 reviewer profile
```

推荐表述：

```text
Direct workflow invocation authorizes the documented dispatch phase only when
host capability, session policy, user instruction, workflow safety conditions,
and fallback contract all allow it.
```

---

### Dispatch Boundary

是否允许调用 agent / subagent / reviewer / worker / resolver。

必须说明：

```text
dispatch 是 mandatory 还是 optimization
dispatch 失败是否影响 correctness
dispatch 数量是否 bounded
dispatch 是否允许并行
```

---

### Mutation Boundary

child agent 是否允许写文件。

必须说明：

```text
read-only
report-only
local patch proposal only
isolated workspace mutation
shared-directory mutation
forbidden
```

---

### Isolation Boundary

如果允许 mutating dispatch，必须说明至少一个条件：

```text
disjoint write-set
fork workspace isolation
git worktree isolation
host-specific inspectable merge handoff
sequential fallback
stop when unsafe
```

---

### Artifact Boundary

必须说明谁能写哪些产物。

示例：

```text
reviewer agents may produce findings
orchestrator owns final report
worker agents may propose patches
orchestrator owns final integration and validation
```

---

### Runtime Boundary

source skill 和 generated runtime 必须语义一致。

禁止出现：

```text
source says dispatch
runtime silently renders inline profile application
```

如果 runtime 只能 inline fallback，必须显式说明：

```text
Fallback: read the agent profile and apply it inline in the current agent.
```

---

### Fallback Boundary

必须明确 dispatch 不可用时怎么处理：

```text
report-only fallback
sequential fallback
inline current-agent fallback
stop when mutation would be unsafe
```

---

### Cost Boundary

如果 multi-agent / parallel 可能增加成本，必须说明：

```text
token cost
latency cost
parallelism bound
backpressure behavior
```

---

### Product Boundary

CE 里存在的能力不默认进入 `spec-first`。

每个 CE divergence 都必须判断：

```text
accepted divergence
needs repair
defer
not applicable
```

---

## Dispatch Contract

本计划不强制引入新的语法，例如：

```text
Dispatch <agent>(args)
```

因为不同 host 的 primitive 不同。

本计划定义的是语义 contract。

---

### Dispatch means

```text
A workflow may delegate a bounded subtask to another execution context
when host capability and session policy allow it.
```

在不同 host 下可以映射为：

```text
Claude: Task / Agent primitive when available
Codex: spawn_agent when available
Fallback: inline current-agent / sequential / report-only / stop
```

---

### Dispatch does not mean

```text
unbounded parallelism
mandatory subagent usage
mutation permission
shared working directory
child agent may stage files
child agent may commit
fallback failure
CE parity by default
```

---

### Direct workflow invocation rule

直接调用 workflow 可以授权其文档化 dispatch phase，但必须同时满足：

```text
1. host supports the required primitive
2. current session policy allows it
3. user did not explicitly forbid delegation
4. workflow-specific safety conditions are met
5. fallback behavior is documented
6. mutation boundary is respected
```

---

### Codex rule

Codex 的新基线：

```text
Codex supports dispatch through spawn_agent when available.
Do not downgrade solely because the host is Codex.
```

禁止旧假设：

```text
不要把 Codex host 本身当成 dispatch unavailable。
不要把 Codex reviewer profiles 固定降级为 inline-only simulation。
不要因为文件中出现 agent profile 就脱离 documented workflow phase 直接 dispatch。
```

更准确的表述是：

```text
Do not call spawn_agent solely because a profile exists.
Call spawn_agent only when the workflow's documented dispatch phase,
host capability, and session policy authorize it.
```

---

## Requirements Trace

本计划继承 `docs/brainstorms/2026-04-13-spec-first-sync-compound-engineering-updates-requirements.md` 中的 CE sync 背景，但只收敛 dispatch-boundary follow-up。CE source 是 lineage evidence，不是 spec-first truth source。origin 文档没有 `spec_id`，因此本计划保留正式 plan 的 plan-local `spec_id: 2026-05-05-002-ce-dispatch-boundary-audit`。

### R1. Matrix-first

为所有含 dispatch / agent / parallel / worker / resolver / reviewer 语义的 skill 建立 dispatch-boundary matrix。

---

### R2. CE as evidence, not truth

每个命中的 skill 尽量找到 CE counterpart。

但 CE 只作为 lineage evidence，不作为 truth source。

---

### R3. Four-way boundary

每个受影响 workflow 必须区分：

```text
host capability
workflow invocation authorizes documented dispatch phase
explicit user no-agents / report-only override
fallback behavior
```

---

### R4. Source/runtime boundary

只修改 source 和 tests。

不手动修改 generated runtime mirrors。

---

### R5. Codex spawn_agent support

Codex 不能因为 host 身份被天然降级。

Codex 在 host/session 允许时可以使用 `spawn_agent`。

---

### R6. Runtime rendering consistency

Codex generated runtime 不得把 source 中 intended dispatch 静默改成 inline profile application。

如果是 fallback，必须显式声明。

---

### R7. Mutating dispatch isolation

mutating workflow 并行前必须满足：

```text
disjoint write-set
or workspace isolation
or host-specific isolation contract
```

否则必须：

```text
serialize
or stop
```

---

### R8. Orchestrator final ownership

对 mutating workflows：

```text
final integration
project-level validation
staging
commits
```

必须由 orchestrator 负责。

---

### R9. Regression tests

补充 contract tests，防止旧假设回归。

---

### R10. Changelog by implementation batch

每个实施批次更新 `CHANGELOG.md`。

不要求每个 Unit 都单独写一条，除非该 Unit 独立提交或包含用户可见行为变化。

---

## Scope Boundaries

### In Scope

```text
skills/*/SKILL.md
agents/*
src/cli/adapters/codex.js
tests/unit/*
docs/validation/*
docs/solutions/*
CHANGELOG.md
```

---

### Out of Scope

```text
.claude/*
.codex/*
.agents/skills/*
runtime mirrors
full CE sync
CE-only feature expansion
central dispatch scheduler
new workflow entrypoints
```

---

## Graph Readiness

```yaml
target_repo: spec-first
status: stale
source_revision: dbf9bab1a871fc7aa6c790fe26b70eda10e0e0dc
current_revision: 7928d76c
stale: true
primary_providers:
  - code-review-graph
  - gitnexus
degraded_providers: artifact 未报告降级 provider
fallback_capabilities:
  - bounded direct source reading
  - CE source comparison
  - source/runtime render tests
  - grep-based deterministic source scan
  - optional GitNexus live MCP symbol-level evidence
runtime_mcp_evidence: 未使用
confidence: medium
limitations:
  - graph artifacts 生成于 2026-05-01
  - current worktree dirty
  - 本计划主要依赖 source files 与 contract tests
  - compiled graph facts 仅作为 stale context
```

---

## Context & Research

### Fixed reference pattern

`skills/spec-doc-review/SKILL.md` 是已修复参考模式。

它已经覆盖：

```text
dispatch capability gate
workflow invocation authorization
Codex spawn_agent support
bounded parallelism
backpressure handling
single-agent report-only fallback
stricter session policy override
```

---

### Primary drift candidates

当前 P0 候选：

```text
skills/spec-code-review/SKILL.md
skills/spec-plan/SKILL.md
src/cli/adapters/codex.js
tests/unit/init-dry-run.test.js
tests/unit/runtime-plan-contracts.test.js
tests/unit/spec-plan-contracts.test.js
```

---

### Mutating workflow candidates

```text
skills/spec-work/SKILL.md
skills/spec-work-beta/SKILL.md
skills/resolve-pr-feedback/SKILL.md
```

实施前必须以真实路径为准，避免路径漂移。

---

### Low-risk / optimization candidates

```text
skills/spec-debug/SKILL.md
skills/spec-optimize/SKILL.md
skills/agent-native-audit/SKILL.md
skills/spec-compound/SKILL.md
skills/spec-compound-refresh/SKILL.md
skills/spec-brainstorm/SKILL.md
skills/spec-slack-research/SKILL.md
```

---

## Key Technical Decisions

### D1. 这是 control-plane repair，不是 CE parity sync

本计划不追求 CE feature parity。

CE 只用于回答：

```text
这个 dispatch 语义从哪里来？
spec-first 是否有意偏离？
当前偏离是否合理？
```

---

### D2. Matrix 先于修改

没有进入 matrix 的 skill，本轮不顺手修改。

matrix 没有明确 action 的 skill，本轮不重写。

---

### D3. P0 先止血

优先修复：

```text
Codex anti-dispatch stale wording
Codex runtime silent inline-profile rewrite
source/runtime semantic mismatch
```

---

### D4. Read-only 和 mutating dispatch 分开治理

read-only workflow 可以：

```text
bounded parallel
report-only fallback
sequential fallback
inline fallback
```

mutating workflow 必须额外满足：

```text
write-set isolation
fork/worktree isolation
orchestrator final integration
stop/serialize when unsafe
```

---

### D5. Runtime rendering 必须可测试

如果修改 `src/cli/adapters/codex.js`，必须有 generated runtime contract test。

只测 source skill 不够。

---

### D6. Tests 锁语义，不锁完整文案

contract tests 应优先锁：

```text
负向旧假设
关键边界语义
runtime semantic consistency
```

避免把所有 skill 文案变成 brittle snapshot。

---

## Migration Strategy

### Phase 0: Matrix only

建立 audit matrix，不改行为。

输出：

```text
docs/validation/2026-05-05-ce-dispatch-boundary-audit-matrix.md
```

---

### Phase 1: P0 source/runtime/test repair

修复最危险漂移：

```text
spec-code-review
Codex adapter rendering
spec-plan generated runtime contract
minimal regression tests
```

---

### Phase 2: P1 high-risk workflow contracts

修复：

```text
spec-plan
spec-ideate
spec-work
spec-work-beta
resolve-pr-feedback
```

---

### Phase 3: P2 low-risk / experimental cleanup

审计并按需修复：

```text
spec-debug
spec-optimize
agent-native-audit
spec-compound
spec-compound-refresh
spec-brainstorm
spec-slack-research
```

---

### Phase 4: Optional runtime regeneration

在 source 和 tests 全部通过后，由用户明确触发：

```bash
spec-first init --codex
spec-first init --claude
```

或对应 dry-run / temp-dir rendering test。

---

## Implementation Units

---

### P0 — Control-plane Stop-the-bleeding

---

#### P0-U1. 建立 dispatch-boundary audit matrix

##### Goal

创建 repo-local evidence artifact，列出所有具备 agent、subagent、parallel、dispatch、delegation、reviewer、resolver、worker、researcher 语义的 source skill，并判断是否存在 CE lineage drift。

##### Requirements

```text
R1, R2, R3, R4
```

##### Files

Create:

```text
docs/validation/2026-05-05-ce-dispatch-boundary-audit-matrix.md
```

Modify:

```text
CHANGELOG.md
```

##### Deterministic scan

使用更宽的关键词扫描：

```bash
grep -rn -E \
  'agent|subagent|parallel|spawn_agent|Task |dispatch|delegat|reviewer|resolver|worker|fork|worktree|persona' \
  skills/*/SKILL.md
```

如 `resolve-pr-feedback` 不在 `skills/` 下，追加真实路径扫描：

```bash
find . -path '*/SKILL.md' \
  | grep -E 'skills|resolve-pr-feedback|agent-native-audit' \
  | xargs grep -n -E 'agent|subagent|parallel|spawn_agent|Task |dispatch|delegat|reviewer|resolver|worker|fork|worktree|persona'
```

##### Matrix fields

矩阵必须包含：

| Field                               | Meaning                                                              |
| ----------------------------------- | -------------------------------------------------------------------- |
| `skill`                             | source skill path                                                    |
| `ce_counterpart`                    | CE source path or `none`                                             |
| `dispatch_terms`                    | 命中的 agent / parallel / dispatch 关键词                                  |
| `dispatch_type`                     | reviewer / research / resolver / worker / optimizer / internal audit |
| `mutates_repo`                      | child agent 是否可能改 repo                                               |
| `host_capability`                   | Claude / Codex / unknown                                             |
| `session_authorization`             | required / optional / forbidden / unclear                            |
| `workflow_invocation_authorization` | direct invocation 是否授权 dispatch                                      |
| `runtime_rendering_risk`            | source/runtime 是否可能不一致                                               |
| `fallback`                          | report-only / sequential / inline / stop / unclear                   |
| `isolation_required`                | yes / no / unclear                                                   |
| `orchestrator_final_owner`          | yes / no / unclear                                                   |
| `accepted_divergence`               | 是否有意不同于 CE                                                           |
| `repair_priority`                   | P0 / P1 / P2 / defer                                                 |
| `action`                            | keep / clarify / repair source / repair adapter / add test           |

##### Required coverage

Matrix 至少覆盖：

```text
spec-doc-review
spec-code-review
spec-plan
spec-ideate
spec-debug
spec-optimize
resolve-pr-feedback
spec-work
spec-work-beta
agent-native-audit
spec-compound
spec-compound-refresh
spec-brainstorm
spec-slack-research
```

##### Verification

Matrix 必须包含 `spec-doc-review` 作为 fixed reference pattern，并说明其四象限行为：

```text
1. Claude dispatch available
2. Claude dispatch fails
3. Codex spawn_agent available
4. stricter session policy overrides workflow prose
```

##### Acceptance Criteria

```text
- 所有含 dispatch / parallel / agent 语义的 skill 均进入 matrix
- 每个 skill 都有 repair_priority
- 每个 skill 都有 action
- 每个 CE divergence 都标记 accepted / needs repair / defer
- 不根据 CE 自动修改 spec-first source
```

---

#### P0-U2. 修复 spec-code-review 的 Codex dispatch 边界

##### Goal

让 `spec-code-review` 对齐已修复的 `spec-doc-review` 边界：

```text
当 host capability 和 session policy 允许时，
直接调用 spec-code-review 可以授权 documented reviewer phase。

当 dispatch 不可用或未授权时，
fallback 到 single-agent report-only path。
```

##### Requirements

```text
R3, R5, R9
```

##### Files

Modify:

```text
skills/spec-code-review/SKILL.md
tests/unit/spec-code-review-contracts.test.js
CHANGELOG.md
```

##### Required changes

替换 stale wording：

```text
旧 Codex-specific anti-pattern：把 agent profile 出现本身误当成 dispatch 触发条件，同时又否定 documented reviewer phase 下的 Codex dispatch 能力
```

替换为更准确 contract：

```text
Codex supports reviewer dispatch through spawn_agent when the workflow's documented reviewer phase and host capability select it.
Do not downgrade solely because the host is Codex.
Do not call spawn_agent solely because a profile exists.
Call spawn_agent only when the workflow's documented reviewer phase,
and host capability select it.
```

##### Preserve existing rules

不得破坏：

```text
bounded reviewer dispatch
validator dispatch
model alias safety
stable numbering
artifact boundaries
backpressure handling
single-agent report-only fallback
```

##### Tests

Add / update assertions:

```text
- direct spec-code-review invocation may authorize documented reviewer phase when session allows
- Codex is not treated as naturally incapable of dispatch
- unauthorized dispatch falls back to single-agent report-only
- stale anti-spawn_agent wording is absent
```

##### Acceptance Criteria

```text
- spec-code-review 不再把 Codex 视为天然不能 dispatch
- reviewer dispatch 仍是 bounded
- fallback 仍是 report-only
- tests 防止旧 wording 回归
```

---

#### P0-U3. 修复 Codex runtime 的 silent dispatch-to-inline downgrade

##### Goal

确认并修复 `src/cli/adapters/codex.js` 中的 runtime rendering 漂移：

```text
source contract 表示 dispatch 时，
generated Codex runtime 不得静默改写成 inline profile application。
```

##### Requirements

```text
R4, R5, R6, R9
```

##### Files

Modify:

```text
src/cli/adapters/codex.js
tests/unit/init-dry-run.test.js
tests/unit/runtime-plan-contracts.test.js
tests/unit/spec-plan-contracts.test.js
CHANGELOG.md
```

##### Problem

当前疑似 transform：

```text
Task spec-xxx(...)
```

被生成成：

```text
Read .codex/agents/spec-xxx.md and apply that agent profile
```

这会把：

```text
multi-agent dispatch
```

静默变成：

```text
single-agent inline profile simulation
```

##### Required behavior

如果 source contract 表示 dispatch：

```text
Codex runtime must preserve dispatch semantics through spawn_agent-compatible wording.
```

如果当前 host/session 不允许 dispatch，必须显式写成 fallback：

```text
Fallback: read the relevant agent profile and apply it inline in the current agent.
```

##### Implementation options

实施时在 matrix 之后二选一：

##### Option A: Source uses host-neutral dispatch prose

Source skill 写：

```text
When dispatch is authorized, dispatch the research/reviewer agent.
Claude may use Task/Agent primitive.
Codex may use spawn_agent.
Fallback to inline profile application only when dispatch is unavailable.
```

Codex adapter 不再把它强行改写成 inline。

##### Option B: Adapter renders Task into Codex dispatch wording

Source 仍保留 host shorthand：

```text
Task spec-xxx(...)
```

Codex adapter render 为：

```text
Use spawn_agent with the corresponding .codex/agents/spec-xxx.md profile when the workflow's documented dispatch phase and host capability select it.
Fallback: read and apply the profile inline only when spawn_agent is unavailable or explicitly disabled.
```

##### Preference

优先选择 Option A。

原因：

```text
source skill 更清楚
host-neutral
不把 source contract 绑死到 Task 语法
降低 adapter 魔法改写
```

##### Tests

必须验证：

```text
- generated Codex spec-plan runtime 不再将 intended research dispatch 静默改成 inline profile application
- 当 source 明确要求 profile file path 时，.codex/agents 路径仍可生成
- host-comparative prose 中 Claude / Codex 分支不被 broad rewrite 破坏
```

##### Acceptance Criteria

```text
- source spec-plan 与 generated Codex runtime 对 dispatch / inline fallback 的语义一致
- inline profile application 只能作为显式 fallback 出现
- tests 覆盖 temp-dir init --codex rendering
- 不手改 .codex / .agents runtime mirrors
```

---

#### P0-U4. 增加最小 dispatch-boundary regression tests

##### Goal

用最小测试防止三类最高风险回归：

```text
Codex host 被误判为无 dispatch 能力
source dispatch 被 runtime 静默 inline 化
mutating parallel 缺 isolation / fallback
```

##### Requirements

```text
R7, R8, R9
```

##### Files

Create or modify:

```text
tests/unit/spec-dispatch-boundary-contracts.test.js
tests/unit/workflow-invocation-boundary.test.js
CHANGELOG.md
```

##### Test categories

##### Negative assertion 1: stale Codex anti-dispatch wording

高风险 skills 不得出现：

```text
Codex host 被写成无 dispatch 能力
Codex reviewer persona 被固定改为 inline-only profile simulation
agent profile 存在即绕过 documented workflow phase 直接 dispatch
```

除非 matrix 中明确标记为 accepted divergence。

---

##### Negative assertion 2: silent inline profile downgrade

如果 source 中存在 intended dispatch，generated runtime 不得只出现：

```text
Read .codex/agents/... and apply that agent profile
```

而没有：

```text
spawn_agent
dispatch
fallback
```

---

##### Positive assertion: mutating dispatch safety

涉及 worker / resolver / mutating dispatch 的 skills 必须出现至少一个：

```text
disjoint write-set
fork workspace
git worktree
sequential fallback
serialize
orchestrator final integration
stop when unsafe
```

##### Acceptance Criteria

```text
- tests 锁关键语义，不锁完整文案
- 不把 cross-skill policy 做成大型规则引擎
- skill-specific 细节仍留在各自 contract tests
```

---

### P1 — High-risk Workflow Contract Repair

---

#### P1-U5. 澄清 spec-plan 的 read-only research dispatch

##### Goal

让 `spec-plan` 的 research dispatch 与 Codex multi-agent support 对齐。

##### Requirements

```text
R3, R5, R6, R9
```

##### Files

Modify:

```text
skills/spec-plan/SKILL.md
tests/unit/spec-plan-contracts.test.js
tests/unit/runtime-plan-contracts.test.js
CHANGELOG.md
```

##### Required contract

`spec-plan` 必须说明：

```text
planning research agents are read-only
dispatch is allowed when host/session authorize it
direct workflow invocation may authorize documented research phase
fallback is sequential or inline current-agent research
plan generation must still complete when dispatch is unavailable
```

##### Cost transparency

保留或新增：

```text
multi-agent research may increase token and latency cost
dispatch should be bounded
```

##### Acceptance Criteria

```text
- spec-plan 不再表现为 Claude-only
- Codex runtime 不再表现为 inline-only
- dispatch failure 不阻断 plan 输出
```

---

#### P1-U6. 澄清 spec-ideate 的 read-only ideation dispatch

##### Goal

让 `spec-ideate` 的 ideation / brainstorm / exploration dispatch 成为受控能力，而不是隐式 parallelism。

##### Files

Modify:

```text
skills/spec-ideate/SKILL.md
tests/unit/spec-ideate-contracts.test.js
CHANGELOG.md
```

##### Required contract

```text
ideation dispatch is optional and read-only
host/session rules must allow it
direct invocation may authorize documented ideation phase
fallback to inline / sequential ideation
cost transparency must remain
```

##### Acceptance Criteria

```text
- spec-ideate 不暗示 session 禁止时也一定会 dispatch
- dispatch 不可用时仍能产出 brainstorm / ideation artifact
```

---

#### P1-U7. 审计 resolve-pr-feedback 的 resolver dispatch

##### Goal

确保 PR feedback resolver agent 不会在缺少 isolation / batching / fallback 时并行修改同一组文件。

##### Files

Modify, path to be confirmed:

```text
skills/resolve-pr-feedback/SKILL.md
# or
resolve-pr-feedback/SKILL.md

tests/unit/resolve-pr-feedback-contracts.test.js
CHANGELOG.md
```

##### Required contract

```text
resolver dispatch is mutating-sensitive
direct invocation may authorize resolver dispatch only when safe
overlapping file sets must serialize
conflict-aware batching required
dispatch unavailable -> sequential current-agent fallback
unsafe mutation -> stop or ask for orchestration
```

##### Preserve existing sections

如果已有以下段落，不重写，只补 gate：

```text
Batching
Conflict avoidance
Sequential fallback
```

##### Acceptance Criteria

```text
- resolver agents 不默认并行写同一批文件
- conflict-aware batching 或 sequential fallback 明确存在
- orchestrator owns final integration
```

---

#### P1-U8. 审计 spec-work / spec-work-beta 的 mutating worker dispatch

##### Goal

确保 `spec-work` 和 `spec-work-beta` 对 Codex / Claude / fork workspace / worktree isolation 的描述清晰，避免共享目录并发写入。

##### Files

Modify:

```text
skills/spec-work/SKILL.md
skills/spec-work-beta/SKILL.md
tests/unit/spec-work-contracts.test.js
tests/unit/spec-work-beta-contracts.test.js
CHANGELOG.md
```

##### Required contract

```text
mutating worker dispatch requires isolation
Codex fork-workspace semantics must be explicit if used
Claude shared-directory semantics must not be assumed
overlapping writes require serialization
orchestrator owns final integration / verification / staging / commits
child agents must not stage or commit unless explicitly allowed
```

##### Acceptance Criteria

```text
- spec-work 不声称 Codex subagents 与 orchestrator 共享目录
- fork workspace handoff 下 orchestrator 负责最终整合
- 无 isolation 时 fallback 到 sequential current-agent implementation
```

---

### P2 — Low-risk / Experimental Parallelism Cleanup

---

#### P2-U9. 审计 spec-debug 的 parallel investigation

##### Goal

确保 `spec-debug` 的 parallel investigation 是 latency optimization，不是 correctness dependency。

##### Files

Modify if needed:

```text
skills/spec-debug/SKILL.md
tests/unit/spec-debug-contracts.test.js
CHANGELOG.md
```

##### Required contract

```text
parallel debug probes are read-only
dispatch is optional
sequential fallback must exist
debug correctness must not depend on parallel agents
```

##### Acceptance Criteria

```text
- spec-debug 保留 read-only hypothesis probes
- no dispatch support 时可以 sequential debug
```

---

#### P2-U10. 审计 spec-optimize 的 delegation / experiment backend

##### Goal

区分 `spec-optimize` 中不同执行后端：

```text
Codex delegation
worktree experiments
ordinary subagent dispatch
serial local mode
```

##### Files

Modify if needed:

```text
skills/spec-optimize/SKILL.md
tests/unit/spec-optimize-contracts.test.js
CHANGELOG.md
```

##### Required contract

```text
optimization experiments must not assume unbounded parallelism
Codex delegation failure should not be terminal if serial/local mode can continue
worktree mutation requires isolation
final integration belongs to orchestrator
```

##### Acceptance Criteria

```text
- optimize dispatch 是 optional capability
- failure cascade 有 fallback
```

---

#### P2-U11. 审计 agent-native-audit

##### Goal

按 internal helper 处理 `agent-native-audit`，不把它升级成公开 workflow entrypoint。

##### Files

Modify if needed:

```text
skills/agent-native-audit/SKILL.md
CHANGELOG.md
```

##### Required contract

```text
internal helper
capability-gated dispatch
sequential fallback
no unbounded parallelism
no public workflow invocation authorization wording unless entrypoint is public
```

##### Acceptance Criteria

```text
- agent-native-audit 不被误解为 spec-* 公开入口
- dispatch 是 optional helper capability
```

---

#### P2-U12. 审计 compound / brainstorm / slack-research 等低风险 dispatch 语义

##### Goal

将以下 skill 中的 dispatch / parallelism 统一分类：

```text
spec-compound
spec-compound-refresh
spec-brainstorm
spec-slack-research
```

##### Files

Modify if needed:

```text
skills/spec-compound/SKILL.md
skills/spec-compound-refresh/SKILL.md
skills/spec-brainstorm/SKILL.md
skills/spec-slack-research/SKILL.md
CHANGELOG.md
```

##### Required contract

```text
dispatch is optional unless explicitly required
fallback must exist
external research / slack research must respect host/session/tool access
no CE-only assumptions
```

##### Acceptance Criteria

```text
- 低风险 skill 不把 parallelism 写成 correctness dependency
- 无工具 / 无 dispatch 时有 degraded path
```

---

## Testing Strategy

### Narrow tests first

优先运行 touched skill 的单测：

```bash
npm test -- tests/unit/spec-code-review-contracts.test.js
npm test -- tests/unit/spec-plan-contracts.test.js
npm test -- tests/unit/runtime-plan-contracts.test.js
npm test -- tests/unit/init-dry-run.test.js
npm test -- tests/unit/spec-dispatch-boundary-contracts.test.js
```

---

### Runtime rendering tests

如果修改 `src/cli/adapters/codex.js`，必须使用 temp-dir 验证：

```text
init --codex generated content
source skill intent
generated runtime semantics
```

不能通过手改 `.codex/` 或 `.agents/skills/` 验证。

---

### Skill entrypoint boundary

运行：

```bash
npm run lint:skill-entrypoints
```

确保公开 workflow entrypoint 和 agent/helper boundary 没有漂移。

---

### Typecheck

如果 adapter code 变更，运行：

```bash
npm run typecheck
```

---

### Contract test philosophy

测试应该锁：

```text
关键负向旧假设
关键正向边界
source/runtime consistency
mutating dispatch safety
```

测试不应该锁：

```text
完整 prose
每一句 wording
所有 skill 统一句式
```

---

## Verification Checklist

最终实施完成后，必须输出验证报告。

### Source validation

```text
- touched source skills list
- each changed skill's matrix action
- accepted CE divergence list
```

---

### Runtime validation

```text
- Codex generated runtime contract checked
- no manual runtime mirror edits
- source/runtime semantics aligned
```

---

### Test validation

列出实际运行命令和结果：

```text
npm test -- ...
npm run lint:skill-entrypoints
npm run typecheck
```

---

### Limitation statement

如果未执行 fresh host-session behavioral validation，必须说明：

```text
Fresh dispatch behavior was not executed because current host/session policy was not part of this implementation pass.
Source and generated-runtime contract tests were used as validation.
```

---

### Runtime refresh statement

如果没有执行 `init --codex` / `init --claude`，必须说明：

```text
Runtime mirrors were not regenerated in this plan.
Users must rerun init/regeneration to refresh local generated runtime assets.
```

---

## Documentation / Operational Notes

### Required docs

Create:

```text
docs/validation/2026-05-05-ce-dispatch-boundary-audit-matrix.md
```

Modify:

```text
CHANGELOG.md
```

---

### Optional docs

Only if user-visible behavior changes:

```text
README.md
docs/contracts/workflows/fresh-source-eval-checklist.md
docs/solutions/workflow-issues/*
```

---

### Changelog strategy

按实施批次更新，不按每个 Unit 强制更新。

推荐条目：

```markdown
- fix: tighten CE-lineage dispatch boundary contracts across source skills and Codex runtime rendering
  - Codex runtime no longer silently rewrites documented research dispatch into inline profile application.
  - spec-code-review now treats Codex spawn_agent as supported when host and session policy allow it.
  - Added regression tests for dispatch boundary drift and mutating workflow isolation.
```

如果包含用户可见行为，追加：

```markdown
  - (user-visible) `spec-code-review` now documents Codex reviewer dispatch support when the workflow's documented reviewer phase and host capability select it.
```

---

## Risks & Dependencies

| Risk                                           | Priority | Mitigation                                           | Owner       |
| ---------------------------------------------- | -------: | ---------------------------------------------------- | ----------- |
| 机械 CE parity 覆盖 spec-first-specific governance |       P0 | Matrix-first；CE 只作为 evidence                         | implementer |
| Codex runtime 继续静默 inline 化 source dispatch    |       P0 | U3 generated-runtime contract tests                  | implementer |
| Mutating parallel dispatch 导致 file collision   |    P0/P1 | isolation / disjoint write-set / sequential fallback | implementer |
| Tests 变成 brittle wording snapshot              |       P1 | 锁语义，不锁完整 prose                                       | implementer |
| 一次性修改过多 skill 导致 review 失控                     |       P1 | P0/P1/P2 分阶段实施                                       | implementer |
| runtime mirrors 未刷新导致用户本地仍旧行为                  |       P1 | final report 明确 runtime refresh limitation           | implementer |
| dirty worktree 覆盖用户未提交改动                       |       P0 | 编辑前读取目标文件，局部 patch，不 revert unrelated changes        | implementer |
| CE divergence 没有记录，后续 sync 又覆盖回来               |       P1 | matrix 增加 accepted_divergence                        | implementer |

---

## System-Wide Impact

### Interaction graph

影响：

```text
workflow skill prose
Codex runtime rendering
generated-runtime expectation tests
contract tests
validation docs
CHANGELOG
```

不应影响：

```text
public workflow names
runtime mirrors by manual editing
CE-only feature surface
```

---

### Error propagation

dispatch 不可用时：

```text
read-only workflows -> report-only / sequential / inline fallback
mutating workflows -> serialize / stop / isolated handoff
```

---

### State lifecycle

source 和 tests 是真相源。

runtime mirrors 是 disposable outputs。

未 regenerate 前，不应声称用户本地 runtime 已刷新。

---

### API surface parity

Claude 和 Codex 应暴露等价 workflow semantics。

但 primitive 不必相同：

```text
Claude: Task / Agent primitive
Codex: spawn_agent
Fallback: inline / sequential
```

---

## Final Acceptance Criteria

本计划完成后，必须满足：

```text
1. 所有含 dispatch / agent / parallel 语义的 skill 已进入 matrix
2. matrix 标记了 repair_priority 和 accepted_divergence
3. spec-code-review 不再包含 Codex 天然不能 dispatch 的旧假设
4. Codex runtime rendering 不再把 source dispatch 静默降级为 inline profile application
5. spec-plan source 与 generated Codex runtime 语义一致
6. mutating workflows 明确 isolation / write-set / sequential fallback / orchestrator integration
7. regression tests 覆盖 stale Codex assumption、runtime silent downgrade、mutating parallel safety
8. 没有手动修改 generated runtime mirrors
9. CHANGELOG 按实施批次更新
10. final report 明确 tests、limitations、runtime refresh 状态
```

---

## Recommended Execution Order

最终推荐执行顺序：

```text
P0-U1  Matrix
P0-U2  spec-code-review
P0-U3  Codex runtime rendering
P0-U4  minimal regression tests

P1-U5  spec-plan
P1-U6  spec-ideate
P1-U7  resolve-pr-feedback
P1-U8  spec-work / spec-work-beta

P2-U9   spec-debug
P2-U10  spec-optimize
P2-U11  agent-native-audit
P2-U12  compound / brainstorm / slack-research
```

如果要进一步压缩 MVP，最小可执行版本是：

```text
P0-U1
P0-U2
P0-U3
P0-U4
```

这四项完成后，`spec-first` 的 skill 调度控制面就能先止血。

---

## Summary

本计划的本质不是：

```text
同步 CE
```

而是：

```text
修复 spec-first 从 CE 继承而来的 skill dispatch 控制面漂移。
```

最重要的修复点是：

```text
source skill、runtime adapter、generated runtime、tests 必须对 dispatch 语义保持一致。
```

最终目标：

```text
让 spec-first 的每个 skill 都知道：
什么时候可以调 agent，
什么时候不能调，
调失败怎么办，
能不能写文件，
谁负责最终集成，
和 CE 有哪些有意差异。
```

一句话定性：

```text
这是 spec-first 从“继承 CE workflow 形态”走向“拥有自己受控 skill 体系”的必要治理步骤。
```
