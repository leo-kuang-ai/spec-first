---
name: spec-debug
description: "Diagnose bugs, errors, regressions, and failing tests. Use when asked to debug or fix failing or slow behavior, including a stalled investigation. For settled plans or feature implementation, use spec-work."
argument-hint: "[issue reference, error message, test path, or description of broken behavior]"
---

# Debug and Fix

## Project Intelligence Evidence Boundary

`project-graph`/`code-graph` paths are `provider_untrusted` hypotheses, not root cause or impact evidence. Confirm the causal chain in reproductions, source, tests, logs, contracts, or owner evidence before a root-cause or fix claim; empty results do not prove absence. Use bounded direct reads when the provider is missing, stale, unknown, failed, or disabled.

Find root causes, then fix them. This skill investigates bugs systematically — tracing the full causal chain before proposing a fix — and optionally implements the fix with test-first discipline.

## Workflow Contract Summary

- **Input:** reproducible failures, errors, regressions, stack traces, issues, or clearly abnormal behavior.
- **Output:** an evidence-backed causal chain, minimal repair, regression verification, and structured handoff; diagnosis only when repair is unauthorized.
- **Hard exits:** no confirmed root-cause or fix claim without reproduction or replacement evidence, a complete causal chain, resolved target repo/source owner/dirty overlap, and passing required verification.
- **Authority:** runtime reproduction, source, tests, and logs provide facts; the LLM judges causal sufficiency. Diagnosis, local mutation, commit, and landing have separate authorization.
- **Consumers:** the user, `spec-work`, `spec-code-review`, issue/PR owners, and subsequent knowledge capture.

<bug_description> #<invocation arguments supplied by the current host> </bug_description>

## Mode

Infer diagnosis versus repair intent from the full conversation. When the current session explicitly requests repair and scope is unchanged, explain the root cause and continue to Phase 3 in the same turn without asking again whether to fix it. For diagnosis or explanation only, deliver the diagnosis and finish. Interaction mode determines how to obtain missing information; it neither grants nor revokes existing authorization.

When the invocation includes `mode:pipeline-return`, strip that token from
`<bug_description>` and load `references/pipeline-return.md`. This mode is for
an outer workflow such as `spec-lfg`: it replaces blocking questions with
conservative defaults, applies only an inherited and explicitly authorized
local convergent fix, and returns a structured envelope to the caller. The
mode token does not authorize mutation, commit, push, external communication,
credentials, or tracker writes.

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md`.
Overrides: high-risk

- `foreign-residual-workspace` -> `blocked-action-required`: stop before fix mutation, root-cause-confirmed claims that depend on suspect local artifacts, commits, or PR-ready handoff until the named cleanup/init action runs or the user explicitly accepts degraded evidence.
- optional external-tool evidence unavailable -> `fallback-only`: continue with bounded direct source, test, log, runtime-probe, and user-provided evidence; disclose the missing capability and do not extend root-cause or blast-radius claims beyond that evidence.
- `non-git-build-workspace` coverage gaps -> `partial`: keep investigation/fixes inside the explicit `target_repo` or inspected build surface and directly inspect uncovered modules before claiming they are unaffected.

## Secrets in evidence

Debugging surfaces raw output constantly — command results, captured payloads, log excerpts — and the harness may render a command's output the moment it runs, so the gate fires when you construct the command, not afterward. Keep credentials in env vars rather than on the command line; when a command's output may carry a secret (verbose HTTP traces, dumped headers, config or environment prints), capture it to a file and surface only sanitized excerpts, writing `<REDACTED>` in place of each secret. No secret (credential, token, auth header, connection string) appears in anything shown, written, or committed. If sanitizing removes what the diagnosis needs, say so and ask the user rather than un-redacting.

## Core Principles

1. **Investigate before fixing.** Do not propose a fix until you can explain the full causal chain from trigger to symptom with no gaps. "Somehow X leads to Y" is a gap.
2. **Predictions for uncertain links.** When the causal chain has uncertain or non-obvious links, form a prediction — something in a different code path or scenario that must also be true. If the prediction is wrong but a fix "works," you found a symptom, not the cause. When the chain is obvious (missing import, clear null reference), the chain explanation itself is sufficient.
3. **One change at a time.** Test one hypothesis, change one thing. If you're changing multiple things to "see if it helps," stop — that is shotgun debugging.
4. **When stuck, diagnose why — don't just try harder.**

## Anti-Rationalization Red Flags

| Rationalization | Response |
| --- | --- |
| "I see the bug; skip reproduction" | Establish a minimal reproducer or equivalent captured evidence. Without a red-capable loop, retain a working hypothesis and leave the causal-chain gate open. |
| "The root cause is obvious" | Ground every link from trigger to symptom in source, logs, tests, or runtime values; intuition is not confirmed evidence. |
| "The fix is done; a manual check is enough" | Rerun the original reproducer, regression, and applicable broader checks, then record the structured summary; freeform "tests passed" is insufficient. |

These are attention reminders, not additional gates or substitutes for judgment.

## Execution Flow

| Phase | Name | Purpose |
|-------|------|---------|
| 0 | Triage | Parse input, fetch issue if referenced, proceed to investigation |
| 1 | Investigate | Reproduce the bug, trace the code path |
| 2 | Root Cause | Form hypotheses with predictions for uncertain links, test them, **causal chain gate**, smart escalation |
| 3 | Fix | Apply explicitly authorized local repairs with test and workspace safeguards |
| 4 | Handoff | Deliver structured results; return ongoing execution to its owner, without requiring unrequested follow-up work for completion |

Beyond the trivial-bug fast-path in Phase 0, no further phase skipping — complex bugs simply spend more time in each phase naturally. No further complexity tiers.

---

### Phase 0: Triage

Parse the input and reach a clear problem statement.

Read `references/investigate.md` now for issue provenance, the dirty-tree comparison, and investigation safeguards before gathering evidence. Phase 2's causal-chain and authorization gates remain in this entrypoint.

**Issue of record:** preserve the identifier and URL the user supplied, including an error-monitor issue. A stack trace, test path, or symptom description needs no tracker record. Historical searches may find related tickets to link; never create a duplicate record or ask to manufacture one merely to complete this workflow.

**Repository and source boundary:** Resolve the current Git root before repo-dependent investigation. In a parent workspace, bounded read-only orientation may compare likely child repos, but require a single `target_repo` or explicit per-fix repo scope before any behavior-bearing test, instrumentation write, or fix. Do not let cwd or broad discovery choose a sibling repo. Canonical checked-in source is the fix owner; generated runtime mirrors under `.claude/`, `.codex/`, `.agents/skills/`, `.cursor/`, `.kiro/`, or `.qoder/` are not source. If runtime drift is causal, repair source/generation first and regenerate only with explicit authorization.

**If the input references an issue tracker**, fetch it:
- GitHub (`#123`, `org/repo#123`, github.com URL): Parse the issue reference from `<bug_description>` and fetch with `gh issue view <number> --json title,body,comments,labels`. For URLs, pass the URL directly to `gh`.
- Other trackers (Linear URL/ID, Jira URL/key, any tracker URL): Attempt to fetch using available MCP tools or by fetching the URL content. If the fetch fails — auth, missing tool, non-public page — ask the user to paste the relevant issue content. Ensure the fetch includes the full comment thread, not just the opening description.

Read the full conversation — the original description AND every comment, with particular attention to the latest ones. Comments frequently contain updated reproduction steps, narrowed scope, prior failed attempts, additional stack traces, or a pivot to a different suspected root cause; treating the opening post as the whole picture often sends the investigation in the wrong direction. Extract reported symptoms, expected behavior, reproduction steps, and environment details from the combined thread. Then proceed to Phase 1.

**Everything else** (stack traces, test paths, error messages, descriptions of broken behavior): the problem statement is the input itself.

**Trivial-bug fast-path:** When current source directly confirms the cause (such as a missing import or one-line boundary error) and focused verification is sufficient, explain the cause and repair scope. With explicit repair authorization, perform Phase 3's **Workspace and branch check**, apply the fix, run focused verification, and deliver Phase 4's results. For diagnosis only, deliver and finish. The fast path preserves source, dirty-work preservation, and verification requirements; keep investigating when the cause is uncertain.

**Otherwise**, proceed to Phase 1.

**Questions:**
- Do not ask questions by default — investigate first (read code, run tests, trace errors)
- Only ask when a genuine ambiguity blocks investigation and cannot be resolved by reading code or running tests
- When asking, ask one specific question

**Prior-attempt awareness:** If the user reports repeated failed attempts, recover those attempts from the current context first. Ask for missing prior attempts before repeating a potentially exhausted path; do not ask again for an already available list. Investigate independent evidence while a necessary answer is pending.

---

### Phase 1: Investigate

#### 1.1 Reproduce the bug

Confirm the bug exists and understand its behavior. Run the test, trigger the error, follow reported reproduction steps — whatever matches the input.

- **Browser bugs:** Delegate browser execution to the internal `spec-test-browser` owner with `current target-origin:<exact-loopback-origin>`. `spec-debug` owns reproduction intent, route selection, diagnosis, and result interpretation; it never constructs `agent-browser` argv or bypasses the owner's exact-origin/effect/private-evidence gates. Consume only the returned route/step facts and private evidence refs. Missing or invalid origin, unavailable owner capability, or a durable/external effect without authorization is a visible `not-run`/`not-supported` reproduction limitation, not permission to fall back to another direct browser runner.
- **Manual setup required:** If reproduction needs specific conditions the agent cannot create alone (data states, user roles, external services, environment config), document the exact setup steps and guide the user through them. Clear step-by-step instructions save significant time even when the process is fully manual.
- **Does not reproduce after 2-3 attempts:** Read `references/investigation-techniques.md` for intermittent-bug techniques.
- **Cannot reproduce at all in this environment:** Document what was tried and what conditions appear to be missing.
- **Writing the reproduction test:** Orient on testing conventions from the current target repo/worktree immediately before authoring the failing test. Read the active root and scoped `AGENTS.md`/`CLAUDE.md` guidance plus representative existing tests; record the current git identity and dirty state when available. Do not persist or reuse this orientation across runs, branches, or worktrees. If guidance is unreadable or absent, record that concrete degraded fact and use only the observable style in readable existing tests. Use an existing failing test when it already captures the bug, update an existing test when it owns the contract but has the wrong expectation, strengthen an over-mocked test when it should have caught the bug, or add a new minimal isolated test only when no existing test is the right home. The chosen test must fail on the current bug and pass once the corrected behavior lands; name it descriptively so the failure message itself explains the bug.

#### 1.2 Verify environment sanity

Before deep code tracing, confirm the environment is what you think it is:

- Correct branch checked out; no unintended uncommitted changes
- Dependencies installed and up to date (`bun install`, `npm install`, `bundle install`, etc.) — stale `node_modules`/`vendor` is a frequent false lead
- Expected interpreter or runtime version (check `.tool-versions`, `.nvmrc`, `Gemfile`, etc. against what's actually active)
- Required env vars present and non-empty
- No stale build artifacts (`dist/`, `.next/`, compiled binaries from an earlier branch)
- Dependent local services (database, cache, queue) running at expected versions *when the bug plausibly involves them*

#### 1.3 Trace the code path

Trace data flow backward from the symptom to where valid state first became invalid. Read code-shape to form a hypothesis, then verify with observed values — do not theorize from code alone.

Concrete recipe:

1. Read the stack trace bottom-to-top, opening each frame's source. The bottom frame is the symptom; the root cause is somewhere upstream.
2. Identify the first frame where the input data is already invalid — that's the upper bound on where to look.
3. Instrument the boundaries around that frame: targeted log/print statements, debugger breakpoints, or test assertions that capture *actual* values at function entry/exit. Assumed values lie; observed values don't.
4. Walk the boundaries until valid input becomes invalid output. That transition is the root cause site.

Do not stop at the first function that looks wrong — the root cause is where bad state originates, not where it is first observed.

As you trace:
- Check recent changes in files you are reading: `git log --oneline -10 -- [file]`
- If the bug looks like a regression ("it worked before"), use `git bisect` (see `references/investigation-techniques.md`)
- Check the project's observability tools for additional evidence:
  - Error trackers (Sentry, AppSignal, Datadog, BetterStack, Bugsnag)
  - Application logs
  - Browser console output
  - Database state
- Each project has different systems available; use whatever gives a more complete picture

#### 1.4 Check prior work

Follow the prior-work search in `references/investigate.md`; carry related tickets and failed approaches into the findings without creating a new issue of record.

---

### Phase 2: Root Cause

*Reminder: investigate before fixing. Do not propose a fix until you can explain the full causal chain from trigger to symptom with no gaps.*

Follow the assumption audit and hypothesis procedure in `references/investigate.md`, including its anti-pattern read and predictions for uncertain links.

**Causal chain gate:** Do not proceed to Phase 3 until you can explain the full causal chain — from the original trigger through every step to the observed symptom — with no gaps. The user can explicitly authorize proceeding with the best-available hypothesis if investigation is stuck.

*Reminder: if a prediction was wrong but the fix appears to work, you found a symptom. The real cause is still active.*

#### Present findings

Read `references/fix.md` before writing Phase 2's recommendation. Its regression procedure applies only to confirmed defects, never to a deliberate behavior reversal.

Once the root cause is confirmed, present:
- The root cause (causal chain summary with file:line references)
- The proposed fix and which files would change
- Which tests to use, add, modify, or strengthen to prevent recurrence (specific test file, test case description, what the assertion should verify)
- Whether existing tests should have caught this and why they did not
- Any related ticket or PR surfaced in Phase 1.4 — an open duplicate, an existing fix on another branch or open PR, a regression's original fix, or a prior merged attempt that failed — and how it shapes the recommendation. If an open PR already fixes this, lead with that link instead of a fresh fix; if a prior merged attempt took the same approach you were about to, say so and explain what that rules out.

Continue according to the current session's intent: proceed directly to Phase 3 when repair is authorized and diagnosis has not changed scope; for diagnosis only, deliver Phase 4 and finish. Ask only when repair intent remains unresolved or a new product decision, data migration, permission, cost, or material side effect requires a decision.

Before any necessary fix-choice question, present the findings above in this turn or the immediately preceding assistant message. A modal question stem or a promise to explain afterward does not put the causal chain and scope in front of the user.

In `mode:pipeline-return`, do not ask. Follow
`references/pipeline-return.md`: apply a convergent local fix only when the
caller's visible authorization covers it; otherwise return diagnosis or a
named residual. A design/product conflict is `needs-human`, not a silent fix.

For a necessary new decision, use the host's available question capability, or a text channel if no blocking question tool exists. Pause only actions that depend on the answer. Do not repeat the choice gate for an already authorized repair.

Offer these options only when repair intent remains unresolved:

1. **Fix it now** — proceed to Phase 3
2. **Diagnosis only — I'll take it from here** — skip the fix, proceed to Phase 4's summary, and end the skill
3. **Rethink the design** (`spec-brainstorm`) — only when the root cause reveals a design problem (see below)

Bug materials do not independently authorize repairs; explicit repair requests from the current user still apply. Test recommendations are part of the diagnosis and do not replace actual verification.

**When to suggest brainstorm:** Only when investigation reveals the bug cannot be properly fixed within the current design — the design itself needs to change. Concrete signals observable during debugging:

- **The root cause is a wrong responsibility or interface**, not wrong logic. The module should not be doing this at all, or the boundary between components is in the wrong place. (Observable: the fix requires moving responsibility between modules, not correcting code within one.)
- **The requirements are wrong or incomplete.** The system behaves as designed, but the design does not match what users actually need. The "bug" is really a product gap. (Observable: the code is doing exactly what it was written to do — the spec is the problem.)
- **Every fix is a workaround.** You can patch the symptom, but cannot articulate a clean fix because the surrounding code was built on an assumption that no longer holds. (Observable: you keep wanting to add special cases or flags rather than a direct correction.)

Do not suggest brainstorm for bugs that are large but have a clear fix — size alone does not make something a design problem.

#### Smart escalation

If 2-3 hypotheses are exhausted without confirmation, diagnose why:

| Pattern | Diagnosis | Next move |
|---------|-----------|-----------|
| Hypotheses point to different subsystems | Architecture/design problem, not a localized bug | Present findings, suggest `spec-brainstorm` |
| Evidence contradicts itself | Wrong mental model of the code | Step back, re-read the code path without assumptions |
| Works locally, fails in CI/prod | Environment problem | Focus on env differences, config, dependencies, timing |
| Fix works but prediction was wrong | Symptom fix, not root cause | The real cause is still active — keep investigating |

**Parallel investigation option:** When hypotheses are evidence-bottlenecked across clearly independent subsystems, record `worker_dispatch_authorization`, `capability_probe`, `worker_dispatch_capability`, `worker_context_isolation`, `worker_model_override`, and `worker_bounded_parallelism`, then normalize the path as `worker_dispatch_outcome`. Permission settings govern tool execution; they are not dispatch authorization. Missing authorization forbids discovery and fixes `not_applicable + unknown`, records `dispatch_authorization_missing`, and runs the probes in ranked-likelihood sequential order inline. Only after explicit current-user/upstream authorization may the current-session registry/schema be inspected as `provider_untrusted` evidence: confirmed absence records `subagent_capability_missing`; unavailable/incomplete/ambiguous discovery records `worker_capability_unproven`. Only `available` plus live bounded-parallelism facts permits parallel read-only probes, each with an explicit hypothesis and structured evidence return; otherwise serialize. Unknown isolation is irrelevant for read-only probes but never licenses mutation. No code edits by probe workers, and skip parallelism when hypotheses depend on each other's outcomes.

Present the diagnosis to the user before proceeding.

For an authorized probe dispatch, correct a pre-launch argument rejection once without changing the hypothesis, read-only scope, or required capabilities. Capacity-limited work stays queued until a slot frees; repeated zero capacity uses the bounded sequential path. Other launch failures run the same probes sequentially. Once a probe launches, collect its outcome before retrying; inline probes do not provide independent context evidence.

---

### Phase 3: Fix

*Reminder: one change at a time. If you are changing multiple things, stop.*

If the initial request or a later answer asks only for diagnosis, skip this phase and deliver Phase 4. If the current session explicitly requests repair, proceed under that authorization. If the user chooses redesign, hand off to `spec-brainstorm`; this debugging workflow must not expand the redesign scope itself.

**Workspace and branch check:** Before editing files:

- Confirm the selected single `target_repo` (or explicit per-fix repo scope), current `HEAD`, branch, and source owner. A `Fix it now` choice authorizes only the bounded local fix mutation described in the diagnosis; it does not authorize commit, push, PR creation, branch publication, runtime regeneration, or adjacent cleanup.
- Check for uncommitted changes (`git status`). Record pre-existing dirty tracked/untracked paths and their overlap with fix-owned files. Unrelated dirty paths remain user-owned. A pre-existing dirty overlap requires an explicit owner decision or a bounded preservation strategy before editing — do not overwrite, stage, simplify, or revert those hunks.
- Follow existing branch preferences and task ownership. On a default branch with authorized local repair and no contrary preference, create a local feature branch named from the bug without repeating repair approval; preserve all existing changes and do not publish it. Detect the default branch using `main`, `master`, or `git rev-parse --abbrev-ref origin/HEAD` with the `origin/` prefix stripped. On an existing task branch, proceed. Ask only when branch ownership or shared work creates a material unresolved conflict; do not switch or reset another task's branch to force progress.
- Record the pre-fix scope before editing: current `HEAD`, whether `git status --short` is clean, and any pre-existing changed files. During Phase 3, keep a list of fix-owned files (the tests and implementation files changed for this bug). Phase 4 uses this to keep simplify/review from touching unrelated branch work.

**Test-first:** Read `references/fix.md` before writing Phase 2's recommendation or editing any file. It owns regression-test placement, the confirmed-defect precondition, the one-change-at-a-time implementation loop, and the required verification/self-review sequence. The body keeps the load-time condition that the regression starts from existing tests and never treats a deliberately reversed expectation as a defect.

For every command in steps 3, 5, and 6, retain the real command, `ran`, exit code, status, required/missing tools, reason code, and a bounded secret-stripped log. These are provisional until the Phase 4 tail finishes: if simplify or review changes the fix, rerun affected checks and use only the final results for closeout. A planned command, a dry-run, or a worker's natural-language “passed” statement is not confirmed command evidence.

Use `references/fix.md` for failed-fix invalidation, escalation, defense-in-depth, and post-mortem triggers.

---

### Phase 4: Handoff

In `mode:pipeline-return`, skip the interactive menu and emit the structured
return from `references/pipeline-return.md`. Do not run a nested shipping tail,
commit, push, edit a PR, or file a tracker item. The outer caller owns those
exits and any durable handoff.

**Structured summary** — diagnosis-only runs write this immediately. When Phase 3 changed code, assemble the final version after the post-fix tail and structured verification closeout below, so the summary references the final tree rather than a pre-review green result:

```
## Debug Summary
**Problem**: [What was broken]
**Root Cause**: [Full causal chain, with file:line references]
**Target Repo / Scenario**: [selected repo/surface and any bounded/degraded capability]
**Recommended Tests**: [Tests to add/modify to prevent recurrence, with specific file and assertion guidance]
**Fix**: [What was changed — or "diagnosis only" if Phase 3 was skipped]
**Prevention**: [Test coverage added; defense-in-depth if applicable]
**verification_run_summary_ref**: [repo-relative ref, or null with reason]
**honest_closeout_verdict**: [verified/degraded/unsupported + overall_reason_code]
**claim_limitations**: [not-run, missing evidence, bounded coverage, or none]
**Confidence**: [High/Medium/Low]
```

**If Phase 3 was skipped** (user chose "Diagnosis only" in Phase 2), do not fabricate post-fix command evidence or a validator verdict. Set `verification_run_summary_ref: null`, `honest_closeout_verdict: not-run`, and `claim_limitations: diagnosis-only-no-post-fix-verification`, then stop after the summary — the user already told you they were taking it from here. Do not prompt.

**If Phase 3 ran**, complete the quality tail, then resolve commit and landing authorization. Branch ownership is scope evidence, not authority.

#### Post-fix polish/review tail (before commit or PR)

Run this tail after Phase 3 ran and before the branch-based commit/PR handoff. The goal is to leave the fix PR-ready, not merely locally green.

**Contextual overrides first.** Look at the user's original prompt, loaded memories, and the project's active instructions already in your context for preferences that conflict with automatic post-fix polish or review — for example, "minimal hotfix only", "do not run review", "always ask before cleanup", or "ship the smallest possible diff." A signal must be explicit or clearly applicable. Honor it and state what was skipped.

**Skip the tail only with a reason.** Skip dedicated simplify/review when the fix is purely mechanical or trivial: typo/import-only, formatting/lint-only, dependency/version-only, generated artifacts, docs-only, or roughly under 10 changed lines with no sensitive surface. Still keep the Phase 3 tests and self-review. If skipping, carry the skip reason into the handoff summary.

**Simplify before review when useful.** Invoke `spec-simplify-code` before code review when the current fix diff is non-mechanical and large enough to benefit (default: >=30 changed lines), touches multiple implementation files, introduces a new helper/abstraction, or affects shared/risky surfaces such as auth/authz, public contracts, persistence, concurrency, background jobs, or external services. Use the branch diff only when the branch is skill-owned or clearly contains only this fix. On a pre-existing branch, scope simplification to fix-owned files only when those files were clean before Phase 3. If a fix-owned file already had pre-existing user edits, skip `spec-simplify-code` for that file and record `Simplify: skipped for overlapping pre-existing edits`; file-level simplification could rewrite unrelated hunks the user did not authorize. Do not let simplification widen into unrelated user work.

**Review the final fix scope.** After simplification (or after the skip decision), review every non-mechanical fix unless review tooling is unavailable. Use `spec-code-review mode:agent base:<pre-fix-HEAD>` only when the resolved diff is fix-only (the pre-fix tree was clean or an equivalent bounded scope exists); it remains report-only and this debug caller decides which eligible fixes to apply. On a dirty branch with unrelated committed work or overlapping pre-existing edits, do not let review/apply widen into those changes. Use a file-scoped native reviewer when available, otherwise perform an explicit targeted manual review of fix-owned files and record `Code review: targeted manual due to unrelated branch work`. If dedicated review dispatch is unauthorized/unavailable, accept its honest inline degraded result or do the targeted manual scan; never claim independent coverage that did not run.

**Handle residual findings before shipping.** Inspect the review's Actionable Findings and continue in-scope repairs under existing authorization, then rerun affected checks. Ask only about new decisions that change product/design, acceptance, scope, permissions, or material consequences. Do not auto-open a PR with unresolved P0/P1 findings or accept failed required verification. Missing dependencies remain pending, not accepted. For lower-severity residuals covered by explicit risk acceptance, preserve the decision before any outward handoff: if a PR is authorized, pass "Known Residuals" to `spec-commit-push-pr`; otherwise use `docs/residual-review-findings/<branch-or-head-sha>.md` with the accepted findings and source review context, stage it only when committing is authorized, and mention its path. Recording residuals does not itself authorize risk acceptance or landing.

**Re-verify after tail edits.** If simplification or review changed code, rerun the bug's regression test and any targeted checks the tail identified. Never proceed to commit or PR with a red tree.

#### Structured verification closeout

After every fix-owned mutation has stopped, create one fresh safe `run-id` and use the repo-local `.spec-first/workflows/spec-debug/<workspace-slug>/<run-id>/` root. The final check set must distinguish the original reproducer, the regression test, and broader checks; include only commands that actually ran, plus honest `not-run` entries for a selected check that could not run. Write each executed command's bounded, secret-stripped output under `logs/` and keep every `log_path` repo-relative.

- Dry-run or merely schedulable commands are `not-run` with `reason_code: schedulable`.
- Missing tools are `not-run` with `reason_code: missing_dependency` and populated `missing_tools`.
- A failed original reproducer after the fix or a failed regression/broader check remains `failed`; do not soften it into confidence prose.

Record the final facts with the debug workflow scope:

```bash
spec-first internal verification-run-summary record \
  --workflow spec-debug \
  --input <verification-run-summary-input.json> \
  --run-id <run-id> \
  --target-repo <repo-root> \
  --json
```

Then build structured validation claims from `verification-run-summary:<check-id>` refs, add only target-repo-contained regular-file refs for impact/review claims, and run:

```bash
spec-first internal honest-closeout validate \
  --input <honest-closeout-claims.json> \
  --target-repo <repo-root> \
  --json
```

Carry the returned `run_summary_ref`, `overall`, `overall_reason_code`, and unsupported/degraded claim reasons into both Debug Summary and Post-Fix Quality. Required reproducer/regression evidence that is failed or not-run blocks a verified fix claim. This workflow owns diagnosis/fix evidence only: it does not create a spec-work durable run artifact; a later `spec-work` caller may consume the repo-relative debug summary ref without changing ownership.

**Post-fix quality summary.** After the tail, append this block below the Debug Summary before the commit/PR decision:

```
## Post-Fix Quality
**Scope**: [fix-only branch / base:<pre-fix-HEAD> / fix-owned files only / targeted manual due to unrelated branch work]
**Simplify**: [ran/skipped + reason]
**Review**: [ran/skipped/manual + outcome]
**Residuals**: [none / accepted Known Residuals for PR / accepted residuals written to docs/residual-review-findings/<branch-or-head-sha>.md / blocked pending user decision]
**Re-verification**: [checks rerun after tail edits]
**verification_run_summary_ref**: [repo-relative `spec-debug` summary ref]
**honest_closeout_verdict**: [verified/degraded/unsupported + overall_reason_code]
**claim_limitations**: [structured list or none]
**Commit / Landing**: [authorization and actual uncommitted/committed/pushed/PR state]
```

#### Commit and landing authorization

Resolve two independent facts from the current user request or a visible upstream handoff:

- `commit_authorization: authorized` only when local commit creation was explicitly requested.
- `landing_authorization: authorized` only when push, PR creation/update, or another outward handoff was explicitly requested.

`Fix it now` does not authorize commit, push, or PR. A skill-created branch, clean tree, issue reference, or available landing tool also does not authorize those exits.

- Without commit authorization, return a verified uncommitted fix with the Debug Summary, Post-Fix Quality, changed files, checks, residuals, and a coherent commit candidate.
- With commit authorization but without landing authorization, commit only fix-owned verified files; do not push and do not open a PR.
- With landing authorization, run only the requested landing action after review/residual/re-verification gates close. When the entry came from an issue tracker, include the appropriate auto-close syntax only in the explicitly authorized commit/PR surface.
- Never stage unrelated pre-existing dirty paths. If safe file ownership cannot be isolated, leave the fix uncommitted and report the blocker even when general commit authorization exists.

#### At the completion checkpoint: consider offering learning capture

Offer when the unit of work completes — not at a PR event: a PR can open early, so a trigger pegged to PR creation is already past by the time the work finishes. The deadline is only that the learning can still be committed to the PR that produced it (not open yet, draft, or under review); capture at the checkpoint rather than deferring to that deadline.

Most bugs are localized mechanical fixes (typo, missed null check, missing import) where the only "lesson" is the bug itself. Compounding those clutters `docs/solutions/` without adding value. Decide which path applies:

- **Skip silently** when the fix is mechanical and there's no generalizable insight. Default to this when in doubt.
- **Offer neutrally** when the lesson can be stated in one sentence — e.g., "X.foo() returns T | undefined when Y, not just T", or "the diagnostic path was non-obvious and worth recording." If you cannot articulate the lesson, skip rather than offer.
- **Lean into the offer** when the pattern appears in 3+ locations OR the root cause reveals a wrong assumption about a shared dependency, framework, or convention that other code is likely to repeat.

When offering, use an available blocking question tool, or ask in chat if none exists. If the user accepts, run `spec-compound`. Commit and push the resulting learning only when the same commit and landing authorization still covers that additional durable artifact; otherwise leave it as a verified local follow-up and say so.
