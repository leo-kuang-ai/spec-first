---
name: autoresearch
description: "Autonomous iteration loop: modify, verify, keep/discard against any metric"
argument-hint: "[Goal: <text>] [Scope: <glob>] [Metric: <text>] [Verify: <cmd>] [Guard: <cmd>] [Iterations: N] [--evals]"
---

EXECUTE IMMEDIATELY — do not deliberate before reading this protocol.

## Parse Arguments

Extract from $ARGUMENTS:
- `Goal:` — what to improve
- `Scope:` or `--scope` — file globs
- `Metric:` — what to measure
- `Direction:` — higher_is_better (default) or lower_is_better
- `Verify:` — shell command that outputs a number
- `Guard:` — optional safety command (must always pass)
- `Iterations:` or `--iterations` — integer N for bounded mode (default: 25). "unlimited" for unbounded.
- `--evals` — enable mid-loop checkpoints
- `--evals-interval N` — checkpoint frequency override
- `--chain <targets>` — comma-separated downstream commands

## Setup (if required context missing)

If Goal, Scope, Metric, or Verify missing → use request_user_input (single batched call):
  Q1 (Goal): "What do you want to improve?"
  Q2 (Scope): "Which files?" — suggest globs from project
  Q3 (Metric+Verify): "How to measure? Provide a shell command that outputs a number"
  Q4 (Guard): "Safety command that must always pass?" — options: test cmd, build cmd, skip
If ALL provided inline → skip setup, proceed directly.

## Precondition Checks

1. Verify git repo exists (`git rev-parse --git-dir`)
2. Capture HEAD, index and tracked/untracked state. Preserve unrelated WIP; use an authorized isolated experiment when run ownership cannot be separated safely.
3. Check for stale lock files, detached HEAD
4. If Guard set → run Guard to establish guard baseline
5. Fail fast on any critical issue. Warn on non-critical.

## Candidate and Git Ownership

Record the pre-candidate source identity and recoverable run-owned delta before mutation. Verification commands, metric implementations, fixtures and holdout data are immutable measurement inputs, not optimization targets. A passing command screen grants no execution or Git authority.

Keep candidates uncommitted by default. Only the owning workflow may use `spec-commit` after verification and with explicit commit authorization; protect mixed-file hunks and existing index entries under that helper's contract. Record the exact candidate SHA when committed, otherwise the base identity and run-owned diff/hash. On discard, restore only that recorded delta after checking it still matches. Never revert whichever commit happens to be HEAD. If later work overlaps, preserve it and report a recovery conflict. Reverting a committed candidate requires separate authorization for the exact Git mutation.

## Verify Safety Screen

Before first dry-run, screen Verify command for: rm -rf, fork bombs, curl|sh, embedded credentials, outbound writes. Block dangerous commands.

## Establish Baseline (Iteration 0)

For a working-system optimization that needs calibrated noise, multi-objective comparison or held-out confirmation, use the existing `spec-optimize` owner. This explicitly selected lightweight loop does not establish a second general development route or claim those guarantees.

Before mutation, check that the fixed measurement rejects a cheap relevant shortcut (such as empty/constant output or omitted required work) using available authorized inputs. A passing optional Guard does not establish task correctness. If the metric rewards a shortcut, repair measurement before beginning a separately identified run; do not optimize against the broken score.

1. Run Verify command → extract numeric metric
2. Record as iteration 0 in TSV: `0\t{timestamp}\t{commit}\t{metric}\t0.0\t{guard}\t-\tbaseline\tinitial state`
3. Exclusively create a unique output directory under `autoresearch/` using timestamp plus a random suffix; never reuse or truncate a same-minute run. Check for existing recoverable state before creating a new run.
4. Write TSV header: `# metric_direction: {direction}\niteration\ttimestamp\tcommit\tmetric\tdelta\tguard\tguard-metric\tstatus\tdescription`

## Iteration Loop

For each iteration (1 to max_iterations, or unbounded):

### Phase 1: Review (read git history as memory)
- Read last 10-20 lines of results TSV
- Run `git log --oneline -20` — see what worked/failed
- If last iteration was "keep", inspect its recorded base/candidate delta, which may remain uncommitted.
- Identify: what worked, what failed, what's untried

### Phase 2: Modify
- Based on review, make ONE focused change to improve the metric
- Change must be atomic — one logical unit of work

### Phase 3: Capture Candidate
- Record the candidate's source identity and recoverable delta under Candidate and Git Ownership.
- Do not stage or commit before verification.

### Phase 4: Verify
- Run Verify command → extract new metric value
- Calculate delta from previous iteration
- Metric improved (correct direction) → candidate for keep

### Phase 5: Guard (if configured)
- Run Guard command. If it fails, discard only the recorded candidate under Candidate and Git Ownership, regardless of metric improvement.

### Phase 6: Decide
- Check actual task behavior and the candidate diff before keep. An improved score from doing less required work or violating constraints is a discard even when Guard passes. Record the harness blind spot; do not patch the frozen metric within this run.
- **keep** — metric improved and guard passed; retain the candidate. An authorized commit is a separate owner-controlled checkpoint.
- **discard** — metric worsened; restore only the recorded run-owned delta.
- **crash** — verify/guard command failed; preserve logs, then apply the same scoped recovery.
- **no-op** — no change made this iteration
- **hook-blocked** — git hook blocked the commit
- **metric-error** — verify output is not a finite number; preserve the raw output and apply the same scoped recovery.

### Phase 7: Log
Append row to TSV: iteration, timestamp, commit/-, metric, delta, guard status, guard-metric, status, description

Persist and read back the raw command result, exact predicate, baseline/candidate byte identity and unique iteration ID alongside the row before selecting the next change. Resume reconciles existing identities and outputs before retrying unknown work; do not duplicate a measurement or invent a result from the summary. A failed write leaves the run incomplete.

### Eval Checkpoint
If --evals: check if current_iteration % interval == 0 → run checkpoint analysis.

### Bounded Check
If bounded: current_iteration >= max_iterations → exit loop, print summary.

## Summary (after loop ends)

Recheck original baseline against final candidate using the same frozen protocol before reporting confirmed improvement. Print total iterations, kept/discarded counts, starting and final metrics with units, and supported contributions. Do not add iteration percentages or convert ordinal score points into percentages; a zero baseline has no defined relative gain. Unknown noise, missing confirmation and absent holdout remain explicit limits. Keep shareable summaries free of secrets/private absolute paths; no automatic publication follows.

## Eval Checkpoint (--evals flag)

If --evals present:
- Compute interval: floor(max_iterations / 3), min 1. Fixed 10 if unbounded. Override: --evals-interval N.
- Every {interval} iterations, pause and analyze current results TSV.
- Print: `--- Eval Checkpoint (iterations {X}-{Y}) ---\nMetric: {start} → {end} ({delta}) | Kept: {n}/{total} | Trend: {up/flat/down}\n{one-line recommendation}\n---`
- If plateau 3+ checkpoints → recommend early stop.
- At loop end → full evals summary to evals-summary.md in output directory.

## Chain Handoff

After completion, write handoff.json to output directory: version "2.1.0", source "loop", timestamp, status (COMPLETE|USER_INTERRUPT|BOUNDED|ERROR), results_tsv path, findings[], config{goal, scope, metric, direction, verify}.
Invoke next target in --chain order. Propagate --evals flag.
