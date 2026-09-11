# Return To Caller

Resolve all `references/...` paths from the `spec-work` skill root.

## Owned

The complete return envelope, final evidence, idempotent recovery, and caller-owned tail.

## Not Owned

Changing source-plan scope, granting authority, or replacing another phase owner's verification and lifecycle rules.

## Trigger

Read in full immediately before every return, even when read earlier.

## Fallback

If this owner cannot be read, use only the entrypoint\'s minimum blocked recovery envelope; preserve partial state and never enter the standalone tail.

Input triage owns and validates the invocation grammar in `references/input-triage.md`.

`mode:return-to-caller <plan-path>` (legacy alias: `mode:caller-owned-tail`) is
reserved for orchestrators such as `lfg` that own simplification, code review,
PR creation, and CI watching after implementation. In this mode `spec-work`
performs implementation and local verification only, then returns a structured
summary instead of running the standalone shipping tail.

Return:

- `status`: `complete`, `blocked`, or `failed`
- `plan_path`: direct plan path, or the validated task pack's authoritative `source_plan`
- `task_pack_path` and pinned `task_pack_digest` when task-pack intake was used; otherwise `null`
- `changed_files`
- `u_ids_attempted`
- `u_ids_completed`
- `task_ids_attempted` and `task_ids_completed` when Task Cards drove execution
- `verification_results`
- `verification_evidence`: one entry per attempted behavior-bearing unit, plus any non-behavioral unit where tests were intentionally skipped. Each entry states the unit/task, `behavior_changed`, `existing_tests_inspected`, `tests_added_or_changed`, tests used unchanged, red failure or characterization observed when applicable, verification commands/results, and any exception reason. For units executed by subagents, this entry is assembled from each worker's returned evidence (the workspace setup worker-packet step), not reconstructed from the diff — the red-before-implementation observation exists only in the worker's report.
- `verification_run_summary_ref`: repo-relative `verification-run-summary.v1` ref produced from the commands this work run actually executed, or `null` with an explicit limitation when no structured summary could be written
- `verified_worktree_fingerprint`: the complete `spec-work-working-tree-fingerprint/v1` object produced by `scripts/working-tree-fingerprint.cjs` (resolved from this skill's own `SKILL_DIR`) after this invocation's final required verification and immediately before return. It covers HEAD, tracked/staged/unstaged diff, untracked paths, and untracked bytes. A behavior-bearing `status: complete` return requires it; non-behavior returns still include it whenever the helper can run, so callers can apply freshness gates uniformly. A non-behavior no-test exception explains why automated tests are unnecessary, replacement verification, and coverage limits; it does not waive an available fingerprint helper or structured closeout for executed verification. If the helper cannot run (missing runtime asset, no git, no Node), record a `fingerprint-helper-unavailable` blocker naming the concrete cause — never fabricate the object or omit it silently.
- `honest_closeout_verdict`: `verified`, `degraded`, or `unsupported`, together with the validator `overall_reason_code`
- `run_artifact_path`: repo-relative `spec-work-run-artifact/v2` path when a durable trigger wrote one; otherwise `null`
- `run_artifact_reason_code`: the matched durable trigger, `no-trigger-matched`, or the producer's concrete `not-written` reason
- `claim_limitations`: structured limitations for not-run checks, unsupported claim refs, review-evidence materialization failure, provider-bounded evidence, or other claim ceilings
- `blockers`
- `behavior_change`: whether behavior-bearing code changed
- `commit_authorization: missing` and `landing_authorization: missing` for this mode; Return-to-Caller does not consume either exit
- `plan_status_completion_candidate`: the repo-relative direct `docs/plans/*.md` source plan that the caller may complete after its own shipping gates, or `null` when lifecycle mutation is not applicable
- `plan_status_completion_degraded_reason`: `null` when a candidate is present; otherwise one of `html-plan-lifecycle-degraded`, `legacy-plan-lifecycle-degraded`, `read-compatible-status-unmanaged`, or `source-plan-path-lifecycle-degraded`. Duplicate, malformed, or invalid lifecycle metadata is a blocker, not a degraded result.
- `standalone_shipping_skipped: true`

Return `status: complete` only when every in-scope unit/task is accounted for and completed, task-pack pins still match when applicable, every required task review is closed, `blockers` is empty, and every required verification result is passed or explicitly not applicable with a reason. Behavior-bearing work also requires the verification evidence and `verified_worktree_fingerprint` above; a non-behavior testing exception cannot waive these requirements for behavior-bearing work. Failed, degraded, not-run, vague, stale, or missing required verification/review cannot return complete.

If a previous return-to-caller run implemented code but omitted evidence, or the caller re-enters after caller-owned simplification/review fixes, the later same-plan invocation must use the idempotency path instead of reimplementing. Re-read the current plan and tree, rerun the complete applicable Verification Contract against the current working tree, create a fresh verification-run-summary ref for commands executed by this invocation, and capture a new `verified_worktree_fingerprint` only after those checks finish. Never reuse the earlier run summary or fingerprint as final-tree evidence.

`standalone_shipping_skipped: true` only assigns simplify, full review, plan lifecycle, and landing to the caller; it does not skip structured closeout for commands this work run executed. Follow `references/shipping-workflow.md` Step 5.1 to record the run summary, validate honest closeout, and return the run artifact path/reason when the durable trigger applies. Candidate commands in a plan, worker prose saying tests pass, and session-temp review paths are not confirmed evidence for these fields.

Engine selection (`references/execution-engines.md`) still applies in this mode,
but only for implementation. In return-to-caller mode do not emit a copyable
goal/workflow prompt — a manual paste step strands the caller; run
inline/authorized workers or return a blocker instead. Any goal/workflow engine used here
must not commit, push, open a PR, run the owner workflow tail, or bypass the caller-owned
gates. Return-to-Caller never invokes `plan-status complete`; it returns only the
completion candidate, and the caller owns the eventual shipping closeout.
