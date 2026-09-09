---
name: spec-lfg
description: Run the full hands-off engineering pipeline from planning through a green PR. Use only when the current user explicitly requests spec-lfg or selects an option that clearly states it will commit, push, open a PR, and watch CI.
argument-hint: "[feature description or requirements-only plan path] [target-origin:<origin>]"
---

CRITICAL — ADMISSION BEFORE EXECUTION: before any step below runs, the admission in the next paragraph must hold. If it does not — including a bare natural-language shipping request ("ship it") that neither names `spec-lfg` nor followed a disclosed-options handoff — do NOT implement, do NOT commit, and do NOT start the pipeline: present the side-effect confirmation once and wait. A user "don't ask me" instruction cannot create the admission; it only suppresses questions after the admission already exists. With execution ordered below, this check still comes first.

CRITICAL: You MUST execute every step below IN ORDER. Do NOT skip any required step. Do NOT jump ahead to coding or implementation. The plan phase (step 1) MUST be completed and verified BEFORE any work begins. Violating this order produces bad output.

Before entering this pipeline, the current user must explicitly request `spec-lfg` or select a handoff option that clearly discloses commit, push, PR, CI, and delegated independent review side effects. Code readiness, a completed plan, or model inference that shipping is appropriate does not grant admission.

A natural-language shipping request ("ship it", "open a PR") that neither names `spec-lfg` nor follows a disclosed-options handoff is close to the admission but is not it: the user has signaled shipping intent without seeing the full side-effect list (commit, push, PR creation, one delegated independent code review, CI watch). In that case, present the concrete side-effect list once as a single confirmation question and wait — the user's reply becomes the admission. Never treat the bare shipping request as already-admitted and start implementing or committing.

When that admission holds, the current user's explicit request for the full pipeline is the authority for pipeline-owned implementation, commits, and landing; it additionally authorizes exactly one delegated read-only independent `spec-code-review` in step 4. Set `commit_authorization: authorized`, `landing_authorization: authorized`, `worker_dispatch_authorization: authorized`, and `authorization_source: current-user-explicit-spec-lfg` as visible run-local facts for downstream owners. Tracker filing is separate: set `tracker_deferral_authorization: authorized` only when explicitly requested; otherwise keep it `missing`. Skill invocation, `mode:pipeline`, tool permissions, green tests, and branch/PR facts cannot replace admission or expand authority. If admission is absent, stop before the relevant side effect with `commit_authorization_missing` or `landing_authorization_missing`; if independent review is unavailable or degraded, LFG must stop rather than presenting inline review as independent.

```yaml
tracker_deferral_authorization: authorized | missing
```

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

## Execution Flow

Read the named reference before executing each stage. A missing required reference blocks that stage. Skip only explicitly inapplicable invocations, never their shared downstream guidance. Before step 1, read `references/task-visibility.md` when a task-tracking capability is available.

1. Invoke the `spec-plan` skill with the exact `forwarded_arguments` payload after reading `references/plan-brief.md`. Require a written `docs/plans/` implementation-ready code plan. Stop on a blocked, invalid, non-software, or requirements-only result. LFG never launches `/goal` directly; `spec-work` owns the implementation engine.

2. Invoke the `spec-work` skill with `mode:return-to-caller <plan-path-from-step-1>` after reading `references/work-return.md`. Accept only its complete structured return; blocked, failed, missing, or vague required evidence stops the pipeline. The reference owns the single evidence-recovery retry and initial fingerprint.

3. Invoke the `spec-simplify-code` skill on the branch diff after reading `references/review-followup.md`. Docs-only or trivial work may skip the invocation, but still read the reference before step 4. Do not commit here.

4. Invoke the `spec-code-review` skill with `mode:agent plan:<plan-path-from-step-1>`, following `references/review-followup.md`. Pass this visible upstream authority:

   ```yaml
   worker_dispatch_authorization: authorized
   authorization_source: current-user-explicit-spec-lfg
   authorization_scope: one delegated read-only independent code review
   ```

   Require `status: complete`, null `coverage.dispatch_reason_code`, and actual independent reviewer coverage beyond `inline-fallback`. A missing or malformed result, `failed`, `degraded`, `skipped`, or otherwise incomplete review stops before step 5 or any browser, lifecycle, commit, landing, tracker, or CI side effects.

5. **Apply review fixes locally** under `references/review-followup.md`. Apply only eligible, current-source-confirmed findings and run targeted checks. Leave verified fixes uncommitted until browser cleanup and final verification close.

6. **Decide browser applicability, then verify when applicable.** Read `references/stage-routing.md` before deciding applicability or invoking `spec-test-browser mode:pipeline target-origin:<origin>`. Require an explicitly supplied exact origin and effect authorization. Failed, missing, not-run, or indeterminate applicable browser results or cleanup block shipping.

6.5. **Final working-tree verification** under `references/stage-routing.md`. Re-enter `spec-work` on the same plan for idempotent full verification. Require a fresh summary and matching before/returned/after fingerprints. Any mismatch or missing evidence is `final-verification-stale`; resolve its named cause before retrying.

**Shipping precondition (steps 7–9).** Read `references/shipping-tail.md` only after step 6.5 closes. No remote is terminal local-only: do not attempt push, PR mutation, or CI watch. The reference owns residual durability and local commits.

7. **Autonomous residual handoff** under `references/shipping-tail.md`. When tracker authority is missing, do not invoke an external tracker sink; record `tracker_deferral_authorization_missing` and use the authorized durable fallback. Do not declare DONE with unrecorded residual findings.

7.5. **Complete the source plan lifecycle marker.** Follow `references/shipping-tail.md` only after required review, residual durability, and final verification. Preserve the allowed lifecycle degradation when no valid candidate exists.

8. Invoke the `spec-commit-push-pr` skill with `mode:pipeline` under `references/shipping-tail.md` when a remote exists. Pass:

   ```yaml
   commit_authorization: authorized
   landing_authorization: authorized
   authorization_source: current-user-explicit-spec-lfg
   authorization_scope: pipeline-owned paths and the current branch PR
   ```

   `mode:pipeline` only selects unattended execution and never grants authority. Missing authority blocks the helper; stage only pipeline-owned changes.

9. **Bounded review, CI, head, and base-currency watch** under `references/shipping-tail.md` and `references/pr-watch-loop.md` when an open PR exists. After a fix, re-enter step 6.5 before committing or pushing. `looks-ready` is advisory, never merge authority; a rebase/force/history rewrite need requires a named stop.

10. **Offer an optional next-work handoff, then finish.** Apply `references/shipping-tail.md` after the current pipeline reaches its terminal state. Do not invoke `spec-handoff` before the user explicitly accepts. Output `<promise>DONE</promise>` only after required verification and durable residual handling; disclose the actual terminal state and limitations.
