---
title: "feat: compound trigger checklist"
type: feat
status: completed
date: 2026-05-12
spec_id: 2026-05-12-001-compound-trigger-checklist
origin: docs/2026-05-10/spec-first-full-code-review-and-competitor-benchmark.md
origin_issue: P2-008
---

# feat: compound trigger checklist

## Summary

本计划交付 `P2-008 compound trigger checklist` 的轻量版：在 `spec-work`、`spec-work-beta` 和 `spec-code-review` 的最终用户输出中加入 learning-worthy 判断，让 workflow 在确实出现可复用经验时建议用户运行当前宿主的 compound 入口，同时避免对机械改动默认提示或自动写入 `docs/solutions/`。

---

## Problem Frame

`spec-first` 已经具备 `spec-compound`、`spec-compound-refresh` 和 `spec-sessions`，但 Work / Review 结束后是否进入知识沉淀仍主要依赖 agent 当场判断。结果容易出现两个方向的漂移：可复用的 workflow / source-runtime / provider evidence / review 经验没有被沉淀，或者机械修复也被提示 compound，污染 `docs/solutions/` 的信号密度。

这项工作补的是主链路 `Codebase -> Graph -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge` 末端的触发判断，不是新增知识写入能力。实现应保持 `Light contract + Explicit boundaries + Scripts prepare, LLM decides`：skill prose 提供判断清单，LLM 决定是否建议，用户决定是否进入 `spec-compound`。

---

## Requirements

- R1. `spec-work` 与 `spec-work-beta` 的 completion response contract 必须包含同一个轻量 learning-worthy 判断，只有出现可复用经验时才建议当前宿主的 compound 入口。
- R2. `spec-code-review` 的 final report / completion handoff 必须包含同类判断，能够基于 review findings、residual risks、agent-native gaps、known patterns 或 repeated failure mode 判断是否建议 compound。
- R3. 判断清单必须有负向边界：机械改动、一次性文案、纯格式、无可泛化 lesson、无法一句话说清的经验，默认不提示 compound。
- R4. 判断清单必须有正向信号：同一模式出现多处、暴露 shared dependency / framework / workflow / source-runtime 边界错误假设、发现可复用诊断路径、形成新的项目治理或 review 判断规则、已有 `docs/solutions/` 可能需要后续 refresh。
- R5. 输出只能建议用户运行当前宿主的 compound 入口，不能自动调用 `spec-compound`，不能自动写 `docs/solutions/`，不能把 compound 变成每次 work/review 的固定 Next action。
- R6. 计划必须复用现有 `spec-debug` 的 compound capture 分层思路：skip silently / offer neutrally / lean into the offer，而不是引入独立 scoring engine、schema、runtime state 或后台知识捕获器。
- R7. 必须增加 contract tests，覆盖 `spec-work`、`spec-work-beta`、`spec-code-review` 的 learning-worthy checklist、负向边界和“不自动写 docs/solutions”的约束。
- R8. 不修改 generated runtime mirrors；若 source skill 变化需要宿主 runtime 刷新，由后续实现按 source-first 规则处理。

---

## Scope Boundaries

- 不新增 `spec-compound-auto`、`spec-knowledge-capture`、CLI flag、runtime state、dashboard 或 hidden background writer。
- 不自动运行 `spec-compound`，不自动创建或修改 `docs/solutions/`。
- 不把 compound 建议作为 code review verdict、merge gate、release gate 或 task completion gate。
- 不要求所有 work/review 输出都出现 `Next action`；没有 learning-worthy signal 时应省略建议。
- 不修改 `spec-compound` 的文档写入流程和 frontmatter schema。
- 不修改 `spec-compound-refresh` 的刷新策略；只允许在有明确 stale candidate 时建议后续运行。
- 不修改 `.claude/`、`.codex/`、`.agents/skills/` generated runtime mirrors。

### Deferred to Follow-Up Work

- 真实 compound 建议准确率评估：本计划只做 source contract 和 tests，不做 telemetry、dashboard 或 LLM-as-judge benchmark。
- `spec-debug` 与 Work/Review 的统一 shared reference：v1 先复用同一判断语言；只有后续发现维护漂移，才考虑提取极小共享 reference。

---

## Graph Readiness

- status: stale
- source_revision: `b5ca72a99056fb2dc6c21b6e0c063c5d6b8203a7`
- current_revision: `ab461709029dfc8018835029339418fe41138c74`
- stale: true
- primary_providers: `code-review-graph`, `gitnexus`
- degraded_providers: none in compiled artifact
- fallback_capabilities: bounded direct repo reads, source skill contract tests, existing debug compound-capture contract
- runtime_mcp_evidence: not used; this is a workflow prose / contract-test planning task and direct source reads were sufficient
- confidence: medium
- limitations: compiled graph facts predate the current HEAD and the work is prose-governance heavy; plan evidence comes from current source reads and the P2 backlog document.

---

## Context & Research

### Relevant Code and Patterns

- `docs/2026-05-10/spec-first-full-code-review-and-competitor-benchmark.md` identifies `P2-008` as the only remaining worth-doing but non-required P2 item: add a “learning-worthy signal” checklist to final summary contracts, suggest `spec-compound`, and do not auto-write docs.
- `skills/spec-debug/SKILL.md` already has the desired lightweight pattern after PR creation: skip silently for mechanical fixes, offer neutrally when the lesson can be stated in one sentence, and lean into the offer when the pattern appears in 3+ locations or reveals a wrong assumption about shared dependency, framework, or convention.
- `tests/unit/spec-debug-contracts.test.js` already locks that debug behavior with strings such as `Skip silently`, `Offer neutrally`, `Lean into the offer`, `pattern appears in 3+ locations`, and `run \`spec-compound\``.
- `skills/spec-work/references/shipping-workflow.md` owns the stable Work `Completion Response Contract` for final output: Completed, Verification, Review, Artifacts, and optional Next action. This is the narrowest place to add work-side learning-worthy guidance.
- `skills/spec-work-beta/SKILL.md` declares beta execution as “Same as spec-work” plus experimental delegation, while `skills/spec-work-beta/references/shipping-workflow.md` is an independent shipping contract copy. Any Work completion contract change must keep stable and beta guidance in parity to avoid beta drift.
- `tests/unit/spec-work-contracts.test.js` already asserts the stable shipping completion response contract and is the right test surface for stable Work.
- `tests/unit/spec-work-beta-contracts.test.js` already asserts the beta shipping completion response contract and must be updated with the same learning-worthy and negative-boundary checks.
- `skills/spec-code-review/SKILL.md` owns final review output sections, After Review routing, completion reports, and headless/autofix boundaries. This is the right place to add review-side learning-worthy guidance without changing reviewer findings schema.
- `tests/unit/spec-code-review-contracts.test.js` is the right contract test surface for Review.
- `skills/spec-compound/SKILL.md` already defines `current host's compound entrypoint` / `current host's compound entrypoint with brief context`, and tests forbid hardcoding only `spec-compound` in source prose.

### Institutional Learnings

- `docs/10-prompt/结构化项目角色契约.md` requires scripts to prepare deterministic facts and LLMs to make semantic decisions. Therefore this checklist must remain an LLM-owned final-summary judgment, not a script-owned classifier.
- `spec-compound` itself treats refresh as selective follow-up: capture the new learning first, then recommend `spec-compound-refresh` only with a narrow scope hint when older docs may be stale. P2-008 should preserve that boundary.
- Existing solution docs under `docs/solutions/workflow-issues/` show why high-signal knowledge matters: source/runtime boundaries, reviewer dispatch failures, and host entrypoint mapping are recurring workflow lessons worth rediscovering.

### External References

- No external research was used. The work is repo-local workflow governance and should follow existing source contracts.

---

## Key Technical Decisions

- Add checklist prose to `spec-work`, `spec-work-beta`, and `spec-code-review`, not to `spec-compound`. Rationale: the decision point happens before entering compound, while Work/Review still have fresh completion evidence.
- Keep `spec-work` and `spec-work-beta` shipping contracts in parity. Rationale: beta is explicitly “Same as spec-work” with delegation additions, so duplicating only the stable guidance would create a second completion contract that silently lacks knowledge-capture behavior.
- Reuse the `spec-debug` three-tier language instead of inventing a score. Rationale: it already expresses the desired judgment boundary and is covered by tests.
- Use current-host compound entrypoint wording. Rationale: source assets are projected to Claude and Codex; hardcoding one host entrypoint in shared prose violates host parity.
- Make the recommendation optional and evidence-driven. Rationale: a permanent `Next action: compound` would add noise and train users to over-document mechanical changes.
- Keep `spec-compound-refresh` as a secondary narrow suggestion only when stale candidates are concrete. Rationale: refresh is maintenance of existing knowledge, not a prerequisite for capturing a new learning.

---

## Open Questions

### Resolved During Planning

- Should this add automatic compound invocation? Resolved: no. It should only recommend the current host's compound entrypoint when the final summary has learning-worthy evidence.
- Should this create a shared schema or scoring engine? Resolved: no. A prose checklist and contract tests are enough for v1.
- Should this modify generated runtime mirrors? Resolved: no. Source files only; runtime regeneration belongs to implementation/shipping if needed.

### Deferred to Implementation

- Exact placement in `spec-code-review` output: implementation should choose the narrowest existing section or completion-report paragraph that preserves current report shape and headless/programmatic contracts.
- Exact wording of the recommendation: implementation should use current-host entrypoint wording and keep it compact enough not to crowd normal completion output.

---

## Implementation Units

### U1. Add Work completion learning-worthy guidance

**Goal:** Teach `spec-work` and `spec-work-beta` to recommend compound only when completed work produced a reusable lesson.

**Requirements:** R1, R3, R4, R5, R6, R8

**Dependencies:** None

**Files:**
- Modify: `skills/spec-work/references/shipping-workflow.md`
- Modify: `skills/spec-work-beta/references/shipping-workflow.md`
- Test: `tests/unit/spec-work-contracts.test.js`
- Test: `tests/unit/spec-work-beta-contracts.test.js`

**Approach:**
- Extend the `Completion Response Contract` with an optional knowledge-capture rule rather than a mandatory new always-present output field.
- Apply the same completion guidance to stable and beta shipping workflows; beta remains an opt-in delegation-capable variant, not a divergent completion contract.
- Reuse the debug three-tier judgment:
  - skip silently for mechanical or one-off changes;
  - offer neutrally when the lesson can be stated in one sentence;
  - lean into the offer when the pattern appears in 3+ places or exposes a shared dependency, framework, workflow, source/runtime, or provider-evidence assumption.
- Require the final response to omit `Next action` when no user action remains and no learning-worthy signal exists.
- When suggesting compound, phrase it as a user-owned next step using the current host's compound entrypoint with brief context.

**Patterns to follow:**
- `skills/spec-work/references/shipping-workflow.md` Completion Response Contract.
- `skills/spec-work-beta/references/shipping-workflow.md` Completion Response Contract, kept in parity with stable Work unless beta-specific delegation text requires an additive note.
- `skills/spec-debug/SKILL.md` “After a PR is open: consider offering learning capture”.
- `tests/unit/spec-debug-contracts.test.js` compound-capture contract assertions.

**Test scenarios:**
- Happy path: stable and beta Work shipping workflows contain a learning-worthy checklist and say to recommend the current host's compound entrypoint when reusable lessons exist.
- Edge case: mechanical fixes, one-off docs edits, formatting-only changes, and lessons that cannot be articulated in one sentence are explicitly skipped.
- Error path: source prose does not say to automatically run `spec-compound`, automatically write `docs/solutions/`, or always add compound as `Next action`.
- Integration: completion response contract still includes Completed, Verification, Review, Artifacts, and optional Next action semantics.
- Parity: `spec-work-beta` tests cover the same compound trigger contract as stable `spec-work`, while preserving beta-specific delegation contracts.

**Verification:**
- Stable and beta Work completion guidance is source-owned, host-neutral, parity-preserving, and contract-tested.

---

### U2. Add Code Review completion learning-worthy guidance

**Goal:** Let `spec-code-review` surface reusable review learnings without changing review findings, verdicts, or fixer routing.

**Requirements:** R2, R3, R4, R5, R6, R8

**Dependencies:** U1

**Files:**
- Modify: `skills/spec-code-review/SKILL.md`
- Test: `tests/unit/spec-code-review-contracts.test.js`

**Approach:**
- Add a small learning-worthy check near Stage 6 final report assembly and/or the After Review final-next-steps section.
- Signals should include repeated finding patterns, a reusable review heuristic, a source/runtime or host-entrypoint boundary lesson, a provider evidence limitation that future reviews should remember, or a known pattern / stale solution candidate discovered during review.
- Preserve finding schema and severity routing. A compound recommendation is advisory, not a finding, not a residual actionable item, and not a merge blocker.
- For report-only/headless/autofix modes, do not prompt or mutate. If a learning-worthy signal is relevant, expose it as advisory text only; otherwise omit it.
- If an older learning appears stale, recommend `spec-compound-refresh` only with a narrow scope hint and only after recommending/capturing the new learning path.

**Patterns to follow:**
- `skills/spec-code-review/SKILL.md` Stage 6 sections and After Review mode rules.
- `skills/spec-code-review/references/review-output-template.md` for final report shape if implementation touches interactive report wording.
- `skills/spec-compound/SKILL.md` host-neutral compound entrypoint wording.

**Test scenarios:**
- Happy path: review final output contract includes learning-worthy signals and can recommend current host's compound entrypoint with brief context.
- Edge case: advisory recommendation does not change verdict, finding severity, autofix_class, owner, or requires_verification.
- Error path: report-only/headless/autofix modes do not auto-run `spec-compound`, write `docs/solutions/`, file tickets, or ask extra questions because of the checklist.
- Integration: existing Learnings & Past Solutions section remains about prior docs; new compound recommendation is about whether the current review produced a new reusable lesson.

**Verification:**
- Code-review completion guidance is advisory, host-neutral, and does not alter review routing contracts.

---

### U3. Lock overdesign boundaries with contract tests

**Goal:** Prevent future drift from turning compound trigger guidance into a state machine, scoring system, or automatic writer.

**Requirements:** R3, R5, R6, R7

**Dependencies:** U1, U2

**Files:**
- Modify: `tests/unit/spec-work-contracts.test.js`
- Modify: `tests/unit/spec-work-beta-contracts.test.js`
- Modify: `tests/unit/spec-code-review-contracts.test.js`
- Optional modify: `tests/unit/spec-compound-contracts.test.js`

**Approach:**
- Add positive assertions for the three-tier trigger language and current-host compound entrypoint wording across stable Work, beta Work, and Code Review.
- Add negative assertions that source prose does not introduce `spec-compound-auto`, `spec-first compound-auto`, auto-write `docs/solutions/`, or compound as a mandatory completion gate.
- Add a beta parity assertion through `tests/unit/spec-work-beta-contracts.test.js` so beta cannot keep an older shipping contract while stable Work evolves.
- Prefer focused tests in existing skill contract files over a new test file unless assertions become hard to read.

**Patterns to follow:**
- Existing string contract tests in `tests/unit/spec-work-contracts.test.js`.
- Existing host-entrypoint boundary assertions in `tests/unit/spec-compound-contracts.test.js`.

**Test scenarios:**
- Happy path: stable Work, beta Work, and Review tests fail if the checklist disappears.
- Boundary: tests fail if implementation hardcodes only Claude or Codex entrypoint wording instead of using current-host compound entrypoint language.
- Overdesign guard: tests fail if source prose introduces auto compound invocation or automatic `docs/solutions/` writes.
- Beta parity: tests fail if stable Work receives the compound trigger checklist but beta Work does not.

**Verification:**
- Contract tests protect both presence and negative boundaries.

---

### U4. Close P2-008 status after implementation

**Goal:** Keep backlog, plan status, and changelog aligned after implementation and review.

**Requirements:** R7

**Dependencies:** U1-U3

**Files:**
- Modify: `docs/2026-05-10/spec-first-full-code-review-and-competitor-benchmark.md`
- Modify: `docs/plans/2026-05-12-001-feat-compound-trigger-checklist-plan.md`
- Modify: `CHANGELOG.md`

**Approach:**
- Mark `P2-008` as v1 fixed only after implementation verification and code review pass.
- Update remaining P2 counts: if P2-008 is complete, only deferred/paused items should remain (`P2-001`, `P2-005`).
- Flip this plan's `status: active` to `status: completed` at shipping.
- Add a changelog entry with the current developer profile.

**Patterns to follow:**
- Recent P2 completion updates in `docs/2026-05-10/spec-first-full-code-review-and-competitor-benchmark.md`.
- Current `CHANGELOG.md` single-line format.

**Test scenarios:**
- Changelog format remains valid.
- Main review/benchmark document no longer lists P2-008 as pending after implementation.

**Verification:**
- Project status documents match the shipped source behavior.

---

## System-Wide Impact

- **Interaction graph:** This adds a final-summary recommendation decision after Work/Review has completion evidence. It does not alter implementation, review dispatch, finding synthesis, or compound document writing.
- **Error propagation:** Missing or unclear learning-worthy evidence should degrade to no recommendation, not an error and not a forced follow-up.
- **State lifecycle risks:** No new runtime state or durable run artifact is introduced. Durable knowledge is still written only by `spec-compound` after explicit user invocation.
- **API surface parity:** Claude and Codex host entrypoints remain unchanged; prose must use current-host entrypoint wording.
- **Integration coverage:** Contract tests should prove stable Work, beta Work, and Review expose the trigger checklist and preserve negative boundaries.
- **Unchanged invariants:** `spec-compound` remains the only workflow that writes new learning docs; `spec-compound-refresh` remains selective maintenance for existing docs.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Compound recommendation becomes noisy | Default to skip silently for mechanical or one-off work; require a one-sentence lesson or stronger repeated/shared-boundary signal. |
| Useful lessons still get missed | Add concrete positive signals from debug's existing pattern: repeated issue, shared dependency/framework/convention assumption, reusable diagnostic path, workflow/source-runtime boundary. |
| Recommendation mutates report or review semantics | Keep it advisory and outside findings/verdict/autofix routing. |
| Host-specific command wording drifts | Use current-host compound entrypoint language and contract-test it. |
| Tests become brittle prose snapshots | Assert durable contract phrases and negative boundaries, not full paragraphs. |

---

## Documentation / Operational Notes

- No README or user manual update is required for v1 unless implementation changes user-visible workflow entrypoints, which this plan explicitly excludes.
- Runtime mirror regeneration is not part of the plan. If source skill edits need runtime refresh for local manual testing, use `spec-first init --claude|--codex` as a source-driven regeneration step and do not hand-edit generated mirrors.

---

## Sources & References

- Origin issue: `docs/2026-05-10/spec-first-full-code-review-and-competitor-benchmark.md`
- Role baseline: `docs/10-prompt/结构化项目角色契约.md`
- Work shipping workflow: `skills/spec-work/references/shipping-workflow.md`
- Beta work shipping workflow: `skills/spec-work-beta/references/shipping-workflow.md`
- Code-review workflow: `skills/spec-code-review/SKILL.md`
- Existing debug trigger pattern: `skills/spec-debug/SKILL.md`
- Compound workflow: `skills/spec-compound/SKILL.md`
- Work contract tests: `tests/unit/spec-work-contracts.test.js`
- Beta work contract tests: `tests/unit/spec-work-beta-contracts.test.js`
- Code-review contract tests: `tests/unit/spec-code-review-contracts.test.js`
- Debug contract tests: `tests/unit/spec-debug-contracts.test.js`
