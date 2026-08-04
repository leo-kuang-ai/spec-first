# Apply Code Review Findings (after `spec-code-review`)

Load this reference when `spec-code-review` has finished and **spec-work** (or another caller) should apply fixes before the Residual Work Gate.

`spec-code-review` is invoked here with `mode:agent`, so it is **review-only** in this context — it reports findings and writes artifacts and does not mutate the checkout, commit, push, or file tickets. **The caller owns apply/fix policy.** Standalone review is also report-only unless the current user explicitly requested review-and-fix; neither path grants commit or landing authorization.

## Owned

- Consume one completed review result and apply caller-authorized actionable findings.
- Preserve returned `artifact_path`, batch by file, integrate actual diffs, rerun affected verification, and return residuals.

## Not Owned

- Re-running review by default, changing reviewer verdicts, authorizing design/product decisions, committing, landing, or filing tickets.
- Treating `autofix_class` or a temp artifact path as permission/durable authority.

## Trigger

Load after `spec-code-review` returned actionable findings, or as the cold-caller fallback when review output is genuinely absent.

## Fallback

Use complete in-band JSON when the artifact is unavailable and preserve the limitation. Missing dispatch authorization/capability applies eligible fixes inline; missing design authority leaves the item residual. Do not recreate review merely to recover a temp artifact.

## Consume the completed review (do not re-run it)

This reference loads **after** review has run. In the spec-work shipping flow, step 3a already invoked `spec-code-review`; this apply step **consumes that output** — do not start a second review, which would waste reviewer dispatches and risk overwriting the artifact the Residual Work Gate reconciles.

Reuse the review output already in hand:

- Parsed JSON (`status`, `actionable_findings`, `findings`, `artifact_path`, `run_id`) **or** the markdown Actionable Findings summary captured by the caller
- Run artifact dir: the exact non-null `artifact_path` returned by that review (`review.json`, per-reviewer JSON for `why_it_matters`); never reconstruct it from `run_id`

If `status` is `failed`, stop shipping and surface `reason`. If `degraded`, note partial reviewer coverage before applying anything.

If `artifact_path` is null, missing, or unreadable, use the complete in-band JSON already returned by the review and record `review-artifact-unavailable`. Do not re-run the review just to recover an artifact. Detail that exists only in a missing per-reviewer file remains a limitation; never invent `why_it_matters` or evidence.

### Fallback — invoke review only for cold callers

Only when the caller reached this file **without** already running review (no review output in hand): invoke `spec-code-review` once, then proceed to apply. Do not invoke when the caller already ran review (e.g., spec-work shipping step 3a).

Invoke the skill explicitly — do not treat a casual "review my changes" prompt as a substitute unless the harness routed it to `spec-code-review`.

```
spec-code-review mode:agent plan:<plan-path> base:<merge-base-or-ref>
```

- `mode:agent` — JSON output (`review.json` + primary JSON response) for programmatic parsing; same review pipeline as default.
- `plan:` — when Phase 1 used a plan file (requirements completeness).
- `base:` — when the diff base is already resolved on the current checkout; omit when reviewing a PR number/URL or standalone current branch.
- Do **not** pass deprecated `mode:autofix`.

For a required task review, the cold caller must also pass the paired `task-pack:<path> task:<task_id> task-context:<path>` contract produced by spec-work. Missing task context is not repaired here.

For human / interactive shipping, invoke `spec-code-review` without `mode:agent` if markdown tables are preferred. Capture the same JSON / Actionable Findings and artifact dir listed above before applying.

## Required task review followup

When this reference is consuming a Task Card's `review_gate: required`, keep the dependent wave blocked until scope coverage and findings close. Apply eligible caller-owned findings, rerun affected verification, refresh the same task-context facts/digests, and run at most one bounded follow-up: two review rounds total (initial plus follow-up). If the second result is failed/degraded, `required_gate_eligible: false`, or still contains P0/P1/design-decision findings, stop and return the blocker. Preserve non-blocking P2/P3 findings for the final Residual Work Gate. The final full-branch review still runs later.

## Inputs for apply

- `actionable_findings` from JSON, or the Actionable Findings section from markdown
- Full finding detail when needed: `review.json` / artifact `findings`, or `{reviewer}.json` for `why_it_matters` and `evidence`
- Stable finding `#` — reuse in commits, residual sinks, and subagent prompts

## Session-temp versus durable evidence

The returned `artifact_path` is run-local session-temp evidence. It is valid for immediate followup in the same work run, but it is not durable handoff authority. Before resume/compaction, tracker filing, compound, release, or another cross-session consumer needs review detail, spec-work must either materialize a sanitized repo-local review evidence copy under its own work-run artifact directory or carry the structured finding summary plus `review-artifact-unavailable`/copy-failure limitation. Never persist a machine-specific temp path as the only evidence ref.

## What to apply

Default to applying every actionable finding. Applying is a reversible edit to a tracked tree; diffs are reviewed before commit (below) and tests run after — so leaving a clear, reversible fix unapplied "to be safe" is the failure mode, not the safe choice. Bias to act:

- **Apply** any finding with a concrete `suggested_fix` that is a clear improvement — the common case. `confidence` and `autofix_class` tell you what to prioritize and what to flag, not whether you may apply: `autofix_class` is signal, **never permission**.
- **Push back** — keep the finding, don't apply — when the reviewer is wrong; note why.
- **Flag, don't block, green-but-unverifiable edits** — when an applied fix touches auth/authz, a public or cross-service contract/schema, or concurrency, a passing test does not prove safety; apply it when there is a clear `suggested_fix` and confidence, and call it out prominently in the diff review.

There is no precondition safety checklist and no deny-list — a code-review fix is a reversible edit, so downside is controlled after the fact (diff review + tests + the commit checkpoint), not by gating the apply.

**Evidence still matches the code** — the fix subagent confirms at `file:line` before editing. The orchestrator does **not** open files just to decide eligibility or dispatch.

## What to defer (to the Residual Work Gate)

- `autofix_class: advisory` — report-only.
- Findings with no concrete `suggested_fix` to act on.
- Findings whose right fix depends on a design or product decision — architecture direction, contract shape, or a behavior change needing sign-off. These need a human call before code changes.

Surface what was deferred and why; never silently drop.

## Execution — orchestrator batches, authorized workers or inline apply

The orchestrator **does not investigate findings** (no pre-read of cited files to judge complexity or inline vs subagent). That would spend the context window you are trying to protect.

**Orchestrator owns:** parse review output -> **eligibility filter on JSON fields only** -> build batches -> choose authorized worker or inline fallback -> review diffs -> tests -> optional authorized commit -> Residual Work Gate.

**Fix subagents own:** read `file:line`, confirm evidence still matches, apply or skip with reason, return summary.

### Dispatch decision

After eligibility filtering, use `references/execution-strategy.md` dispatch facts. `worker_dispatch_authorization: authorized` and current-session `worker_dispatch_capability: available` are both required. Permission settings are not dispatch authorization; use `worker_capability_unproven` when discovery is unavailable, incomplete, or ambiguous.

- authorization + capability present -> use batched fix workers under the isolation/contention rules below;
- authorization missing -> apply eligible findings inline by file and record `dispatch_authorization_missing`;
- capability missing -> apply eligible findings inline by file and record `subagent_capability_missing`.

The fallback is not a reason to skip caller-authorized local fixes. It is a reason not to claim delegated or isolated execution.

**Batching (primary rule — group by file):**

1. Sort applicable findings by severity (P0 first).
2. **Group by `file`.** All eligible findings on the same file → **one subagent** (it loads the file once and works through its `#` list in severity order).
3. **Parallel waves:** batches with disjoint file sets may run in bounded parallel only when dispatch is authorized/callable; unknown isolation follows shared-directory rules from `execution-strategy.md`.
4. **Same file, many findings:** keep one subagent per file. If the prompt would exceed a comfortable size (~8 findings), split into **serial** subagent passes on that file (first batch highest severity, then next batch after merge or after the prior agent returns).
5. **Cross-file coupling:** do not merge unrelated files into one subagent just to reduce agent count — file grouping is the default. Only co-batch multiple files when findings explicitly reference the same small edit surface (rare); when in doubt, separate by file.

**Subagent prompt (per batch):** the assigned findings only (`#`, severity, file, line, title, `suggested_fix`, `requires_verification`; add `why_it_matters` from `{reviewer}.json` under returned `artifact_path` when available and useful), plus:
- Work through assigned `#` in severity order; at each `file:line`, skip with a one-line reason if evidence no longer matches
- Apply the mechanical bar from § What to apply / What not to apply — skip anything that needs design judgment
- Do not re-run `spec-code-review`
- Shared-directory fallback: do not stage or commit — return which `#` were applied or skipped and which files changed

**After each wave:** the orchestrator reviews diffs (scope = assigned `#` only) and runs tests (`requires_verification: true` on any applied finding -> at least targeted tests; multi-file -> broader suite). Commit only when `commit_authorization: authorized`; otherwise leave verified fixes uncommitted. Workers never commit. Repeat until all batches complete.

### Optional inline shortcut (skip subagent spawn)

Use **only** when **all** of the following hold:

- Exactly **one** eligible finding after JSON filtering, **and**
- The orchestrator **already** has that file's relevant region in context from Phase 2 work this session (no new Read/Grep expedition)

Otherwise use the authorized batch path; when dispatch is not authorized/callable, use the same file batch inline.

### Summary (required)

Report: dispatch posture/reason code, batches executed, `#` applied vs skipped, returned artifact_path or its limitation, tests run, and commit status/authorization.

## Handoff to Residual Work Gate

Any actionable finding not applied in this pass is **residual work** — proceed to the Residual Work Gate with an updated count. Do not re-invoke `spec-code-review` solely to re-apply the same findings unless the diff changed materially after fixes.
