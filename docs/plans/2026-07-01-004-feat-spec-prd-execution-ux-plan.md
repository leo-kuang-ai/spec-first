---
title: "feat: 为 spec-prd 增加执行 UX 协议"
type: feat
status: completed
date: 2026-07-01
spec_id: 2026-07-01-002-spec-prd-execution-ux-protocol
origin: docs/brainstorms/2026-07-01-002-spec-prd-execution-ux-protocol-requirements.md
origin_grade: brainstorm
origin_verification_status: not-applicable
origin_verification_reason_codes: []
plan_depth: standard
implements_schemas: []
---

# feat: 为 spec-prd 增加执行 UX 协议

## Summary

本计划为 `$spec-prd` 增加用户可见的执行 UX 协议：进入短播报、Phase 1+ 任务清单、简短状态更新、写前 Decision Card、checkpoint non-ready 表达，以及 finalize/checker closeout 摘要。实现方式是扩展现有 `spec-prd` source guidance、contract tests、examples-as-context 和用户文档，不新增状态机、progress artifact、transcript schema 或第二套 PRD topology。

---

## Decision Brief

- **推荐方案:** 扩展 `skills/spec-prd/SKILL.md`、`prd-output-template.md`、`prd-readiness-lens.md`、现有 `spec-prd` contract tests、examples-as-context 和用户手册。不新增 workflow、reference 子系统、schema、phase enum、progress ledger 或 runtime mirror patch。
- **关键决策:** UX 只是覆盖现有机制的 run-local 展示协议，复用 `Task-list-first discipline`、`reason-then-act`、Decision Card、`write_mode`、`question_delivery`、`readiness_outcome`、`finalize-prd-artifact.js` 和 `check-prd-artifact.js`。
- **验证重点:** 静态 contract tests 锁定正向锚点和禁止边界；eval fixture 增加一个聚焦的用户可见 UX 失败案例；任何行为层声明都需要 fresh-source eval，或在 closeout 中明确 `behavior_validation: not_run`。
- **最大风险 / 边界:** 最大风险是把过程可见性实现成隐藏流程引擎。实现必须让脚本只产 deterministic facts，让 readiness lens 继续承担 LLM-owned semantic judgment，并避免在缺少 source、owner 或 checker evidence 时使用 "confirmed"、"ready" 或“口径已明确”。

---

## Problem Frame

brainstorm origin 要求 `$spec-prd` 给用户稳定、紧凑、可预期的执行过程：进入短播报、任务清单、状态更新、写前 Decision Card、checkpoint non-ready 文案，以及最终 finalize/checker 摘要。当前 `spec-prd` 已经具备关键底座：`reason-then-act`、`Task-list-first discipline`、`Run-Local Decision Card`、Pre-Write Closure Gate、`write_mode`、`question_delivery`、readiness lens、`finalize-prd-artifact.js` 和 `check-prd-artifact.js`。

缺口不是底层 gate 不足，而是这些控制分散在 workflow 中，没有形成稳定的用户可见 UX 协议。实现应把现有纪律外显并可测试，同时保持仓库边界：light contract、source-first edit、不手改 generated runtime mirror、不让脚本裁决语义 readiness。

---

## Requirements

- R1. `$spec-prd` 进入时必须用短播报说明本轮目标、input posture、预计 PRD artifact 姿态，以及硬边界：不做 implementation work、不生成 implementation plan、不编辑 generated runtime mirror。
- R2. Phase 1+ 任何 durable action 前，`$spec-prd` 必须展示可见任务清单或轻量一行等价形式，覆盖 load-bearing OQ、source/evidence work、PRD write target、owner question 和 finalize gap。
- R3. 推进中状态更新必须简短且 evidence-aware：说明正在推进哪个 gap、source claim、owner question、PRD write target 或 finalize fact；不得输出 transcript-like log 或伪造 tool-output 样式。
- R4. 证据措辞必须区分 `confirmed-source`、`user-stated`、`source-candidate`、`external-research`、`assumption`、`degraded` 和 checker-owned facts。使用 "confirmed"、"ready" 或“口径已明确”必须有 source、owner 或 checker evidence。
- R5. 当 blocking question tool 不可用但 chat 可以等待用户时，UX 必须声明 `question_delivery=chat-fallback` 并一次只问一个 owner question；工具不可用不得被描述为 true headless。
- R6. durable PRD write 前必须展示 compact Decision Card，至少包含 `write_mode`、`highest_risk_gap`、`next_action` 和 `why planning will not invent WHAT`。
- R7. `write_mode=checkpoint-prd` 的 UX 必须明确是 non-ready recovery：`can_enter_spec-plan: no`、命名的 next owner/source question，且不得推荐 planning。
- R8. Phase 4 closeout 必须报告 finalize/checker summary facts，包括 finding count、blocking reason codes、receipt status 和 `readiness_outcome`，并区分 script-owned facts 与 LLM-owned readiness judgment。
- R9. 实现必须复用现有 `spec-prd` 机制，不得新增 public workflow entrypoint、progress ledger、run artifact、transcript schema、phase-status enum、central state machine 或新的 PRD artifact topology。
- R10. 变更必须落在 source truth、tests 和 docs；generated runtime mirrors 可后续通过现有 projection tooling 刷新，但不得手改。

**Origin actors:** A1 PRD owner，A2 `$spec-prd` orchestrator，A3 downstream planner，A4 reviewer。

**Origin flows:** F1 进入与任务清单展示，F2 写前 Decision Card，F3 finalize/checker closeout 与 handoff。

**Origin acceptance examples:** AE1 到 AE6 由 R1 到 R10 以及 U1 到 U5 覆盖。

---

## Assumptions

- A1. UX 协议可以放在 `skills/spec-prd/SKILL.md`，不需要新 reference；原因是协议短、属于 execution hot path，并且完全复用现有字段。
- A2. `skills/spec-prd/references/prd-output-template.md` 和 `skills/spec-prd/references/prd-readiness-lens.md` 继续分别负责 artifact/closeout 和 readiness wording；它们不应复制完整 UX 协议。
- A3. eval fixture 只是 examples-as-context。它可以展示失败模式，但不能被描述为 deterministic behavior proof。
- A4. 初始 source 变更不包含 runtime projection。除非实现阶段显式运行并验证 `spec-first init`，否则 closeout 必须说明 runtime mirrors 未刷新。

---

## Scope Boundaries

- 不新增 public workflow entrypoint，不重命名 `$spec-prd`。
- 不新增 progress file、ledger、run artifact、transcript schema、phase enum 或 central state machine。
- 不新增 `docs/prds/` topology，不改变默认 PRD requirements 路径 `docs/brainstorms/*-requirements.md`。
- 不让 `finalize-prd-artifact.js` 或 `check-prd-artifact.js` 判断 semantic readiness；它们继续只为 readiness lens 提供 deterministic facts。
- 不手改 `.claude/**`、`.codex/**` 或 `.agents/skills/**`。
- 不模仿伪造的执行器输出，例如凭空写 `Ran command`。真实执行过的工具结果可以总结，但不能伪造。

### Deferred to Follow-Up Work

- host-level transcript-bound owner-answer provenance 不在本计划范围内。当前 checker 能验证 artifact-internal trace consistency，不能证明真实 owner round-trip 发生过。
- runtime projection refresh 可在 source change 后通过现有 `spec-first init` 承接；本计划不要求立即刷新。
- 更广的 PRD UX telemetry 或效果度量属于后续 eval/optimization plan，不属于本次 source contract change。

---

## Completion Criteria

- C1. `skills/spec-prd/SKILL.md` 包含命名的用户可见执行 UX 协议或等价锚点，覆盖进入短播报、任务清单、简短状态更新、chat fallback、evidence wording 和 negative boundaries。
- C2. `skills/spec-prd/SKILL.md` 对该协议只复用现有 run-local field vocabulary；不引入新的 phase-status enum、progress artifact、transcript schema 或 durable UX ledger。
- C3. `prd-output-template.md` 和/或 `prd-readiness-lens.md` 明确 checkpoint non-ready 与 Phase 4 closeout wording，同时不把 semantic readiness 移交给脚本。
- C4. `tests/unit/spec-prd-contracts.test.js` 锁定正向 UX anchors 和 negative boundaries。
- C5. `skills/spec-prd/evals/examples.json` 增加一个聚焦的 examples-as-context case，展示 visible UX failure mode 与 evidence wording discipline，且不扩展 fixture schema。
- C6. `docs/05-用户手册/22-PRD需求文档质量增强流程.md` 说明用户在 `$spec-prd` 执行中会看到什么，以及如何理解 checkpoint/finalize 摘要。
- C7. `CHANGELOG.md` 有 compact `(user-visible)` 条目记录 source behavior change。
- C8. 聚焦静态验证通过，覆盖 `spec-prd` contracts、eval fixture contracts、changelog format 和 plan taxonomy；如跳过任何验证，必须给出具体 reason。
- C9. 若 closeout 声称行为层改进，必须有 fresh-source eval、manual fresh-read eval 或真实 `$spec-prd` run observation 支撑；否则 closeout 必须写 `behavior_validation: not_run` 或等价说明。
- C10. 若不刷新 runtime mirrors，closeout 必须明确 source updated 且 runtime not refreshed；若刷新，则必须验证 Claude 和 Codex 双宿主 projection 影响。

---

## Direct Evidence Readiness

- target_repo: `spec-first`
- evidence_sources: direct source reads, `rg`, git status, task-governance-signals, origin requirements, package metadata, changelog inspection
- source_refs:
  - `docs/brainstorms/2026-07-01-002-spec-prd-execution-ux-protocol-requirements.md`
  - `docs/10-prompt/结构化项目角色契约.md`
  - `skills/spec-prd/SKILL.md`
  - `skills/spec-prd/references/prd-output-template.md`
  - `skills/spec-prd/references/prd-readiness-lens.md`
  - `skills/spec-prd/scripts/finalize-prd-artifact.js`
  - `skills/spec-prd/scripts/check-prd-artifact.js`
  - `skills/spec-prd/evals/examples.json`
  - `tests/unit/spec-prd-contracts.test.js`
  - `docs/05-用户手册/22-PRD需求文档质量增强流程.md`
  - `CHANGELOG.md`
- current_revision: `03cccc13`
- worktree_status: 写入本计划前已有 dirty worktree；已存在的无关改动包括 `CHANGELOG.md`、`docs/plans/2026-07-01-003-feat-spec-work-minimality-architecture-fit-plan.md`、`skills/spec-code-review/**`、`skills/spec-work/**`、`tests/unit/spec-code-review-contracts.test.js`、`tests/unit/spec-work-contracts.test.js` 和 `docs/validation/spec-code-review/**`
- confidence: source owner 与 mechanism reuse 可信度高；由于工作区已有并行改动，exact prose placement 在实现前需重新读取当前文件，可信度中等
- limitations: Graph/codegraph output 未作为结论证据；generated runtime mirrors 被有意排除；origin 是 brainstorm-grade，因此 `origin_verification_status` 为 `not-applicable`

---

## Direct Evidence

- repo_scope: 仅当前仓库
- source_reads_completed:
  - 完整读取 brainstorm requirements 文档，并继承其中 `spec_id`。
  - 读取项目角色契约，用于校准 source/runtime、script-vs-LLM 与 state-machine 边界。
  - 读取 `skills/spec-prd/SKILL.md` 中 workflow spine、Interaction Method、`reason-then-act`、Run-Local Decision Card、`Task-list-first discipline`、Requirement Analysis Gate、Pre-Write Closure Gate 和 Phase 4 readiness/handoff 相关段落。
  - 读取 `prd-output-template.md` 中 PRD output shape、evidence tags、Readiness Self-Check、checkpoint handling 和 Closeout Summary。
  - 读取 `prd-readiness-lens.md` 中 script-owned facts、must-not-ready reason codes、checkpoint non-ready posture 和 readiness outcomes。
  - 读取 `finalize-prd-artifact.js` 与 `check-prd-artifact.js` 的相关部分，确认 finalize/checker output fields、receipt verification 和 deterministic fact ownership。
  - 读取 `tests/unit/spec-prd-contracts.test.js` 中 interaction method、write-mode contract、finalize/checker gate 和现有 eval fixture assertions。
  - 用 `rg` 检查 `skills/spec-prd/evals/examples.json` 中现有 Decision Card、checkpoint、source-candidate、Codex guard 和 direct-write anti-pattern examples。
  - 读取 PRD 用户手册中 Decision Card、Phase 4、`write_mode`、checkpoint non-ready 和 ready receipt 相关说明。
- source_reads_required:
  - 实现前必须重新读取所有 target files，因为当前 worktree 已经 dirty，并行变更可能移动锚点。
  - 若实现阶段决定刷新 runtime mirrors，运行 projection 前需重新读取 projection/generation tests。
- commands_or_tools_used:
  - `git status --short`、`git rev-parse --short HEAD`、`rg --files`、聚焦 `rg`、bounded `sed`/`nl` reads。
  - `node bin/spec-first.js internal task-governance-signals` 使用临时 planning context，返回 `candidate_level: deep`、`risk_domains: ["contract","workflow"]`，reason codes 为 `cross-module`、`critical-path-hit`、`keyword-hit`、`candidate-deep`。
- impact_on_plan:
  - 尽管 helper 给出 deep 候选，本计划采用 Standard：实际写集限制在现有 workflow prose、tests、examples、docs 和 changelog；不新增 schema、runtime generation surface、CLI、public entrypoint 或 artifact topology。
  - 所有落点均优先 reuse/extend。现有 `spec-prd` spine 已经拥有相关 fields 和 gates；新 reference 会给 hot-path UX 制造第二真相源。
  - 计划明确区分 static source contract validation 与 behavior/runtime claims。
- key_findings:
  - `Task-list-first discipline` 已要求 durable Phase 1+ action 前有 visible task list，但可以更明确地写成 user-facing UX。
  - `reason-then-act` 已把 owner question、PRD write、readiness 和 handoff 绑定到现有 run-local fields；UX protocol 应扩展它，而不是引入 progress state。
  - `finalize-prd-artifact.js` 返回 `status`、`can_finalize`、`can_closeout`、`blocking_reason_codes`、`closeout_blocking_reason_codes` 和嵌套 checker summary，其中包含 `finding_count`、`blocking_finding_count`、`reason_codes`、hash 与 input diagnostics。
  - `check-prd-artifact.js` 明确只报告 deterministic structure/trace facts，不判断 readiness semantics。
  - 现有 tests 已经覆盖许多相关 anchors，因此实现应新增聚焦测试块，而不是重复大段 broad contract coverage。
- limitations:
  - 本计划没有检查每个 `spec-prd` reference file，因为请求范围聚焦 execution UX，且相关 output/readiness 路径已经直接读取。
  - 本计划不证明 model behavior；它规划 source contract changes 和验证路径。

---

## Context & Research

### 相关代码与模式

- `skills/spec-prd/SKILL.md` 是 hot-path protocol 的正确 owner，因为它已经拥有 workflow spine、Interaction Method、Decision Card、`Task-list-first discipline` 和 Phase 4 handoff。
- `prd-output-template.md` 拥有 artifact wording、Readiness Self-Check、checkpoint presentation 和 Closeout Summary。
- `prd-readiness-lens.md` 拥有对 checker/finalize facts 的 semantic readiness interpretation，应继续声明 scripts 不判断 semantic readiness。
- `tests/unit/spec-prd-contracts.test.js` 已使用 source-string anchors 和 adapter projection assertions；新增 UX tests 应沿用这种风格。
- `skills/spec-prd/evals/examples.json` 已包含 direct-write、checkpoint misuse、source-candidate、Codex guard 和 handoff context examples；本次只新增一个聚焦 UX protocol case。

### 组织内经验

- 项目角色契约强调 scripts prepare deterministic facts，LLM decides semantic adequacy above that floor。
- 既有 changelog 和 `spec-prd` 历史条目显示，workflow prompt 变更需要明确 source/runtime 和 behavior-validation 边界。

### 外部参考

- 未使用外部 web references。计划权威来自本地 source 和用户提供的 brainstorm requirements。

---

## Existing Capability / Reuse Analysis

| 拟变更面 | 决策 | 理由 |
| --- | --- | --- |
| Execution UX protocol | Extend `skills/spec-prd/SKILL.md` | UX protocol 是覆盖现有 run-local fields 的 hot-path workflow behavior；新 reference 会增加跳转和漂移风险。 |
| Checkpoint and closeout wording | Extend `prd-output-template.md` and `prd-readiness-lens.md` | 两个文件已分别拥有 artifact output shape 和 readiness semantics，只需要补本地 non-ready/closeout 表达。 |
| Contract tests | Extend `tests/unit/spec-prd-contracts.test.js` | 现有测试已守护 `spec-prd` prose、runtime projection strings、checker/finalize 和 examples。 |
| Eval coverage | Extend `skills/spec-prd/evals/examples.json` | 现有 examples-as-context 是展示 behavior anti-pattern 的正确位置。 |
| User documentation | Extend `docs/05-用户手册/22-PRD需求文档质量增强流程.md` | 用户手册已描述 PRD quality flow、Decision Card、Phase 4、`write_mode` 和 ready receipts。 |
| Runtime projection | Reuse `spec-first init` only if needed | Runtime mirrors 是 generated outputs，不是 source；不新增 projection path。 |

Work-phase recheck: 若实现开始前已有并行改动加入等价 UX protocol，应合并到该 source，而不是新增第二段或重复 anchors。

---

## Key Technical Decisions

- KTD1. **复用现有字段承载协议。** UX protocol 应命名用户可见行为，但依赖现有 run-local fields：`write_mode`、`highest_risk_gap`、`next_owner_question`、`question_delivery`、`clarification_evidence`、`readiness_outcome` 和 `can_enter_spec-plan`。
- KTD2. **短播报，不做过程日志。** 用户应看到解释下一动作原因的紧凑状态更新；协议必须禁止长 transcript dump 和 fake tool-output styling。
- KTD3. **证据措辞属于 UX。** UX protocol 必须明确禁止在 basis 只是 agent inference 或 source-candidate evidence 时使用 "confirmed"、"ready" 或“口径已明确”。
- KTD4. **Decision Card 仍是写前护栏。** 实现应强化用户可见 Decision Card 文案，而不是创建另一个 pre-write object。
- KTD5. **Checkpoint 是 non-ready recovery UX。** `checkpoint-prd` 必须被表达为 recoverable context 加 next owner/source question，而不是 plan handoff。
- KTD6. **Finalize/checker closeout 是摘要，不是语义证明。** Closeout 必须先暴露 script facts，再单独说明 LLM-owned readiness outcome。
- KTD7. **测试守护锚点与边界。** 静态 tests 应断言 protocol fields、UX obligations 和 forbidden new artifacts/enums，但不得暗示 runtime behavior 已被证明。

---

## Open Questions

### Resolved During Planning

- 是否创建新 reference file？不创建。协议紧凑且在 hot path 中执行，应扩展 `SKILL.md`，并只在 output/readiness references 中补局部表达。
- 是否采用 helper 的 `deep` 计划深度？不采用。helper 正确识别了 workflow/contract 风险，但本计划不新增 schema、public entrypoint、runtime generation 或 artifact topology；Standard 加明确验证足够。
- checker/finalize 是否需要获得 semantic UX rules？不需要。它们继续只产 deterministic facts，semantic readiness lens 和 visible UX prose 负责消费这些 facts。

### Deferred to Implementation

- `skills/spec-prd/SKILL.md` 的精确 section title 与插入点：实现前应重新读取当前文件，并在 `reason-then-act` / `Task-list-first discipline` 附近选择最小非重复锚点。
- eval fixture 的精确 shape：实现应保留当前 JSON schema，并选择最小聚焦 case 覆盖 UX protocol failure。
- fresh-source eval 可用性：若 host 无法运行独立 fresh-source reviewer，closeout 必须记录不可用路径，并避免 behavior-proof wording。

---

## Implementation Units

### U1. 将用户可见执行 UX 协议加入 spec-prd spine

**Goal:** 在 `skills/spec-prd/SKILL.md` 中显式写入协议，同时保留现有 workflow fields，并避免新增 state-machine vocabulary。

**Requirements:** R1, R2, R3, R4, R5, R9, R10

**Dependencies:** None

**Files:**
- Modify: `skills/spec-prd/SKILL.md`
- Test: `tests/unit/spec-prd-contracts.test.js`

**Approach:**
- 在 `Core Principles`、`Interaction Method`、`reason-then-act` 或 `Task-list-first discipline` 附近新增紧凑 section 或 sub-anchor。
- 规定进入短播报内容：goal、input posture、预计 PRD artifact posture、source/runtime boundary、no implementation/plan/runtime-mirror edit。
- 扩展 task-list-first wording，使它明确 user-visible，并覆盖 load-bearing OQ、evidence read、PRD write target、owner question 和 finalize gap。
- 增加短状态更新要求：说明当前 gap 或 evidence check，不输出 transcript log。
- 增加证据措辞纪律，覆盖 `confirmed-source`、`user-stated`、`source-candidate`、`external-research`、`assumption` 和 degraded facts。
- 增加 `chat-fallback` 文案，处理 blocking question tool 不可用但 chat 可等待的情况，同时保持 one-question-at-a-time。

**Patterns to follow:**
- `reason-then-act / 先规划后执行`
- `Task-list-first discipline`
- `Run-Local Decision Card`
- `Interaction Method`

**Test scenarios:**
- 正常路径：source 中出现 visible protocol anchor，覆盖 entry broadcast、task list、progress update、Decision Card、checkpoint 和 closeout requirements。
- 边界路径：lightweight route-out/bypass 可用一条 concise reason，不强制完整 ceremony。
- 错误路径：source 不得为该 UX protocol 引入 progress file、transcript schema、phase-status enum 或 central state-machine language。
- 集成路径：Interaction Method 仍区分 `question_delivery=chat-fallback` 与 `question_delivery=true-headless-unavailable`。

**Verification:**
- 聚焦 `spec-prd` contract tests 通过，覆盖 UX anchors 和 negative boundaries。

---

### U2. 对齐 PRD 输出与 readiness closeout wording

**Goal:** 让 write-before、checkpoint 和 finalize/checker summaries 对用户可读，同时不改变 artifact topology 或 script ownership。

**Requirements:** R6, R7, R8, R9, R10

**Dependencies:** U1

**Files:**
- Modify: `skills/spec-prd/references/prd-output-template.md`
- Modify: `skills/spec-prd/references/prd-readiness-lens.md`
- Test: `tests/unit/spec-prd-contracts.test.js`

**Approach:**
- 在 `prd-output-template.md` 中强化 Closeout Summary guidance，要求 user-facing summary 包含 finding count、blocking reason codes、receipt status 和 `readiness_outcome`。
- 在 checkpoint wording 中明确 `write_mode=checkpoint-prd` 是 non-ready，并绑定 `can_enter_spec-plan: no` 与 `next_owner_question`。
- 在 `prd-readiness-lens.md` 中澄清 finalize/checker findings 是 script-owned facts，lens 拥有 semantic readiness outcome。
- 不在 references 中复制完整协议；references 只处理 output/readiness presentation。

**Patterns to follow:**
- `prd-output-template.md` 的 `## Closeout Summary`
- `prd-readiness-lens.md` 的 `## Outcomes` 与 core pack items
- `SKILL.md` 中现有 Phase 4 `finalize-prd-artifact.js` 文案

**Test scenarios:**
- 正常路径：closeout prose 要求 checker/finalize finding count、blocking reason codes、receipt status 和 readiness outcome。
- 边界路径：checkpoint closeout 只能作为 non-ready recovery，不推荐 planning。
- 错误路径：references 不得说 checker/finalize 决定 semantic readiness。
- 集成路径：`readiness_outcome` 保持现有 readiness lens outcomes。

**Verification:**
- Contract tests 断言 output/readiness reference anchors，且没有引入 checker-owned semantic readiness wording。

---

### U3. 扩展 spec-prd contract tests 守护 UX 协议

**Goal:** 将新协议锁定为 source contract，防止后续漂移成状态机或假确定性。

**Requirements:** R1, R2, R3, R4, R5, R6, R7, R8, R9, R10

**Dependencies:** U1, U2

**Files:**
- Modify: `tests/unit/spec-prd-contracts.test.js`

**Approach:**
- 增加一个聚焦 test block，断言 user-visible execution UX anchors。
- 增加 negative assertions，覆盖 `progress ledger`、`run artifact`、`transcript schema`、`phase enum`、central state-machine language 和 generated runtime mirror edit instructions。
- 增加 evidence wording assertions，确保 source-candidate 和 assumption 不被表达为 confirmed。
- 增加 closeout assertions，区分 script-owned facts 与 LLM-owned readiness judgment。

**Patterns to follow:**
- `tests/unit/spec-prd-contracts.test.js` 现有 `expectContainsAll` 风格
- 现有 Phase 4 mandatory checker gate tests
- 现有 interaction method tests

**Test scenarios:**
- 正常路径：source 出现所有 required UX anchors。
- 错误路径：禁止的新 topology/artifact/state-machine 术语不作为 endorsed behavior 出现。
- 集成路径：当 protocol 跨文件时，test block 一起读取 `SKILL.md`、`prd-output-template.md` 和 `prd-readiness-lens.md`。

**Verification:**
- `spec-prd` contract tests 通过。

---

### U4. 增加聚焦的 examples-as-context 覆盖

**Goal:** 增加一个聚焦的 `spec-prd` eval example，展示 execution UX protocol failure mode，同时不把 fixture 当作 deterministic behavior proof。

**Requirements:** R1, R2, R3, R4, R6, R7, R8, R9

**Dependencies:** U1, U2

**Files:**
- Modify: `skills/spec-prd/evals/examples.json`
- Test: `tests/unit/spec-prd-contracts.test.js`
- Test: `tests/unit/eval-fixture-contracts.test.js`

**Approach:**
- 新增一个 case：model 读取材料后在无 evidence 情况下说“口径已明确”，跳过 task-list/status UX，省略写前 Decision Card，写 checkpoint/final PRD，并在 closeout 中不给 finalize/checker summary。
- expected behavior 要求 visible task-list-first UX、evidence-labeled wording、write 前 Decision Card、checkpoint non-ready wording 和 finalize/checker closeout summary。
- 保持现有 fixture fields，不新增 eval fixture schema fields 或 UX metrics artifact。

**Patterns to follow:**
- 现有 `direct-write-skips-phase1-rejected`
- 现有 `source-candidate-unconfirmed`
- 现有 Codex guard/degraded enforcement examples

**Test scenarios:**
- 正常路径：fixture 是合法 JSON，并通过 eval fixture structural tests。
- 错误路径：fixture expected behavior 拒绝在没有 source/owner/checker evidence 时使用 confirmed language。
- 集成路径：现有验证 examples 的 `spec-prd` contract tests 继续通过。

**Verification:**
- Eval fixture structure 和 `spec-prd` contract tests 通过。

---

### U5. 更新用户侧 PRD workflow 文档与 changelog

**Goal:** 记录用户在 `$spec-prd` 执行中应看到什么，并记录 source behavior change。

**Requirements:** R1, R2, R3, R4, R5, R7, R8, R9, R10

**Dependencies:** U1, U2, U3, U4

**Files:**
- Modify: `docs/05-用户手册/22-PRD需求文档质量增强流程.md`
- Modify: `CHANGELOG.md`
- Test: `tests/unit/changelog-format.test.js`

**Approach:**
- 在现有 Decision Card / Phase 4 / `write_mode` 说明附近增加紧凑用户手册小节。
- 说明可见流程：短播报、任务清单、状态更新、Decision Card、checkpoint non-ready、finalize/checker summary。
- 说明 "confirmed" 与 "ready" wording 依赖 source、owner 或 checker evidence；source-candidate 和 assumptions 必须保持标注。
- 更新 changelog，记录 source-level behavior change、verification、runtime mirror status 和 behavior-validation status。

**Patterns to follow:**
- 用户手册中现有 Phase 4 与 `write_mode` 章节
- 现有 compact changelog format 与 `(user-visible)`

**Test scenarios:**
- 正常路径：docs 说明预期 UX，但不新增 command 或 workflow。
- 错误路径：docs 不建议从 `checkpoint-prd` 进入 planning。
- 集成路径：changelog format test 通过。

**Verification:**
- Changelog format 与 touched docs markdown whitespace checks 通过。

---

### U6. 完成 source/runtime 验证与 behavior-evidence closeout

**Goal:** 收尾时诚实区分 source contract、static validation、runtime projection 和 behavior evidence。

**Requirements:** R8, R9, R10

**Dependencies:** U1, U2, U3, U4, U5

**Files:**
- Test: `tests/unit/spec-prd-contracts.test.js`
- Test: `tests/unit/eval-fixture-contracts.test.js`
- Test: `tests/unit/changelog-format.test.js`
- Test: `tests/unit/plan-status-taxonomy.test.js`

**Approach:**
- 运行聚焦静态验证，覆盖 `spec-prd` source、eval fixtures、changelog 和 plan taxonomy。
- 若声明 behavior-level improvement，运行 fresh-source eval、manual fresh-read eval 或观测到的 `$spec-prd` run，并报告限制。
- 若未运行 behavior validation，明确说明原因，避免声称 runtime behavior 已改变。
- 决定是否运行 runtime projection。若跳过，closeout 必须说明 generated mirrors 未刷新；若运行，必须通过现有测试或 source/runtime comparison 验证双宿主 projection。

**Patterns to follow:**
- `AGENTS.md` 中 agent/skill prose validation guidance
- 现有 `spec-prd` changelog 条目对 source update 与 runtime projection 的分层写法

**Test scenarios:**
- 正常路径：聚焦 tests 通过，closeout 命名 behavior validation status。
- 边界路径：behavior validation 不可用时作为 limitation 报告，不隐藏。
- 集成路径：runtime mirror status 报告准确。

**Verification:**
- Static validation 完成，或每个 skipped check 都有命名 reason。Runtime projection 与 behavior evidence 不被夸大。

---

## System-Wide Impact

- **公开 workflow 行为:** `$spec-prd` 的过程对用户更可见，但 public entrypoint 与 artifact topology 不变。
- **下游 planning:** `spec-plan` 接收 PRD handoff 时会更清楚地区分 checkpoint non-ready 与 planning-invention residue。
- **runtime mirrors:** Source changes 不会自动影响当前 host runtime；实现 closeout 必须报告 projection 是否运行。
- **tests/evals:** Static contract tests 和 examples-as-context 能守护 prompt source drift，但不能证明所有 model run 都会遵守协议。
- **文档:** 用户手册应对齐预期，同时不暗示硬状态机。
- **不变约束:** Scripts 仍只报告 deterministic facts；readiness lens 仍拥有 semantic adequacy；generated runtime mirrors 不是 source truth。

---

## Risks & Dependencies

| 风险 | 缓解 |
| --- | --- |
| UX protocol 漂移成隐藏状态机 | 保持为覆盖现有 fields 的 prose；增加 negative contract assertions，禁止 phase enum、ledger、transcript 和 central state machine。 |
| hot-path `SKILL.md` 变得过重 | 保持协议紧凑；只把 output/readiness-specific wording 放到已有 owner references。 |
| 静态测试制造虚假信心 | Completion criteria 要求 behavior validation status 与 contract tests 分开声明。 |
| checker/finalize wording 被误读为 semantic proof | U2 和 U3 必须显式区分 script-owned facts 与 LLM-owned readiness judgment。 |
| 并行 dirty worktree 变更移动锚点 | 实现从重新读取 target files 开始，并适配当前 source。 |
| runtime mirrors 在 source change 后仍然 stale | Closeout 必须运行 projection 并验证，或明确写 `runtime not refreshed`。 |

---

## Documentation / Operational Notes

- 后续实现必须更新 `CHANGELOG.md`，因为这是 user-visible workflow behavior change。
- 除非实现过程中发现 public workflow catalog 也需要展示 `$spec-prd` UX，否则不更新 README。
- 不把 origin brainstorm requirements 标记为 PRD-grade；本计划正确记录 `origin_grade: brainstorm` 与 `origin_verification_status: not-applicable`。

---

## Sources & References

- **Origin document:** [docs/brainstorms/2026-07-01-002-spec-prd-execution-ux-protocol-requirements.md](docs/brainstorms/2026-07-01-002-spec-prd-execution-ux-protocol-requirements.md)
- **角色契约:** `docs/10-prompt/结构化项目角色契约.md`
- **workflow source:** `skills/spec-prd/SKILL.md`
- **output/readiness references:** `skills/spec-prd/references/prd-output-template.md`, `skills/spec-prd/references/prd-readiness-lens.md`
- **finalize/checker scripts:** `skills/spec-prd/scripts/finalize-prd-artifact.js`, `skills/spec-prd/scripts/check-prd-artifact.js`
- **tests:** `tests/unit/spec-prd-contracts.test.js`, `tests/unit/eval-fixture-contracts.test.js`
- **用户手册:** `docs/05-用户手册/22-PRD需求文档质量增强流程.md`
