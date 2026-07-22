# Phases 3-5: Synthesis, Presentation, and Next Action

## Phase 3: Synthesize Findings

Process findings from all agents through this pipeline. Order matters — each step depends on the previous. The pipeline implements the finding-lifecycle state machine: **Raised → (Confidence Gate | FYI-eligible | Dropped) → Deduplicated → Classified → SafeAuto | GatedAuto | Manual | FYI**. Re-evaluate state at each step boundary; do not carry forward assumptions from earlier steps as prose-level shortcuts.

### 3.1 Validate

Check each agent's returned JSON against the findings schema:

- Drop findings missing any required field defined in the schema
- Drop findings with invalid enum values (including the pre-rename `auto` / `present` values from older personas — treat those as malformed until all persona output has been regenerated)
- Note the agent name for any malformed output in the Coverage section

**Do not narrate remap / validation diagnostics to the user.** Schema-drift notes, persona-prompt-drift commentary, and other validator-internal diagnostics are maintainer-facing information. They do not belong in the Phase 4 output the user reads. If a persona's output is malformed, the only user-visible consequence is a Coverage-row annotation (e.g., the persona shows fewer findings or a `malformed` marker). Everything else stays internal.

### 3.2 Confidence Gate (Anchor-Based)

Gate findings by their `confidence` anchor value. Anchors are discrete integers (`0`, `25`, `50`, `75`, `100`) with behavioral definitions documented in `references/findings-schema.json` and embedded in the persona rubric (`references/subagent-template.md`).

| Anchor | Meaning | Route |
|--------|---------|-------|
| `0`    | False positive or pre-existing issue | Drop silently |
| `25`   | Might be real but could not verify | Drop silently |
| `50`   | Verified real but nitpick / advisory / not very important | Surface in FYI subsection |
| `75`   | Double-checked, will hit in practice, directly impacts correctness | Enter actionable tier (classify by `autofix_class`) |
| `100`  | Evidence directly confirms; will happen frequently | Enter actionable tier (classify by `autofix_class`) |

- **Dropped silently** (anchors `0` and `25`): these do not surface in any output bucket. Record the total drop count as a Coverage footnote line when non-zero: `Dropped: N (anchors 0/25 suppressed)`. The footnote appears below the Coverage table, alongside the `Chains:` footnote when both apply. Omit the footnote when N is zero.
- **FYI-subsection** (anchor `50`): surface in the presentation layer's FYI subsection regardless of `autofix_class`. These do not enter the walk-through or any bulk action — observational value without forcing a decision.
- **Actionable** (anchors `75` and `100`): enter the classification pipeline. Route by `autofix_class` (see 3.7).

### 3.3 Deduplicate

Fingerprint each finding using `normalize(section) + normalize(title)`. Normalization: lowercase, strip punctuation, collapse whitespace.

When fingerprints match across personas:

- If the findings recommend opposing actions (e.g., one says cut, the other says keep), do not merge — preserve both for contradiction resolution in 3.5
- Otherwise merge: keep the highest severity, keep the highest confidence anchor (if tied, keep the finding appearing first in document order — deterministic, not probabilistic), union all evidence arrays, note all agreeing reviewers (e.g., "coherence, feasibility")
- **Coverage attribution:** Attribute the merged finding to the persona with the highest confidence anchor. If anchors tie, attribute to the persona whose entry appeared first in document order. Decrement the losing persona's Findings count and the corresponding route bucket so totals stay exact.

**STOP. Before finalizing dedup, if any persona contributed 3 or more findings in the post-dedup set, read `references/synthesis-premise-collapse.md` for the same-persona premise redundancy collapse rules (3.3b).**

### 3.4 Cross-Persona Agreement Promotion

When 2+ independent personas flagged the same merged finding (from 3.3), promote the merged finding's anchor by one step: `50 → 75`, `75 → 100`. Anchor `100` does not promote further (already at the ceiling). Findings at anchors `0` or `25` do not reach this step (they were dropped in 3.2).

Independent corroboration is strong signal — multiple reviewers converging on the same issue is more reliable than any single reviewer's anchor. Promoting by one anchor step is semantically meaningful (a "verified but nitpick" finding that two personas independently surface is plausibly "will hit in practice").

Note the promotion in the Reviewer column of the output (e.g., `coherence, feasibility (+1 anchor)`).

**STOP. After cross-persona promotion (3.4), if any findings still carry opposing recommendations from different personas (not yet resolved — these were intentionally kept separate in 3.3), read `references/synthesis-contradictions.md` before 3.5b. Do NOT write "merged finding already carries opposing" — that contradicts the 3.3 non-merge strategy for opposing actions.**

### 3.5b Deterministic Recommended-Action Tie-Break

**Always-on — must run here, before 3.6.** Every merged finding carries exactly one `recommended_action` field consumed by the walk-through (`references/walkthrough.md`) to mark the `(recommended)` option, by the best-judgment path (`references/bulk-preview.md`), and by the stem's yes/no framing. When a merged finding was flagged by multiple personas who implied different actions, synthesis picks the recommended action deterministically so identical review artifacts produce identical walk-through and best-judgment behavior across runs.

**Tie-break order (most conservative first):** `Skip > Defer > Apply`. The first action that at least one contributing persona implied wins, scanning in that order.

- If any contributing persona implied Skip → `recommended_action: Skip`
- Else if any contributing persona implied Defer → `recommended_action: Defer`
- Else → `recommended_action: Apply`

**Persona-to-action mapping.** A persona implies an action through its classification:

- `safe_auto` or `gated_auto` → implies Apply
- `manual` with a concrete `suggested_fix` and a recommended resolution → implies Apply
- `manual` flagged as a tradeoff or scope question with no recommended resolution → implies Defer
- Any persona flagging the finding as low-confidence or suppression-eligible via residual concerns → implies Skip
- Persona in the contradiction set (3.5) implying "keep as-is / do not change" → implies Skip

If the contributing personas are all silent on action, pick the default based on whether the merged finding carries an executable `suggested_fix`:

- `suggested_fix` present → `recommended_action: Apply` as the pragmatic default.
- `suggested_fix` absent → `recommended_action: Defer`.

This gate holds for every branch: if the winning action is `Apply` but the merged finding has no `suggested_fix` after 3.6 and 3.7 have run, downgrade to `Defer`. The walk-through still lets the user pick any of the four options; this rule only governs the agent's default recommendation.

**Conflict-context surface.** When the tie-break fires (contributing personas implied different actions), record a one-line conflict-context string on the merged finding. Example: `Coherence recommends Apply; scope-guardian recommends Skip. Agent's recommendation: Skip.`

**Downstream invariant.** The walk-through and bulk-preview never recompute the recommendation — they read `recommended_action` and render `(recommended)` on the matching option. Best-judgment-the-rest and routing option B execute the `recommended_action` across the scoped finding set in bulk.

**STOP. After 3.5b and before 3.6, if any P0/P1 finding challenges a foundational premise (section is Problem Frame/Summary/Overview/Motivation/Goals AND title/why_it_matters contains a premise-challenge signal — see `references/synthesis-chain-linking.md` for the full shape-match rule and signal phrase list), read `references/synthesis-chain-linking.md` for the premise-dependency chain linking rules (3.5c).**

### 3.6 Promote Auto-Eligible Findings

Scan `manual` findings for promotion to `safe_auto` or `gated_auto`. Promote when the finding meets one of the consolidated auto-promotion patterns:

- **Codebase-pattern-resolved.** `why_it_matters` cites a specific existing codebase pattern (concrete file/function/usage reference, not just "best practice" or "convention"), and `suggested_fix` follows that pattern. Promote to `gated_auto`.
- **Factually incorrect behavior.** The document describes behavior that is factually wrong, and the correct behavior is derivable from context or the codebase. Promote to `gated_auto`.
- **Missing standard security/reliability controls.** The omission is clearly a gap (not a legitimate design choice for the system described), and the fix follows established practice. Promote to `gated_auto`.
- **Framework-native-API substitutions.** A hand-rolled implementation duplicates first-class framework behavior, and the framework API is cited. Promote to `gated_auto`.
- **Mechanically-implied completeness additions.** The missing content follows mechanically from the document's own explicit, concrete decisions (not high-level goals). Promote to `safe_auto` when there is genuinely one correct addition; `gated_auto` when the addition is substantive.

Do not promote if the finding involves scope or priority changes where the author may have weighed tradeoffs invisible to the reviewer.

**Strawman-downgrade safeguard.** If a `safe_auto` finding names dismissed alternatives in `why_it_matters`, verify the alternatives are genuinely strawmen. If any alternative is a plausible design choice that the persona dismissed too aggressively, downgrade to `gated_auto` so the user sees the tradeoff before the fix applies.

### 3.7 Route by Autofix Class

**Severity and autofix_class are independent.** A P1 finding can be `safe_auto` if the correct fix is obvious. The test is not "how important?" but "is there one clear correct fix, or does this require judgment?"

**Anchor and autofix_class are also independent.** Anchor gates the finding into a surface (FYI vs actionable); `autofix_class` decides what the actionable surface does with it.

Findings reaching 3.7 have already been gated to anchors `50`, `75`, or `100` by 3.2 (anchors `0` and `25` were dropped).

| Anchor | Autofix Class | Route |
|--------|---------------|-------|
| `100`  | `safe_auto`   | Apply silently in Phase 4. Requires `suggested_fix`. Demote to `gated_auto` if missing. |
| `100`  | `gated_auto`  | Enter the per-finding walk-through with Apply marked (recommended). Requires `suggested_fix`. Demote to `manual` if missing. |
| `100`  | `manual`      | Enter the per-finding walk-through with user-judgment framing. `suggested_fix` is optional. |
| `75`   | `safe_auto`   | Demote to `gated_auto` before routing — silent apply is reserved for anchor `100` findings. Enter the walk-through with Apply marked (recommended). |
| `75`   | `gated_auto`  | Enter the per-finding walk-through with Apply marked (recommended). Requires `suggested_fix`. Demote to `manual` if missing. |
| `75`   | `manual`      | Enter the per-finding walk-through with user-judgment framing. `suggested_fix` is optional. |
| `50`   | any           | Surface in the FYI subsection regardless of `autofix_class`. Do not enter the walk-through or any bulk action. |

### 3.8 Sort

Sort findings for presentation: P0 → P1 → P2 → P3, then by finding type (errors before omissions), then by confidence anchor (descending: `100` first, then `75`, then `50`), then by document order (section position) as the deterministic final tiebreak.

**STOP. Before final rendering, if any persona submitted residual risks or deferred questions, read `references/synthesis-restatement-suppression.md` for the restatement suppression rules (3.9).**

## Phase 4: Apply and Present

**User-facing vocabulary rule (applies to ALL user-visible output in Phase 4).** Internal enum values — `safe_auto`, `gated_auto`, `manual`, `FYI` — stay inside the schema and synthesis prose. Every word the user sees in Phase 4 output MUST use user-facing vocabulary: "fixes" (for `safe_auto`), "proposed fixes" (for `gated_auto`), "decisions" (for `manual` findings at anchor `75` or `100`), "FYI observations" (for any finding at anchor `50`).

### Enforce Mutation Policy

Apply the run-local `mutation_policy` resolved in `SKILL.md` before any write-capable path:

- **`markdown-write`:** apply only `safe_auto` findings at confidence anchor `100` to the document in a single pass. Edit inline with the platform's edit tool, track each change for the rendered summary, and never silent-apply anchor `75` or `50` findings.
- **`report-only`:** do not edit the document, append Open Questions, enter the walkthrough, or invoke bulk Apply/Defer mechanics. Set `fixes_applied: 0`. Reclassify confidence-100 `safe_auto` findings as `producer_fix_candidates` in the envelope so an owning producer can decide whether to regenerate the artifact. Keep `gated_auto`, `manual`, FYI, residual, deferred, Coverage, and limitation surfaces intact.

For `report-only`, the reviewer never turns an HTML finding into a Markdown-style patch and never gains producer authority. A caller such as `spec-plan` may consume a uniquely determined producer-fix candidate and perform a full artifact recompose under its own contract; this review run remains byte-preserving. Interactive delivery does not weaken this boundary: return the same report-only envelope and do not load `references/walkthrough.md`, `references/bulk-preview.md`, or `references/open-questions-defer.md`.

Under `markdown-write`, list every applied fix in the output summary so the user can see what changed. Use enough detail to convey the substance of each fix (section, what was changed, reviewer attribution).

### Route Remaining Findings

After mutation-policy enforcement, remaining findings split into buckets:

- `gated_auto` and `manual` findings at confidence anchor `75` or `100` → enter the routing question only for `delivery_mode: interactive` plus `mutation_policy: markdown-write`
- FYI-subsection findings → surface in the presentation only, no routing
- Zero actionable findings remaining → skip the routing question; flow directly to Phase 5 terminal question

**Structured envelope:** Use this envelope whenever `delivery_mode: headless` or `mutation_policy: report-only`. Do not use interactive question tools on either path.

```
Document review complete.

delivery_mode: headless|interactive
mutation_policy: markdown-write|report-only
mutation_reason: caller-requested-apply-fixes|default-review-report-only|caller-requested-report-only|task-pack-derived-artifact|html-artifact|format-conflict-or-ambiguous|write-unavailable
review_status: complete|incomplete
task_pack_outcome: not-applicable | {review_result, task_pack_validity, deterministic_handoff, source_plan, reason_code, next_action}
fixes_applied: N
producer_fix_candidates: N
proposed_fixes_count: N
decisions_count: N
fyi_count: N
p0_p1_actionable_count: N

Applied N fixes:
- <section>: <what was changed> (<reviewer>)

Producer-fix candidates (report-only; caller-owned full recompose only):

[P0] Section: <section> — <title> (<reviewer>, confidence <anchor>)
  Why: <why_it_matters>
  Suggested producer correction: <suggested_fix>

Proposed fixes (concrete fix, requires user confirmation):

[P0] Section: <section> — <title> (<reviewer>, confidence <anchor>)
  Why: <why_it_matters>
  Suggested fix: <suggested_fix>

Decisions (requires user judgment):

[P1] Section: <section> — <title> (<reviewer>, confidence <anchor>)
  Why: <why_it_matters>
  Suggested fix: <suggested_fix or "none">

  Dependents (would resolve if this root is rejected):
    [P2] Section: <section> — <title> (<reviewer>, confidence <anchor>)
      Why: <why_it_matters>

FYI observations (anchor 50, no decision required):

[P3] Section: <section> — <title> (<reviewer>, confidence <anchor>)
  Why: <why_it_matters>

Residual concerns:
- <concern> (<source>)

Deferred questions:
- <question> (<source>)

Dropped: N (anchors 0/25 suppressed)
Chains: N root(s) with M dependents
Restated: N (residual/deferred items suppressed as duplicates of actionable findings)

Coverage:
- <persona>: <finding counts or malformed/failed/partial status>

Limitations:
- <mutation, reviewer coverage, provider, or evidence limitation>

Review complete
```

Omit any finding bucket with zero items, but keep every scalar envelope field so callers can parse zero counts. `fixes_applied` is always `0` under `report-only`; `producer_fix_candidates` is `0` under ordinary `markdown-write`. Non-task-pack review renders `task_pack_outcome: not-applicable` in text and `task_pack_outcome: null` in JSON. Task-pack review follows `task-pack-review-lens.md`: invalid deterministic intake yields `incomplete` without persona dispatch；completed semantic review with unresolved P0/P1 or a task-pack/source-plan blocker yields `blocked`；only valid current intake plus complete coverage and no unresolved P0/P1 yields `passed`. Set `review_status: incomplete` when both always-on reviewers produced no valid coverage and no equivalent inline review completed; do not emit a clean verdict or execution-ready implication on an incomplete review. When a root has dependents, render the root at its normal position in the severity-sorted list and nest its dependents as an indented `Dependents (...)` sub-block immediately below. End with "Review complete" as the terminal signal.

### JSON Rendering

当 `output_mode: json` 时，输出必须是一个可直接解析的 JSON object：不加 Markdown fence，不加对象前后的 prose，不把 enum、count 或 finding 压成一段自由文本。该单对象合同覆盖普通 text mode 的 cost-shape、reviewer announcement、进度公告和对象外 `Review complete` 终止文本；这些事实分别进入结构化 `coverage`、`limitations` 与 `terminal_signal`。复用上面的 envelope 语义，不创建新的 receipt、sealed input 或 authorization schema。

```json
{
  "delivery_mode": "headless|interactive",
  "output_mode": "json",
  "mutation_policy": "markdown-write|report-only",
  "mutation_reason": "caller-requested-apply-fixes|default-review-report-only|caller-requested-report-only|task-pack-derived-artifact|html-artifact|format-conflict-or-ambiguous|write-unavailable",
  "review_status": "complete|incomplete",
  "task_pack_outcome": null,
  "fixes_applied": 0,
  "applied_fixes": [],
  "counts": {
    "producer_fix_candidates": 0,
    "proposed_fixes": 0,
    "decisions": 0,
    "fyi": 0,
    "p0_p1_actionable": 0
  },
  "producer_fix_candidates": [],
  "proposed_fixes": [],
  "decisions": [],
  "fyi_observations": [],
  "residual_concerns": [],
  "deferred_questions": [],
  "coverage": [],
  "limitations": [],
  "terminal_signal": "Review complete"
}
```

`document_type: task-pack` 时，将 `task_pack_outcome: null` 替换为以下对象；这只是当前 review envelope 的一部分，不创建第二份 receipt、durable state 或 authorization schema：

```json
{
  "task_pack_validity": "valid|stale|wrong-chain|invalid|unverifiable",
  "deterministic_handoff": true,
  "source_plan": "docs/plans/...|null",
  "review_result": "passed|blocked|incomplete",
  "reason_code": "task-pack-review-passed|task-pack-regeneration-required|source-plan-revision-required|<validation-reason-code>",
  "next_action": "spec-work-task-pack|spec-write-tasks|spec-plan"
}
```

JSON 中每个 finding 保留 severity、section、title、reviewer、confidence、why_it_matters、suggested_fix 与 dependency/root 信息（存在时）。`fixes_applied` 始终是本次实际应用数量，`applied_fixes` 保存与 text envelope 相同的 section/change/reviewer 摘要：`report-only` 下必须分别为 `0` 与 `[]`，普通 `markdown-write` + `output:json` 则报告实际 `N` 与对应明细。`coverage` 同时保留 selected/skipped personas、cost shape、isolation 与 reviewer outcomes；confidence-100 `safe_auto` 在 `report-only` 下只进入 `producer_fix_candidates`；不得因 JSON 输出而获得 producer write authority。普通 `output_mode: text` 继续使用现有 Markdown/text envelope，默认行为不变。

**Compact rendering for FYI observations, residual concerns, and deferred questions (high-count mode).** When the combined count of these three buckets is 5 or more, collapse each to a one-line count followed by a tight bullet list without per-item `Why` expansion.

**Interactive `markdown-write` mode:**

Present findings using the review output template (read `references/review-output-template.md`). Within each severity level, separate findings by type:

- Errors (design tensions, contradictions, incorrect statements) first
- Omissions (missing steps, absent details, forgotten entries) second

Brief summary at the top: "Applied N fixes. K items need attention (X errors, Y omissions). Z FYI observations."

Include the Coverage table, applied fixes, FYI observations (as a distinct subsection), residual concerns, and deferred questions.

**All tables MUST be pipe-delimited markdown (`| col | col |`). Do NOT use ASCII box-drawing characters (`┌ ┬ ┐ ├ ┼ ┤ └ ┴ ┘ │ ─`).**

**STOP. Before Phase 4 presentation in round 2+, read `references/synthesis-multi-round.md` for the R29 rejected-finding suppression and R30 fix-landed matching predicate rules.**

### Protected Artifacts

During synthesis, discard any finding that recommends deleting or removing files in:

- `docs/brainstorms/`
- `docs/plans/`
- `docs/solutions/`

These are pipeline artifacts and must not be flagged for removal.

## Phase 5: Next Action — Terminal Question

**`output_mode: json`:** Return only the single JSON object defined in Phase 4. Put the terminal signal exclusively in `terminal_signal: "Review complete"`; do not append an object-external `Review complete`, progress line, question, numbered fallback, or any other prose. Do not enter the mutation-oriented next-action flow.

**Headless mode or `mutation_policy: report-only` with `output_mode: text`:** Return "Review complete" immediately after the structured text envelope. Do not ask questions and do not enter any mutation-oriented next-action flow.

**Interactive `markdown-write` mode:** fire the terminal question using the platform's blocking question tool. In Claude Code the tool should already be loaded from the Interactive-mode pre-load step in `SKILL.md` — if it isn't, call `ToolSearch` with `select:AskUserQuestion` now. Fall back to numbered options in chat only when no blocking tool exists in the harness or the call errors.

**Stem:** `Apply decisions and what next?`

**Options (three by default; two in the zero-actionable case):**

When `fixes_applied_count > 0`:

```
A. Apply decisions and proceed to <next stage>
B. Apply decisions and re-review
C. Exit without further action
```

When `fixes_applied_count == 0`:

```
A. Proceed to <next stage>
B. Exit without further action
```

The `<next stage>` substitution uses the document classification from Phase 1:

- `unified-requirements` → `spec-plan`
- `requirements` → `spec-plan`
- `unified-plan` → `spec-work`
- `plan` → `spec-work`
- `task-pack` → 不进入 interactive mutation question；按 `task_pack_outcome.next_action` 返回 `spec-work-task-pack`、`spec-write-tasks` 或 `spec-plan`

### Iteration limit

After 2 refinement passes, recommend completion — diminishing returns are likely. But if the user wants to continue, allow it.

For `output_mode: text`, return "Review complete" as the terminal signal for callers. For `output_mode: json`, the `terminal_signal` field is the only terminal signal.

## What NOT to Do

- Do not rewrite the entire document
- Do not add new sections or requirements the user didn't discuss
- Do not over-engineer or add complexity
- Do not create separate review files or add metadata sections
- Do not modify caller skills (spec-brainstorm, spec-plan, or external plugin skills that invoke spec-doc-review)
