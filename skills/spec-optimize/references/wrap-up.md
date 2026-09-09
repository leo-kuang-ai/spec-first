# Phase 4: wrap-up

Read this at wrap-up. It carries deferred hypotheses, result summary, preservation, next steps, and cleanup.


### 4.1 Present Deferred Hypotheses

If any hypotheses were deferred due to unapproved dependencies:
1. List them with their dependency requirements
2. Ask the user whether to approve, skip, or save for a future run
3. If approved: add to backlog and offer to re-enter Phase 3 for one more round

### 4.2 Summarize Results

Present a comprehensive summary:

```
Optimization: <spec-name>
Duration: <wall-clock time>
Total experiments: <count>
  Kept: <count> (including <runner_up_kept_count> runner-up merges)
  Reverted: <count>
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

The optimization branch (`optimize/<spec-name>`) is preserved with all commits from kept experiments.
The experiment log remains in local `.spec-first/workflows/spec-optimize/<spec-name>/` scratch space for resume and audit on this machine only; it does not travel with the branch because that run-state path is gitignored. The strategy digest is derived, reconstructable state and may be regenerated from the canonical experiment log.

Present post-completion options via the platform question tool:

1. **Run code review** on the cumulative diff (baseline to final). Execute `spec-code-review` on the optimization branch, interactive or `mode:agent`. To land eligible fixes before the next option, apply the mechanical-apply bar below.

   **Mechanical-apply bar:** apply any finding with a concrete `suggested_fix` that is a clear, reversible improvement; push back and keep the diff when the reviewer is wrong, noting why. Defer anything whose right fix needs a design or product decision, including architecture direction, contract shape, behavior change needing sign-off, and any finding with no concrete fix to act on. Confirm evidence still matches at `file:line` before editing. After applying, run tests, at least targeted tests for what changed and a broader suite for multi-file edits. Do not commit or push from this step; leave the diff on the optimization branch for the Create PR option.
2. **Capture learning** by executing `spec-compound` to document the winning strategy as an institutional learning.
3. **Create PR** from the optimization branch to the default branch.
4. **Continue** with more experiments: re-enter Phase 3 with the current state. State re-read first.
5. **Done** -- leave the optimization branch for manual review.

### 4.4 Cleanup

Clean up scratch space:
```bash
# Keep the experiment log for local resume/audit on this machine
# Remove the derived strategy digest only after its required audit fields are in the log
rm -f .spec-first/workflows/spec-optimize/<spec-name>/strategy-digest.md
```

Do NOT delete the experiment log if the user may resume locally or wants a local audit trail. If they need a durable shared artifact, summarize or export the results into a tracked path before cleanup.
Do NOT delete experiment worktrees that are still being referenced.

Read `references/loop.md` before the optimization loop.
