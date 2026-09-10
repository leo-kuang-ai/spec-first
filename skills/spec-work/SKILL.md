---
name: spec-work
description: "Execute a settled plan, validated task pack, spec path, or concrete implementation request. Use for end-to-end work or caller-owned implementation and local verification without the shipping tail. Use spec-debug for open-ended bugs and spec-resolve-pr-feedback for existing PR feedback. Stop when target repo, scope, source owner, or required authorization is unresolved."
argument-hint: "[Plan doc path or description of work. Blank to auto use latest plan doc]"
---

# Work Execution Command

## Project Intelligence Evidence Boundary

Graph candidates are `provider_untrusted` navigation that may orient implementation or affected-surface inspection, but they are never implementation basis or completion evidence by themselves. Re-ground changes and completion claims in the settled plan, current source, tests, logs, contracts, and owner evidence; direct reads are valid and empty results have no negative authority. Provider failure falls back without blocking ordinary work.

Execute work efficiently while maintaining quality and finishing features.

## Introduction

This command takes a work document (plan or specification) or a bare prompt describing the work, and executes it systematically. The focus is on **shipping complete features** by understanding requirements quickly, following existing patterns, and maintaining quality throughout.

## Workflow Contract Summary

- **Inputs:** settled implementation-ready code plan, validated task pack, explicit knowledge-work plan, or concrete bounded implementation prompt.
- **Outputs:** scoped source changes, task/unit evidence, required review/residual posture, structured verification closeout, and an authorization-aware handoff. A task pack remains derived; its source plan owns scope/lifecycle.
- **Hard exits:** unresolved target repo/dirty overlap/source owner, requirements-only or invalid unified metadata, task-pack/source-plan drift, scope-changing acceptance/architecture/provider/source-runtime discovery, failed required review/verification, or missing mutation/commit/landing authority for the requested exit.
- **Ownership:** scripts prepare deterministic facts; LLMs judge semantic fit. Canonical source is modified; generated runtime mirrors are never source fixes. Local mutation, commit, landing, lifecycle, and durable evidence are separate exits.
- **Consumers:** `spec-code-review`, caller-owned LFG/goal flows, commit/PR/release workflows, `spec-compound`, and human reviewers.

**Code closeout boundary:** Skipping simplify or independent review does not waive evidence closeout. After local changes and verification, follow `references/shipping-workflow.md`: record `verification-run-summary`, run `honest-closeout`, then let the owning workflow decide whether `plan-status complete` is eligible. Mechanical or one-line changes do not waive that order. Historical completion closes only the valid successor, never rewrites the historical plan. Read-only review, already-complete no-change checks, and `execution: knowledge-work` retain their own scope.

## Phase Reads

Read each required owner in full when entering its phase; a read made before that phase does not satisfy it. A terminal owner must be read again at its step even when already in context. Resolve references from this skill's root. If a required owner is unreadable, preserve artifacts and changed state, return blocked with the missing owner and recovery path, and do not infer completion from existing files.

## Reference Trigger Map

| Reference | Trigger | If unread/unavailable |
| --- | --- | --- |
| [Input triage](references/input-triage.md) | Phase 0, before classification. | Block execution and preserve state. |
| [Workspace setup](references/workspace-setup.md) | Phase 1, before task derivation. | Block dependent actions and preserve state. |
| [Return to caller](references/return-to-caller.md) | Immediately before caller return. | Minimum blocked recovery only. |
| [Work intake](references/work-intake.md) | Before bare-prompt discovery or bounded plan reading. | No implementation task derivation until scope is clear. |
| [Implementation loop](references/implementation-loop.md) | Before any implementation write, including trivial work. | Keep execution and completion open. |
| [Work intake and task pack](references/work-intake-and-task-pack.md) | Shallow metadata says `type: task-pack`. | Do not execute the pack; return validation/regeneration handoff. |
| [Non-code execution](references/non-code-execution.md) | Metadata says `execution: knowledge-work`. | Do not enter code/shipping lifecycle; report the missing production route. |
| [Execution strategy](references/execution-strategy.md) | Before first write/test/review-fix, task tracking, worker dispatch, commit, or landing. | Block dependent execution actions; preserve state and return the missing owner. |
| [Execution engines](references/execution-engines.md) | A structured plan/task pack or explicit request makes goal/dynamic/worker engine selection relevant. | Use inline; do not infer a callable non-default engine. |
| [Feedback and tests](references/feedback-and-tests.md) | Before behavior mutation, test design, or verification coverage claim. | Run the narrowest known check and do not claim system-wide coverage. |
| [Implementation quality](references/implementation-quality.md) | Before durable-surface mutation or phase-boundary simplification. | Do not add a new durable surface; return to the plan owner if current source fit is unresolved. |
| [Shipping workflow](references/shipping-workflow.md) | All implementation tasks are accounted for and quality/closeout begins. | No completion/lifecycle/commit/landing claim. |
| [Review findings followup](references/review-findings-followup.md) | A completed review returned actionable caller-owned findings. | Preserve in-band findings/limitations; do not rerun or silently drop them. |
| [Tracker defer](references/tracker-defer.md) | Residual gate explicitly selects external tracker deferral. | Return structured `no_sink`; do not lose residuals or infer external authority. |

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

Read `references/input-triage.md` in full now before classifying the invocation. It owns mode parsing, metadata-first task-pack/unified/legacy classification, historical continuation, and blank/bare-prompt routing. Invalid metadata, non-active source plans, and requirements-only artifacts cannot enter implementation. If this required owner is unavailable, preserve state and return blocked.

### Phase 1: Quick Start

Read `references/workspace-setup.md` in full now for bounded plan reading, execution boundaries, task derivation, and engine selection. It invokes the work-intake and execution-strategy owners at their acting steps.

Resolve an explicit `target_repo`, protect pre-existing dirty overlap, and modify canonical source rather than generated runtime. A scope-changing discovery returns to the plan owner. Local implementation does not imply `commit_authorization`; commit does not imply `landing_authorization`. Missing worker authorization uses inline/serial with `dispatch_authorization_missing`, `capability_probe: not_applicable`, and unknown capability, without worker discovery. Unknown isolation follows shared-directory rules.

After bounded plan intake and task derivation, resolve any applicable non-default engine before selecting a unit, writing, dispatching, or committing. Inline remains the portable default. Task-pack checkpoints, source authority, and tail ownership remain unchanged.

Before the first behavior-bearing mutation, read `references/feedback-and-tests.md`; before durable-surface mutation, read `references/implementation-quality.md`. Record `worker_capability_unproven` when capability discovery is unavailable or ambiguous. Requirements-only artifacts route back to `spec-plan <plan-path>` for enrichment.

## Anti-Rationalization Red Flags

| Rationalization | Response |
| --- | --- |
| "Tests probably pass; call it complete." | Run verification appropriate to the slice, read exit/log evidence, and report passed or a concrete not-run reason. |
| "The plan says new wrapper; just build it." | Read current source and recheck `reuse / extend / compose / new`; do not add a wrapper without a translation, sequencing, safety, or evidence responsibility. |
| "Clean up nearby code while here." | Recheck active scope and changed paths; unnecessary debt belongs in the existing residual/defer sink. |
| "Temporary or orphaned files do not matter." | Clean up this run\'s orphaned source, tests, references, logs, and runtime artifacts, then rerun the affected feedback loop. |

These are attention reminders, not additional gates or substitutes for judgment.

### Phase 2: Execute

Before the first implementation write, including a trivial route without tasks, read `references/implementation-loop.md`. It owns task execution, targeted verification, pattern reuse, simplification, UI checks, progress, and commit checkpoints. Follow `references/feedback-and-tests.md` before behavior changes and `references/implementation-quality.md` before durable-surface changes.

One commit boundary remains unconditional: only the orchestrator may stage and commit an authorized, verified logical unit. Preserve pre-existing staged and unstaged work; never commit another task's index entries or whole-file changes merely because paths overlap.

### Phase 3-4: Quality Check and Finishing Work

Standalone only; Return-to-Caller skips this phase. When all Phase 2 tasks are complete and execution transitions to quality check, you must read `references/shipping-workflow.md` for the full shipping workflow. Do not skip this.

**Code review: one portable path.** Review with `spec-code-review`, which self-sizes (lite roster for small low-risk code-only diffs, full roster otherwise). No harness-native review detection and no escalation tiers — the size/sensitive-surface judgment lives inside `spec-code-review`. Skip dedicated review only for a purely mechanical diff (formatting, dep-bumps, lint-only, generated). Full rules (autonomous Residual Gate, infra fallback) in `shipping-workflow.md`.

**Review is two steps — review, then fix.** spec-work's `mode:agent` invocation is report-only: it returns JSON findings and does not edit the checkout, commit, or apply fixes. This statement is scoped to the orchestrated invocation below; other explicit `spec-code-review` entry modes retain their own contract.

1. **Review** — Invoke the `spec-code-review` skill (invocation command in `references/review-findings-followup.md` § Fallback). Use `mode:agent` in orchestrated workflows; pass `plan:<path>` when you have a plan, `base:<ref>` when the merge base is known, and `depth:full` when a deep/thorough review was explicitly requested.
2. **Apply fixes** — Load `references/review-findings-followup.md`. Filter eligibility on JSON only and batch by file. Use authorized fix workers or inline fallback; the orchestrator integrates and tests. Commit only with `commit_authorization: authorized`.
3. **Residual Work Gate** — Only after followup; unresolved actionable findings go through the gate in `shipping-workflow.md` (autonomous sessions continue in-scope repairs and record blocked residuals — headless mode never auto-accepts risk; interactive sessions ask only decisions not covered by existing authorization).

## Return-to-Caller Mode

Return-to-Caller Mode performs implementation and local verification only. It must not enter Phase 3-4 or run final simplify, full review, PR creation, CI watching, or plan lifecycle completion; the caller owns those gates. Local structured verification closeout still applies.

Immediately before emitting any result, read `references/return-to-caller.md` again. It alone owns the complete envelope, evidence gate, idempotent re-verification, and `standalone_shipping_skipped: true`. Do not reconstruct a complete return from this entrypoint.

If that read fails, preserve every changed file, commit, and workspace. Return only this minimum blocked recovery envelope: `status: blocked`, `plan_path`, `changed_state`, `blockers` naming the missing owner, and `recovery_path`. Unknown facts stay unknown. Never erase state, report success, or fall into the standalone tail.

## Compact Principles And Pitfalls

- Execute settled scope from current source; ask once only when repo/docs cannot resolve a material ambiguity.
- Reuse the correct owner and keep slices observable. Do not trade evidence, safety, accessibility, observability, or required verification for speed or lower LOC.
- Track actual task/unit evidence and blockers; commits and plan status are not progress proof.
- Finish every in-scope unit and required review/verification before a completion claim. Keep failed/not-run/degraded limitations explicit.
- Do not widen work into adjacent cleanup, imagined future abstractions, human-time “session phases,” or a new private decomposition. Return scope-changing discoveries to the plan/task owner.
- Review every non-mechanical diff through the portable review path or record the honest unavailable/manual fallback. Commit and landing remain separately authorized.
