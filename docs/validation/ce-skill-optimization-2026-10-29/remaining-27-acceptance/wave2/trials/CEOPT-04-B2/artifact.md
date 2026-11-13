{
  "disposition": "blocked_pending_verified_hunk_index_strategy",
  "commit_authorization": "authorized",
  "branch_mutation_authorization": "missing",
  "target_branch": "fixture/commit-scope",
  "observed_head": "b3e1083bc4b684c0ca55875c4b3ca1c41aa4e776",
  "exact_owned_patch": "diff --git a/ledger.js b/ledger.js\n--- a/ledger.js\n+++ b/ledger.js\n@@ -1,4 +1,4 @@\n-exports.acceptAmount = amount => amount >= 0;\n+exports.acceptAmount = amount => amount > 0;\n \n \n \n",
  "message": "fix(ledger): reject zero amounts\n",
  "proposed_steps": [
    "Stop this commit group before staging: no caller-verified hunk/index isolation strategy was provided.",
    "Have the parent validate an isolation strategy that commits only exact_owned_patch while preserving the real index entry for unrelated.txt and leaving the label change uncommitted. A temporary-index strategy must also account for reconciling the owned ledger.js index entry after HEAD advances; leaving that entry at the old HEAD would introduce an unintended staged reversal.",
    "Resolve the missing default-branch fact through an allowed, confirmed source before branch-sensitive mutation. No remote lookup was performed in this trial.",
    "Immediately before any parent execution, re-read HEAD, branch, staged entries and both ledger.js hunks. Stop if they differ from this snapshot.",
    "After those prerequisites pass, use only the verified isolation strategy and a literal message file outside the repository. Do not use whole-file staging or a path-limited commit of ledger.js: the latter would capture its user-owned working-tree label change. Do not use a normal commit against the existing real index, which contains unrelated.txt.",
    "Read back the actual new commit, its parent, full message and patch; verify every preserved-state check before reporting success."
  ],
  "preserved_state_checks": [
    {
      "target": "Existing history",
      "expected": "The new commit's parent is b3e1083bc4b684c0ca55875c4b3ca1c41aa4e776. Preserve that commit unchanged, including Original Author <original@example.invalid> and Co-authored-by: Prior Contributor <prior@example.invalid>. No amend, squash or history rewrite."
    },
    {
      "target": "New commit",
      "expected": "Only ledger.js changes, with exactly the acceptAmount correction from >= 0 to > 0. The committed label remains 'Ledger'. Do not invent co-author attribution for the new correction."
    },
    {
      "target": "ledger.js working tree",
      "expected": "acceptAmount remains > 0 and label remains 'User renamed ledger'. After committing, the remaining unstaged diff is only the label change; no staged ledger.js reversal remains."
    },
    {
      "target": "unrelated.txt index",
      "expected": "Preserve mode 100644, blob 5d783a514899a519cbbd2e51b58bb30409907edb, stage 0. The file remains staged as a new file and is absent from the new commit."
    },
    {
      "target": "Branch",
      "expected": "Remain on fixture/commit-scope. No checkout, branch creation or remote action."
    }
  ],
  "limitations": [
    "Read-only inspection completed with GIT_OPTIONAL_LOCKS=0 for every Git command in the exact scratch cwd. No files, index entries or commits were modified; no tests or scripts were run.",
    "The frozen cross-reference inputs/B/spec-commit-push-pr/references/commit-and-push.md was unavailable. No unfrozen replacement was read.",
    "origin/HEAD could not be resolved. Network and external tools were prohibited.",
    "The hunk/index isolation strategy remains unverified. This JSON is not an executable commit approval or evidence of a completed commit."
  ]
}
