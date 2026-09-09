---
name: spec-work
description: "Execute a settled plan, validated task pack, spec path, or concrete implementation request. Use for end-to-end work or caller-owned implementation and local verification without the shipping tail. Use spec-debug for open-ended bugs and spec-resolve-pr-feedback for existing PR feedback. Stop when target repo, scope, source owner, or required authorization is unresolved."
argument-hint: "[Plan doc path or description of work. Blank to auto use latest plan doc]"
---

# Work Execution Command

## Project Intelligence Evidence Boundary

Graph candidates may orient implementation or affected-surface inspection, but they are never implementation basis or completion evidence by themselves. Re-ground changes and completion claims in the settled plan, current source, tests, logs, contracts, and owner evidence; direct reads are valid and empty results have no negative authority. Provider failure falls back without blocking ordinary work.

## Workflow Contract Summary

- **Inputs:** settled implementation-ready code plan, validated task pack, explicit knowledge-work plan, or concrete bounded implementation prompt.
- **Outputs:** scoped source changes, task/unit evidence, required review/residual posture, structured verification closeout, and an authorization-aware handoff. A task pack remains derived; its source plan owns scope/lifecycle.
- **Hard exits:** unresolved target repo/dirty overlap/source owner, requirements-only or invalid unified metadata, task-pack/source-plan drift, scope-changing acceptance/architecture/provider/source-runtime discovery, failed required review/verification, or missing mutation/commit/landing authority for the requested exit.
- **Ownership:** scripts prepare deterministic facts; LLMs judge semantic fit. Canonical source is modified; generated runtime mirrors are never source fixes. Local mutation, commit, landing, lifecycle, and durable evidence are separate exits.
- **Consumers:** `spec-code-review`, caller-owned LFG/goal flows, commit/PR/release workflows, `spec-compound`, and human reviewers.

## Phase Reads

Read each required owner in full when entering its phase; a read made before that phase does not satisfy it. A terminal owner must be read again at its step even when already in context. Paths resolve from this skill's root. If a required owner is unreadable, preserve artifacts and changed state, return blocked with the missing owner and recovery path, and do not infer completion from existing files.

## Reference Trigger Map

| Reference | Trigger | If unread/unavailable |
| --- | --- | --- |
| [Input triage](references/input-triage.md) | Phase 0, before classification. | Block execution. |
| [Workspace setup](references/workspace-setup.md) | Phase 1, before task derivation. | Block dependent actions. |
| [Work intake](references/work-intake.md) | Bare prompt or bounded plan read. | No task derivation. |
| [Work intake and task pack](references/work-intake-and-task-pack.md) | Metadata says `type: task-pack`. | Return validation/regeneration handoff. |
| [Non-code execution](references/non-code-execution.md) | `execution: knowledge-work`. | No code lifecycle. |
| [Execution strategy](references/execution-strategy.md) | Before write/test/dispatch/commit. | Block the dependent action. |
| [Execution engines](references/execution-engines.md) | Non-default engine is relevant. | No non-default execution. |
| [Implementation loop](references/implementation-loop.md) | Before implementation, even trivial. | No write or completion. |
| [Feedback and tests](references/feedback-and-tests.md) | Before behavior change/test design. | No coverage claim. |
| [Implementation quality](references/implementation-quality.md) | Before durable-surface mutation. | No new durable surface. |
| [Shipping workflow](references/shipping-workflow.md) | Standalone quality/closeout. | No completion/commit/landing. |
| [Review findings followup](references/review-findings-followup.md) | Review returns actionable findings. | Preserve findings. |
| [Tracker defer](references/tracker-defer.md) | Explicit external deferral. | Return `no_sink`. |
| [Return to caller](references/return-to-caller.md) | Immediately before caller return. | Minimum blocked recovery only. |

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md`.
Overrides: high-risk

- `foreign-residual-workspace` -> `blocked-action-required`: stop before source writes, behavior-bearing tests that rely on suspect local artifacts, review fixes, commits, lifecycle mutation, or PR-ready claims until the named cleanup/init action runs or the user explicitly accepts degraded evidence.
- optional external-tool evidence unavailable -> `fallback-only`: use bounded direct source, test, log, diff, and user-provided evidence; disclose the missing capability and do not claim unconfirmed impact or coverage.
- `non-git-build-workspace` coverage gaps -> `partial`: keep work inside explicit `target_repo`/covered roots and directly inspect any uncovered build module before changing or claiming behavior there.

## Input Document

<input_document> #<invocation arguments supplied by the current host> </input_document>

## Execution Workflow

### Phase 0: Input Triage

Read `references/input-triage.md` now. Parse caller mode before metadata and classify task packs before unified plans. Requirements-only, invalid metadata, task-pack drift, or non-active source plans cannot enter implementation. Historical completion continues only through the plan owner's verified active successor; preserve historical plans and pins. Knowledge-work uses its own route. Missing required intake blocks execution.

The classification order is `mode token -> file metadata -> task pack -> unified plan -> legacy plan / knowledge-work -> bare prompt`. Do not read the full task-pack body before this classification. A task-pack metadata read must not load its full body before this classification. The triage owner preserves `mode:return-to-caller`, `caller:lfg`, `type: task-pack`, and the blank/bare-prompt rules.

### Phase 1: Quick Start

Read `references/workspace-setup.md` now for bounded plan intake, execution boundaries, task derivation, and engine selection. Read `references/work-intake.md` before reading implementation units. Follow `references/execution-strategy.md` before the first write, behavior-bearing test, review fix, dispatch, or commit.

Hard anchors remain here:

- Resolve one Git root and an explicit `target_repo` in a parent workspace. Artifact `--repo` is not mutation authority.
- Record pre-existing dirty paths; preserve overlapping user-owned hunks under an explicit bounded strategy.
- Modify canonical source; generated runtime mirrors are not source fixes.
- Scope-changing acceptance, architecture, provider/repo, or source-owner discoveries return to `spec-plan`/task regeneration.
- A scope-changing discovery is a hard stop; preserve the current state and return to the plan owner.
- Missing worker authorization uses inline/serial with `dispatch_authorization_missing`, `capability_probe: not_applicable`, and unknown capability. Do not discover workers without authorization; unknown isolation follows shared-directory rules.
- Local implementation does not imply `commit_authorization`; commit does not imply `landing_authorization`. Never pull/switch/create/rename branches or worktrees merely because a plan exists. Default-branch commit needs explicit authority.

After bounded intake and task derivation, resolve any applicable non-default engine through `references/execution-engines.md` before selecting a unit, writing, dispatching, or committing. Inline is the portable default. Engine choice never changes task-pack checkpoints or tail ownership.

### Phase 2: Execute

Before the first implementation write, including a trivial route without tasks, read `references/implementation-loop.md`. It owns task execution, targeted verification, pattern reuse, simplification, UI checks, progress, and commit checkpoints. Read `references/feedback-and-tests.md` before behavior changes and `references/implementation-quality.md` before durable-surface changes.

Only the orchestrator may stage and commit an authorized, verified logical unit. Preserve pre-existing staged and unstaged work; never commit another task's index entries or whole-file changes merely because paths overlap.

### Phase 3-4: Quality Check and Finishing Work

Standalone only: read `references/shipping-workflow.md` now when all implementation tasks are accounted for. Run the portable `spec-code-review` path or record its honest unavailable/manual fallback; dedicated review can be skipped only for purely mechanical diffs. Its orchestrated `mode:agent` is report-only. Read `references/review-findings-followup.md` before applying findings; the shipping owner then resolves residuals.

Skipping simplify or independent review does not waive evidence closeout. Record `verification-run-summary`, run `honest-closeout`, then let the owning workflow decide `plan-status complete` eligibility. Historical completion closes only the valid successor. Commit and landing remain separately authorized.

## Return-to-Caller Mode

Return-to-Caller Mode performs implementation and local verification only. It must not enter Phase 3-4 or run final simplify, full review, PR creation, CI watching, or lifecycle completion; the caller owns those gates.

Immediately before emitting any result, read `references/return-to-caller.md` again. It alone owns the complete envelope, evidence gate, idempotent verification, and `standalone_shipping_skipped: true`. Do not reconstruct a complete return from this entrypoint.

If that read fails, preserve every changed file, commit, and workspace. Return only this minimum blocked recovery envelope: `status: blocked`, `plan_path`, `changed_state`, `blockers` naming the missing owner, and `recovery_path`. Unknown facts stay unknown. Never erase state, report success, or fall into the standalone tail.

The terminal owner validates the complete return fields: `status`, `plan_path`, `task_pack_path`, `task_pack_digest`, `changed_files`, `u_ids_attempted`, `u_ids_completed`, `verification_results`, `verification_evidence`, `verification_run_summary_ref`, `verified_worktree_fingerprint`, `honest_closeout_verdict`, `run_artifact_path`, `run_artifact_reason_code`, `claim_limitations`, `blockers`, `behavior_change`, `commit_authorization`, `landing_authorization`, `plan_status_completion_candidate`, `plan_status_completion_degraded_reason`, and `standalone_shipping_skipped`.

The `verified_worktree_fingerprint` uses `spec-work-working-tree-fingerprint/v1`; a later caller-owned mutation requires a fresh verification run and fresh fingerprint before any completion claim.
The fingerprint is produced by `scripts/working-tree-fingerprint.cjs` from the skill directory and is refreshed after final verification.
