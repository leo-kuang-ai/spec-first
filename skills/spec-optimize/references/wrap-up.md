# Phase 4: wrap-up

Read this at wrap-up. It carries deferred hypotheses, result summary, preservation, next steps, and cleanup.


### 4.1 Present Deferred Hypotheses

If any hypotheses were deferred due to unapproved dependencies:
1. List them with their dependency requirements
2. Ask the user whether to approve, skip, or save for a future run
3. If approved: add to backlog and offer to re-enter Phase 3 for one more round

### 4.2 Summarize Results

Present a comprehensive summary:

Derive overall improvement from a fresh pairing of the original baseline and final integrated source under the same full protocol, workload and environment, including configured holdout. Per-keep comparisons against successive best states cannot replace this pair. Record it separately without overwriting standalone measurements. If unavailable, label final improvement unconfirmed; unknown noise or absent holdout cannot support a generalization claim.

Report every required objective with units and absolute change. Use percentages only for meaningful ratio scales with nonzero baselines; ordinal judge scores use score points. Never add iteration percentages. Compare forecasts with measured results only when their baseline/workload match. Distinguish standalone contribution from integrated result, observed regressions from missing per-case coverage, host-reported cost from estimates, and stale opportunity estimates from fresh evidence.

```
Optimization: <spec-name>
Duration: <wall-clock time>
Total experiments: <count>
  Kept: <count> (including <runner_up_kept_count> runner-up merges)
  Reverted: <count>
  Not selected: <count>
  Inconclusive: <count>
  Censored: <count>
  Degenerate: <count>
  Errors: <count>
  Deferred: <count>

Baseline -> Final:
  <primary_metric>: <baseline_value> -> <final_value> (<delta>)
  <gate_metrics>: ...
  <diagnostics>: ...

Judge cost: $<total_judge_cost_usd> (if applicable)

Key improvements:
  1. <kept experiment 1 hypothesis> (+<delta>)
  2. <kept experiment 2 hypothesis> (+<delta>)
  ...
```

### 4.3 Preserve and Offer Next Steps

Before claiming final improvement or target completion, confirm the integrated snapshot with the full configured measurement protocol and every required objective. Persist failures or unavailable confirmation as unresolved evidence. Report each required target against the final snapshot, and distinguish a target stop from budget, plateau, manual stop, or blocked execution. Comparison eligibility alone is not proof of integration.

配置 holdout 时，最终集成源须重新获得独立确认，不能复用 standalone 候选的数值；保留 selection 和 holdout 两组原始配对及身份。未配置、数据泄漏、身份不匹配或确认未运行时，按实际情况限制改善 claim，不能把 selection 分数写成泛化收益。确认数据不反流到后续假设。

The optimization branch (`optimize/<spec-name>`) is preserved with all commits from kept experiments.
The experiment log remains in local `.spec-first/workflows/spec-optimize/<spec-name>/` scratch space for resume and audit on this machine only; it does not travel with the branch because that run-state path is gitignored. The strategy digest is derived, reconstructable state and may be regenerated from the canonical experiment log.

Write a shareable local report at an authorized project documentation path (default `docs/optimize/<spec-name>-report.md`), preserving an existing unrelated report. Include original/final comparison identities, required-objective results, holdout status, regressions or missing coverage, semantic counterchecks, stop reason, budget accounting and recovery instructions. Use repository-relative references and opaque run IDs; omit secrets, private absolute paths, raw private data and sensitive prompts. Keep sensitive evidence in its private owner store and disclose any resulting reproducibility limit. Read back the report before claiming it exists. Creating this local report grants no commit, upload, push or PR authority; measurement-only retains its own no-mutation output boundary.

Present post-completion options via the platform question tool:

1. **Run code review** on the cumulative diff (baseline to final). Execute `spec-code-review` on the optimization branch, interactive or `mode:agent`. To land eligible fixes before the next option, apply the mechanical-apply bar below.

   **Mechanical-apply bar:** apply only confirmed, in-scope findings with a concrete `suggested_fix` that is clear, reversible and covered by existing mutation authority; push back and keep the diff when the reviewer is wrong, noting why. Defer anything whose right fix needs a design or product decision, including architecture direction, contract shape, behavior change needing sign-off, and any finding with no concrete fix to act on. Confirm evidence still matches at `file:line` before editing. After applying, run tests, at least targeted tests for what changed and a broader suite for multi-file edits. Source-changing fixes invalidate earlier final measurements: rerun the final comparison before retaining an improvement claim. Do not commit or push from this step; leave the diff on the optimization branch for an explicitly authorized landing owner.
2. **Capture learning** by executing `spec-compound` to document the winning strategy as an institutional learning.
3. **Create PR** from the optimization branch to the default branch.
4. **Continue** with more experiments: re-enter Phase 3 with the current state. State re-read first.
5. **Done** -- leave the optimization branch for manual review.

### 4.4 Cleanup

First resolve the selected next step. Continue or approval of deferred dependencies returns to Phase 3 after re-reading state; do not finalize CP-5 or clean up state needed for that continuation. For a next step that does not return to Phase 3, write and read back the final experiment log at CP-5 before cleanup. A still-pending choice leaves the run resumable, not final.

Clean up scratch space:
```bash
# Keep the experiment log for local resume/audit on this machine
# Remove the derived strategy digest only after its required audit fields are in the log
rm -f .spec-first/workflows/spec-optimize/<spec-name>/strategy-digest.md
```

Do NOT delete the experiment log if the user may resume locally or wants a local audit trail. If they need a durable shared artifact, summarize or export the results into a tracked path before cleanup.
Do NOT delete experiment worktrees that are still being referenced.

`experiment-worktree.sh` owns experiment cleanup. By default it removes only experiments with matching Git metadata ownership, the original base HEAD, and no tracked, untracked, or ignored changes. Preserve and report legacy directories without ownership; never fabricate a manifest or delete by prefix. To discard this run’s experiment changes, first retain CP-5 evidence and verify existing deletion authorization, then explicitly use `cleanup --discard <spec> <index>` or `cleanup-all --discard <spec>`. Both still preserve unknown directories. Preserve failed operations for recovery; do not bypass checks with manual rm/reset. Repeated create only reuses a clean owned directory at the same base, without resetting its branch or recopying files. Resume an existing experiment directly at its current path.
