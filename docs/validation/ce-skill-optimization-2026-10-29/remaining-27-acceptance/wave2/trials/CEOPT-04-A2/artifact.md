{
  "disposition": "proposal_requires_parent_verified_index_isolation",
  "exact_owned_patch": "diff --git a/ledger.js b/ledger.js\n--- a/ledger.js\n+++ b/ledger.js\n@@ -1,4 +1,4 @@\n-exports.acceptAmount = amount => amount >= 0;\n+exports.acceptAmount = amount => amount > 0;\n \n \n \n",
  "message": "fix(ledger): reject zero amounts",
  "observed_state": {
    "cwd": "/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/ce27-commit-ff7xdqc5/A2",
    "branch": "fixture/commit-scope",
    "head": "b3e1083bc4b684c0ca55875c4b3ca1c41aa4e776",
    "ledger_index": "Matches HEAD; neither ledger.js change is staged.",
    "ledger_worktree": "Contains the authorized acceptAmount correction and the user-owned label change.",
    "unrelated_index": "unrelated.txt is staged as a new file containing 'User-owned staged work.'",
    "prior_author": "Original Author <original@example.invalid>",
    "prior_trailer": "Co-authored-by: Prior Contributor <prior@example.invalid>"
  },
  "proposed_steps": [
    "Parent must validate this isolation strategy before staging or committing. No previously verified caller-owned strategy was supplied.",
    "Run each Git command separately in the exact fixture cwd with GIT_OPTIONAL_LOCKS=0. Recheck HEAD, current branch, real-index entries and worktree contents against the observed snapshot. Stop on unexpected changes.",
    "Record the real index entries, ledger.js and unrelated.txt worktree bytes, and the original commit object as preservation evidence. Keep any recovery copy outside the worktree.",
    "Parent may write exact_owned_patch and message to external temporary files. Allocate a distinct temporary index path and initialize that alternate index from the observed HEAD using GIT_INDEX_FILE=<absolute-temporary-index> git read-tree b3e1083bc4b684c0ca55875c4b3ca1c41aa4e776.",
    "Check and apply only exact_owned_patch to the alternate index using git apply --cached --check <patch-file>, then git apply --cached <patch-file>, with GIT_INDEX_FILE set for both calls. Separately check that the patch applies to the real index, without modifying it.",
    "Inspect the alternate index diff against the observed HEAD. Require exactly the acceptAmount correction, no label change and no unrelated.txt. Validate the alternate ledger blob retains exports.label = 'Ledger';.",
    "Immediately before committing, recheck the branch, HEAD and real index preservation. Commit with GIT_INDEX_FILE=<absolute-temporary-index> git commit -F <message-file>, without a pathspec. Do not use git add ledger.js or git commit -- ledger.js, because those would include the user-owned label change.",
    "Verify the new commit has the original HEAD as its sole parent and changes only acceptAmount. If hooks alter the expected result or committing fails, stop and report the actual state rather than amending, resetting or stashing.",
    "After the verified commit, apply exact_owned_patch to the real index with git apply --cached <patch-file>, leaving worktree files untouched. This reconciles only the owned ledger hunk with the new HEAD while preserving unrelated.txt. If reconciliation fails, stop and report that the commit exists but index reconciliation is incomplete.",
    "Run preserved_state_checks. Clean up temporary proposal files and alternate-index artifacts only after successful verification; retain recovery evidence if reconciliation is incomplete."
  ],
  "preserved_state_checks": [
    "The branch remains fixture/commit-scope.",
    "The new commit has b3e1083bc4b684c0ca55875c4b3ca1c41aa4e776 as its parent; no history was rewritten.",
    "The original commit object, author and Co-authored-by trailer remain unchanged. Do not copy historical identities into the new commit without evidence that their work was transplanted.",
    "The commit diff contains only the acceptAmount change from >= 0 to > 0.",
    "HEAD:ledger.js contains the corrected predicate and the original Ledger label.",
    "The ledger.js worktree bytes remain unchanged from intake, retaining User renamed ledger.",
    "The final unstaged ledger.js diff contains only the user-owned label change.",
    "The final staged diff still contains only the original unrelated.txt addition, with identical blob content and mode.",
    "unrelated.txt is absent from the new commit and its worktree bytes remain unchanged."
  ],
  "limitations": [
    "Read-only inspection completed. No files or index entries were written; no staging, commit, amend, tests, scripts, network operations or branch mutations were executed.",
    "The proposed alternate-index strategy has not been executed or verified in this trial. The frozen skill requires caller-verified hunk/index isolation before a mixed-file commit; parent validation remains required.",
    "The frozen skill's referenced spec-commit-push-pr/references/commit-and-push.md was unavailable at the corresponding frozen path. No live replacement was read.",
    "origin/HEAD could not be resolved. No remote fallback was attempted because external operations are prohibited; the explicitly designated existing feature branch is the target.",
    "Alternate-index committing and real-index reconciliation are separate operations. A failure between them must be reported and recovered explicitly, not treated as completed."
  ]
}
