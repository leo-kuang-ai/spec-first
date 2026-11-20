# Shipping Workflow

This file contains the shipping workflow (Phase 3-4). It is loaded when all Phase 2 tasks are complete and execution transitions to quality check.

## Owned

- Final simplify/review/residual gates, final verification, structured closeout, conditional work run artifact, lifecycle closeout, and authorization-aware handoff/landing.
- Materialize portable review evidence and keep completion claims tied to actual checks.

## Not Owned

- Plan/task-pack intake, implementation decomposition, worker dispatch internals, product/architecture redesign, or inferred commit/landing authorization.
- Treating lifecycle status, review prose, or planned commands as completion evidence.

## Trigger

Load only after every in-scope Phase 2 task/unit is accounted for and implementation mutation is ready to enter quality/shipping. Return-to-Caller loads only the structured evidence closeout subset it owns.

## Fallback

If this reference cannot be read or a required quality/evidence gate cannot run, do not claim completion, mutate plan lifecycle, commit, push, or open a PR. Return the verified implementation facts available plus explicit not-run/degraded reason and the owner action needed.

## Contents

- [Phase 3: Quality Check](#phase-3-quality-check)
- [Phase 4: Ship It](#phase-4-ship-it)
- [Quality Checklist](#quality-checklist)
- [Code Review](#code-review)

## Required-Proof Reconciliation

Final verification does not only check whether the check items already written into the run summary are green, but also returns to the source plan/task's Verification Contract to perform a semantic reconciliation of all required proof intents:

- Each required intent must correspond to an actual result, clearly state the rationale for "`not applicable`," or include an owner/unblock condition for a `deferred` intent, or specify a concrete `unbound limitation`; omission of any required intent blocks the achievement of "`complete`" and "`verified`" status.
- Evidence authority record: `transcribed` indicates the caller's transcription of the command/result; `provider-confirmed` requires verifiable provider acknowledgment or receipt from a supervised process. Neither shall be inferred automatically from natural language declarations, non-empty command, or exit code.
- Record source binding individually: `source-bound` requires the final revision, working-tree fingerprint, or enclosing artifact identity. source-bound does not imply provider-confirmed; provider-confirmed does not imply that it ran after the last behavior-bearing mutation.
- After the last implementation, simplify, fixture, or review-fix mutation, the affected required checks must be freshly rerun before reconciliation can be completed.
- The first-round reconciliation is an LLM-owned semantic exit gate, not a runtime hard enforcement of the existing schema. Scripts enforce deterministic floor for summary/claim; LLM/human judgment on whether intent is complete, validity of N/A rationale, and claim ceiling. One must not claim that all required proofs have been mechanically verified merely because the schema has passed.

Save the reconciliation conclusion or missing-intent list in Completion Response and structured closeout limitations. Evidence authority and source binding are not included in the `verification-run-summary.v1` check field; instead, they are carried by the `claim_limitations` and `verified_worktree_fingerprint` in the closeout envelope, as well as the enclosing `spec-work-run-artifact/v2` at the time of persistence. All three must reference the same run-id/source state and cannot be automatically inferred from one another. Completion cannot be claimed even if all checks have passed, until reconciliation has been successfully completed.

## Phase 3: Quality Check

1. **Prepare Verification Run**

   Before any simplify, review, follow-up, or residual fix, fix a target repo, a fresh safe `run-id`, and the final validation candidate set; within the same shipping closeout, logs, run summary, and conditional run artifact must reuse the same `run-id`. Call first:

   ```bash
   spec-first internal verification-profile load \
     --target-repo <repo-root> \
     --json
   ```

   The `verification-profile` only prepares candidate checks and tool facts without executing commands or determining whether the checks are semantically sufficient. The LLM selects the final checks based on active instructions, plan requirements, changed surfaces, and project scripts; commands mentioned in plans, profiles, or documents are only candidates and have not been executed. Planned commands that were not actually run do not constitute run evidence and must not be marked as `passed`. Select at least two types of sources: commands declared in plan/task, and governance suites (governance, byte-budget, ordering, projection types) discovered by reverse-tracing touched paths in the test directory (as described in Step 3 of Test Discovery in `feedback-and-tests.md`). When CHANGELOG, version files, or release-related files are modified, the release governance suite (such as the one in this repository `npm run test:release:governance`) must also be included in the candidate pipeline—CI typically enforces this on PRs, while local execution without running it will defer issues to a round trip for rework.

   Reserved repo-local run root: `.spec-first/workflows/spec-work/<workspace-slug>/<run-id>/`Do not call `verification-run-summary record` prematurely: subsequent simplify/review fixes might alter the code, and the final summary can only reflect the true results after all mutations have completed.

   Preserve `run.json` as immutable generation-0 identity; in a fresh run it is first written by the Step D producer at closeout. The append-only state contract from `execution-strategy.md` therefore applies from the moment a durable `run.json` exists — resumed runs, and any later transaction of a run whose Step D artifact has landed: record `started` before execution and append the confirmed terminal fact afterward. A resumed `started` transaction is unknown, never passed. CAS conflict or source drift blocks completion until the orchestrator re-reads and reconciles the current tree. A fresh run interrupted before its durable artifact exists has no state generations to resume from: recover via workspace fingerprint, task-pack pins, and git state, and do not call `state-write` before `run.json` exists (it rejects with `artifact-unreadable`).

2. **Simplify** (conditional — separate from code review)

   Before code review, invoke **`spec-simplify-code`** when the diff is non-mechanical and large enough to benefit (default: **>=30 changed lines**; this final pass counts all changed lines, whereas the phase-boundary threshold in `implementation-loop.md` counts substantive human-authored lines only — both defaults coexist on purpose). Skip when the diff is purely mechanical (formatting, dependency bumps, lint-only fixes, generated artifacts).

   This step refines reuse, quality, and efficiency on the **current diff** so any later review sees cleaner code. It is not a substitute for code review.

   Pass `plan:<path>` or a scope hint when the plan or user narrowed what changed. If the skill is unavailable on the harness, skip or perform a brief manual review for obvious duplicate/dead code — proceed with the corresponding review according to risk rules in Step 3.

   At this handoff, apply `references/feedback-and-tests.md` § Preserve proof through cleanup. Pass every evidence-bound test as `proof-test:<path>` with its unit/task, test-only seams, command/log refs and current byte identity. These are protection context, not wider scope. Consume the returned preservation comparison and missing/stale limitations; rerun the original symptom and proof tests after edits before final-tree closeout.

3. **Code Review**

   First, select the review intensity based on the actual impact scope, not just the number of lines. A explicit directed diff review can be performed by the owner if all of the following conditions are met: a clear and well-defined boundary, reversible local behavior, and sufficient targeted validation already exists; no changes to permissions, security, payment, persistence/migration, concurrency, external side effects, public/cross-module contracts, or source/runtime governance; and no independent or complete review is required for users, plans, or tasks. Record the path, findings, and local verification of the code review, annotate as `Code review: targeted manual (bounded low-risk change)`, and do not refer to it as an independent review. When impact is uncertain, return to specialized review.

   The remaining non-mechanical changes use the portable **`spec-code-review`** path, which selects between lite and full roster; no separate review process is established based on host reconstruction. Clearly and comprehensively review, essential task review, and the aforementioned risk conditions are always retained. Pure mechanical changes can be recorded as `Code review: skipped (mechanical diff)`; changes to dependencies or generated files that alter runtime behavior cannot be exempted solely based on file type. Any manual review finding that proceeds to Step 4, subsequent verification and evidence release will not be skipped.

   Task-pack `review_gate: required` reviews are early, bounded feedback only. They never replace this full work-run/branch review, even when every Task Card closed cleanly.

   **Review is not fix — two steps:**

   **3a. Review (read-only; applies to changes selected for specialized review above).** Invoke `spec-code-review` with `mode:agent` (add `plan:<path>` when known; `base:<ref>` when the diff base is resolved).** Pass **`depth:full`** when the plan, the task, or the user explicitly asked for a full / deep / thorough review — that is the one escalation signal `spec-code-review` cannot infer from the diff alone. Do not pass `mode:autofix`. Parse the JSON and retain its concrete `artifact_path`; never derive an artifact directory from `run_id`.

   **3b. Apply fixes (caller-owned).** Load `references/review-findings-followup.md`: filter on JSON, batch by file, and use only explicitly authorized worker dispatch. The orchestrator integrates and tests. Commit only when `commit_authorization: authorized`; otherwise keep the verified review fixes uncommitted. Then proceed to the Residual Work Gate.

   **If independent `spec-code-review` coverage is unavailable** — established only by the cataloged skill definition failing to load, or by an attempted top-level invocation terminating with `status: failed`/`degraded` without independent coverage (carrying its own reason codes such as `dispatch_authorization_missing`, `subagent_capability_missing`, `worker_capability_unproven`, or unauthenticated/hard-capped dispatch); intermediate internal events never establish caller-owned unavailability, and a missing dedicated runner or binary is not evidence when the definition loads — preserve any bounded inline findings, but treat the dedicated review as unavailable. In an **interactive** session, run the harness-native report-only review if the session catalog lists one (use that entry's listed path; it is not a spec-first skill) and apply fixes only under the existing caller authorization; when no native reviewer exists, perform and record an explicit manual diff scan. In a **non-interactive** session, note `Code review: skipped (independent spec-code-review unavailable)` and add the manual diff scan to Final Validation. This fallback is not persona/validator/cross-model evidence, and required task-level review gates remain blocked when their contract requires independent coverage. Never silently ship a non-mechanical change with no review of any kind.

4. **Residual Work Gate** (applies whenever any review leaves actionable residuals, including inline/manual review)

   After code review and review-findings followup, use the **Actionable Findings** summary to locate residuals. Determine fix eligibility from `review.json` under the returned non-null `artifact_path` or from complete same-run in-band JSON. A summary alone cannot clear this gate. If `artifact_path` is unavailable, preserve the limitation; do not re-run review just to recreate a temp artifact. If one or more actionable `downstream-resolver` findings were not applied in followup, do not proceed to Final Validation until they are resolved or durably recorded.

   **Honor existing repair authorization:** When the current user or visible caller has requested review and repair, resolve actionable residuals within scope and rerun affected verification without asking again whether to fix the same issue. Ask only about new decisions that change the product, acceptance, permissions, or material consequences.

   **Non-interactive / autonomous sessions:** Headless mode does not authorize risk acceptance or prove that no user can answer. P0/P1 findings, permission or truthfulness issues, and failed or unrun required verification for this task cannot automatically enter `Accept and proceed`. Continue repairs within existing scope; record missing dependencies as pending, never fabricate accepted status, and retain blocked/not-complete status. Only existing explicit risk acceptance covering specific P2/P3 residuals permits Final Validation after recording each decision and durable Known Residuals, provided acceptance criteria remain unchanged and none of the serious boundaries above apply. When no user can answer, do not call an unavailable blocking tool; continue independent work and report the blocker honestly.

   **Interactive sessions:** Ask only about decisions not covered by existing authorization. Use an available question channel; a missing tool neither waives a necessary decision nor requires repeated approval for authorized repairs.

   Stem: `Code review left N actionable finding(s) not yet fixed. How should the agent proceed?`

   Options (four or fewer, self-contained labels):
   - `Apply/fix now` — load `references/review-findings-followup.md`, use authorized batched fix workers or inline fallback for remaining eligible findings, and run tests. Commit only when separately authorized; optionally re-run `spec-code-review` only after the diff changed materially.
   - `File tickets via project tracker` — load `references/tracker-defer.md` in Interactive mode. File only in an authorized destination; keep other findings in the report.
   - `Accept and proceed` — record the residual findings verbatim in a durable "Known Residuals" sink before shipping. If a PR will be created or updated in Phase 4, include them in the PR description's "Known Residuals" section (the agent owns this when calling `spec-commit-push-pr`). If the user later chooses the no-PR `spec-commit` path, create `docs/residual-review-findings/<branch-or-head-sha>.md`, include the accepted findings and source review-run context, stage it with the implementation commit, and mention the file path in the final summary. The user has acknowledged the risk, but the findings must not live only in the transient session.
   - `Stop — do not ship` — abort the shipping workflow. The user will handle findings manually before re-invoking.

   Skip this gate only when review leaves no actionable residuals; unavailable independent review does not waive inline/manual findings. Before applying an explicit `Accept and proceed` decision, record its scope, basis, and durable sink: `PR Known Residuals` or `docs/residual-review-findings/<branch-or-head-sha>.md`. Recording residuals does not prove risk acceptance, and risk acceptance cannot turn failed required verification for this task into a pass.

   A session-temp review `artifact_path` is never the durable sink. When later shipping, resume, tracker, compound, or release work needs full review evidence, materialize sanitized repo-local review evidence in the current spec-work run artifact and reference that copy; if materialization fails, preserve the structured finding summary and an explicit copy-failure limitation. Never persist only the temp path.

4.5 **Source Plan Semantic Review (before Final Validation)**

   When a readable Markdown source plan is being executed, the shipping caller performs a read-only semantic validation before entering Final Validation. Task-pack input uses its unique `source_plan`; HTML/legacy-unmanaged or no plan input records with not-applicable reason, no invented alternative artifact.

   1. Resolve `SKILL_DIR` from the directory containing the loaded `spec-work/SKILL.md`, and invoke `node "$SKILL_DIR/scripts/source-plan-file-hash.cjs" "<source-plan>"` with the artifact root as the current working directory, requiring the stdout to exactly match `sha256:<64-hex>`, and save the before hash. Bundled helpers must not be located from the `skills/spec-work/` source checkout path under the project's current working directory; the five-host runtime projection uses its own loaded Skill root. The helper reads the raw bytes of the complete file including frontmatter; the frontmatter body hash of `tasks hash` is used only for task-pack identity and not for this freshness gate.
   2. Call `spec-doc-review mode:headless mutation:report-only output:json <source-plan>`. Reviewer maintains zero-write; the shipping caller parses only JSON and does not treat natural language approximations as envelopes.
   3. Validate envelope to ensure it satisfies: `output_mode: json`, `mutation_policy: report-only`, Markdown source plan has `mutation_reason: caller-requested-report-only`, `review_status: complete`, `fixes_applied: 0`, and all fields including counts, finding arrays, coverage, limitations, and `terminal_signal: Review complete` are present and of correct type. Record `doc-review-json-invalid` when invalid; do not proceed to Final Validation.
   4. Immediately recalculate the after hash using the same `SKILL_DIR` helper. When the hash differs from before, discard the current review result and rerun the process using the new before hash; if a drift is still detected on the second attempt, record a blocker `plan-changed-during-review`. Do not patch hashes, compare session claims, or introduce signatures, DACLs, or a sealed pipeline.
   5. After hash consistency, P0/P1 handling: the caller can return to the plan owner a unique and explicit `producer_fix_candidates` for complete artifact recomposition. Any recompose must first return to the source-plan/task-pack intake, regenerate or validate the task pack, rerun semantic-fit, and rerun the implementation verification and code review for affected components; only after the evidence is refreshed can the before/review/after steps be reexecuted. Other P0/P1 issues must be explicitly resolved, accepted as residual, or discontinued by the current maintainer. Any undischarged P0/P1, `review_status: incomplete`, invalid envelope, or hash mismatch will block Final Validation.

   This review verifies the review envelope for the current hash corresponding to the plan; it does not verify the correctness of findings, completion of implementation, or field outcomes. `spec-doc-review` does not directly modify plan; before/after freshness and P0/P1 disposition are always maintained by the shipping caller.

5. **Final Validation**
   - All tasks marked completed
   - Testing addressed -- tests pass and new/changed behavior has corresponding test coverage (or an explicit justification for why tests are not needed)
   - Linting passes
   - Code follows existing patterns
   - Figma designs match (if applicable)
   - No console errors or warnings
   - If the plan has a `Requirements` section (or legacy `Requirements Trace`), verify each requirement is satisfied by the completed work
   - If any `Deferred to Implementation` questions were noted, confirm they were resolved during execution

   Now it is actually executed (actually run) Step 1: the final selected checks. Each check records the actual `command`, `ran`, `exit_code`, `status`, `required_tools`, `missing_tools`, and `reason_code`, and writes the bounded, secret-stripped output as a redacted log relative to the current run root, for example `.spec-first/workflows/spec-work/<workspace-slug>/<run-id>/logs/<check-id>.log`. Do not use terminal transcript, session temporary path, or non-de-identified raw output directly as durable log.

   - Declare that the working tree is being checked, and execute the `scripts/working-tree-fingerprint.cjs` script from the target repository both before and after the final check group begins and ends. The initial value will be written to the top-level `checked_worktree_fingerprint` in the summary only when the two `fingerprint` values are consistent. If behavior changes occur, discard the current group's status as final evidence and re-verify; if stable fingerprints cannot be obtained, retain the historical results and constraints, and do not retroactively fill in at the end.
   - `passed` allows only `ran=true`, `exit_code=0`, and the presence of a repo-relative redacted log.
   - `failed` must retain the actual non-zero `exit_code` and logs; it must not be rewritten as `passed` due to subsequent interpretation.
   - A dry-run or a check that is schedulable but not executed must be `not-run` + `reason_code: schedulable`; it must not be upgraded to `passed`.
   - Missing tools must be `not-run` + `reason_code: missing_dependency`, and shall list `missing_tools`.
   - When simplifying, reviewing follow-up, or addressing residual fixes affect the coverage of a check, the final closeout must be based on post-fix rerun results; pre-fix green light results cannot support the final completion claim.

5.1 **Structured Verification And Evidence Closeout**

   Complete the following steps in sequence. Scripts verify and transcribe only deterministic facts; LLMs remain responsible for selecting checks, evaluating claims, choosing durable triggers, and interpreting limitations.

   **A. Pre-existing object requires review evidence to be retained across sessions.**If the task/final `spec-code-review` returns an OS session-temp `artifact_path`, only filter and select the `review.json` and structured finding summary that were actually consumed by the current `spec-work` caller; sanitize and redact the content, then copy it to the current `.spec-first/workflows/spec-work/<workspace-slug>/<run-id>/review/`. The replication target is a regular file within the target repo; symlinks, path escapes, or machine-specific absolute paths are not accepted.

   Fails to copy while retaining the in-band structured finding summary and adds the `review-evidence-copy-failed` limitation. Must not store absolute temp paths in `artifact_refs`, `read_artifacts`, run artifacts, resume, tracker, compound, release, or final cross-session handoff; copy failures must explicitly retain limitations and cannot be masked by "review completed" as evidence is not transferable.

   **B. Record immutable verification summary.** Assemble the `verification-run-summary` input based on the actual results from Final Validation, then call:

   ```bash
   spec-first internal verification-run-summary record \
     --workflow spec-work \
     --input <verification-run-summary-input.json> \
     --run-id <run-id> \
     --target-repo <repo-root> \
     --json
   ```

   Save the returned `run_summary_ref`. Helper does not execute or retry commands, does not infer exit code, and does not perform deep log cleaning; it only validates payload, path, log prefix, and schema. `checks[].command` must exactly match the actual executed command string (including pipelines, redirections, and the final form after expansion of prefix variables); rewriting an actual pipeline into an idealized single-command string (e.g., converting `grep -n … | tee log` into `grep -c …`) constitutes forged evidence of validation, even if the resulting numerical values are identical. schema sets the `command` length limit to 500 characters (`verification-run-summary.schema.json`): when actual verification requires a longer command, the verification logic is materialized into a script file under the `run` directory and executed; the `command` field records the shortened form of this actual invocation—truncating or altering a long command that has already been executed is considered forgery. After rejection due to `run-summary-schema-invalid`, correct the payload based on specific validation errors (for excessively long actual commands, use a shortened, recordable invocation for revalidation and record its actual outcome); if retries are still rejected, and recovery requires new authorization or the tool is unavailable, follow the Fallback and E-step contract in this document by recording `null` ref plus explicit `claim_limitations` to document the rejection reason and attempted recovery actions—failure to record does not imply validation failure or success; do not treat it as a successful outcome. Summary for the same workspace/run-id is immutable; `run-summary-already-exists` cannot be fixed by overriding the existing file; the reason must be preserved and the verified closeout claim must be terminated.

   **C. Validate structured claims.** Use actual run summary to assemble validation claims; review/impact claims can only reference ordinary files that exist in the target repository, such as the review summary, source/plan, or changed-surface evidence from the previous step.**Run:

   For the current code's declaration, the input must include `validation_scope: current-worktree`. If the summary is not bound, the working tree has changed, or the fingerprint is unavailable, return the restriction as-is or rerun with the current version; do not use `recorded-run` to resolve the blockage. Clear the version targeted to readers, specify the actions that have been verified, and indicate which remain under review.

   ```bash
   spec-first internal honest-closeout validate \
     --input <honest-closeout-claims.json> \
     --target-repo <repo-root> \
     --json
   ```

   validation claim uses `verification-run-summary:<check-id>`; do not cherry-pick passed items to hide `failed`, `not-run`, or `degraded` checks. Save `overall`, `overall_reason_code`, and per-claim verdict. When `overall != verified`, the Completion Response must retain `degraded` / `unsupported` along with specific reason/limitation; it must not claim `all tests passed` or "all verification passed". Required verification fails or is not executed still blocks completion; optional evidence's honest downgrade only affects the corresponding claim and does not automatically cause global failure or success.

   **D. Conditional write spec-work durable run artifact.** LLM evaluates in sequence and stops at the first match:

   - `trigger-task-pack`: Input is a validated task pack;
   - `trigger-not-run-validation`: the summary has at least one check marked as `not-run`;
   - `trigger-deferred-follow-up`: durable deferred follow-up exists;
   - `trigger-substantive-work`: Cross-cutting concerns, compaction/resume, limited optional evidence, review/compound/release handoff, etc., impose tangible costs on context loss.

   No trigger is present, so the producer is not invoked, returning `run_artifact_path: null` and `run_artifact_reason_code: no-trigger-matched`. On hit, assemble the existing `spec-work-run-artifact-payload/v2`, set `producer.workflow_integrated=true` and match the corresponding trigger reason, and invoke:

   ```bash
   spec-first internal spec-work-run-artifact write \
     --input <closeout-payload.json> \
     --run-id <run-id> \
     --target-repo <repo-root>
   ```

   `script_confirmed.validation.run_summary_ref` must point to the `.spec-first/workflows/spec-work/<workspace-slug>/<run-id>/verification-run-summary.json` file from the same workflow, same workspace, and same run-id. `script_confirmed.artifact_refs` and `llm_asserted.read_artifacts` may only reference repo-relative materialized evidence; absolute paths from session-temp are not permitted. Same run-id cannot be overwritten; `artifact-already-exists`, `producer-error`, or other `not-written` reasons are passed through unchanged to handoff.

   **E. Create a closeout envelope.** Standalone and Return-to-Caller both return `verification_run_summary_ref`, `honest_closeout_verdict`, `run_artifact_path`, `run_artifact_reason_code`, and `claim_limitations`. Field shape: `honest_closeout_verdict` is the token value from the validate output — a string value of `verified`, `degraded`, or `unsupported` (along with the original value of the validate machine field `overall_reason_code` listed separately); it is not the raw output object of the validator. When validate does not produce a valid result, this field is `null` and the reason is explicitly recorded in `claim_limitations`; it must not be guessed or inferred to complete the envelope. `verification_run_summary_ref` is the repo-relative reference of the successfully written record; when the record is not completed, it is `null` and the failure along with the reason must be explicitly documented in `claim_limitations`. Return-to-Caller: Additionally, after completing A-D entirely and before returning envelope, run `scripts/working-tree-fingerprint.cjs` from the current loaded skill's `SKILL_DIR` to capture `verified_worktree_fingerprint`—both run summary and run artifact are written under the ignored `.spec-first/workflows/` directory, thus these writes do not affect the fingerprint; this immutability relies on the directory being properly gitignored in the target repo (pre-check available via `git check-ignore -v .spec-first/workflows/`); in repos where the directory is not ignored, differences between before/after fingerprints do not constitute drift evidence, and should be noted in `claim_limitations` as `fingerprint-stability-unverified`; if the helper fails, record a `fingerprint-helper-unavailable` blocker as per SKILL.md. Return-to-Caller still bypasses the standalone simplify/review/PR/lifecycle tail, but cannot bypass the structured evidence closeout if local verification has already been performed; the caller retains final review, plan lifecycle, and landing authority.

5.2 **Plan Status Closeout**

   This is the only shipping closeout that may mutate plan `status`. Run it only after Final Validation, required review, and Residual Work Gate obligations have closed. `completed` is an audit marker for scoped development work; it is not proof of tests, CI, merge, release, or field outcome. Leaf workers, reviewers, and fix subagents never perform this mutation.

   Resolve lifecycle applicability before calling the helper:

   - A lifecycle-managed candidate is a non-symlink regular direct `docs/plans/*.md` software plan with exactly one readable status: either `artifact_contract: spec-unified-plan/v1` plus `execution: code`, or a compatible legacy `type: feat | fix | refactor` plan whose execution is absent or `code`. Only `active` and `completed` candidates enter the mutation helper.
   - Direct lifecycle-managed Markdown plan: update that plan.
   - Validated task pack input: require exactly one `source_plan`; update it only when it resolves to the lifecycle-managed candidate above. The task pack stays `status: derived` or `draft`.
   - Return-to-Caller: do not write. Return both `plan_status_completion_candidate` and `plan_status_completion_degraded_reason` so LFG/caller can apply the same decision after its own gates.
   - HTML, historical missing/closed plans, read-compatible `partially-shipped`/`superseded` plans, and otherwise valid source plans outside the direct Markdown boundary: do not mutate. Report respectively `html-plan-lifecycle-degraded`, `legacy-plan-lifecycle-degraded`, `read-compatible-status-unmanaged`, or `source-plan-path-lifecycle-degraded`. These explicit degraded outcomes do not invalidate development completion already established by verification and review.

   For an applicable candidate, invoke `spec-first internal plan-status complete --target-repo <root> --plan <repo-relative-source-plan> --json`. `active → completed` and `plan-status-already-completed` are successful closeouts. Duplicate, malformed, invalid, unsafe-path, read, or write failures on an applicable lifecycle-managed plan keep it unchanged and block the lifecycle closeout claim. Missing status on a unified lifecycle-managed Markdown plan is also a contract failure; legacy missing/closed status follows the explicit degraded branch above rather than forcing migration. The helper re-reads current disk content and uses the shared temp-file + rename writer: POSIX replacement is atomic, Windows replacement is best effort with retry, and neither path is a cross-process CAS. The shipping-tail single-writer rule remains a loud convention.

6. **Prepare Operational Validation Plan** (REQUIRED)
   - Add a `## Post-Deploy Monitoring & Validation` section to the PR description for every change. On exits with no authorized PR (inline completion or commit-only), carry the same section in the verified handoff summary returned to the caller instead of dropping it.
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

   Note whether the completed work has observable behavior (UI rendering, CLI output, API/library behavior with a runnable example, generated artifacts, or workflow output), and summarize any manual validation performed. Retain user-supplied evidence (URL, markdown embed, local artifact path) for the verified handoff; pass it to a PR workflow only if landing is later authorized.

2. **Resolve Commit And Landing Authorization**

   Read the current user request and visible upstream handoff; do not infer authority from skill invocation, branch ownership, plan metadata, a green tree, or tool availability.

   - `commit_authorization: authorized` only when the current user or upstream owner explicitly requests local commit creation.
   - `landing_authorization: authorized` only when the current user or upstream owner explicitly requests push, PR creation/update, or another outward landing action.
   - Landing authorization may include the commit needed for that landing only when the request says so; otherwise keep the two decisions separate.
   - Return-to-Caller mode never commits, pushes, or opens a PR. It returns the structured envelope to its caller.
   - Without commit authorization, verified work remains uncommitted. With no landing authorization, do not push and do not open a PR.

   Apply the matching path:

   - **No commit authorization:** leave verified changes uncommitted and return a verified handoff with changed files, checks, review/residual posture, lifecycle result, coherent commit candidates, and limitations.
   - **Commit authorized, landing not authorized:** use the repo's commit workflow for run-owned files only. Do not push and do not open a PR. Return the local commit(s) in the verified handoff.
   - **Landing authorized:** use the requested landing workflow only after all quality, residual, lifecycle, and branch-safety gates close. Pass the plan summary, testing notes, evidence context, Figma link when applicable, Post-Deploy Monitoring & Validation, and accepted Known Residuals. Do not broaden a push request into PR creation or a PR request into unrelated tracker/release actions.

   Pre-existing dirty paths remain user-owned. Never stage them into an authorized commit or landing action.

3. **Notify User / Return Verified Handoff**
   - Summarize what was completed
   - Include `verification_run_summary_ref`, `honest_closeout_verdict`, `run_artifact_path`, `run_artifact_reason_code`, and any `claim_limitations`
   - State whether changes are uncommitted, committed locally, pushed, or attached to a PR, with the authorization basis
   - Link to PR only if one was explicitly authorized and created
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
- [ ] Validation/evidence context preserved in the verified handoff and passed to a PR workflow only when landing was authorized
- [ ] `commit_authorization` checked before staging/commit; unrelated dirty files excluded
- [ ] `landing_authorization` checked before push/PR; no outward action inferred from skill invocation
- [ ] Commit messages follow conventional format when commits were authorized
- [ ] PR description includes Post-Deploy Monitoring & Validation section (or explicit no-impact rationale) when a PR was authorized
- [ ] Simplify: `spec-simplify-code` when diff >=30 lines (or skipped with reason)
- [ ] Code review: Record specialized review, low-risk targeted review, or mechanical/unavailable reason as per Step 3; Residual Work Gate has resolved all actual findings.
- [ ] Authorized PR description includes summary, testing notes, evidence when captured, and accurate attribution

## Code Review

Review of selection, application of exceptions, necessary coverage, and degradation upon unavailability are all owned exclusively by this document's Phase 3 Step 3; no duplicate rules are repeated here. All review findings are returned to the caller for remediation and handling of residual issues based on existing authorizations, with evidence and completion export remaining unchanged.

Closeout for mutation safety guarantees, record actual host enforcement scope, bypasses, and unverified items as per `docs/contracts/workflows/mutation-enforcement.md`.
