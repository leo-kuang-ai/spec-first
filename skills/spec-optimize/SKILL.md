---
name: spec-optimize
description: "Run metric-driven iterative optimization loops. Define a measurable goal, build measurement scaffolding, then run parallel experiments that try many approaches, measure each against hard gates and/or LLM-as-judge quality scores, keep improvements, and converge toward the best solution. Use when optimizing clustering quality, search relevance, build performance, prompt quality, or any measurable outcome that benefits from systematic experimentation. Inspired by Karpathy's autoresearch, generalized for multi-file code changes and non-ML domains."
argument-hint: "[path to optimization spec YAML, or describe the optimization goal]"
---

# Iterative Optimization Loop

Run metric-driven iterative optimization. Define a goal, build measurement scaffolding, then run parallel experiments that converge toward the best solution.

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

Code review、benchmark maintainer、在性能/相关性变更时参与的 release reviewer，以及检查 experiment logs 的人工审查者。

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` (default).
Overrides: none

## Interaction Method

Use the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded) or `request_user_input` in Codex. Fall back to numbered options in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question.

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

`workflow invocation does not authorize dispatch`。Approved optimization spec、baseline approval、`execution.mode: parallel`、预算、权限设置或 runtime readiness 都不是派发授权。只有当前用户或可见 upstream handoff 明确请求 subagent、delegated work、persona 或 parallel work 时才可派发。缺授权时不得探测 tool schema，固定为 `capability_probe: not_applicable` + `worker_dispatch_capability: unknown`，强制采用 serial inline/local execution 并记录 `dispatch_authorization_missing`。只有授权后才把 current-session registry/schema 作为 `provider_untrusted` evidence 检查：确认缺失时记录 `subagent_capability_missing`；surface 不可用、schema 不完整或候选不唯一时记录 `worker_capability_unproven`，均同样降级。隔离、模型覆盖和有界并发只取 live facts；required isolation 未满足时保持依赖 gate 打开，model unknown 时继承，parallelism unknown 时串行。记录 `worker_dispatch_outcome`。Fallback 可以继续使用串行 worktree，但不得声称 parallel experiment 或 independent worker coverage。

Parallel experiments additionally require both dispatch facts above, explicit `execution.mode`, bounded `execution.max_concurrent`, clean mutable/immutable scope, and the worktree readiness probes below. Worktree-backed mutation happens in experiment worktrees; Codex delegation must fall back after repeated failures when the serial/local path can continue. The orchestrator owns final integration: selecting kept experiments, merging or cherry-picking winners, reverting non-winners, cleaning worktrees, updating experiment logs, and presenting post-completion actions. Workers never stage, commit, merge, push, or mutate the authoritative experiment log.

---

## Required-read phase references

Load the phase reference before entering that phase; these files are the canonical procedures for the workflow body:

- Phase 0 spec input and validation: `references/spec.md`
- Phase 0.3-1.7 measurement scaffolding and approval gate: `references/measurement.md`
- Persistence, checkpoints, and resume: `references/persistence.md`
- Phases 2-3 hypotheses and optimization loop: `references/loop.md`
- Phase 4 deferred work, summary, and cleanup: `references/wrap-up.md`

The top-level skill owns the workflow contract, admission and budget gates, runtime context exclusion, evidence boundary, and dispatch authority. Phase references own detailed execution procedures. Use judge sub-agents using the same bounded scheduler as Phase 3.2. Otherwise evaluate the same batches serially inline and record the fallback. Judge work is a separate budget from experiment worktrees in either path. For capacity errors, treat it as backpressure. Codex failure cascade after authorization or capability failure falls back to serial inline/local execution. The strategy digest is derived, reconstructable state; the experiment log remains the canonical resume and audit source. Wrap-up may run `spec-code-review` and `spec-compound`; the **Mechanical-apply bar:** apply any finding with a concrete `suggested_fix`. Do not commit or push from this step. A phase reference may strengthen a boundary but cannot grant mutation, measurement, dispatch, commit, or landing authority.

## Workflow sequence

1. Read `references/spec.md` and save or validate the optimization spec.
2. Read `references/persistence.md` before creating or resuming run state.
3. Read `references/measurement.md` and clear measurement authorization, baseline, and approval gates.
4. Read `references/loop.md` for bounded hypothesis and experiment execution.
5. Read `references/wrap-up.md` to close with evidence, deferred items, and durable local state.

Read `references/loop.md` before the optimization loop.
