---
date: 2026-07-01
topic: spec-prd-execution-ux-protocol
spec_id: 2026-07-01-002-spec-prd-execution-ux-protocol
---

# Spec PRD Execution UX Protocol

## Summary

为 `$spec-prd` 增加一套用户可见的执行 UX 协议：进入时短播报，Phase 1+ 前列任务清单，推进中更新状态，写 PRD 前展示 Decision Card，收尾时报告 finalize/checker 摘要。该协议复用现有 `write_mode`、Decision Card、task-list-first、readiness/finalize 机制，不新增状态机、进度文件或 transcript artifact。

---

## Problem Frame

`spec-prd` 已经具备防止 direct-write-after-read、checkpoint-as-escape、ready 自称等机制：`skills/spec-prd/SKILL.md` 定义了 `reason-then-act`、`Task-list-first discipline`、Pre-Write Closure Gate、Decision Card 和 Phase 4 finalize/checker；`skills/spec-prd/references/prd-output-template.md` 定义了 PRD 写入字段；`skills/spec-prd/references/prd-readiness-lens.md` 和 `skills/spec-prd/scripts/finalize-prd-artifact.js` 定义了 ready receipt 出口。

当前缺口不是缺少底层 gate，而是执行过程对用户的可见性不够集中：agent 可以遵守内部规则，却没有稳定、简短、可期待的过程展示。用户希望参考“进入执行 -> 任务清单 -> 口径说明 -> 渐进状态 -> 收尾验证”的模式，但 `spec-prd` 必须避免把实现型流水线口吻照搬到需求澄清 workflow 中。

---

## Actors

- A1. PRD owner：提供产品/系统增量、回答 owner-owned WHAT 决策，并校正 agent 的错误推断。
- A2. `$spec-prd` orchestrator：执行 source-first 分析、Requirements Grill、PRD 写入和 readiness 判断。
- A3. Downstream planner：消费 PRD，不能被迫发明 WHAT、scope、acceptance 或 evidence authority。
- A4. Reviewer：审查 PRD 是否把 confirmed facts、owner decisions、assumptions、degraded facts 和 blockers 区分清楚。

---

## Key Flows

- F1. 进入与任务清单展示
  - **Trigger:** 用户调用 `$spec-prd` 或入口治理路由到 PRD authoring/refinement/validation。
  - **Actors:** A1, A2
  - **Steps:** A2 用一段短播报说明 intent、input posture、source/runtime 边界和本轮不会做的事；随后列出 Phase 1+ 的任务清单，并在推进时更新 in-progress/completed 状态。
  - **Outcome:** A1 能看到 workflow 正在澄清 WHAT，而不是直接进入实现或静默写 PRD。
  - **Covered by:** R1, R2, R3

- F2. 写前 Decision Card
  - **Trigger:** A2 准备产生或更新 durable PRD artifact。
  - **Actors:** A1, A2, A3
  - **Steps:** A2 先展示 `write_mode`、`highest_risk_gap`、`next_action`、`why planning will not invent WHAT`，再执行写入或继续 grill。
  - **Outcome:** durable write 的原因和 readiness posture 在副作用前可见。
  - **Covered by:** R4, R5, R6

- F3. 收尾与 handoff
  - **Trigger:** PRD artifact 写入或 checkpoint 保存后，A2 进入 Phase 4。
  - **Actors:** A2, A3, A4
  - **Steps:** A2 运行或报告 finalize/checker 结果，输出 finding count、blocking reason_codes、receipt status、readiness_outcome 和 remaining WHAT residue。
  - **Outcome:** A3/A4 能区分 machine facts 与 LLM-owned readiness judgment。
  - **Covered by:** R7, R8, R9

---

## Requirements

**User-visible execution framing**
- R1. `$spec-prd` 进入时必须用短播报说明本轮目标、input posture、是否预计写 `docs/brainstorms/*-requirements.md`，以及不会执行 implementation plan、code work 或 generated runtime mirror edit。
- R2. Phase 1+ 任何 durable action 前必须展示任务清单，覆盖 load-bearing OQ、source-read/evidence work、PRD sections、owner questions 和 finalize gaps；轻量 route-out/bypass 可压缩为一行。
- R3. 任务清单状态更新必须简短，只说明当前正在关闭哪个 WHAT gap 或验证哪个 source claim；不得输出长 transcript、过程噪声或伪造的 tool-output 样式。

**Evidence and language discipline**
- R4. 所有“口径已明确”“已确认”“ready”类表述必须绑定 source/owner/checker evidence；仅由 agent 推断得出的内容必须标记为 `assumption`、`source-candidate`、`degraded` 或 open question。
- R5. UX 播报必须沿用 `spec-prd` 证据边界：`confirmed-source`、`user-stated`、`source-candidate`、`external-research`、`assumption` 不得混用。
- R6. 如果 blocking question tool 不可用但 chat 可以等待用户，播报必须声明 `chat-fallback`，并继续一次一个 owner question；不得把工具不可用误报为 true headless。

**Pre-write and readiness UX**
- R7. durable PRD write 前必须展示 compact Decision Card，至少包含 `write_mode`、`highest_risk_gap`、`next_action`、`why planning will not invent WHAT`。
- R8. `write_mode=checkpoint-prd` 的 UX 必须明确这是 non-ready recovery checkpoint，并显示 `can_enter_spec_plan: no` 与下一步 owner/source 问题；不得推荐 planning。
- R9. Phase 4 closeout 必须报告 finalize/checker 摘要：finding count、blocking reason_codes、receipt status、readiness_outcome、是否还有 planning-would-invent-WHAT residue。

**Boundary preservation**
- R10. 该 UX 协议必须复用现有 `Task-list-first discipline`、Decision Card、`write_mode`、`readiness_outcome`、finalize/checker 机制；不得新增 progress file、phase-status enum、transcript artifact 或第二套 PRD topology。
- R11. UX 文案必须区分 script-owned facts 与 LLM-owned judgment：checker/finalize 只提供 deterministic facts，是否语义 ready 仍由 readiness lens 判断。
- R12. 该协议应写入 `spec-prd` source guidance 和必要的 contract/eval tests；不得通过手改 `.claude/`、`.codex/` 或 `.agents/skills/` runtime mirror 来交付。

---

## Acceptance Examples

- AE1. **Covers R1, R2, R3.** Given 用户调用 `$spec-prd` 并提供 rough PRD，当 workflow 开始 Phase 1，then agent 先用 2-4 行说明目标和边界，再列出任务清单，并在读取 source 或准备 owner question 时更新对应任务状态。
- AE2. **Covers R4, R5.** Given agent 通过 source read 只找到候选路径而未直接确认当前行为，当它向用户播报发现，then 使用 `source-candidate` 或“待确认线索”，不得说“已确认当前实现”。
- AE3. **Covers R6.** Given Codex 当前没有可用 `request_user_input` 工具但聊天仍可等待用户，当出现 owner-owned WHAT gap，then agent 声明 `question_delivery=chat-fallback` 并在 chat 中只问一个问题。
- AE4. **Covers R7, R8.** Given PRD 仍有未关闭 owner-owned gap，当 agent 需要保存中间结果，then 写前 Decision Card 使用 `write_mode=checkpoint-prd`，说明不能进入 planning，并列出下一步 owner/source 问题。
- AE5. **Covers R9, R11.** Given PRD artifact 已写入并进入 Phase 4，当 agent closeout，then 输出 checker/finalize 的 finding count、blocking reason_codes 和 receipt status，同时单独说明 LLM-owned readiness_outcome。
- AE6. **Covers R10, R12.** Given 后续实现该协议，当 source 改动完成，then 变更只触碰 `skills/spec-prd/**`、相关 tests/docs/CHANGELOG 或生成逻辑；runtime mirrors 只通过 `spec-first init` 刷新，不手改。

---

## Success Criteria

- 用户能从 `$spec-prd` 过程消息判断当前处于输入分析、grill、写前决策、写入、finalize 还是 handoff，而不需要阅读完整 skill source。
- `spec-plan` 接收 PRD 前，过程消息和 artifact 都能显示 planning 是否仍会发明 WHAT。
- 过程播报减少 direct-write-after-read 和 checkpoint-as-escape 风险，但不把 UX 进度展示升级为硬状态机。
- Contract/eval 测试能锁住关键锚点：短播报、任务清单、Decision Card、evidence wording、checkpoint non-ready、finalize/checker closeout。

---

## Scope Boundaries

- 不新增 public workflow entrypoint；仍然是 `$spec-prd` 的执行 UX。
- 不新增 progress ledger、run artifact、transcript schema、phase enum 或 central state machine。
- 不改变 PRD artifact 默认路径：仍为 `docs/brainstorms/*-requirements.md` 和 `artifact_kind: prd-requirements`。
- 不让 checker/finalize 判断语义充分性；脚本只提供 deterministic facts。
- 不手改 generated runtime mirrors；如需要 runtime refresh，后续通过 `spec-first init`。
- 不把实现型 “Ran command” 展示格式伪装到 PRD workflow；只能报告真实执行过的工具、source read 或 checker/finalize 结果。

---

## Key Decisions

- 采用“UX protocol over existing mechanisms”方向，而不是新增状态机。
- 过程消息以短播报为主，服务用户校正和 evidence visibility，不成为持久 artifact。
- “口径明确”只有在 source/owner/checker evidence 足够时才能写成 confirmed；否则必须降级为 assumption、candidate、degraded 或 outstanding question。
- `checkpoint-prd` 的用户体验必须显式 non-ready，避免保存中间上下文被误读为 planning handoff。

---

## Dependencies / Assumptions

- Source refs consumed: `skills/spec-prd/SKILL.md`, `skills/spec-prd/references/prd-output-template.md`, `skills/spec-prd/references/prd-readiness-lens.md`, `skills/spec-prd/scripts/finalize-prd-artifact.js`, `skills/spec-prd/scripts/check-prd-artifact.js`, `docs/05-用户手册/22-PRD需求文档质量增强流程.md`.
- Assumption: 该 UX 协议应优先通过 prose anchors 和 focused contract/eval tests 交付；是否需要额外脚本检查由后续 plan 判断。

---

## Outstanding Questions

### Resolve Before Planning

- None.

### Deferred to Planning

- [Affects R12][Technical] 具体 test 落点由 plan 决定：扩展 `tests/unit/spec-prd-contracts.test.js`、eval fixtures，还是补充文档 contract test。
- [Affects R1-R3][Technical] 具体 source 编辑落点由 plan 决定：集中写入 `SKILL.md` 执行流，还是拆到现有 reference 以降低 hot-path load。
