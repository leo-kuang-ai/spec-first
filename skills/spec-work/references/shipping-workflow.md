# Shipping Workflow

This file contains the shipping workflow (Phase 3-4). It is loaded when all Phase 2 tasks are complete and execution transitions to quality check.

## Phase 3: Quality Check

1. **Run Core Quality Checks**

   Always run before submitting:

   ```bash
   # Run full test suite (use project's test command)
   # Examples: bin/rails test, npm test, pytest, go test, etc.

   # Run linting (per AGENTS.md)
   # Use linting-agent before pushing to origin
   ```

2. **Code Review** (REQUIRED)

   Every change gets reviewed before shipping. Prefer the lightest real review surface that the current host actually provides, and escalate when risk signals call for it.

   **Tier 1 -- host-native code review.** Run this tier only when the current host exposes a real built-in code review command or skill (for example, a native `/review` command). Address blocking and suggested findings inline before Final Validation. Skip the Residual Work Gate. If the current host has no real built-in code review command or skill, Tier 1 cannot run — use Tier 2 so "Every change gets reviewed" remains true. Do not treat ordinary self-review as Tier 1.

   **Tier 2 -- `spec-code-review`.** Execute the `spec-code-review` workflow with `mode:autofix`, passing `plan:<path>` when known. The workflow runs specialized reviewer agents, auto-applies safe fixes, and records residual downstream work in the per-run artifact. Do not dispatch `spec-code-review` as an Agent/Task/subagent type; the workflow dispatches reviewer agents internally. Then proceed to the Residual Work Gate.

   Use Tier 2 when **any** of the following is true:

   - **No host-native review exists.** The current host lacks a real built-in code review command or skill.
   - **Sensitive surface touched.** The diff modifies authentication or authorization, payments or billing, data migrations or backfills, cryptography or secret handling, security-relevant configuration, public API or library contracts, or dependency manifests.
   - **Large and diffuse change.** The diff is >=400 changed lines and spans more than 3 directories or 2 distinct subsystems. Either alone is a soft signal; together they trigger escalation.
   - **Very large change.** The diff is >=1,000 changed lines regardless of diffusion.
   - **Plan or task explicitly requests it.** The plan, originating task, or another in-scope instruction calls for a full, deep, or thorough code review.
   - **Task-level review focus requests it.** A plan, task pack, task card, or `review_focus` explicitly calls for full, deep, thorough, or `spec-code-review` review. This Tier 2 escalation does not require `review_gate: required`; a required gate by itself only requires the diff-scoped report-only checkpoint or explicit handoff and does not force full multi-persona autofix review.

   When the change is small, concentrated, outside the sensitive surface list, and a real host-native review exists, Tier 1 is sufficient.

3. **Residual Work Gate** (REQUIRED when Tier 2 ran)

   After Tier 2 code review completes, inspect the Residual Actionable Work summary it returned (or read the run artifact directly if the summary was not emitted). If one or more residual `downstream-resolver` findings remain, do not proceed to Final Validation until the user decides how to handle them.

   Ask the user using the platform's blocking question tool (`AskUserQuestion` in Claude Code with `ToolSearch select:AskUserQuestion` pre-loaded if needed, or `request_user_input` in Codex). Fall back to numbered options in chat only when the harness genuinely lacks a blocking tool. Never silently skip the gate.

   Stem: `Code review found N residual finding(s) the skill did not auto-fix. How should the agent proceed?`

   Options (four or fewer, self-contained labels):
   - `Apply/fix now` — loop back into review with focused fixes; the agent investigates each finding, applies changes where safe, and re-runs review.
   - `File tickets via project tracker` — load `references/tracker-defer.md` in Interactive mode; the agent files tickets in the project's detected tracker (or `gh` fallback, or leaves them in the report if no sink exists) and proceeds to Final Validation.
   - `Accept and proceed` — record the residual findings verbatim in a durable "Known Residuals" sink before shipping. If a PR will be created or updated in Phase 4, include them in the PR description's "Known Residuals" section (the agent owns this when calling `git-commit-push-pr`). If the user later chooses the no-PR `git-commit` path, create `docs/residual-review-findings/<branch-or-head-sha>.md`, include the accepted findings and source review-run context, stage it with the implementation commit, and mention the file path in the final summary. The user has acknowledged the risk, but the findings must not live only in the transient session.
   - `Stop — do not ship` — abort the shipping workflow. The user will handle findings manually before re-invoking.

   Skip this gate entirely when the review reported `Residual actionable work: none.` or when only Tier 1 was used. Do not proceed past this gate on an `Accept and proceed` decision until the agent has recorded whether the durable sink is `PR Known Residuals` or `docs/residual-review-findings/<branch-or-head-sha>.md`.

4. **Final Validation**
   - All tasks marked completed
   - Testing addressed -- tests pass and new/changed behavior has corresponding test coverage (or an explicit justification for why tests are not needed)
   - Linting passes
   - Code follows existing patterns
   - Figma designs match (if applicable)
   - No console errors or warnings
   - If the plan has a `Requirements` section (or legacy `Requirements Trace`), verify each requirement is satisfied by the completed work
   - If the work document has `spec_id`, verify final summaries and handoff notes use it only as artifact-chain trace context, not as progress or approval state
   - If any `Deferred to Implementation` questions were noted, confirm they were resolved during execution

5. **Prepare Operational Validation Plan** (REQUIRED)
   - Add a `## Post-Deploy Monitoring & Validation` section to the PR description for every change.
   - Include concrete:
     - Log queries/search terms
     - Metrics or dashboards to watch
     - Expected healthy signals
     - Failure signals and rollback/mitigation trigger
     - Validation window and owner
   - If there is truly no production/runtime impact, still include the section with: `No additional operational monitoring required` and a one-line reason.

## Phase 4: Ship It

1. **Prepare Evidence Context**

   Do not invoke `feature-video` directly in this step. Evidence capture belongs to the PR creation or PR description update flow, where the final PR diff and description context are available.

   Note whether the completed work has observable behavior (UI rendering, CLI output, API/library behavior with a runnable example, generated artifacts, or workflow output). The `git-commit-push-pr` skill will ask whether to capture evidence only when evidence is possible.

1.5. **Check Changelog And Release Path References**

   When `CHANGELOG.md` or release notes are touched, inspect added lines for newly added repo-relative artifact/source path references. Confirm each referenced path that is claimed as shipped is inside the final shipping boundary: already tracked (`git ls-files -- <path>`), present in tracked diff (`git diff --name-only <base>`), or explicitly staged for the commit (`git diff --cached --name-only`). Also compare against `git ls-files --others --exclude-standard`.

   If a new path reference appears only as an untracked file, do not mark the work complete, commit, create a PR, or report the changelog entry as shipped. Choose one: stage/commit the artifact, remove/defer the changelog reference, or record it as excluded/not-shipping and keep `Next action` user-visible. This is a shipping-boundary check, not a semantic judgment about document quality.

2. **Resolve Completion Status Target**

   If the work input is a plan/spec document with YAML frontmatter, update that document's `status` only after all scoped work, verification, and required review are complete:
   ```yaml
   status: active  ->  status: completed
   ```

   If the work input is a validated task pack, do **not** change the task pack's `status: derived`; that value records derivation/validation posture rather than execution progress. Instead, read the task pack frontmatter `source_plan` and update that source plan's frontmatter `status: active -> completed`, because the source plan is the scope and completion authority for task-pack execution.

   Leave the completion target unchanged and record `completion_status.reason_code` in closeout when it cannot be safely updated. Use the narrowest applicable reason code:
   - `not-a-plan-or-task-pack`
   - `task-pack-source-plan-missing`
   - `source-plan-unreadable`
   - `source-plan-status-not-active`
   - `scope-not-fully-completed`

   If local repo convention calls for completion evidence in completed plans, append only a brief `Completion Evidence` note with implementation scope, verification, review status, and generated-runtime status. Do not add per-unit progress state.

2.5. **Build Structured Verification Closeout**

   When validation was run, considered, skipped, or blocked by missing dependencies, record it as structured evidence before evaluating durable triggers. Do not rely on prose such as "tests passed" as validation proof.

   Use the deterministic helpers in this order:

   ```bash
   spec-first internal verification-profile load \
     --target-repo <repo-root> \
     --json

   # After each selected command has actually run, or after a check is explicitly classified not-run:
   spec-first internal verification-run-summary record \
     --input <verification-run-summary-input.json> \
     --run-id <fresh-run-id> \
     --target-repo <repo-root> \
     --json

   spec-first internal honest-closeout validate \
     --input <honest-closeout-claims.json> \
     --target-repo <repo-root> \
     --json

   spec-first internal resource-governance-lens \
     --target-repo <repo-root> \
     --json
   ```

   Boundary rules:
   - `verification-profile` only resolves candidate checks from `spec-first.verification.json`, local override, or package-script inference. It does not execute or decide verification.
   - `verification-run-summary` only records actual command outcomes supplied by the workflow step. It does not rerun commands or infer `exit_code`.
   - Dry-run or schedulable-but-not-executed checks must be `status=not-run` with `reason_code=schedulable`; missing required tools must be `status=not-run` with `reason_code=missing_dependency`.
   - `honest-closeout` validates structured claim-to-evidence refs. Missing claim objects, empty evidence refs, or unsupported claims degrade or reject the closeout verdict; natural-language-only assertions are honest-but-unverifiable and must not be reported as verified.
   - `resource-governance-lens` reports advisory facts for large files, generated output, raw logs, owner hints, and staging-scope risks. Its `subject_path` can name generated runtime mirrors, but `evidence_ref` must remain an allowed source/log/artifact or deterministic git-summary ref. Resource advisories are reported beside honest-closeout results; they do not block closeout, `git add`, commit, or review. Its `status=unavailable` (for example a non-git target) is a non-blocking degraded posture, not a fast-fail signal: read `status`, not the exit code, which stays `0` for `ok`, `advisory`, and `unavailable`.
   - `decision_input_health=warn|error` from setup facts is readiness-side degraded evidence. It does not become a verification check status. Verification `passed|failed|not-run|degraded` comes from `verification-run-summary`; readiness degradation can only lower closeout confidence.

   The final response's `Verification:` line must cite structured check statuses from the run summary (`passed`, `failed`, `not-run`, or `degraded`) and include the concrete `reason_code` for every `not-run` check. If no run summary or no structured closeout claim exists, say `degraded` or `not run` with the concrete reason; do not claim verified. When resource lens returns `status=advisory`, include the advisory dimensions and reason codes in the closeout evidence or final summary.

2.6. **Evaluate Durable Evidence Triggers**

   Evaluate the durable evidence trigger chain before committing or creating a PR. This is an LLM-owned closeout judgment; scripts validate and write the supplied payload, but they do not decide whether the work is semantically important.

   Check the triggers in order and stop at the first match:

   - `trigger-task-pack` - the input is a validated task-pack path.
   - `trigger-not-run-validation` - any `verification-run-summary.v1` check has `status=not-run`.
   - `trigger-deferred-follow-up` - the closeout has non-empty `deferred_follow_up[]`.
   - `trigger-substantive-work` - the work is important enough to leave durable evidence because it consumed limited optional external-tool evidence, hands off to review/compound/release, resumed through compaction, or was long or cross-cutting enough for context loss to matter.

   When any trigger matches, call the internal producer with a fresh run id:

   ```bash
   spec-first internal spec-work-run-artifact write \
     --input <closeout-payload.json> \
     --run-id <fresh-run-id> \
     --target-repo <repo-root>
   ```

   The payload must set `producer.workflow_integrated=true` and `producer.reason_code` to the matching trigger reason. If the producer writes the artifact, carry the repo-relative `.spec-first/workflows/spec-work/<workspace-slug>/<run-id>/run.json` path into the final `Artifacts:` line.

   The payload must use `spec-work-run-artifact-payload/v2`. Its `script_confirmed.validation` object is aggregate-only:

   ```json
   {
     "status": "passed|failed|not-run|degraded",
     "reason_code": "<structured-closeout-reason>",
     "run_summary_ref": ".spec-first/workflows/spec-work/<workspace-slug>/<run-id>/verification-run-summary.json"
   }
   ```

   Do not include `script_confirmed.validation.commands[]`; per-check command detail belongs only in `verification-run-summary.v1`.

   If no trigger matches, do not call the producer; record `producer.reason_code=no-trigger-matched` in closeout evidence. If the producer fails or returns `not-written`, keep the final response honest with the returned `reason_code` such as `producer-error` or `artifact-already-exists`. Do not treat run evidence as source scope authority, progress state, approval state, or a full replay index.

3. **Commit and Create Pull Request**

   Load the `git-commit-push-pr` skill to handle committing, pushing, and PR creation. The skill handles convention detection, branch safety, logical commit splitting, adaptive PR descriptions, and attribution badges. `git-commit-push-pr` is a host-provided skill, not a spec-first runtime asset; if the current host does not expose it, degrade gracefully — perform the commit/push/PR steps directly with `git` / `gh` and note that the helper was unavailable.

   When providing context for the PR description, include:
   - The plan's summary and key decisions
   - Testing notes (tests added/modified, manual testing performed)
   - Evidence context from step 1, so `git-commit-push-pr` can decide whether to ask about capturing evidence
   - Figma design link (if applicable)
   - The Post-Deploy Monitoring & Validation section (see Phase 3 Step 5)
   - Any "Known Residuals" accepted in the Phase 3 Residual Work Gate, rendered as a dedicated section in the PR body with severity, file:line, and title per finding

   If the user prefers to commit without creating a PR, load the `git-commit` skill instead (also host-provided; if absent, commit directly with `git` and note the helper was unavailable).

4. **Notify User**
   - Summarize what was completed
   - Link to PR (if one was created)
   - Note any follow-up work needed
   - Suggest next steps if applicable

   **Completion Response Contract**

   The final user-visible response must be compact but complete. Include these fields in the repository language policy from the active `CLAUDE.md` / `AGENTS.md` `spec-first:lang` block:

   ```text
   Completed: <what changed and the main files or artifact paths>
   Verification: <commands/checks run with pass/fail/not-run status>
   Review: <review tier or workflow used, plus residual status>
   Artifacts: <PR link, plan/task-pack path, evidence, or known-residuals path when applicable>
   Next action: <only if the user needs to do something now>
   ```

   If a check was not run, say `not run` with the concrete reason from `verification-run-summary.v1`. If a validation claim lacks structured evidence, say `degraded` with the `honest-closeout.v1` reason code. If no user action remains, omit `Next action` instead of inventing follow-up work.

   **Direct evidence used (when applicable)**

   If the plan/task-pack or this work run consumed direct source/test/log evidence that materially shaped scope or verification, include a compact `direct_evidence_used` mini-section in closeout or handoff evidence. Omit the section when the ordinary changed-file/test summary is enough.

   If capability-class candidates shaped scope or verification, put advisory query/candidate summaries in `provider_untrusted.summaries[]`; put source-confirmed facts in `direct_evidence_used.source_refs` or `direct_evidence_used.checks_or_logs`; put unconfirmed candidates and bounded coverage in `limitations`.

   ```text
   Direct evidence used:
   - source_refs: <list or none>
   - checks_or_logs: <list or none>
   - repo_scope: <target-repo-name | per-unit | per-fix>
   - limitations: <bounded coverage or none>
   ```

   **Learning-worthy compound check**

   Before sending the final response, decide whether the completed work produced a reusable lesson worth capturing. This is an LLM-owned judgment, not a script classifier, and it must remain advisory:

   - **Skip silently** for mechanical fixes, one-off docs edits, formatting-only changes, or work with no generalizable lesson. If the lesson cannot be stated in one sentence, skip rather than offer.
   - **Offer neutrally** when the lesson can be stated in one sentence, such as a reusable diagnostic path, a surprising workflow/source-runtime boundary, or a provider-evidence limitation future work should remember.
   - **Lean into the offer** when the pattern appears in 3+ places or reveals a wrong assumption about a shared dependency, framework, workflow, source/runtime boundary, or provider-evidence convention.

   When offering, add a compact `Next action` only if no higher-priority user action remains, and phrase it as the user's choice to run the current host's compound entrypoint with brief context. Do not automatically run `spec-compound`, do not write `docs/solutions/`, and do not make compound capture a completion gate.

## Quality Checklist

Before creating PR, verify:

- [ ] All clarifying questions asked and answered
- [ ] All tasks marked completed
- [ ] Testing addressed -- tests pass AND new/changed behavior has corresponding test coverage (or an explicit justification for why tests are not needed)
- [ ] Linting passes (use linting-agent)
- [ ] Code follows existing patterns
- [ ] Figma designs match implementation (if applicable)
- [ ] Evidence decision handled by `git-commit-push-pr` when the change has observable behavior
- [ ] Commit messages follow conventional format
- [ ] PR description includes Post-Deploy Monitoring & Validation section (or explicit no-impact rationale)
- [ ] Code review completed (Tier 1 host-native or Tier 2 `spec-code-review`)
- [ ] PR description includes summary, testing notes, and evidence when captured
- [ ] PR description includes Compound Engineered badge with accurate model and harness

## Code Review Tiers

Every change gets reviewed. The tier determines depth, not whether review happens.

**Tier 1 -- host-native code review.** Run this tier only when the current host exposes a real built-in code review command or skill. Address blocking and suggested findings inline. If the current host has no real built-in code review command or skill, Tier 1 cannot run.

**Tier 2 -- `spec-code-review`.** Invoke `spec-code-review mode:autofix` with `plan:<path>` when available. Safe fixes are applied automatically; residual work routes through the Residual Work Gate.

Escalate to Tier 2 when any of these holds:
- The current host has no real host-native code review command or skill
- Sensitive surface touched (auth/authz, payments/billing, data migrations or backfills, cryptography or secrets, security-relevant config, public API or library contracts, dependency manifests)
- Large and diffuse change (>=400 changed lines and >3 directories or 2 subsystems)
- Very large change (>=1,000 changed lines)
- Plan or task explicitly requests a full, deep, or thorough code review
