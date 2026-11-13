---
title: feat: 为 spec-code-review 新增 CRG impact reviewer
type: feat
status: superseded
date: 2026-05-22
spec_id: 2026-05-22-003-crg-impact-review-agent
target_repo: spec-first
origin: "用户请求：在不改动现有 spec-code-review 内容的前提下，新增一个 agent 集成 code-review-graph 能力"
superseded_by: docs/plans/2026-05-25-001-gitnexus-only-graph-provider-plan.md
---

# feat: 为 spec-code-review 新增 CRG impact reviewer

> Superseded: 本计划不再作为 active 开发入口。CRG 已不再是 active graph provider，新增 `spec-crg-impact-reviewer` 的方向与 GitNexus-only provider 决策冲突；如后续仍需要 impact reviewer，应另开 GitNexus/graph impact reviewer plan，并复用 GitNexus evidence boundary。

## Summary

本计划采用最小有效侵入方式增强 `spec-code-review`：新增一个 `spec-crg-impact-reviewer`，并在现有 reviewer selection / dispatch / synthesis 流程中增加薄编排，让 CRG 的影响面、调用者、affected flows 和 test gap 证据进入 review 闭环。现有 reviewer 内容、findings schema、confidence gate、dedup、autofix mode 和最终合成规则保持不变。

---

## Problem Frame

当前 `spec-code-review` 已经有分层 reviewer、confidence-gated findings、merge/dedup 和 mode-aware autofix/report-only 边界，但 CRG 只作为图谱 readiness / advisory evidence 出现在上下文说明中，尚未形成一个专门消费 CRG review evidence 的 review lens。

CRG 官方 review 设计的价值不是替代 code reviewer，而是提前发现“变更影响谁、哪些 execution flows 被触达、哪些 callers / tests 需要补看、blast radius 是否超出 diff 表面”。这些能力与现有 correctness/testing/maintainability/security reviewer 是互补关系。最稳妥的集成方式是新增一个只负责影响面审查的 agent，并让 orchestrator 提供 CRG evidence status，而不是重写 `spec-code-review` 或引入新的 review 入口。

本计划的核心判断是：这是最小有效侵入，不是零侵入。需要新增 agent profile、persona catalog 条目、条件选择规则和 evidence block；但不改写现有 reviewer 的角色定义，也不让 CRG risk score 直接决定 severity、routing 或 merge gate。

---

## Requirements

- R1. 新增 `spec-crg-impact-reviewer`，职责限定为 CRG-backed impact review：blast radius、affected flows、callers/dependents、test coverage gaps、rename/move/public/shared symbol risk。
- R2. 新 reviewer 必须复用现有 `skills/spec-code-review/references/findings-schema.json`，返回 P0-P3 severity、0/25/50/75/100 confidence、`autofix_class`、owner、evidence 等标准字段。
- R3. 新 reviewer 必须把 CRG evidence 当 advisory evidence，不能把 CRG risk score 直接升级为 finding severity 或 merge gate。
- R4. 本计划只在以下范围内修改 `spec-code-review` 与共享上下文：persona-catalog 注册新 reviewer、SKILL.md reviewer selection / Stage 4 spawn enumeration / Coverage 措辞、subagent-template 增加可选 `<graph-review-evidence>` slot、review-output-template Coverage 段。**不变项**（任何 unit 都不得修改其语义）：每个现有 reviewer 的 role ownership、findings-schema severity 范围（P0–P3）与 confidence anchors（0/25/50/75/100）、Stage 5 dedup 规则、Stage 5 cross-reviewer agreement promotion、mode-aware demotion 行为、autofix/report-only/headless 边界。新增 slot 默认 rendered string 为空时，对未持有该 slot 的现有 reviewer，prompt 行为应保持 byte-level 等价；实施期需要回归对比证据，仅靠 "When empty equivalent" 措辞不构成证明。
- R5. `spec-code-review` 不运行 CRG `build` / `update` / `build_or_update_graph_tool` / watcher / daemon / git hook；durable refresh 仍由 `$spec-graph-bootstrap` 负责。
- R6. Graph stale、unavailable、provider degraded 或 report-only no-temp-artifact 时，review 必须降级：记录 Coverage limitation，必要时建议 `$spec-graph-bootstrap`，但不把 reviewer failure 当作代码 finding。
- R7. CRG evidence 注入必须使用 bounded block，并标记 freshness、source、provider、reason_code、limitations；evidence excerpt 作为 untrusted quoted data。v1 候选字段：provider、readiness、freshness/stale reason、target repo、changed files、available capabilities、session-local evidence summary、omitted evidence、limitations。**Advisory**：若 v1 实施后发现部分字段（典型如 `available_capabilities` 与 readiness 重合、`omitted_evidence` 与 limitations 重合）形成冗余，可作为 follow-up 收敛到 4–5 字段并并入 `crg-review-evidence.v1`。
- R8. 首版只做薄编排：条件选择 CRG reviewer、传递 CRG/readiness/evidence block、合成 Coverage。**首版不调整 `review-pre-facts` helper 的 provider preference 选择算法**（即 `computeReadiness` 的 target_provider 选择保持现状）；首版仅消费 helper 已经产出的 normalized inventory 与 readiness facts。更丰富的 CRG live evidence packet、code-review workflow-aware provider preference、`crg-review-evidence.v1` 都作为 follow-up 接入 `review-pre-facts`。
- R9. 支持当前 spec-first 的三种研发拓扑：单仓单项目、单仓多模块、多仓 workspace。写入、autofix、finding file path 和 graph evidence 必须保持 repo-scoped。
- R10. 所有 source 变更遵守 source-first；不手改 `.claude/`、`.codex/`、`.agents/skills/` generated runtime mirrors。

---

## Scope Boundaries

- 不把 CRG 官方 `review-changes`、`review-delta`、`review-pr` skill 原样导入 spec-first。
- 不新增 `$spec-crg-review`、`$review-delta`、`$review-pr` 等并行 review 入口。
- 不把 CRG 包装成 provider adapter 之外的状态机，也不让 agent 负责 graph refresh。
- 不改变 existing reviewers 的判断口径、schema、severity scale、confidence gate 或 autofix policy。
- 不把 GitNexus、CRG 或其他 provider 的自然语言输出当 confirmed truth。
- 不新增 repo-local durable CRG review artifact；review run artifact 仍遵守现有 temp artifact boundary。

### Deferred to Follow-Up Work

- `review-pre-facts` 的 CRG-first code-review query plan：把 `get_minimal_context`、`detect_changes`、`get_affected_flows`、`query_graph(pattern="tests_for")`、`get_impact_radius` 规范化为 `crg-review-evidence.v1`。
- `review-pre-facts` helper 的 workflow-aware provider preference：把 `computeReadiness` 的 target_provider 选择从 workflow-agnostic（当前硬编码偏好 gitnexus）改为 workflow-aware（code-review 偏好 code-review-graph，doc-review 保持现状），并配套 doc-review 路径的回归证据。
- 基于真实 review runs 的 reviewer selection threshold 校准，例如 risk score、test gap count、affected flow count 与 selected team 的对应关系。
- 对 CRG official MCP live tools 的 host capability catalog 投影；首版只消费已有 graph readiness / capability facts 和 session-local evidence。

---

## Graph Readiness

- target_repo: `spec-first`
- status: stale
- source_revision: `b21bafa5a3b6d649464e70fb0432fead4203bf26`
- current_revision: `943eb59daf511045c89e9690b567d58176d47914`
- stale: true
- primary_providers: `code-review-graph`, `gitnexus`
- degraded_providers: none in compiled provider status
- fallback_capabilities: `ast-grep`, bounded direct repo reads
- runtime_mcp_evidence: not used; this plan uses bounded source reads and the local `code-review-graph` source checkout as external reference
- confidence: medium
- limitations: compiled graph facts are stale because the recorded source revision differs from current `HEAD`; this plan does not make graph-backed impact claims about current code. Implementation should rerun `$spec-graph-bootstrap` before validating graph-heavy behavior or rely on explicitly captured session-local CRG evidence.

---

## Context & Research

### Relevant Code and Patterns

- `skills/spec-code-review/SKILL.md`: owns reviewer selection, runtime readiness, dispatch, merge/dedup, confidence gate, Coverage, and graph freshness boundary.
- `skills/spec-code-review/references/persona-catalog.md`: owns reviewer catalog and selection descriptions.
- `skills/spec-code-review/references/subagent-template.md`: owns leaf reviewer output contract, confidence anchors, false-positive suppression, and read-only reviewer rules.
- `skills/spec-code-review/references/findings-schema.json`: remains the output schema for the new CRG reviewer.
- `src/cli/helpers/review-pre-facts.js`: already contains review pre-facts readiness, query-plan, provider-results normalization, rendering, and code-review target extraction; future CRG evidence packet should reuse this helper instead of adding a parallel facts pipeline.
- `docs/contracts/workflows/review-pre-facts-extraction.md`: defines the advisory pre-facts trust model and report-only no-temp-artifact boundary.
- `skills/spec-graph-bootstrap/SKILL.md`: remains the durable graph refresh owner.

### External Local Source: code-review-graph

The external CRG source repo shows three official review skills:

- `skills/review-changes/SKILL.md`: change review via `detect_changes`, `get_affected_flows`, `tests_for`, `get_impact_radius`, minimal-first.
- `skills/review-delta/SKILL.md`: focused delta review using changed nodes plus 2-hop neighbors and blast-radius context.
- `skills/review-pr/SKILL.md`: PR/branch review using `get_review_context`, `get_impact_radius`, `callers_of`, `tests_for`.

Relevant CRG tools in the source include:

- `get_minimal_context_tool`
- `detect_changes_tool`
- `get_affected_flows_tool`
- `query_graph_tool` with `callers_of` and `tests_for`
- `get_impact_radius_tool`
- `get_review_context_tool`

CRG official prompts emphasize minimal-first usage: call `get_minimal_context` first, use minimal detail by default, expand only for medium/high risk, and keep review queries targeted.

### Institutional Learnings

- `docs/plans/2026-05-07-003-feat-code-review-graph-evidence-preflight-plan.md` proposed a broader CRG evidence preflight and `spec-graph-impact-reviewer`. This plan intentionally narrows that idea to one new reviewer plus thin orchestration.
- `docs/plans/2026-05-11-007-feat-review-pre-facts-injection-plan.md` established the shared pre-facts foundation. This plan reuses that boundary instead of creating a second CRG-specific extraction pipeline.
- `docs/plans/2026-05-18-001-refactor-crg-primary-gitnexus-optional-plan.md` positions CRG as the core impact/review provider and GitNexus as optional global-knowledge enhancement; this plan follows that provider-role direction.

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```text
spec-code-review
  |
  |-- Stage 1/2: diff scope + intent + optional plan
  |
  |-- Stage 3: scale-aware reviewer selection
  |     |
  |     |-- existing core/conditional reviewers unchanged
  |     |
  |     `-- CRG impact selector
  |           - read graph readiness/capability status
  |           - selection 基于 diff-surface signals（不依赖 graph 状态）
  |           - graph fresh: CRG signals（affected-flow / test-gap / risk）加权
  |           - graph stale/unavailable: 不阻断 selection；evidence block tier=unavailable
  |           - 任何状态下都不触发 refresh
  |           - 在 D6 边界判断 reviewer 是否被选中
  |
  |-- Stage 4: dispatch reviewers
  |     |
  |     |-- existing reviewers receive existing context
  |     |
  |     `-- spec-crg-impact-reviewer receives <graph-review-evidence>
  |
  |-- Stage 5/6: existing schema validation + dedup + confidence gate + Coverage
        |
        `-- CRG findings are merged like any other reviewer finding
```

---

## Key Technical Decisions

- D1. Add a new reviewer rather than rewriting existing reviewers. This preserves current review behavior while adding a specialized impact lens.
- D2. Name the new agent `spec-crg-impact-reviewer`. The name makes the provider dependency and review responsibility explicit.
- D3. Keep CRG evidence advisory. The reviewer may use CRG to direct inspection, but each finding still needs concrete code evidence and anchored confidence.
- D4. Do not run refresh from review. Review consumes compiled or session-local evidence and recommends `$spec-graph-bootstrap` when graph-heavy claims need fresh durable facts.
- D5. Reuse `review-pre-facts` for future richer evidence. Scripts prepare provider facts; LLM/agent decides whether impact evidence supports a finding.
- D6. Conditional selection 基于 **diff-surface signals**（不依赖 graph readiness 状态）：public/shared symbols、CLI/runtime/provider/contract changes、API/route/schema surfaces、cross-module changes、changed-executable-files-count 阈值、rename/move、用户意图为 graph-heavy review。CRG-derived signals（high affected-flow count、test-gap signal、risk score）仅在 `code-review-graph` `query_ready=true` 且 readiness fresh 时作为 **加权信号**叠加到 selection；stale / unavailable 时这些 graph-derived signals 不参与选择，但 reviewer 自身仍可能基于 diff-surface signals 被选中，evidence block 标 `tier=unavailable`，reviewer 走 bounded source reads。这样避免把 stale graph 当作 selection 的硬依赖。
- D7. Multi-repo behavior is repo-scoped. Each child repo gets its own graph readiness/evidence limitation; findings never merge evidence across repo roots.
- D8. v1 默认仅向 `spec-crg-impact-reviewer` 注入 `<graph-review-evidence>` block；其他 reviewer 不接收该 block，避免共享 prompt 膨胀，也避免触发 R4 中"现有 reviewer 行为不变"的回归面。Coverage 段保留 graph evidence status 的合成摘要供所有 reviewer 共享的语义层使用。该决策可逆：若 follow-up `crg-review-evidence.v1` 接入后发现 share path 更简洁，再统一调整。
- D9. User constraint interpretation: 本计划将 origin 中“不改动现有 `spec-code-review` 内容”解释为不改变现有 reviewer role ownership、findings schema、confidence/severity anchors、dedup、routing、autofix/report-only/headless 语义；允许为接入新 reviewer 做必要的 orchestration、catalog、template slot 和 Coverage wording 编辑。若后续确认用户要求字面意义上的零 `skills/spec-code-review/**` 修改，则本计划应拆为独立 agent profile + 后续显式 wiring follow-up，而不是在本轮继续修改 orchestrator。

---

## Open Questions

### Resolved During Planning

- Should CRG be integrated by modifying existing reviewers? No. Add a new reviewer and keep existing reviewer content unchanged.
- Should `spec-code-review` refresh `.code-review-graph/` or provider storage? No. Refresh remains `$spec-graph-bootstrap`; review only consumes evidence.
- Should CRG official review skills become new user-facing entries? No. Their practices inform the reviewer/evidence design, but `$spec-code-review` remains the entrypoint.
- Should `<graph-review-evidence>` be exposed to all reviewers or only the CRG reviewer? **Only the CRG reviewer**（v1 默认），其他 reviewer 不接收该 block。Coverage 段合成 graph evidence status 给所有 reviewer 共享的语义层（D8）。

### Deferred to Implementation

- Exact selector threshold for CRG reviewer: implementation should start conservative and adjust after real review runs.
- Exact CRG live evidence format: first implementation can use a bounded `<graph-review-evidence>` text block; a later iteration can formalize `crg-review-evidence.v1` through `review-pre-facts`.
- spec-crg-impact-reviewer 独占的 finding shape 与 dedup 元数据（影响 R1 差异化产物）：候选 shape 包括 (a) `rename without callers updated`、(b) `public/CLI surface drift with downstream caller list`、(c) `blast-radius caller list crossing the diff boundary`、(d) `missing tests for affected_flow`。Stage 5 dedup 当前以 `file + line_bucket(±3) + normalized_title` 收敛；若新 reviewer 与 correctness/testing 在同一 file:line 报告，是否需要扩展 reviewer field（如 `crg-impact:<sub-shape>`）或在 dedup 元数据中保留多 reviewer 署名以体现 cross-reviewer agreement，留给实施期基于真实 run 校准。

### From 2026-05-22 Doc Review

- v1 value threshold: decide whether v1 should include a minimal CRG evidence packet that lets `spec-crg-impact-reviewer` reliably consume affected flows, callers/tests, and impact radius, or explicitly rename the first implementation slice as “CRG reviewer shell + readiness/Coverage integration” and defer user-visible CRG-backed impact findings to the follow-up evidence packet work.

---

## Implementation Units

### U1. Define `spec-crg-impact-reviewer`

**Goal:** Create the new reviewer agent profile with a narrow ownership boundary: CRG-backed impact, blast radius, affected flows, callers/dependents, and test-gap review.

**Requirements:** R1, R2, R3, R5, R6, R7

**Dependencies:** None

**Files:**
- Create: `agents/spec-crg-impact-reviewer.agent.md`
- Modify: `tests/unit/spec-code-review-contracts.test.js`

**Approach:**
- Use existing reviewer profile style: frontmatter with `name`, `description`, `model: inherit`, read-only inspection tools, and no write-capable role.
- State the role boundary explicitly: the agent reviews impact evidence and related code; it does not build, update, repair, or refresh graphs.
- Require standard JSON output compatible with `skills/spec-code-review/references/findings-schema.json`.
- Calibrate confidence: CRG-only suspicion is insufficient; actionable findings require code/diff evidence or explicitly verified caller/test evidence.
- Suppress stale/degraded graph claims unless the finding is independently proven by source reads.

**Patterns to follow:**
- `agents/spec-testing-reviewer.agent.md`
- `agents/spec-reliability-reviewer.agent.md`
- `agents/spec-cli-readiness-reviewer.agent.md`
- `skills/spec-code-review/references/subagent-template.md`

**Test scenarios:**
- Happy path: a profile text check confirms the agent name, read-only role, CRG impact ownership, standard JSON output, and no graph refresh authority.
- Edge case: a stale graph evidence example must be described as Coverage/residual risk, not emitted as a high-confidence finding by itself.
- Error path: profile text must explicitly reject `build`, `update`, `build_or_update_graph_tool`, watcher, daemon, and hook refresh behavior.
- Integration: fresh-source eval gives the new profile a mock diff plus CRG affected-flow/test-gap evidence; expected output is schema-compatible findings only when source evidence supports the issue.

**Verification:**
- Source tests can locate and validate the new profile's role boundary and schema alignment.
- Fresh-source eval records either `passed` or a clear not-run reason before implementation is considered complete.

---

### U2. Register the reviewer in `spec-code-review`

**Goal:** Add the CRG impact reviewer to the existing reviewer catalog and selection rules without changing current default reviewers.

**Requirements:** R1, R4, R6, R8, R9

**Dependencies:** U1

**Files:**
- Modify: `skills/spec-code-review/SKILL.md`
- Modify: `skills/spec-code-review/references/persona-catalog.md`
- Modify: `tests/unit/spec-code-review-contracts.test.js`

**Approach:**
- Add `spec-crg-impact-reviewer` as a **cross-cutting Conditional reviewer**（与 `spec-cli-readiness-reviewer` 同区，结构化 JSON 输出），不进入 default core，也不进入 Spec-First Conditional Agents (migration-specific) 区——后者按 catalog 现行声明只接收 unstructured output 与 schema/migration 触发条件。
- 同步更新 `skills/spec-code-review/references/persona-catalog.md`：(a) 顶部 `# Persona Catalog` 第 3 行说明从 `18 reviewer personas` 调整为 `19 reviewer personas`；(b) `## Conditional` 表追加 `spec-crg-impact-reviewer` 行。
- Select it when the diff has meaningful impact-review surface: public/shared symbols, CLI/runtime/provider contracts, API/route/schema surfaces, cross-module changes, many changed executable files, renames/moves, CRG risk/test-gap evidence, or graph-heavy user intent.
- Keep low-risk docs-only and simple config reviews on the existing minimum reviewer sets unless the docs/config changes alter review/graph contracts.
- Announce the reviewer with a reason in the existing team announcement format.
- Treat graph readiness failure as evidence degradation, not reviewer dispatch failure.

**Patterns to follow:**
- Existing cross-cutting Conditional entries in `skills/spec-code-review/references/persona-catalog.md`，特别是 `spec-cli-readiness-reviewer`（结构化 JSON 输出 + 条件触发）
- Stage 3 scale-aware reviewer preflight in `skills/spec-code-review/SKILL.md`

**Test scenarios:**
- Happy path: a workflow/prose contract test confirms the persona catalog lists `spec-crg-impact-reviewer` as conditional and does not add it to the default core.
- Edge case: docs-only low-risk changes keep the minimum reviewer set and do not force CRG reviewer selection unless the docs touch graph/review contracts.
- Error path: stale or unavailable graph facts do not disable the full review; Coverage records the limitation and selection can fall back to direct reads.
- Integration: CLI/runtime/provider diff text triggers the CRG reviewer selection rule alongside existing applicable reviewers without removing any existing reviewer.

**Verification:**
- Reviewer catalog and `SKILL.md` tests prove the new selector is additive and conditional.
- Existing reviewer selection tests continue to pass with current minimum/full core semantics.

---

### U3. Add bounded CRG evidence context

**Goal:** Provide a minimal `<graph-review-evidence>` context path for the new reviewer while preserving existing prompt/schema contracts.

**Requirements:** R3, R5, R6, R7, R8, R9

**Dependencies:** U1, U2

**Files:**
- Modify: `skills/spec-code-review/SKILL.md` (Stage 4 spawn enumeration only; no provider preference change)
- Modify: `skills/spec-code-review/references/subagent-template.md` (Template body 增加可选 slot **以及** Variable Reference 表新增 `{graph_review_evidence}` 行；两处必须同步)
- Modify: `docs/contracts/workflows/review-pre-facts-extraction.md` (描述新 evidence block 的 advisory 边界与 untrusted-quoted-data 约束；不调整 trust model 章节)
- Modify: `tests/unit/spec-code-review-contracts.test.js`
- Modify: `tests/unit/review-pre-facts-helper.test.js` (covers report-only no-temp 边界回归；不引入 provider preference 切换)

**Approach:**
- Add an optional `<graph-review-evidence>` block for graph-aware reviewers. "Optional" 指 rendered string 内容可为空字符串；template 中的 slot 定义本身是新增项，并不可被跳过。当 rendered string 为空时，对未持有该 slot 的现有 reviewer，prompt 行为应与本 unit 之前 byte-level 等价；实施期需要保留对比证据（diff 现有 reviewer 的实际 prompt 渲染，而不是仅靠措辞声明）。
- 三处必须同步编辑，缺一不可：
  - `skills/spec-code-review/references/subagent-template.md` Template body：在现有 review-context block 旁新增 `<graph-review-evidence>` slot；
  - `skills/spec-code-review/references/subagent-template.md` Variable Reference 表（当前 9 个变量槽：persona_file/diff_scope_rules/schema/intent_summary/pr_metadata/file_list/diff/run_id/reviewer_name）追加 `graph_review_evidence` 行；
  - `skills/spec-code-review/SKILL.md` Stage 4 "what each reviewer sub-agent receives" 列表（当前枚举 6 项）追加 `graph_review_evidence` 项。
- Include only bounded fields: provider, readiness, freshness/stale reason, target repo, changed files, available capabilities, session-local evidence summary, omitted evidence, limitations.（advisory：见 R7 后置说明，部分字段可能与 readiness/limitations 重合，可 follow-up 收敛）
- Mark all evidence as advisory and untrusted quoted data.
- Reuse existing `review-pre-facts` machinery for deterministic readiness/fallback handling. Do not add a second helper or parallel schema. **不修改 helper 的 provider preference 选择算法**（保持 workflow-agnostic），workflow-aware provider preference 见 Deferred to Follow-Up Work。
- 默认仅向 `spec-crg-impact-reviewer` 注入该 block；其他 reviewer 不接收（见 D8）。
- In report-only mode, skip temp-artifact live evidence writes and pass only compiled readiness/fallback summary.
- In interactive/headless/autofix modes, allow session-scoped CRG evidence only when it is already available through host MCP or existing pre-facts flow; never run graph refresh.

**Patterns to follow:**
- `docs/contracts/workflows/review-pre-facts-extraction.md`
- `src/cli/helpers/review-pre-facts.js`
- `skills/spec-code-review/references/subagent-template.md`
- `skills/spec-code-review/SKILL.md` Graph Freshness / Refresh Trigger Boundary

**Test scenarios:**
- Happy path: fresh CRG readiness plus impact capability renders a bounded graph evidence block with provider, target repo, freshness, and reason code.
- Edge case: graph stale renders a limitation and fallback tier; no CRG-backed impact claim is presented as current truth.
- Error path: invalid or missing canonical graph artifacts result in a degraded/unavailable evidence block and do not block reviewer dispatch.
- Error path: `mode:report-only` does not create temp pre-facts artifacts and records the no-temp boundary.
- Integration: code-review pre-facts provider selection remains unchanged in v1; `review-pre-facts.js` / `computeReadiness` provider preference behavior is asserted against the current baseline, while CRG-first provider preference remains in Deferred to Follow-Up Work.

**Verification:**
- Helper tests cover freshness, stale fallback, provider preference unchanged-from-baseline behavior, report-only no-temp behavior, and untrusted evidence rendering.
- `spec-code-review` contract tests confirm the new evidence block is optional and does not alter the required JSON schema.

---

### U4. Preserve synthesis, Coverage, and routing semantics

**Goal:** Ensure CRG reviewer output is merged through the existing pipeline and reported with clear Coverage/limitations.

**Requirements:** R2, R3, R4, R6, R7

**Dependencies:** U1, U2, U3

**Files:**
- Modify: `skills/spec-code-review/SKILL.md`
- Modify: `skills/spec-code-review/references/review-output-template.md`
- Modify: `skills/spec-code-review/references/findings-schema.json` only if the implementation finds a strictly necessary documentation-only schema description update; do not add new fields by default
- Modify: `tests/unit/spec-code-review-contracts.test.js`

**Approach:**
- Keep Stage 5 validation/dedup/confidence gate unchanged.
- Treat `spec-crg-impact-reviewer` findings like any other reviewer findings; cross-reviewer agreement can promote confidence through the existing rule.
- Coverage should report graph evidence status, provider used or skipped, whether CRG reviewer was selected, and whether graph-heavy claims were downgraded due to stale evidence.
- Recommend `$spec-graph-bootstrap` when durable graph freshness is required.
- Do not add a new severity scale, `risk_score` field, or merge gate.

**Patterns to follow:**
- Stage 5 merge findings in `skills/spec-code-review/SKILL.md`
- Coverage language in `skills/spec-code-review/references/review-output-template.md`

**Test scenarios:**
- Happy path: CRG reviewer returns a schema-valid P1/P2 finding; synthesis validates, deduplicates, and numbers it with existing findings.
- Edge case: a CRG-only advisory at confidence 50 is demoted or suppressed according to current mode-aware rules.
- Error path: malformed CRG reviewer JSON is dropped and counted like any other malformed reviewer return.
- Integration: Coverage includes graph evidence status and selected reviewer status without creating a new output section that downstream consumers must parse.

**Verification:**
- Existing schema validation and merge contract tests pass.
- New contract tests confirm no new severity/routing vocabulary leaks into the final report.

---

### U5. Support single-repo, monorepo, and multi-repo workspace scopes

**Goal:** Make CRG reviewer selection and evidence handling safe across the three supported development modes.

**Requirements:** R6, R8, R9, R10

**Dependencies:** U2, U3, U4

**Files:**
- Modify: `skills/spec-code-review/SKILL.md`
- Modify: `docs/contracts/workflows/review-pre-facts-extraction.md`
- Modify: `tests/unit/spec-code-review-contracts.test.js`
- Modify: `tests/unit/workspace-gitnexus-contracts.test.js` only if shared workspace review wording is touched

**Approach:**
- Single-repo single-project: read repo-local `.spec-first/graph/*` and `.spec-first/impact/*`; select CRG reviewer based on diff/evidence.
- Single-repo multi-module: keep graph artifact ownership at repo root; include module scope as focus metadata only, not as artifact ownership.
- Multi-repo workspace: group changed files by child Git repo; resolve graph readiness and CRG evidence per child repo; aggregate findings without mixing repo-local evidence.
- Autofix remains scoped to the repo owning the file. The CRG reviewer must not recommend edits in a child repo outside the explicit review target.

**Patterns to follow:**
- Multi-repo section in `skills/spec-code-review/SKILL.md`
- Workspace readiness boundary in `AGENTS.md` managed bootstrap block
- `docs/contracts/context-governance.md`

**Test scenarios:**
- Happy path: a single-repo review includes one repo-level graph evidence status.
- Happy path: a monorepo diff records module focus but uses the repo-root graph artifact.
- Edge case: a parent workspace diff spanning two child repos records per-repo graph limitations and keeps findings repo-scoped.
- Error path: missing graph artifacts in one child repo do not suppress CRG evidence or direct reads in another child repo.

**Verification:**
- Contract tests prove the prose distinguishes repo root, module scope, and child repo scope.
- No generated runtime mirror paths are added to review context by default.

---

### U6. Update docs, changelog, and runtime-source expectations

**Goal:** Document the new reviewer behavior and keep source/runtime governance aligned.

**Requirements:** R4, R5, R6, R10

**Dependencies:** U1, U2, U3, U4, U5

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `docs/contracts/workflows/fresh-source-eval-checklist.md` only if implementation adds a reusable eval checklist item
- Modify: `tests/smoke/cli.sh` only if existing representative-agent enumeration covers reviewer personas（参考现状：`spec-security-reviewer.agent.md` 是当前 init-dry-run 的代表项）
- Modify: `tests/unit/init-dry-run.test.js`（**必做**：新增对 `spec-crg-impact-reviewer.agent.md` 在 Claude / Codex projection 中的存在断言）

**Approach:**
- Add a user-visible changelog entry when implementation lands.
- Update user docs only where they describe `spec-code-review` reviewer coverage or graph evidence behavior.
- Runtime projection 必做：在 `tests/unit/init-dry-run.test.js` 中显式断言 `spec-crg-impact-reviewer` 出现在 Claude 与 Codex 两个宿主投影里；`tests/smoke/cli.sh` 若已枚举代表性 reviewer agents（如 `spec-security-reviewer.agent.md` 形式），同步追加新 agent 到代表性列表，否则保留按 source 自动计数即可。
- Do not manually edit `.claude/`, `.codex/`, or `.agents/skills/`; regenerate runtime mirrors only through `spec-first init --claude|--codex` when implementation verification requires it.

**Patterns to follow:**
- Existing changelog format in `CHANGELOG.md`
- Source/runtime boundary in `docs/contracts/source-runtime-customization-boundary.md`

**Test scenarios:**
- Happy path: docs mention CRG impact reviewer as conditional graph-backed review coverage, not as a separate review entrypoint.
- Edge case: docs preserve no-graph/degraded mode behavior and still say review can continue with bounded direct reads.
- Integration: runtime projection smoke checks include the new agent only through source-owned generation.

**Verification:**
- Changelog entry exists for all source changes.
- README/docs changes remain consistent with `spec-code-review` source and do not promise automatic graph refresh.
- `spec-first init --claude --dry-run` 与 `spec-first init --codex --dry-run` 都能投影 `spec-crg-impact-reviewer.agent.md`，并被 `tests/unit/init-dry-run.test.js` 显式断言（hard dependency，不是 conditional）。如果 init 当前投影逻辑是按枚举列表（而非自动遍历 `agents/`），列表更新与本断言必须同 PR 落地。

---

## System-Wide Impact

- **Review quality:** Adds structural impact review coverage for blast radius, affected flows, callers, and test gaps without expanding every reviewer prompt.
- **Workflow governance:** Keeps `spec-code-review` as the single review entrypoint; CRG official skills inform behavior but do not become parallel workflows.
- **Provider boundary:** CRG remains provider/tool evidence. Scripts/helper prepare bounded facts; reviewer and synthesis decide semantic findings.
- **Refresh lifecycle:** No automatic `.code-review-graph/` refresh is introduced. Stale graph remains a limitation and `$spec-graph-bootstrap` handoff.
- **Runtime mirrors:** New agent source will project into runtime via init, but generated mirrors remain non-source.
- **Downstream consumers:** Existing `spec-work` shipping review, headless callers, report-only callers, and PR preparation continue consuming the same findings schema and report shape.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| CRG reviewer creates noisy duplicate findings | Keep the reviewer conditional, require concrete source evidence, and rely on existing dedup/confidence gates. |
| Stale graph evidence is over-trusted | Evidence block must carry freshness/reason_code; reviewer profile suppresses stale-only high-confidence claims. |
| Integration grows into a second review pipeline | Scope limits CRG to one agent plus thin orchestration; official CRG review skills remain references, not new entrypoints. |
| Report-only mode accidentally writes temp artifacts | Reuse `review-pre-facts` report-only no-temp boundary and add contract tests. |
| Multi-repo evidence leaks across child repos | Resolve readiness/evidence per child repo and keep finding paths repo-scoped. |
| Agent prose changes are not actually tested in current session | Require source tests plus fresh-source eval or a recorded not-run reason. |

---

## Alternative Approaches Considered

- Replace `spec-code-review` with CRG official review skills: rejected because it would bypass existing severity/confidence/dedup/autofix governance and create competing entrypoints.
- Add CRG logic into every existing reviewer: rejected because it increases prompt surface and makes impact evidence harder to audit.
- Make CRG reviewer always-on: rejected because docs-only, config-only, and tiny low-risk diffs would pay cost without meaningful impact-review value.
- Let review run CRG refresh automatically: rejected because durable graph refresh belongs to `$spec-graph-bootstrap`, and silent refresh would blur provider/source/runtime boundaries.

---

## Documentation / Operational Notes

- Implementation should update `CHANGELOG.md` as user-visible once the agent and orchestration land.
- If runtime verification is needed, run `spec-first init --claude|--codex` after source changes; do not patch runtime mirrors directly.
- For graph-heavy validation runs, refresh readiness explicitly with `$spec-graph-bootstrap` before claiming CRG-backed impact behavior.
- The new reviewer should be described as “CRG impact reviewer” rather than “CRG review replacement”.

---

## Verification Plan

- `npm run lint:skill-entrypoints` for public/internal skill entry governance.
- `npm run test:unit` for spec-code-review contracts, review-pre-facts helper behavior, init/runtime projection assertions, and schema guardrails.
- `npm run test:graph-bootstrap` only if implementation changes graph readiness wording or provider capability contracts.
- **Runtime projection 强制断言（不再可选）**：在 `tests/unit/init-dry-run.test.js` 中增加对 `spec-crg-impact-reviewer.agent.md` 出现在 Claude 与 Codex 两个宿主投影里的显式 assertion；新增 `spec-first init --claude --dry-run` 与 `spec-first init --codex --dry-run` 的 fixture 校验。如果当前 init 是按枚举列表投影（而非自动遍历 `agents/`），列表更新作为 hard dependency；如果是自动遍历，断言只需保证新 agent 出现在投影结果中。
- **Dispatcher 行为级回归（mock readiness × dispatch fixture，不再可选）**：用 fixture 模拟三种 graph readiness 状态（fresh / stale / unavailable）× 一次 spec-code-review dispatch，覆盖以下行为级要求——
  - R3：CRG-only suspicion 的 finding（无 code/diff 证据）confidence ≤ 50 时不进入 final report；
  - R6：stale / unavailable 时 reviewer dispatch 不被禁用，仅 evidence tier 降级，limitation 出现在 Coverage；
  - R7：`<graph-review-evidence>` block 在三态下的 freshness、reason_code、limitations 字段渲染正确，evidence 被标记为 untrusted quoted data；
  - R8：review 路径上未引入第二条 helper / parallel schema（断言 `review-pre-facts.js` provider preference 算法、`computeReadiness` 行为字节级与基线一致）。
  这条测试是 R3/R6/R7/R8 实际成立的关键回归；prose contract 测试不能替代它。
- Fresh-source eval using `docs/contracts/workflows/fresh-source-eval-checklist.md` for the new agent profile and modified `spec-code-review` dispatch semantics.
- **Existing reviewer prompt regression**：dispatch 一次基线 review（不含新 reviewer），对比新增 `<graph-review-evidence>` slot 前后现有 reviewer 渲染出的 prompt，确认 slot 默认 rendered string 为空时 byte-level 等价（支撑重写后的 R4）。

---

## Sources & References

- Related plan: `docs/plans/2026-05-07-003-feat-code-review-graph-evidence-preflight-plan.md`
- Related plan: `docs/plans/2026-05-11-007-feat-review-pre-facts-injection-plan.md`
- Related plan: `docs/plans/2026-05-18-001-refactor-crg-primary-gitnexus-optional-plan.md`
- Source skill: `skills/spec-code-review/SKILL.md`
- Persona catalog: `skills/spec-code-review/references/persona-catalog.md`
- Reviewer template: `skills/spec-code-review/references/subagent-template.md`
- Findings schema: `skills/spec-code-review/references/findings-schema.json`
- Review pre-facts helper: `src/cli/helpers/review-pre-facts.js`
- Review pre-facts contract: `docs/contracts/workflows/review-pre-facts-extraction.md`
- Fresh-source eval checklist: `docs/contracts/workflows/fresh-source-eval-checklist.md`
- External local source repo `code-review-graph`: `skills/review-changes/SKILL.md`
- External local source repo `code-review-graph`: `skills/review-delta/SKILL.md`
- External local source repo `code-review-graph`: `skills/review-pr/SKILL.md`
- External local source repo `code-review-graph`: `code_review_graph/main.py`
- External local source repo `code-review-graph`: `code_review_graph/prompts.py`
