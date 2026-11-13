# U3: Worktree paths and remote-only branch identity

Status: mechanism_verified. review_source: producer-self-review. independent_review: not_run.

- Six new regressions failed before the fix (U3-red.log). The candidate passed 24 tests across Worktree and Work suites (U3-green.log), plus typecheck and entrypoint lint.
- create/isolate validate physical containment before checkout/ignore writes, reject .worktrees and nested branch ancestor links, and preserve valid feat/name paths. Create validates before fetch; PR fetch checks applicable target paths first.
- Both ordinary and linked remote-only paths explicitly request tracking. Fixtures disable branch.autoSetupMerge and still verify the local branch and origin upstream while preserving the main branch. Tags/commits explicitly detach.
- Work execution-strategy now owns a real forward invocation/intake contract: caller packet, detect-first, actual HEAD/ref/upstream/dirty/index checks, already_checked_out preservation, failure effects, and recovery. Git worktrees are not treated as worker index isolation.
- Other audit dispositions: retain existing detection, ref uniqueness, env/trust, and ignore behavior; native/fork experiments belong to U27; outcome traces belong to U29/U30. Networked PR/fork behavior was not tested.
- This is source self-review and local Git verification, not independent or real-host evaluation. Existing execution-strategy dirty hunks are preserved. No runtime edits, commit, or push.
