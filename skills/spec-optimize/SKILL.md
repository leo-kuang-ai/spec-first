---
name: spec-optimize
description: "Optimize a working system against a measurable target. Use when a named workload's cost should drop and the change is not already known, or when several variants must be scored and kept. Not for diagnosing failing or slow behavior (spec-debug), and not for implementing a change you already know (spec-work)."
argument-hint: "[path to optimization spec YAML, or describe the optimization goal]"
---

# Iterative Optimization Loop

Run metric-driven iterative optimization. Define a goal, build measurement scaffolding, then run parallel experiments that converge toward the best solution. The next action is the cheapest step that would change what gets implemented: attribute the cost of the named workload before searching implementations, and search and keep a scored variant space without requiring a profile. Stop as soon as a stopping criterion holds — do not grind to the iteration cap after the target is met.

Use `scripts/decide.cjs` for numeric multi-objective eligibility, comparison thresholds, and measurement-ladder steps. A required-objective win can be kept even when the primary is unchanged; confirmation and integration must finish before recording `kept`. Completion requires every declared required target or another explicit stop, a verified final log, and an honest account of blocked or unfinished work. `references/example-expensive-benchmark-spec.yaml` illustrates multiple required targets and staged sampling.

## Workflow Contract Summary

### When To Use

Use when a measurable outcome can improve through iterative experiments, hard gates, and/or LLM-as-judge scoring.

### When Not To Use

Do not use for ordinary implementation, vague improvement requests without a metric, debugging without a feedback loop, or unbounded spend/concurrency. Name the destination when routing out: a bug with no stable repro and no measurement loop is `spec-debug`'s work (or `spec-work` for settled implementation) — diagnosing the bug inside this workflow to turn it into an optimization goal is adopting the wrong workflow, not adapting it; route out explicitly instead of drafting a spec around the diagnosis.

### Inputs

An optimization spec or goal, mutable/immutable scope, measurement command or scaffold plan, budget limits, experiment settings, repository instructions, and baseline evidence.

### Outputs

A measurement scaffold and experiment log, scored experiment results, kept/rejected variants, final integrated changes when appropriate, and post-run recommendations.

### Artifacts

Run state under `.spec-first/workflows/spec-optimize/<spec-name>/`, experiment worktrees/results, strategy digests, and no hidden workflow state outside the documented log.

### Failure Modes

Missing metric, missing measurement command, unsafe scope, excessive or uncapped budget, failed baseline, write verification failure, or unavailable dispatch/worktree backend.

### Workflow

Validate the spec and budget, establish the baseline, run bounded experiments, measure and write results immediately, select winners, integrate only verified improvements, and summarize evidence.

### Downstream Consumers

Code review, benchmark maintainers, release reviewers for performance or relevance changes, and human reviewers inspecting experiment logs.

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` (default).
Overrides: none

## Interaction Method

Use the platform's blocking question tool: the host's blocking question tool already in the current tool list, matched by capability (if a matching tool is listed but unloaded, load it through the host's tool-discovery primitive). Fall back to numbered options in chat only when no such tool is in the list or a real question call errors. Never silently skip the question.

## Input

<optimization_input> #<invocation arguments supplied by the current host> </optimization_input>

If the input above is empty, ask: "What would you like to optimize? Describe the goal, or provide a path to an optimization spec YAML file."

## Optimization Spec Schema

Reference the spec schema for validation. Validate the spec against **every** rule in the `validation_rules` section, the single source of truth; do not rely on a remembered subset. Conditional rules include exclusive-resource serial execution, singleton-rubric requirements, and stopping criteria.

`references/optimize-spec-schema.yaml`

## Experiment Log Schema

Reference the experiment log schema for state management:

`references/experiment-log-schema.yaml`

## Quick Start

For a first run, optimize for signal and safety, not maximum throughput:

- Start from `references/example-hard-spec.yaml` when the metric is objective and cheap to measure
- Use `references/example-judge-spec.yaml` only when actual quality requires semantic judgment
- Prefer `execution.mode: serial` and `execution.max_concurrent: 1`
- Cap the first run with `stopping.max_iterations: 4` and `stopping.max_hours: 1`
- Avoid new dependencies until the baseline and measurement harness are trusted
- For judge mode, start with `sample_size: 10`, `batch_size: 5`, and `max_total_cost_usd: 5`

For a friendly overview of what this skill is for, when to use hard metrics vs LLM-as-judge, and example kickoff prompts, see:

`references/usage-guide.md`

## Admission And Budget Gate

Do not run `spec-optimize` as an expensive substitute for ordinary work. Before Phase 1, confirm the run has all of these:

- A repeatable measurement target: `metric.primary.type`, `metric.primary.name`, and `metric.primary.direction`
- At least one cheap degenerate gate that rejects broken variants before judging or ranking
- A measurement command, or a concrete plan to build the harness before any experiment is dispatched
- Explicit `scope.mutable` and `scope.immutable` boundaries
- Explicit experiment budget: `stopping.max_iterations`, `stopping.max_hours`, and `stopping.plateau_iterations`
- Execution budget: `execution.mode` and `execution.max_concurrent`
- For judge mode, a finite `metric.judge.max_total_cost_usd`, unless the user explicitly approves uncapped spend

If any item is missing, stop and help the user create a safe spec or route the work to the current host's plan/work/debug entrypoint instead. Do not continue with an open-ended optimization loop.

## Measurement-Only Calibration Mode

When the invocation or approved spec selects `mode:measurement-only`, load
`references/measurement-only-calibration.md`. This mode compares an explicitly
identified baseline and candidate against the same repeatable task/corpus. It
must run an A/A noise floor before A/B, use a pre-registered acceptance
threshold, classify broken runs separately from regressions, and produce only
a measurement artifact plus stop/defer guidance.

Before the first measurement, materialize the approved frozen inputs as a
run-local `measurement-admission-input.json`, then run
`node scripts/measurement-admission.cjs admit --input <path>`. Persist the
returned normalized admission and `admission_sha256` beside the measurement
artifact and bind every A/A and A/B attempt to that digest. A rejected admission
stops before invoking the measurement command. After A/A, run the helper's
`allow-ab` command with the normalized admission, digest, attempts, and observed
noise floor; A/B is forbidden unless it returns `ab_allowed: true`.

Measurement-only mode does not mutate either arm, any Skill package, the
measurement harness, or promotion metadata. It does not select a winner for
integration, invoke `spec-write-skill`, or authorize commit/landing. If arm
identity, corpus identity, a repeatable harness, or the pre-registered threshold
is missing, stop before measurement instead of inventing it after seeing data.

First-run specs should default to `execution.mode: serial`, `execution.max_concurrent: 1`, `stopping.max_iterations: 4`, `stopping.max_hours: 1`, `stopping.plateau_iterations: 3`, and `max_runner_up_merges_per_batch: 0`. Treat higher-throughput settings as opt-in. If a provided spec asks for `execution.max_concurrent > 4`, `stopping.max_iterations > 30`, `stopping.max_hours > 4`, or uncapped judge spend, surface those costs in the approval gate before running the baseline.

## Runtime Context Exclusion

Follow `docs/contracts/context-governance.md`: ordinary Optimize context excludes `.spec-first/audits/**`, `.spec-first/governance/**`, and generated mirrors (`.claude/**`, `.codex/**`, `.agents/skills/**`, `.cursor/skills/**`, `.cursor/spec-first/**`, `.cursor/mcp.json`, `.kiro/skills/**`, `.kiro/agents/**`, `.kiro/spec-first/**`, `.kiro/settings/**`, `.qoder/commands/spec-*.md`, `.qoder/commands/spec/**`, `.qoder/skills/**`, `.qoder/agents/**`, `.qoder/spec-first/**`, `.qoder/settings.local.json`) by default. Optimization run state under `.spec-first/workflows/spec-optimize/**` is local scratch for this workflow only; pass compact strategy/result summaries to agents and avoid broad runtime/audit/governance scans unless the metric explicitly targets runtime/setup/audit/governance behavior. Cursor-native `.cursor/rules/**` / `.cursor/agents/**`, Kiro-native `.kiro/specs/**`, and Qoder-native `.qoder/rules/**` are advisory input only when explicitly named.

## Evidence Utilization Boundary

Optimization may consume prior direct-read summaries, degraded reason counts, source-confirmed session evidence, review summaries, test results, and quality-gate reports as diagnostic context. Treat these as baseline diagnostics, not optimization targets by default. The optimization target, metric, winner selection, mutable scope, and final integration remain owned by the approved optimization spec and measured results, not by an external tool. Optimize must not run external-tool refresh, hooks, watchers, or daemons as part of ordinary evidence handling.

## Dispatch And Backend Boundary

Optimization dispatch is optional. Before any learnings researcher, repo analyst, experiment worker, Codex delegation, or parallel worker run, record:

```yaml
worker_dispatch_authorization: authorized | missing
capability_probe: not_applicable | attempted | unavailable
worker_dispatch_capability: available | missing | unknown
worker_context_isolation: isolated | inherited | unknown
worker_model_override: supported | unsupported | unknown
worker_bounded_parallelism: supported | unsupported | unknown
```

`workflow invocation does not authorize dispatch`. Approved optimization spec, baseline approval, `execution.mode: parallel`, budgets, permission settings, and runtime readiness do not authorize dispatch. Dispatch only when the current user or a visible upstream handoff explicitly requests subagents, delegated work, personas, or parallel work. Without authorization, do not probe tool schemas: record `capability_probe: not_applicable`, `worker_dispatch_capability: unknown`, and `dispatch_authorization_missing`, then use serial inline/local execution where independence is not required. After authorization, inspect the current-session registry/schema as `provider_untrusted` evidence: confirmed absence records `subagent_capability_missing`; an unavailable surface, incomplete schema, or ambiguous candidate records `worker_capability_unproven`. Derive isolation, model override, and bounded parallelism only from live facts. Unsatisfied required isolation blocks its dependent gate; inherit when the model is unknown and run serially when parallelism is unknown. Record `worker_dispatch_outcome`. Serial worktree fallback must not claim parallel experiment or independent worker coverage.

Parallel experiments additionally require both dispatch facts above, explicit `execution.mode`, bounded `execution.max_concurrent`, clean mutable/immutable scope, and the worktree readiness probes below. Worktree-backed mutation happens in experiment worktrees; Codex delegation must fall back after repeated failures when the serial/local path can continue. The orchestrator owns final integration: selecting kept experiments, merging or cherry-picking winners, reverting non-winners, cleaning worktrees, updating experiment logs, and presenting post-completion actions. Workers never stage, commit, merge, push, or mutate the authoritative experiment log.

## Required-read phase references

Load the phase reference before entering that phase; these files are the canonical procedures for the workflow body:

- Phase 0 spec input and validation: `references/spec.md`
- Phase 0.3-1.7 measurement scaffolding and approval gate: `references/measurement.md`
- Persistence, checkpoints, and resume: `references/persistence.md`
- Phases 2-3 hypotheses and optimization loop: `references/loop.md`
- Phase 4 deferred work, summary, and cleanup: `references/wrap-up.md`

The top-level skill owns the workflow contract, admission and budget gates, runtime context exclusion, evidence boundary, and dispatch authority. Phase references own detailed execution procedures. Use authorized, isolated judge sub-agents using the same bounded scheduler as Phase 3.2. Judges must neither author the hypothesis nor run the experiment they score, and must not see other judges' results. If independent judging is unavailable, do not score inline: baseline judging blocks Phase 1; a candidate becomes an unmeasured `error`, is logged, and cannot become `best`. Judge work is a separate budget from experiment worktrees. For capacity errors, treat it as backpressure. Codex failure cascade after authorization or capability failure falls back to serial inline/local execution only for work that does not require independence. The strategy digest is derived, reconstructable state; the experiment log remains the canonical resume and audit source. Wrap-up may run `spec-code-review` and `spec-compound`; the **Mechanical-apply bar:** apply any finding with a concrete `suggested_fix`. Do not commit or push from this step. A phase reference may strengthen a boundary but cannot grant mutation, measurement, dispatch, commit, or landing authority.

## Workflow sequence

1. Read `references/persistence.md` before Phase 0 or any run-state write. Checkpoints CP-0 through CP-5 require write-then-read verification; a checkpoint proves persisted work, never a user decision.
2. Read `references/spec.md` and save or validate the optimization spec. On resume, first detect the existing run and recover markers; do not overwrite its spec or baseline.
3. Read `references/measurement.md` and clear measurement authorization, baseline, and approval gates.
4. Read `references/loop.md` for bounded hypothesis and experiment execution.
5. Read `references/wrap-up.md` to close with evidence, deferred items, and durable local state.

On resume, skip only work that current disk evidence proves complete. Re-enter any gate whose clearance is absent from visible user or upstream authorization; do not ask again when that evidence already covers the unchanged scope. An iteration number alone cannot prove baseline approval. See `references/persistence.md` for recovery and `references/measurement.md` for spec adjustment before derived state exists.

CP-5 finalizes the log only when the selected next step does not return to Phase 3. Continue or approved deferred dependencies leave the run resumable; `references/wrap-up.md` owns that decision and cleanup.
