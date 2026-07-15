# Shipping Workflow

This file contains the shipping workflow (Phase 3-4). It is loaded when all Phase 2 tasks are complete and execution transitions to quality check.

## Phase 3: Quality Check

1. **Run Core Quality Checks**

   Always run before submitting:

   ```bash
   # Run full test suite (use project's test command)
   # Examples: bin/rails test, npm test, pytest, go test, etc.

   # Run linting (per the project's configured lint command / active instructions)
   # Use linting-agent before pushing to origin
   ```

2. **Simplify** (conditional — separate from code review)

   Before code review, invoke **`spec-simplify-code`** when the diff is non-mechanical and large enough to benefit (default: **>=30 changed lines**). Skip when the diff is purely mechanical (formatting, dependency bumps, lint-only fixes, generated artifacts).

   This step refines reuse, quality, and efficiency on the **current diff** so any later review sees cleaner code. It is not a substitute for code review.

   Pass `plan:<path>` or a scope hint when the plan or user narrowed what changed. If the skill is unavailable on the harness, skip or do a brief manual pass for obvious duplicate/dead code — code review (step 3) still runs regardless.

3. **Code Review**

   Review the diff with **`spec-code-review`** — the spec-first portable review skill — as the single path. It self-right-sizes (a lite roster for small, low-risk, code-only diffs; the full roster otherwise), so there is no "escalate to a heavier reviewer" decision and **no harness-specific review detection** — it behaves identically on every harness. (This replaces the former Tier 1 harness-native `/review` / Tier 2 escalation split: the size and sensitive-surface judgment that used to live here now lives inside `spec-code-review`'s own reviewer selection and small-diff gate.)

   **Skip dedicated review only for a purely mechanical diff** — formatting, dependency-version bumps, lint-only fixes, generated artifacts (the same class step 2 skips for simplify). Note in the shipping summary: `Code review: skipped (mechanical diff)`. Everything else gets reviewed.

   **Review is not fix — two steps:**

   **3a. Review (read-only).** Invoke `spec-code-review` with `mode:agent` (add `plan:<path>` when known; `base:<ref>` when the diff base is resolved). Pass **`depth:full`** when the plan, the task, or the user explicitly asked for a full / deep / thorough review — that is the one escalation signal `spec-code-review` cannot infer from the diff alone. Do not pass `mode:autofix`. Parse the JSON.

   **3b. Apply fixes (caller-owned).** Load `references/review-findings-followup.md`: filter on JSON, batch by file, dispatch fix subagents. Orchestrator merges, tests, commits. Then proceed to the Residual Work Gate.

   **If `spec-code-review` cannot run at all** — subagent dispatch unavailable, unauthenticated, or hard-capped, returning `status: failed`/`degraded` with no coverage even after its own sequential Fallback: in an **interactive** session, run the harness-native review if one exists (e.g. `/review`) and fix inline; in a **non-interactive** session (autonomous pipeline, or no native review available), skip the dedicated step, note `Code review: skipped (spec-code-review unavailable)`, and add an explicit manual diff scan to Final Validation. Never silently ship a non-mechanical change with no review of any kind.

4. **Residual Work Gate** (REQUIRED when `spec-code-review` ran and left actionable residuals)

   After code review and review-findings followup, inspect the **Actionable Findings** summary (or read the run artifact at `/tmp/spec-first/spec-code-review/<run-id>/` if the summary was truncated). If one or more actionable `downstream-resolver` findings were not applied in followup, do not proceed to Final Validation until they are resolved or durably recorded.

   **Non-interactive / autonomous sessions (no human can answer — e.g. an `lfg`-style pipeline or a headless run):** do **not** call the blocking tool — that would hang the pipeline. After step 3b auto-applied every mechanically-eligible finding, take the `Accept and proceed` path automatically: record the remaining actionable residuals verbatim to the durable Known Residuals sink (the PR description's Known Residuals section, or `docs/residual-review-findings/<branch-or-head-sha>.md` on the no-PR path) and continue to Final Validation. Residuals are recorded, never dropped — this keeps autonomous shipping unblocked without losing findings.

   **Interactive sessions:** Ask the user using the platform's blocking question tool (`AskUserQuestion` in Claude Code with `ToolSearch select:AskUserQuestion` pre-loaded if needed, `request_user_input` in Codex). Fall back to numbered options in chat only when the harness genuinely lacks a blocking tool. Never silently skip the gate.

   Stem: `Code review left N actionable finding(s) not yet fixed. How should the agent proceed?`

   Options (four or fewer, self-contained labels):
   - `Apply/fix now` — load `references/review-findings-followup.md`, dispatch batched fix subagents for remaining eligible findings, run tests, commit if needed; optionally re-run `spec-code-review` only after the diff changed materially.
   - `File tickets via project tracker` — load `references/tracker-defer.md` in Interactive mode; the agent files tickets in the project's detected tracker (or `gh` fallback, or leaves them in the report if no sink exists) and proceeds to Final Validation.
   - `Accept and proceed` — record the residual findings verbatim in a durable "Known Residuals" sink before shipping. If a PR will be created or updated in Phase 4, include them in the PR description's "Known Residuals" section (the agent owns this when calling `spec-commit-push-pr`). If the user later chooses the no-PR `spec-commit` path, create `docs/residual-review-findings/<branch-or-head-sha>.md`, include the accepted findings and source review-run context, stage it with the implementation commit, and mention the file path in the final summary. The user has acknowledged the risk, but the findings must not live only in the transient session.
   - `Stop — do not ship` — abort the shipping workflow. The user will handle findings manually before re-invoking.

   Skip this gate entirely when the review reported `Actionable findings: none.` (and followup applied everything mechanical), or when dedicated review was skipped (mechanical diff or `spec-code-review` unavailable). Do not proceed past this gate on an `Accept and proceed` decision (including the autonomous auto-accept above) until the agent has recorded whether the durable sink is `PR Known Residuals` or `docs/residual-review-findings/<branch-or-head-sha>.md`.

5. **Final Validation**
   - All tasks marked completed
   - Testing addressed -- tests pass and new/changed behavior has corresponding test coverage (or an explicit justification for why tests are not needed)
   - Linting passes
   - Code follows existing patterns
   - Figma designs match (if applicable)
   - No console errors or warnings
   - If the plan has a `Requirements` section (or legacy `Requirements Trace`), verify each requirement is satisfied by the completed work
   - If any `Deferred to Implementation` questions were noted, confirm they were resolved during execution

5.1 **Plan Status Closeout**

   This is the only shipping closeout that may mutate plan `status`. Run it only after Final Validation, required review, and Residual Work Gate obligations have closed. `completed` is an audit marker for scoped development work; it is not proof of tests, CI, merge, release, or field outcome. Leaf workers, reviewers, and fix subagents never perform this mutation.

   Resolve lifecycle applicability before calling the helper:

   - A lifecycle-managed candidate is a non-symlink regular direct `docs/plans/*.md` software plan with exactly one readable status: either `artifact_contract: spec-unified-plan/v1` plus `execution: code`, or a compatible legacy `type: feat | fix | refactor` plan whose execution is absent or `code`. Only `active` and `completed` candidates enter the mutation helper.
   - Direct lifecycle-managed Markdown plan: update that plan.
   - Validated task pack input: require exactly one `source_plan`; update it only when it resolves to the lifecycle-managed candidate above. The task pack stays `status: derived` or `draft`.
   - Return-to-Caller: do not write. Return both `plan_status_completion_candidate` and `plan_status_completion_degraded_reason` so LFG/caller can apply the same decision after its own gates.
   - HTML, historical missing/closed plans, read-compatible `partially-shipped`/`superseded` plans, and otherwise valid source plans outside the direct Markdown boundary: do not mutate. Report respectively `html-plan-lifecycle-degraded`, `legacy-plan-lifecycle-degraded`, `read-compatible-status-unmanaged`, or `source-plan-path-lifecycle-degraded`. These explicit degraded outcomes do not invalidate development completion already established by verification and review.

   For an applicable candidate, invoke `spec-first internal plan-status complete --target-repo <root> --plan <repo-relative-source-plan> --json`. `active → completed` and `plan-status-already-completed` are successful closeouts. Duplicate, malformed, invalid, unsafe-path, read, or write failures on an applicable lifecycle-managed plan keep it unchanged and block the lifecycle closeout claim. Missing status on a unified lifecycle-managed Markdown plan is also a contract failure; legacy missing/closed status follows the explicit degraded branch above rather than forcing migration. The helper re-reads current disk content and uses the shared temp-file + rename writer: POSIX replacement is atomic, Windows replacement is best effort with retry, and neither path is a cross-process CAS. The shipping-tail single-writer rule remains a loud convention.

6. **Prepare Operational Validation Plan** (REQUIRED)
   - Add a `## Post-Deploy Monitoring & Validation` section to the PR description for every change.
   - Include concrete:
     - Log queries/search terms
     - Metrics or dashboards to watch
     - Expected healthy signals
     - Failure signals and rollback/mitigation trigger
     - Validation window and owner
   - If there is truly no production/runtime impact, still include the section with: `No additional operational monitoring required` and a one-line reason.

## Phase 4: Ship It

1. **Prepare Validation Context**

   Do not try to launch a dedicated spec-first evidence-capture workflow. Modern harnesses provide their own browser, screenshot, terminal recording, and artifact capture tools; use those directly only when the user asks or when the artifact already exists.

   Note whether the completed work has observable behavior (UI rendering, CLI output, API/library behavior with a runnable example, generated artifacts, or workflow output), and summarize any manual validation performed. If the user supplied evidence (URL, markdown embed, local artifact path), pass it to `spec-commit-push-pr` as PR-description context.

2. **Commit and Create Pull Request**

   Load the `spec-commit-push-pr` skill to handle committing, pushing, and PR creation. The skill handles convention detection, branch safety, logical commit splitting, adaptive PR descriptions, and attribution badges.

   When providing context for the PR description, include:
   - The plan's summary and key decisions
   - Testing notes (tests added/modified, manual testing performed)
   - Evidence context from step 1, so `spec-commit-push-pr` can decide whether to ask about capturing evidence
   - Figma design link (if applicable)
   - The Post-Deploy Monitoring & Validation section (see Phase 3 Step 6)
   - Any "Known Residuals" accepted in the Phase 3 Residual Work Gate, rendered as a dedicated section in the PR body with severity, file:line, and title per finding

   If the user prefers to commit without creating a PR, load the `spec-commit` skill instead.

3. **Notify User**
   - Summarize what was completed
   - Link to PR (if one was created)
   - Note any follow-up work needed
   - Suggest next steps if applicable

## Quality Checklist

Before creating PR, verify:

- [ ] All clarifying questions asked and answered
- [ ] All tasks marked completed
- [ ] Testing addressed -- tests pass AND new/changed behavior has corresponding test coverage (or an explicit justification for why tests are not needed)
- [ ] Linting passes (use linting-agent)
- [ ] Code follows existing patterns
- [ ] Figma designs match implementation (if applicable)
- [ ] Validation/evidence context passed to `spec-commit-push-pr` when the change has observable behavior
- [ ] Commit messages follow conventional format
- [ ] PR description includes Post-Deploy Monitoring & Validation section (or explicit no-impact rationale)
- [ ] Simplify: `spec-simplify-code` when diff >=30 lines (or skipped with reason)
- [ ] Code review: `spec-code-review` ran (self-sized), or skipped (mechanical diff / unavailable — noted in summary); residuals handled via the Residual Work Gate
- [ ] PR description includes summary, testing notes, and evidence when captured
- [ ] PR description includes Spec-First badge with accurate model and harness

## Code Review

Single portable path: **`spec-code-review`** self-sizes (lite roster for small low-risk code-only diffs, full roster otherwise). No harness-native review detection, no escalation tiers — the size/sensitive-surface judgment lives inside `spec-code-review` now.

**Skip** only for a purely mechanical diff (formatting, dep-bumps, lint-only, generated). Everything else is reviewed.

**Two steps — review is not fix.** (3a) Review-only via `mode:agent`; add `depth:full` when the plan/task/user explicitly asked for a deep review. (3b) Batched fix subagents per `references/review-findings-followup.md`; residuals → Residual Work Gate.

**If `spec-code-review` can't run** (no subagent dispatch): interactive → harness-native review if present, fix inline; non-interactive → skip-with-note + manual diff scan in Final Validation. Never silently ship a non-mechanical change unreviewed.
