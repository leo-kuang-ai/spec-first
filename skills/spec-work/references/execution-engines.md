# Execution Engines

`spec-work` can implement an implementation-ready unified plan or validated task pack with one of three engines. The engine is chosen once, after Phase 0 classifies the plan as `artifact_readiness: implementation-ready` plus `execution: code`, or after task-pack deterministic validation, source-plan replay, and semantic-fit all pass. The engine decides *how* implementation runs; it never changes *who* owns the shipping tail (see "Tail ownership" below).

Engine selection applies only to code execution. Knowledge-work and legacy plans keep the inline/subagent flow in `SKILL.md`. A task pack keeps its pinned receipt, Task Cards and execution_waves, `stop_if`, drift checks, and required review obligations regardless of engine.

## Owned

- Probe callable engine capability and explicit non-default engine authorization.
- Choose inline/worker, goal-mode, or dynamic-workflow from plan shape and preserved checkpoints.
- Preserve tail ownership and structured return requirements across engines.

## Not Owned

- Grant worker dispatch, isolation, commit, landing, task-pack validation, scope expansion, or shipping authority.
- Promise host-specific merge/upload behavior from a host name.
- Re-decompose a validated task pack or bypass its drift/review checkpoints.

## Trigger

Load after code intake is executable and before selecting a non-trivial implementation engine. Inline remains the default; read this reference when a unified plan/task pack or explicit user request makes goal/dynamic/worker execution relevant.

## Fallback

If no authorized callable non-default engine is confirmed, continue inline (or with separately authorized workers) and record the missing capability/authorization reason. Do not emit a copy-paste engine prompt that strands the current caller.

## Step 1: Probe Runtime Capability And Authorization

An engine is usable only when the current runtime exposes a callable primitive and the current user/upstream handoff explicitly selected or authorized that non-default engine. Use runtime capability facts; documentation, a command name, or a host label is not a probe. Host examples are advisory and never promise current availability, isolation, merge behavior, or tail ownership.

| Engine | Usable when | Conservative fallback |
|---|---|---|
| **Inline / worker** | Inline is always available. Worker dispatch additionally requires explicit `worker_dispatch_authorization` plus a callable primitive. | Inline, with the missing authorization/capability reason recorded. |
| **Goal-mode** | The runtime exposes a callable goal primitive and the user/upstream selected goal-mode. | Continue the current `spec-work` run inline; do not create a persistent goal implicitly. |
| **Dynamic-workflow** | The runtime exposes a callable orchestration primitive with structured checkpoints/returns and the user/upstream selected it. | Inline/authorized workers; do not emit or invoke a workflow merely because a prompt syntax exists. |

Rule of thumb: probe the active primitive and visible authorization; do not infer either from the command's existence. Engine selection does not grant worker dispatch authorization, commit authorization, or landing authorization.

Examples such as a goal tool, a worker tool, or an ultracode-style workflow may exist on some hosts. Treat those examples as advisory until the current runtime exposes the callable schema and its behavior. Never hard-code a host guarantee into the workflow contract.

## Step 2: Pick the engine by plan shape

When more than one engine is callable, choose by the plan's decomposition shape:

| Plan shape | Engine | Why |
|---|---|---|
| Sequential or modest U-ID decomposition; units share files or depend on each other | **Inline / subagent** (default), or a **goal-mode** prompt for sustained focus when callable | The DoD already defines the end condition; ordinary persistence finishes it. |
| Validated task pack with Task Cards, execution_waves, per-task drift facts, or required review gates | **Inline / subagent** (portable default) | The orchestrator must regain control at each task boundary to recheck pins, capture delta facts, and close required review before dependents. Use another callable engine only if it preserves those checkpoints and structured returns. |
| Many independent U-IDs with disjoint file ownership; codebase-wide sweep; large migration; adversarial cross-checking | **Dynamic-workflow** when callable; otherwise parallel subagents | Workflow scripts hold branching, loops, and intermediate worker state outside the main context and coordinate many agents. Prefer this over goal-mode for large fan-out. |
| Runtime exposes no callable or authorized goal/workflow primitive | **Inline / authorized workers** | Preserve the same heading-scan / DoD / U-ID discipline without relying on unavailable host features. |

Recommend exactly one path. Present a non-default engine as an "advanced / large-scale option" only when the plan shape plausibly warrants it — never as an equal coin-flip.

## Step 3: Run the chosen engine

### Inline / subagent (default)

Follow `execution-strategy.md` and the Phase 2 execution loop. `spec-work` owns task creation, unit sequencing, actual-tree integration, and verification. Workers never commit; the orchestrator may commit only with explicit authorization.

For task-pack input, task creation and sequencing come from the validated `Task Pack Contract`, not a fresh engine-local decomposition. Return control to the orchestrator after every Task Card so intake pins, `stop_if`, focused verification, delta facts, and required review can close before the next dependency/wave.

### Goal-mode and dynamic-workflow

**With an explicitly selected, callable goal tool:** invoke it only when no active goal already owns the work. A goal activates the current session rather than creating a worker; it does not grant worker dispatch authorization and does not own commit/landing by implication. Never start goal-mode from Return-to-Caller mode.

**No callable/authorized goal or dynamic-workflow primitive:** do not attempt to invoke it. Instead:

- **Standalone interactive use:** recommend the non-default engine only when it materially fits the plan, then continue inline unless the user explicitly selects it. Do not turn recommendation into activation.
- **Return-to-caller use (e.g. under `lfg`):** do **not** emit a copyable prompt — a manual paste step strands the caller. Run inline/subagents instead, or return a blocker if the plan genuinely requires an unavailable engine.

Whichever path, the goal/workflow must not commit, push, open a PR, finalize the session, or bypass the owning workflow's gates without the corresponding explicit authorization.

Copyable goal-mode prompt (standalone — emit verbatim, substituting only the literal plan path). **It must be plan-agnostic: it should read identically for any plan except the substituted path.** Deletion test before emitting — if your draft names a specific command, file path, U-ID dependency relationship, stop condition, or Definition-of-Done item, it copied from the plan; cut it (the goal reads those from the plan). For PR/shipping, don't hardcode an open-a-PR or do-not-open-a-PR directive; instead carry the precedence line below — the goal follows the plan's PR/landing strategy if it has one, with the repo's conventions and the user's preferences overriding it (both of which the executing agent already has).

```text
/goal Implement <plan-path> to its Definition of Done.

The plan is the authority — don't read it whole. Scan headings, read the Goal Capsule, then work the units in dependency order, reading each unit plus its cited R/F/AE/KTD as you go. Run the plan's Verification Contract gates and satisfy each unit's test scenarios. Track progress outside the plan file, not in it.

This top-level goal owns the implementation and quality-check tail: run simplification and code review when the diff meets the repo's normal criteria, apply eligible fixes only when locally authorized, and surface residual findings. Commit or landing actions require separate explicit authorization; a plan preference alone does not grant it. Surface a genuine blocker — something that changes scope or contradicts the plan — instead of guessing; use your judgment on details the plan leaves open.

Done when the transcript shows: every non-deferrable Per-Unit DoD row has an observed verification result; the Verification Contract's required checks passed or are documented as not applicable; applicable simplification/review gates ran or were explicitly skipped with reason; dead-end or experimental code from approaches that did not pan out has been removed from the diff; no progress was written into the plan body; and the shipping-tail owner handled the Markdown source plan lifecycle transition when applicable. A completion claim must state whether verified changes remain uncommitted and whether landing was unauthorized. Before declaring done, re-open the plan and re-check the active units, Verification Contract, and Definition of Done against the diff.
```

Copyable dynamic-workflow prompt (large fan-out — emit verbatim):

```text
ultracode: Execute <plan-path> as an end-to-end dynamic workflow.

Use the plan as authority. Build the workflow around the Implementation Units and Definition of Done. Parallelize only independent U-IDs with disjoint file ownership, keep intermediate agent results inside the workflow, run simplification/review/verification gates inside the workflow tail, and return a final summary with changed files, U-IDs completed, verification results, residual findings, and blockers.
```

Keep emitted prompts under 4,000 characters and always substitute the literal plan path.

## Step 4: Resume the correct tail

After any engine finishes implementation, inspect the diff and continue at the tail that matches the caller. The engine never owns more than implementation + local verification on its own.

| Mode | After implementation, `spec-work` ... |
|---|---|
| **Standalone** (user invoked `spec-work` directly, or `spec-plan` handed off interactively) | Resumes Phase 3-4 quality gates, simplification, review, lifecycle, and the authorization-aware handoff in `references/shipping-workflow.md`. Commit and landing occur only when separately authorized. |
| **Return-to-caller** (`mode:return-to-caller`, e.g. under `lfg`) | Performs implementation and local verification only, then returns the structured summary in `SKILL.md` § Return-to-Caller Mode (`standalone_shipping_skipped: true`). Does not run simplify/review/PR/CI — the caller owns those. |

The same closeout ownership applies to every engine. A standalone goal that owns the full tail handles the Markdown source plan `active → completed` transition through `plan-status complete` before terminal goal completion. Return-to-Caller never writes status; it returns a completion candidate and LFG/caller performs the transition after its own gates.

Using goal-mode or a dynamic workflow is a way to get better sustained implementation focus, not a way to skip the owning workflow's finish discipline.

## Progress visibility (independent of tail ownership)

Tail ownership decides who may perform the final quality/lifecycle handoff; it does not manufacture commit or PR authorization. For long runs, task tracking and an optional scratch progress artifact outside the plan body preserve visibility. Create commits only with `commit_authorization`; push or open/update a PR only with `landing_authorization`. Return-to-Caller never commits or lands. Never write progress into the plan body.
