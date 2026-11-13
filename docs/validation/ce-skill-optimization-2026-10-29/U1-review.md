# U1: Experiment worktree data preservation

Status: mechanism_verified. review_source: producer-self-review. independent_review: not_run.

- Before the fix, new regressions produced 6 failures and 2 passes. The candidate passed 27 tests across two suites; see U1-red.log and U1-green.log. bash -n passed.
- Ownership lives in worktree-specific Git metadata and binds repo, worktree, branch, and base. Repeated create never resets, cleans, or recopies files. Default cleanup preserves tracked, untracked, ignored, and committed changes.
- Explicit --discard relaxes content checks only for an owned experiment. cleanup-all preserves unknown paths and returns nonzero while allowing valid items to finish; no rm fallback remains.
- Source self-review added Git-error propagation, Bash 3.2 empty-array compatibility, corrupt/symlinked manifest checks, and normal cleanup-all coverage. The wrap-up consumer documents evidence retention and cleanup authorization.
- Remaining audit dispositions: samples/noise belong to U8; opportunity, Goodhart, budgets, comparison, reports, feedback, cache, per-case evidence, recovery, and prose alignment belong to U24; outcome evaluation belongs to U29/U30. This unit does not complete the entire Optimize integration.
- No real model, Windows, independent review, runtime regeneration, commit, or push was performed. Local ownership protects against accidental deletion; it does not authenticate against a malicious process running as the same user.
