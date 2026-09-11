# Implementation Return (Step 2)

Invoke the `spec-work` skill with `mode:return-to-caller <plan-path-from-step-1>`.

## Terminal Status Gate

Inspect status before file presence or evidence recovery. `blocked`, `failed`, missing, unknown, or malformed status stops without retry, even when implementation files exist. Preserve the reported blockers and recovery facts. Only an explicit `status: complete` result is eligible for complete-return validation or the bounded evidence-recovery path below.

If the return owner cannot be reloaded, accept the entrypoint-owned minimum blocked recovery envelope as a terminal failure shape: `status: blocked`, `plan_path`, `changed_state`, `blockers`, and `recovery_path`. Preserve those facts; do not require the complete-return inventory, erase partial work, or enter the shipping tail.

## Complete Return Inventory

Require every field below, including nullable and empty fields. Validate each against the producer's `references/return-to-caller.md`; field presence alone does not prove completion:

- `status`, `plan_path`, `task_pack_path`, `task_pack_digest`
- `changed_files`, `u_ids_attempted`, `u_ids_completed`
- `verification_results`, `verification_evidence`, `verification_run_summary_ref`, `verified_worktree_fingerprint`
- `honest_closeout_verdict`, `run_artifact_path`, `run_artifact_reason_code`, `claim_limitations`
- `blockers`, `behavior_change`, `commit_authorization`, `landing_authorization`
- `plan_status_completion_candidate`, `plan_status_completion_degraded_reason`, `standalone_shipping_skipped`

Require `task_ids_attempted` and `task_ids_completed` when Task Cards drove execution; require matching task-pack pins when used. Both authorization fields must be `missing`, and `standalone_shipping_skipped` must be `true`. Evidence and limitation fields remain present when empty. Unknown, missing, or conflicting required values block advancement.

## Evidence And Recovery

Preserve proceeded-under-flag decision conflicts from the producer's `claim_limitations` or other documented evidence fields. Carry the decision owner, direct evidence, and routing outcome into the residual record and landing context; later review may not rediscover them. An invalidating conflict is a blocker, never a completed fallback. Do not invent foreign route-receipt fields or launch a second implementation to normalize a valid local return.

   GATE: STOP. Verify that implementation work was performed - files were created or modified beyond the plan. Read the structured return and require `status: complete`, the same plan path, changed files, all in-scope U-IDs/tasks accounted for and completed, verification results with every required check passed or explicitly not applicable, an empty blocker list, behavior-change signal, `plan_status_completion_candidate`, `plan_status_completion_degraded_reason`, and `standalone_shipping_skipped: true`. Failed, not-run, vague, or missing required verification blocks the pipeline. Exactly one lifecycle shape is allowed: a non-null candidate with a null degraded reason, or a null candidate with one of `html-plan-lifecycle-degraded`, `legacy-plan-lifecycle-degraded`, `read-compatible-status-unmanaged`, or `source-plan-path-lifecycle-degraded`. Any missing, conflicting, or unknown lifecycle shape is blocked. When `behavior_change: true`, also require `verification_evidence` that names the relevant units/tasks, existing tests inspected, tests added/changed or used unchanged, red failure or characterization evidence when applicable, verification run, and any deliberate test exception. Do NOT decide the test strategy inside LFG; the evidence is spec-work's contract.

   If `behavior_change: true` but `verification_evidence` is missing or too vague to tell how behavior was protected, invoke `spec-work` one more time with the same `mode:return-to-caller <plan-path-from-step-1>` argument. Do not prompt the user and do not alter the plan path argument. The retry relies on spec-work's idempotency path to inspect the already-implemented work, fill the missing evidence, and return without reimplementing. If the second return still lacks coherent verification evidence, stop as blocked and report the missing fields instead of continuing to simplify/review/ship.

   Record the accepted return's `verification_run_summary_ref` as `initial_verification_run_summary_ref` and require a complete `verified_worktree_fingerprint` object; only a `blockers`-free return that documents spec-work's deliberate non-behavior exception may substitute that documented exception for the object. These prove only the tree before caller-owned Simplify and review-fix mutations; they cannot satisfy step 6.5.
