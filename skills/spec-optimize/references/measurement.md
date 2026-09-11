## Phase 0.3-1.7: prior learnings, identity, and measurement scaffolding

Read this after the spec is saved and follow it through the approval gate.

### 0.3 Search Prior Learnings

Read `references/agents/learnings-researcher.md`. Dispatch a generic subagent seeded with that local prompt only when the Dispatch And Backend Boundary permits it; otherwise search inline with the same bounded scope and record the matching fallback reason. Do not dispatch a standalone agent by type/name. If relevant learnings exist, incorporate them into the approach.

### 0.4 Run Identity Detection

Check if `optimize/<spec-name>` branch already exists:

```bash
git rev-parse --verify "optimize/<spec-name>" 2>/dev/null
```

**If branch exists**, check for an existing experiment log at `.spec-first/workflows/spec-optimize/<spec-name>/experiment-log.yaml`.

Present the user with a choice via the platform question tool:
- **Resume**: read ALL state from the experiment log on disk (do not rely on any in-memory context from a prior session). Recover any measured-but-unlogged experiments by scanning worktree directories for `result.yaml` markers. Follow the entry's resume rule: skip only proven work, re-enter unproven gates, and preserve the existing spec and baseline. A checkpoint or iteration number is not approval evidence.
- **Fresh start**: archive the old branch to `optimize-archive/<spec-name>/archived-<timestamp>`, clear the experiment log, start from scratch

### 0.5 Create Optimization Branch and Scratch Space

```bash
git checkout -b "optimize/<spec-name>"  # or switch to existing if resuming
```

Create scratch directory:
```bash
mkdir -p .spec-first/workflows/spec-optimize/<spec-name>/
```

---


**This phase is a HARD GATE. The user must approve baseline and parallel readiness before Phase 2.**

**Bundled scripts.** Phases 1 and 3 call helper scripts that ship in this skill's `scripts/` directory (`measure.sh`, `parallel-probe.sh`, `experiment-worktree.sh`). The Bash tool's working directory is the user's project, not the skill directory, so a bare `scripts/<name>` path will not resolve — invoke each by the skill's own absolute path. Every runnable block below already sets `SKILL_DIR` inline (shell state does not persist between Bash tool calls, so each block must carry it); replace the `<absolute path ...>` placeholder with the directory you loaded this `spec-optimize` SKILL.md from before running. The shape:

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/<name>"
```

## Phase 1: measurement scaffolding and approval

### 1.1 Clean-Tree Gate

Verify no uncommitted changes to files within `scope.mutable` or `scope.immutable`:

```bash
git status --porcelain
```

Filter the output against the scope paths. If any in-scope files have uncommitted changes:
- Report which files are dirty
- Ask the user to commit or stash before proceeding
- Do NOT continue until the working tree is clean for in-scope files

### 1.2 Build or Validate Measurement Harness

Resolve `scripts/measure.sh`, `scripts/parallel-probe.sh`, and `scripts/experiment-worktree.sh` relative to this skill's loaded directory. The measurement working directory remains the project directory named by the optimization spec.

Before the first measurement command, freeze and display this run-local execution envelope:

```yaml
measurement_execution_authorization: authorized | missing
measurement_command: <exact command string from the approved spec>
measurement_working_directory: <resolved absolute cwd>
measurement_environment_names: [<inherited or overlaid variable names; never secret values>]
measurement_expected_effects: [read-only | writes-project-files | writes-local-state | network | other]
```

An approved optimization spec, clean tree, executable harness, baseline approval, or shell permission does not set this fact. Require the current user or visible upstream handoff to authorize the displayed command, resolved cwd, environment names, and expected effects before any invocation of `measure.sh`, direct measurement command, or parallel probe that executes it. When missing, return `measurement_execution_authorization_missing` with zero measurement command executions. If any frozen field changes later, invalidate the authorization and present the new envelope before continuing. This is a workflow-level effect gate; `measure.sh` remains a bounded executor and does not infer semantic authorization from the command text.

**If user provides a measurement harness** (the `measurement.command` already exists):
1. Run it once via the measurement script:
   ```bash
   SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
   bash "$SKILL_DIR/scripts/measure.sh" "<measurement.command>" <timeout_seconds> "<measurement.working_directory or .>"
   ```
2. Validate the JSON output:
   - Contains keys for all degenerate gate metric names
   - Contains keys for all diagnostic metric names
   - Values are numeric or boolean as expected
3. If validation fails, report what is missing and ask the user to fix the harness

**If agent must build the harness:**
1. Analyze the codebase to understand the current approach and what should be measured
2. Build an evaluation script (e.g., `evaluate.py`, `evaluate.sh`, or equivalent)
3. Add the evaluation script path to `scope.immutable` -- the experiment agent must not modify it
4. Run it once and validate the output
5. Present the harness and its output to the user for review

### 1.3 Establish Baseline

Run the measurement harness on the current code. Resolve a working Node runtime (`node` or `nodejs`) before starting an optimization run: `scripts/decide.cjs` owns numeric eligibility and the next measurement step. No runtime means a blocked prerequisite, never a guessed comparison.

**If stability mode is `repeat` or `ladder`:**
Validate positive integer counts first. Repeat uses `repeat_count` (default 5). Ladder uses `confirmation_repeats`, falling back to `repeat_count` (default 5), and it must be at least `exploratory_pairs` (default 1). Reject incoherent counts instead of silently repairing the approved protocol. A repeat-mode spec does not need ladder fields.
1. Run the harness for the full count above
2. Aggregate results using the configured aggregation method (median, mean, min, max)
3. Calculate variance across runs
4. If variance exceeds `noise_threshold`, warn the user and suggest increasing `repeat_count`

**Spend only the measurement the current decision needs.** Baseline and final confirmation use the full protocol. A ladder candidate starts with its optional smoke check, then an exploratory sample, and only spends further samples when `scripts/decide.cjs` requests them. Stable runs use one sample; repeat runs use the full repeat count. For paired comparisons, preserve the correspondence and order of baseline/candidate samples; acquire a matching baseline observation if missing, never copy or recycle an observation to manufacture a pair.

Persist every required hard objective under `metrics` as `{aggregate, samples}` and primary judge observations under `judge`. The supplied sample arrays take precedence over aggregate fields. Verify every required hard objective is a finite number, including objectives absent from diagnostics; booleans remain permitted for gates only. Retain gates, diagnostics, raw outputs, source identity, and sample order. Copy this complete snapshot into `best` at CP-1 and after integration; do not reduce it to a primary scalar.

The optional smoke command has its own measurement execution envelope: require authorization for its exact command, cwd, environment names, and effects under the same rule as the main command before running it. A declared smoke command or ladder does not grant new execution authority. The optional `SPEC_OPTIMIZE_CENSOR_AFTER` also belongs in the frozen environment names and must be predeclared; enable it only when elapsed time proves no required objective can still win. Completed-payload futility is evaluated by the decision script.

Record the baseline in the experiment log:
```yaml
baseline:
  timestamp: "<current ISO 8601 timestamp>"
  gates:
    <gate_name>: <value>
    ...
  metrics:
    <required_hard_objective>: { aggregate: <value>, samples: [<value>, ...] }
    ...
  diagnostics:
    <diagnostic_name>: <value>
    ...
```

If primary type is `judge`, also run the judge evaluation on baseline output to establish the starting judge score. Apply the entry's independence and dispatch boundaries before scoring: if authorized, isolated judges are unavailable, record the concrete blocker and stop Phase 1 without an inline substitute or invented baseline score.

### 1.4 Parallelism Readiness Probe

Run the parallelism probe script:
```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/parallel-probe.sh" "<project_directory>" "<measurement.command>" "<measurement.working_directory>" <shared_files...>
```

Read the JSON output. Present any blockers to the user with suggested mitigations. Treat the probe as intentionally narrow: it should inspect the measurement command, the measurement working directory, and explicitly declared shared files, not the entire repository.

### 1.5 Worktree Budget Check

Count existing worktrees:
```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/experiment-worktree.sh" count
```

If count + `execution.max_concurrent` would exceed 12:
- Warn the user
- Suggest cleaning up existing worktrees or reducing `max_concurrent`
- Do NOT block -- the user may proceed at their own risk

### 1.6 Write Baseline to Disk (CP-1)

**MANDATORY CHECKPOINT.** Before presenting results to the user, write the initial experiment log with baseline metrics to disk:

1. Create the experiment log file at `.spec-first/workflows/spec-optimize/<spec-name>/experiment-log.yaml`
2. Include all required top-level sections from `references/experiment-log-schema.yaml`: `spec`, `run_id`, `started_at`, `baseline`, `experiments`, and `best`
3. Seed `experiments` as an empty array and seed `best` from the baseline snapshot (use `iteration: 0`, baseline metrics, and baseline judge scores if present) so later phases have a valid current-best state to compare against
4. Optionally seed `hypothesis_backlog: []` here as well so the log shape is stable before Phase 2 populates it
5. **Verify**: read the file back and confirm the required sections are present and the baseline values match
6. Only THEN present results to the user

### 1.7 User Approval Gate

Present to the user via the platform question tool:

- **Baseline metrics**: all gate values, diagnostic values, and judge scores (if applicable)
- **Experiment log location**: show the file path so the user knows where results are saved
- **Parallel readiness**: probe results, any blockers, mitigations applied
- **Clean-tree status**: confirmed clean
- **Worktree budget**: current count and projected usage
- **Judge budget**: estimated per-experiment judge cost and configured `max_total_cost_usd` cap (or an explicit note that spend is uncapped)

**Options:**
1. **Proceed** -- approve baseline and parallel config, move to Phase 2
2. **Adjust spec** -- available only while both the hypothesis backlog and experiments are empty. Save and verify the revised spec, invalidate the old baseline, and rerun Phase 1 so measurement and approval match the new spec. Reauthorize any changed execution envelope before running it. Once derived state exists, the spec is frozen for this run; a changed protocol requires a separate run with the old evidence preserved.
3. **Fix issues** -- user needs to resolve blockers first

Do NOT proceed to Phase 2 until the user explicitly approves.

If primary type is `judge` and `max_total_cost_usd` is null, call that out as uncapped spend and require explicit approval before proceeding.

**State re-read:** After gate approval, re-read the spec and baseline from disk. Do not carry stale in-memory values forward.

---
