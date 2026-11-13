# Scoped Caller-Validated Commit Procedure

Evidence: `verify-commit-recovery.py` and `commit-recovery-results.json`, seven actual disposable Git cases. The parent acceptance owner validated this procedure for that exact fixture. It is not a general Git transaction primitive or authorization to commit in spec-first.

## Preconditions

- Caller explicitly selects the existing non-default branch `feature/owned`; immediate branch/HEAD recheck must match. No origin/default metadata exists in this fixture, no checkout or publication is requested.
- HEAD contains `ledger.js` with the original amount predicate and original label. The owned change is only `>= 0` to `> 0`.
- The working tree also contains an unrelated label edit; `unrelated.txt` is staged and `untracked.txt` is untracked. In this fixture the real index's ledger blob equals HEAD: there is no staged user hunk inside ledger.js.
- Hooks are inspected and pinned. The admitted hook only writes its diagnostic marker outside the repository. A rejecting hook remains enabled; changed hook bytes stop admission.

## Execution and recovery

1. Capture HEAD, branch, real index entries, protected working-tree hashes and hook identity. Preserve original commit bytes/attribution.
2. Build a private alternate index from HEAD and apply only the owned predicate. Inspect its complete staged path list and resulting ledger blob.
3. Recheck HEAD/branch/index/hook immediately before committing. Any drift stops before a commit. This is an observation boundary, not an atomic lock against later writers.
4. Commit with the alternate index. Read back the commit parent, exact ledger blob, changed paths and message. Hook rejection leaves HEAD and real index unchanged in the tested fixture.
5. If execution was interrupted or its result was uncertain, perform that readback before retrying. An already-created intended commit is not recreated.
6. Reconcile the owned ledger change only if the real index still equals its pinned pre-operation state. The tested blob replacement is valid only because the pinned ledger index had no user-staged hunk. It is not a general recipe for arbitrary mixed staged hunks; such a target needs a patch-preserving strategy validated by its caller.
7. If the index changed after commit, retain both the actual commit and new index and report incomplete reconciliation. Do not reset/stash or retry the commit. After reconciliation, verify the user label edit, staged unrelated content, untracked content and prior attribution remain intact.

The corrected lost-result case discards the command response before reading its status or HEAD, then matches the actual commit against the pre-operation parent, intended tree and message; it does not kill a process or exercise a remote write. Repeated observation verifies one created commit. Scratch deletion is measured after each temporary-directory context exits.

## Retained initial verification defect

The initial runner did not actually discard the commit response: its lost-result label followed the normal path. Preserve that runner, results and log under `commit-initial/`; they establish ordinary readback/reconciliation only. The corrected runner explicitly drops the response before result-dependent inspection. This remains a local response-loss simulation, not a killed process or remote ambiguity.
