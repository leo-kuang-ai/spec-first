---
spec_id: 2026-06-22-004-spec-plan-skill-quality
artifact_kind: prd-requirements
target_surface: cli-devtool
status: draft
evidence_grade: mixed
created: 2026-06-23
source_plan: docs/plans/2026-06-22-004-refactor-spec-plan-skill-quality-plan.md
origin: docs/项目审查/详细审查/skill/Skill-25-spec-plan-详细审查报告.md
---

# refactor: spec-plan skill 质量与边界优化需求

## Summary

`spec-plan` 需要在不改变其公开 planning workflow 身份的前提下，降低入口初载负载和输出漂移风险。目标是让 `spec-plan` / `spec-plan` 继续稳定承担 HOW planning：直接调用时必须进入 planning workflow，计划阶段不实现、不生成执行态 task pack、不改 generated runtime mirrors；同时通过 source-owned eval fixtures、contract tests、runtime projection checks、集中治理说明和 fresh-source eval 证据，证明入口瘦身没有破坏 plan-only safety、handoff、near-neighbor routing、PRD handoff entropy 和双宿主投影边界。

## Problem Frame

当前计划文档已经给出了较完整的实现方案，但它是 `docs/plans/` 下的 HOW artifact，不能替代 PRD 的 WHAT/WHY 边界。PRD 需要把可执行单元中的产品/系统行为要求提炼出来：`spec-plan` 应表现成什么、必须保留哪些用户入口和 artifact 语义、哪些治理或 output-quality evidence 只能作为 advisory、哪些 generated/runtime 或 per-skill metadata 拓扑不得被引入。后续 plan/work 阶段可以据此选择实现顺序，但不应再决定这些 load-bearing WHAT。

## Current System Snapshot

| claim | tag | source / owner | note |
| --- | --- | --- | --- |
| `spec-plan` 当前是公开 planning workflow，Claude 入口为 `spec-plan`，Codex 入口为 `spec-plan`。 | confirmed-source | `docs/catalog/runtime-capabilities.md`, `src/cli/contracts/dual-host-governance/skills-governance.json` | Catalog 与 governance 记录均指向 dual-host delivery。 |
| Claude command 模板只定义 metadata，实际 workflow 行为由 `skills/spec-plan/SKILL.md` 渲染。 | confirmed-source | `templates/claude/commands/spec/plan.md` | 变更 workflow 行为应修改 skill source，不手改 runtime command。 |
| `skills/spec-plan/SKILL.md` 当前 756 行，`references/` 下有 10 个 markdown reference，`evals/examples.json` 有 5 个 case。 | confirmed-source | `wc -l skills/spec-plan/SKILL.md skills/spec-plan/references/*.md skills/spec-plan/evals/examples.json` | 当前直接命令输出确认；origin review 的 757 行是历史事实。 |
| `SKILL.md` 已在热路径声明 `spec-brainstorm` 定义 WHAT、`spec-plan` 定义 HOW、`spec-work` 执行，并要求直接调用时始终 stay in planning。 | confirmed-source | `skills/spec-plan/SKILL.md` | 这些是必须保留的行为身份。 |
| `Plan-Only Safety Contract` 已要求 planning only、blocking handoff、question-tool fallback loud、不可声称非 Plan Mode 有硬写保护。 | confirmed-source | `skills/spec-plan/SKILL.md`, `tests/unit/spec-plan-contracts.test.js` | 当前 tests 已锁定多条关键文本。 |
| 当前 eval examples 是 examples-as-context，不是 deterministic router 或 semantic readiness gate。 | confirmed-source | `skills/spec-plan/SKILL.md`, `skills/spec-plan/evals/examples.json`, `tests/unit/workflow-eval-readiness-contracts.test.js` | 后续扩展 fixtures 也必须保留这个边界。 |
| `tests/unit/spec-plan-contracts.test.js` 覆盖 plan-only safety、context orientation、PRD handoff entropy、direct evidence、research dispatch、handoff、runtime path rewrite 和 drift detection。 | confirmed-source | `tests/unit/spec-plan-contracts.test.js` | 后续不能只靠入口文件包含所有长文来过测试。 |
| `src/cli/plugin.js` 对 `spec-plan` 声明 5 个 high-value anchors：`Implementation Units`、`Concrete requirements traceability`、`Test scenarios`、`governance-boundaries.md`、`universal-planning.md`。 | confirmed-source | `src/cli/plugin.js` | 入口瘦身必须保留这些 runtime anchor，或有意同步更新 anchor 合同。 |
| 集中治理文档说明 examples 不等于 semantic readiness，deterministic tests 不应假装判断 semantic quality。 | confirmed-source | `docs/contracts/workflows/skill-agent-quality-governance.md` | output-quality fixture 只能是 file-backed review evidence。 |
| `skills-governance.schema.json` 使用 `additionalProperties: false`，当前只表达 delivery/topology metadata，不支持 owner/cadence/maturity 字段。 | confirmed-source | `src/cli/contracts/dual-host-governance/skills-governance.schema.json` | 本轮不应为单个 skill 偷加 lifecycle metadata。 |
| Origin review 将 `spec-plan` 定级为 P1 重构，主要建议是 progressive disclosure、补 normalized eval / fixture、避免新增平行对象。 | source-candidate | `docs/项目审查/详细审查/skill/Skill-25-spec-plan-详细审查报告.md` | 这是 review evidence，不是当前 source truth；已用当前 source 复核关键事实。 |
| 输入 plan 的 U1-U7 实施单元是参考 claims，不是 PRD source-of-truth。 | source-candidate | `docs/plans/2026-06-22-004-refactor-spec-plan-skill-quality-plan.md` | 本 PRD 从中抽取 WHAT/WHY，剥离 HOW。 |

## Change Delta

| item | current | target | delta | evidence |
| --- | --- | --- | --- | --- |
| workflow identity | `spec-plan` 已定义 HOW planning，并有双宿主公开入口。 | 继续保持 HOW planning 身份；不变成 brainstorm、debug、work、doc-review 或 task-pack compiler。 | keep | `skills/spec-plan/SKILL.md`, `docs/catalog/runtime-capabilities.md` |
| direct invocation | 直接调用时已要求 always plan，输入不清时澄清或 bootstrap。 | 入口瘦身和 description 调整后仍保留该行为。 | keep | `skills/spec-plan/SKILL.md` |
| plan-only safety | 已有热路径 safety contract。 | 保留且更难被入口长文淹没；handoff 前不得执行或生成执行态 artifact。 | keep / extend | `skills/spec-plan/SKILL.md`, `tests/unit/spec-plan-contracts.test.js` |
| entrypoint prose | 当前入口 756 行，承载大量流程细节。 | 入口更像 orchestrator；长细节迁入清晰 ownership 的 references。 | replace | `wc -l`, `skills/spec-plan/references/` |
| eval coverage | `examples.json` 当前 5 个 trigger/boundary cases。 | 覆盖更多 trigger、near-neighbor、safety、handoff 和 degraded cases；仍作为 examples-as-context。 | extend | `skills/spec-plan/evals/examples.json`, `tests/unit/workflow-eval-readiness-contracts.test.js` |
| output-quality evidence | 当前无 `spec-plan` 专用 output-quality fixtures。 | 可新增 file-backed output-quality cases，但必须披露 evidence gaps，不能声称 semantic proof。 | add | `docs/contracts/workflows/skill-agent-quality-governance.md`, `skills/spec-write-tasks/evals/output-quality-cases.json` 作为模式参考 |
| runtime projection | 当前 tests 检查 Claude/Codex runtime path rewrite 和 drift anchors。 | 文本移动后仍证明双宿主 runtime anchors、reference paths 和 drift detection 有效。 | keep / extend | `tests/unit/spec-plan-contracts.test.js`, `src/cli/plugin.js` |
| governance metadata | 当前集中 governance 只表达 delivery/topology。 | 不新增 `skills/spec-plan/manifest.json`、`agents/interface.yaml` 或第二套 lifecycle topology；必要时写 waiver / future trigger。 | keep | `docs/contracts/workflows/skill-agent-quality-governance.md`, `skills-governance.schema.json` |
| generated runtime mirrors | `.claude/`、`.codex/`、`.agents/skills/` 是 generated runtime。 | 本轮 source 变更不得手改 generated mirrors；runtime refresh 由后续 `spec-first init`。 | keep | `docs/catalog/runtime-capabilities.md`, `docs/10-prompt/结构化项目角色契约.md` |

## Change Topology

Primary topology: workflow-change

Secondary topology: contract-change, source-of-truth boundary

Why this topology matters: 本次需求会改变 `spec-plan` prompt/source 的组织形态、eval 证据面、runtime projection tests 和治理表达。规划若不明确入口、reference、eval、runtime mirror、downstream consumer 和 advisory evidence 的边界，后续实现很容易把 plan artifact 变成执行状态机、把 fixture 当 semantic proof、或把 generated runtime mirror 当 source 修复。

## Surface Map

| surface | current behavior | owner/source | artifact/contract | consumer | delta | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| public workflow entry | `spec-plan` 与 `spec-plan` 暴露 planning workflow。 | `src/cli/contracts/dual-host-governance/skills-governance.json`, `docs/catalog/runtime-capabilities.md` | workflow_command delivery | Claude/Codex users | keep | confirmed-source |
| skill source hot path | `SKILL.md` 含 description、safety、contract summary、routing 和长流程。 | `skills/spec-plan/SKILL.md` | source skill | host runtime render, tests, users | replace / compact | confirmed-source |
| references | 10 个 markdown reference 承载 deepening、template、handoff、rendering 等细节。 | `skills/spec-plan/references/` | source support files | `spec-plan`, runtime copies, tests | extend ownership clarity | confirmed-source |
| eval fixtures | `examples.json` 含 5 个 examples-as-context cases。 | `skills/spec-plan/evals/examples.json` | source eval fixture | tests, fresh-source eval context | extend | confirmed-source |
| output-quality evidence | `spec-plan` 暂无专用 output-quality case。 | future source fixture if created | file-backed review evidence | maintainers/reviewers | add optional | assumption |
| runtime projection | Source render 到 Claude command/workflow copy 与 Codex skill copy。 | `src/cli/plugin.js`, adapters, tests | generated runtime mirrors | `spec-first init`, doctor/drift checks | keep | confirmed-source |
| governance posture | 集中治理文档与 delivery schema 存在。 | `docs/contracts/workflows/skill-agent-quality-governance.md`, `skills-governance*.json` | source governance | maintainers, tests | keep / waiver | confirmed-source |
| changelog / validation | 每次 source 变更需记录 changelog，语义 prompt 变更需 fresh-source eval 或未执行原因。 | `CHANGELOG.md`, `docs/validation/` | source docs | reviewers, future workflows | extend | project instruction + confirmed-source |

## Producer / Artifact / Consumer

| producer | artifact/schema/path | freshness/authority | consumers | change effect | evidence |
| --- | --- | --- | --- | --- | --- |
| `spec-plan` maintainer | `skills/spec-plan/SKILL.md` | source-of-truth | Claude command render, Codex skill render, contract tests | Entry prose may shrink but must preserve workflow contract. | confirmed-source |
| `spec-plan` maintainer | `skills/spec-plan/references/*.md` | source support files | `spec-plan`, runtime copies, tests | Conditional detail may move here; ownership must be clear. | confirmed-source |
| `spec-plan` maintainer / tests | `skills/spec-plan/evals/examples.json` | source examples-as-context | eval fixture tests, fresh-source eval | Coverage expands; remains advisory examples, not router. | confirmed-source |
| `spec-plan` maintainer / tests | optional `skills/spec-plan/evals/output-quality-cases.json` | source review evidence if created | contract tests, maintainers | Must expose objective assertions and missing evidence. | assumption + local pattern |
| `src/cli/plugin.js` | runtime rendering and high-value anchor checks | source implementation | `spec-first init`, doctor/drift inspection, tests | Anchor/path changes must be synchronized; generated runtime not edited directly. | confirmed-source |
| docs maintainer | `docs/contracts/workflows/skill-agent-quality-governance.md` or validation artifact | source governance / advisory validation | maintainers, reviewers | Waiver or recheck trigger can live here; no per-skill manifest by default. | confirmed-source |
| workflow maintainer | `CHANGELOG.md` | source release log | users, reviewers | Must record source changes, generated runtime status, and verification. | project instruction |

## Source-Of-Truth Resolution

| item | current source-of-truth | target source-of-truth | generated mirrors / non-authoritative refs | conflict rule |
| --- | --- | --- | --- | --- |
| workflow behavior | `skills/spec-plan/SKILL.md` plus required references | same | `.claude/spec-first/workflows/spec-plan/**`, `.agents/skills/spec-plan/**` | Source wins; regenerate runtime, do not patch mirrors. |
| Claude command metadata | `templates/claude/commands/spec/plan.md` plus skill render | same | `.claude/commands/spec/plan.md` | Template controls metadata; skill controls body. |
| delivery topology | `src/cli/contracts/dual-host-governance/skills-governance.json` and schema | same | runtime catalog generated from source | Add lifecycle only through separate centralized contract with consumer evidence. |
| output-quality evidence | none for `spec-plan` today | optional source fixture plus test | provider telemetry absent unless explicitly collected | File-backed fixture is review evidence only; semantic quality remains LLM/reviewer-owned. |
| existing plan input | `docs/plans/2026-06-22-004-refactor-spec-plan-skill-quality-plan.md` | reference-claim for this PRD; future plan may consume this PRD as origin | historical plan revisions | PRD settles WHAT; plan owns HOW. |

## Actors

| actor | role in this increment | requirement relevance |
| --- | --- | --- |
| Workflow maintainer | Edits `spec-plan` source, references, tests and validation docs. | Needs clear source/runtime and advisory/confirmed evidence boundaries. |
| Planning user | Invokes `spec-plan` or `spec-plan`. | Should experience stable routing, plan-only behavior and explicit handoff. |
| Downstream implementer | Uses the plan artifact through `spec-work`, optional `spec-write-tasks`, review or issue handoff. | Should not inherit WHAT gaps or task-pack state invented by planning. |
| Reviewer / future maintainer | Reviews prompt/source changes and evidence. | Needs focused tests, fresh-source eval status and changelog trail. |
| Runtime generator / doctor | Renders and inspects generated runtime assets. | Needs anchors and paths that remain valid across Claude/Codex. |

## Requirements

| id | priority | requirement | rationale/source |
| --- | --- | --- | --- |
| R-01 | P0 | `spec-plan` must continue to present itself as the workflow that defines HOW after WHAT is clear; it must not absorb `spec-brainstorm`, `spec-prd`, `spec-debug`, `spec-work`, `spec-doc-review`, or `spec-write-tasks` ownership. | confirmed-source: `skills/spec-plan/SKILL.md`; confirmed-source: `docs/catalog/runtime-capabilities.md` |
| R-02 | P0 | Direct `spec-plan` or `spec-plan` invocation must remain a planning workflow entry. If the input is unclear, the workflow must clarify or bootstrap scope instead of exiting as "not a planning task". | confirmed-source: `skills/spec-plan/SKILL.md` |
| R-03 | P0 | Plan-only safety must remain hot-path visible: before explicit handoff selection, `spec-plan` may research, decide, and write/update the plan artifact only; it must not edit implementation source/config, run implementation verification, dispatch implementation workers, create execution task packs, or patch generated runtime mirrors. | confirmed-source: `skills/spec-plan/SKILL.md`; confirmed-source: `tests/unit/spec-plan-contracts.test.js` |
| R-04 | P0 | The handoff gate must remain blocking and host-neutral: after plan write/review, the workflow presents `Start work`, `Compile task pack`, or `Create Issue` style options and waits for explicit user selection. | confirmed-source: `skills/spec-plan/SKILL.md`; confirmed-source: `skills/spec-plan/references/plan-handoff.md`; confirmed-source: `tests/unit/spec-plan-contracts.test.js` |
| R-05 | P0 | Entrypoint compaction must preserve the public workflow contract summary, direct invocation rule, plan-only safety contract, question-tool fallback rules, examples-as-context anchor, governance-boundaries mandatory load, core principles, and plan quality bar. | source-candidate: `docs/plans/2026-06-22-004-refactor-spec-plan-skill-quality-plan.md`; confirmed-source for current anchors: `skills/spec-plan/SKILL.md` |
| R-06 | P0 | Long procedural detail may move from `SKILL.md` into existing references only when the reference has clear ownership and is loaded before the detail is needed; at most one new reference may be added in this scope, and only for a real ownership gap. | user-stated via source plan reference-claim; confirmed-source current references: `skills/spec-plan/references/` |
| R-07 | P0 | Any movement of section/template/rendering/handoff detail must preserve or deliberately update the 5 high-value runtime anchors for `spec-plan`: `Implementation Units`, `Concrete requirements traceability`, `Test scenarios`, `governance-boundaries.md`, and `universal-planning.md`. | confirmed-source: `src/cli/plugin.js`; source-candidate: plan U3/U5 |
| R-08 | P0 | Eval fixture coverage must expand beyond the current 5 cases to include direct invocation, unclear input bootstrap, plan-only safety, review-origin planning, dirty worktree limitation, PRD handoff entropy, generated runtime mirror exclusion, optional task-pack handoff, and PRD/brainstorm/work/debug/doc-review near-neighbor boundaries. | confirmed-source current count/content: `skills/spec-plan/evals/examples.json`; source-candidate: origin review and plan |
| R-09 | P0 | Eval examples and output-quality fixtures must remain source-owned advisory evidence. They must not be described as deterministic routers, semantic readiness gates, provider telemetry, human adjudication, or proof that model output quality improved. | confirmed-source: `skills/spec-plan/SKILL.md`; confirmed-source: `docs/contracts/workflows/skill-agent-quality-governance.md`; confirmed-source: `tests/unit/eval-fixture-contracts.test.js` |
| R-10 | P1 | If `skills/spec-plan/evals/output-quality-cases.json` or equivalent is created, each case must expose input files, baseline risks, skill expectations, objective assertions, evidence status, and top-level missing evidence when semantic execution/adjudication evidence is absent. | local pattern: `skills/spec-write-tasks/evals/output-quality-cases.json`; source-candidate: input plan |
| R-11 | P0 | Contract tests must validate the combined source + reference behavior contract, not force every load-bearing instruction to remain in `SKILL.md`. | confirmed-source current pattern: `tests/unit/spec-plan-contracts.test.js` |
| R-12 | P0 | Runtime projection tests must continue to cover Claude command rendering, Codex skill rendering, source-path to runtime-path rewrite, reference copy integrity, high-value anchors, and runtime drift detection. | confirmed-source: `tests/unit/spec-plan-contracts.test.js`; confirmed-source: `tests/unit/skill-path-rewrite-guard.test.js`; confirmed-source: `tests/unit/runtime-plan-contracts.test.js` |
| R-13 | P0 | This increment must not add `skills/spec-plan/manifest.json`, `agents/interface.yaml`, per-skill package metadata, a plan execution state machine, or an independent governance report as a new source topology. | confirmed-source governance boundary: `docs/contracts/workflows/skill-agent-quality-governance.md`; confirmed-source schema boundary: `skills-governance.schema.json`; source-candidate: input plan |
| R-14 | P1 | If governance maturity, owner, review cadence, or lifecycle metadata needs to be mentioned, it must land in an existing centralized governance surface, a validation artifact, or a documented waiver with recheck conditions; schema expansion requires a separate consumer-backed plan. | confirmed-source: `skills-governance.schema.json`; source-candidate: input plan |
| R-15 | P0 | All changed source refs in requirements, plans, tests, eval fixtures and validation docs must remain repo-relative POSIX paths; generated runtime mirrors must be excluded from source authority. | confirmed-source: `skills/spec-plan/SKILL.md`; confirmed-source: `tests/unit/eval-fixture-contracts.test.js`; project instruction |
| R-16 | P0 | Closeout must include focused deterministic verification, `CHANGELOG.md`, generated runtime mirror status, and fresh-source eval or a visible `not_run` / dispatch limitation reason. | project instruction; confirmed-source: `docs/contracts/workflows/fresh-source-eval-checklist.md` referenced by input plan |
| R-17 | P1 | README / user manual updates are conditional: update them only when public entry semantics, handoff wording, or user-visible behavior materially changes; internal quality and boundary tightening may be documented through changelog and validation artifacts. | source-candidate: input plan; project instruction |

## Acceptance Examples

AE-01（对应 R-01, R-02）
Given a user directly invokes `spec-plan` with a vague but plan-seeking prompt
When the prompt lacks enough scope for a durable plan
Then `spec-plan` asks a blocking clarification question or uses its planning bootstrap, and does not exit as "not a planning task".

AE-02（对应 R-01, R-02, R-08）
Given a user asks "fix this failing test now" or "review this plan only"
When workflow routing is evaluated
Then the examples-as-context and entry prose make the near-neighbor boundary visible: debugging/execution/review-only work routes out, while explicit plan creation stays in `spec-plan`.

AE-03（对应 R-03, R-04）
Given `spec-plan` has written or updated a plan artifact
When no user handoff selection has been made
Then it does not call `spec-work`, does not compile a task pack, does not create an issue, and does not edit code/config/runtime source.

AE-04（对应 R-05, R-06, R-07）
Given procedural text has been moved out of `SKILL.md`
When source and runtime projection tests inspect `spec-plan`
Then the public workflow contract remains visible in the hot path, required references are named, and either all 5 high-value anchors remain in rendered runtime artifacts or the anchor lists are intentionally updated with focused tests.

AE-05（对应 R-08, R-09）
Given `skills/spec-plan/evals/examples.json` gains new cases
When fixture normalization runs
Then trigger and boundary coverage are visible, source refs are source-owned paths, and the fixture text still states that examples are not deterministic routers or semantic readiness gates.

AE-06（对应 R-09, R-10）
Given an output-quality fixture case evaluates a plan that loses Direct Evidence or limitations
When tests inspect the case
Then objective assertions and missing evidence are explicit, and the case does not claim provider-backed model telemetry or human adjudication exists unless such evidence is actually attached.

AE-07（对应 R-11, R-12, R-15）
Given `plan-template.md`, `plan-sections.md`, `markdown-rendering.md`, or `governance-boundaries.md` is referenced from `SKILL.md`
When Claude and Codex runtime rendering is tested
Then source paths rewrite to host runtime paths, reference copies exist, and generated runtime mirrors are not modified as source.

AE-08（对应 R-13, R-14）
Given external audit advice requests a per-skill manifest or owner/cadence fields
When the implementation records governance posture
Then it uses the centralized governance/validation surface or waiver, and does not create `skills/spec-plan/manifest.json` or expand `skills-governance.schema.json` without a separate consumer-backed plan.

AE-09（对应 R-03, R-12）
Given a generated runtime mirror has drifted or a reference is missing
When runtime inspection tests run
Then drift is detected from source-rendered runtime inspection, and the fix path is source change plus `spec-first init`, not hand-editing `.claude/`, `.codex/`, or `.agents/skills/`.

AE-10（对应 R-16, R-17）
Given fresh-source eval or doc-review cannot run because the host lacks dispatch authorization
When the increment closes
Then the validation artifact or changelog records `not_run` / `dispatch_authorization_missing` and the fallback review performed, rather than claiming semantic review passed; README / manual updates are recorded only if public entry semantics changed.

## Negative Acceptance

NA-01
Given the goal is to reduce `SKILL.md` load
When implementation moves prose into references
Then it must not remove direct invocation, plan-only safety, handoff blocking, question-tool fallback, PRD handoff entropy, or source/runtime boundary language without an equivalent tested replacement.

NA-02
Given output-quality fixtures exist
When closeout describes verification
Then it must not say these fixtures prove model semantic quality, provider behavior, or human adjudication unless those evidence artifacts exist.

NA-03
Given governance metadata is discussed
When source files are edited
Then the increment must not introduce per-skill `manifest.json`, `agents/interface.yaml`, or lifecycle schema fields as a one-off `spec-plan` topology.

NA-04
Given runtime projection tests fail
When fixing the failure
Then the maintainer must not patch `.claude/**`, `.codex/**`, or `.agents/skills/**` as source truth.

NA-05
Given `docs/plans/2026-06-22-004-refactor-spec-plan-skill-quality-plan.md` contains U1-U7 implementation units
When a future plan consumes this PRD
Then planning must not treat those units as mandatory task boundaries; it should derive HOW from this PRD's requirements and current source evidence.

## Scope Boundaries

### In Scope

- `skills/spec-plan/SKILL.md` hot-path wording, description, direct invocation, safety and handoff boundaries.
- `skills/spec-plan/references/*` ownership and reference-routing adjustments.
- `skills/spec-plan/evals/examples.json` and optional `skills/spec-plan/evals/output-quality-cases.json` / README when needed for source-owned evidence.
- Focused tests around eval fixtures, `spec-plan` source/reference contracts, runtime projection, path rewrite, high-value anchors, governance posture and changelog.
- Existing centralized governance docs or validation artifact updates that record waiver/recheck conditions.
- `CHANGELOG.md` and optional README/manual updates only if user-visible entry semantics change.

### Out Of Scope

- Implementing the `spec-plan` refactor inside this PRD workflow.
- Creating a new public workflow, public agent, planning state machine, plan JSON schema, or task-pack default step.
- Making `spec-write-tasks` mandatory.
- Adding per-skill `manifest.json`, `agents/interface.yaml`, or a second governance metadata topology.
- Treating output-quality fixtures as provider telemetry or semantic proof.
- Hand-editing generated runtime mirrors under `.claude/`, `.codex/`, or `.agents/skills/`.
- Retiring `spec-plan` or changing its identity from HOW planning.

## Release / Operation Readiness

| item | requirement refs | readiness expectation |
| --- | --- | --- |
| Dirty worktree protection | R-15, R-16 | Closeout must show scoped diff/status review and must not revert unrelated user changes. |
| Deterministic verification | R-08, R-11, R-12, R-16 | Run the narrow tests that prove changed eval/source/runtime/governance surfaces; expand only if touched surfaces require it. |
| Fresh-source semantic review | R-16 | Required for prompt/skill semantics unless unavailable; unavailable state must be recorded with reason and fallback. |
| Runtime mirror status | R-12, R-15 | State whether generated runtime mirrors were untouched and whether regeneration is required. |
| Changelog | R-16, R-17 | Record source surfaces, user-visible impact, verification commands and runtime mirror status. |

## Feature Slices

| feature_id | title | summary | requirement_refs | acceptance_refs | source_excerpt_or_claim | evidence | risk_signals |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FEAT-01 | Planning identity and safety | Preserve direct planning invocation, HOW boundary, plan-only behavior and explicit handoff. | R-01, R-02, R-03, R-04 | AE-01, AE-02, AE-03 | Input plan R1-R4; current `SKILL.md` safety contract. | confirmed-source + source-candidate | Over-aggressive entry shrink could remove safety instructions. |
| FEAT-02 | Evidence fixtures and output quality | Expand examples and optional output-quality fixtures while preserving advisory-only semantics. | R-08, R-09, R-10, R-11 | AE-05, AE-06 | Input plan U1/U2; current eval fixture tests. | confirmed-source + source-candidate | Fixture Goodharting or false semantic confidence. |
| FEAT-03 | Entrypoint/reference/runtime projection | Move long details into references without breaking anchors, path rewrite or dual-host runtime projection. | R-05, R-06, R-07, R-12, R-15 | AE-04, AE-07, AE-09 | Input plan U3/U5; current `spec-plan-contracts` and `plugin.js` anchors. | confirmed-source + source-candidate | Reference sprawl or generated mirror drift. |
| FEAT-04 | Governance and closeout | Record lifecycle/governance posture without one-off topology; close with validation, changelog and fresh-source eval status. | R-13, R-14, R-16, R-17 | AE-08, AE-10 | Input plan U6/U7; centralized governance docs. | confirmed-source + source-candidate | Per-skill manifest creep or unverified semantic claims. |

## Glossary

| term | definition | avoid / boundary |
| --- | --- | --- |
| `spec-plan` | spec-first 的公开 planning workflow，负责把足够清晰的 WHAT 转成可执行 HOW。 | 不等同于 `spec-work`、`spec-debug`、`spec-doc-review` 或 task-pack compiler。 |
| examples-as-context | 给 workflow / reviewer 提供触发与边界样例的 source fixture。 | 不是 deterministic router、semantic readiness gate 或 provider telemetry。 |
| output-quality fixture | 记录 file-backed 输出质量风险和 objective assertions 的 source/test evidence。 | 不证明模型真实输出质量，除非另有执行和 adjudication evidence。 |
| generated runtime mirror | 由 source 渲染到宿主目录的 `.claude/**`、`.codex/**`、`.agents/skills/**` 资产。 | 不是 source-of-truth；不手改作为修复。 |
| PRD handoff entropy | 从 PRD 到 plan 时，若术语、source-of-truth、scope、slice acceptance 等 WHAT 未定，planning 会被迫发明产品行为的风险。 | `spec-plan` 应 route/refine，而不是复制 `spec-prd` readiness lens 或自行决定 WHAT。 |

## Decision Notes

| question | recommended_answer | source_tag | chosen_answer | consequence | deferred_reason |
| --- | --- | --- | --- | --- | --- |
| 本 PRD 是否沿用现有 plan 的 `spec_id`？ | 沿用 `2026-06-22-004-spec-plan-skill-quality`。 | source-candidate | accepted-assumption | 避免从已有 plan 倒推 PRD 时拆出第二条 spec chain；未来 plan revise 可把本 PRD作为 origin。 | 无阻塞。 |
| 是否需要外部 web research？ | 不需要。 | confirmed-source + assumption | accepted-assumption | 本需求只依赖本地 workflow source、tests、governance docs 和 origin review；无当前外部 API/法律/SDK 事实。 | 若后续实现引用外部工具/API 当前事实，再按需查官方来源。 |
| 是否把 owner/review cadence/maturity 写入 `skills-governance.schema.json`？ | 本轮不写。 | confirmed-source | accepted-assumption | 当前 schema 只表达 delivery/topology；lifecycle metadata 需要 consumer-backed 独立计划。 | 多个 public workflows 出现真实 machine-readable consumer 后重估。 |

## Evidence And Assumptions

| claim | tag | source / owner | note |
| --- | --- | --- | --- |
| 本 PRD 从 wrong-stage plan 中抽取需求，不把实施单元当任务合同。 | assumption | `spec-prd` workflow contract + input posture | 输入是 `docs/plans/**`，不是 `artifact_kind: prd-requirements`。 |
| 当前工作区 dirty，且存在与本 PRD无关的 `tests/unit/spec-prd-contracts.test.js` 修改。 | confirmed-source | `git status --short` | 本 PRD 不回滚或覆盖该改动。 |
| `2026-06-23-001` 是当前日期下新的 requirements 路径编号。 | confirmed-source | `date +%F`; `find docs/brainstorms -name '2026-06-23-*'` | Frontmatter `spec_id` 沿用已有 plan chain。 |
| Current source revision at PRD authoring is `f2b4553e`。 | confirmed-source | `git rev-parse --short HEAD` | 仅作 authoring freshness 标记，不代表未来实施时 source 未变。 |
| `docs/contracts/domain-glossary.md` 存在但暂无条目。 | confirmed-source | `docs/contracts/domain-glossary.md` | 本 PRD 使用本地 glossary，不晋升项目级 glossary。 |
| Origin review 的 757 行计数是历史事实；当前命令确认 `SKILL.md` 为 756 行。 | confirmed-source | origin review + `wc -l` | PRD 采用当前 source facts。 |
| output-quality fixture 字段要求参考 `spec-write-tasks` 模式。 | source-candidate | `skills/spec-write-tasks/evals/output-quality-cases.json` referenced by input plan | 本次未完整读取该文件；只把它作为 pattern candidate，具体实现前需回源确认。 |

## Outstanding Questions

| question | blocks planning? | recommended default | owner |
| --- | --- | --- | --- |
| 后续是否要先更新现有 plan，使其显式以本 PRD 为 origin，再进入 implementation？ | no | 是。下一次 `spec-plan` / plan refine 应把本 PRD作为 WHAT origin，并保留原 plan 的 review evidence。 | product owner / workflow maintainer |

## Readiness Self-Check

- `planning_would_invent_what`: no blocking WHAT remains for the `spec-plan` quality refactor. Planning still owns implementation sequencing and exact file edits.
- `current-state claims without confirmed evidence`: origin review details and input plan implementation choices are advisory/source-candidate unless backed by current source reads above.
- `accepted_assumptions`: spec_id alignment with the existing plan chain; no external web research needed; no lifecycle schema expansion this round.
- `blocking_questions`: 0.
