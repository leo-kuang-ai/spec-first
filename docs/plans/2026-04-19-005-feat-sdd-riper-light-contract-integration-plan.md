---
title: sdd-riper 轻量协作约束集成计划
type: feat
status: completed
date: 2026-04-19
deepened: 2026-04-19
origin: docs/ideation/2026-04-19-sdd-riper-flow-node-borrowing.md
completed_at: 2026-05-12
completion_evidence: tests/unit/spec-work-run-artifact-contract.test.js
---

# sdd-riper 轻量协作约束集成计划

## Overview

本计划不是把 `sdd-riper` 的完整 `RIPER` 状态机搬进 `spec-first`，而是将其中对协作质量有高杠杆作用的轻量约束，映射到 `spec-first` 现有主链：

```text
Ideate -> Brainstorm -> Plan -> Work -> Review -> Compound
```

目标是增强 workflow 的**决策输入质量**，而不是增加新的强编排层。

本计划**当前交付**只覆盖以下四类轻量增强：

1. workflow 锚点：`Restated Understanding / Core Goal / Verification-as-Done / Checkpoint`
2. freshness / partial context 降级时的补读行为
3. `spec-work` 执行闭环 artifact
4. `spec-code-review` 三轴 verdict

`spec-compound` 的双视角沉淀扩展只作为 follow-up 方向记录，不纳入本轮实施与验收。

## 收口记录

2026-05-12 lifecycle cleanup 复核后，本计划状态从 `backlog` 校准为 `completed`。本文档自身的 `Implementation Units` 与 `Final Review Checklist` 已记录 Unit 1-4 全部完成；现有 `spec-work` run artifact contract、workflow 锚点、freshness/partial 补读约束和 code-review 三轴 verdict 已由当前 source skill 与 contract tests 承接。`spec-compound` 双视角沉淀、数据库文档生成 contract 和进一步 runtime 持久化仍为后续独立方向，不属于本计划未完成范围。

## Expected Effects

如果按本计划集成完成，预期效果不是“多一个 workflow”，而是现有 workflow 的判断质量和恢复能力更稳定：

1. `spec-brainstorm`、`spec-plan`、`spec-work`、`spec-debug` 在关键节点会更稳定地复述理解与当前目标，长会话偏航更少。
2. `spec-plan` 的 `Verification` 会更接近可执行的完成定义，`spec-work` 执行时不需要再次发明“什么算 done”。
3. Stage-0 出现 stale / partial / fallback 时，workflow 会先补读事实再动作，减少把旧上下文当真相继续推演。
4. `spec-work` 结束后会留下可复用的 closure artifact，review、后续 compound 扩展和接手者能直接消费，而不是靠会话记忆回想。
5. `spec-code-review` 会在保留 findings 主结构的前提下，额外给出三轴聚合视图，让“是否完成需求、是否忠于计划、代码本身质量如何”更快可见。

## Problem Frame

`spec-first` 已经具备：

- Stage-0 决策输入
- `spec-plan` 的 requirements trace 和 implementation units
- `spec-work` 的执行边界与验证要求
- `spec-code-review` 的多 persona 审查与 requirements completeness
- `spec-compound` 的结构化知识沉淀

但从长链路协作体验看，仍然存在几个可提升点：

1. **模型在长会话中会偏离当前核心目标。**
   Stage-0 和 plan 提供了大量事实，但缺少一个稳定、轻量、关键节点才出现的“当前 loop 锚点”。

2. **执行结果回写不够结构化。**
   `spec-work` 会完成任务、跑验证、进入 shipping workflow，但执行偏差、剩余风险、恢复锚点缺少统一 closure artifact。

3. **review 的最终决策视图还可以更凝练。**
   当前 `spec-code-review` 已能输出 findings、requirements completeness、verdict，但缺少一个可快速判断“需求完成 / 计划忠实 / 代码质量”的三轴视角。

4. **compound 可进一步区分人类汇报视角与 LLM 复用视角。**
   当前 `docs/solutions/` 偏统一知识文档；对“汇报”与“后续 agent 检索”尚未显式分层。该方向本轮只保留为 follow-up，不纳入实施单元。

5. **freshness / partial context 的降级语义尚未完全传导到 workflow 行为。**
   Stage-0 会输出 `fallback_reason`、`level`、`data_quality`，但各 workflow 还可以更明确地把这些信号转化成“是否需要补读事实”的行为。

## Requirements Trace

- R1. 集成后的能力必须遵守 `轻 contract + 明确边界 + 让 LLM 决策`，不能引入新的强状态机。
- R2. 不新增与现有主链平行的 `RIPER` workflow。
- R3. 不新增第二套 workspace / multi-project registry 或 artifact 目录体系。
- R4. 必须与已批准的 Top 3 决策输入硬化计划兼容，尤其是 Stage-0 `L0/L1/L2/L3` 语义。
- R5. 增强项应优先落在 `skills/` contract 与相关 contract tests，减少 CLI 控制面改动。
- R6. `spec-work` 的执行闭环必须先定义 artifact contract，再新增持久化文件。
- R7. `spec-code-review` 的三轴 verdict 需要支持 `explicit plan / inferred plan / missing plan` 三种输入等级。
- R8. `spec-plan` 不能平行新增与 `Verification` 重复的字段体系；Done 语义应增强现有 `Verification`。
- R9. `spec-work` 的模式语义必须稳定收口为 `interactive / non-interactive`；`pipeline` / `headless` 只作为 `non-interactive` 示例，不单独形成 mode contract，且不得把交互式 checkpoint 误做成所有模式的硬阻塞。
- R10. `spec-compound` 的扩展不能破坏 `docs/solutions/` frontmatter、目录分类和 `learnings-researcher` 的检索假设。
- R11. 任何 skill contract 改动都必须同步更新 `docs/10-prompt/skills/` mirror 与对应 contract guards，避免 source / mirror 漂移误导运行时和文档读者。

## Scope Boundaries

- 不改 `src/cli/commands/doctor.js`
- 不改 `src/context-routing/evaluator.js` 的 Top 3 范围之外逻辑
- 不新增 `spec-riper` 或 `spec-riper` 入口
- 不复制 `archive_builder.py`
- 不新增 `mydocs/` 或其它并行 artifact 根目录
- 不引入精确短语 `Plan Approved` 作为全局硬规则
- 不把 `Review FAIL` 做成 CLI 强阻塞
- 当前计划不直接修改 `skills/spec-graph-bootstrap/`、`references/database-worker.md`、`skills/spec-graph-bootstrap/references/artifact-schemas.md`

### Deferred to Separate Tasks

- workspace / multi-project 边界增强的深层 contract 对齐：后续独立计划
- `spec-compound` 双视角持久化格式和检索优化：在前 3 个主题稳定后再做
- 数据库文档生成的 fallback / auto-discovery / 多连接分析 contract：后续独立计划；本计划只记录方向，不纳入当前交付验收

## Context & Research

### Relevant Code and Patterns

- `skills/spec-plan/SKILL.md`：已有 `Verification`、`Requirements Trace`、deepening、execution readiness 语义
- `skills/spec-work/SKILL.md`：已有 approval、allowed change surface、verification checklist、shipping workflow
- `skills/spec-code-review/SKILL.md`：已有 `plan:<path>`、requirements completeness、persona merge、run artifact
- `skills/spec-compound/SKILL.md`：已有 `docs/solutions/` 写入流程、track 分类、overlap/update 逻辑
- `skills/spec-debug/SKILL.md`：已有 investigate-first、root cause gate、structured summary
- `docs/plans/2026-04-19-003-top3-decision-input-hardening-plan.md`：已批准的 Stage-0 质量等级与 doctor contract 计划
- `tests/unit/spec-brainstorm-contracts.test.js`、`tests/unit/spec-plan-contracts.test.js`、`tests/unit/spec-work-contracts.test.js`、`tests/unit/spec-review-contracts.test.js`、`tests/unit/spec-debug-contracts.test.js`：skill contract 的主要回归入口
- `tests/unit/workflow-stage0-consumption.test.js`、`tests/unit/stage0-freshness.test.js`：Stage-0 语义传导与 freshness 回归入口
- `tests/unit/asset-consistency.test.js`：source / prompt mirror 的 repo 级 contract guard

### Institutional Learnings

- [modify-source-not-artifacts-2026-04-13.md](../solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md)
  说明 source-of-truth 与 runtime artifact 的边界，不应新增并行目录和副本体系。

### External References

- `docs/ideation/2026-04-19-sdd-riper-integration-ideation.md`
- `docs/ideation/2026-04-19-sdd-riper-flow-node-borrowing.md`

## Key Technical Decisions

- 决策 1：**只吸收 sdd-riper 的轻量协作约束，不复制 RIPER 状态机。**  
  理由：当前主链完整，新增状态机会和 repo 原则冲突。

- 决策 2：**workflow 锚点以 skill contract 方式表达，不先落到 CLI 控制面。**  
  理由：这是高收益、低耦合的第一阶段，且与 “让 LLM 决策” 一致。

- 决策 3：**`Done Contract` 不作为 `spec-plan` 的新独立字段，而是增强 `Verification` 的 done/not-done 语义。**  
  理由：避免字段平行和重复维护。

- 决策 4：**`spec-work` 的 closure summary 必须建立在新的 run artifact contract 之上。**  
  理由：当前 `spec-work` 没有像 `spec-code-review` 那样稳定的 per-run artifact 约束，不能先写文件后补 contract。

- 决策 5：**`spec-code-review` 的三轴 verdict 是聚合视图，不是新的 gating engine。**  
  理由：维持 findings/severity/routing 的现有主导地位。

- 决策 6：**Stage-0 `freshness_stale` 绝不与 `L0` 并存。**  
  理由：必须遵守 Top 3 已批准计划中的质量等级语义。

- 决策 7：**interactive checkpoint 与 non-interactive 模式分离。**  
  理由：避免把交互式 pause 点误植为自动化硬阻塞，同时避免为 `spec-work` 额外发明 `pipeline` / `headless` 两套并列 mode 语义。

- 决策 8：**`spec-work` 的 run artifact 采用“机器真源优先、人类摘要投影”的方向收口。**  
  理由：`spec-code-review`、`spec-compound`、后续自动化消费更适合稳定 machine contract；人类可读 summary 应由同一份结构化事实投影出来，而不是反过来。

- 决策 9：**凡是本轮触达的 workflow skill，都按 source + docs mirror + contract test 三件套一起规划。**  
  理由：这个仓库的真实维护边界不是只改 `skills/`，而是同时守住 runtime/source prompt、docs mirror 与测试锚点的一致性。

- 决策 10：**`spec-work` run artifact 的发现机制采用“显式 handoff 为主，推断发现为辅，不新增全局索引”的收口方式。**  
  理由：这与 `spec-code-review` 现有 `explicit / inferred / missing` 语义一致，且避免为了解决 artifact 发现问题而引入新的控制面 registry。

- 决策 11：**`spec-code-review` 的三轴 verdict 是条件式输出，不要求在 `missing plan` 时也强行凑满三轴。**  
  理由：当前 `spec-code-review` 已明确规定无 plan 时省略 `Requirements Completeness`；继续沿用条件式输出，比额外引入 `N/A` 状态更轻、更一致。

- 决策 12：**interactive 模式下，`spec-work` 的 checkpoint 与 approval 合并成一个 pre-execution block。**  
  理由：这样既保留执行前自校准价值，又避免出现两个连续停顿点，把轻量约束做成交互噪音。

- 决策 13：**`spec-work` 的 mode 真源采用 caller posture：未显式声明 `non-interactive` 时，一律按 `interactive` 处理。**  
  理由：当前 `spec-work` 现有 contract 仍以用户澄清与 approval 为主路径；若不先固定 mode 真源，后续实现会在 `pipeline`、`headless`、CI 环境、调用方猜测之间分叉。

以下方向只用于约束后续独立的数据库文档计划，不属于本计划当前交付项：

- 记录方向 A：**数据库文档生成的可靠性优化优先做“前置路由更准”或“显式 fallback contract”，不采用 MCP 失败后的静默 CLI 自动降级。**  
  理由：静默切换虽然可能提高局部完成率，但会混合 `Level1/Level2` 语义，削弱边界清晰性、来源可解释性和故障定位能力；这与仓库的“轻 contract + 明确边界 + 让 LLM 决策”原则不一致。

- 记录方向 B：**数据库连接识别采用“候选连接自动发现 → 运行时 secret 解析 → LLM 基于事实选路”的三层收口，不维护写死配置矩阵。**  
  理由：不同项目的配置表达差异很大，真正稳定的边界不是“固定支持哪些配置文件”，而是把候选连接事实、secret 解析状态、最终访问路径和 provenance 暴露给模型，让模型在明确边界内自主决策。

## Why This Is The Best Current Plan

在当前 repo 原则和现有资产下，这是**当前最优方案**，不是绝对最终形态。

原因有三点：

1. **它解决的是高频决策失真，而不是发明新流程。**  
   当前最痛的不是“没有流程”，而是长会话偏航、stale context 被误信、执行闭环回写不足。轻量 contract 正好打在这些问题上。

2. **它保持了 repo 的主哲学。**  
   `spec-first` 的核心原则是 `轻 contract + 明确边界 + 让 LLM 决策`。完整迁入 RIPER 或先上重 control-plane 都会把 repo 往更强编排的方向推。

3. **它的验证成本最低、信号最清楚。**  
   先落 skill contract、mirror、现有 unit/integration guards，可以快速证明价值；如果一开始就做新 workflow 或大规模 runtime contract，很难把收益和副作用拆开看。

## Prompt Contract Intake

本计划不是泛泛地“借鉴 sdd-riper 思想”，而是明确指定从 `sdd-riper` 的 skill prompt 中吸收哪些约束、哪些需要改写后再进入、哪些明确不进入。

主要参考：

- 外部参考：`sdd-riper` 仓库中的 `skills/sdd-riper-one-light/SKILL.md`
- 外部参考：`sdd-riper` 仓库中的 `skills/sdd-riper-one/SKILL.md`

### 直接进入当前计划范围的 prompt 约束

以下约束进入本计划的 Unit 1 / Unit 2 / Unit 3 / Unit 4 范围：

1. **`Restate First`**
   - 映射到 `spec-brainstorm`、`spec-plan`、`spec-work`、`spec-debug`
   - 目标：任务进入关键节点时先复述理解，降低误读

2. **`Core Goal as Loop Anchor`**
   - 映射到 `spec-brainstorm`、`spec-plan`、`spec-work`、`spec-debug`
   - 目标：在长会话中持续对齐当前核心目标，防止 scope drift

3. **`Checkpoint Before Execute`**
   - 映射到 `spec-work`
   - 目标：执行前输出短 checkpoint，说明当前理解、边界、风险和验证方式
   - 约束：只在 interactive 模式强要求；non-interactive 不阻塞执行

4. **`Done by Evidence`**
   - 映射到 `spec-plan`
   - 目标：完成由测试、日志、review 或人工确认等证据证明
   - 约束：不新增独立 `Done Contract` 字段，而是增强现有 `Verification`

5. **`Reverse Sync`**
   - 映射到 `spec-work`
   - 目标：执行后把结果、偏差、验证与剩余风险回写到持久 artifact
   - 约束：先定义 `spec-work` run artifact contract，再引入 closure summary

6. **`Resume Ready`**
   - 映射到 `spec-work`
   - 目标：暂停或交接时保留最小恢复锚点
   - 约束：作为 closure summary 的一部分，而不是新增独立工作流

7. **`Reload Before Act`**
   - 映射到 `spec-plan`、`spec-work`、`spec-code-review`
   - 目标：当 `fallback_reason`、`level`、`data_quality` 表明 context stale / partial 时，关键动作前补读事实
   - 约束：不改变 evaluator 语义，不把 stale 当成硬阻塞

### 后续可能吸收，但需改写后再进入的 prompt 约束

以下约束有价值，但不在本计划的最小实施范围内；若后续进入，应在现有 `spec-first` contract 上改写，而不是原样搬运：

1. **`review_execute` 三轴评审**
   - 将来可转译为 `spec-code-review` 的三轴 verdict
   - 约束：保持 findings / severity / route / overall verdict 的现有主结构

2. **`archive` 的 human / llm 双视角输出**
   - 将来可转译为 `spec-compound` 的双视角沉淀
   - 约束：不得破坏 `docs/solutions/` frontmatter 和 learnings researcher 检索假设

3. **Debug 三角定位**
   - 将来可进一步强化 `spec-debug` 的“日志 + spec + 代码”表达
   - 约束：仍保持 investigate-first / root-cause-first 的当前主 contract

4. **多项目边界语言**
   - 如 `active_project`、`change_scope=local/cross`、`Contract Interfaces`
   - 约束：必须映射到现有 workspace / cross-repo contract，不新增第二套 registry

### 明确不纳入的 prompt 约束

以下内容明确不进入本计划，也不作为后续实现默认方向：

1. 完整 `RIPER` 状态机
2. 精确短语门禁 `Plan Approved`
3. `create_codemap` / `build_context_bundle` / `sdd_bootstrap` 作为新 workflow 入口
4. `mydocs/specs`、`mydocs/codemap`、`mydocs/archive` 目录体系
5. `zero spec` 通道
6. 直接复制 `archive_builder.py`
7. 原文照抄式 prompt 迁移

### Intake Guardrails

对上述 prompt 约束的统一收口规则：

- 只能增强 `spec-first` 已有 workflow，不新增并行 workflow
- 只能增强已有 contract 字段，不轻易新增平行字段体系
- interactive 与 non-interactive 约束必须分离；`pipeline` / `headless` 不单列为新的 `spec-work` mode
- prompt 约束必须有对应 contract tests，不能只停留在文案层
- 任何涉及 `L0/L1/L2/L3` 的叙述必须服从 Top 3 决策输入硬化计划
- prompt 约束服务于更好的决策输入，不得演变为新的强编排逻辑

## Open Questions

### Resolved During Planning

- 是否新增独立 RIPER workflow：否。
- 是否复制 `archive_builder.py`：否。
- 是否新增 `Plan Approved` 硬短语：否。
- 是否新增平行 `Done Contract` 字段：否，增强 `Verification`。
- `freshness_stale` 是否允许 L0：否，必须按 Top 3 计划进入 L1。
- `spec-work` artifact 是否新增全局索引 / registry：否，采用显式 handoff 为主、推断发现为辅。
- `spec-code-review` 三轴 verdict 在 `missing plan` 下是否仍强制输出三轴：否，仅输出可成立的轴。
- `spec-work` interactive 模式是否分成 checkpoint 与 approval 两次停顿：否，合并为一个 pre-execution block。
- `spec-compound` 双视角是否纳入本轮实施：否，保留为 follow-up。
- 数据库文档生成 fallback / connection discovery 是否纳入本轮实施：否，保留为 follow-up，并记录方向约束。

### Deferred to Implementation

- `spec-work` run artifact 的 v1 字段命名是 `changes_made / deviations / verification / residual_risks / resume_anchor` 还是等价更短命名；但 contract 方向已收口为 **JSON 真源 + 可选 Markdown closure summary 投影**。
- `spec-code-review` 三轴 verdict 在输出模板中的精确位置，是紧跟 `Requirements Completeness` 还是置于 `Verdict` 前；但不应抢占 findings 区，也不应独立成第二个总 verdict。
- `spec-compound` 双视角最终是单文件双 section 还是同一 workflow 产出两份不同文档。

## Implementation Strategy

本计划分 4 个 implementation units。前三个 unit 构成最小可交付闭环，第 4 个作为延后增强。

### Dependency and Merge Order

推荐按以下顺序收敛，而不是并行散改：

1. **Unit 1: Lightweight Workflow Anchors**  
   先统一关键 workflow 的轻量锚点语言，避免后续 Unit 2-4 再各自发明术语。

2. **Unit 2: Freshness-Driven Reload Behavior**  
   在锚点语言明确后，再把 stale / partial / fallback 的补读规则挂进去，避免 reload 行为和当前目标表达脱节。

3. **Unit 3: `spec-work` Run Artifact Contract + Closure Summary**  
   等前两项稳定后，再做执行闭环持久化；这样 closure artifact 才能直接复用前面已经确定的 goal / done / reload 语义。

4. **Unit 4: `spec-code-review` Three-Axis Verdict**  
   最后再做 review 聚合视图，避免 review 先定义了一套未来又会被 work closure artifact 改写的字段。

每个 unit 都按同一交付边界收口：

- source skill / reference
- `docs/10-prompt/skills/` 对应 mirror
- 现有 unit / integration / asset consistency guards
- 不新增并行 workflow，不新增第二套 artifact 根目录

### Cross-Cutting Verification Rule

凡是改变**用户可见 workflow 行为**的 unit，除了 unit-level contract tests 之外，还必须补至少 1 条行为级回归，防止“文案对了、实际交互漂了”：

- 适用场景：checkpoint/approval 停顿行为、Stage-0 stale reload 提示与补读行为、`spec-code-review` 输出结构变化
- 优先选择现有 harness：
  - 能用 shell / integration flow 覆盖的，优先放 `tests/integration/`
  - 更适合结构断言的，补 template / output snapshot 类测试
- 如果没有合适的现成 harness，当前 unit 需要同时补最小可用的行为级测试锚点，而不是只停留在 contract prose

### spec-work Mode Source

本计划对 `spec-work` 的模式语义只保留一层稳定 contract：

- `interactive`
- `non-interactive`

收口规则如下：

- **默认 interactive**：用户在当前会话中直接调用 `spec-work`，且允许澄清 / approval / 状态回复时，按 `interactive` 处理
- **只有显式 no-user-interaction caller contract 才能进入 non-interactive**：例如后续如果有调用方明确声明“本次执行不可等待用户输入”，才可按 `non-interactive` 处理
- `pipeline` / `headless` 只是 `non-interactive` 的调用场景示例，不是 `spec-work` 需要单独维护的 mode enum
- 不得根据 CI 环境变量、分支名、无响应假设等启发式**猜测**进入 `non-interactive`
- 其它 workflow 自有的 `mode:headless` 语义不自动传导为 `spec-work` mode；若未来需要传导，必须显式写入调用 contract

### Unit 1: Lightweight Workflow Anchors

**Goal**  
为 `spec-brainstorm`、`spec-plan`、`spec-work`、`spec-debug` 引入统一但轻量的 loop 锚点，减少长会话漂移，同时不引入新的强状态门禁。

**Files**

- `skills/spec-brainstorm/SKILL.md`
- `skills/spec-plan/SKILL.md`
- `skills/spec-work/SKILL.md`
- `skills/spec-work-beta/SKILL.md`
- `skills/spec-debug/SKILL.md`
- `docs/10-prompt/skills/spec-brainstorm/SKILL.md`
- `docs/10-prompt/skills/spec-plan/SKILL.md`
- `docs/10-prompt/skills/spec-work/SKILL.md`
- `docs/10-prompt/skills/spec-work-beta/SKILL.md`
- `docs/10-prompt/skills/spec-debug/SKILL.md`
- `tests/unit/spec-brainstorm-contracts.test.js`
- `tests/unit/spec-plan-contracts.test.js`
- `tests/unit/spec-work-contracts.test.js`
- `tests/unit/spec-work-beta-contracts.test.js`
- `tests/unit/spec-debug-contracts.test.js`
- `tests/unit/asset-consistency.test.js`
- `tests/integration/spec-brainstorm-flow.sh`（仅当 `spec-brainstorm` 章节锚点变化时）
- `tests/integration/` 下对应 workflow 的行为级回归（若当前改动改变用户可见交互）

**Starting point**

- `spec-brainstorm`：优先挂在现有 `Current Work Pulse`、preflight、自检收口处，而不是新增一个平行阶段
- `spec-plan`：优先挂在 problem frame / requirements trace / verification 收口附近
- `spec-work`：优先挂在 `Read Plan and Clarify` 与执行前 approval/checkpoint 附近
- `spec-debug`：优先挂在 investigate-before-fix 与 final debug summary 附近

**Approach**

- 在 skill contract 中只在关键节点要求输出一个**短锚点块**，不要求每轮都重复：
  - `Restated Understanding`
  - `Current Core Goal`
  - `Scope / Non-goals`
  - `Verification-as-Done`
- 锚点块的触发时机只限于：
  - workflow 进入时
  - 任务明显转向或中途恢复时
  - 执行前的关键 checkpoint
  - 收口总结前
- 对明显小任务允许合并成 1-2 句，不强制生成模板化小节。
- `spec-plan` 中不新增独立 `Done Contract` 区块；而是在 `Verification` 与 final review 要求中强化：
  - 什么算 done
  - 什么证据算完成
  - 哪些情况仍算 not done
- `spec-work` 中 checkpoint 只作为 interactive 模式强要求；non-interactive 把同等信息收敛进 run artifact，不阻塞执行。
- `spec-work` interactive 模式下，checkpoint 不另起独立 pause 点，而是与现有 approval 合并成一个 pre-execution block：
  - 先给出短 checkpoint
  - 在同一块里请求 approval
  - 避免连续两次停顿
- `spec-debug` 延续 investigate-first，不把“复述理解”误写成未调查先下结论。

**Patterns to follow**

- `skills/spec-plan/SKILL.md` 现有 `Verification`、`Requirements Trace`、`Execution Readiness`
- `skills/spec-work/SKILL.md` 现有 `Get user approval to proceed`
- `skills/spec-debug/SKILL.md` 现有 `Debug Summary`

**Execution note**

- contract-first

**Test scenarios**

- Happy path：`spec-work` interactive 模式下，执行前要求输出简短 checkpoint，且 checkpoint 包含当前目标与 done evidence
- Happy path：`spec-work` interactive 模式下，checkpoint 与 approval 合并在同一个 pre-execution block 中完成
- Happy path：`spec-plan` 明确要求用 `Verification` 表达 done/not-done，而不是新增平行字段
- Edge case：小任务或低复杂度任务允许短句式锚点，不被强制扩写成长模板
- Error path：当 plan、requirements 或当前理解不清晰时，skill 要求先澄清而非直接执行
- Integration：`spec-plan` 的 done 语义可被 `spec-work` / `spec-code-review` 消费，不形成第二套字段名
- Mirror：source 与 `docs/10-prompt/skills/` 中的关键 contract anchor 同步存在

**Verification**

- Done：相关 skill contract tests 覆盖锚点要求，且文案没有引入新的强状态机或与现有 approval 逻辑冲突；`spec-work` 未出现“checkpoint 一次 + approval 再一次”的双停顿设计；若改动影响用户可见交互，还需至少 1 条行为级回归覆盖 checkpoint / approval 的最终表现
- Evidence：`tests/unit/spec-brainstorm-contracts.test.js`、`tests/unit/spec-plan-contracts.test.js`、`tests/unit/spec-work-contracts.test.js`、`tests/unit/spec-debug-contracts.test.js`、`tests/unit/asset-consistency.test.js`，以及 `tests/integration/` 下对应 workflow 的行为级回归或等价输出断言
- Not done：只是新增了概念描述，但没有在 contract tests 中固定下来；或新增了与 `Verification` 平行的新字段体系

### Unit 2: Freshness-Driven Reload Behavior

**Goal**  
让 `spec-plan`、`spec-work`、`spec-code-review` 在 Stage-0 降级时明确降低对旧 context 的信任，并补读事实，而不是继续把 stale/partial context 当高可信输入。

**Files**

- `skills/spec-plan/SKILL.md`
- `skills/spec-work/SKILL.md`
- `skills/spec-work-beta/SKILL.md`
- `skills/spec-code-review/SKILL.md`
- `docs/10-prompt/skills/spec-plan/SKILL.md`
- `docs/10-prompt/skills/spec-work/SKILL.md`
- `docs/10-prompt/skills/spec-work-beta/SKILL.md`
- `docs/10-prompt/skills/spec-code-review/SKILL.md`
- `tests/unit/spec-plan-contracts.test.js`
- `tests/unit/spec-work-contracts.test.js`
- `tests/unit/spec-work-beta-contracts.test.js`
- `tests/unit/spec-review-contracts.test.js`
- `tests/unit/workflow-stage0-consumption.test.js`
- `tests/unit/stage0-freshness.test.js`
- `tests/unit/asset-consistency.test.js`
- `tests/integration/` 下针对 stale / partial / fallback 行为的最小回归（若当前改动改变用户可见补读/提示路径）

**Starting point**

- 直接复用三个 workflow 已有的 Stage-0 preload / consumption 段落
- 直接复用 Top 3 对 `L0/L1/L2/L3` 与 `freshness` 的既有定义，不在 workflow 文案重发明等级解释

**Approach**

- 基于已有 `fallback_reason / level / selected_assets` contract 补一层消费规则：
  - `L0` 且非 stale：允许直接消费 Stage-0，不强制补读
  - `L1` 且 `freshness_stale`：关键动作前回读相关 plan / origin / `selected_assets`
  - `L2`：明确是降级上下文，至少回读本地 plan/source/关键代码事实，再继续动作
  - `L3` 或 runtime helper 不可用：允许继续，但要明确“缺 bootstrap context，只能以 repo 直读为准”
  - 不把降级视为硬阻塞
  - 不重定义 evaluator 语义
- 文档和 tests 中明确：`freshness_stale` 不代表 L0。
- reload 的优先读取顺序应是：
  - 当前用户提供/引用的 plan 或 requirements
  - Stage-0 `selected_assets`
  - 当前 diff / 相关实现文件
  - 必要时再回读更广上下文
- 不要求用户先重跑 bootstrap 才能继续 workflow。

**Patterns to follow**

- `skills/spec-plan/SKILL.md` 和 `skills/spec-work/SKILL.md` 现有 Stage-0 preloading contract
- Top 3 计划中的 `L0/L1/L2/L3` 语义

**Execution note**

- contract-first

**Test scenarios**

- Happy path：Stage-0 输出为 `L0 + fact-backed + non-stale` 时，workflow 正常消费且不额外补读
- Edge case：`freshness_stale` 触发补读提示，但不阻塞 planning/workflow/review
- Edge case：`selected_assets` 部分缺失时，workflow 仍能按已有 fallback 继续，而不是要求完整重建上下文
- Error path：runtime helper 不可用时，继续走 Level 2/3 fallback，不引入额外失败
- Integration：Top 3 evaluator 语义与 workflow 文案不矛盾，且不存在 `freshness_stale + L0` 示例
- Mirror：source 与 docs mirror 对 `Reload Before Act` 的语义保持一致

**Verification**

- Done：skill contract 与 tests 都明确表达 stale/partial 触发“补读事实”而非“停止执行”；若改动影响用户可见补读/提示路径，还需至少 1 条行为级回归覆盖最终提示与补读行为
- Evidence：`tests/unit/spec-plan-contracts.test.js`、`tests/unit/spec-work-contracts.test.js`、`tests/unit/spec-review-contracts.test.js`、`tests/unit/workflow-stage0-consumption.test.js`、`tests/unit/stage0-freshness.test.js`，以及 `tests/integration/` 下对应 stale / partial / fallback 行为回归或等价输出断言
- Not done：文案仍然示例 `freshness_stale + L0` 或把 stale 解释成高可信

### Unit 3: `spec-work` Run Artifact Contract + Closure Summary

**Goal**  
为 `spec-work` 增加稳定的 per-run artifact contract，在此基础上产出 closure summary，记录执行偏差、验证、风险与恢复锚点。

**Files**

- `skills/spec-work/SKILL.md`
- `docs/10-prompt/skills/spec-work/SKILL.md`
- 新增 `docs/contracts/workflows/spec-work-run-artifact.schema.json`
- `.spec-first/workflows/spec-work/<slug>/<run-id>/run.json`（新 machine artifact）
- `.spec-first/workflows/spec-work/<slug>/<run-id>/closure-summary.md`（若保留人类投影）
- `tests/unit/spec-work-contracts.test.js`
- `tests/unit/runtime-contract-boundary.test.js`
- `tests/unit/asset-consistency.test.js`

**Starting point**

- 先对齐 `spec-code-review` 现有 `.spec-first/workflows/spec-code-review/<run-id>/` artifact 思路
- 复用仓库中现有 JSON schema contract 的命名方式，挂到 `docs/contracts/`，而不是把 contract 藏在 prose 里
- 延续 `.spec-first/workflows/` 作为 runtime artifact 根目录，不另起平行目录

**Approach**

- 先定义 **machine-truth contract**：
  - `schema_version`
  - `generated_at`
  - `workflow`
  - `run_id`
  - `mode`
  - `plan_path` / `plan_source`
  - `workspace_slug` / `slug`
  - 可选 `git_branch` / `head_sha`
  - `current_core_goal`
  - `changes_made`
  - `plan_deviations`
  - `verification`
  - `residual_risks`
  - `resume_anchor`
  - `next_recommended_action`
- 每次 run 先固定 `artifact_dir = .spec-first/workflows/spec-work/<slug>/<run-id>/`，所有该 run 产物都收口到这个目录下。
- machine artifact 固定为 `artifact_dir/run.json`，作为唯一 machine truth。
- 若保留 `closure-summary.md`，它固定落在 `artifact_dir/closure-summary.md`，且只是同一份结构化事实的可读投影，而不是第二份手写真源。
- interactive / non-interactive 行为分支要固定：
  - interactive：完成后写 `run.json`，必要时额外输出 `closure-summary.md`
  - non-interactive：至少写 `run.json`，不等待额外交互
- artifact 写入失败必须显式暴露，不能让 workflow 冒充“已完成闭环”。
- artifact 发现机制按以下优先级收口：
  - **显式 handoff**：`spec-work` 调 `spec-code-review` / `spec-compound` 时直接传 `run_id` 或 `artifact_dir`；不把叶子文件路径当作跨 workflow 的稳定标识
  - **推断发现**：没有显式 handoff 时，可按 `plan_path + slug`，必要时再加 `git_branch/head_sha`，寻找最近一次匹配的 run 目录
  - **missing artifact**：找不到就按“无 artifact 输入”继续，不阻塞 workflow
- 推断发现只作为 advisory fallback，不新增全局 `latest` 索引、registry 或第二套 artifact 发现控制面。
- consumer 明确限定为：
  - `spec-code-review`：读取执行偏差、验证证据、剩余风险
  - `spec-compound`：读取解决过程与恢复锚点
  - human：读取 `closure-summary.md` / `run.json`

**Patterns to follow**

- `skills/spec-code-review/SKILL.md` 的 run artifact 体系
- `.spec-first/workflows/spec-code-review/<run-id>/` 输出模式

**Execution note**

- contract-first

**Test scenarios**

- Happy path：interactive 正常执行后生成 machine artifact，且字段包含 goal / deviations / verification / residual_risks / resume_anchor
- Happy path：若启用人类投影，`closure-summary.md` 与 machine artifact 语义一致，不出现双真源
- Happy path：有显式 handoff 时，`spec-code-review` / `spec-compound` 可直接消费对应 `run_id` / `artifact_dir`，而不需要二次扫描目录
- Edge case：没有显式 handoff 时，系统可按 `plan_path + slug (+ branch/head)` 推断最近匹配的 run 目录
- Edge case：non-interactive 模式不要求用户再次确认，但仍能保留 run artifact
- Edge case：找不到匹配 artifact 时，workflow 明确降级继续，而不是报错或伪造关联成功
- Error path：artifact 写入失败时，主 workflow 不应 silently pretend success
- Integration：review / compound 可读取 closure artifact，而不会要求用户手工回填 plan
- Boundary：artifact 仅落在 `.spec-first/workflows/spec-work/`，不扩散到新的根目录

**Verification**

- Done：存在明确 run artifact contract，`spec-work` 结束后能稳定写出 `artifact_dir/run.json`，并在需要时投影 `closure-summary.md`；artifact 发现机制已明确为“显式 handoff 为主、推断发现为辅、missing 时降级继续”，且显式 handoff 的稳定标识已收口为 `run_id` / `artifact_dir`
- Evidence：`tests/unit/spec-work-contracts.test.js`、`tests/unit/runtime-contract-boundary.test.js` 及新增 schema contract coverage
- Not done：只在 skill 文案里提到 closure summary，但没有 artifact contract 或测试保护

### Unit 4: `spec-code-review` Three-Axis Verdict

**Goal**  
在现有 persona findings、requirements completeness 和 verdict 之上，增加一个更便于决策的三轴聚合视图。

**Files**

- `skills/spec-code-review/SKILL.md`
- `skills/spec-code-review/references/review-output-template.md`
- `skills/spec-code-review/references/subagent-template.md`（仅在需要时）
- `docs/10-prompt/skills/spec-code-review/SKILL.md`
- `docs/10-prompt/skills/spec-code-review/references/review-output-template.md`
- `docs/10-prompt/skills/spec-code-review/references/subagent-template.md`（仅在需要时）
- `tests/unit/spec-review-contracts.test.js`
- `tests/unit/asset-consistency.test.js`
- `tests/integration/` 或模板级结构断言，用于覆盖三轴 verdict 的最终输出形态

**Starting point**

- 以 `spec-code-review` 已有 `Requirements Completeness` 与 `Verdict` 区域为锚点扩展
- 不改 findings schema 的主轴，不让三轴 verdict 侵入 persona finding 合并逻辑

**Approach**

- 顶层增加三个 axis：
  - `Requirement Completion`
  - `Plan-Diff Fidelity`
  - `Code Intrinsic Quality`
- 明确 3 种 plan source 行为：
  - `explicit`：可参与阻断级判断
  - `inferred`：只做 advisory
  - `missing`：不强制保留 plan 相关 axis
- 三轴 verdict 推荐放在 `Requirements Completeness` 之后、`Verdict` 之前，这样既不抢 findings 的主位，也能直接服务最终结论。
- `Plan-Diff Fidelity` 的判断输入只来自：
  - caller 明确提供的 `plan:<path>`
  - 已解析出的 explicit / inferred plan source
  - 当前 diff / review scope
- `missing plan` 时的条件式输出规则：
  - 输出 `Code Intrinsic Quality`
  - 省略 `Requirement Completion`
  - 省略 `Plan-Diff Fidelity`
  - 不输出为了凑结构而添加的 `N/A` 占位块
- 不允许在 `missing plan` 情况下伪造 fidelity 结论。
- 保持 findings、severity、route、overall verdict 的现有主导结构不变。

**Patterns to follow**

- `skills/spec-code-review/SKILL.md` 现有 `Requirements Completeness`
- `skills/spec-code-review/references/review-output-template.md` 的 verdict 区域

**Execution note**

- synthesis-first

**Test scenarios**

- Happy path：有 explicit plan 时，三轴 verdict 与 requirements completeness 一致
- Edge case：只有 inferred plan 时，不因为未覆盖 requirements 而单独阻断
- Error path：没有 plan 时，只输出 `Code Intrinsic Quality`，不伪造 fidelity / requirement 结论
- Integration：findings、residual work、overall verdict 和三轴 verdict 不互相打架
- Mirror：review output template 与 docs mirror 在三轴 block 的关键 anchor 一致

**Verification**

- Done：输出模板、skill contract、tests 都覆盖 3 种 plan source 情况，且 `missing plan` 明确采用条件式输出而不是 `N/A` 充数；若改动影响最终 review 输出结构，还需至少 1 条行为级回归覆盖三轴 verdict 的最终呈现
- Evidence：`tests/unit/spec-review-contracts.test.js`、`tests/unit/asset-consistency.test.js`，以及 `tests/integration/` 下对应回归或模板级结构断言
- Not done：三轴结论只能在 explicit plan 下工作，或与现有 verdict/review route 产生矛盾

## Alternative Approaches

### 方案 A：直接把 sdd-riper 的 Review / Archive 结构迁入 spec-first

优点：

- 概念直接，对照清晰

缺点：

- 容易复制新的平行结构
- 与现有 `spec-code-review` / `spec-compound` contract 冲突
- 风险是看起来完整，实际破坏边界

### 方案 B：只做 skill contract 轻量增强，再逐步补 artifact 和 review 聚合

优点：

- 最符合当前 repo 原则
- 改动边界清晰
- 可以逐步验证价值

缺点：

- 需要接受第一阶段效果偏“软”

**选择：方案 B。**

### 方案 C：先做新的 runtime / control-plane contract，再回填 workflow prompt

优点：

- 结构更硬，机器消费更直接

缺点：

- 在价值尚未被证明前就扩大改动边界
- 容易把当前问题错误地抽象成“缺少统一执行器”
- 会比 Unit 1 / Unit 2 更早触碰 CLI / runtime 主链，风险高于收益

## Risks & Mitigations

### 风险 1：把 interactive checkpoint 误做成所有模式的硬门禁

**影响**  
会破坏 non-interactive 场景与自动化执行，或导致 `spec-work` 在没有稳定 mode 真源时到处猜模式。

**缓解**

- 所有 checkpoint 规则都明确标注 interactive / non-interactive 分支
- mode 真源固定为 caller posture，未显式声明 non-interactive 时默认 interactive
- contract tests 覆盖这两种模式

### 风险 2：与 Top 3 Stage-0 语义冲突

**影响**  
会造成 `level`、`freshness`、`fallback_reason` 文案和 evaluator 实现脱节。

**缓解**

- 任何涉及 `L0/L1/L2/L3` 的文案都引用 Top 3 计划语义
- 不在此计划中改 evaluator 逻辑

### 风险 3：`spec-plan` 出现重复字段体系

**影响**  
会让 implementer 不知道看 `Verification` 还是 `Done Contract`。

**缓解**

- 明确禁止新增平行字段
- 只增强现有 `Verification`

### 风险 4：`spec-work` artifact 写入无 contract

**影响**  
后续 `spec-code-review`、`spec-compound` 无法稳定消费，run path 容易漂移。

**缓解**

- Unit 3 必须先定义 contract 再实现输出

### 风险 5：`spec-code-review` 三轴 verdict 与 findings 重复或冲突

**影响**  
用户会看到两个不同的“结论中心”。

**缓解**

- 三轴 verdict 只做聚合视图
- findings / severity / route / overall verdict 继续是主判定结构

### 风险 6：source / mirror / tests 三方漂移

**影响**  
实现落地后，`skills/`、`docs/10-prompt/skills/` 与 unit guards 其中任一方遗漏，都会让 repo 对外 contract 读起来不一致。

**缓解**

- 每个 unit 的文件范围显式包含 source、mirror、tests
- 依赖 `tests/unit/asset-consistency.test.js` 与对应 skill contract tests 做双层守护

### 风险 7：把数据库文档生成的“完成率优化”做成静默执行路径切换

**影响**  
会把前置 `db_access_level` 边界与运行期实际访问路径混在一起，导致结果来源不透明、目标库 provenance 变弱，外部研发场景下更难定位“为什么这次拿到的是这份数据库文档”。

**缓解**

- 优先增强前置能力探测，让 `Level2` 在 CLI 可用时更早被选中
- 若保留 fallback，只能采用显式 contract，记录 `fallback_reason`、`chosen_access_path`、目标库一致性证明
- 不把 worker 内部的静默 `MCP -> CLI` 切换当作默认可靠性增强手段

### 风险 8：把数据库连接识别写成固定配置文件白名单

**影响**  
不同技术栈、monorepo、脚本化配置、变量转发和多连接项目会快速超出白名单覆盖范围，导致方案表面清晰、实际漏识别严重；同时也会把“连接发现”错误收缩成文件名匹配问题，而不是更高质量的决策输入问题。

**缓解**

- 只把“候选连接事实如何表达”做成稳定 contract，不把“必须扫描哪些文件”做成僵化规则
- 允许实现层按语言/框架补充 discovery heuristic，但输出必须统一回到候选连接事实层
- 保持 LLM 在显式边界内做最终选路与逐库分析决策

## Recorded Follow-up: Database Documentation Reliability

以下内容是本轮 planning 过程中形成的**后续独立计划方向**，保留在此作为设计边界记录，但**不属于本计划当前交付验收**：

1. 数据库文档生成的可靠性优化优先做**前置能力判定 + 显式路由**，而不是 worker 内静默 `MCP -> CLI` 自动切换。
2. 数据库连接发现采用**自动识别 + 事实暴露 + LLM 决策**，不收口成固定配置文件白名单。
3. secret 只在运行时解析，不写入 artifact、README、生成文档或 plan 落盘产物。
4. 多连接项目先逐连接枚举与 probe；**probe 成功的连接**进入后续分析，失败连接单独记录原因，不做整批黑盒失败。
5. 如果后续计划要真正落地这条线，必须先明确新 contract 的落点：
   - 是扩 `fact-inventory.database[]`
   - 还是新增 runtime-only machine artifact
   - 以及对应的 schema / worker / tests / docs mirror 修改边界

## Documentation Plan

- 保留 ideation 文档作为上游来源，不删除
- 本 plan 作为正式实施入口
- 如进入实现后发现结构性变化，优先更新本 plan 而不是回 ideation 里补规则
- 本轮不额外新增 `docs/plans/README.md`；plans 目录索引若要补，应作为单独的文档治理任务处理，避免把这份实施计划和目录治理混在一起

## Phased Delivery

### Phase 1

- 完成 Unit 1 + Unit 2
- 只动 skill contract / mirror / tests

### Phase 2

- 完成 Unit 3
- 引入 `spec-work` run artifact contract

### Phase 3

- 完成 Unit 4
- 输出 `spec-code-review` 三轴 verdict

### Phase 4

- 另起计划处理 `spec-compound` 双视角沉淀
- 另起计划处理 workspace / multi-project 边界增强

## Implementation Units

- [x] Unit 1: Lightweight Workflow Anchors
- [x] Unit 2: Freshness-Driven Reload Behavior
- [x] Unit 3: `spec-work` Run Artifact Contract + Closure Summary
- [x] Unit 4: `spec-code-review` Three-Axis Verdict

## Final Review Checklist

- [x] 未引入新的 RIPER workflow
- [x] 未新增 `mydocs/` 或平行 artifact 根目录
- [x] 未把 `Plan Approved` 变成全局精确短语门禁
- [x] `freshness_stale` 与 `L0` 语义不冲突
- [x] `spec-work` mode 真源已明确收口为 `interactive / non-interactive`，且未把 `pipeline` / `headless` 做成并列 mode contract
- [x] `Verification` 增强未演变成平行字段体系
- [x] `spec-work` 先定义 artifact contract 再写 closure summary
- [x] `spec-work` artifact 发现机制保持“显式 handoff 为主，推断发现为辅”，且显式 handoff 已收口为 `run_id` / `artifact_dir`，未新增全局索引
- [x] `spec-code-review` 三轴 verdict 支持 explicit / inferred / missing plan
- [x] `missing plan` 时三轴 verdict 采用条件式输出，不用 `N/A` 占位凑结构
- [x] interactive 模式下 `spec-work` 的 checkpoint 与 approval 已合并为单一 pre-execution block
- [x] 用户可见 workflow 行为变化除 unit contract tests 外，还具备至少 1 条行为级回归锚点
- [x] 数据库方向已明确记录为独立 follow-up，未混入当前 4 个 implementation units 的交付验收

## Next Action

当前计划的 4 个 implementation units 已全部完成，已按 source skill / docs mirror / contract tests 三件套收口。

若继续推进，建议另起独立计划，优先级如下：

1. `spec-compound` 双视角沉淀 contract：把 human-facing 汇报视图与 LLM-facing 检索视图分层，但仍保持 `docs/solutions/` 为唯一持久化主目录。
2. 数据库文档生成 contract：围绕“自动发现候选连接 -> 运行时 secret 解析 -> LLM 基于事实选路”补 runtime-only machine contract，避免静默 `MCP -> CLI` 自动切换。
3. 如未来需要，才评估 `spec-work` run artifact 的 CLI/runtime 持久化落地；当前已完成的是 contract、handoff 语义和下游消费边界，不额外引入重控制面。
