# Workspace Setup

Resolve all `references/...` paths from the `spec-work` skill root.

## Owned

Bounded plan reading, repository and dirty-work boundaries, task derivation, engine choice, and authorized worker packets.

## Not Owned

Changing source-plan scope, granting authority, or replacing another phase owner's verification and lifecycle rules.

## Trigger

Read in full at Phase 1 before task derivation or any write/test/dispatch/commit.

## Fallback

Unresolved repository, source ownership, dirty overlap, or authority blocks the dependent action; unavailable required owners preserve state and return blocked.

1. **Read Plan and Clarify** _(skip if arriving from Phase 0 with a bare prompt)_

   Read `references/work-intake.md` before reading implementation units. It owns bounded plan reading and clarification; validated task packs still use `references/work-intake-and-task-pack.md`. Do not edit the plan body during execution. Progress lives in verified task evidence and Git; only the shipping owner may close lifecycle after required gates.

2. **Establish Execution Boundary And Strategy**

   Read `references/execution-strategy.md` before the first write, behavior-bearing test, review fix, commit, or landing action. It is the owner for branch/worktree, task tracking, worker dispatch, parallel safety, integration, commit, and landing details.

   Hard anchors remain here:

   - Resolve one current Git root and, in a parent workspace, one explicit `target_repo` or per-task repo scope. Artifact `--repo` is not mutation authority.
   - Record pre-existing dirty paths and stop for overlapping user-owned edits unless an explicit bounded preservation strategy exists.
   - Modify canonical source of truth; generated runtime mirrors are not source fixes.
   - A necessary discovered file may join the actual changed set only with direct evidence that it completes existing scope. A scope-changing discovery involving acceptance, public contract, architecture, provider/repo boundary, or source ownership returns to `spec-plan`/task regeneration.
   - Missing worker dispatch authorization/capability falls back inline. Unknown isolation follows shared-directory rules.
   - Local implementation does not imply `commit_authorization`; commit does not imply `landing_authorization`. Without them, keep verified changes uncommitted and do not push/open a PR.

   **STOP — before the first behavior-bearing mutation, read `references/feedback-and-tests.md`.** It owns smallest feedback loop, vertical slicing, proof/characterization, test discovery, system-wide checks, and not-run replacement evidence. For a trivial non-behavioral edit, use the narrow obvious check and do not load or restate the full reference.

   **STOP — before adding or materially changing a durable surface, read `references/implementation-quality.md`.** Durable surfaces include dependencies, files, abstractions, helpers/wrappers/adapters, public/schema/runtime/provider/source-of-truth boundaries, workflow handoffs, generators, skills/agents, and artifact contracts. Recheck current source with `reuse / extend / compose / new`; if the active plan/task did not authorize the needed architecture decision, stop back instead of designing it during implementation. Ordinary bounded edits to an already-owned surface do not emit an architecture matrix or decision note.

   Apply the reference and record one run-local boundary: `target_repo`, current `HEAD`/branch, pre-existing dirty paths and overlap, canonical source owner, allowed/changed paths, scope-changing discoveries, worker dispatch authorization/capability/isolation, and separate mutation/commit/landing authorization. Branch or worktree mutation requires explicit authority; never pull/switch/create/rename merely because a plan exists. Default-branch commit still requires explicit confirmation.

   A necessary discovered file may join the changed set only when direct evidence shows it completes existing scope. Acceptance/public-contract/architecture/provider/repo/source-owner expansion returns to `spec-plan` or task regeneration. Unknown isolation follows shared-directory rules; missing dispatch authorization/capability runs inline. Workers never commit.

3. **Create Task List** _(skip if Phase 0 already built one, or if Phase 0 routed as Trivial)_

   - Validated task packs use only pinned `Task Pack Contract.tasks` and `execution_waves`; preserve `task_id`, dependencies, source refs, declared files, `stop_if`, and review intent.
   - Direct plans use implementation units/U-IDs, dependencies, files, scenarios, verification, execution notes, and patterns; do not invent code-level micro-steps or a parallel private plan.
   - Use the current host tracker when available; otherwise keep a run-local list. Track blockers and evidence, not commit existence.

4. **Choose Execution Engine, then Strategy**

   Read [Execution engines](references/execution-engines.md) only when plan shape or explicit direction makes a non-default engine relevant. Inline is the portable default. A non-default engine needs explicit authorization and current-session semantic capability, preserves task-pack checkpoints/structured returns, and never changes tail ownership.

   Before worker dispatch, inherit the full boundary from `references/execution-strategy.md` and record `worker_dispatch_authorization`, `capability_probe`, `worker_dispatch_capability`, `worker_context_isolation`, `worker_model_override`, and `worker_bounded_parallelism`, then normalize the path as `worker_dispatch_outcome`. Missing authorization forbids discovery and fixes `capability_probe: not_applicable` plus capability unknown. Only after authorization may the current-session registry/schema be consumed as `provider_untrusted` evidence. Use serial execution for dependencies, overlapping files/contracts/schema/config/lockfiles/generated outputs, shared environment singletons, or unknown bounded parallelism. Stop parallelizing after broad unplanned edits, repeated conflicts, or out-of-scope failures.

   Give each worker a bounded unit packet rather than the whole plan: Goal Capsule/DoD, active unit, relevant R/F/AE/KTD and Verification excerpts, files/patterns/scenarios/execution note, plus the triggered feedback/implementation-quality rules. Require changed paths and evidence fields in the return. The orchestrator verifies the actual tree, detects collisions/overwrites, integrates in dependency order, reruns authoritative checks, updates task state, and records one of `dispatch_authorization_missing`, `subagent_capability_missing`, or `worker_capability_unproven`, plus any isolation limitations.
