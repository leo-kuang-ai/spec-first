---
name: spec-lfg
description: Run the full hands-off engineering pipeline from planning through a green PR. Use only when the current user explicitly requests spec-lfg or selects an option that clearly states it will commit, push, open a PR, and watch CI.
argument-hint: "[feature description or requirements-only plan path] [target-origin:<origin>]"
---

CRITICAL: You MUST execute every step below IN ORDER. Do NOT skip any required step. Do NOT jump ahead to coding or implementation. The plan phase (step 1) MUST be completed and verified BEFORE any work begins. Violating this order produces bad output.

进入该管线前，当前用户必须明确请求 `spec-lfg`，或选择清楚披露 commit、push、PR、CI 与委派独立代码审查副作用的 handoff 选项。仅有代码就绪、已完成计划或模型推断“适合 shipping”都不构成授权。

上述 admission 成立时，当前用户对完整管线副作用的明确请求是本次 pipeline-owned implementation、commit 与 landing authority 的来源；同时只额外授权第 4 步委派一次 `spec-code-review` 的只读独立审查。将 `commit_authorization: authorized`、`landing_authorization: authorized`、`review_dispatch_authorization: authorized` 与 `authorization_source: current-user-explicit-spec-lfg` 作为可见 run-local facts 传给对应下游 owner。Skill invocation、`mode:pipeline`、工具权限、green tests、branch/PR facts 都不能替代该 admission，也不能把 authority 扩大到 unrelated dirty paths、任意 worker dispatch、tracker 或其他未披露外部副作用。若 admission 不成立，以 `commit_authorization_missing` / `landing_authorization_missing` 停在对应副作用之前；若独立审查不可用或降级，LFG 必须停止，不能用同一会话的 inline review 冒充该 gate。

When invoking any skill referenced below, resolve its name against the available-skills list the host platform provides and use that exact entry. Some platforms list skills under a plugin namespace (e.g., `spec-first:spec-plan`); others list the bare name. Invoking a short-form guess that isn't in the list will fail — always match a listed entry verbatim before calling the Skill/Task tool.

**Preserve and split the invocation payload.** Treat the arguments received from
the caller as the authoritative input. Before step 1, remove at most one standalone
`target-origin:<origin>` token and retain its value unchanged as the run-local
`caller_target_origin`. Set `forwarded_arguments` to everything else: preserve
every remaining argument in its original order, including an absolute
requirements-only plan path. Do not paraphrase the path, prepend a label or menu
number, replace it with a feature summary, or resolve it relative to the current
working directory. The modifier is browser-routing input, not product intent: do
not pass it to planning, normalize it, combine it with `--port`, derive a
scheme/host/port from project files, redirects, browser state, or a guessed
dev-server default. An empty, malformed, or repeated modifier records
`target-origin-invalid`; it never becomes a usable origin.

1. Invoke the `spec-plan` skill with the exact `forwarded_arguments` payload. When
   `spec-brainstorm` invoked LFG, this payload is the absolute requirements-only
   unified plan path, so `spec-plan` recognizes it as an explicit Product Contract
   source and enriches that same artifact in place.

   GATE: STOP. If spec-plan reported the task is non-software and cannot be processed in pipeline mode, stop the pipeline and inform the user that LFG requires software tasks. Otherwise, verify that the `spec-plan` workflow produced a plan file in `docs/plans/`. If no plan file was created, invoke `spec-plan` again with the same `forwarded_arguments` payload. Do NOT proceed to step 2 until a written plan exists. **Record the plan file path** — it will be passed to spec-work in step 2 and spec-code-review in step 4.

   Read the plan metadata before continuing. If the plan has `artifact_contract: spec-unified-plan/v1`, proceed only when it has `artifact_readiness: implementation-ready` and `execution: code`. Stop the pipeline for `artifact_readiness: requirements-only`, any unrecognized readiness value, `execution: knowledge-work`, approach-plan outputs, answer-seeking/universal outputs, or invalid progress-like readiness values. LFG never launches `/goal` directly; when goal-mode or dynamic workflows are appropriate, `spec-work` owns that implementation engine choice and must return control to LFG afterward.

2. Invoke the `spec-work` skill with `mode:return-to-caller <plan-path-from-step-1>`.

   GATE: STOP. Verify that implementation work was performed - files were created or modified beyond the plan. Read the structured return and require `status: complete`, the same plan path, changed files, all in-scope U-IDs/tasks accounted for and completed, verification results with every required check passed or explicitly not applicable, an empty blocker list, behavior-change signal, `plan_status_completion_candidate`, `plan_status_completion_degraded_reason`, and `standalone_shipping_skipped: true`. Failed, not-run, vague, or missing required verification blocks the pipeline. Exactly one lifecycle shape is allowed: a non-null candidate with a null degraded reason, or a null candidate with one of `html-plan-lifecycle-degraded`, `legacy-plan-lifecycle-degraded`, `read-compatible-status-unmanaged`, or `source-plan-path-lifecycle-degraded`. Any missing, conflicting, or unknown lifecycle shape is blocked. When `behavior_change: true`, also require `verification_evidence` that names the relevant units/tasks, existing tests inspected, tests added/changed or used unchanged, red failure or characterization evidence when applicable, verification run, and any deliberate test exception. Do NOT decide the test strategy inside LFG; the evidence is spec-work's contract.

   If `behavior_change: true` but `verification_evidence` is missing or too vague to tell how behavior was protected, invoke `spec-work` one more time with the same `mode:return-to-caller <plan-path-from-step-1>` argument. Do not prompt the user and do not alter the plan path argument. The retry relies on spec-work's idempotency path to inspect the already-implemented work, fill the missing evidence, and return without reimplementing. If the second return still lacks coherent verification evidence, stop as blocked and report the missing fields instead of continuing to simplify/review/ship.

3. Invoke the `spec-simplify-code` skill on the branch diff.

   This runs before review so the code-review in step 4 covers the simplified code. **Skip** this step when the change is docs-only (only markdown/docs paths changed) or trivial (roughly under 10 changed lines). Otherwise let `spec-simplify-code` resolve the branch-diff scope itself：它保持行为，运行全项目 typecheck/lint，并默认运行 changed-path scoped tests；影响面明显扩大或 runner 无法缩小时才扩大测试范围。该步骤只提供 behavior-preservation signal，最终 verification gate 仍拥有完整 closeout truth。

   Do not commit in this step. `spec-simplify-code` leaves its changes in the working tree; step 4's review scopes the working tree (uncommitted changes included), and step 8's `spec-commit-push-pr` commits whatever remains. Committing here would sweep any still-uncommitted `spec-work` edits into a misleading `refactor` commit and could stall on a tree that never goes clean.

4. 以 `mode:agent plan:<plan-path-from-step-1>` 调用 `spec-code-review`，并传递以下可见上游上下文：

   ```yaml
   review_dispatch_authorization: authorized
   authorization_source: current-user-explicit-spec-lfg
   authorization_scope: one delegated read-only independent code review
   ```

   传递步骤 1 的 plan path，使 spec-code-review 能核对 requirements completeness。`mode:agent` 返回单一 JSON object，而非 Markdown Actionable Findings summary。解析其中的 `status`、`actionable_findings`、`findings`、`artifact_path`、`run_id` 与 `coverage.dispatch_reason_code`。

   GATE: 只有 `status: complete`、`coverage.dispatch_reason_code` 为 null，且实际 reviewer 不只是 `inline-fallback` 时才能继续。JSON 损坏或缺失，以及 `failed`、`degraded`、`skipped` 或其他不完整结果都表示独立审查不可用；保留其有界 findings，并在步骤 5、browser verification、lifecycle、commit、push、PR、tracker 或 CI 副作用前停止。

   `mode:agent` is report-only **by design** — it surfaces findings but never edits the tree; LFG applies the eligible ones in step 5. When narrating progress to the user, frame this as "review found X → applied X in step 5," not as "code review did not auto-fix." A report-only review followed by an LFG-applied fix is the intended contract, not a gap.

5. **Apply review fixes locally** (REQUIRED after step 4)

   Load `references/review-followup.md` and execute its apply step. Apply eligible
   mechanical findings and run their targeted verification, but leave verified
   review fixes in the working tree. Do not stage, commit, push, file tracker
   items, edit a PR, or perform any other durable or outward shipping side effect
   before the browser/cleanup gate in step 6 closes.

6. **Decide browser applicability, then verify when applicable.** Decide
   `browser_applicability: applicable | not_applicable` from the settled plan and
   actual changed flow, not filename extension alone. A changed user-visible
   route, form, navigation, client interaction/state, or an explicit
   browser/runtime verification obligation is `applicable`; docs-only,
   library/CLI, or backend-only work without a changed user-visible flow may be
   `not_applicable`. Record the concrete reason either way. For `not_applicable`,
   record an explicit `not_applicable` browser result and continue without invoking the browser skill or its wrapper.

   For `applicable`, first validate any supplied `caller_target_origin`. An
   invalid caller value is the diagnostic blocker `target-origin-invalid`; do
   not fall back from malformed or repeated caller input. A missing caller value
   returns `not_run / target-origin-missing` before browser invocation and blocks
   the applicable flow. With a valid caller value, invoke `spec-test-browser`
   with `mode:pipeline target-origin:<origin>`. Do not infer an origin from
   redirects, page state, ambient listeners, free ports, framework defaults, or
   other project files.

   The caller owns the project server lifecycle. LFG forwards the exact origin
   but does not read local runtime profiles, start or stop a project server, or
   inspect project process state. Before the browser test plan is written,
   determine whether its expected navigation or interaction has a durable or
   external effect. A caller-provided origin is not mutation authorization: when
   the current call lacks named authorization for that origin, flow, and effect,
   record `not_run / browser-mutation-authorization-required`, do not write the
   blocked step, and do not continue to lifecycle or landing actions.

   Consume the browser result item by item: origin provenance, wrapper probe `status`/`reason_code`,
   `capabilities.exact_origin_confirmed`, every route/step status, `action_process_calls`, browser cleanup `status`/`reason_code`,
   private evidence refs, and limitations. A wrapper, pipeline, applicable
   capability, browser cleanup, or result that is `not_supported`, `not_run`,
   `failed`, missing, or indeterminate is a diagnostic blocker with its returned
   reason code; do not let passed route/step results hide cleanup failure.

   GATE: STOP. Before the shipping precondition, require browser verification
   to have passed or be explicitly `not_applicable` with its recorded reason. A
   failed, not-run, missing, or indeterminate result blocks lifecycle mutation
   and every landing side effect for an applicable flow.

**Shipping precondition (steps 7–9).** Only after step 6 closes, run `git remote`
once. If it lists **no remote** (e.g. a sandbox/throwaway checkout that has
`git init` but no `origin`), shipping is **local-only**: make the local commits
called for below, but skip every push, PR create/edit, and CI-watch action in
steps 7–9. A missing remote is a terminal local-only state, not an error: never
retry a push or hunt for a remote. Run steps 7–9 normally when a remote exists.

7. **Autonomous residual handoff** (only when step 4 reported one or more actionable `downstream-resolver` findings not applied in step 5; skip when it reported `Actionable findings: none.`)

   Do not prompt the user. This step embraces the autopilot contract: residuals must become durable before DONE, but the agent never stops to ask.

   1. Load `references/tracker-defer.md` in **non-interactive mode**. Pass the residual actionable findings from step 4/5 (or the run artifact when the summary was truncated).
   2. Collect the structured return: `{ filed: [...], failed: [...], no_sink: [...] }`.
   3. Compose a `## Residual Review Findings` markdown section from the structured return:
      - For each item in `filed`: a bullet with severity, file:line, title, and a link to the tracker ticket URL.
      - For each item in `failed`: a bullet with severity, file:line, title, and the failure reason (e.g., `Defer failed: gh returned 401 — tracker unavailable`).
      - For each item in `no_sink`: a bullet with severity, file:line, and title inlined verbatim so the PR body or fallback file is the durable record.
   4. Detect the current branch's open PR without prompting:

      ```bash
      gh pr view --json number,url,body,state
      ```

   5. If an open PR exists, update it directly with `gh`; do not load any confirmation-driven PR update skill. Append or replace the `## Residual Review Findings` section in the current PR body, write the new body to an OS temp file, then run:

      ```bash
      gh pr edit PR_NUMBER --body-file BODY_FILE
      ```

   6. If no open PR exists, create a tracked fallback file at `docs/residual-review-findings/<branch-or-head-sha>.md` containing the composed section and the source PR-review run context. Stage only that file, commit it with `docs(review): record residual review findings`, and push the current branch **when a remote is configured** (per the shipping precondition). If an upstream exists, run `git push`. If no upstream exists but a remote is configured, resolve a writable remote dynamically: prefer `origin` when present, otherwise use `git remote` and choose the first configured remote. Then run `git push --set-upstream <remote> HEAD`. If there is no remote at all, do not push — the committed fallback file is the durable sink. This is the durable no-PR sink. Do not output DONE until the residual findings are durable: either the existing PR body has been updated, or this fallback file commit has been made (pushed when a remote exists, committed locally when none). A push that fails when a remote exists is a stop-and-report; never retry a push, or block DONE, when no remote exists.

   Never block DONE on tracker filing failures once residuals have been durably recorded. A `no_sink` outcome is success only when the findings are present in the PR body or in the pushed fallback file.

7.5. **Complete the source plan lifecycle marker.** The `spec-work` Return-to-Caller envelope never writes status; its candidate already resolves either the direct plan or a validated task pack's `source_plan`. After simplification, required review, residual handoff, and final verification have closed, use the validated lifecycle shape from step 2. When `plan_status_completion_candidate` is present, invoke `spec-first internal plan-status complete --target-repo <root> --plan <candidate> --json`; accept `active → completed` or the already-completed idempotent result, and block DONE on any other helper result. When the candidate is null with an allowed `plan_status_completion_degraded_reason`, skip mutation, preserve the verified development result, and surface that degraded boundary in DONE. This marker is not CI, merge, release, or field-outcome proof.

8. Invoke the `spec-commit-push-pr` skill with `mode:pipeline` and pass this visible upstream authority context:

   ```yaml
   commit_authorization: authorized
   landing_authorization: authorized
   authorization_source: current-user-explicit-spec-lfg
   authorization_scope: pipeline-owned paths and the current branch PR
   ```

   These facts come from the entry admission above; `mode:pipeline` only selects unattended execution and never grants authority. If either authority fact is absent or cannot be traced to that explicit request, stop before invoking the helper with `commit_authorization_missing` or `landing_authorization_missing`.

   This commits any remaining pipeline-owned changes, pushes the branch, and opens a pull request — non-interactively, per the mode token. If it prints a `New concepts:` trailer after the PR URL, record the concept name(s) for step 10. If step 7 already opened or edited a PR (check with `gh pr view --json number,url,state 2>/dev/null`), skip PR creation but still commit and push any uncommitted pipeline-owned changes. **Per the shipping precondition, when no remote is configured, do NOT invoke `spec-commit-push-pr` — its commit step pushes unconditionally (`git push -u origin HEAD`), so a literal invocation would still hit the impossible push. Instead stage only pipeline-owned paths, commit the remaining changes locally, and skip push and PR creation entirely.**

9. **CI watch and autofix loop** (only when an open PR exists for the current branch)

   Detect the PR; if none exists or `gh` is unavailable, skip this step entirely and proceed to step 10.

   ```bash
   gh pr view --json number,url,state
   ```

   For up to **3 fix iterations**, repeat:

   1. Wait for CI to complete:

      ```bash
      gh pr checks --watch
      ```

      If the command exits 0, all checks passed. Break out of the loop and proceed to step 10.

      If it exits non-zero, one or more checks failed. Continue to (2).

   2. Identify failing checks and pull their failure logs. Use `gh pr checks --json name,state,conclusion,workflow,link` to enumerate failures, then for each failing check read the run logs:

      ```bash
      gh run view <run-id> --log-failed
      ```

      where `<run-id>` is parsed from the check's details URL or workflow run.

   3. Read the failure logs, identify the root cause, and apply a fix in the working tree. Do NOT weaken, skip, or mock the failing assertion to make it pass — repair the actual issue. If the failure is a flaky test that has no fix path, document that as the residual outcome below rather than retrying without a code change.

   4. Stage only the files you changed, commit, and push:

      ```bash
      git add <changed-files>
      git commit -m "fix(ci): <one-line summary of the failure repaired>"
      git push
      ```

   5. Return to iteration (1) with the next attempt counter.

   GATE: STOP iterating after 3 failed attempts. If CI is still red after 3 fix cycles:

   - Compose a `## CI Failures Unresolved` markdown section listing each remaining failing check, the failure summary, and the run/check URL.
   - Append or replace this section in the PR body, write the new body to an OS temp file, then run:

     ```bash
     gh pr edit PR_NUMBER --body-file BODY_FILE
     ```

   - Do NOT continue looping. The autopilot contract is "make residuals durable, then exit." Proceed to step 10.

10. Output `<promise>DONE</promise>` when complete

    If step 8 recorded a `New concepts:` trailer, first echo one line per concept: `New concept introduced: <name> — run spec-explain <name> to go deeper.` Then output the DONE promise.

Start with step 1 now. Remember: plan FIRST, then work. Never skip the plan.
