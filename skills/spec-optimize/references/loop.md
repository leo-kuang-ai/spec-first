# Optimization loop

Run optimization as a bounded measurement loop: freeze identity and baseline, change one treatment, measure the agreed objective, and keep multi-objective wins only when the evidence supports them. Screen expensive runs before spending them and record `not-run` or `degraded` outcomes honestly.

## Retuning a prompt or skill corpus

When the mutable surface is a prompt or Skill corpus, treat the task as a
measurement problem before a wording problem. A static reading can identify
plausible cuts, but it cannot show that a cut improved the target behavior.
Require a repeatable harness, a selectable source checkout, and a registered
acceptance bar before editing the corpus. If one is missing, stop with the
missing prerequisite instead of presenting an audit as a retuning result.

Use historical runs as a baseline when available. Run an A/A noise-floor check
on identical source identities before interpreting A/B results, and keep
"followed the workflow" separate from "completed the task" in the recorded
metrics. Broken runs, timeouts, and harness errors are first-class outcomes;
they must not receive synthetic scores or inflate an apparent improvement.

Audit proposed reductions and their defenses in independent contexts when
dispatch is available. A cut with no provenance after a real search is a
candidate; a cited test, contract, or learning that protects the text removes
it from the cut list. Absence of evidence is a verification task when the
project's normal change bar requires a reproduced failure.

Apply changes in small passes with disjoint file ownership. Preserve field
names, enums, markers, and security guards that are consumed as data. Do not
edit tests merely to make a refactor green. A workflow whose product is to
stop and ask needs an unattended degradation path, not removal of its pause.

After each pass, read the failure location and classify the outcome before
choosing the next hypothesis. A failure that moves later identifies progress;
the same failure site means the hypothesis missed. Inspect phases the harness
cannot reach and report those limits, because a green run only certifies what
it exercised. Keep each pass separately attributable in the experiment log
and commit history.

## Phase 2: Hypothesis Generation

### 2.1 Analyze Current Approach

Read the code within `scope.mutable` to understand:
- The current implementation approach
- Obvious improvement opportunities
- Constraints and dependencies between components

Optionally read `references/agents/repo-research-analyst.md` for deeper codebase analysis if the scope is large or unfamiliar. Dispatch a generic subagent only when the Dispatch And Backend Boundary permits it; otherwise apply the same bounded analysis inline or serially. Do not dispatch a standalone agent by type/name. Before either path, derive a run-local stack/architecture/conventions orientation from the current target repo/worktree and record its source identity and dirty state. Pass that orientation with direct source refs to `repo-research-analyst`, requesting only question-specific scopes such as `patterns`. Never reuse it across runs, branches, or worktrees. On resume, compare the checkpoint's source identity with the current tree; if it changed, re-baseline affected measurements or stop with an explicit source-drift limitation instead of carrying old grounding forward. If the current sources cannot be read, record the concrete degraded fact and narrow optimization claims.

### 2.2 Generate Hypothesis List

Generate an initial set of hypotheses. Each hypothesis should have:
- **Description**: what to try
- **Category**: one of the standard categories (signal-extraction, structural-signals, embedding, algorithm, preprocessing, parameter-tuning, architecture, data-handling) or a domain-specific category
- **Priority**: high, medium, or low based on expected impact and feasibility
- **Required dependencies**: any new packages or tools needed

Include user-provided hypotheses if any were given as input.

Aim for 10-30 hypotheses in the initial backlog. More can be generated during the loop based on learnings.

### 2.3 Dependency Pre-Approval

Collect all unique new dependencies across all hypotheses.

If any hypotheses require new dependencies:
1. Present the full dependency list to the user via the platform question tool
2. Ask for bulk approval
3. Mark each hypothesis's `dep_status` as `approved` or `needs_approval`

Hypotheses with unapproved dependencies remain in the backlog but are skipped during batch selection. They are re-presented at wrap-up for potential approval.

### 2.4 Record Hypothesis Backlog (CP-2)

**MANDATORY CHECKPOINT.** Write the initial backlog to the experiment log file and verify:
```yaml
hypothesis_backlog:
  - description: "Remove template boilerplate before embedding"
    category: "signal-extraction"
    priority: high
    dep_status: approved
    required_deps: []
  - description: "Try HDBSCAN clustering algorithm"
    category: "algorithm"
    priority: medium
    dep_status: needs_approval
    required_deps: ["scikit-learn"]
```

---

## Phase 3: Optimization Loop

This phase repeats in batches until a stopping criterion is met.

### 3.1 Batch Selection

Select hypotheses for this batch:
- Build a runnable backlog by excluding hypotheses with `dep_status: needs_approval`
- If `execution.mode` is `serial`, force `batch_size = 1`
- Otherwise, `batch_size = min(runnable_backlog_size, execution.max_concurrent)`
- Prefer diversity: select from different categories when possible
- Within a category, select by priority (high first)

If the backlog is empty and no new hypotheses can be generated, proceed to Phase 4 (wrap-up).
If the backlog is non-empty but no runnable hypotheses remain because everything needs approval or is otherwise blocked, proceed to Phase 4 so the user can approve dependencies instead of spinning forever.

### 3.2 Execute Experiments

For each hypothesis in the batch, use the effective run mode. If either dispatch fact is missing, override the worker mode to serial inline/local execution for this run, retain the spec's requested mode as an unmet capability note, and run exactly one experiment to completion before selecting the next hypothesis. Only when the package-local boundary permits dispatch may `execution.mode: parallel` dispatch a batch concurrently.

**Bounded dispatch.** For authorized dispatch only, do not assume the host will accept all concurrent subagents at once; the active-subagent cap varies by host and profile and is independent of `execution.max_concurrent` (which caps worktrees, a separate budget). Queue the selected experiments, dispatch only as many as the host accepts, and when a capacity or active-agent-limit error appears, treat it as backpressure — retry the queued experiment after a slot frees rather than marking it failed. Mark an experiment failed only when dispatch fails for a non-capacity reason or a successfully dispatched experiment errors/times out.

The Phase 3 blocks below each set `SKILL_DIR` inline as well (the loaded `spec-optimize` skill directory; see the Bundled scripts note in Phase 1) — shell state does not persist from Phase 1, so each block carries its own assignment.

**Worktree backend:**
1. Create experiment worktree:
   ```bash
   SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
   WORKTREE_PATH=$(bash "$SKILL_DIR/scripts/experiment-worktree.sh" create "<spec_name>" <exp_index> "optimize/<spec_name>" <shared_files...>)  # creates .worktrees/optimize-<spec_name>-exp-<NNN>/
   ```
2. Apply port parameterization if configured (set env vars for the measurement script)
3. Fill the experiment prompt template (`references/experiment-prompt-template.md`) with:
   - Iteration number, spec name
   - Hypothesis description and category
   - Current best and baseline metrics
   - Mutable and immutable scope
   - Constraints and approved dependencies
   - Rolling window of last 10 experiments (concise summaries)
4. With authorized dispatch, dispatch a subagent with the filled prompt in the experiment worktree; otherwise execute the filled prompt inline in that worktree before moving to the next hypothesis

**Codex backend:**
1. Check environment guard -- do NOT delegate if already inside a Codex sandbox:
   ```bash
   # If these exist, we're already in Codex -- fall back to subagent
   test -n "${CODEX_SANDBOX:-}" || test -n "${CODEX_SESSION_ID:-}" || test ! -w .git
   ```
2. Fill the experiment prompt template
3. Write the filled prompt to a temp file
4. Dispatch via Codex only when the package-local dispatch boundary is satisfied; otherwise use the serial local/worktree path:
   ```bash
   cat /tmp/optimize-exp-XXXXX.txt | codex exec --skip-git-repo-check - 2>&1
   ```
5. Security posture: use the user's selection (ask once per session if not set in spec)

### 3.3 Collect and Persist Results

Process experiments as they complete — do NOT wait for the entire batch to finish before writing results.

For each completed experiment, **immediately**:

1. **Run measurement** in the experiment's worktree:
   ```bash
   SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
   bash "$SKILL_DIR/scripts/measure.sh" "<measurement.command>" <timeout_seconds> "<worktree_path>/<measurement.working_directory or .>" <env_vars...>
   ```
   - If stability mode is `repeat`, run the measurement harness `repeat_count` times in that working directory and aggregate the results exactly as in Phase 1 before evaluating gates or ranking the experiment.
   - Use the aggregated metrics as the experiment's score; if variance exceeds `noise_threshold`, record that in learnings so the operator knows the result is noisy.

2. **Write crash-recovery marker** — immediately after measurement, write `result.yaml` in the experiment worktree containing the raw metrics. This ensures the measurement is recoverable even if the agent crashes before updating the main log.

3. **Read raw JSON output** from the measurement script

4. **Evaluate degenerate gates**:
   - For each gate in `metric.degenerate_gates`, parse the operator and threshold
   - Compare the metric value against the threshold
   - If ANY gate fails: mark outcome as `degenerate`, skip judge evaluation, save money

5. **If gates pass AND primary type is `judge`**:
   - Read the experiment's output (cluster assignments, search results, etc.)
   - Apply stratified sampling per `metric.judge.stratification` config (using `sample_seed`)
   - Group samples into batches of `metric.judge.batch_size`
   - Fill the judge prompt template (`references/judge-prompt-template.md`) for each batch
   - When the package-local dispatch boundary is satisfied, dispatch the `ceil(sample_size / batch_size)` judge sub-agents using the same bounded scheduler as Phase 3.2. Otherwise evaluate the same batches serially inline, record the matching fallback reason, and do not claim independent judge coverage. Judge work is a separate budget from experiment worktrees in either path.
   - Each dispatched sub-agent or inline judge batch returns structured JSON scores
   - Aggregate scores: compute the configured primary judge field from `metric.judge.scoring.primary` (which should match `metric.primary.name`) plus any `scoring.secondary` values
   - If `singleton_sample > 0`: evaluate singleton batches through the same authorized-dispatch or serial-inline path

6. **If gates pass AND primary type is `hard`**:
   - Use the metric value directly from the measurement output

7. **IMMEDIATELY append to experiment log on disk (CP-3)** — do not defer this to batch evaluation. Write the experiment entry (iteration, hypothesis, outcome, metrics, learnings) to `.spec-first/workflows/spec-optimize/<spec-name>/experiment-log.yaml` right now. Use the transitional outcome `measured` once the experiment has valid metrics but has not yet been compared to the current best. Update the outcome to `kept`, `reverted`, or another terminal state in the evaluation step, but the raw metrics are on disk and safe from context compaction.

8. **VERIFY the write (CP-3 verification)** — read the experiment log back from disk and confirm the entry just written is present. If verification fails, retry the write. Do NOT proceed to the next experiment until this entry is confirmed on disk.

**Why immediately + verify?** The agent's context window is NOT a durable store. Context compaction, session crashes, and restarts are expected during long runs. If results only exist in the agent's memory, they are lost. Karpathy's autoresearch writes to `results.tsv` after every single experiment — this skill must do the same with the experiment log. The verification step catches silent write failures that would otherwise lose data.

### 3.4 Evaluate Batch

After all experiments in the batch have been measured:

1. **Rank** experiments by primary metric improvement:
   - For hard metrics: compare to the current best using `metric.primary.direction` (`maximize` means higher is better, `minimize` means lower is better), and require the absolute improvement to exceed `measurement.stability.noise_threshold` before treating it as a real win
   - For judge metrics: compare the configured primary judge score (`metric.judge.scoring.primary` / `metric.primary.name`) to the current best, and require it to exceed `minimum_improvement`

2. **Identify the best experiment** that passes all gates and improves the primary metric

3. **If best improves on current best: KEEP**
   - Commit the experiment branch first so the winning diff exists as a real commit before any merge or cherry-pick
   - Include only mutable-scope changes in that commit; if no eligible diff remains, treat the experiment as non-improving and revert it
   - Merge the committed experiment branch into the optimization branch
   - Use the message `optimize(<spec-name>): <hypothesis description>` for the experiment commit
   - After the merge succeeds, clean up the winner's experiment worktree and branch; the integrated commit on the optimization branch is the durable artifact
   - This is now the new baseline for subsequent batches

4. **Check file-disjoint runners-up** (up to `max_runner_up_merges_per_batch`):
   - For each runner-up that also improved, check file-level disjointness with the kept experiment
   - **File-level disjointness**: two experiments are disjoint if they modified completely different files. Same file = overlapping, even if different lines.
   - If disjoint: cherry-pick the runner-up onto the new baseline, re-run full measurement
   - If combined measurement is strictly better: keep the cherry-pick (outcome: `runner_up_kept`), then clean up that runner-up's experiment worktree and branch
   - Otherwise: revert the cherry-pick, log as "promising alone but neutral/harmful in combination" (outcome: `runner_up_reverted`), then clean up the runner-up's experiment worktree and branch
   - Stop after first failed combination

5. **Handle deferred deps**: experiments that need unapproved dependencies get outcome `deferred_needs_approval`

6. **Revert all others**: cleanup worktrees, log as `reverted`

### 3.5 Update State (CP-4)

**MANDATORY CHECKPOINT.** By this point, individual experiment results are already on disk (written in step 3.3). This step updates aggregate state and verifies.

1. **Re-read the experiment log from disk** — do not trust in-memory state. The log is the source of truth.

2. **Finalize outcomes** — update experiment entries from step 3.4 evaluation (mark `kept`, `reverted`, `runner_up_kept`, etc.). Write these outcome updates to disk immediately.

3. **Update the `best` section** in the experiment log if a new best was found. Write to disk.

4. **Write strategy digest** to `.spec-first/workflows/spec-optimize/<spec-name>/strategy-digest.md`:
   - Categories tried so far (with success/failure counts)
   - Key learnings from this batch and overall
   - Exploration frontier: what categories and approaches remain untried
   - Current best metrics and improvement from baseline

5. **Generate new hypotheses** based on learnings:
   - Re-read the strategy digest from disk (not from memory)
   - Read the rolling window (last 10 experiments from the log on disk)
   - Do NOT read the full experiment log -- use the digest for broad context
   - Add new hypotheses to the backlog and write the updated backlog to disk

6. **Write updated hypothesis backlog to disk** — the backlog section of the experiment log must reflect newly added hypotheses and removed (tested) ones.

**CP-4 Verification:** Read the experiment log back from disk. Confirm: (a) all experiment outcomes from this batch are finalized, (b) the `best` section reflects the current best, (c) the hypothesis backlog is updated. Read `strategy-digest.md` back and confirm it exists. Only THEN proceed to the next batch or stopping criteria check.

**Checkpoint: at this point, all state for this batch is on disk. If the agent crashes and restarts, it can resume from the experiment log without loss.**

### 3.6 Check Stopping Criteria

Stop the loop if ANY of these are true:
- **Target reached**: `stopping.target_reached` is true, `metric.primary.target` is set, and the primary metric reaches that target according to `metric.primary.direction` (`>=` for `maximize`, `<=` for `minimize`)
- **Max iterations**: total experiments run >= `stopping.max_iterations`
- **Max hours**: wall-clock time since Phase 3 start >= `stopping.max_hours`
- **Judge budget exhausted**: cumulative judge spend >= `metric.judge.max_total_cost_usd` (if set)
- **Plateau**: no improvement for `stopping.plateau_iterations` consecutive experiments
- **Manual stop**: user interrupts (save state and proceed to Phase 4)
- **Empty backlog**: no hypotheses remain and no new ones can be generated

If no stopping criterion is met, proceed to the next batch (step 3.1).

### 3.7 Cross-Cutting Concerns

**Codex failure cascade**: Track consecutive Codex delegation failures. After 3 consecutive failures, auto-disable Codex for remaining experiments. Fall back to subagent dispatch only when authorization and callable capability still permit it; otherwise continue through serial inline/local execution. Log the switch and reason code.

**Error handling**: If an experiment's measurement command crashes, times out, or produces malformed output:
- Log as outcome `error` or `timeout` with the error message
- Revert the experiment (cleanup worktree)
- The loop continues with remaining experiments in the batch

**Progress reporting**: After each batch, report:
- Batch N of estimated M (based on backlog size)
- Experiments run this batch and total
- Current best metric and improvement from baseline
- Cumulative judge cost (if applicable)

**Crash recovery**: See Persistence Discipline section. Per-experiment `result.yaml` markers are written in step 3.3. Individual experiment results are appended to the log immediately in step 3.3. Batch-level state (outcomes, best, digest) is written in step 3.5. On resume (Phase 0.4), the log on disk is the ground truth — scan for any `result.yaml` markers not yet reflected in the log.

---
