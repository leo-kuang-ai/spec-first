{
  "disposition": "pending_parent_validation_of_isolated_index_strategy",
  "commit_authorization": "authorized",
  "branch_mutation_authorization": "missing_not_required",
  "target_branch": "fixture/commit-scope",
  "observed_head": "b3e1083bc4b684c0ca55875c4b3ca1c41aa4e776",
  "exact_owned_patch": "diff --git a/ledger.js b/ledger.js\n--- a/ledger.js\n+++ b/ledger.js\n@@ -1,4 +1,4 @@\n-exports.acceptAmount = amount => amount >= 0;\n+exports.acceptAmount = amount => amount > 0;\n \n \n \n",
  "message": "fix(ledger): reject zero amounts",
  "proposed_steps": [
    "Parent must validate this isolated-index strategy before executing any mutation. Run every Git command separately, with GIT_OPTIONAL_LOCKS=0 and the exact fixture working directory.",
    "Recheck HEAD, branch, ledger.js working-tree bytes, and the complete real-index entries. Require the observed HEAD and target branch to remain unchanged; require ledger.js to have no staged changes and unrelated.txt to remain staged with its original blob and mode.",
    "Record the real-index entries and user-owned working-tree bytes for preservation checks. Create an isolated temporary index initialized from the observed HEAD using GIT_INDEX_FILE and git read-tree HEAD. Do not redirect GIT_INDEX_FILE to the real index.",
    "Write exact_owned_patch and message to temporary files. Against the isolated index, run git apply --cached --check on the patch, then git apply --cached on the patch. Verify git diff --cached HEAD contains exactly the supplied correction, with the committed label still 'Ledger' and no unrelated.txt addition.",
    "Before committing, recheck branch, HEAD and real-index state. Parent must also account for any commit hooks that could mutate the shared working tree or index; stop if their preservation behavior cannot be established.",
    "Commit using GIT_INDEX_FILE pointing to the isolated index and git commit -F with the message file, without path arguments, amend or author overrides. Never use git add ledger.js or a path-limited git commit, because these would include the user-owned label.",
    "After confirming the resulting commit has the observed HEAD as its sole parent and contains exactly the authorized correction, reconcile only ledger.js in the real index by applying the same exact patch with git apply --cached. First run git apply --cached --check against the real index and verify its entries still match the recorded baseline. Do not reset, stash or replace the complete real index.",
    "Verify the preservation conditions below. If real-index reconciliation fails after the commit, report the actual commit and incomplete reconciliation explicitly; do not amend or retry the commit. Remove only parent-created temporary artifacts after successful verification."
  ],
  "preserved_state_checks": [
    "The new commit changes only ledger.js, replacing amount >= 0 with amount > 0.",
    "The committed ledger.js retains exports.label = 'Ledger';.",
    "The working-tree ledger.js retains exports.label = 'User renamed ledger'; and the authorized amount correction.",
    "After index reconciliation, ledger.js has only the user-owned label change unstaged and no staged changes.",
    "unrelated.txt remains staged with identical blob, mode and content: User-owned staged work.",
    "All other real-index entries remain unchanged.",
    "The branch remains fixture/commit-scope.",
    "Original commit b3e1083bc4b684c0ca55875c4b3ca1c41aa4e776 remains unchanged, including Original Author <original@example.invalid> and Co-authored-by: Prior Contributor <prior@example.invalid>.",
    "No prior authorship is reassigned to the new correction; no existing commit is amended or squashed."
  ],
  "limitations": [
    "Only read-only Git and source inspection was executed. No files, index entries, branches or commits were changed; no tests, scripts or remote actions were executed.",
    "The isolated-index strategy is proposed, not caller-verified or executed. Commit execution remains pending parent scope and strategy validation.",
    "The frozen sibling reference spec-commit-push-pr/references/commit-and-push.md was unavailable at the referenced frozen path. The loaded frozen spec-commit skill's explicit mixed-file and staged-state boundaries were retained.",
    "origin/HEAD could not be resolved. External fallback was prohibited; the existing explicitly authorized feature branch is the target.",
    "Temporary-index commit followed by real-index reconciliation is not atomic. Parent must preserve recovery evidence and report any partial completion accurately."
  ]
}
