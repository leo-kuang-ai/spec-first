---
name: spec-commit
description: Internal commit helper for public workflows that already hold explicit commit authorization; creates scoped, value-communicating commits without owning push or PR landing.
user-invocable: false
---

# Git Commit

Create a single, well-crafted git commit from the current working tree changes.

## Invocation And Authorization Boundary

This is an internal-only helper. A public workflow may delegate here only after the current user or a visible upstream handoff has established `commit_authorization: authorized` for the intended run-owned paths. `workflow invocation does not authorize commit`; tool permission, a dirty tree, a branch name, or successful verification are execution facts, not authority. When commit authorization is missing, stop before branch mutation, staging, or commit and return `commit_authorization_missing`.

This helper owns commit composition and the authorized commit checkpoint only. It does not own push, PR creation/update, plan lifecycle, or unrelated dirty paths. If branch creation would be required, obtain explicit approval for that concrete branch mutation before creating it.

## Context

Gather Git context by running each command as its own argv-style shell tool
call. Do not join commands with shell separators, pipes, substitutions, or
redirects; those forms are host-shell-specific and can hide the real exit
status.

| Command | Purpose | Non-zero or empty result |
| --- | --- | --- |
| `git status` | Working-tree state | Not a Git repository: stop |
| `git diff HEAD` | Uncommitted changes | An unborn repo may have no `HEAD`; inspect tracked changes directly |
| `git branch --show-current` | Current branch | Empty output means detached HEAD |
| `git log --oneline -10` | Commit-message convention | An unborn repo has no history |
| `git rev-parse --abbrev-ref origin/HEAD` | Remote default branch | Resolve it using the fallback in Step 1 |

These facts are a snapshot. Re-read the branch and staged paths immediately
before committing because the working tree may change after intake.

---

## Workflow

### Step 1: Gather context

Run every command in the Context section as a separate shell tool call.

The remote default branch value returns something like `origin/main`. Strip the `origin/` prefix to get the branch name. If the command exited non-zero or returned a bare `HEAD`, try:

```bash
gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'
```

If both fail, fall back to `main`.

If the git status from the context above shows a clean working tree (no staged, modified, or untracked files), report that there is nothing to commit and stop.

If the current branch from the context above is empty, the repository is in detached HEAD state. Explain that a branch is required before committing if the user wants this work attached to a branch. Ask whether to create a feature branch now. Use the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded) or `request_user_input` in Codex. Fall back to presenting options in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question.

- If the user chooses to create a branch, derive the name from the change content, create it with `git checkout -b <branch-name>`, then run `git branch --show-current` again and use that result as the current branch name for the rest of the workflow.
- If the user declines, continue with the detached HEAD commit.

### Step 2: Determine commit message convention

Follow this priority order:

1. **Repo conventions already in context** -- If project instructions (AGENTS.md, CLAUDE.md, or similar) are already loaded and specify commit message conventions, follow those. Do not re-read these files; they are loaded at session start.
2. **Recent commit history** -- If no explicit convention is documented, examine the 10 most recent commits from Step 1. If a clear pattern emerges (e.g., conventional commits, ticket prefixes, emoji prefixes), match that pattern.
3. **Default: conventional commits** -- If neither source provides a pattern, use conventional commit format: `type(scope): description` where type is one of `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`, `style`, `build`.

When using conventional commits, choose the type that most precisely describes the change (the type list above). Where `fix:` and `feat:` both seem to fit, default to `fix:`: a change that remedies broken or missing behavior is `fix:` even when implemented by adding code. Reserve `feat:` for capabilities the user could not previously accomplish. Other types remain primary when they fit better. The user may override for a specific change.

### Step 3: Consider logical commits

Before staging everything together, scan the changed files for naturally distinct concerns. If modified files clearly group into separate logical changes (e.g., a refactor in one directory and a new feature in another, or test files for a different change than source files), create separate commits for each group.

Keep this lightweight:
- Group at the **file level only** -- do not use `git add -p` or try to split hunks within a file.
- If the separation is obvious (different features, unrelated fixes), split. If it's ambiguous, one commit is fine.
- Two or three logical commits is the sweet spot. Do not over-slice into many tiny commits.

### Step 4: Stage and commit

If the current branch from the context above is `main`, `master`, or the resolved default branch from Step 1, automatically create a feature branch before staging or committing. Committing directly on the default branch is not an option in this workflow.

Derive the branch name from the change content, validate it, and create it from the current HEAD so uncommitted work and any local-only commits stay attached to the new branch:

```bash
BRANCH_NAME="<branch-name>"
git check-ref-format --branch "$BRANCH_NAME"
git checkout -b "$BRANCH_NAME"
git branch --show-current
```

Use the confirmed branch name for the rest of the workflow. If the branch already exists, derive a safe unique name and retry once. If branch creation still fails, stop before staging and report the failure; do not commit on the default branch.

Write the commit message:
- **Subject line**: Concise, imperative mood, focused on *why* not *what*. Follow the convention determined in Step 2.
- **Body** (when needed): Add a body separated by a blank line for non-trivial changes. Explain motivation, trade-offs, or anything a future reader would need. Omit the body for obvious single-purpose changes.

For each commit group, stage specific files by name over `git add -A` or `git add .` to avoid accidentally including sensitive files (.env, credentials) or unrelated changes. Write the message to a temp file and commit with `-F` so multi-line bodies are preserved without shell interpolation:

```bash
COMMIT_MSG=$(mktemp "${TMPDIR:-/tmp}/spec-commit-message.XXXXXX")
cat > "$COMMIT_MSG" <<'EOF'
type(scope): subject line here

Optional body explaining why this change was made,
not just what changed.
EOF
git add file1 file2 file3
git commit -F "$COMMIT_MSG"
```

### Step 5: Confirm

Run `git status` after the commit to verify success. Report the commit hash(es) and subject line(s).
