{
  "disposition": "blocked_missing_verified_hunk_index_strategy",
  "commit_authorization": "authorized",
  "branch_mutation_authorization": "missing",
  "target_branch": "fixture/commit-scope",
  "base_commit": "b3e1083bc4b684c0ca55875c4b3ca1c41aa4e776",
  "exact_owned_patch": "diff --git a/ledger.js b/ledger.js\n--- a/ledger.js\n+++ b/ledger.js\n@@ -1,4 +1,4 @@\n-exports.acceptAmount = amount => amount >= 0;\n+exports.acceptAmount = amount => amount > 0;\n \n \n \n",
  "message": "fix(ledger): reject zero amounts",
  "proposed_steps": [
    "Do not stage or commit until the caller supplies and verifies a strategy that isolates both the owned ledger.js hunk and the unrelated staged file.",
    "Recheck HEAD, branch, worktree diff and staged entries against this snapshot in the exact fixture directory, with GIT_OPTIONAL_LOCKS=0.",
    "Validate that the isolated commit candidate contains only exact_owned_patch relative to the recorded HEAD. The user-owned label change and unrelated.txt must be absent.",
    "If a verified strategy becomes available, the parent may execute it under the existing commit authorization on fixture/commit-scope. Do not use whole-file staging, a pathspec commit of ledger.js, an ordinary commit of the existing index, amend, squash, reset or stash.",
    "Read back the new commit's parent, message and complete patch, then verify all preserved-state checks. Report the actual commit hash only after successful execution."
  ],
  "preserved_state_checks": [
    {
      "subject": "Existing history",
      "expected": "The new commit's parent must be b3e1083bc4b684c0ca55875c4b3ca1c41aa4e776. That prior commit must retain Author: Original Author <original@example.invalid> and Co-authored-by: Prior Contributor <prior@example.invalid>. Do not copy those identities onto the new correction without provenance."
    },
    {
      "subject": "User-owned label",
      "expected": "The committed ledger.js must retain exports.label = 'Ledger'; while the worktree retains exports.label = 'User renamed ledger'; as an uncommitted change."
    },
    {
      "subject": "User-staged unrelated.txt",
      "expected": "The index entry must remain mode 100644, blob 5d783a514899a519cbbd2e51b58bb30409907edb, stage 0. The file must remain staged as a new file and absent from the new commit."
    },
    {
      "subject": "Owned correction",
      "expected": "The new commit must change only acceptAmount from >= 0 to > 0. After successful index reconciliation under the verified strategy, that correction must not remain as a staged or unstaged delta."
    },
    {
      "subject": "Branch",
      "expected": "Remain on fixture/commit-scope; no branch creation, checkout or remote operation."
    }
  ],
  "limitations": [
    "No caller-verified hunk/index isolation strategy was supplied; the frozen skill requires stopping this mixed-ownership commit group.",
    "The frozen cross-reference at inputs/B/spec-commit-push-pr/references/commit-and-push.md was unavailable. No unfrozen replacement was read.",
    "origin/HEAD could not be resolved. The external fallback was not attempted because external tools and remote actions are prohibited; the fixture explicitly identifies its existing feature branch as the target.",
    "Only read-only inspection was performed. No files or index were modified, no commit was created, and no tests or scripts were run."
  ]
}
