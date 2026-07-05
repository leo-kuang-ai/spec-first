---
title: "feat: task-pack per-task review gate v1"
type: feat
status: completed
date: 2026-05-11
spec_id: 2026-05-11-006-task-pack-review-gate
origin: docs/2026-05-10/spec-first-full-code-review-and-competitor-benchmark.md
origin_issue: P2-002
---

# feat: task-pack per-task review gate v1

## 摘要

本计划交付 `P2-002 task-pack per-task review gate` 的轻量版：在现有 task-pack task card 上增加可选 `review_gate: optional|required`，继续复用 `review_focus` 作为审查关注点，并让 `spec-work` 在执行 task-pack 时把 task 级 review intent 带入完成后的 report-only mini review 或最终 shipping review。

设计保持 light contract：脚本只校验字段结构、枚举值、identity/freshness 与 path 事实；是否需要升级 review、review 关注什么、无法运行 review 时如何 handoff，仍由 `spec-work` / `spec-code-review` 的 LLM workflow 判断。v1 不引入 per-task 状态机、审批账本、dashboard，也不默认对每个 task 启动完整 multi-persona review。

## 问题框架

当前 task-pack 已有 `execution_waves`、`dependencies`、`test_focus`、`done_signal`、`stop_if` 和 `review_focus`，可以帮助 `spec-work` 更早识别执行顺序、验证重点和停止条件。但长任务仍容易在最终 diff review 才发现某个局部 task 的质量问题，尤其是跨 contract、workflow prose、validator、source/runtime 边界的任务。

`docs/2026-05-10/spec-first-full-code-review-and-competitor-benchmark.md` 已把 `P2-002` 定位为短期优先项，同时明确护栏：只增加轻量 `review_gate` 与 handoff contract，不默认自动 multi-persona per-task review，不把 task-pack 变成运行时状态机。

## 目标

- G1. 让 task-pack 可以显式表达 task 级 review intent：`review_gate: optional|required`。
- G2. 保持 `review_focus` 的职责：描述 mini review 或最终 review 应关注的具体风险，而不是表达通过/失败状态。
- G3. 让 deterministic validator 接受并校验 `review_gate` 的结构，不判断哪些 task 语义上必须 review。
- G4. 让 `spec-work` 在消费 validated task-pack 时保留 `review_gate` 和 `review_focus`，并对 `required` gate 给出明确 report-only review 或 handoff 行为。
- G5. 保持最终 shipping review 机制不退化：task-level gate 是早反馈与 review 聚焦信号，不替代 Phase 3 的 required code review。
- G6. 保持 `spec-write-tasks` 是 standalone skill，不新增 `spec-write-tasks` 或 `spec-write-tasks` 入口。

## 非目标

- 不新增 task runtime state、review queue、approval ledger、dashboard、artifact registry 或 per-task progress DB。
- 不新增 `review_status`、`approved_by`、`gate_passed`、`review_result` 等状态字段。
- 不让 `src/cli/task-pack.js` 判断 review 是否充分、哪些 task 语义上必须 `required`，或解析 `review_focus` 的自然语言含义。
- 不默认每个 task 都运行完整 `spec-code-review` multi-persona pipeline。
- 不给 `spec-code-review` v1 增加 `task:<id>` / `task-pack:<path>` 新参数；由 `spec-work` 在上下文摘要中携带 task ids、task-pack path、`review_gate` 与 `review_focus`。
- 不修改 `.claude/`、`.codex/`、`.agents/skills/` generated runtime mirrors。

## 需求

- R1. Task Pack Contract 中的 task 允许可选字段 `review_gate`，合法值仅为 `optional` 或 `required`；字段缺席表示没有 task-level review gate。
- R2. `review_gate` 不进入 required task fields，现有 task-pack 在不添加该字段时继续 valid。
- R3. `review_gate` 出现非法值、空字符串、对象、数组或非字符串类型时，validator 必须返回结构错误，而不是 limitation。
- R4. `review_focus` 继续是 free-text quality field，用于描述具体 review concern；它不能替代 `test_focus`、`done_signal` 或 `stop_if`。
- R5. `spec-first tasks validate <task-pack-path> --json` 的 `execution_focus` 必须在字段存在时透出 `review_gate` 和 `review_focus`，便于 `spec-work` 不重新解析 free-form Markdown。
- R6. `spec-write-tasks` guidance 必须说明何时设置 `required`、何时设置 `optional`、何时省略；语义判断属于 LLM，不属于 validator。
- R7. `spec-work` 消费 task-pack 时，必须把 `review_gate` / `review_focus` 作为 task 执行上下文保留；`review_gate: required` 是 task completion checkpoint，完成该 logical task 后、标记 task done、提交该 logical unit、进入下一 wave 或进入 Phase 3 前，必须运行 bounded report-only mini review，或明确 stop/handoff 说明未运行原因。
- R8. `review_gate: optional` 只表示建议 review：`spec-work` 可以结合 diff 风险、review_focus、当前 host 能力和最终 shipping review 合并处理，不得强制制造 N 次 review workflow。
- R9. 最终 shipping review 的 Tier 2 升级规则必须识别 task-pack 中明确要求 full/deep/thorough/spec-code-review 的 task-level review request；该升级不依赖 `review_gate: required`，而 `review_gate: required` 本身也不等同于 full multi-persona review。Task-level mini review 不跳过最终 shipping review。
- R10. 文档和测试必须明确 `review_gate` 是 task-card metadata / executable advisory，不是状态机、审批结果或 source-plan scope authority。

## 范围边界

- Source plan 仍是 scope、requirements、non-goals 的 single source of truth；task-pack 只是 derived execution input。
- Task Pack Contract JSON block 仍是 validator 的唯一机器可读 task-card source；human-readable Task Cards 可重复信息，但 validator 不从 free-form Markdown 推断。
- `review_gate` 可以影响 review handoff 和 review focus，不能扩大 planned surface，也不能覆盖 `stop_if`。
- `source_plan_hash` 与 `spec_id` 的 identity/freshness 验证保持现状；P2-002 不改变 task-pack 链路身份模型。

### Deferred to Follow-Up Work

- Per-task review durable artifact catalog：等 `spec-work` run artifact producer 真正实现后再评估。
- `spec-code-review` 原生 task-pack/task-id 参数：等出现多个 workflow consumer 或 report-only mini review 需要稳定 machine API 时再做。
- UI/dashboard/history：不属于 v1。

## Graph Readiness

- status: stale
- source_revision: `b5ca72a99056fb2dc6c21b6e0c063c5d6b8203a7`
- current_revision: `2b1cd7d67718805d063a63bd023eca072bc64e3d`
- stale: true
- primary_providers: `code-review-graph`, `gitnexus`
- degraded_providers: none in compiled artifact
- fallback_capabilities: direct repo reads, existing unit contract tests, task-pack validator source inspection
- runtime_mcp_evidence: not used as primary planning evidence
- confidence: medium
- limitations: compiled graph facts are from an older source revision and the worktree is dirty; this plan relies on direct source/test reads and two read-only reviewer summaries for the current P2-002 scope.

## Context & Research

### Relevant Code and Patterns

- `src/cli/task-pack.js` already defines `REQUIRED_TASK_FIELDS`, `ALLOWED_TASK_FIELDS`, optional string validation, `validateTaskPackContract`, and `execution_focus` projection.
- `skills/spec-write-tasks/references/task-pack-schema.md` defines Task Pack Contract as the only machine-readable task-card source and documents quality fields such as `review_focus`.
- `skills/spec-write-tasks/SKILL.md` already treats task-pack as derived execution input and lists `review_focus` among optional LLM/human quality fields.
- `skills/spec-work/SKILL.md` already validates task-pack identity/freshness before execution and honors `stop_if`.
- `skills/spec-work/references/shipping-workflow.md` already escalates to Tier 2 when a plan or task explicitly requests full/deep/thorough review.
- `skills/spec-code-review/SKILL.md` already supports `mode:report-only`, including single-agent report-only fallback when reviewer dispatch is unavailable or unsafe.

### Institutional Learnings

- Historical task-packs under `docs/tasks/` show `review_focus` is already used as a per-task review concern field.
- `docs/solutions/architecture-patterns/workflow-entrypoint-exposure-contract-2026-04-26.md` and related fixes reinforce that `spec-write-tasks` is standalone, not a command-backed workflow entrypoint.
- Prior graph/task-pack plans reinforce the boundary that task-pack is derived from source plan and should not become a second plan or runtime state store.

### External References

- No new external references were used for this plan. The implementation is constrained by current repo contracts and the P2-002 backlog item.

## 设计决策

- D1. Add `review_gate` as an optional enum, not a required field. 理由：保持 backward compatibility，避免让所有 existing task-pack 立刻失效。
- D2. Use exactly `optional|required`; absence means no task-level gate. 理由：这是 P2-002 backlog 的最小表达，避免新增 `none` 造成冗余状态。
- D3. Keep `review_focus` free text. 理由：审查关注点是语义输入，LLM 应解释它；脚本不应解析自然语言。
- D4. Do not bump `task-pack/v1`. 理由：这是 backward-compatible optional field 扩展；只有 required 字段、结构对象或 breaking validation 才需要新 schema version。
- D5. Expose `review_gate` / `review_focus` in `execution_focus`. 理由：`spec-work` 应消费 validator output，而不是重复从 Markdown 或 raw JSON 中拼接执行上下文。
- D6. Required gate routes to `spec-code-review mode:report-only` or explicit handoff. 理由：task-level gate 的目标是早反馈，不应在执行中自动修改文件、启动重型 autofix loop，或用未定义的 host-native review 替代可解释 contract。
- D7. Final shipping review remains mandatory. 理由：per-task gate 是局部质量控制，不是 release/shipping review 的替代品。
- D8. Keep code-review API unchanged in v1. 理由：当前 `spec-code-review mode:report-only` 已足够作为 mini review target；新增 task-pack 参数会扩大 contract surface。

## 过度设计防线

### v1 必须完成

- `review_gate` optional enum 进入 task-pack schema、validator allowed fields 和 JSON projection。
- `spec-write-tasks` 说明 `required` / `optional` / absent 的使用规则。
- `spec-work` 说明 task-pack execution 如何保留 review intent，以及 `required` gate 的 diff-scoped report-only review、batching、failure policy 与 handoff 行为。
- 相关 unit contract tests 覆盖 validator、task compiler prose、work workflow prose、shipping review tier 语义。
- `CHANGELOG.md` 和 P2-002 状态文档在实现完成时回写。

### v1 必须延后

- Per-task persistent review result。
- Per-task dashboard/history。
- `spec-code-review` task-pack/task-id machine API。
- `spec-code-review` prose/API 扩张；除非实现证明现有 report-only contract 无法承载 handoff，否则 v1 不修改该 workflow。
- 自动对每个 task 运行 multi-persona review。
- 任何 generated runtime mirror patch。

### 停止条件

实施中如果需要新增 durable state directory、approval 状态字段、review registry、复杂 worker queue，修改 `spec-code-review` API，或让 validator 判断 task 的语义风险等级，应停止并回到 `spec-plan` / `spec-doc-review`。P2-002 只增强 task-pack 的 review intent 和 `spec-work` 的 handoff 纪律。

## 实施单元

### U1. 扩展 task-pack schema 与 validator

**目标:** 让 `review_gate` 成为可验证、可投影的 task-card metadata。

**需求:** R1, R2, R3, R5, R10

**依赖:** 无

**文件:**
- Modify: `skills/spec-write-tasks/references/task-pack-schema.md`
- Modify: `src/cli/task-pack.js`
- Modify: `tests/unit/task-pack-command.test.js`
- Modify: `tests/fixtures/spec-write-tasks/valid/task-pack.md`

**Approach:**
- 将 `review_gate` 加入 `ALLOWED_TASK_FIELDS`。
- 增加 enum 校验：仅允许 `optional` 或 `required`；非法值产生 `task-pack-task-review-gate-invalid` 类结构错误。
- 将 `review_gate` 和 `review_focus` 加入 `execution_focus` projection，字段缺席时为 `null` 或省略需与现有 projection 风格一致。
- 在 schema 文档的 Task Pack Contract 示例和 Quality Task Fields 表中说明 `review_gate` 与 `review_focus` 的分工。

**Execution note:** 先写 validator 单测再改 validator，避免把非法值当 limitation 放过。

**Patterns to follow:**
- `src/cli/task-pack.js` 中 `validateOptionalStringFields` 与 `parallelizable` 的现有错误收集模式。
- `tests/unit/task-pack-command.test.js` 中对 optional quality fields、invalid optional string fields、unknown fields 的测试风格。

**Test scenarios:**
- Happy path: task with `review_gate: "required"` validates and `execution_focus[0].review_gate` is `required`。
- Happy path: task with `review_gate: "optional"` validates and does not produce unknown-field limitation。
- Backward compatibility: task without `review_gate` remains valid。
- Error path: `review_gate: "full"` produces structural error。
- Error path: `review_gate: ""` / object / array / boolean produces structural error。
- Integration: `execution_focus` includes `review_focus` when present so `spec-work` can consume it without Markdown parsing。

**Verification:**
- `npx jest tests/unit/task-pack-command.test.js --runInBand`
- `npm run typecheck`

### U2. 更新 `spec-write-tasks` 生成指导

**目标:** 让 task compiler 保守地写入 review gate，不把所有 task 都升级成 required。

**需求:** R4, R6, R10

**依赖:** U1

**文件:**
- Modify: `skills/spec-write-tasks/SKILL.md`
- Modify: `skills/spec-write-tasks/references/task-quality-guide.md`
- Modify: `tests/unit/spec-write-tasks-contracts.test.js`

**Approach:**
- 在 task-pack quality fields 中增加 `review_gate`，并说明它是 executable advisory metadata。
- 建议使用规则：
  - `required`: shared contract、public workflow prose、validator/schema、source/runtime boundary、security/release/CI、或会阻塞多个后续 tasks 的高风险 task。
  - `optional`: 非平凡行为改动、中等风险、存在局部 review 价值但可并入最终 shipping review 的 task。
  - absent: docs-only、config-only、trivial copy edit、低风险单文件修正。
- 明确 `review_focus` 必须具体描述 review 应看的风险；`review_gate` 只表达是否需要 gate。
- 保留 standalone skill 入口边界，不新增 `spec-write-tasks` 或 `spec-write-tasks` 文案。

**Execution note:** 这是 skill prose 语义变更；实现后需要 contract tests，并在可用时按 `docs/contracts/workflows/fresh-source-eval-checklist.md` 做 fresh-source eval。

**Patterns to follow:**
- `skills/spec-write-tasks/SKILL.md` 中 deterministic handoff 与 semantic posture 的边界描述。
- `skills/spec-write-tasks/references/task-quality-guide.md` 中 `stop_if`、`test_focus`、`done_signal` 的质量字段写法。

**Test scenarios:**
- Contract: source skill mentions `review_gate` as optional review intent metadata, not lifecycle state。
- Contract: guide distinguishes `review_gate` from `review_focus`、`test_focus`、`done_signal`、`stop_if`。
- Contract: guide says validator checks structure only and does not decide which tasks semantically require review。
- Contract: no new `spec-write-tasks` / `spec-write-tasks` command-backed entrypoint wording appears。

**Verification:**
- `npx jest tests/unit/spec-write-tasks-contracts.test.js --runInBand`

### U3. 更新 `spec-work` task-pack consumption 与 required gate handoff

**目标:** 让 `spec-work` 在执行 task-pack 时保留 task-level review intent，并在 required gate 上给出早反馈。

**需求:** R5, R7, R8, R10

**依赖:** U1

**文件:**
- Modify: `skills/spec-work/SKILL.md`
- Modify: `skills/spec-work-beta/SKILL.md`
- Modify: `skills/spec-work-beta/references/codex-delegation-workflow.md`
- Modify: `tests/unit/spec-work-contracts.test.js`
- Modify: `tests/unit/spec-work-beta-contracts.test.js`

**Approach:**
- 在 task-pack Quick Start 中说明 validated task pack supplies `review_gate` and `review_focus` when present。
- 创建 execution tasks 时保留 `review_gate` / `review_focus`，但不把它们当作 progress state。
- 对 `review_gate: required`：
  - task completion checkpoint 触发 review；完成 required task 后、标记 task done、提交该 logical unit、进入下一 wave 或进入 Phase 3 前，运行 bounded `spec-code-review mode:report-only`；
  - task 开始前记录 `pre_task_base` 或等价 diff anchor；task 完成并完成本 task 验证后，以 `spec-code-review mode:report-only base:<pre_task_base> plan:<source_plan>` 审当前 checkout；
  - review context 至少包含 task-pack path、task id、declared files、actual changed files、source plan path、`review_focus`；
  - 若当前工作区已有无法隔离的未提交前置修改，允许把同一 dependency/wave boundary 内多个 required gates 合并为一次 bounded report-only review，但 context 必须列出每个 task id、declared files、actual changed files 和 `review_focus`；
  - 如果无法形成可靠 diff range 或安全运行 report-only review，stop 并给出 handoff，不得 silently skip，也不得伪装成 per-task review；
  - report-only review 运行后，如果返回 P0/P1，或返回与该 task `review_focus` 直接相关的 actionable finding，必须修复并复查，或明确 handoff/用户接受后才能继续依赖任务；
  - P2/P3 或 advisory finding 可汇入最终 shipping review context，除非它直接击中 `review_focus` 或 `stop_if`。
- 对 `review_gate: optional`：
  - 记录为 review suggestion；
  - 可并入最终 shipping review，或在 risk signals 较高时提前运行 report-only review。
- 对多个 required gates：
  - 同一 dependency/wave boundary 且可共享 diff anchor/context 时，`spec-work` 应优先合并为一次 bounded report-only review；
  - terminal required task 不能因为没有 dependent task 而绕过 gate；可以由立即执行的最终 shipping review 覆盖，前提是 review context 明确包含该 task id、diff scope 和 `review_focus`。
- `spec-work-beta` 保持同等语义；delegation 模式下 required gate 必须由 orchestrator 汇总后执行或 stop/handoff，不能让 worker 静默越过。Delegation prompt 和 batching 规则必须携带 task-pack metadata（`task_id`、`dependencies`、`review_gate`、`review_focus`），并以 required gate 切分或暂停 dependent batch。

**Execution note:** 先改 stable `spec-work`，再做 beta parity；不要引入新的 runtime artifact，不新增 per-task review status。

**Patterns to follow:**
- `skills/spec-work/SKILL.md` 中 task-pack identity/freshness validation 与 `stop_if` 执行边界。
- `skills/spec-work-beta/SKILL.md` 中 delegation handoff contract。
- `skills/spec-work-beta/references/codex-delegation-workflow.md` 中批次划分、prompt 构造和 orchestrator 汇总边界。

**Test scenarios:**
- Contract: `spec-work` says task-pack execution preserves `review_gate` and `review_focus`。
- Contract: `review_gate: required` requires diff-scoped report-only review or explicit handoff at task completion checkpoint。
- Contract: `review_gate: required` records/uses `pre_task_base` or stops when per-task diff scope cannot be formed。
- Contract: blocking P0/P1 or review-focus-matching actionable findings must be fixed/re-reviewed or handed off before continuing dependent work。
- Contract: same-boundary required gates may be batched into one bounded report-only review, but terminal required tasks still get covered before Phase 3 completes。
- Contract: `review_gate: optional` is advisory and may be merged into final review。
- Contract: required gate does not replace final shipping review。
- Beta parity: `spec-work-beta` carries the same gate semantics, delegation batching respects required gates, and workers do not continue dependent batches before orchestrator review/handoff。

**Verification:**
- `npx jest tests/unit/spec-work-contracts.test.js tests/unit/spec-work-beta-contracts.test.js --runInBand`

### U4. 收窄 shipping review 与 code-review report-only 边界

**目标:** 让最终 review tier 识别 task-level full/deep review requests，同时避免把 task gate 误做成 `spec-code-review` API 扩张或 full review default。

**需求:** R7, R8, R9, R10

**依赖:** U3

**文件:**
- Modify: `skills/spec-work/references/shipping-workflow.md`
- Modify: `tests/unit/spec-work-contracts.test.js`
- Inspect only: `skills/spec-code-review/SKILL.md`
- Do not modify unless blocked: `tests/unit/spec-code-review-contracts.test.js`

**Approach:**
- 在 shipping Tier 2 触发条件中明确：plan/task/review_focus 中显式要求 full/deep/thorough/spec-code-review 时触发 Tier 2；这个升级不要求 `review_gate: required`。
- 明确普通 `review_gate: required` 只要求 diff-scoped report-only mini review 或 handoff，不等同于 full multi-persona autofix review。
- 默认不修改 `skills/spec-code-review/SKILL.md`；只确认现有 `mode:report-only` 可通过调用上下文携带 plan/task/work artifact 信息。
- 如果实现时发现现有 report-only contract 无法承载该 handoff，停止并回到 plan/doc-review，而不是顺手扩张 `spec-code-review` API。
- 保留 `mode:report-only` 的 no-write/no-artifact directory contract，不新增 task-pack CLI 参数。

**Execution note:** 这是 U3 的边界校准补丁，不是新的 code-review feature。优先只改 shipping workflow；不要扩大到 code-review API 设计。

**Patterns to follow:**
- `skills/spec-work/references/shipping-workflow.md` 现有 Tier 1 / Tier 2 escalation bullets。
- `skills/spec-code-review/SKILL.md` 现有 `mode:report-only` 和 single-agent fallback 描述。

**Test scenarios:**
- Contract: shipping workflow recognizes explicit task-level full/deep/thorough review request as Tier 2 signal regardless of `review_gate`。
- Contract: `review_gate: required` alone does not force Tier 2 full multi-persona review。
- Contract: report-only task-level review does not bypass Phase 3 required code review。
- Contract: the plan/workflow does not expose a new task-pack parameter for `spec-code-review`。

**Verification:**
- `npx jest tests/unit/spec-work-contracts.test.js --runInBand`

### U5. 文档、状态回写与最终校验

**目标:** 把 P2-002 的实现状态、边界和验证结果同步到项目治理文档。

**需求:** R10

**依赖:** U1, U2, U3, U4 boundary check

**文件:**
- Modify: `docs/2026-05-10/spec-first-full-code-review-and-competitor-benchmark.md`
- Modify: `CHANGELOG.md`
- Test: `tests/unit/changelog-format.test.js`

**Approach:**
- 实现完成后将 `P2-002` 从 planned/backlog 回写为已修复或 v1 fixed，并记录实际验证命令。
- 说明 v1 只实现 task-level review intent + report-only handoff，不包含 per-task review artifact catalog、dashboard 或状态机。
- `CHANGELOG.md` 使用当前 Codex developer profile 作者格式。
- 确认未修改 generated runtime mirrors；如后续需要 runtime refresh，应通过 `spec-first init --codex|--claude` 另行执行。

**Execution note:** 本单元只在代码/skill 实现完成后做状态回写；不要在计划创建阶段提前标记 P2-002 已修复。

**Patterns to follow:**
- `docs/2026-05-10/spec-first-full-code-review-and-competitor-benchmark.md` 中 P2-007/P2-009 的状态回写方式。
- `CHANGELOG.md` 当前单行记录格式。

**Test scenarios:**
- Docs: P2-002 status names actual implemented scope and explicitly excludes heavy review automation。
- Changelog: latest entry uses `leokuang` and current repo format。
- Generated runtime: `git status --short` has no `.claude/`、`.codex/`、`.agents/skills/` source-mirror edits from this work。

**Verification:**
- `npx jest tests/unit/changelog-format.test.js --runInBand`
- `git diff --check`

## System-Wide Impact

- **Interaction graph:** `spec-write-tasks` emits review intent, `src/cli/task-pack.js` validates/projects it, `spec-work` consumes it, and `spec-code-review mode:report-only` may serve as the bounded review surface.
- **Error propagation:** invalid `review_gate` is a validator error; semantically questionable gate choice remains LLM/human review guidance, not a validator failure. Required mini review cannot be skipped silently: missing diff anchor, unavailable report-only review, P0/P1 findings, or review-focus-matching actionable findings must stop, fix/re-review, or hand off.
- **State lifecycle risks:** no new durable state is introduced; task completion remains derived from git/test evidence and workflow execution, not task-pack mutation.
- **API surface parity:** stable `spec-work` and beta `spec-work-beta` must preserve the same gate semantics, including delegation batching and required-gate checkpoints.
- **Integration coverage:** unit contract tests must cover schema/validator, `spec-write-tasks`, `spec-work`, beta parity, diff-scoped required mini review, batching, failure policy, and shipping review boundary.
- **Unchanged invariants:** source plan remains scope authority; `stop_if` remains the scope expansion brake; final shipping review remains required.

## 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| `review_gate` 被误用成审批状态 | 文档和 tests 明确它是 metadata / executable advisory，不记录 pass/fail。 |
| 所有 task 被默认 required，执行噪音过大 | `spec-write-tasks` guidance 明确 absent/optional/required 使用规则，required 只给高风险 task。 |
| required gate 产生过多独立 review | 同一 dependency/wave boundary 可合并 required gates；terminal gate 可由立即执行且携带 task context 的 shipping review 覆盖。 |
| required gate 退化为全分支 review | U3 定义 `pre_task_base` / diff anchor；无法形成可靠 diff range 时 stop/handoff。 |
| report-only review 发现问题后仍继续 | U3 定义非持久 failure policy：P0/P1 或 review-focus-matching actionable finding 必须修复复查或 handoff/用户接受。 |
| Validator 越界判断语义风险 | Validator 只检查 enum 和结构；是否需要 required 由 LLM/human 负责。 |
| Task-pack 覆盖 source plan scope | `spec-work` 继续读取 source plan，task-pack 只提供 execution focus。 |
| Report-only mini review 被误解为最终 review | `spec-work` 和 shipping workflow 明确 Phase 3 review 仍 required。 |
| `spec-code-review` API 过早膨胀 | v1 不新增 task-pack/task-id 参数，默认不修改 `spec-code-review` workflow，只通过调用上下文携带 task ids 和 review_focus。 |
| Beta work path 漏掉 gate | `spec-work-beta` parity test 和 delegation reference 覆盖 required gate handoff、batch splitting 和 delegation 不静默越过。 |

## 验证计划

最小验证：

- `npx jest tests/unit/task-pack-command.test.js --runInBand`
- `npx jest tests/unit/spec-write-tasks-contracts.test.js --runInBand`
- `npx jest tests/unit/spec-work-contracts.test.js tests/unit/spec-work-beta-contracts.test.js --runInBand`
- `npx jest tests/unit/changelog-format.test.js --runInBand`
- `npm run typecheck`
- `git diff --check`

扩展验证：

- `npm run test:unit`
- Fresh-source eval for changed skill prose using `docs/contracts/workflows/fresh-source-eval-checklist.md` when host dispatch is available; if unavailable, record the reason instead of claiming pass.

## Handoff

本计划已完成一轮 `spec-doc-review` 修订。下一步进入：

```text
spec-work docs/plans/2026-05-11-006-feat-task-pack-review-gate-plan.md
```

## Sources & References

- Origin document: `docs/2026-05-10/spec-first-full-code-review-and-competitor-benchmark.md`
- Related schema: `skills/spec-write-tasks/references/task-pack-schema.md`
- Task quality guide: `skills/spec-write-tasks/references/task-quality-guide.md`
- Task pack validator: `src/cli/task-pack.js`
- Work workflow: `skills/spec-work/SKILL.md`
- Beta work workflow: `skills/spec-work-beta/SKILL.md`
- Shipping workflow: `skills/spec-work/references/shipping-workflow.md`
- Code review workflow: `skills/spec-code-review/SKILL.md`
- Validator tests: `tests/unit/task-pack-command.test.js`
- Task compiler contract tests: `tests/unit/spec-write-tasks-contracts.test.js`
- Work contract tests: `tests/unit/spec-work-contracts.test.js`, `tests/unit/spec-work-beta-contracts.test.js`
- Code review boundary test reference, only if implementation proves a blocking gap: `tests/unit/spec-code-review-contracts.test.js`
