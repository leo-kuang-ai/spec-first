# Repository context, branch, and PR state

Gather context before Step 1, and re-verify branch, remote, and existing PR
state immediately before each consequential action. Each probe is its own
argv-form shell call. Read its exit status directly; do not hide a non-zero
result with a pipeline or fallback string.

| Probe | Purpose | Non-zero or empty result |
| --- | --- | --- |
| `git rev-parse --show-toplevel` | repo root | stop: not a Git repository |
| `git status` | staged, unstaged, and untracked state | stop only outside a repo |
| `git diff HEAD` | current worktree diff | empty is a valid clean state |
| `git branch --show-current` | current branch | empty means detached HEAD |
| `git log --oneline -10` | recent commit conventions | no history is a valid unborn state |
| `git rev-parse --abbrev-ref origin/HEAD` | remote default branch | resolve through `gh repo view`; if still unknown, keep the base unresolved |
| `gh pr list --head <branch> --state open --json number,url,title,body,state,isDraft,headRefName,headRepositoryOwner` | existing PR | exit-0 `[]` means none; non-zero is unknown, never none |

Pass the branch name only to `gh pr list`. On a fork checkout, target the base
repository with `-R <owner>/<repo>` when needed; do not pass
`<owner>:<branch>`, because that can silently return an empty result. If the
branch is detached, skip the PR query until the caller's authorized branch
workflow resolves a branch. Branch creation and checkout remain separate
mutation decisions; this reference does not authorize them.

The probe output is a snapshot, not authority. Re-check the live branch,
remote, and PR immediately before push and immediately before `gh pr create`
or `gh pr edit`. An unresolved PR state blocks PR mutation rather than being
treated as "no PR".

## Conventions

Match repository instructions and recent history. For Conventional Commits,
use `fix:` when repairing missing or broken behavior; reserve `feat:` for a
capability the user could not previously perform. The user may override this
choice.
