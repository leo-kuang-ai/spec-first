# Optimization loop

Run optimization as a bounded measurement loop: freeze identity and baseline, change one treatment, measure the agreed objective, and keep multi-objective wins only when the evidence supports them. Screen expensive runs before spending them and record `not-run` or `degraded` outcomes honestly.

## 独立确认边界

holdout 只确认已经由 selection 选出的候选；不进入假设、实验 worker、rolling summaries、strategy digest 或排名。只向这些消费者传 selection 的诊断，确认的原始配对和判定单独留在 experiment log 供审计；确认失败不能成为下一轮针对该集合调参的素材。

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
authorized dispatch is available. For this corpus audit, separate proposal and
defense contexts are required: if either cannot run, stop that audit as blocked
and retain its candidates without applying them. A pre-launch argument rejection
may be corrected once without weakening the packet or required capabilities;
capacity-limited work stays queued, with a bounded stop if no slot becomes
available. Other launch failures cannot be replaced by arguing both sides in
one context. Collect every started job before retrying. Ordinary measurement
and implementation keep their own permitted serial fallback.

A cut with no provenance after a real search is a
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

Do not fill a hypothesis quota. Record each opportunity before implementation: observed cost or selection-rubric failure, workload and baseline identity, expected benefit with units/range or explicit unknown, assumptions, cheapest resolving measurement, and implementation/measurement cost and risk. Priority is a judgment, not a measured benefit. Use selection failure themes, not one new rule per failed item; holdout details never feed this backlog.

Prefer a cheap locating measurement (profile, query count, stage timing) when it is executable within the existing envelope and would change what is worth implementing. Attribution guides selection; the original baseline remains the scoring reference. A prompt-quality experiment need not have a performance profile. Unknown estimates may remain in the backlog; lack of evidence is not permission to invent a forecast.

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

Before any research, experiment, measurement or judge launch, check remaining iteration, wall-time and applicable monetary caps, including work already in flight and the confirmation cost. Do not launch work known to exceed them. Record host-reported spend separately from estimates; missing prices do not imply zero cost or exact cap enforcement. If a required monetary cap cannot be bounded, stop the paid work with that limitation. Category diversity never outranks a better-supported opportunity or a budget boundary.

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

1. **Run measurement** in the experiment's worktree. Spend only the measurement the current decision needs (see Phase 1). When `stability.mode` is `ladder` and a smoke command is set, run that smoke check first: failure is terminally `degenerate`, and success proceeds to the first exploratory sample of `measurement.command` before comparison. Otherwise start with one exploratory sample. Pass `SPEC_OPTIMIZE_CENSOR_AFTER` to `measure.sh` only when elapsed wall time itself proves the candidate cannot become eligible — every required objective is already hopeless, not merely the primary. Otherwise let measurement finish so other required objectives can still win, and let `decide.cjs` assess futility after the payload is complete.
   ```bash
   SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
   bash "$SKILL_DIR/scripts/measure.sh" "<measurement.command>" <timeout_seconds> "<worktree_path>/<measurement.working_directory or .>" <env_vars...>
   ```
   When mode is `repeat`, keep running `repeat_count` times and aggregating as in Phase 1. When mode is `stable`, run once.

2. **Write crash-recovery marker** — immediately after measurement, write `result.yaml` in the experiment worktree containing the raw metrics. This ensures the measurement is recoverable even if the agent crashes before updating the main log.

3. **Read raw JSON output** from the measurement script

4. **Evaluate degenerate gates**:
   - For each gate in `metric.degenerate_gates`, parse the operator and threshold
   - Compare the metric value against the threshold
   - If ANY gate fails: mark outcome as `degenerate`, skip judge evaluation, save money

5. **If gates pass AND primary type is `judge`**:
   - Check independence before dispatch: judges must not author the hypothesis, run the experiment they score, or see other judges' results. If authorized, isolated judges are unavailable, mark this experiment `error` with the concrete dispatch or isolation reason. Skip scoring and comparison, then persist and verify the error at CP-3. It has no judge metrics, cannot become `best`, and is unmeasured rather than poor-scoring. Report the blocker at the batch summary.
   - Read the experiment's output (cluster assignments, search results, etc.)
   - Apply stratified sampling per `metric.judge.stratification` config (using `sample_seed`)
   - Group samples into batches of `metric.judge.batch_size`
   - Fill the judge prompt template (`references/judge-prompt-template.md`) for each batch
   - When the package-local dispatch and independence boundaries are satisfied, dispatch the `ceil(sample_size / batch_size)` judge sub-agents using the same bounded scheduler as Phase 3.2. Capacity errors queue the batch until a slot frees; they do not justify inline scoring. Judge work is a separate budget from experiment worktrees.
   - Each dispatched judge batch returns structured JSON scores
   - Aggregate scores: compute the configured primary judge field from `metric.judge.scoring.primary` (which should match `metric.primary.name`) plus any `scoring.secondary` values
   - If `singleton_sample > 0`: evaluate singleton batches through the same authorized, isolated judge path

6. **Compare with `decide.cjs`.** Invoke it only after gates pass and the payload holds every required objective value — hard metrics from measurement, and judge scores when those were collected. The payload is the spec as loaded plus the baseline and candidate snapshots. The script reads the nested spec (`metric`, `measurement.stability`) and owns eligibility, noise, and the ladder next step. Do not reconstruct a flattened payload, and do not re-derive the threshold in prose.
   ```bash
   SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
   NODE="$(for c in node nodejs; do command -v "$c" >/dev/null 2>&1 && "$c" -e '' >/dev/null 2>&1 && { echo "$c"; break; }; done)";
   [ -n "$NODE" ] || { echo "no working Node runtime on PATH (tried node, nodejs)" >&2; exit 1; };
   "$NODE" "$SKILL_DIR/scripts/decide.cjs" "<payload.json>"
   ```
   Preserve ordered sample arrays and the measured source identity in both snapshots. The comparison helper emits a nonzero exit and an `error` decision for invalid configuration or missing evidence; never replace that failure with a prose eligibility claim. Smoke and censor settings must be covered by the measurement execution envelope from Phase 1.
   If that probe finds no runtime, do not invoke an empty command: mark the experiment `error` with that reason and continue the batch. Use `decision` and `next_measurement`. Collect the requested measurement and repeat this sequence whenever `next_measurement` is not `none`. Do not keep a candidate until `next_measurement` is `none`. Record `inconclusive` and `censored` as those outcomes, not as `reverted`. Each extra sample belongs to this same experiment: write it onto the existing entry at CP-3, then decide again.

   `next_measurement: holdout` 表示 selection 的完整协议已通过。此时由 orchestrator 在获授权的确认 envelope 下，对相同 source identities 收集第二组完整 `holdout: {baseline, candidate}`，再次调用同一脚本；不把确认数字覆盖 selection。judge 确认仍由获授权且独立的 judge 执行；seed 必须对应互斥 item。重复/ladder 使用完整 samples（含真实配对 baseline），smoke 事实也须绑定同一源。缺失、失败或不确认同一改善目标时不能集成；不以回填 aggregate、换目标、调阈值或重抽样直至绿来放行。

7. **IMMEDIATELY persist this experiment on disk (CP-3)** — do not defer this to batch evaluation. The durable unit is one log entry per experiment at `.spec-first/workflows/spec-optimize/<spec-name>/experiment-log.yaml`. After the first measurement, append that entry. After every later ladder sample for the same experiment, write the accumulated metrics and current outcome onto that same entry. Do not append a second entry for the same hypothesis, and do not rewrite a different experiment's samples. Write a decide terminal only when `next_measurement` is `none`. Until then the entry stays nonterminal: `promising` while the keep path still needs samples, `measured` otherwise (including an inconclusive result that still wants samples). When `next_measurement` is `none`, an eligible result stays `measured` until its diff is on the optimization branch; a non-eligible result gets the decide terminal (`reverted`, `inconclusive`, `censored`, `degenerate`). `kept` and `runner_up_kept` wait until that integration. The raw metrics are on disk and safe from context compaction.

   Preserve the pre-implementation opportunity and add this exact pairing to the log's `comparisons` using the identity contract in `references/persistence.md`. Extra ladder samples extend that pairing; a combined runner-up or final original-baseline comparison is a different record. Do not overwrite the standalone result or leak holdout records into the strategy digest.

8. **VERIFY the write (CP-3 verification)** — read the experiment log back from disk and confirm the entry just written is present. If verification fails, inspect current bytes before retrying so an unknown outcome cannot duplicate results. Do NOT proceed to the next experiment until this entry is confirmed on disk.

**Why immediately + verify?** The agent's context window is NOT a durable store. Context compaction, session crashes, and restarts are expected during long runs. If results only exist in the agent's memory, they are lost. Karpathy's autoresearch writes to `results.tsv` after every single experiment — this skill must do the same with the experiment log. The verification step catches silent write failures that would otherwise lose data.

### 3.4 Evaluate Batch

Before integrating any candidate, including a runner-up, inspect the actual combined diff against the task and constraints. A numeric `keep` is necessary but not sufficient: skipping required work, weakening outputs, exploiting unobserved behavior or leaking evaluation data invalidates the apparent gain. Reject that candidate with the concrete missing observation in `learnings`; preserve raw scores and the script decision. Fix the harness only in a new run, never by changing this run's frozen inputs. A gain beyond the opportunity's supported upper bound deserves an explicit countercheck, not automatic praise.

After all experiments in the batch have been measured:

1. **Decide eligibility from `decide.cjs`, not from the primary metric alone.** An experiment is eligible when it improves at least one required objective beyond the configured comparison threshold and does not violate any other required objective. When `metric.objectives` is absent, the primary is the only required objective. `inconclusive` is not a keep.

2. **Rank** the eligible experiments in the batch by the script's `rank_score` (primary relative gain when the primary moved; otherwise the strongest required-objective relative gain). Identify that winner as the experiment to keep. An eligible experiment may be kept even if the ranking primary did not move.

   排名只消费 selection 的 `rank_score`。holdout 数值不得改变排序；配置确认时必须先完成脚本要求的确认且得到 `decision: keep`，缺确认的 `promising` 不属于可集成集合。

3. **If `decide.cjs` returns `keep` for that winner: KEEP**
   - Only the orchestrator, with explicit commit and integration authority, commits the verified experiment through the existing commit owner before merge or cherry-pick. Without that authority, preserve the measured candidate and report integration pending; do not label it `kept`.
   - Include only mutable-scope changes in that commit; if no eligible diff remains, treat the experiment as non-improving and revert it
   - Merge the committed experiment branch into the optimization branch
   - Use the message `optimize(<spec-name>): <hypothesis description>` for the experiment commit
   - After the merge succeeds, clean up the winner's experiment worktree and branch; the integrated commit on the optimization branch is the durable artifact
   - This is now the new baseline for subsequent batches

4. **Check file-disjoint runners-up** (up to `max_runner_up_merges_per_batch`):
   - For each runner-up that also improved, check file-level disjointness with the kept experiment
   - **File-level disjointness**: two experiments are disjoint if they modified completely different files. Same file = overlapping, even if different lines.
   - If disjoint: cherry-pick the runner-up onto the new baseline and run the same decide loop as step 3.3 against a fresh sample set for that combined snapshot — do not reuse the standalone experiment's accumulated samples, whose meaning is against the previous baseline. Collect further measurement whenever `next_measurement` is not `none`. Keep the original standalone log entry for audit.
   - Keep the cherry-pick only when that result is eligible and `next_measurement` is `none` (outcome: `runner_up_kept`); then clean up that runner-up's experiment worktree and branch
   - Otherwise: revert the cherry-pick, log as "promising alone but neutral/harmful in combination" (outcome: `runner_up_reverted`), then clean up the runner-up's experiment worktree and branch
   - Stop after first failed combination

5. **Handle deferred deps**: experiments that need unapproved dependencies get outcome `deferred_needs_approval`

6. **Close the rest.** Cleanup worktrees. `kept` and `runner_up_kept` are only for diffs on the optimization branch. Eligible candidates that were not integrated become `not_selected`. Leave `inconclusive`, `censored`, and `degenerate` as `decide.cjs` returned them.

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
- **Target reached**: `stopping.target_reached` is true and the current best meets every declared required target (`scripts/decide.cjs` returns `target_reached` for that confirmed snapshot). The primary alone cannot close a run while another required target is unmet. With no extra objectives, this is the primary target if set.
- **Max iterations**: total experiments run >= `stopping.max_iterations`
- **Max hours**: wall-clock time since Phase 3 start >= `stopping.max_hours`
- **Judge budget exhausted**: cumulative judge spend >= `metric.judge.max_total_cost_usd` (if set)
- **Plateau**: no improvement for `stopping.plateau_iterations` consecutive experiments
- **Manual stop**: user interrupts (save state and proceed to Phase 4)
- **No runnable hypothesis left**: no hypotheses remain and no new ones can be generated, or every remaining hypothesis is blocked or awaiting approval

If no stopping criterion is met, proceed to the next batch (step 3.1).

### 3.7 Cross-Cutting Concerns

**Codex failure cascade**: Track consecutive Codex delegation failures. After 3 consecutive failures, auto-disable Codex for remaining experiments. Fall back to subagent dispatch only when authorization and callable capability still permit it; otherwise continue through serial inline/local execution. Log the switch and reason code.

**Error handling**: Exit 125 plus the runner's `SPEC_OPTIMIZE_CENSORED:` stderr marker is `censored`; exit 124 is `timeout`. Any other nonzero exit, including 125 without that marker, or malformed output is `error`. Persist the actual exit, stderr, and partial output without synthetic scores, clean up the failed experiment, and continue the batch. Missing or invalid decision evidence cannot authorize integration.

**Progress reporting**: After each batch, report:
- Batch N of estimated M (based on backlog size)
- Experiments run this batch and total
- Current best metric and improvement from baseline
- Cumulative judge cost (if applicable)

**Crash recovery**: See Persistence Discipline section. Per-experiment `result.yaml` markers are written in step 3.3. Individual experiment results are appended to the log immediately in step 3.3. Batch-level state (outcomes, best, digest) is written in step 3.5. On resume (Phase 0.4), the log on disk is the ground truth — scan for any `result.yaml` markers not yet reflected in the log.

---
