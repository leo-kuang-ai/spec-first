---
title: "feat: Strengthen spec-prd sanitization and feature slices"
type: feat
status: completed
date: 2026-06-05
deepened: 2026-06-05
spec_id: 2026-06-05-002-spec-prd-sanitization-feature-slices
implements_schemas: []
---

# feat: Strengthen spec-prd sanitization and feature slices

## Summary

本计划增强 `spec-prd` 的 PRD 生产能力：在现有自适应产品专家质量闭环上，先消除 `quality_diagnosis` 命名与诊断维度 drift，再补齐 PRD 消毒、Feature Slices、source/SPEC/code 校准边界、readiness 检查和 `spec-plan` 轻量 handoff。实现方式保持轻量：先落 Markdown PRD section 和 workflow prose，不新增 `docs/prds/`、`prd/index.json`、`slice-manifest.json`、数值评分卡或新的 agent/schema。

---

## Problem Frame

当前 `spec-prd` 已经能从 existing PRD / draft 中做质量诊断、优化建议和最终 PRD rewrite，但它还缺少两块对复杂 PRD 最关键的结构化能力：

- **PRD 消毒**：把原始产品稿里的业务事实、技术建议、临时结论、未确认事实和非目标分层，避免下游把“建议实现”或“未确认口径”当成 PRD 真相。
- **功能切片 / Context Slice**：把大 PRD 结构化成可验收、可追溯、可进入上下文选择的功能点边界，使 `spec-plan`、`spec-work` 和 review 围绕同一组业务功能边界工作，而不是每阶段重新理解整篇 PRD。

这不是要把 `spec-prd` 做成需求评审器，也不是引入完整 PRD 平台。正确目标是：让 `spec-prd` 产出的 `artifact_kind: prd-requirements` 文档更稳定，让 `spec-plan` 不需要发明 WHAT 或自己拆业务功能。

结合 `docs/10-prompt/skill-reviews/2026-06-05-spec-prd-自适应产品专家深度分析.md` 后，本方案主体仍成立，但实施前需要补一个前置清理：当前自适应产品专家质量闭环存在 P3 级维护 drift，包括 `quality_diagnosis` / `quality_posture` 双字段名、诊断维度在 entrypoint/template/readiness 三处重复、`code alignment` 容易被误读成 HOW、以及 fresh-source eval 仍是 `not_run` 的证据诚实性边界。若不先收敛这些问题，Feature Slices 会叠加到一个已经轻微分叉的质量闭环上。

---

## Requirements

- R1. `spec-prd` 必须明确执行 PRD Sanitization：从原始 PRD/notes 中区分产品事实、技术方案建议、临时沟通结论、未确认事实、明确非目标和嵌入式 prompt/命令内容。
- R2. `spec-prd` 必须能在需要时生成 `## Feature Slices` PRD section，每个 slice 至少包含 stable ID、业务标题、摘要、原始片段/来源、requirements/acceptance refs、evidence、候选模块/source refs 和风险信号。
- R3. Feature slice 默认是 **context slice**，用于需求理解、证据选择和 planning handoff；不能自动升级为 execution/program slice。
- R4. SPEC、repo docs、code refs、code index、historical/archive case 只能校准领域边界、现状证据、候选路径、回归风险和设计前问题；不能新增产品需求、验收标准或 scope。
- R5. Readiness 必须检查功能切片质量：是否有验收、是否保留原始 evidence、是否按业务能力而非代码文件拆、是否映射到 Change Delta / R / AE、是否存在过多切片或跨 owner/program 风险。
- R6. `spec-plan` 消费 PRD-grade origin 时，应识别 Feature Slices 并在 plan 中保留 feature_id / requirement / acceptance trace，但不得复制 `spec-prd` readiness lens 或替 PRD 重新做产品拆分。
- R7. 改动必须保持现有 source/runtime 边界：只改 `skills/`、`tests/`、`docs/validation/`、`docs/plans/` 和 `CHANGELOG.md` 等 source；不手改 `.claude/`、`.codex/`、`.agents/skills/` runtime mirrors。
- R8. 改动必须有聚焦 contract tests、eval examples、fresh-source eval 记录或明确 `not_run` 原因，并更新 `CHANGELOG.md`。
- R9. 在引入 Feature Slices 前，必须统一自适应产品专家质量闭环的命名和 source-of-truth：采用单一 `quality_diagnosis` 概念，明确 `not-run` 只属于 run-local decision card，不在 emitted diagnosis block 中输出。
- R10. `Adaptive Product Expert Lens` 必须成为诊断维度的 canonical 清单；`SKILL.md` 和 `prd-readiness-lens.md` 只能 by-name 引用或补充 meta-check，不能复制一套近似但措辞不同的维度列表。
- R11. 行业与需求质量方法只能作为解释性锚点和 triggered guidance：允许引用 INVEST / EARS / Gherkin 解释 requirement quality、wording 和 acceptance，但不得新增 0-100 PRD 评分 schema、硬阈值或把行业 overlay 当 confirmed truth。

---

## Scope Boundaries

- 不新增 `docs/prds/`。
- 不新增 `prd/index.json`、`slice-manifest.json`、`requirement-contract.json` 或任何 machine-readable PRD schema。
- 不新增公开“产品专家 reviewer agent”或 helper reviewer entrypoint。
- 不新增“Feature Slice executor / slicer agent”来替代 `spec-prd` / `spec-plan` 的判断；Feature Slice 先是 PRD 内的 context/handoff 结构，不是 agent-dispatch 单元。
- 不把 Feature Slices 自动变成 task pack、program slice 或 execution slice。
- 不让 `spec-plan` 重新定义 PRD 的 WHAT；它只能消费 PRD 中已经稳定的 slice/trace。
- 不新增数值化 PRD 评分卡、LLM 评审分数或业界 hard-threshold rubric。
- 不默认读取或编辑 generated runtime mirrors。

### Deferred to Follow-Up Work

- Machine-readable Feature Slice contract：只有当 Markdown `## Feature Slices` 被 `spec-plan` 和 review 稳定消费后，再单独评估是否需要 schema。
- Program slice / multi-execution flow：只有当多个真实 PRD 显示跨 owner、跨发版窗口、跨领域交付痛点后再单独设计。
- Context selector integration：当前计划只让 PRD 与 plan handoff 可读，不引入新的 selector artifact。
- Feature Slice reviewer agent：只有当多个真实 PRD 显示主 orchestrator 持续漏切、错切或跨 owner 误判，且 `spec-doc-review` 现有 reviewer 无法覆盖时，再评估内部只读 reviewer agent；不得先做公开入口或执行型 agent。

---

## Direct Evidence Readiness

- target_repo: `.`
- evidence_sources: direct source reads, targeted `rg`, task-governance advisory helper, user-provided WeChat article extraction, `spec-prd` skill-review report, existing focused Jest contract tests
- source_refs:
  - `skills/spec-prd/SKILL.md`
  - `skills/spec-prd/references/prd-output-template.md`
  - `skills/spec-prd/references/prd-readiness-lens.md`
  - `skills/spec-prd/references/evidence-and-topology.md`
  - `skills/spec-prd/evals/examples.json`
  - `tests/unit/spec-prd-contracts.test.js`
  - `skills/spec-plan/SKILL.md`
  - `tests/unit/spec-plan-contracts.test.js`
  - `docs/02-架构设计/2026-06-05-spec-prd-执行流程与质量闭环分析.md`
  - `docs/10-prompt/skill-reviews/2026-06-05-spec-prd-自适应产品专家深度分析.md`
- current_revision: `865c4823`
- worktree_status: dirty; unrelated scale docs/test changes and runtime lock are present, so implementation must preserve existing user/session edits and only touch the files named in this plan.
- confidence: high for source shape, target files, and the decision to keep Feature Slices as Markdown context units; medium for downstream `spec-plan` consumption details until implementation reads exact current test assertions.
- limitations: no sub-agent research dispatch was used because current `spawn_agent` tool requires explicit user authorization; WeChat article and the skill-review report's external research are advisory methodology, not source-of-truth for current source behavior.

---

## Direct Evidence

- repo_scope: single repo, `spec-first`
- source_reads_completed:
  - `spec-prd` entrypoint already has `quality_diagnosis`, Adaptive Product Expert Lens, output shape, readiness handoff, and no-second-artifact topology boundary.
  - `prd-output-template.md` owns section skeleton, surface lenses, industry overlay, Adaptive Product Expert Lens, PRD Quality Diagnosis And Optimization, and embedded runtime skeleton.
  - `prd-readiness-lens.md` has Core, Quality Diagnosis, Topology, Domain/Decision, and Metrics/Overlay packs.
  - `tests/unit/spec-prd-contracts.test.js` asserts the compressed steel-frame topology and recently added quality diagnosis strings.
  - No current source hit defines `Feature Slices`, `context slice`, or `program slice` under `skills/spec-prd/**`.
  - `docs/10-prompt/skill-reviews/2026-06-05-spec-prd-自适应产品专家深度分析.md` confirms the Feature Slice plan direction, but flags P3 cleanups around `quality_diagnosis` naming, canonical diagnosis dimensions, WHAT-not-HOW code alignment wording, and fresh-source eval evidence honesty.
- source_reads_required during implementation:
  - Exact relevant assertions in `tests/unit/spec-prd-contracts.test.js` and `tests/unit/spec-plan-contracts.test.js`.
  - `skills/spec-plan/SKILL.md` PRD-origin intake section around `artifact_kind: prd-requirements`.
  - Existing fresh-source eval checklist before writing validation artifact.
- commands_or_tools_used:
  - `task-governance-signals` advisory helper returned `collection_status=ok`, `candidate_level=deep`, `risk_domains=[contract,runtime,workflow]`.
  - Focused `rg` confirmed Feature Slice terms are absent from current `spec-prd` source.
- impact_on_plan:
  - This is Deep because it changes workflow prose, PRD artifact shape, readiness checks, downstream plan intake, eval fixtures, and contract tests.
  - The first implementation should stay prose/test-focused; no CLI producer or schema should be introduced.
- key_findings:
  - The missing capability is not document review; it is PRD structuring before planning.
  - The valuable slice is a context/handoff unit, not an execution state machine.
  - Current source already protects against artifact topology sprawl; this plan must preserve that invariant.
  - The plan remains reasonable, but execution should first normalize the existing adaptive product expert quality loop so Feature Slices do not amplify existing drift.
  - Industry methods support qualitative diagnosis and actionable rewrite suggestions; they do not justify a numeric PRD scorecard.
- limitations:
  - The WeChat article was read through a local extraction tool and treated as advisory methodology.
  - No generated runtime mirrors were inspected as source evidence.

---

## Context & Research

### Relevant Code and Patterns

- `skills/spec-prd/SKILL.md` should remain the compact workflow spine. It can mention PRD Sanitization and Feature Slice posture, but detailed section skeletons belong in `prd-output-template.md`.
- `skills/spec-prd/references/prd-output-template.md` is the right home for `## Feature Slices` output shape, authoring rules, and examples.
- `skills/spec-prd/references/evidence-and-topology.md` is the right home for PRD/SPEC/code calibration boundaries because it already owns source-candidate and evidence rules.
- `skills/spec-prd/references/prd-readiness-lens.md` is the right home for a Feature Slice Pack.
- `skills/spec-prd/evals/examples.json` is the right place to add examples-as-context such as `large-prd-context-slice-not-program` and `code-module-split-rejected`.
- `tests/unit/spec-prd-contracts.test.js` is the existing contract test suite protecting `spec-prd` source topology and prompt contracts.
- `skills/spec-plan/SKILL.md` already treats `artifact_kind: prd-requirements` as a PRD-grade origin; it can be lightly extended to preserve `Feature Slices` when present.

### Institutional Learnings

- `docs/solutions/architecture-patterns/rebar-structure-skill-simplification-pattern-2026-06-04.md` records the recent `spec-prd` “steel frame” simplification pattern. The plan should strengthen the existing steel frame rather than add new template trees or packet infrastructure.
- `docs/02-架构设计/2026-06-05-spec-prd-执行流程与质量闭环分析.md` captures the current execution model and makes clear that `spec-prd` is a PRD production workflow, not a review workflow.
- `docs/10-prompt/skill-reviews/2026-06-05-spec-prd-自适应产品专家深度分析.md` concludes that the self-adaptive product expert direction is sound and all findings are P3, but recommends source-first cleanup of naming drift, duplicated dimension lists, WHAT-not-HOW wording, and fresh-source eval honesty before layering more PRD structure.

### Review Findings Incorporated

- **Still reasonable:** Markdown `## Feature Slices`, no schema, no agent, no `docs/prds/`, no program slicing, and `spec-plan` trace preservation are all consistent with the review's Light contract and 80/20 assessment.
- **Needs supplementation:** Add a first execution slice that normalizes `quality_diagnosis`, makes `Adaptive Product Expert Lens` the canonical dimension list, and keeps readiness packs to meta-checks such as lens fit, suggestion closure, and rewrite integrity.
- **Research boundary:** INVEST / EARS / Gherkin can improve explainability for requirement quality and acceptance wording, but they remain optional triggered guidance. The plan must explicitly reject a pseudo-precise PRD quality score.
- **Evidence boundary:** The persisted fresh-source eval artifact is still `status: not_run`; any session-local reviewer YAML remains advisory unless written as a validation artifact with a transcript or explicit `not_run` reason.

### External References

- WeChat article “03-复杂需求拆分：大 PRD 不能直接丢给 Agent” (`https://mp.weixin.qq.com/s/aPHjfK8YvyBfxiZoCE-jtQ`) is advisory. Its useful ideas are PRD sanitization, feature slices as context units, preserving original PRD excerpts, and avoiding automatic program/execution slicing.

---

## Key Technical Decisions

- KTD1. Use Markdown `## Feature Slices` first, not machine-readable `prd/index.json`.
  - Rationale: This keeps the light contract and lets `spec-plan` consume the structure with ordinary document reads. Schema should wait for demonstrated downstream demand.
- KTD2. Treat Feature Slices as context/handoff units by default.
  - Rationale: The article’s strongest warning is that big PRD does not imply multi-execution flow. Auto program slicing would create workflow state and review burden before value is proven.
- KTD3. Put PRD Sanitization rules in `prd-output-template.md` with entrypoint hooks in `SKILL.md`.
  - Rationale: Sanitization affects authoring shape and output placement. The entrypoint should stay concise and reference the rule rather than duplicate the full table.
- KTD4. Put calibration boundaries in `evidence-and-topology.md`.
  - Rationale: It already owns evidence tags and source-candidate boundaries. SPEC/code calibration is an extension of that boundary, not a new domain lens.
- KTD5. Let `spec-plan` preserve Feature Slice trace, not validate slice quality.
  - Rationale: Slice quality belongs to `spec-prd` readiness. `spec-plan` should identify unresolved WHAT gaps and route back, not copy the PRD readiness lens.
- KTD6. Normalize the adaptive product expert quality loop before adding Feature Slices.
  - Rationale: The review found only P3 issues, but Feature Slices will reuse the same template/readiness path. Fixing the `quality_diagnosis` naming and canonical dimension source first prevents a small drift from becoming a cross-section maintenance problem.
- KTD7. Use industry methods as explanatory anchors, not scoring machinery.
  - Rationale: INVEST, EARS, and Gherkin support better wording and acceptance trace, but the review found no credible basis for a numeric PRD scorecard. Keeping them as triggered guidance preserves LLM judgment and owner confirmation.

---

## Open Questions

### Resolved During Planning

- Should this plan add machine-readable PRD slice artifacts? No. Start with Markdown sections and contract tests; defer schemas until a real downstream consumer requires deterministic parsing.
- Should Feature Slices be mandatory for every PRD? No. Trigger for large, mixed-surface, multi-feature, refine/validate, or ambiguity-heavy PRDs; compact PRDs may omit it.
- Should `spec-doc-review` own feature slicing? No. It can review slice quality, but `spec-prd` owns PRD production and rewrite.
- Should this plan add a feature-slice execution or slicing agent? No. Existing workflow and reviewer infrastructure should first consume Markdown slices; an internal read-only reviewer agent is deferred until repeated real cases prove orchestration gaps.
- Should the PRD quality loop add a numeric scorecard? No. Use qualitative `quality_diagnosis`, concrete optimization suggestions, and readiness outcomes; do not introduce fake precision.

### Deferred to Implementation

- Exact wording and line placement in `SKILL.md` and references: decide while editing to keep line count and progressive disclosure healthy.
- Whether `tests/unit/spec-plan-contracts.test.js` already has the ideal section for feature-slice assertions: inspect exact current assertions during implementation.
- Whether the fresh-source eval can be dispatched: depends on explicit user authorization and current host tool contract at implementation time.

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```text
Raw PRD / Product Notes
  |
  v
PRD Sanitization
  |
  +-- product facts / goals / scope / acceptance
  +-- technical suggestions -> Evidence And Assumptions or design input note
  +-- temporary decisions -> source-tagged assumptions or Decision Notes
  +-- unknowns -> Outstanding Questions
  +-- explicit non-goals -> Scope Boundaries
  |
  v
Quality Diagnosis Normalization
  |
  +-- canonical quality_diagnosis naming
  +-- Adaptive Product Expert Lens as dimension source
  +-- readiness packs add meta-checks, not duplicate dimensions
  +-- code alignment confirms current WHAT, not HOW to change it
  |
  v
Current-State Evidence
  |
  +-- confirmed-source
  +-- user-stated
  +-- source-candidate
  +-- external-research
  +-- assumption
  |
  v
Feature Slices (context units)
  |
  +-- feature_id
  +-- business title / summary
  +-- requirement_refs / acceptance_refs
  +-- source excerpt / evidence
  +-- candidate modules / source refs
  +-- risk signals / cross-cutting notes
  |
  v
Final PRD Artifact
  docs/brainstorms/*-requirements.md
  |
  v
Readiness Lens
  |
  +-- Core Pack
  +-- Feature Slice Pack
  +-- Quality Diagnosis Pack
  +-- Topology / Domain / Metrics packs as triggered
  |
  v
spec-plan Handoff
  preserve feature_id trace
  do not invent WHAT
```

---

## Implementation Units

### U7. Normalize the adaptive product expert quality loop

**Goal:** Resolve the existing quality-loop drift before layering PRD Sanitization and Feature Slices onto the same template/readiness path.

**Requirements:** R7, R8, R9, R10, R11

**Dependencies:** None. Execute this unit before U1, U2, and U4 even though the U-ID is U7; the plan was deepened after U1-U6 existed, so existing U-IDs must not be renumbered.

**Files:**
- Modify: `skills/spec-prd/SKILL.md`
- Modify: `skills/spec-prd/references/prd-output-template.md`
- Modify: `skills/spec-prd/references/prd-readiness-lens.md`
- Modify: `tests/unit/spec-prd-contracts.test.js`
- Add or update as needed: `docs/validation/spec-prd/fresh-source-eval-YYYY-MM-DD-*.md`

**Approach:**
- Use `quality_diagnosis` as the single concept name across the run-local decision card and emitted diagnosis block.
- Keep `not-run` as a decision-card-only state. The emitted diagnosis block should use only `ready | minor-gaps | material-gaps | blockers` because an emitted refine/validate diagnosis has run by definition.
- Make `Adaptive Product Expert Lens` in `prd-output-template.md` the canonical quality-dimension list.
- Replace repeated quality-dimension prose in `SKILL.md` and `prd-readiness-lens.md` with by-name references plus true meta-checks:
  - lens fit;
  - optimization suggestion closure;
  - rewrite integrity;
  - handoff entropy.
- Add a direct WHAT-not-HOW guard to the code-alignment dimension: code alignment confirms what the current system does and where evidence points, not how implementation should change.
- Align the Quality Diagnosis Pack trigger with the intended refine/validate/product-expert critique scope. Rough notes can trigger it only when they are being refined or validated as PRD input, not as a blanket create-mode requirement.
- Add optional INVEST/EARS/Gherkin wording as explanatory anchors for requirement quality and acceptance only where it improves clarity; do not add scoring thresholds or a new schema.
- Preserve the no-agent/no-second-artifact boundary: this is source prose and tests, not a new product-expert reviewer entrypoint.

**Patterns to follow:**
- `docs/10-prompt/skill-reviews/2026-06-05-spec-prd-自适应产品专家深度分析.md` §3-§4 P3 findings and recommended order.
- Existing `quality_diagnosis` decision-card posture in `skills/spec-prd/SKILL.md`.
- Existing “Reuse the existing Requirements Readiness Gate by reference” discipline in `skills/spec-prd/references/prd-readiness-lens.md`.

**Test scenarios:**
- Contract: `SKILL.md` and `prd-output-template.md` use `quality_diagnosis`, not a competing `quality_posture` field.
- Contract: tests assert `not-run` is card-only and not part of the emitted diagnosis values.
- Contract: `prd-output-template.md` contains the canonical Adaptive Product Expert Lens dimensions and explicitly states code alignment is WHAT/current-state evidence, not implementation design.
- Contract: `prd-readiness-lens.md` references the Adaptive Product Expert Lens by name and does not duplicate the full dimension list.
- Contract: no numeric PRD scorecard, no new agent type, and no new PRD schema appears in `skills/spec-prd/**`.

**Verification:**
- Focused `spec-prd` contract suite passes.
- `git diff --check` passes.
- Fresh-source eval status is honest: `passed`/`concerns` only with a durable reviewer artifact, otherwise `not_run` with the dispatch authorization reason.

---

### U1. Add PRD Sanitization to the spec-prd workflow spine

**Goal:** Make PRD Sanitization an explicit run-local step before current-state analysis and drafting, without bloating `SKILL.md`.

**Requirements:** R1, R7

**Dependencies:** U7

**Files:**
- Modify: `skills/spec-prd/SKILL.md`
- Modify: `tests/unit/spec-prd-contracts.test.js`

**Approach:**
- Add `sanitization_status` or equivalent run-local decision-card posture only if it materially improves handoff; avoid creating a schema-like field if concise prose is enough.
- In Phase 0 or Phase 1, state that raw PRD/notes must be separated into:
  - product facts/goals/scope/acceptance;
  - technical suggestions;
  - temporary communication conclusions;
  - unconfirmed facts;
  - explicit non-goals;
  - embedded agent instructions/commands.
- Keep the existing untrusted-content rule intact and make sanitization an authoring discipline, not a security parser.
- Update contract tests to assert the entrypoint names PRD Sanitization but does not introduce new references or generated runtime edits.

**Patterns to follow:**
- Existing `quality_diagnosis` entrypoint hook in `skills/spec-prd/SKILL.md`.
- Existing “do not create standalone context, ADR, or runtime artifacts” language.
- U7 canonical naming and Adaptive Product Expert Lens boundaries.

**Test scenarios:**
- Contract: `SKILL.md` contains PRD Sanitization and the expected raw-content categories.
- Contract: `SKILL.md` still references only the four existing source references.
- Contract: generated runtime mirror paths are still mentioned only as non-source boundaries.

**Verification:**
- Focused `spec-prd` contract suite passes and `SKILL.md` remains within the current compact line-count budget or an intentionally adjusted budget.

---

### U2. Add Feature Slices as a PRD output section

**Goal:** Define `## Feature Slices` in the PRD output template as the lightweight structure for large/complex PRDs.

**Requirements:** R2, R3, R5, R7

**Dependencies:** U1

**Files:**
- Modify: `skills/spec-prd/references/prd-output-template.md`
- Modify: `tests/unit/spec-prd-contracts.test.js`

**Approach:**
- Add `## Feature Slices` to Conditional Sections, triggered for large PRDs, multiple feature groups, mixed-surface changes, refine/validate inputs with multiple goals, or PRDs where planning would otherwise need to infer feature boundaries.
- Define minimal slice fields:
  - `feature_id`
  - `title`
  - `summary`
  - `requirement_refs`
  - `acceptance_refs`
  - `source_excerpt_or_claim`
  - `evidence`
  - `candidate_modules_or_source_refs`
  - `risk_signals`
- Include authoring rules:
  - slice by business capability/outcome, not code module;
  - preserve original PRD text or source claim;
  - no slice without acceptance or explicit trace gap;
  - cross-cutting concerns go into cross-cutting notes or risk signals, not fake feature slices;
  - 3-7 slices is a common healthy range, but not a hard rule;
  - more than 10 slices triggers split/owner confirmation rather than silent expansion.
- Explicitly state `Feature Slices` are context units, not execution units.

**Patterns to follow:**
- Existing `Output Shape`, `Adaptive Product Expert Lens`, and topology-heavy section examples in `prd-output-template.md`.
- Current closeout summary list, which can be extended with feature slice counts and trace gaps.

**Test scenarios:**
- Contract: output template contains `## Feature Slices`, `feature_id`, `requirement_refs`, `acceptance_refs`, source excerpt/evidence, and candidate module/source refs.
- Contract: output template says slices are context units and not execution/program slices.
- Contract: output template rejects Controller/Service/DAO-style code-module slicing as the default PRD slice.
- Contract: output template still does not reference `docs/prds/`, `prd/index.json`, or `slice-manifest.json` as default artifacts.

**Verification:**
- Focused `spec-prd` contract suite passes and the template remains the single packaged runtime skeleton source.

---

### U3. Add calibration-source boundaries to evidence-and-topology

**Goal:** Make the PRD/SPEC/code boundary explicit so source/docs/code analysis improves slice quality without adding product scope.

**Requirements:** R4, R7

**Dependencies:** U2

**Files:**
- Modify: `skills/spec-prd/references/evidence-and-topology.md`
- Modify: `tests/unit/spec-prd-contracts.test.js`

**Approach:**
- Add a compact “Calibration Source Boundary” section:
  - PRD/user decisions decide current product WHAT and acceptance.
  - Project docs/SPEC/glossary can calibrate canonical terms, domain boundaries, existing rules, and design-before-planning questions.
  - Source/code/tests can confirm current behavior, active surfaces, candidate paths, regression risks, and contradictions.
  - Prior plans/learnings/archive cases can warn about historical risks, not replace current acceptance.
- Add negative rules:
  - calibration sources must not create new product requirements;
  - code index/source candidates must not infer user goals;
  - SPEC must not override explicit PRD non-goals without owner confirmation.
- Tie this boundary to Feature Slices: candidate modules/source refs are evidence pointers, not scope authority.

**Patterns to follow:**
- Existing `Candidate Boundary`, `Current-State Coverage`, `Owner Question Ladder`, and `Confirmed Claim Rule`.

**Test scenarios:**
- Contract: evidence reference states PRD decides WHAT and calibration sources cannot add requirements.
- Contract: code refs/code index are candidate/context evidence, not product goal authority.
- Contract: archive/prior cases are risk reminders only.

**Verification:**
- Focused `spec-prd` contract suite passes.

---

### U4. Add Feature Slice readiness checks and handoff summary

**Goal:** Ensure `spec-prd` fails or routes appropriately when Feature Slices are low quality or would cause planning to invent WHAT.

**Requirements:** R5, R8

**Dependencies:** U2, U3

**Files:**
- Modify: `skills/spec-prd/references/prd-readiness-lens.md`
- Modify: `skills/spec-prd/SKILL.md`
- Modify: `skills/spec-prd/references/prd-output-template.md`
- Modify: `tests/unit/spec-prd-contracts.test.js`

**Approach:**
- Add a `Feature Slice Pack` triggered when `## Feature Slices` is present or when PRD complexity suggests slices should exist.
- Check:
  - each slice has stable ID, business-readable title, source/evidence, requirement refs, and acceptance refs or explicit trace gaps;
  - slices map to Change Delta and core requirements;
  - slices are not purely code-layer partitions;
  - cross-cutting risks are visible;
  - large slice count or cross-owner/cross-release signals lead to split recommendation or owner confirmation;
  - program/execution slice decisions are not silently made by `spec-prd`.
- Extend closeout summary to include:
  - `feature_slice_count`;
  - `feature_ids`;
  - uncovered slices;
  - feature-to-R/AE trace gaps;
  - cross-cutting risk count;
  - split recommendation / owner confirmation status when slice count, cross-owner scope, or cross-release risk suggests program or execution slicing.

**Patterns to follow:**
- Existing `Quality Diagnosis Pack` and handoff entropy check in `prd-readiness-lens.md`.
- Existing closeout summary list in `prd-output-template.md`.

**Test scenarios:**
- Contract: readiness lens contains `Feature Slice Pack`.
- Contract: readiness fails or asks owner when slices lack acceptance/source evidence.
- Contract: readiness distinguishes context slice from program slice.
- Contract: closeout summary includes feature slice count and trace gap language.

**Verification:**
- Focused `spec-prd` contract suite passes.

---

### U5. Teach spec-plan to preserve Feature Slice trace lightly

**Goal:** Make `spec-plan` consume `## Feature Slices` as PRD-origin trace without duplicating `spec-prd` readiness or taking ownership of feature slicing.

**Requirements:** R6, R7

**Dependencies:** U4

**Files:**
- Modify: `skills/spec-plan/SKILL.md`
- Modify: `tests/unit/spec-plan-contracts.test.js`

**Approach:**
- In the `artifact_kind: prd-requirements` origin handling section, add that when an origin PRD includes `## Feature Slices`, planning should preserve feature IDs, requirement refs, acceptance refs, and source/evidence pointers in Context / Requirements / Implementation Units where relevant.
- Add boundary language:
  - If the plan would need to invent missing slice acceptance, source-of-truth, or scope, route back to PRD refine or emit a PRD feedback candidate.
  - Do not copy the full `spec-prd` Feature Slice Pack.
  - Do not generate program slices or task packs during planning.
- Implementation units can cite feature IDs in `Requirements` or approach when they map cleanly to one or more slices.

**Patterns to follow:**
- Existing `spec-plan` PRD-grade origin handling for `artifact_kind: prd-requirements`.
- Existing “do not copy the full `spec-prd` readiness lens” boundary.

**Test scenarios:**
- Contract: `spec-plan` mentions `## Feature Slices` as PRD origin trace.
- Contract: `spec-plan` preserves feature IDs but does not own Feature Slice readiness.
- Contract: unresolved slice WHAT gaps route back to PRD refine / feedback candidate.

**Verification:**
- Focused `spec-plan` contract suite passes.

---

### U6. Update eval fixtures, validation artifacts, docs, and changelog

**Goal:** Lock the new behavior into examples and validation evidence without claiming runtime behavior that was not tested.

**Requirements:** R8

**Dependencies:** U1, U2, U3, U4, U5

**Files:**
- Modify: `skills/spec-prd/evals/examples.json`
- Modify: `tests/unit/spec-prd-contracts.test.js`
- Modify: `tests/unit/spec-plan-contracts.test.js`
- Add: `docs/validation/spec-prd/fresh-source-eval-YYYY-MM-DD-*.md`
- Modify: `CHANGELOG.md`

**Approach:**
- Add eval cases:
  - `quality-diagnosis-canonical-name`
  - `adaptive-lens-canonical-dimensions`
  - `code-alignment-what-not-how`
  - `no-prd-scorecard`
  - `large-prd-context-slice-not-program`
  - `prd-sanitization-technical-suggestion`
  - `feature-slice-with-original-excerpt`
  - `code-module-split-rejected`
  - `spec-calibration-not-new-requirement`
  - `over-10-slices-ask-owner`
  - `feature-without-acceptance-readiness-fail`
  - `spec-plan-preserves-feature-slice-trace`
- Run focused contract tests for `spec-prd` and `spec-plan`.
- Run `npm run typecheck` if JS tests or scripts are touched.
- Run `git diff --check`.
- For fresh-source eval:
  - If user explicitly authorizes sub-agent dispatch, run a fresh read-only reviewer with current disk source snippets.
  - Otherwise record `fresh_source_eval: not_run` with the dispatch authorization reason; do not claim semantic pass.
- Update `CHANGELOG.md` with `(user-visible)` because PRD workflow behavior changes.

**Patterns to follow:**
- Existing `docs/validation/spec-prd/fresh-source-eval-2026-06-05-product-expert-quality-loop.md` honesty boundary.
- Existing `tests/unit/spec-prd-contracts.test.js` examples-as-context assertions.

**Test scenarios:**
- Contract: quality-loop cleanup eval IDs are present and expected behavior rejects duplicate quality posture naming and numeric scorecards.
- Contract: eval IDs are present and expected behavior includes PRD sanitization and context-slice-not-program boundaries.
- Validation: fresh-source eval artifact status is honest (`passed`, `concerns`, or `not_run`).
- Changelog: project source change has a top-level entry with the global developer profile author.

**Verification:**
- Focused contract suites pass.
- Typecheck passes when applicable.
- Diff check passes.

---

## System-Wide Impact

- **Interaction graph:** `spec-prd` PRD artifact becomes richer; `spec-plan` consumes Feature Slice trace; `spec-doc-review` can later review slice quality but does not own generation.
- **Error propagation:** Missing slice acceptance/source evidence should become PRD readiness failure or `ask-owner`, not a planning-time technical decision.
- **State lifecycle risks:** No new durable runtime state is introduced. Markdown PRD remains the canonical artifact.
- **Quality-loop lifecycle:** `quality_diagnosis` becomes the single qualitative posture across decision card and emitted diagnosis; the Adaptive Product Expert Lens becomes the reusable diagnosis dimension source.
- **API surface parity:** Claude `spec-prd` and Codex `spec-prd` share the same source skill; no host-specific behavior should be introduced.
- **Integration coverage:** Contract tests across `spec-prd` and `spec-plan` prove prose contract visibility; semantic behavior still benefits from fresh-source eval when dispatch is explicitly allowed.
- **Unchanged invariants:** `docs/brainstorms/*-requirements.md` remains the PRD artifact path; generated mirrors are not source; scripts/tools prepare facts while LLM owns PRD judgment.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Feature Slices turn into a second task-pack system | Explicitly state slices are context/handoff units, not execution units; no schema or task artifact in this plan. |
| `spec-prd` grows beyond the steel-frame structure | Keep detailed rules inside existing references; avoid adding new reference files unless implementation proves one section is too large. |
| Quality diagnosis drift becomes harder to maintain after Feature Slices | Execute U7 first; use one `quality_diagnosis` name and make the Adaptive Product Expert Lens the canonical dimension list. |
| PRD quality work becomes a pseudo-precise scorecard | Keep qualitative postures and concrete rewrite suggestions; use INVEST/EARS/Gherkin only as wording anchors, not scoring machinery. |
| `spec-plan` starts doing PRD readiness | Add only preservation/route-back language; tests assert it does not copy the full readiness lens. |
| SPEC/code calibration silently adds product requirements | U3 adds explicit negative rule and tests assert it. |
| Code alignment wording leaks into HOW | U7 adds a direct guard that code/source evidence confirms current behavior and risk, not implementation design. |
| A feature-slice agent becomes a hidden execution planner | Keep agent addition deferred; use `spec-doc-review` and PRD readiness first, and require repeated real failures before adding an internal read-only reviewer. |
| Contract tests become brittle keyword checks | Prefer multi-snippet assertions tied to source sections, matching existing test style; avoid broad single-word checks. |
| Fresh-source eval cannot run | Record `not_run` with exact dispatch/runtime/user-disable reason; do not claim pass. |
| Dirty worktree conflicts with parallel scale edits | Touch only planned files; do not revert unrelated `docs/01-需求分析/13.scale集成/**` or `tests/unit/scale-provider-doc-contracts.test.js` changes. |

---

## Documentation / Operational Notes

- Update `docs/02-架构设计/2026-06-05-spec-prd-执行流程与质量闭环分析.md` only if implementation materially changes the flow described there. Otherwise leave it as the snapshot evidence for this plan.
- No README update is required for the first implementation unless the user-facing command behavior or artifact topology changes beyond PRD section content.
- No runtime regeneration is required for source validation. If the user needs current host runtime mirrors refreshed after source changes, run `spec-first init` as a separate source-driven runtime regeneration step.

---

## Alternative Approaches Considered

| Approach | Decision | Rationale |
| --- | --- | --- |
| Add `docs/prds/` and generated `prd/index.json` / `slice-manifest.json` | Rejected | Creates a second artifact topology and machine contract before a stable consumer exists. |
| Put all slice rules in `SKILL.md` | Rejected | Violates progressive disclosure and risks undoing the recent steel-frame simplification. |
| Let `spec-doc-review` own feature slicing | Rejected | Review can critique slices, but PRD production and rewrite belong in `spec-prd`. |
| Let `spec-plan` infer slices from any PRD | Rejected | Planning should not invent WHAT. It can preserve slices already supplied by PRD and route back when missing. |
| Auto-upgrade large PRDs to program/execution slices | Rejected | PRD length usually means context needs splitting, not necessarily delivery needs splitting. Owner confirmation is required for execution boundaries. |
| Add a Feature Slice execution/slicer agent now | Rejected | The current problem is PRD structure and readiness, not agent dispatch. Adding an agent now would create governance, authorization, and execution-boundary cost before the Markdown slice contract has proven insufficient. |
| Add a numeric PRD quality scorecard | Rejected | The review found evidence for qualitative diagnosis and actionable improvement, not credible numeric thresholds. A scorecard would create fake precision and another schema-like contract. |

---

## Sources & References

- Related source: `skills/spec-prd/SKILL.md`
- Related source: `skills/spec-prd/references/prd-output-template.md`
- Related source: `skills/spec-prd/references/prd-readiness-lens.md`
- Related source: `skills/spec-prd/references/evidence-and-topology.md`
- Related tests: `tests/unit/spec-prd-contracts.test.js`
- Related source: `skills/spec-plan/SKILL.md`
- Related tests: `tests/unit/spec-plan-contracts.test.js`
- Analysis snapshot: `docs/02-架构设计/2026-06-05-spec-prd-执行流程与质量闭环分析.md`
- Skill review: `docs/10-prompt/skill-reviews/2026-06-05-spec-prd-自适应产品专家深度分析.md`
- Validation precedent: `docs/validation/spec-prd/fresh-source-eval-2026-06-05-product-expert-quality-loop.md`
- External advisory article: `https://mp.weixin.qq.com/s/aPHjfK8YvyBfxiZoCE-jtQ`
