{
  "disposition": "proposal_requires_parent_scope_and_index_validation",
  "commit_authorization": "authorized",
  "branch_mutation_authorization": "missing_and_not_needed",
  "target_branch": "fixture/commit-scope",
  "observed_head": "b3e1083bc4b684c0ca55875c4b3ca1c41aa4e776",
  "exact_owned_patch": "diff --git a/ledger.js b/ledger.js\n--- a/ledger.js\n+++ b/ledger.js\n@@ -1,4 +1,4 @@\n-exports.acceptAmount = amount => amount >= 0;\n+exports.acceptAmount = amount => amount > 0;\n \n \n \n",
  "message": "fix(ledger): reject zero amounts",
  "proposed_steps": [
    "Parent only: run every Git command separately in /var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/ce27-commit-ff7xdqc5/A1 with GIT_OPTIONAL_LOCKS=0 explicitly set. No remote operation, branch mutation, amend, squash, reset or stash.",
    "Recheck HEAD, branch, worktree diff and complete staged entries against the recorded snapshot. Stop on unexpected changes. Preserve a recoverable copy of the original index and exact worktree bytes before any authorized mutation.",
    "Create a temporary alternate index outside the worktree. With GIT_INDEX_FILE pointing to that temporary index, initialize it using git read-tree HEAD. Write exact_owned_patch and message to separate temporary files using literal content.",
    "With the alternate index selected, run git apply --cached --check <patch-file>, then git apply --cached <patch-file>. Inspect git diff --cached HEAD and git show :ledger.js under that index. Require exactly the acceptAmount correction, the original label 'Ledger', and no unrelated.txt entry in the prospective commit.",
    "Parent must validate this hunk/index isolation strategy before proceeding. This trial has not executed or verified it.",
    "With the normal index selected, check and apply the same exact patch using git apply --cached --check <patch-file> and git apply --cached <patch-file>. Verify unrelated.txt retains its original mode, blob and stage; verify the only added staged change is the owned correction. This aligns the normal index with the intended new HEAD without changing worktree content.",
    "Immediately recheck branch, HEAD and both index diffs. With GIT_INDEX_FILE selecting the validated alternate index, run git commit -F <message-file> without path arguments. Do not use git commit -- ledger.js: that would include its user-owned worktree label change.",
    "Inspect the resulting commit and normal-index status. Require a single new commit directly descending from the recorded HEAD, containing only exact_owned_patch. Confirm the normal index retains unrelated.txt staged and ledger.js has only the user-owned label change unstaged.",
    "If commit execution fails or its outcome is uncertain, inspect HEAD and both indexes before any retry. Do not automatically restore an index backup over intervening changes. Report any remaining owned staged correction explicitly.",
    "Remove temporary proposal/index/message files only after outcome verification; retain recovery evidence while any failure remains unresolved."
  ],
  "preserved_state_checks": {
    "prior_history": {
      "commit": "b3e1083bc4b684c0ca55875c4b3ca1c41aa4e776",
      "author": "Original Author <original@example.invalid>",
      "existing_trailer": "Co-authored-by: Prior Contributor <prior@example.invalid>",
      "requirement": "Keep this commit unchanged as the new commit's parent. Do not copy its author or trailer into the independent correction commit or rewrite its history."
    },
    "normal_index_before": {
      "ledger.js": "100644 585d6fd16475128525c8d891bc04bf6af49e381e 0",
      "unrelated.txt": "100644 5d783a514899a519cbbd2e51b58bb30409907edb 0"
    },
    "worktree": [
      "ledger.js must retain exports.acceptAmount = amount => amount > 0;",
      "ledger.js must retain exports.label = 'User renamed ledger';",
      "All existing worktree bytes must remain unchanged."
    ],
    "expected_final_status": " M ledger.js\nA  unrelated.txt",
    "expected_final_unstaged_diff": "Only exports.label changes from 'Ledger' to 'User renamed ledger'.",
    "expected_final_staged_diff": "Only the original addition of unrelated.txt containing User-owned staged work.",
    "expected_commit_diff": "Only ledger.js acceptAmount changes from >= 0 to > 0."
  },
  "limitations": [
    "Read-only inspection completed. No files or indexes were modified; no commit, tests or scripts were executed.",
    "The alternate-index strategy is a concrete proposal, not a caller-verified or execution-validated strategy. Parent validation remains required before mutation.",
    "The frozen SKILL.md references commit-and-push.md, but the corresponding frozen sibling path was absent. No unfrozen replacement was loaded.",
    "origin/HEAD could not be resolved. Network fallback was prohibited; the explicitly authorized existing feature branch is the target.",
    "No new commit hash or successful commit outcome is claimed."
  ]
}
