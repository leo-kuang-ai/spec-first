# `spec-evolve` Skill 终版技术方案

> Lifecycle: historical-input / external-reference. 本文保留旧架构、方案、迁移或研究记录；当前 source of truth 以 `docs/README.md`、根目录 README、`docs/05-用户手册/`、`docs/contracts/`、`skills/`、`src/cli/` 和 `CHANGELOG.md` 为准。

> 文档角色：`spec-first 自我演化决策入口 / Meta Workflow Skill / Best Practice Intake Skill`
> 适用项目：`spec-first`
> 核心目标：让 spec-first 能持续审查自身、吸收业界最佳实践、做出有证据的演进决策，并通过自己的 workflow 持续优化自己。
> 核心原则：`Light contract；Explicit boundaries；Scripts prepare signals；LLM makes synthesis decisions；Workflow owns governance.`

---

# 0. 最终结论

`spec-evolve` 是一个有潜力的自我演化决策入口，但是否新增为正式 source skill，必须由 Cycle 0 composition baseline 决定。

如果现有 `skill-audit` + `doc-review` + `spec-plan` + `compound` 的组合已经能稳定完成系统级演进决策，则不新增 `spec-evolve`。

如果 Cycle 0 发现明确 named gaps，则进入 Cycle 1，新增 source-only `spec-evolve` MVP。

即使进入 Cycle 1，它也不能一上来做成：

```text
可运行 workflow command
+ 11 份报告
+ 多个自动分析脚本
+ 第二套 agent 专家体系
+ 自动接入 plan/work/review
```

它的终版定位应该是：

```text
spec-evolve = spec-first 的自我演化决策入口
```

它的核心价值不是“生成报告”，而是持续产生：

```text
evidence-backed evolution decision
```

也就是每一轮都能回答：

```text
发现了什么？
证据是什么？
这是不是 spec-first 当前真实问题？
业界有没有更好的实践可以吸收？
要不要演进？
接受、跳过，还是延后？
交给哪个 workflow 节点继续？
如何验证？
这次经验如何沉淀到下一轮？
```

最终闭环：

```text
Goal
  -> Evidence
  -> Diagnosis
  -> Best Practice Intake
  -> Evolution Decision
  -> Proposal
  -> Plan Handoff
  -> spec-plan
  -> spec-write-tasks
  -> spec-work
  -> code-review / skill-audit
  -> compound
  -> Next Evolution
```

一句话：

```text
spec-first 不只是帮助别的项目研发，它也能用自己的 workflow 持续优化自己。
```

---

# 1. 背景与问题

当前 spec-first 已经有一套完整研发辅助链路：

```text
mcp-setup / graph-bootstrap
-> ideate / brainstorm / doc-review
-> plan
-> write-tasks
-> work / debug / optimize / polish
-> code-review / app-consistency-audit
-> compound / compound-refresh / skill-audit
```

这些节点已经能覆盖很多单点能力，但随着 skill、agent、artifact、runtime 产物变多，会出现系统级风险。

---

## 1.1 当前主要风险

| 风险            | 说明                                                              |
| ------------- | --------------------------------------------------------------- |
| workflow 断链   | plan、tasks、work、review、compound 之间可能没有真实闭环                      |
| skill 边界漂移    | brainstorm 做设计，plan 拆任务，write-tasks 重新设计方案，work 绕过计划            |
| agent 专家膨胀    | 为了“专业”不断新增 agent，但缺少调度边界                                        |
| context 膨胀    | AGENTS.md / CLAUDE.md / repo-profile / graph / compound 全部塞进上下文 |
| artifact 不可信  | latest 产物可能过期，graph/evolution proposal 可能和当前 commit 不匹配         |
| scripts 越权    | 脚本开始做语义判断，把 drift / priority / overdesign 硬编码                   |
| docs-code 不一致 | README、官网、docs、skill 文档和真实代码能力脱节                                |
| 经验不复利         | review 发现的问题没有进入下一轮 plan / evolve                               |
| 业界最佳实践吸收随机    | 看到新工具、新范式就想集成，缺少 intake / decision / verification 机制            |

这些不是单个 `skill-audit`、`doc-review`、`code-review` 能完整解决的问题。

因此需要一个更高层的 meta skill：

```text
spec-evolve
```

---

# 2. `spec-evolve` 的核心定位

## 2.1 定义

```text
spec-evolve 是 spec-first 的自我演化决策入口。
```

它负责：

1. 审查 spec-first 当前 workflow 是否仍然闭环；
2. 审查 skill 是否职责清晰、边界稳定；
3. 审查 agent/lens 是否被合理调度，而不是重复膨胀；
4. 审查 artifact contract 是否稳定、fresh、可消费；
5. 审查 source/runtime 边界是否清晰；
6. 审查 context 是否过重或错位；
7. 审查 review / compound 是否能反哺下一轮；
8. 持续吸收业界最佳实践；
9. 判断哪些实践适合 spec-first；
10. 输出 evidence-backed evolution decision；
11. 将已接受的演进建议交给 `spec-plan`，而不是自己设计实现；
12. 将 review 和 compound 结果作为下一轮 evolve 输入。

---

## 2.2 它不是做什么

`spec-evolve` 不是：

```text
自动重构机器人
报告生成器
第二套专家系统
脚本裁判系统
重型 workflow engine
每次小改都必须跑的 gate
```

它是：

```text
目标对齐器
系统体检器
演进裁判
最佳实践吸收入口
plan handoff 入口
知识复利触发器
```

---

# 3. 和现有 skill 的关系

## 3.1 总体关系

```text
spec-evolve
  -> 调用 / 参考 skill-audit 审 skill
  -> 调用 / 参考 doc-review 审文档
  -> 调用 / 参考 code-review 审代码变更风险
  -> 调用 / 参考 compound 读取历史经验
  -> 输出 evolution decision
  -> handoff 给 spec-plan
```

它不是替代现有 skill，而是把现有 skill 的结果提升为系统级演进决策。

---

## 3.2 与核心 skill 的边界

| Skill              | 职责                | 与 `spec-evolve` 的关系                                        |
| ------------------ | ----------------- | ---------------------------------------------------------- |
| `skill-audit`      | 审查单个或一组 skill 的质量 | `spec-evolve` 读取其结果，判断是否形成系统演进 gap                         |
| `doc-review`       | 审查文档质量和一致性        | `spec-evolve` 判断文档问题是否需要进入 plan                            |
| `spec-plan`        | 设计实现方案            | `spec-evolve` 只提供 advisory handoff，不输出 implementation plan |
| `spec-write-tasks` | 把 plan 编译成任务      | 不直接接收 evolve，接收 plan 产物                                    |
| `spec-work`        | 执行任务              | 不直接由 evolve 驱动                                             |
| `code-review`      | 审代码 diff 质量       | 验证 evolve 产生的实现变更                                          |
| `compound`         | 沉淀经验              | 输出 next-cycle input 给下一轮 evolve                            |
| `compound-refresh` | 刷新长期知识            | 为 evolve 提供历史 pattern / anti-pattern                       |
| `mcp-setup`        | 安装和检查外部 provider  | evolve 审其 readiness / trust / runtime 边界                   |
| `graph-bootstrap`  | 准备代码图谱事实          | evolve 审其 artifact freshness / downstream consumption      |

---

# 4. 设计原则

## 4.1 Light Contract

只定义必要契约，不搞复杂状态机。

```text
用轻量协议约束输入、输出、边界、handoff。
不要引入重型 workflow runtime。
```

---

## 4.2 Explicit Boundaries

边界必须显式：

```text
spec-evolve 负责“是否值得演进、演进什么、为什么”。
spec-plan 负责“如何设计实现”。
write-tasks 负责“如何拆任务”。
work 负责“如何执行”。
review 负责“是否正确”。
compound 负责“如何沉淀”。
```

---

## 4.3 Scripts Prepare Signals

脚本只做确定性、结构化、低语义的事情：

```text
路径扫描
section 检测
schema 检测
hash 生成
freshness metadata
reason_code
surface signals
```

脚本不做：

```text
drift 判断
priority 判断
recommendation
overdesign 判断
是否新增 skill
是否进入 plan
```

---

## 4.4 LLM Makes Synthesis Decisions

语义判断交给 LLM synthesis：

```text
这是不是真的问题？
是否值得演进？
优先级是什么？
是否过度设计？
现有 skill 组合是否已足够？
业界实践是否适合 spec-first？
```

---

## 4.5 Workflow Owns Governance

治理归 workflow，不归单个脚本或单个 agent。

```text
所有演进都必须经过：
evidence -> decision -> plan handoff -> plan -> tasks -> work -> review -> compound
```

---

# 5. 非目标

| 非目标                            | 说明                                 |
| ------------------------------ | ---------------------------------- |
| 不直接实现大规模代码改动                   | 防止失控                               |
| 不绕过 `spec-plan`                | 保持 workflow 边界                     |
| 不输出 implementation plan        | implementation plan 属于 `spec-plan` |
| 不默认新增 agent profiles           | 优先复用现有 reviewer / lens             |
| 不默认新增 scripts                  | P0/P1 先 source-only / dogfood      |
| 不承诺 P0 可运行 `spec-evolve` / `spec-evolve` | P0 是 source-only MVP               |
| 不做后台 daemon                    | 当前由 maintainer 手动触发                |
| 不成为所有小改默认 gate                 | 只覆盖系统级变更                           |
| 不自动写 `repo-profile.yaml`       | repo-profile 只存确认过的稳定标准            |
| 不膨胀 AGENTS.md / CLAUDE.md      | 全局上下文只放短规则                         |
| 不修改 runtime generated copies   | 只能改 source assets                  |

---

# 6. Operating Model：运行模型

## 6.1 默认运行者

```text
Primary operator: spec-first maintainer
```

当前阶段由项目维护者手动触发，不做自动后台任务。

---

## 6.2 默认触发场景

`spec-evolve` v1 默认用于系统级变更：

| 变更类型                        | 是否默认运行 `spec-evolve` |
| --------------------------- | -------------------- |
| 新增 skill                    | 是                    |
| 重构 skill                    | 是                    |
| workflow 链路调整               | 是                    |
| artifact contract 调整        | 是                    |
| graph/provider/readiness 调整 | 是                    |
| source/runtime 生成机制调整       | 是                    |
| AGENTS.md / CLAUDE.md 治理调整  | 是                    |
| agent/lens 调度规则调整           | 是                    |
| release readiness           | 条件触发                 |
| 大版本发布前                      | 条件触发                 |
| 官网/README 大改                | 建议运行                 |
| 普通 bugfix                   | 否，可选                 |
| 文案 typo                     | 否                    |
| 小范围 refactor                | 否，可选                 |
| test-only change            | 否，可选                 |

一句话：

```text
spec-evolve 是系统演进前置裁判，不是日常小改硬 gate。
```

Release readiness / 大版本发布前只有在 release 包含系统级演进面时默认运行 `spec-evolve`，例如：

```text
workflow changes
skill changes
artifact contract changes
runtime governance changes
graph/provider readiness changes
agent/lens dispatch changes
public positioning changes that affect product identity
```

普通 patch release、版本号更新、小文档或小 bugfix 不默认触发 `spec-evolve`。

---

# 7. Source / Runtime 边界

这是 `spec-evolve` 必须守住的底线。

## 7.1 Source of Truth

可作为 source 的 checked-in assets：

```text
skills/
templates/
src/
src/cli/contracts/**
docs/
README.md
CHANGELOG.md
package.json
```

具体路径以当前仓库真实结构为准。

---

## 7.2 Runtime Generated Copies

以下不能作为 source：

```text
.claude/spec-first/workflows/
.codex/
.agents/
.spec-first/evolution/
.spec-first/graph/
.spec-first/providers/
用户本地 init 后生成的 runtime copies
```

规则：

```text
不允许手工修改 runtime generated copies。
runtime copies 只能通过 init / sync / setup 机制生成。
```

---

## 7.3 `.spec-first/evolution/` 边界

`.spec-first/evolution/` 是 generated runtime artifacts，应该加入 `.gitignore`：

```gitignore
.spec-first/evolution/
```

可提交：

```text
docs/YYYY-MM-DD-spec-evolve/
docs/YYYY-MM-DD-spec-evolve-baseline/
```

不可提交：

```text
.spec-first/evolution/latest/
.spec-first/evolution/runs/
```

---

# 8. 总体执行闭环

```text
Goal
  -> Evidence
  -> Diagnosis
  -> Best Practice Intake
  -> Evolution Decision
  -> Proposal
  -> Plan Handoff
  -> spec-plan
  -> spec-write-tasks
  -> spec-work
  -> code-review / skill-audit
  -> compound
  -> next-cycle-input
```

每个阶段职责如下：

| 阶段                   | 职责                                                      |
| -------------------- | ------------------------------------------------------- |
| Goal                 | 明确本轮演化目标                                                |
| Evidence             | 收集 code/docs/skills/artifacts/review/compound 证据        |
| Diagnosis            | 诊断 workflow gap、skill drift、context bloat、artifact risk |
| Best Practice Intake | 对照业界实践，判断是否可吸收                                          |
| Evolution Decision   | 接受、跳过、延后某个演进方向                                          |
| Proposal             | 形成演进建议                                                  |
| Plan Handoff         | 将 accepted proposal 交给 `spec-plan`                      |
| spec-plan            | 设计 implementation plan                                  |
| write-tasks          | 拆成任务                                                    |
| work                 | 小步执行                                                    |
| review               | code-review / skill-audit 验证                            |
| compound             | 沉淀经验                                                    |
| next-cycle-input     | 下一轮 evolve 的输入                                          |

---

# 9. 分阶段落地路线

## Cycle 0：Composition Baseline

### 目标

在新增 `spec-evolve` 前，先证明现有 skill 组合是否已经足够。

```text
先证明需要，再新增能力。
```

### 使用现有能力

```text
skill-audit
doc-review
spec-plan reasoning
code-review findings if available
compound lessons if available
```

### Evidence Intake 规则

Cycle 0 不能只描述 happy path。每个 evidence input 必须声明：

| 字段                   | 说明                         |
| -------------------- | ---------------------------- |
| discovery path       | 从哪里找该证据                 |
| required / optional  | 是否是本轮判断的必要输入         |
| freshness signal     | 如何判断是否过期               |
| nil handling         | 不存在时如何处理               |
| empty handling       | 存在但无结果时如何处理           |
| error handling       | 读取失败时如何处理              |
| degradation behavior | 降级后还能否继续综合             |

默认规则：

```text
required evidence missing:
  stop and output insufficient_evidence

optional evidence missing:
  continue with missing_evidence_note

stale artifact:
  use only as advisory evidence

read error:
  record reason_code and do not infer semantic truth from that source
```

示例：

```yaml
evidence_inputs:
  skill_audit_reports:
    discovery_path:
      - docs/**/skill-audit*.md
      - .spec-first/reports/skill-audit/**
    required: false
    freshness_signal:
      - source_commit
      - generated_at
    nil_handling: continue_with_missing_evidence_note
    empty_handling: record_no_prior_skill_audit
    error_handling: mark_uncertain_do_not_infer
    degradation_behavior: advisory_only
```

### 必须回答

现有 skill 组合能不能稳定完成：

```text
1. 系统级目标对齐审查
2. 跨 workflow 的 skill 边界审查
3. context bloat 审查
4. artifact contract 审查
5. source/runtime 边界审查
6. 业界最佳实践 intake
7. 演进建议排序
8. plan handoff
9. compound 经验反哺
10. evidence-backed evolution decision
```

### 输出目录

```text
docs/YYYY-MM-DD-spec-evolve-baseline/
  00-summary.md
  01-composition-baseline.md
  02-named-gaps.md
```

### Named Gap 格式

```markdown
## GAP-001: 缺少系统级演进裁判

### Evidence
- skill-audit 能审单个 skill，但没有稳定输出跨 workflow 的 evolution decision。
- doc-review 能审文档，但不能判断某个演进建议是否应进入 plan。
- spec-plan 能设计实现，但缺少前置“是否值得进入 plan”的裁判。

### Impact
系统演进容易变成一次性 prompt，而不是可复用流程。

### Recommendation
新增 source-only spec-evolve，作为 evolution decision 入口。
```

### 决策规则

```text
如果没有 named gaps：
  不新增 spec-evolve，继续复用现有 skill 组合。

如果存在 named gaps：
  进入 Cycle 1，新增 source-only MVP。
```

---

## Cycle 1：Source-only MVP

### 目标

新增最小 `spec-evolve` source skill 定义。

### 范围

```text
新增 source-only spec-evolve/SKILL.md。
新增 skills-governance.json 记录，entry_surface=standalone_skill，command_name=null。
不接 runtime command。
不绑定 command template。
不新增 scripts。
不新增 agent profiles。
不承诺 Claude `spec-evolve` 或 Codex `spec-evolve` 可运行。
```

### P0 输出文档

```text
docs/YYYY-MM-DD-spec-evolve/
  00-summary.md
  01-combined-audit.md
  02-prioritized-roadmap.md
```

完整 11 文件包只属于 Macro Evolution，不属于 MVP。

### P0 必须写清

```text
Purpose
When to use / when not to use
Non-goals
Operating model
Source/runtime boundary
Script/LLM boundary
Evolution decision format
Best practice intake protocol
Plan handoff boundary
Reuse-first lens mapping
MVP outputs
Verification rules
```

---

## Cycle 2：Dogfood Gate

### 目标

用 source-only `spec-evolve` 自审一次，至少产生一个：

```text
evidence-backed evolution decision
```

### Evolution Decision 格式

```markdown
## ED-001: Add source-only spec-evolve skill

### Decision
Accepted / Skipped / Deferred

### Proposal
新增 source-only spec-evolve/SKILL.md。

### Evidence
- GAP-001: 现有 skill 组合缺少系统级演进裁判。
- GAP-002: 现有 review 结果难以稳定转化为 plan handoff。

### Reason
为什么接受 / 跳过 / 延后。

### Consequence
接受后下一步是什么。
跳过后替代方案是什么。
延后后什么时候重新评估。

### Plan Handoff Target
spec-plan / skill-audit / doc-review / code-review / compound / none

默认规则：

```text
accepted implementation-oriented proposals -> spec-plan
validation-oriented decisions -> code-review / skill-audit / doc-review
learning-only decisions -> compound
no follow-up needed -> none
```

### Verification
如何判断这个 decision 有效。

### Effectiveness Check
- Linked named gap:
- What decision changed:
- What would have happened without this ED:
- Plan handoff adoption:
- Follow-up review result:
- Compound feedback:

### Residual Risk
剩余风险是什么。
```

### 验收

P0 不能只证明“报告存在”，必须证明：

```text
spec-evolve 能做出有证据、可追溯、会改变或澄清真实演进动作的决策。
```

Dogfood success 必须满足：

```text
1. ED 追溯到 Cycle 0 named gap。
2. ED 明确改变、阻止、延后或澄清了什么演进动作。
3. ED 有 plan handoff 或 no-handoff reason。
4. 后续 review / compound 记录该 ED 被确认、修正还是推翻。
```

---

## Cycle 3：Signals-only Scripts

只有 dogfood 证明需要结构化证据时，才新增脚本。

### 脚本允许做

```text
扫描路径
检测 section 是否存在
收集 schema/version
生成 run_id
计算 input hash
记录 commit / branch / dirty state
输出 reason_code
输出 surface signals
```

### 脚本不允许做

```text
判断 drift
判断 priority
输出 recommendation
判断 overdesign
判断 large rewrite
判断是否新增 skill
判断是否进入 plan
```

### 推荐脚本命名

```text
collect-skill-contract-signals.js
collect-workflow-surface-signals.js
collect-context-surface-signals.js
collect-runtime-artifact-signals.js
collect-doc-code-surface-signals.js
collect-best-practice-intake-signals.js
```

### 不推荐命名

```text
detect-skill-drift.js
rank-evolution-opportunities.js
validate-evolution-proposal.js
```

这些名字容易暗示脚本在做语义裁判。

---

## Cycle 4：Command Wiring

只有 source-only MVP、governance record 和 first dogfood ED effectiveness check 被验证后，才接命令。

可考虑接入：

```text
templates/claude/commands/spec/evolve.md
skills-governance.json 从 standalone_skill 升级为 workflow_command
src/cli/contracts/**
```

这时才允许承诺：

```text
Claude: spec-evolve
Codex: spec-evolve
```

### Command Wiring 验收

```text
1. source skill 已存在
2. command 模板只路由到 source skill
3. runtime copies 仍由 init/sync 生成
4. skills-governance.json 中有触发说明
5. Claude 入口写作 spec-evolve
6. Codex 入口写作 spec-evolve
7. npm run lint:skill-entrypoints 通过
8. CHANGELOG.md 更新
```

---

## Cycle 5：Plan / Work / Review / Compound 接入

稳定后形成完整闭环：

```text
spec-evolve
  -> evolution decision
  -> evolution proposal
  -> plan handoff
  -> spec-plan
  -> spec-write-tasks
  -> spec-work
  -> code-review / skill-audit
  -> compound
  -> next-cycle-input
```

关键：

```text
spec-evolve 不直接产出 implementation plan。
spec-evolve 只产出 advisory plan handoff。
```

---

## Cycle 6：Skill Eval / CI / Evolution Memory

更成熟后再增加：

```text
skill eval prompts
trigger / non-trigger eval
output contract eval
review routing
docs-sync report-first
release-readiness report-first
compound evolution memory
best-practice watchlist
```

---

# 10. `spec-evolve/SKILL.md` 终版内容结构

建议 `SKILL.md` 采用以下结构。

```markdown
# spec-evolve

## Purpose

`spec-evolve` is the self-evolution decision entrypoint for spec-first.

It helps spec-first improve itself through evidence-backed evolution decisions, controlled plan handoff, review gates, best-practice intake, and knowledge feedback.

It is not an auto-rewrite system, report generator, or second expert framework.

## When to Use

Use this skill when the change affects:

- skill boundaries
- workflow structure
- artifact contracts
- graph/provider readiness
- runtime governance
- source/runtime generation
- agent/lens dispatch
- context routing
- release readiness
- best-practice integration
- long-term project direction

Do not use by default for:

- small bugfixes
- typo fixes
- local refactors
- test-only changes
- narrow docs edits

## Core Loop

Goal
-> Evidence
-> Diagnosis
-> Best Practice Intake
-> Evolution Decision
-> Proposal
-> Plan Handoff
-> Plan
-> Tasks
-> Work
-> Review
-> Compound
-> Next Evolution

## Responsibilities

1. Build a system-level understanding of the current spec-first workflow.
2. Identify workflow gaps, skill boundary drift, context bloat, artifact contract risks, runtime boundary risks, and reliability risks.
3. Intake relevant industry best practices.
4. Decide whether each evolution opportunity should be accepted, skipped, or deferred.
5. Produce plan handoff briefs for accepted proposals.
6. Ensure implementation goes through existing spec-first workflow.
7. Ensure review findings and lessons are captured for the next cycle.

## Non-Responsibilities

- Do not directly implement broad changes.
- Do not bypass spec-plan.
- Do not output implementation plans.
- Do not create new agent profiles by default.
- Do not treat scripts as semantic judges.
- Do not hand-edit generated runtime copies.
- Do not write temporary findings into repo-profile.yaml.
- Do not expand AGENTS.md / CLAUDE.md with noisy details.
- Do not become a default gate for every small change.

## Source / Runtime Boundary

Source assets include checked-in files such as:

- skills/
- templates/
- src/
- src/cli/contracts/**
- docs/
- README.md
- CHANGELOG.md
- package.json

Runtime generated copies must not be treated as source of truth.

Do not hand-edit runtime generated directories such as:

- .claude/spec-first/workflows/
- .codex/
- .agents/
- .spec-first/evolution/
- .spec-first/graph/
- .spec-first/providers/

## Script / LLM Boundary

Scripts may collect structural signals.

Scripts may output:

- paths
- sections
- signal types
- reason codes
- schema versions
- generated_at
- commit
- branch
- dirty state
- input hash

Scripts must not decide:

- drift
- priority
- recommendation
- overdesign
- large rewrite
- whether to add a skill
- whether to enter plan

LLM synthesis makes semantic decisions.

## Required Outputs for MVP

For P0/MVP, write only:

docs/YYYY-MM-DD-spec-evolve/
  00-summary.md
  01-combined-audit.md
  02-prioritized-roadmap.md

Full macro audits may produce larger report packs, but MVP must stay small.

## Evolution Decision Format

Each evolution decision must include:

- Decision ID
- Decision: Accepted / Skipped / Deferred
- Proposal
- Evidence
- Reason
- Consequence
- Plan handoff target
- Verification
- Residual risk

## Plan Handoff Boundary

`spec-evolve` outputs advisory plan handoff context.

It does not output implementation plans.

`spec-plan` may:

- accept
- revise
- reject
- defer
- request more evidence

## Best Practice Intake

When using industry best practices:

1. Identify the practice.
2. Explain the problem it solves.
3. Compare with current spec-first gaps.
4. Decide Accepted / Skipped / Deferred.
5. Map to existing workflow first.
6. Avoid adding new skill or agent unless named gaps prove it is necessary.
7. Verify with dogfood.
8. Compound the lesson.

## Agent / Lens Model

P0/P1 use inline lenses and existing reviewers.

Do not add new agent profiles by default.

Use reuse-first mapping:

1. existing reviewer
2. existing skill
3. inline lens
4. new agent only if dogfood proves a named capability gap

## Evolution Safety Rules

- Prefer small reviewable changes.
- Prefer source assets over runtime copies.
- Prefer artifact contracts over hidden assumptions.
- Prefer signals over fake deterministic semantic decisions.
- Prefer advisory handoff over direct implementation.
- Prefer dogfood evidence over theoretical architecture.
- Prefer compound memory over repeated rediscovery.
```

---

# 11. Artifact 协议

## 11.1 MVP 文档产物

```text
docs/YYYY-MM-DD-spec-evolve/
  00-summary.md
  01-combined-audit.md
  02-prioritized-roadmap.md
```

每个 MVP Markdown 产物必须在头部记录最小 freshness metadata。P0 不需要新增脚本，但必须显式记录这些事实：

```yaml
---
generated_at: 2026-05-05T12:00:00Z
source_commit: <git-sha>
branch: <branch-name>
dirty_state: true|false
reviewed_inputs:
  - README.md
  - CHANGELOG.md
  - skills/
  - templates/
  - src/
  - docs/
---
```

### `00-summary.md`

```markdown
# Summary

## Active Goal
本轮 spec-first 自我演化目标。

## Decision Summary
本轮产生了哪些 evolution decisions。

## Key Evidence
核心证据列表。

## Accepted Proposals
接受的演进建议。

## Skipped / Deferred
跳过或延后的建议及原因。

## Next Cycle
下一轮建议。
```

---

### `01-combined-audit.md`

```markdown
# Combined Audit

## Workflow Audit
workflow 是否闭环。

## Skill Boundary Audit
skill 是否越界、重复、缺输入输出。

## Artifact Contract Audit
artifact 是否稳定、fresh、可消费。

## Context Routing Audit
上下文是否过量、错位、污染。

## Runtime Governance Audit
source/runtime 是否混淆。

## Reliability Audit
schema、freshness、error handling、degraded mode 是否可靠。

## Best Practice Intake
本轮参考了哪些业界实践，是否适配当前项目。

## Named Gaps
需要进入 evolution decision 的 gap。
```

---

### `02-prioritized-roadmap.md`

```markdown
# Prioritized Roadmap

## P0
必须先修的边界、决策、contract 问题。

## P1
可以增强的 handoff、context routing、review routing。

## P2
signals scripts、eval、command wiring。

## P3
macro audit、release readiness、best-practice watchlist。

## Not Doing
明确不做的内容。
```

---

## 11.2 Runtime Artifacts

Cycle 3 后可出现 runtime artifacts：

```text
.spec-first/evolution/latest/
  evolution-signals.json
  evolution-decisions.json
  evolution-proposal.json
  plan-handoff.json
```

这些必须 ignored。

关系：

```text
evolution-signals.json
  -> 原始结构化 signals

evolution-decisions.json
  -> LLM synthesis 后的 ED 决策记录

evolution-proposal.json
  -> accepted ED 聚合后的 advisory evolution proposal

plan-handoff.json
  -> 从 proposal 派生出来、交给 spec-plan 的 handoff brief
```

`plan-handoff.json` 必须链接 `proposal_id` 和 `decision_id`。

每个 artifact 必须包含 freshness metadata：

```json
{
  "schema_version": "spec-evolve.artifact.v1",
  "run_id": "2026-05-05T120000Z-abc123",
  "generated_at": "2026-05-05T12:00:00Z",
  "repo": {
    "commit": "abc123",
    "branch": "leo-2026-05-05-spec-evolve",
    "dirty": false
  },
  "inputs": {
    "source_hash": "...",
    "docs_hash": "...",
    "skills_hash": "..."
  }
}
```

消费者规则：

```text
same commit + same input hash:
  trusted

same branch but dirty/source changed:
  stale advisory

different commit:
  degraded or reject
```

---

# 12. Evolution Decision 协议

## 12.1 目的

避免 `spec-evolve` 退化成报告生成器。

每轮必须至少产生一个清晰的 decision：

```text
Accepted / Skipped / Deferred
```

---

## 12.2 Markdown 格式

```markdown
## ED-001: <Decision Title>

### Decision
Accepted / Skipped / Deferred

### Proposal
要不要做什么。

### Source Freshness
- generated_at:
- source_commit:
- branch:
- dirty_state:
- reviewed_inputs:

### Evidence
- 文件、报告、review finding、代码路径、历史 lesson。
- 每条 evidence 必须可追溯。

### Reason
为什么接受、跳过或延后。

### Consequence
这个决策会导致什么后果。

### Plan Handoff Target
spec-plan / skill-audit / doc-review / code-review / compound / none

### Verification
如何验证这个决策是正确的。

### Effectiveness Check
- Linked named gap:
- What decision changed:
- What would have happened without this ED:
- Plan handoff adoption:
- Follow-up review result:
- Compound feedback:

### Residual Risk
剩余风险。

### Next Cycle Input
下一轮 evolve 应该关注什么。
```

---

## 12.3 JSON 格式

```json
{
  "schema_version": "spec-evolve.decision.v1",
  "decision_id": "ED-001",
  "title": "Add source-only spec-evolve skill",
  "decision": "accepted",
  "proposal": "Add source-only spec-evolve/SKILL.md.",
  "source_freshness": {
    "generated_at": "2026-05-05T12:00:00Z",
    "source_commit": "abc123",
    "branch": "leo-2026-05-05-spec-evolve",
    "dirty_state": true,
    "reviewed_inputs": [
      "skills/",
      "templates/",
      "src/",
      "docs/"
    ]
  },
  "evidence": [
    {
      "type": "named_gap",
      "id": "GAP-001",
      "summary": "Existing skill composition lacks a system-level evolution decision entrypoint."
    }
  ],
  "reason": "Existing skills can audit local areas but do not produce stable cross-workflow evolution decisions.",
  "consequence": "Add source-only MVP without runtime command wiring.",
  "plan_handoff_target": "spec-plan",
  "verification": [
    "Dogfood must produce at least one evidence-backed evolution decision."
  ],
  "effectiveness_check": {
    "linked_named_gap": "GAP-001",
    "what_decision_changed": "Prevented direct command wiring before source-only dogfood.",
    "what_would_have_happened_without_this_ed": "The project may have added runtime command wiring before validating the source skill.",
    "plan_handoff_adoption": "pending",
    "follow_up_review_result": "pending",
    "compound_feedback": "pending"
  },
  "residual_risk": [
    "May still overlap with skill-audit if boundaries are not enforced."
  ],
  "next_cycle_input": [
    "Validate whether source-only MVP is useful before adding scripts or command wiring."
  ]
}
```

---

# 13. Best Practice Intake 协议

## 13.1 目标

`spec-evolve` 要持续吸收业界最佳实践，但必须防止“大杂烩”。

正确流程：

```text
Industry Best Practice
  -> Normalize
  -> Compare with current gaps
  -> Evolution Decision
  -> Map to existing workflow
  -> Controlled Integration
  -> Review
  -> Compound
```

---

## 13.2 Best Practice Integration Protocol

```text
1. Observe
   发现业界实践。

2. Normalize
   抽象成问题、机制、适用边界。

3. Compare
   对照 spec-first 当前 workflow 是否存在同类问题。

4. Decide
   Accepted / Skipped / Deferred。

5. Map
   优先映射到已有 skill / artifact / gate。

6. Integrate
   小步改 source assets，不改 runtime generated copies。

7. Verify
   通过 skill-audit / code-review / docs consistency / eval 验证。

8. Compound
   沉淀为 pattern / anti-pattern / next-cycle input。
```

---

## 13.3 Best Practice Intake 格式

```markdown
## BP-001: Plan-first for complex changes

### Source
Codex / Claude / OSS / internal dogfood / project review

### Practice
复杂任务先 plan，再 implementation。

### Problem Solved
减少直接实现导致的 scope creep、遗漏验证、架构返工。

### Relevance to spec-first
spec-first 已有 spec-plan，但 workflow / skill / runtime governance 变更需要明确默认先 plan。

### Current Gap
重要 workflow 变更可能直接进入 work，缺少 plan handoff。

### Decision
Accepted / Skipped / Deferred

### Integration Target
- AGENTS.md trigger rule
- spec-evolve plan handoff
- spec-plan input contract

### Not Doing
不引入重型 planner runtime。

### Verification
下一次 workflow 变更必须先产生 plan handoff。
```

---

## 13.4 Best Practice Watchlist

首批实践只能作为 watchlist，不能直接赋予 P0/P1，也不能直接绑定 integration target。

规则：

```text
No best practice receives priority or integration target until linked to a current named gap or accepted ED.
```

| Practice               | Source                          | Problem Solved       | Possible Relevance          | Counter-signal        | Evidence Quality | Status    |
| ---------------------- | ------------------------------- | -------------------- | --------------------------- | --------------------- | ---------------- | --------- |
| Plan-first             | Codex docs / project dogfood    | 降低复杂任务返工        | workflow 变更需要先 plan       | 小变更不应强制 plan      | medium           | watchlist |
| Repo-local skills      | project dogfood / OSS agents    | 重复工程流程无法复用      | skill contract 统一           | 现有 skill 组合可能足够   | medium           | watchlist |
| Progressive disclosure | model-context practice          | 上下文过载             | context routing             | 过度路由会增加认知负担      | medium           | watchlist |
| Context engineering    | model-context practice          | 模型注意力被稀释          | context-bloat audit         | 缺少本项目 token 证据     | medium           | watchlist |
| Report-first workflow  | project review / safety pattern | 自动修改容易失控          | evolve / docs-sync 先报告      | 对机械修复可能太重         | medium           | watchlist |
| Skill evals            | agent workflow practice         | skill 好坏靠感觉        | skill-audit + eval          | eval 成本可能高于收益      | low              | watchlist |
| Subagents              | review workflow practice        | 并行审查复杂任务          | macro audit / PR review     | 普通文档审查可能不需要      | medium           | watchlist |
| Security review        | MCP/tool trust practice         | MCP/skill/tool 信任风险 | mcp-setup / skill-audit lens | 无 trust boundary 时不适用 | medium           | watchlist |
| Release readiness      | release engineering practice    | 发布前一致性风险          | release-readiness report    | 普通 patch release 不应触发 | medium           | watchlist |
| Evolution memory       | compound dogfood                | 经验不能复利            | compound next-cycle input   | 早期可先人工记录          | medium           | watchlist |

---

# 14. Agent / Lens 设计

## 14.1 原则

不要新增第二套专家体系。

终版原则：

```text
reuse-first
inline-first
evidence-before-new-agent
```

顺序：

```text
1. 先作为 SKILL.md 内联 lens
2. 再映射到现有 reviewer / persona
3. 如果多轮 dogfood 证明能力不足，再新增 agent profile
```

---

## 14.2 P0/P1 内联 Lens

| Lens                 | 用途                            |
| -------------------- | ----------------------------- |
| `goal-alignment`     | 判断是否服务于 spec-first 北极星        |
| `workflow-boundary`  | 判断是否破坏 workflow 边界            |
| `skill-contract`     | 判断 skill 输入、输出、non-goals 是否清楚 |
| `artifact-contract`  | 判断 artifact 是否稳定、fresh、可消费    |
| `context-routing`    | 判断上下文是否过量或错位                  |
| `runtime-governance` | 判断 source/runtime 是否混淆        |
| `reliability`        | 判断错误、降级、schema、freshness 是否可靠 |
| `best-practice-fit`  | 判断业界实践是否适合当前项目                |
| `evolution-safety`   | 判断是否过度设计、过早自动化                |
| `knowledge-feedback` | 判断 compound 是否能反哺下一轮          |

---

## 14.3 Reuse-first Reviewer Mapping

```yaml
lens_mapping:
  goal-alignment:
    preferred_existing_reviewers:
      - product-lens
      - coherence

  workflow-boundary:
    preferred_existing_reviewers:
      - coherence
      - scope-guardian

  skill-contract:
    preferred_existing_reviewers:
      - skill-audit
      - coherence

  artifact-contract:
    preferred_existing_reviewers:
      - feasibility
      - adversarial

  context-routing:
    preferred_existing_reviewers:
      - scope-guardian
      - adversarial

  runtime-governance:
    preferred_existing_reviewers:
      - feasibility
      - scope-guardian

  reliability:
    preferred_existing_reviewers:
      - feasibility
      - adversarial

  best-practice-fit:
    preferred_existing_reviewers:
      - product-lens
      - feasibility
      - adversarial

  evolution-safety:
    preferred_existing_reviewers:
      - scope-guardian
      - adversarial

  knowledge-feedback:
    preferred_existing_reviewers:
      - product-lens
      - coherence
```

这只是 mapping，不代表新增 agent profiles。

---

# 15. `evolution-proposal.json` 权威级别

## 15.1 最终定义

```text
evolution-proposal.json 是 advisory evolution context。
不是需求输入。
不是 implementation plan。
不是强制执行命令。
```

---

## 15.2 spec-plan 如何消费

`spec-plan` 消费它时，应该把它当成：

```text
advisory plan handoff input
```

`spec-plan` 可以：

```text
accept
revise
reject
defer
request more evidence
```

---

## 15.3 JSON 示例

```json
{
  "schema_version": "spec-evolve.proposal.v1",
  "input_role": "advisory_evolution_context",
  "authority": "non_binding",
  "plan_may": [
    "accept",
    "revise",
    "reject",
    "defer",
    "request_more_evidence"
  ],
  "proposal": {
    "id": "PROP-001",
    "title": "Clarify source/runtime boundary",
    "evidence": [
      "docs/02-架构设计/spec-evolve技术方案.md",
      ".gitignore"
    ],
    "recommended_handoff": "spec-plan"
  }
}
```

---

# 16. Plan Handoff 协议

`spec-evolve` 不输出 implementation plan，只输出 handoff brief。

## 16.1 Markdown 格式

```markdown
# Plan Handoff: PROP-001

## Proposal
Clarify source/runtime boundary for spec-evolve.

## Decision
Accepted

## Evidence
- Runtime generated copies were previously described as possible source.
- .spec-first/evolution/ boundary was unclear.

## Handoff Role
Advisory evolution context for spec-plan.

## What spec-plan should design
- Source/runtime boundary update.
- Minimal docs update.
- Optional .gitignore update.
- Verification commands.

## What spec-plan must not do
- Do not introduce heavy runtime.
- Do not add auto-sync.
- Do not hand-edit runtime copies.

## Verification Expectations
- Source paths are explicit.
- Runtime paths are ignored or clearly marked generated.
- CHANGELOG updated if source changes.
```

---

## 16.2 JSON 格式

```json
{
  "schema_version": "spec-evolve.plan-handoff.v1",
  "handoff_id": "PH-001",
  "proposal_id": "PROP-001",
  "decision_id": "ED-001",
  "handoff_role": "advisory_evolution_context",
  "target": "spec-plan",
  "proposal": "Clarify source/runtime boundary for spec-evolve.",
  "evidence": [
    "Runtime generated copies were previously ambiguous.",
    ".spec-first/evolution/ boundary was unclear."
  ],
  "spec_plan_should_design": [
    "Source/runtime boundary update",
    "Minimal docs update",
    "Optional .gitignore update",
    "Verification commands"
  ],
  "spec_plan_must_not_do": [
    "Do not introduce heavy runtime",
    "Do not add auto-sync",
    "Do not hand-edit runtime copies"
  ],
  "verification_expectations": [
    "Source paths are explicit",
    "Runtime paths are ignored or marked generated",
    "CHANGELOG updated if source changes"
  ]
}
```

---

# 17. Signals-only Script 设计

## 17.1 总原则

```text
Scripts collect signals.
LLM synthesizes decisions.
```

---

## 17.2 推荐脚本

### `collect-skill-contract-signals.js`

收集：

```text
SKILL.md 是否存在
Purpose 是否存在
When to use 是否存在
Non-goals 是否存在
Inputs / Outputs 是否存在
Verification 是否存在
是否出现可能越界关键词
```

输出：

```text
missing_section
weak_boundary
missing_output_contract
missing_verification
possible_overlap_signal
```

---

### `collect-workflow-surface-signals.js`

收集：

```text
skill 的 upstream / downstream
是否有孤立 skill
是否有产物没人消费
是否有多个 skill 声明同一职责
```

输出：

```text
orphan_skill_signal
missing_downstream_signal
possible_overlap_signal
missing_handoff_signal
```

---

### `collect-context-surface-signals.js`

收集：

```text
AGENTS.md / CLAUDE.md 长度
是否包含临时 branch 信息
是否包含过细实现细节
是否重复同一规则
repo-profile 是否出现 runtime state
```

输出：

```text
global_context_bloat_signal
temporary_detail_in_global_signal
duplicated_rule_signal
repo_profile_runtime_state_signal
```

---

### `collect-runtime-artifact-signals.js`

收集：

```text
.spec-first/evolution 是否被 ignore
runtime artifact 是否带 run_id
是否带 commit
是否带 dirty state
是否带 input hash
latest 是否可判断 freshness
```

输出：

```text
missing_gitignore_signal
missing_run_id_signal
missing_commit_signal
missing_input_hash_signal
stale_latest_risk_signal
```

---

### `collect-doc-code-surface-signals.js`

收集：

```text
README 中声明的命令是否存在
docs 中提到的 skill 是否存在
package.json scripts 是否和 docs 验证命令一致
官网文案是否引用旧能力
```

输出：

```text
missing_command_signal
stale_skill_reference_signal
invalid_verification_command_signal
docs_code_mismatch_signal
```

---

# 18. Verification 策略

## 18.1 不允许发明命令

所有验证命令必须来自：

```text
package.json scripts
README
existing docs
existing CI
```

不确定时，先检查 `package.json`。

---

## 18.2 当前建议验证命令

当前已知更稳的写法：

```bash
npm run lint:skill-entrypoints
npm test
spec-first doctor
```

但前提是这些命令在当前仓库真实存在。

文档中应写：

```text
Inspect package.json first.
Use only existing verification commands.
Do not invent npm scripts.
```

---

## 18.3 P0 验收标准

P0 完成条件：

```text
1. 已完成 composition baseline。
2. 已证明现有 skill 组合存在 named gaps，或明确决定不新增 spec-evolve。
3. 若新增，spec-evolve 是 source-only MVP。
4. 若新增，已写入 skills-governance.json 记录，entry_surface=standalone_skill，command_name=null。
5. 不承诺 Claude spec-evolve 或 Codex spec-evolve 可运行。
6. 不新增 scripts。
7. 不新增 agent profiles。
8. 不修改 runtime generated copies。
9. 已明确 source/runtime 边界。
10. 已明确 script/LLM 边界。
11. 已明确 plan handoff 是 advisory context。
12. 已明确 Evidence Intake 的 nil/empty/error/stale 处理。
13. MVP Markdown、ED 和 Plan Handoff 记录最小 freshness metadata。
14. 首次 dogfood 已产生至少一个 evidence-backed evolution decision。
15. 首个 ED 通过 effectiveness check，证明它改变、阻止、延后或澄清了真实演进动作。
16. 若修改 source/docs，已更新 CHANGELOG.md。
```

---

# 19. 风险与防护

| 风险                | 表现                           | 防护                                               |
| ----------------- | ---------------------------- | ------------------------------------------------ |
| 变成报告生成器           | 输出很多报告，但没有 decision          | 强制 ED-* evolution decision                       |
| 变成第二套专家体系         | 新增一堆 agent profiles          | reuse-first，inline lens first                    |
| 脚本语义越权            | 脚本判断 drift / priority        | scripts-only signals                             |
| P0 过重             | 一上来接命令、脚本、11 文件报告            | P0 source-only MVP                               |
| 和 skill-audit 重复  | 都在审 skill                    | Cycle 0 composition baseline 先证明 gap             |
| 和 spec-plan 冲突    | 输出 implementation plan       | 改成 plan handoff                                  |
| runtime/source 混淆 | 手改 `.claude` 或 `.spec-first` | 明确 source/runtime boundary                       |
| context 膨胀        | AGENTS.md 越写越长               | 只写短规则和触发规则                                       |
| latest 过期         | 下游消费旧 proposal               | freshness metadata + consumer rule               |
| 业界实践大杂烩           | 什么都想集成                       | Best Practice Watchlist + named gap / accepted ED gate |
| 小改流程过重            | 每个 bugfix 都跑 evolve          | 仅系统级变更默认触发                                       |

---

# 20. Roadmap

## P0：Composition Baseline + Source-only MVP + First Dogfood Gate

目标：

```text
证明是否需要 spec-evolve，并在 gap 成立时新增最小 source skill，同时完成首次 dogfood ED。
```

包含：

```text
composition baseline
named gaps
source-only SKILL.md
standalone governance record
3 个 MVP docs
first dogfood gate
first evidence-backed evolution decision
ED effectiveness check
```

不包含：

```text
runtime command
scripts
new agents
full macro report
plan/work 自动接线
```

---

## P1：Dogfood + Best Practice Intake

目标：

```text
证明 spec-evolve 能持续产生有价值的演进决策，并开始受控吸收 best-practice watchlist。
```

包含：

```text
continuous dogfood
best-practice-intake from watchlist
evolution decision log
plan-handoff brief
compound next-cycle input
```

---

## P2：Signals-only Scripts

目标：

```text
减少 LLM 猜测，但不让脚本越权。
```

包含：

```text
collect-skill-contract-signals.js
collect-workflow-surface-signals.js
collect-context-surface-signals.js
collect-runtime-artifact-signals.js
collect-doc-code-surface-signals.js
```

---

## P3：Command Wiring

目标：

```text
让 Claude spec-evolve 和 Codex spec-evolve 成为稳定入口。
```

包含：

```text
templates/claude/commands/spec/evolve.md
skills-governance.json
entrypoint lint
runtime sync validation
```

---

## P4：Skill Eval / Review Routing / CI

目标：

```text
让 skill 质量可评估，让 review 更精准。
```

包含：

```text
skill eval prompts
trigger / non-trigger eval
output contract eval
review routing
docs-sync report-first
release-readiness report-first
CI checks
```

---

## P5：Evolution Memory

目标：

```text
让每一轮演进都反哺下一轮。
```

包含：

```text
compound evolution memory
patterns
anti-patterns
decision log
next-cycle-input
best-practice watchlist
```

---

# 21. Goal 模式下执行 Prompt

## 21.1 Active Goal

```text
/goal Implement governed self-evolution for spec-first.

The goal is to make spec-first capable of continuously improving itself through:

Goal -> Evidence -> Diagnosis -> Best Practice Intake -> Evolution Decision -> Proposal -> Plan Handoff -> Plan -> Tasks -> Work -> Review -> Knowledge -> Next Evolution.

Do not build an uncontrolled auto-rewrite system.
Do not introduce heavy runtime.
Do not add new agents without named gaps.
Do not let scripts make semantic decisions.
Do not bypass spec-plan, review, or compound.
Do not hand-edit runtime generated copies.
Treat checked-in source assets as source of truth.
```

---

## 21.2 Cycle 0 Prompt

```text
Run a report-only composition baseline before implementing spec-evolve.

Use existing capabilities only:
- skill-audit
- doc-review
- spec-plan reasoning
- code-review findings if available
- compound lessons if available

Goal:
Determine whether existing skill composition can already support governed self-evolution.

Required output:
docs/YYYY-MM-DD-spec-evolve-baseline/
  00-summary.md
  01-composition-baseline.md
  02-named-gaps.md

Rules:
- Do not modify existing implementation files, existing source skills, templates, CLI code, runtime assets, or existing docs.
- Only write the required baseline report artifacts under docs/YYYY-MM-DD-spec-evolve-baseline/.
- Do not add spec-evolve yet.
- Do not create new agents.
- Do not create scripts.
- Every gap must cite evidence.
- If no named gaps are found, recommend not adding spec-evolve.
```

---

## 21.3 Cycle 1 Prompt

```text
Implement source-only MVP for spec-evolve only if the composition baseline found named gaps.

Scope:
- Add source skill definition.
- Add a skills-governance.json record with entry_surface=standalone_skill and command_name=null.
- Do not wire Claude spec-evolve or Codex spec-evolve command entry yet.
- Do not edit generated runtime copies.
- Do not add scripts.
- Do not add new agent profiles.
- Add only minimal docs.
- Update CHANGELOG.md if source assets are changed.

Required source skill behavior:
- Purpose
- When to use / when not to use
- Non-goals
- Operating model
- Inputs
- MVP outputs
- Evolution decision format
- Plan handoff boundary
- Source/runtime boundary
- Script/LLM boundary
- Best practice intake protocol
- Reuse-first lens mapping
```

---

## 21.4 Cycle 2 Prompt

```text
Dogfood the source-only spec-evolve MVP.

Do not implement new code.

Use the new spec-evolve skill to produce at least one evidence-backed evolution decision.

Required:
- Decision ID
- Accepted / Skipped / Deferred
- Source freshness
- Evidence
- Reason
- Consequence
- Plan handoff target
- Verification
- Effectiveness Check
- Residual risk
- Next-cycle input

Do not create runtime command yet.
Do not add scripts yet.
Do not add new agent profiles.
```

---

## 21.5 Cycle 3 Prompt

```text
Continue the active goal with signals-only evidence scripts.

Only implement scripts if dogfood showed named evidence collection gaps.

Rules:
- Scripts are read-only.
- Scripts output signals only.
- Scripts must include schema_version, generated_at, run_id, commit, branch, dirty state, and input hash where relevant.
- Scripts must not decide drift, priority, recommendation, or overdesign.
- LLM synthesis makes semantic decisions.
- Update CHANGELOG.md for source changes.
- Use only existing verification commands from package.json.
```

---

# 22. 最终落地建议

第一轮不要直接实现完整 `spec-evolve`。

最稳执行顺序：

```text
1. 先修改技术方案文档，收紧边界。
2. 执行 Cycle 0 composition baseline。
3. 如果存在 named gaps，再新增 source-only spec-evolve/SKILL.md。
4. 不接命令、不写脚本、不新增 agent。
5. dogfood 一次，产出至少一个 ED-* decision。
6. 证明有效后，再考虑 signals scripts。
7. 再考虑 command wiring。
8. 最后接入 plan/work/review/compound。
```

---

# 23. 最终判断

`spec-evolve` 的真正价值不是：

```text
又多一个 skill
```

而是让 spec-first 获得一种长期能力：

```text
持续发现自身问题
持续吸收业界最佳实践
持续做出有证据的演进决策
持续小步优化 workflow
持续通过 review 验证
持续把经验沉淀为下一轮输入
```

最终它让 spec-first 从：

```text
一组 AI coding workflow skills
```

进化为：

```text
一个能够持续自我优化的 AI 研发 workflow system
```

一句话收束：

```text
目标不变，系统持续变好。
```

这就是 `spec-evolve` 的最终技术方向。
