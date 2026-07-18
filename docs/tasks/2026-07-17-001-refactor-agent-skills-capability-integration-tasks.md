---
title: "Agent Skills Capability Integration - Task Pack"
type: "task-pack"
status: "derived"
date: "2026-07-18"
source_plan: "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md"
source_plan_hash: "sha256:fbc0b15127a3ac850213f75a6313e5049cde473397826aaa7ab88b88b487ce2b"
generated_by: "spec-write-tasks"
mode: "derived"
source_sections:
  - "Goal Capsule"
  - "Product Contract"
  - "Requirements"
  - "Scope Boundaries"
  - "Planning Contract"
  - "Implementation Units"
  - "Verification Contract"
  - "Definition of Done"
---

# Task Pack: Agent Skills Capability Integration

> **Historical browser task note (2026-07-18):** T014 中 interactive server 启动、不追踪 PID 与 caller 自行关闭的分支已被 `docs/plans/2026-07-18-002-refactor-spec-test-browser-caller-owned-server-boundary-plan.md` 替代。本 task pack 仍记录 07-16 已完成工作的历史拆分，但不得用于执行新的 caller-owned server boundary；该 follow-up 必须直接消费 07-18-002 的 R/U/Verification/DoD。

## Overview

本任务包把 12 个 source implementation units 编译为 18 个可执行任务和 10 个 execution waves。计划跨越 planning、work、review、browser runtime delivery 与 document review，且包含共享 workflow prose、source/runtime 边界和 browser 安全面，因此派生任务包能显著降低单次执行的上下文与回滚风险。

本任务包采用 plan 第二轮简化后的最终决策：U1 只做 `git status` 与 live README/source 核对；行为 case 留在 owning skill；U6/U10 通过 plan path + section title 直接读取 live plan，不做同会话 hash 传递；U8 不建独立 test-plan schema、不追踪 server PID；U13 先由唯一 helper 持有完整文件字节 SHA-256，再由 `spec-doc-review` 提供 report-only JSON，并由 `spec-work` shipping workflow 持有前后 hash、envelope 解析与 P0/P1 处置。

高风险任务使用 `review_gate: required` 表示 review intent，不表示审批状态。现有 `spec-work` shipping tail 仍持有 final review、全量验证、五宿主 lifecycle、build 和 plan lifecycle mutation；这些步骤不被复制为新的 implementation unit。

## Source Summary

- **Source plan:** `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md`
- **Branch:** `compile`，因为 plan 为 `active + implementation-ready + deep`，包含 12 个有依赖的 unit、多个共享 source surface、五宿主 projection 和安全边界。
- **Consumed sections:** Goal Capsule、Product Contract、Requirements、Scope Boundaries、Planning Contract、Implementation Units、Verification Contract、Definition of Done、Evidence & Limitations。
- **Scope boundaries:** 不新增 public Skill，不 vendoring 外部 Agent Skills，不新增 reviewer schema/runtime generator，不手改 generated runtime mirror，不实现 browser sandbox/attestation/credential proxy，不推进三个 deferred public Skill 候选。
- **Implementation-time unknowns:** 新 reference 的最终段落与篇幅；fresh-source evaluator 的可用宿主与授权；U1 发现的 current owner/source drift；`agent-browser` 实施时 capability probe 结果。
- **Compilation precedence:** 已随 plan 修订同步；不再存在需要仲裁的摘要残留。

## Traceability Matrix

| Source | Requirement / Acceptance | Task(s) | Validation |
| --- | --- | --- | --- |
| U1 | R1-R3, R17-R18 | T001, T017 | dirty/write-set 人工处置；24 项映射与 14/10 计数核对；Changelog 格式 |
| U2 | R4, R7, R13-R14, R18; AE3 | T002 | planning capability contract + positive/negative eval cases |
| U3 | R4-R5, R13-R14, R18; AE1 | T003 | interface lens trigger/landing/parser limitation contract |
| U4 | R4, R6, R13-R14, R18; AE2 | T004 | frontend planning trigger/negative boundary contract |
| U5 | R4, R8, R13-R14, R18; AE4 | T005 | work feedback/test-design contract tests；docs 与 config/type no-test negative-owner cases |
| U6 | R4-R5, R9, R11, R13-R14, R18; AE5 | T006, T007 | live-plan task context degradation + API reviewer cases |
| U10 | R4-R5, R9, R11, R13-R14, R18 | T008 | security owner/reachability/trust-boundary cases |
| U11 | R4, R8-R9, R11, R13-R14, R18 | T009 | testing owner/DAMP/state/test-double cases |
| U12 | R4, R7, R9, R11, R13-R14, R18 | T010 | reliability correlation/telemetry/actionability cases |
| U7 | R4, R6, R10-R11, R13-R14, R18; AE6 | T011 | semantic activation and ownership-dedup cases |
| U8 | R4, R6, R12-R15, R18; AE7 | T012-T015 | five-host internal delivery, wrapper, no-auto-start, LFG caller |
| U13 | R4, R13-R14, R18-R19; AE8 | T016, T018 | full-byte helper/path safety + report-only flag/policy/JSON/default parity + before/after hash behavior |
| Cross-unit | R2, R17 | T001, T012, T017 | public/source Skill zero increment; serial Changelog closeout |
| Deferred | R16 | no task | `spec-security-audit`、`spec-migration`、`spec-observability` 保持 Defer |

## Task Graph

```text
T001 -> {T002, T003, T004, T005, T012, T013, T016}
T002 -> T010
T003 -> T006 -> T007 -> T008
T005 -> T009
{T004, T008, T009, T010} -> T011
{T012, T013} -> T014 -> T015
T016 -> T018
{T002..T016, T018 source tasks} -> T017
```

`T002 -> T003 -> T004` 的波次串行来自共享 `spec-plan` source/eval/test surface，而不是新的产品依赖。`T006 -> T007 -> T008` 先建立 live-plan task context，再扩展 API/security owner。`T009`、`T010` 与 `T011` 因共享 code-review contract test/catalog surface 串行。`T012` 与 `T013` 可并行，随后由 `T014` 接入 workflow/pipeline，`T015` 最后接入 LFG caller。`T016 -> T018` 先关闭完整文件 hash 的确定性地板，再接入 document-review 与 shipping caller。

## Execution Waves

| Wave | Tasks | Constraint |
| --- | --- | --- |
| 1 | T001 | 首次 source mutation 前完成 current baseline 与 dirty overlap 处置 |
| 2 | T002, T005, T012, T013 | 文件集互不重叠，可并行形成四个纵向起点 |
| 3 | T003, T014, T016 | T003 串行复用 spec-plan surface；T014 依赖 browser delivery + wrapper；T016 只持有独立 full-file hash helper/test surface |
| 4 | T004, T006, T015, T018 | 文件集互不重叠；T006 依赖 interface lens，T015 依赖 browser workflow contract，T018 依赖 full-file hash helper |
| 5 | T007 | API reviewer 消费 T006 task context |
| 6 | T008 | Security reviewer 复用 T006/T007 owner split |
| 7 | T009 | Testing reviewer 扩展，共享 code-review test surface |
| 8 | T010 | Reliability reviewer 扩展，共享 catalog/test surface |
| 9 | T011 | Frontend-quality 在四个相邻 owner 收敛后接入 |
| 10 | T017 | 所有 source-bearing task 验证后串行更新 Changelog |

## Task Pack Contract

```json
{
  "schema_version": "task-pack/v1",
  "execution_waves": [
    { "wave": 1, "tasks": ["T001"] },
    { "wave": 2, "tasks": ["T002", "T005", "T012", "T013"] },
    { "wave": 3, "tasks": ["T003", "T014", "T016"] },
    { "wave": 4, "tasks": ["T004", "T006", "T015", "T018"] },
    { "wave": 5, "tasks": ["T007"] },
    { "wave": 6, "tasks": ["T008"] },
    { "wave": 7, "tasks": ["T009"] },
    { "wave": 8, "tasks": ["T010"] },
    { "wave": 9, "tasks": ["T011"] },
    { "wave": 10, "tasks": ["T017"] }
  ],
  "tasks": [
    {
      "task_id": "T001",
      "source_unit": "U1",
      "requirement_refs": ["R1", "R2", "R3", "R17", "R18"],
      "goal": "在首次 source mutation 前核对当前 dirty/write-set 交集、24 项能力映射和既有 owner/source 基线，并确认后续任务只消费 live source。",
      "dependencies": [],
      "files": ["docs/14-agent-skills/README.md"],
      "context_refs": [
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U1-确认实施基线并核对当前工作树状态",
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#Simplification-rationale-round-2本次修订2026-07-17",
        "src/cli/task-pack.js",
        "src/cli/commands/tasks.js"
      ],
      "entry_hint": "先读取 git status 和 README 当前 24 项矩阵，再逐文件对照本任务包 T002-T016、T018 的写集。",
      "test_focus": "dirty overlap 处置、24 项/14-10 计数、2 个新增 planning reference + 1 个扩展 planning lens + 1 个扩展 spec-work reference + 4 个 reviewer + 1 个 persona 决策与当前 live source 一致。",
      "done_signal": "U1 closeout 记录当前 git status 分类；README 映射与计划一致或已更新；未创建 evidence manifest、中央 case-index 或 collision-guard 子系统。",
      "parallelizable": false,
      "risk_note": "当前工作树已有并行用户改动；任何重叠文件必须保留现有内容并按文件协调。",
      "review_gate": "optional",
      "review_focus": "确认 U1 采用第二轮简化后的直接核对（git status + README 核对），不恢复已拒绝的 evidence manifest 或中央 case-index。",
      "stop_if": "发现任一重叠文件的 owner 或预期基线无法从当前用户改动与 live source 判定。",
      "wave": 1
    },
    {
      "task_id": "T002",
      "source_unit": "U2",
      "requirement_refs": ["R4", "R7", "R13", "R14", "R18", "AE3"],
      "goal": "扩展现有 high-risk planning lens 的 production-readiness 决策集，同时保持轻量变更负例和唯一 owner。",
      "dependencies": ["T001"],
      "files": [
        "skills/spec-plan/references/high-risk-plan-lens.md",
        "skills/spec-plan/evals/examples.json",
        "skills/spec-plan/evals/output-quality-cases.json",
        "tests/unit/spec-plan-quality-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U2-扩展-high-risk-lens-的-production-readiness-能力",
        "skills/spec-code-review/references/personas/reliability-reviewer.md"
      ],
      "entry_hint": "从 high-risk lens 当前 Trigger Matrix 与 rollout/rollback/signal/runbook 语义开始。",
      "test_focus": "on-call questions、CI/build/deploy fidelity、correlation/cardinality/privacy、flag lifecycle、telemetry proof，以及 docs-only 负例。",
      "done_signal": "聚焦 spec-plan quality tests 通过；至少 2 个 positive 与 2 个 negative-owner case 由 spec-plan evals 持有；fresh-source 状态按 passed/concerns/not_run 记录。",
      "parallelizable": true,
      "risk_note": "不得把 production readiness 拆成新的并列 lens，或让轻量 docs/config 进入完整 ceremony。",
      "review_gate": "required",
      "review_focus": "检查 trigger 宽度、stand-in fidelity、alert actionability 与唯一 owner。",
      "stop_if": "实现需要新增 public Skill、并列 production-readiness truth source 或脚本化语义充分性判断。",
      "wave": 2
    },
    {
      "task_id": "T003",
      "source_unit": "U3",
      "requirement_refs": ["R4", "R5", "R13", "R14", "R18", "AE1"],
      "goal": "新增 interface-and-evolution planning lens，并通过 spec-plan 条件指针连接 greenfield/evolution 双分支和 Interface Contracts landing。",
      "dependencies": ["T001"],
      "files": [
        "skills/spec-plan/references/interface-and-evolution-lens.md",
        "skills/spec-plan/SKILL.md",
        "skills/spec-plan/evals/examples.json",
        "skills/spec-plan/evals/output-quality-cases.json",
        "tests/unit/spec-plan-quality-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U3-新增-interface-design-and-evolution-planning-lens",
        "skills/spec-plan/references/planning-evidence-boundaries.md",
        "skills/spec-code-review/references/personas/api-contract-reviewer.md"
      ],
      "entry_hint": "先冻结共享 contract core 与两个分支的 trigger/negative boundary，再给 SKILL.md 增加单跳条件指针。",
      "test_focus": "greenfield/evolution 分支、private helper 负例、Interface Contracts landing、repo-native parser/test 或 parser_unavailable limitation。",
      "done_signal": "新 reference 可由主入口条件到达；聚焦 spec-plan quality tests 通过；2 positive/2 negative-owner cases 存在；fresh-source 状态有来源与限制。",
      "parallelizable": false,
      "risk_note": "REST/TypeScript 模板不得提升为全局规则；API reviewer 不得反向成为设计 owner。",
      "review_gate": "required",
      "review_focus": "检查 shared core、greenfield/evolution 差异、canonical artifact 与 parser 边界。",
      "stop_if": "需要新增跨格式 parser 基础设施、public API-design Skill，或无法为 Interface Contracts 指定 canonical owner。",
      "wave": 3
    },
    {
      "task_id": "T004",
      "source_unit": "U4",
      "requirement_refs": ["R4", "R6", "R13", "R14", "R18", "AE2"],
      "goal": "新增 frontend-engineering planning lens，并把组件/状态/a11y/responsive 决策与 polish/browser/race/review owner 分离。",
      "dependencies": ["T001"],
      "files": [
        "skills/spec-plan/references/frontend-engineering-lens.md",
        "skills/spec-plan/SKILL.md",
        "skills/spec-plan/evals/examples.json",
        "skills/spec-plan/evals/output-quality-cases.json",
        "tests/unit/spec-plan-quality-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U4-新增-frontend-engineering-planning-lens",
        "skills/spec-code-review/references/personas/julik-frontend-races-reviewer.md"
      ],
      "entry_hint": "从用户可见行为 trigger 和 backend/type/fixture/token-value negative boundary 开始。",
      "test_focus": "异步状态矩阵、keyboard/focus/semantic/contrast、responsive、runtime verification landing 与 backend-only/token-only 负例。",
      "done_signal": "新 lens 由 spec-plan 条件加载；聚焦 tests 通过；2 positive/2 negative-owner cases 存在；纯 CSS contrast/focus/breakpoint 回归命中；fresh-source 状态按 passed/concerns/not_run 记录，not_run 带 reason，concerns 已解决或有 maintainer acceptance。",
      "parallelizable": false,
      "risk_note": "不得抢占 spec-polish、spec-test-browser、spec-dogfood 或 frontend-races 的执行/评审职责。",
      "review_gate": "required",
      "review_focus": "检查 trigger 是否按行为语义而非文件扩展名，以及 owner 边界是否无重叠。",
      "stop_if": "实现需要新增 spec-frontend public Skill，或无法区分 planning、runtime verification、polish 与 diff review。",
      "wave": 4
    },
    {
      "task_id": "T005",
      "source_unit": "U5",
      "requirement_refs": ["R4", "R8", "R13", "R14", "R18", "AE4"],
      "goal": "扩展现有 feedback-and-tests owner，加入 contract/risk-first、rollback-friendly slicing、DAMP、state-over-interaction 与 test-double hierarchy。",
      "dependencies": ["T001"],
      "files": [
        "skills/spec-work/references/feedback-and-tests.md",
        "skills/spec-work/evals/examples.json",
        "tests/unit/spec-work-implementation-quality-contracts.test.js",
        "tests/unit/spec-work-contracts.test.js",
        "tests/unit/spec-work-intake-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U5-扩展现有-spec-work-feedbacktest-design-owner",
        "skills/spec-code-review/references/personas/testing-reviewer.md"
      ],
      "entry_hint": "保护现有 smallest-loop、vertical-slice、proof/characterization 语义后再补选择规则。",
      "test_focus": "vertical/contract-first/risk-first 选择、DAMP、state outcome、double hierarchy、docs 与 config/type no-test exception，以及无 RED 不声称 TDD。",
      "done_signal": "三个聚焦 suite 通过；2 positive/2 negative-owner cases 存在；feedback-and-tests.md 保持唯一 owner；fresh-source 状态有据可查。",
      "parallelizable": true,
      "risk_note": "不得新建第二个 test-design reference/eval owner，也不得从最终绿测伪造 TDD 历史。",
      "review_gate": "required",
      "review_focus": "检查执行期证据权威、测试可观察性与 no-test exception。",
      "stop_if": "需要改变现有 proof/characterization 合同，或把测试质量语义判断移入脚本。",
      "wave": 2
    },
    {
      "task_id": "T006",
      "source_unit": "U6",
      "requirement_refs": ["R4", "R5", "R9", "R11", "R13", "R14", "R18"],
      "goal": "建立 task-scoped live-plan context：producer 只标注 plan 路径与相关章节标题，reviewer 直接读取当前文件，失败时降级为 diff-only。",
      "dependencies": ["T003"],
      "files": [
        "skills/spec-code-review/SKILL.md",
        "skills/spec-code-review/references/subagent-template.md",
        "skills/spec-work/references/work-intake-and-task-pack.md",
        "tests/unit/spec-code-review-contracts.test.js",
        "tests/unit/spec-work-intake-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U6-扩展-api-contract-drift-reviewer",
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#Simplification-rationale-round-2本次修订2026-07-17"
      ],
      "entry_hint": "从当前 task-pack intake 与 reviewer context 模板定位最小 plan path/section-title 传递点。",
      "test_focus": "validated task 的 path/section 标注、live read、path missing/unreadable 的 diff-only limitation，以及 dispatch 缺失 inline fallback。",
      "done_signal": "spec-work intake 与 code-review contract tests 通过；上下文不传 plan 正文/hash；缺 plan 或不可读时不冒充 plan-aware coverage。",
      "parallelizable": true,
      "risk_note": "本任务按 KTD8、U6 详细 Approach 与 round-2 rationale 明确不实现同会话 hash-check，只做 plan path + section title 标注。",
      "review_gate": "required",
      "review_focus": "确认 live-plan read 不引入 byte-range、hash transport、保密边界或第二套 context schema。",
      "stop_if": "需要新增 task-plan hash 传递、anchor parser、完整 plan disclosure gate，或无法保持 plan 不可读时的 diff-only 降级。",
      "wave": 4
    },
    {
      "task_id": "T007",
      "source_unit": "U6",
      "requirement_refs": ["R4", "R5", "R9", "R11", "R13", "R14", "R18", "AE5"],
      "goal": "扩展 API contract reviewer 的 canonical artifact drift、consumer trace、additive evolution、replacement/deprecation 与 zero-use removal 判断。",
      "dependencies": ["T006"],
      "files": [
        "skills/spec-code-review/references/personas/api-contract-reviewer.md",
        "skills/spec-code-review/evals/api-contract-capability-cases.json",
        "tests/unit/spec-code-review-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U6-扩展-api-contract-drift-reviewer",
        "skills/spec-plan/references/interface-and-evolution-lens.md"
      ],
      "entry_hint": "从现有 API reviewer 的 consumer contract、confidence gate 与 suppression boundary 开始。",
      "test_focus": "字段删除/契约未同步、无 replacement/zero-use 的 removal、additive optional field 负例、private refactor suppression。",
      "done_signal": "code-review contract tests 通过；API eval 文件含至少 2 positive/2 negative-owner cases；findings schema 与 reviewer 数量不变；U6 fresh-source 状态按 passed/concerns/not_run 记录，not_run 带 reason，concerns 已解决或有 maintainer acceptance。",
      "parallelizable": false,
      "risk_note": "API reviewer 只检查实现漂移，不承担接口设计或 security authorization finding。",
      "review_gate": "required",
      "review_focus": "检查 canonical artifact 证据、兼容性分类、consumer migration 与 suppression。",
      "stop_if": "需要新增 reviewer、第二套 findings schema，或把接口设计决策从 spec-plan 移到 code review。",
      "wave": 5
    },
    {
      "task_id": "T008",
      "source_unit": "U10",
      "requirement_refs": ["R4", "R5", "R9", "R11", "R13", "R14", "R18"],
      "goal": "扩展 security reviewer 的 Agent-native trust boundary、tenant/resource authorization、危险 sink 与 dependency reachability 判断。",
      "dependencies": ["T006", "T007"],
      "files": [
        "skills/spec-code-review/SKILL.md",
        "skills/spec-code-review/references/personas/security-reviewer.md",
        "skills/spec-code-review/references/persona-catalog.md",
        "skills/spec-code-review/evals/security-capability-cases.json",
        "tests/unit/spec-code-review-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U10-扩展-security-reviewer",
        "skills/spec-code-review/references/personas/api-contract-reviewer.md"
      ],
      "entry_hint": "先冻结 API/security owner 分工，再补 trust boundary 与 reachability cases。",
      "test_focus": "untrusted model/tool output 到 shell/path/SQL sink、tenant authorization、unreachable advisory suppression、schema-only drift 交给 API owner。",
      "done_signal": "code-review contract tests 通过；security eval 至少 2 positive/2 negative-owner cases；attack-path/confidence gate 保持；fresh-source 状态按 passed/concerns/not_run 记录，not_run 带 reason，concerns 已解决或有 maintainer acceptance。",
      "parallelizable": false,
      "risk_note": "泛化 hardening 或不可达 dependency advisory 不得升级为 finding。",
      "review_gate": "required",
      "review_focus": "检查可利用路径、tenant/resource 边界、API/security 去重与 reachability suppression。",
      "stop_if": "需要新的 security workflow/public Skill，或必须改变现有 finding confidence/schema。",
      "wave": 6
    },
    {
      "task_id": "T009",
      "source_unit": "U11",
      "requirement_refs": ["R4", "R8", "R9", "R11", "R13", "R14", "R18"],
      "goal": "扩展 testing reviewer 的 DAMP、state-over-interaction 与 test-double hierarchy，同时禁止从 diff 反推 TDD 历史。",
      "dependencies": ["T005"],
      "files": [
        "skills/spec-code-review/references/personas/testing-reviewer.md",
        "skills/spec-code-review/evals/testing-capability-cases.json",
        "tests/unit/spec-code-review-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U11-扩展-testing-reviewer",
        "skills/spec-work/references/feedback-and-tests.md"
      ],
      "entry_hint": "区分执行期 RED/characterization evidence 与 reviewer 的 diff-visible proof sufficiency。",
      "test_focus": "mock call-count false confidence、interaction-is-contract 例外、无 execution evidence 不推断未做 TDD。",
      "done_signal": "code-review contract tests 通过；testing eval 至少 2 positive/2 negative-owner cases；执行历史权威边界明确；fresh-source 状态按 passed/concerns/not_run 记录，not_run 带 reason，concerns 已解决或有 maintainer acceptance。",
      "parallelizable": false,
      "risk_note": "reviewer 不得要求所有测试都 state-based，也不得把运行历史当作 diff 事实。",
      "review_gate": "required",
      "review_focus": "检查 proof sufficiency、interaction exception 与 execution evidence 权威。",
      "stop_if": "需要 reviewer 读取不存在的 run evidence，或改变 spec-work 对 RED/characterization 的 ownership。",
      "wave": 7
    },
    {
      "task_id": "T010",
      "source_unit": "U12",
      "requirement_refs": ["R4", "R7", "R9", "R11", "R13", "R14", "R18"],
      "goal": "扩展 reliability reviewer 的 correlation propagation、silent failure、telemetry proof 与 alert actionability。",
      "dependencies": ["T002"],
      "files": [
        "skills/spec-code-review/references/personas/reliability-reviewer.md",
        "skills/spec-code-review/references/persona-catalog.md",
        "skills/spec-code-review/evals/reliability-capability-cases.json",
        "tests/unit/spec-code-review-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U12-扩展-reliability-reviewer",
        "skills/spec-plan/references/high-risk-plan-lens.md"
      ],
      "entry_hint": "从当前 I/O、timeout 与 stand-in fidelity 边界扩展到 diff-visible instrumentation/failure path。",
      "test_focus": "跨服务 correlation 缺失、silent failure、telemetry emission/query proof、alert owner/action/runbook，以及 pure in-memory suppression。",
      "done_signal": "code-review contract tests 通过；reliability eval 至少 2 positive/2 negative-owner cases；runtime/field evidence 不被 diff review 越级声称；fresh-source 状态按 passed/concerns/not_run 记录，not_run 带 reason，concerns 已解决或有 maintainer acceptance。",
      "parallelizable": false,
      "risk_note": "dashboard/告警真实效果属于 runtime/field evidence，不由 persona prose 或单测证明。",
      "review_gate": "required",
      "review_focus": "检查 failure path、correlation、telemetry claim ceiling 与 pure-transform suppression。",
      "stop_if": "需要新增 observability public Skill，或让 reviewer 声称未观察到的 field outcome。",
      "wave": 8
    },
    {
      "task_id": "T011",
      "source_unit": "U7",
      "requirement_refs": ["R4", "R6", "R10", "R11", "R13", "R14", "R18", "AE6"],
      "goal": "新增 internal frontend-quality reviewer，并建立基于 diff 语义的 activation、a11y/state/responsive owner 与相邻 reviewer 去重边界。",
      "dependencies": ["T004", "T008", "T009", "T010"],
      "files": [
        "skills/spec-code-review/references/personas/frontend-quality-reviewer.md",
        "skills/spec-code-review/references/persona-catalog.md",
        "skills/spec-code-review/SKILL.md",
        "skills/spec-code-review/evals/frontend-quality-capability-cases.json",
        "tests/unit/spec-code-review-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U7-新增-frontend-quality-internal-conditional-reviewer",
        "skills/spec-code-review/references/personas/julik-frontend-races-reviewer.md"
      ],
      "entry_hint": "先在 persona catalog 固定 frontend-quality/races/testing/security/maintainability owner matrix，再写 activation cases。",
      "test_focus": "用户可见异步表单、a11y/focus/contrast/responsive positive；backend/docs/type/token-only negative；CSS contrast/breakpoint edge。",
      "done_signal": "code-review contract tests 通过；frontend eval 至少 2 positive/2 negative-owner cases；新 persona 保持 internal，重复 finding 有主 owner；fresh-source 状态按 passed/concerns/not_run 记录，not_run 带 reason，concerns 已解决或有 maintainer acceptance。",
      "parallelizable": false,
      "risk_note": "文件扩展名不是充分 trigger；unsafe rendering、timing、testing sufficiency 与 maintainability 仍由相邻 owner 持有。",
      "review_gate": "required",
      "review_focus": "检查 semantic activation、CSS-only edge、owner matrix 与 dedup。",
      "stop_if": "需要新增 public frontend review workflow，或无法区分 frontend-quality 与现有相邻 reviewer。",
      "wave": 9
    },
    {
      "task_id": "T012",
      "source_unit": "U8",
      "requirement_refs": ["R2", "R4", "R12", "R15", "R18"],
      "goal": "把 internal-only spec-test-browser 加入现有五宿主 delivery policy，并同步 lifecycle/doctor consumer expectations，验证 runtime-required source 被递归投射且 evals 被排除。",
      "dependencies": ["T001"],
      "files": [
        "src/cli/plugin-governance.js",
        "tests/unit/plugin-modules.test.js",
        "tests/unit/doctor-runtime-assets.test.js",
        "tests/integration/init-five-host-lifecycle.integration.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U8-修复-browser-internal-delivery并完成-capability安全与-degraded-contract",
        "src/cli/contracts/dual-host-governance/skills-governance.json",
        "src/cli/plugin-sync.js"
      ],
      "entry_hint": "从 DELIVERED_INTERNAL_SKILLS 与 buildFilteredAssetSet 的 internal_only 分支开始。",
      "test_focus": "Claude/Codex/Cursor/Kiro/Qoder 都投射 spec-test-browser package；lifecycle/doctor expectations 接受新增 internal runtime skill；evals 缺席；public catalog/source Skill count不增加。",
      "done_signal": "plugin-modules、doctor-runtime-assets 与 five-host lifecycle focused tests 通过；五宿主 filtered asset plan 包含 spec-test-browser internal skill 且 public roster 无新增。",
      "parallelizable": true,
      "risk_note": "只扩展 delivery policy，不能手改 runtime mirrors 或另建 generator。",
      "review_gate": "required",
      "review_focus": "检查五宿主投射、internal_only/public boundary 与 eval exclusion。",
      "stop_if": "修复需要修改 generated runtime、改变 public catalog 语义或新增第二套 projection generator。",
      "wave": 2
    },
    {
      "task_id": "T013",
      "source_unit": "U8",
      "requirement_refs": ["R4", "R6", "R12", "R13", "R14", "R18"],
      "goal": "实现唯一 agent-browser run-context wrapper 的 probe/prepare/run/cleanup、内联 test-plan shape、hash 校验、私有目录与 default-deny action policy。",
      "dependencies": ["T001"],
      "files": [
        "skills/spec-test-browser/scripts/agent-browser-run-context.cjs",
        "skills/spec-test-browser/evals/capability-cases.json",
        "tests/unit/spec-test-browser-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U8-修复-browser-internal-delivery并完成-capability安全与-degraded-contract",
        "skills/spec-test-browser/SKILL.md"
      ],
      "entry_hint": "先写 capability missing、hash mismatch、private-dir failure 和 forbidden action 的失败测试。",
      "test_focus": "required flag probe、无 exact-origin 时 navigation/interaction subprocess 零调用、test-plan before-action hash、route/step/value shape、synthetic input、owner/0700/0600 或 icacls、raw output/screenshot private-only。",
      "done_signal": "spec-test-browser focused tests 通过；2 positive/2 negative-owner cases 存在；exact-origin capability 未确认时在任何 open/click/fill/type/press/select subprocess 前返回 not_supported 且动作进程调用次数为 0；其他失败路径返回明确 not_supported/not_run reason code 且不写 raw content。",
      "parallelizable": true,
      "risk_note": "当前 exact-origin/sandbox 能力不足；wrapper 不能以 allowlist 或私有目录冒充强隔离。",
      "review_gate": "required",
      "review_focus": "检查 argv/action allowlist、页面内容非指令边界、私有写入先后顺序与诚实降级。",
      "stop_if": "实现需要独立 versioned test-plan schema、profile/state 登录回退、任意 caller literal/credential，或声称当前宿主具备未验证 sandbox/exact-origin。",
      "wave": 2
    },
    {
      "task_id": "T014",
      "source_unit": "U8",
      "requirement_refs": ["R4", "R6", "R12", "R13", "R14", "R18", "AE7"],
      "goal": "把 wrapper 与 browser workflow/pipeline 接通，移除 pipeline 自动启动待审分支 server 的路径，并固定 interactive server 授权不解锁 browser 请求。",
      "dependencies": ["T012", "T013"],
      "files": [
        "skills/spec-test-browser/SKILL.md",
        "skills/spec-test-browser/references/pipeline-orchestration.md",
        "tests/unit/spec-test-browser-contracts.test.js",
        "tests/unit/pipeline-mode-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U8-修复-browser-internal-delivery并完成-capability安全与-degraded-contract",
        "skills/spec-test-browser/scripts/agent-browser-run-context.cjs"
      ],
      "entry_hint": "先冻结 pipeline no-auto-start 与所有模式无 exact-origin 时 navigation/interaction not_supported 的合同。",
      "test_focus": "pipeline server/build command 一律不自动执行；无 exact-origin 时 workflow 不触发 navigation/interaction；interactive 展示完整 command/cwd/env 后可启动 server；不追踪 PID、不代清理、不解锁 browser action。",
      "done_signal": "browser + pipeline focused tests 通过；旧后台 dev-server happy path 被测试阻断；无 exact-origin 时 workflow 与 wrapper 均保持零 navigation/interaction subprocess；workflow 只消费唯一 wrapper。",
      "parallelizable": false,
      "risk_note": "本任务按 KTD18、U8 Approach 与 round-2 rationale 明确不追踪或清理 server PID，关闭进程是用户自己的职责。",
      "review_gate": "required",
      "review_focus": "检查 pipeline mutation gate、interactive 授权范围与 not_supported/not_run claim ceiling。",
      "stop_if": "需要静默启动 server、以启动授权解锁 browser 请求、追踪/清理 PID，或引入不存在的 attestation/sandbox primitive。",
      "wave": 3
    },
    {
      "task_id": "T015",
      "source_unit": "U8",
      "requirement_refs": ["R4", "R6", "R12", "R15", "R18"],
      "goal": "让 spec-lfg step 7 解析 caller-owned target-origin，判定 browser applicability，并在缺 origin/capability 时返回可诊断 blocker。",
      "dependencies": ["T014"],
      "files": [
        "skills/spec-lfg/SKILL.md",
        "tests/unit/spec-lfg-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U8-修复-browser-internal-delivery并完成-capability安全与-degraded-contract",
        "skills/spec-test-browser/SKILL.md"
      ],
      "entry_hint": "从 LFG 当前 step 7 和 feature description modifier 解析边界开始。",
      "test_focus": "target-origin 剥离与保留、applicable/not_applicable、缺 origin blocker、wrapper 逐项状态消费。",
      "done_signal": "spec-lfg focused tests 通过；LFG 不自行推断 origin、不绕过 browser degraded contract；U8 fresh-source 状态按 passed/concerns/not_run 记录，not_run 带 reason，concerns 已解决或有 maintainer acceptance。",
      "parallelizable": true,
      "risk_note": "LFG 是 caller，不拥有 browser backend、安全策略或 server lifecycle。",
      "review_gate": "required",
      "review_focus": "检查 caller/owner 边界、origin provenance 与 blocker 可诊断性。",
      "stop_if": "需要让 LFG 启动自有 browser executor、猜测 target origin 或绕过 spec-test-browser capability result。",
      "wave": 4
    },
    {
      "task_id": "T016",
      "source_unit": "U13",
      "requirement_refs": ["R4", "R13", "R14", "R18", "R19", "AE8"],
      "goal": "建立 source plan 完整文件原始字节 SHA-256 的唯一确定性 helper，并关闭 frontmatter-only mutation 与路径安全回归。",
      "dependencies": ["T001"],
      "files": [
        "skills/spec-work/scripts/source-plan-file-hash.cjs",
        "tests/unit/spec-work-source-plan-file-hash.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U13-为-spec-doc-review-增加显式-markdown-report-only-调用方式",
        "src/cli/task-pack.js",
        "skills/spec-work/references/shipping-workflow.md"
      ],
      "entry_hint": "从 task-pack body hash 会去 frontmatter 的现状开始，为 shipping freshness 建立单一 full-byte helper。",
      "test_focus": "Buffer 完整字节 hash、frontmatter-only mutation、稳定输出，以及绝对路径/repo escape/缺失/非普通文件 fail-closed。",
      "done_signal": "helper 只输出 sha256:<64-hex>；完整字节与路径安全 focused tests 通过；frontmatter-only mutation 会改变 hash；未引入 Markdown 解析、持久 receipt 或公共 CLI。",
      "parallelizable": true,
      "risk_note": "helper 只拥有确定性完整字节事实，不得复用 task-plan-hash/v1 的去 frontmatter 语义或承担评审判断。",
      "review_gate": "required",
      "review_focus": "检查 full-byte owner 唯一性、repo-relative path safety 与 frontmatter-sensitive freshness。",
      "stop_if": "实现需要新增公共 CLI、解析 Markdown 语义、生成持久 receipt，或扩大到签名/DACL/sealed pipeline。",
      "wave": 3
    },
    {
      "task_id": "T018",
      "source_unit": "U13",
      "requirement_refs": ["R4", "R13", "R14", "R18", "R19", "AE8"],
      "goal": "为 spec-doc-review 增加显式 mutation:report-only 与 output:json，并让 shipping caller 使用 T016 helper 完成前后 hash、JSON envelope 与 P0/P1 处置。",
      "dependencies": ["T016"],
      "files": [
        "skills/spec-doc-review/SKILL.md",
        "skills/spec-doc-review/references/synthesis-and-presentation.md",
        "skills/spec-work/references/shipping-workflow.md",
        "skills/spec-doc-review/evals/report-only-cases.json",
        "tests/unit/spec-doc-review-contracts.test.js",
        "tests/unit/spec-work-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U13-为-spec-doc-review-增加显式-markdown-report-only-调用方式",
        "skills/spec-doc-review/references/synthesis-and-presentation.md",
        "skills/spec-work/references/shipping-workflow.md"
      ],
      "entry_hint": "从 T016 helper contract 与现有 Markdown-write/HTML-report-only parity 开始接入 caller 链。",
      "test_focus": "flag conflict、policy precedence、zero-write JSON envelope、默认 Markdown/HTML parity、helper before/after mismatch、plan-recompose rewind 与 P0/P1 disposition。",
      "done_signal": "spec-doc-review 与 spec-work focused tests 通过；2 positive/2 negative-owner cases 存在；shipping workflow 只通过 T016 helper 计算完整文件 hash，hash mismatch/invalid envelope/未处置 P0-P1 不进入 final checks；fresh-source 状态按 passed/concerns/not_run 记录；未创建 sealed evidence/authorization/receipt schema。",
      "parallelizable": false,
      "risk_note": "delivery mode 与 mutation policy 必须正交；JSON output 与 helper hash 不能越级证明 finding 正确或 field outcome。",
      "review_gate": "required",
      "review_focus": "检查 zero-write、default parity、helper ownership、plan-recompose rewind 与 safe_auto producer candidate 语义。",
      "stop_if": "需要改变默认 Markdown write/HTML report-only 行为，绕过 T016 helper，或引入签名、DACL、sealed pipeline、多阶段 receipt。",
      "wave": 4
    },
    {
      "task_id": "T017",
      "requirement_refs": ["R2", "R17"],
      "goal": "在所有 source-bearing tasks 的聚焦验证完成后，串行更新 Changelog，准确记录各能力 slice、验证状态与未运行证据。",
      "dependencies": ["T002", "T003", "T004", "T005", "T006", "T007", "T008", "T009", "T010", "T011", "T012", "T013", "T014", "T015", "T016", "T018"],
      "files": ["CHANGELOG.md"],
      "context_refs": [
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#Definition-of-Done",
        "docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#Verification-Contract"
      ],
      "entry_hint": "从每个 task closeout 的真实验证结果汇总，不从计划或任务存在性推断实现完成。",
      "test_focus": "Changelog 格式、source/public Skill 零增量、五宿主/generated runtime 边界、fresh-source/host/field evidence 的诚实层级。",
      "done_signal": "changelog-format focused test 通过；条目覆盖已实际完成的 source slices 和实际运行命令；not_run/limitations 未被升级为 passed。",
      "parallelizable": false,
      "risk_note": "CHANGELOG 是唯一 orchestrator-owned 共享写入面；不得覆盖当前工作树已有条目。",
      "review_gate": "optional",
      "review_focus": "核对变更描述、测试命令、runtime mirror 影响与 claim ceiling 是否匹配当前事实。",
      "stop_if": "任一 source task 尚无真实 closeout evidence，或需要把未运行的 fresh-source/host/field outcome 写成通过。",
      "wave": 10
    }
  ]
}
```

## Task Cards

### T001 - 当前实施基线与 dirty overlap（Wave 1）

- **task_id:** `T001`
- **source_unit:** `U1`
- **requirement_refs:**
  - `R1`
  - `R2`
  - `R3`
  - `R17`
  - `R18`
- **dependencies:** []
- **files:**
  - `docs/14-agent-skills/README.md`
- **goal:** 在首次 source mutation 前核对当前 dirty/write-set 交集、24 项能力映射和既有 owner/source 基线，并确认后续任务只消费 live source。
- **context_refs:**
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U1-确认实施基线并核对当前工作树状态`
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#Simplification-rationale-round-2本次修订2026-07-17`
  - `src/cli/task-pack.js`
  - `src/cli/commands/tasks.js`
- **entry_hint:** 先读取 git status 和 README 当前 24 项矩阵，再逐文件对照本任务包 T002-T016、T018 的写集。
- **test_focus:** dirty overlap 处置、24 项/14-10 计数、2 个新增 planning reference + 1 个扩展 planning lens + 1 个扩展 spec-work reference + 4 个 reviewer + 1 个 persona 决策与当前 live source 一致。
- **done_signal:** U1 closeout 记录当前 git status 分类；README 映射与计划一致或已更新；未创建 evidence manifest、中央 case-index 或 collision-guard 子系统。
- **parallelizable:** false
- **risk_note:** 当前工作树已有并行用户改动；任何重叠文件必须保留现有内容并按文件协调。
- **review_gate:** optional
- **review_focus:** 确认 U1 采用第二轮简化后的直接核对（git status + README 核对），不恢复已拒绝的 evidence manifest 或中央 case-index。
- **stop_if:** 发现任一重叠文件的 owner 或预期基线无法从当前用户改动与 live source 判定。
- **wave:** 1

### T002 - Production-readiness planning lens（Wave 2）

- **task_id:** `T002`
- **source_unit:** `U2`
- **requirement_refs:**
  - `R4`
  - `R7`
  - `R13`
  - `R14`
  - `R18`
  - `AE3`
- **dependencies:**
  - `T001`
- **files:**
  - `skills/spec-plan/references/high-risk-plan-lens.md`
  - `skills/spec-plan/evals/examples.json`
  - `skills/spec-plan/evals/output-quality-cases.json`
  - `tests/unit/spec-plan-quality-contracts.test.js`
- **goal:** 扩展现有 high-risk planning lens 的 production-readiness 决策集，同时保持轻量变更负例和唯一 owner。
- **context_refs:**
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U2-扩展-high-risk-lens-的-production-readiness-能力`
  - `skills/spec-code-review/references/personas/reliability-reviewer.md`
- **entry_hint:** 从 high-risk lens 当前 Trigger Matrix 与 rollout/rollback/signal/runbook 语义开始。
- **test_focus:** on-call questions、CI/build/deploy fidelity、correlation/cardinality/privacy、flag lifecycle、telemetry proof，以及 docs-only 负例。
- **done_signal:** 聚焦 spec-plan quality tests 通过；至少 2 个 positive 与 2 个 negative-owner case 由 spec-plan evals 持有；fresh-source 状态按 passed/concerns/not_run 记录。
- **parallelizable:** true
- **risk_note:** 不得把 production readiness 拆成新的并列 lens，或让轻量 docs/config 进入完整 ceremony。
- **review_gate:** required
- **review_focus:** 检查 trigger 宽度、stand-in fidelity、alert actionability 与唯一 owner。
- **stop_if:** 实现需要新增 public Skill、并列 production-readiness truth source 或脚本化语义充分性判断。
- **wave:** 2

### T003 - Interface design/evolution planning lens（Wave 3）

- **task_id:** `T003`
- **source_unit:** `U3`
- **requirement_refs:**
  - `R4`
  - `R5`
  - `R13`
  - `R14`
  - `R18`
  - `AE1`
- **dependencies:**
  - `T001`
- **files:**
  - `skills/spec-plan/references/interface-and-evolution-lens.md`
  - `skills/spec-plan/SKILL.md`
  - `skills/spec-plan/evals/examples.json`
  - `skills/spec-plan/evals/output-quality-cases.json`
  - `tests/unit/spec-plan-quality-contracts.test.js`
- **goal:** 新增 interface-and-evolution planning lens，并通过 spec-plan 条件指针连接 greenfield/evolution 双分支和 Interface Contracts landing。
- **context_refs:**
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U3-新增-interface-design-and-evolution-planning-lens`
  - `skills/spec-plan/references/planning-evidence-boundaries.md`
  - `skills/spec-code-review/references/personas/api-contract-reviewer.md`
- **entry_hint:** 先冻结共享 contract core 与两个分支的 trigger/negative boundary，再给 SKILL.md 增加单跳条件指针。
- **test_focus:** greenfield/evolution 分支、private helper 负例、Interface Contracts landing、repo-native parser/test 或 parser_unavailable limitation。
- **done_signal:** 新 reference 可由主入口条件到达；聚焦 spec-plan quality tests 通过；2 positive/2 negative-owner cases 存在；fresh-source 状态有来源与限制。
- **parallelizable:** false
- **risk_note:** REST/TypeScript 模板不得提升为全局规则；API reviewer 不得反向成为设计 owner。
- **review_gate:** required
- **review_focus:** 检查 shared core、greenfield/evolution 差异、canonical artifact 与 parser 边界。
- **stop_if:** 需要新增跨格式 parser 基础设施、public API-design Skill，或无法为 Interface Contracts 指定 canonical owner。
- **wave:** 3

### T004 - Frontend-engineering planning lens（Wave 4）

- **task_id:** `T004`
- **source_unit:** `U4`
- **requirement_refs:**
  - `R4`
  - `R6`
  - `R13`
  - `R14`
  - `R18`
  - `AE2`
- **dependencies:**
  - `T001`
- **files:**
  - `skills/spec-plan/references/frontend-engineering-lens.md`
  - `skills/spec-plan/SKILL.md`
  - `skills/spec-plan/evals/examples.json`
  - `skills/spec-plan/evals/output-quality-cases.json`
  - `tests/unit/spec-plan-quality-contracts.test.js`
- **goal:** 新增 frontend-engineering planning lens，并把组件/状态/a11y/responsive 决策与 polish/browser/race/review owner 分离。
- **context_refs:**
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U4-新增-frontend-engineering-planning-lens`
  - `skills/spec-code-review/references/personas/julik-frontend-races-reviewer.md`
- **entry_hint:** 从用户可见行为 trigger 和 backend/type/fixture/token-value negative boundary 开始。
- **test_focus:** 异步状态矩阵、keyboard/focus/semantic/contrast、responsive、runtime verification landing 与 backend-only/token-only 负例。
- **done_signal:** 新 lens 由 spec-plan 条件加载；聚焦 tests 通过；2 positive/2 negative-owner cases 存在；纯 CSS contrast/focus/breakpoint 回归命中；fresh-source 状态按 passed/concerns/not_run 记录，not_run 带 reason，concerns 已解决或有 maintainer acceptance。
- **parallelizable:** false
- **risk_note:** 不得抢占 spec-polish、spec-test-browser、spec-dogfood 或 frontend-races 的执行/评审职责。
- **review_gate:** required
- **review_focus:** 检查 trigger 是否按行为语义而非文件扩展名，以及 owner 边界是否无重叠。
- **stop_if:** 实现需要新增 spec-frontend public Skill，或无法区分 planning、runtime verification、polish 与 diff review。
- **wave:** 4

### T005 - Feedback/test-design owner extension（Wave 2）

- **task_id:** `T005`
- **source_unit:** `U5`
- **requirement_refs:**
  - `R4`
  - `R8`
  - `R13`
  - `R14`
  - `R18`
  - `AE4`
- **dependencies:**
  - `T001`
- **files:**
  - `skills/spec-work/references/feedback-and-tests.md`
  - `skills/spec-work/evals/examples.json`
  - `tests/unit/spec-work-implementation-quality-contracts.test.js`
  - `tests/unit/spec-work-contracts.test.js`
  - `tests/unit/spec-work-intake-contracts.test.js`
- **goal:** 扩展现有 feedback-and-tests owner，加入 contract/risk-first、rollback-friendly slicing、DAMP、state-over-interaction 与 test-double hierarchy。
- **context_refs:**
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U5-扩展现有-spec-work-feedbacktest-design-owner`
  - `skills/spec-code-review/references/personas/testing-reviewer.md`
- **entry_hint:** 保护现有 smallest-loop、vertical-slice、proof/characterization 语义后再补选择规则。
- **test_focus:** vertical/contract-first/risk-first 选择、DAMP、state outcome、double hierarchy、docs 与 config/type no-test exception，以及无 RED 不声称 TDD。
- **done_signal:** 三个聚焦 suite 通过；2 positive/2 negative-owner cases 存在；feedback-and-tests.md 保持唯一 owner；fresh-source 状态有据可查。
- **parallelizable:** true
- **risk_note:** 不得新建第二个 test-design reference/eval owner，也不得从最终绿测伪造 TDD 历史。
- **review_gate:** required
- **review_focus:** 检查执行期证据权威、测试可观察性与 no-test exception。
- **stop_if:** 需要改变现有 proof/characterization 合同，或把测试质量语义判断移入脚本。
- **wave:** 2

### T006 - Task-scoped live-plan context（Wave 4）

- **task_id:** `T006`
- **source_unit:** `U6`
- **requirement_refs:**
  - `R4`
  - `R5`
  - `R9`
  - `R11`
  - `R13`
  - `R14`
  - `R18`
- **dependencies:**
  - `T003`
- **files:**
  - `skills/spec-code-review/SKILL.md`
  - `skills/spec-code-review/references/subagent-template.md`
  - `skills/spec-work/references/work-intake-and-task-pack.md`
  - `tests/unit/spec-code-review-contracts.test.js`
  - `tests/unit/spec-work-intake-contracts.test.js`
- **goal:** 建立 task-scoped live-plan context：producer 只标注 plan 路径与相关章节标题，reviewer 直接读取当前文件，失败时降级为 diff-only。
- **context_refs:**
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U6-扩展-api-contract-drift-reviewer`
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#Simplification-rationale-round-2本次修订2026-07-17`
- **entry_hint:** 从当前 task-pack intake 与 reviewer context 模板定位最小 plan path/section-title 传递点。
- **test_focus:** validated task 的 path/section 标注、live read、path missing/unreadable 的 diff-only limitation，以及 dispatch 缺失 inline fallback。
- **done_signal:** spec-work intake 与 code-review contract tests 通过；上下文不传 plan 正文/hash；缺 plan 或不可读时不冒充 plan-aware coverage。
- **parallelizable:** true
- **risk_note:** 本任务按 KTD8、U6 详细 Approach 与 round-2 rationale 明确不实现同会话 hash-check，只做 plan path + section title 标注。
- **review_gate:** required
- **review_focus:** 确认 live-plan read 不引入 byte-range、hash transport、保密边界或第二套 context schema。
- **stop_if:** 需要新增 task-plan hash 传递、anchor parser、完整 plan disclosure gate，或无法保持 plan 不可读时的 diff-only 降级。
- **wave:** 4

### T007 - API contract-drift reviewer（Wave 5）

- **task_id:** `T007`
- **source_unit:** `U6`
- **requirement_refs:**
  - `R4`
  - `R5`
  - `R9`
  - `R11`
  - `R13`
  - `R14`
  - `R18`
  - `AE5`
- **dependencies:**
  - `T006`
- **files:**
  - `skills/spec-code-review/references/personas/api-contract-reviewer.md`
  - `skills/spec-code-review/evals/api-contract-capability-cases.json`
  - `tests/unit/spec-code-review-contracts.test.js`
- **goal:** 扩展 API contract reviewer 的 canonical artifact drift、consumer trace、additive evolution、replacement/deprecation 与 zero-use removal 判断。
- **context_refs:**
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U6-扩展-api-contract-drift-reviewer`
  - `skills/spec-plan/references/interface-and-evolution-lens.md`
- **entry_hint:** 从现有 API reviewer 的 consumer contract、confidence gate 与 suppression boundary 开始。
- **test_focus:** 字段删除/契约未同步、无 replacement/zero-use 的 removal、additive optional field 负例、private refactor suppression。
- **done_signal:** code-review contract tests 通过；API eval 文件含至少 2 positive/2 negative-owner cases；findings schema 与 reviewer 数量不变；U6 fresh-source 状态按 passed/concerns/not_run 记录，not_run 带 reason，concerns 已解决或有 maintainer acceptance。
- **parallelizable:** false
- **risk_note:** API reviewer 只检查实现漂移，不承担接口设计或 security authorization finding。
- **review_gate:** required
- **review_focus:** 检查 canonical artifact 证据、兼容性分类、consumer migration 与 suppression。
- **stop_if:** 需要新增 reviewer、第二套 findings schema，或把接口设计决策从 spec-plan 移到 code review。
- **wave:** 5

### T008 - Security reviewer extension（Wave 6）

- **task_id:** `T008`
- **source_unit:** `U10`
- **requirement_refs:**
  - `R4`
  - `R5`
  - `R9`
  - `R11`
  - `R13`
  - `R14`
  - `R18`
- **dependencies:**
  - `T006`
  - `T007`
- **files:**
  - `skills/spec-code-review/SKILL.md`
  - `skills/spec-code-review/references/personas/security-reviewer.md`
  - `skills/spec-code-review/references/persona-catalog.md`
  - `skills/spec-code-review/evals/security-capability-cases.json`
  - `tests/unit/spec-code-review-contracts.test.js`
- **goal:** 扩展 security reviewer 的 Agent-native trust boundary、tenant/resource authorization、危险 sink 与 dependency reachability 判断。
- **context_refs:**
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U10-扩展-security-reviewer`
  - `skills/spec-code-review/references/personas/api-contract-reviewer.md`
- **entry_hint:** 先冻结 API/security owner 分工，再补 trust boundary 与 reachability cases。
- **test_focus:** untrusted model/tool output 到 shell/path/SQL sink、tenant authorization、unreachable advisory suppression、schema-only drift 交给 API owner。
- **done_signal:** code-review contract tests 通过；security eval 至少 2 positive/2 negative-owner cases；attack-path/confidence gate 保持；fresh-source 状态按 passed/concerns/not_run 记录，not_run 带 reason，concerns 已解决或有 maintainer acceptance。
- **parallelizable:** false
- **risk_note:** 泛化 hardening 或不可达 dependency advisory 不得升级为 finding。
- **review_gate:** required
- **review_focus:** 检查可利用路径、tenant/resource 边界、API/security 去重与 reachability suppression。
- **stop_if:** 需要新的 security workflow/public Skill，或必须改变现有 finding confidence/schema。
- **wave:** 6

### T009 - Testing reviewer extension（Wave 7）

- **task_id:** `T009`
- **source_unit:** `U11`
- **requirement_refs:**
  - `R4`
  - `R8`
  - `R9`
  - `R11`
  - `R13`
  - `R14`
  - `R18`
- **dependencies:**
  - `T005`
- **files:**
  - `skills/spec-code-review/references/personas/testing-reviewer.md`
  - `skills/spec-code-review/evals/testing-capability-cases.json`
  - `tests/unit/spec-code-review-contracts.test.js`
- **goal:** 扩展 testing reviewer 的 DAMP、state-over-interaction 与 test-double hierarchy，同时禁止从 diff 反推 TDD 历史。
- **context_refs:**
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U11-扩展-testing-reviewer`
  - `skills/spec-work/references/feedback-and-tests.md`
- **entry_hint:** 区分执行期 RED/characterization evidence 与 reviewer 的 diff-visible proof sufficiency。
- **test_focus:** mock call-count false confidence、interaction-is-contract 例外、无 execution evidence 不推断未做 TDD。
- **done_signal:** code-review contract tests 通过；testing eval 至少 2 positive/2 negative-owner cases；执行历史权威边界明确；fresh-source 状态按 passed/concerns/not_run 记录，not_run 带 reason，concerns 已解决或有 maintainer acceptance。
- **parallelizable:** false
- **risk_note:** reviewer 不得要求所有测试都 state-based，也不得把运行历史当作 diff 事实。
- **review_gate:** required
- **review_focus:** 检查 proof sufficiency、interaction exception 与 execution evidence 权威。
- **stop_if:** 需要 reviewer 读取不存在的 run evidence，或改变 spec-work 对 RED/characterization 的 ownership。
- **wave:** 7

### T010 - Reliability reviewer extension（Wave 8）

- **task_id:** `T010`
- **source_unit:** `U12`
- **requirement_refs:**
  - `R4`
  - `R7`
  - `R9`
  - `R11`
  - `R13`
  - `R14`
  - `R18`
- **dependencies:**
  - `T002`
- **files:**
  - `skills/spec-code-review/references/personas/reliability-reviewer.md`
  - `skills/spec-code-review/references/persona-catalog.md`
  - `skills/spec-code-review/evals/reliability-capability-cases.json`
  - `tests/unit/spec-code-review-contracts.test.js`
- **goal:** 扩展 reliability reviewer 的 correlation propagation、silent failure、telemetry proof 与 alert actionability。
- **context_refs:**
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U12-扩展-reliability-reviewer`
  - `skills/spec-plan/references/high-risk-plan-lens.md`
- **entry_hint:** 从当前 I/O、timeout 与 stand-in fidelity 边界扩展到 diff-visible instrumentation/failure path。
- **test_focus:** 跨服务 correlation 缺失、silent failure、telemetry emission/query proof、alert owner/action/runbook，以及 pure in-memory suppression。
- **done_signal:** code-review contract tests 通过；reliability eval 至少 2 positive/2 negative-owner cases；runtime/field evidence 不被 diff review 越级声称；fresh-source 状态按 passed/concerns/not_run 记录，not_run 带 reason，concerns 已解决或有 maintainer acceptance。
- **parallelizable:** false
- **risk_note:** dashboard/告警真实效果属于 runtime/field evidence，不由 persona prose 或单测证明。
- **review_gate:** required
- **review_focus:** 检查 failure path、correlation、telemetry claim ceiling 与 pure-transform suppression。
- **stop_if:** 需要新增 observability public Skill，或让 reviewer 声称未观察到的 field outcome。
- **wave:** 8

### T011 - Frontend-quality internal reviewer（Wave 9）

- **task_id:** `T011`
- **source_unit:** `U7`
- **requirement_refs:**
  - `R4`
  - `R6`
  - `R10`
  - `R11`
  - `R13`
  - `R14`
  - `R18`
  - `AE6`
- **dependencies:**
  - `T004`
  - `T008`
  - `T009`
  - `T010`
- **files:**
  - `skills/spec-code-review/references/personas/frontend-quality-reviewer.md`
  - `skills/spec-code-review/references/persona-catalog.md`
  - `skills/spec-code-review/SKILL.md`
  - `skills/spec-code-review/evals/frontend-quality-capability-cases.json`
  - `tests/unit/spec-code-review-contracts.test.js`
- **goal:** 新增 internal frontend-quality reviewer，并建立基于 diff 语义的 activation、a11y/state/responsive owner 与相邻 reviewer 去重边界。
- **context_refs:**
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U7-新增-frontend-quality-internal-conditional-reviewer`
  - `skills/spec-code-review/references/personas/julik-frontend-races-reviewer.md`
- **entry_hint:** 先在 persona catalog 固定 frontend-quality/races/testing/security/maintainability owner matrix，再写 activation cases。
- **test_focus:** 用户可见异步表单、a11y/focus/contrast/responsive positive；backend/docs/type/token-only negative；CSS contrast/breakpoint edge。
- **done_signal:** code-review contract tests 通过；frontend eval 至少 2 positive/2 negative-owner cases；新 persona 保持 internal，重复 finding 有主 owner；fresh-source 状态按 passed/concerns/not_run 记录，not_run 带 reason，concerns 已解决或有 maintainer acceptance。
- **parallelizable:** false
- **risk_note:** 文件扩展名不是充分 trigger；unsafe rendering、timing、testing sufficiency 与 maintainability 仍由相邻 owner 持有。
- **review_gate:** required
- **review_focus:** 检查 semantic activation、CSS-only edge、owner matrix 与 dedup。
- **stop_if:** 需要新增 public frontend review workflow，或无法区分 frontend-quality 与现有相邻 reviewer。
- **wave:** 9

### T012 - Browser internal delivery（Wave 2）

- **task_id:** `T012`
- **source_unit:** `U8`
- **requirement_refs:**
  - `R2`
  - `R4`
  - `R12`
  - `R15`
  - `R18`
- **dependencies:**
  - `T001`
- **files:**
  - `src/cli/plugin-governance.js`
  - `tests/unit/plugin-modules.test.js`
  - `tests/unit/doctor-runtime-assets.test.js`
  - `tests/integration/init-five-host-lifecycle.integration.test.js`
- **goal:** 把 internal-only spec-test-browser 加入现有五宿主 delivery policy，并同步 lifecycle/doctor consumer expectations，验证 runtime-required source 被递归投射且 evals 被排除。
- **context_refs:**
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U8-修复-browser-internal-delivery并完成-capability安全与-degraded-contract`
  - `src/cli/contracts/dual-host-governance/skills-governance.json`
  - `src/cli/plugin-sync.js`
- **entry_hint:** 从 DELIVERED_INTERNAL_SKILLS 与 buildFilteredAssetSet 的 internal_only 分支开始。
- **test_focus:** Claude/Codex/Cursor/Kiro/Qoder 都投射 spec-test-browser package；lifecycle/doctor expectations 接受新增 internal runtime skill；evals 缺席；public catalog/source Skill count不增加。
- **done_signal:** plugin-modules、doctor-runtime-assets 与 five-host lifecycle focused tests 通过；五宿主 filtered asset plan 包含 spec-test-browser internal skill 且 public roster 无新增。
- **parallelizable:** true
- **risk_note:** 只扩展 delivery policy，不能手改 runtime mirrors 或另建 generator。
- **review_gate:** required
- **review_focus:** 检查五宿主投射、internal_only/public boundary 与 eval exclusion。
- **stop_if:** 修复需要修改 generated runtime、改变 public catalog 语义或新增第二套 projection generator。
- **wave:** 2

### T013 - Browser safe run-context wrapper（Wave 2）

- **task_id:** `T013`
- **source_unit:** `U8`
- **requirement_refs:**
  - `R4`
  - `R6`
  - `R12`
  - `R13`
  - `R14`
  - `R18`
- **dependencies:**
  - `T001`
- **files:**
  - `skills/spec-test-browser/scripts/agent-browser-run-context.cjs`
  - `skills/spec-test-browser/evals/capability-cases.json`
  - `tests/unit/spec-test-browser-contracts.test.js`
- **goal:** 实现唯一 agent-browser run-context wrapper 的 probe/prepare/run/cleanup、内联 test-plan shape、hash 校验、私有目录与 default-deny action policy。
- **context_refs:**
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U8-修复-browser-internal-delivery并完成-capability安全与-degraded-contract`
  - `skills/spec-test-browser/SKILL.md`
- **entry_hint:** 先写 capability missing、hash mismatch、private-dir failure 和 forbidden action 的失败测试。
- **test_focus:** required flag probe、无 exact-origin 时 navigation/interaction subprocess 零调用、test-plan before-action hash、route/step/value shape、synthetic input、owner/0700/0600 或 icacls、raw output/screenshot private-only。
- **done_signal:** spec-test-browser focused tests 通过；2 positive/2 negative-owner cases 存在；exact-origin capability 未确认时在任何 open/click/fill/type/press/select subprocess 前返回 not_supported 且动作进程调用次数为 0；其他失败路径返回明确 not_supported/not_run reason code 且不写 raw content。
- **parallelizable:** true
- **risk_note:** 当前 exact-origin/sandbox 能力不足；wrapper 不能以 allowlist 或私有目录冒充强隔离。
- **review_gate:** required
- **review_focus:** 检查 argv/action allowlist、页面内容非指令边界、私有写入先后顺序与诚实降级。
- **stop_if:** 实现需要独立 versioned test-plan schema、profile/state 登录回退、任意 caller literal/credential，或声称当前宿主具备未验证 sandbox/exact-origin。
- **wave:** 2

### T014 - Browser workflow/pipeline no-auto-start（Wave 3）

- **task_id:** `T014`
- **source_unit:** `U8`
- **requirement_refs:**
  - `R4`
  - `R6`
  - `R12`
  - `R13`
  - `R14`
  - `R18`
  - `AE7`
- **dependencies:**
  - `T012`
  - `T013`
- **files:**
  - `skills/spec-test-browser/SKILL.md`
  - `skills/spec-test-browser/references/pipeline-orchestration.md`
  - `tests/unit/spec-test-browser-contracts.test.js`
  - `tests/unit/pipeline-mode-contracts.test.js`
- **goal:** 把 wrapper 与 browser workflow/pipeline 接通，移除 pipeline 自动启动待审分支 server 的路径，并固定 interactive server 授权不解锁 browser 请求。
- **context_refs:**
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U8-修复-browser-internal-delivery并完成-capability安全与-degraded-contract`
  - `skills/spec-test-browser/scripts/agent-browser-run-context.cjs`
- **entry_hint:** 先冻结 pipeline no-auto-start 与所有模式无 exact-origin 时 navigation/interaction not_supported 的合同。
- **test_focus:** pipeline server/build command 一律不自动执行；无 exact-origin 时 workflow 不触发 navigation/interaction；interactive 展示完整 command/cwd/env 后可启动 server；不追踪 PID、不代清理、不解锁 browser action。
- **done_signal:** browser + pipeline focused tests 通过；旧后台 dev-server happy path 被测试阻断；无 exact-origin 时 workflow 与 wrapper 均保持零 navigation/interaction subprocess；workflow 只消费唯一 wrapper。
- **parallelizable:** false
- **risk_note:** 本任务按 KTD18、U8 Approach 与 round-2 rationale 明确不追踪或清理 server PID，关闭进程是用户自己的职责。
- **review_gate:** required
- **review_focus:** 检查 pipeline mutation gate、interactive 授权范围与 not_supported/not_run claim ceiling。
- **stop_if:** 需要静默启动 server、以启动授权解锁 browser 请求、追踪/清理 PID，或引入不存在的 attestation/sandbox primitive。
- **wave:** 3

### T015 - LFG browser caller contract（Wave 4）

- **task_id:** `T015`
- **source_unit:** `U8`
- **requirement_refs:**
  - `R4`
  - `R6`
  - `R12`
  - `R15`
  - `R18`
- **dependencies:**
  - `T014`
- **files:**
  - `skills/spec-lfg/SKILL.md`
  - `tests/unit/spec-lfg-contracts.test.js`
- **goal:** 让 spec-lfg step 7 解析 caller-owned target-origin，判定 browser applicability，并在缺 origin/capability 时返回可诊断 blocker。
- **context_refs:**
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U8-修复-browser-internal-delivery并完成-capability安全与-degraded-contract`
  - `skills/spec-test-browser/SKILL.md`
- **entry_hint:** 从 LFG 当前 step 7 和 feature description modifier 解析边界开始。
- **test_focus:** target-origin 剥离与保留、applicable/not_applicable、缺 origin blocker、wrapper 逐项状态消费。
- **done_signal:** spec-lfg focused tests 通过；LFG 不自行推断 origin、不绕过 browser degraded contract；U8 fresh-source 状态按 passed/concerns/not_run 记录，not_run 带 reason，concerns 已解决或有 maintainer acceptance。
- **parallelizable:** true
- **risk_note:** LFG 是 caller，不拥有 browser backend、安全策略或 server lifecycle。
- **review_gate:** required
- **review_focus:** 检查 caller/owner 边界、origin provenance 与 blocker 可诊断性。
- **stop_if:** 需要让 LFG 启动自有 browser executor、猜测 target origin 或绕过 spec-test-browser capability result。
- **wave:** 4

### T016 - Source plan full-file hash helper（Wave 3）

- **task_id:** `T016`
- **source_unit:** `U13`
- **requirement_refs:**
  - `R4`
  - `R13`
  - `R14`
  - `R18`
  - `R19`
  - `AE8`
- **dependencies:**
  - `T001`
- **files:**
  - `skills/spec-work/scripts/source-plan-file-hash.cjs`
  - `tests/unit/spec-work-source-plan-file-hash.test.js`
- **goal:** 建立 source plan 完整文件原始字节 SHA-256 的唯一确定性 helper，并关闭 frontmatter-only mutation 与路径安全回归。
- **context_refs:**
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U13-为-spec-doc-review-增加显式-markdown-report-only-调用方式`
  - `src/cli/task-pack.js`
  - `skills/spec-work/references/shipping-workflow.md`
- **entry_hint:** 从 task-pack body hash 会去 frontmatter 的现状开始，为 shipping freshness 建立单一 full-byte helper。
- **test_focus:** Buffer 完整字节 hash、frontmatter-only mutation、稳定输出，以及绝对路径/repo escape/缺失/非普通文件 fail-closed。
- **done_signal:** helper 只输出 `sha256:<64-hex>`；完整字节与路径安全 focused tests 通过；frontmatter-only mutation 会改变 hash；未引入 Markdown 解析、持久 receipt 或公共 CLI。
- **parallelizable:** true
- **risk_note:** helper 只拥有确定性完整字节事实，不得复用 `task-plan-hash/v1` 的去 frontmatter 语义或承担评审判断。
- **review_gate:** required
- **review_focus:** 检查 full-byte owner 唯一性、repo-relative path safety 与 frontmatter-sensitive freshness。
- **stop_if:** 实现需要新增公共 CLI、解析 Markdown 语义、生成持久 receipt，或扩大到签名/DACL/sealed pipeline。
- **wave:** 3

### T018 - Spec-doc-review report-only shipping integration（Wave 4）

- **task_id:** `T018`
- **source_unit:** `U13`
- **requirement_refs:**
  - `R4`
  - `R13`
  - `R14`
  - `R18`
  - `R19`
  - `AE8`
- **dependencies:**
  - `T016`
- **files:**
  - `skills/spec-doc-review/SKILL.md`
  - `skills/spec-doc-review/references/synthesis-and-presentation.md`
  - `skills/spec-work/references/shipping-workflow.md`
  - `skills/spec-doc-review/evals/report-only-cases.json`
  - `tests/unit/spec-doc-review-contracts.test.js`
  - `tests/unit/spec-work-contracts.test.js`
- **goal:** 为 spec-doc-review 增加显式 mutation:report-only 与 output:json，并让 shipping caller 使用 T016 helper 完成前后 hash、JSON envelope 与 P0/P1 处置。
- **context_refs:**
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#U13-为-spec-doc-review-增加显式-markdown-report-only-调用方式`
  - `skills/spec-doc-review/references/synthesis-and-presentation.md`
  - `skills/spec-work/references/shipping-workflow.md`
- **entry_hint:** 从 T016 helper contract 与现有 Markdown-write/HTML-report-only parity 开始接入 caller 链。
- **test_focus:** flag conflict、policy precedence、zero-write JSON envelope、默认 Markdown/HTML parity、helper before/after mismatch、plan-recompose rewind 与 P0/P1 disposition。
- **done_signal:** spec-doc-review 与 spec-work focused tests 通过；2 positive/2 negative-owner cases 存在；shipping workflow 只通过 T016 helper 计算完整文件 hash，hash mismatch/invalid envelope/未处置 P0-P1 不进入 final checks；fresh-source 状态按 passed/concerns/not_run 记录；未创建 sealed evidence/authorization/receipt schema。
- **parallelizable:** false
- **risk_note:** delivery mode 与 mutation policy 必须正交；JSON output 与 helper hash 不能越级证明 finding 正确或 field outcome。
- **review_gate:** required
- **review_focus:** 检查 zero-write、default parity、helper ownership、plan-recompose rewind 与 safe_auto producer candidate 语义。
- **stop_if:** 需要改变默认 Markdown write/HTML report-only 行为，绕过 T016 helper，或引入签名、DACL、sealed pipeline、多阶段 receipt。
- **wave:** 4

### T017 - 串行 Changelog closeout（Wave 10）

- **task_id:** `T017`
- **requirement_refs:**
  - `R2`
  - `R17`
- **dependencies:**
  - `T002`
  - `T003`
  - `T004`
  - `T005`
  - `T006`
  - `T007`
  - `T008`
  - `T009`
  - `T010`
  - `T011`
  - `T012`
  - `T013`
  - `T014`
  - `T015`
  - `T016`
  - `T018`
- **files:**
  - `CHANGELOG.md`
- **goal:** 在所有 source-bearing tasks 的聚焦验证完成后，串行更新 Changelog，准确记录各能力 slice、验证状态与未运行证据。
- **context_refs:**
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#Definition-of-Done`
  - `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md#Verification-Contract`
- **entry_hint:** 从每个 task closeout 的真实验证结果汇总，不从计划或任务存在性推断实现完成。
- **test_focus:** Changelog 格式、source/public Skill 零增量、五宿主/generated runtime 边界、fresh-source/host/field evidence 的诚实层级。
- **done_signal:** changelog-format focused test 通过；条目覆盖已实际完成的 source slices 和实际运行命令；not_run/limitations 未被升级为 passed。
- **parallelizable:** false
- **risk_note:** CHANGELOG 是唯一 orchestrator-owned 共享写入面；不得覆盖当前工作树已有条目。
- **review_gate:** optional
- **review_focus:** 核对变更描述、测试命令、runtime mirror 影响与 claim ceiling 是否匹配当前事实。
- **stop_if:** 任一 source task 尚无真实 closeout evidence，或需要把未运行的 fresh-source/host/field outcome 写成通过。
- **wave:** 10

## Orientation Evidence

- **provider:** direct-repo-reads
- **posture:** bounded
- **evidence_refs:** 最新 source plan 的 Goal Capsule、Requirements、Scope Boundaries、Planning Contract、Implementation Units、Verification Contract 与 Definition of Done；现有 task pack 的 Task Pack Contract/Task Cards；`src/cli/task-pack.js` 的 body-hash owner；`skills/spec-work/references/shipping-workflow.md` 当前 caller 链；task-pack schema 与 task-quality guide。
- **limitations:** 本轮只为任务边界做定向 source/document reads，没有运行 implementation tests、fresh-source eval、host loader 或 field outcome 验证。当前工作树非 clean，T001 必须在实施时重新分类 dirty/write-set overlap；direct reads 不授予实现完成或 host adoption claim。

## Validation Notes

- 本任务包绑定 `spec-first tasks hash ... --repo . --json` 返回的 canonical body hash；frontmatter 不参与 task-pack freshness。
- `spec-first tasks validate` 只证明 source-plan path、body hash、Task Pack Contract 结构、依赖和同波文件不重叠，不证明任务切分或计划语义正确。
- source plan 中已直接清理 evidence manifest、中央 case-index、U6 同会话 hash 传递和 server PID cleanup 等旧合同；本任务包只绑定当前 canonical body hash，不保留历史 hash 链，也不承担对 source plan 的 precedence 仲裁。
- source plan 任意正文变更都会使本任务包 stale；不得手改 hash 绕过 regeneration。
- `review_gate` 表示执行中或最终 shipping review 的意图，不是 approval/progress state。
- 本次只生成任务包，没有执行 U1-U13、没有运行计划内实现测试、没有刷新 generated runtime。

## Regeneration Rules

出现以下任一变化必须重新运行 `spec-write-tasks`：

- source plan 正文、Scope、Requirements、KTD、Implementation Units、Files 或 Verification 变化；
- source plan 正文发生任何使 canonical body hash 变化的修订；
- 实施前 current source 证明任一 canonical owner、文件路径或依赖已改变；
- 手工修改 Task Pack Contract、Task Cards、execution waves 或 review intent；
- `spec-first tasks validate` 返回 stale、wrong-chain、invalid 或 unverifiable。

执行任一 `stop_if` 时，停止受影响 task，回到 `spec-plan` 或重新生成本任务包；不得由 executor 私下扩展 scope。
