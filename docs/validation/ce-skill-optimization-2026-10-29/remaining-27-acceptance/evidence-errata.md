# Evidence Scope Corrections

Original receipts and reviews are retained. Companion supplement packets are frozen before their model blocks; no original outcome is relabeled.

- Runtime original outside paths are inside workspaceRoot. They demonstrate non-target/link safety, not workspace escape. The CEOPT25 supplement adds actual outside-workspace paths and snapshot identity.
- Worktree original ancestor target_branch/upstream fields query feature-login rather than feature/new. Outside directory entries and operation logs remain valid; CEOPT32 supplement measures the actual target and caller worktree/ref deltas.
- PR-feedback original unpublished stub combines behind with merge_base equal to fix. It proves conservative rejection of that synthetic input only. CEOPT23 supplement supplies internally consistent behind ancestry.
- Original media scratch_removed_after_capture is assigned before TemporaryDirectory exits; treat that field as a producer assertion, not a measured cleanup receipt. The supplement measures cleanup after exit and covers cumulative initial-request/fallback reporting. No actual external media egress occurred in either block.
- Handoff reviewer scenario pointer uses /scenarios; the actual frozen JSON owner is cases[id=CEOPT-12]. All referenced artifacts were read and reviewed; this pointer typo does not change the review scope.
- Worktree supplement `before_status` is captured before fixture symlink creation. Therefore B's later `?? .worktrees` / `?? .worktrees/` is fixture setup, not an implementation side effect. The explicit `.gitignore` contents and ref comparisons remain useful: A's dangling-ancestor failure leaves both `.gitignore` and `refs/heads/feature/new`; B creates neither. Do not equate status differences alone with helper mutation.
- The supplemental PR-feedback receipts use a separate bounded invocation; `prepare-pr-feedback.cjs` describes the original inconsistent stub, not a reproducible recipe for the corrected supplement. Preserve the corrected receipt, but require its actual invocation trace or a separate recipe before claiming independently reproducible supplemental execution.
  - Follow-up: the separately retained `verify-pr-feedback-supplement.cjs` recipe now reproduces both supplemental arms. `wave6/pr-feedback-supplement-reproduction.json` matches the original result and provider-call sequence except observation timestamp. It uses only an in-process provider stub and does not establish live publication.

## Debug independent-review criterion locator

The review remains unchanged. Its `frozen_criterion` fragment uses `/scenarios/CEOPT-08`; the actual JSON root is `cases`, and the criterion is selected by `id == CEOPT-08`. The complete reviewed criterion is quoted in that review. This corrects a locator only, without changing the review result or frozen criterion.
