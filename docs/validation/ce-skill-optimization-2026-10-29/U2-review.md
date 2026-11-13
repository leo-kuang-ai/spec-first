# U2: Path and Git identity

Status: mechanism_verified. review_source: producer-self-review. independent_review: not_run.

- Four new regressions failed before the fix (U2-red.log). The candidate passed 193 tests across eight suites (U2-green.log), plus typecheck and entrypoint lint.
- path-safety uses segment-wise lstat to distinguish absent paths from dangling links. Both writers validate before mkdir and publish through an exclusive temporary file, destination recheck, and rename. Failure preserves external sentinels and hardlink peers; temporary files are cleaned on failed writes.
- The existing git-path runner now strips GIT_* overrides and disables fsmonitor. source-snapshot, workspace-graph-state, exclude resolution, and advisory Graphify HEAD reads share it. A/B repository fixtures cover GIT_DIR, GIT_WORK_TREE, GIT_INDEX_FILE, and GIT_CONFIG_* contamination.
- Positive coverage includes linked-worktree metadata, creation, idempotence, stripping, graph build/refresh/status, and provider source snapshots. Negative coverage includes dangling leaves/ancestors and destination symlink replacement during staging.
- Source self-review retained raw Git paths until containment validation and assigned temporary-file cleanup responsibility immediately after exclusive open. Atomic replacement is not claimed to resist arbitrary ancestor replacement by a malicious same-user process.
- RT-1 and RT-2 are addressed here. RT-3/RT-4, on-demand capabilities, original-owner repair, knowledge hints, command rendering, and documentation/consumer alignment remain assigned to U27. Pack/config-root/cross-model runtime proposals retain the audit’s deferral conditions. Real installation, Windows, eight-host behavior, and model evaluation remain untested.
