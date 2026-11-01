---
name: spec-commit
description: Internal commit helper for public workflows that already hold explicit commit authorization; creates scoped, value-communicating commits without owning push or PR landing.
user-invocable: false
---

# Git Commit

Create scoped logical commit(s) that explain the outcome of the authorized changes.

## Invocation And Authorization Boundary

This is an internal-only helper. A public workflow may delegate here only after the current user or a visible upstream handoff has established `commit_authorization: authorized` for the intended run-owned paths. Record branch authority separately:

```yaml
commit_authorization: authorized | missing
branch_mutation_authorization: authorized | missing
```

`workflow invocation does not authorize commit`; tool permission, a dirty tree, a branch name, or successful verification are execution facts, not authority. Explicit commit authorization does not imply branch mutation authorization. When any commit intent is expressed while commit authorization is missing, stop before branch mutation, staging, or commit and return `commit_authorization_missing`. When a checkout or new branch is needed but branch authority is missing, stop before that Git mutation and return `branch_mutation_authorization_missing` or obtain approval for the exact branch action. A pure status question about uncommitted changes (no commit intent expressed) does not trigger this gate: answer the query directly, mutate nothing, and do not stage or commit.

Consume the caller's owned paths, explicit `exclude:<paths>`, known unit context and verified hunk-isolation strategy. Exclusions win over an overlapping owned-path list; report them as left uncommitted. A changed-file list does not prove ownership.

When no verified isolation strategy exists, you may return a concrete proposal for caller validation. Label it unverified and perform no staging or commit until its preservation checks pass. A proposed procedure is not an execution receipt; use the shared precommit and recovery boundaries in `skills/spec-commit-push-pr/references/commit-and-push.md`.

This helper owns commit composition and the authorized commit checkpoint only. It does not own push, PR creation/update, plan lifecycle, or unrelated dirty paths. If branch creation is required, consume existing authority for that exact branch action; obtain approval only when it is missing.

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

If both fail, keep the default unresolved; do not assume `main`. Missing default metadata blocks an action that depends on identifying the default branch. An explicitly caller-confirmed existing non-default feature branch can remain the commit target when the immediate branch recheck matches that exact target and no checkout, branch creation or publication is requested. A feature-like name alone is not confirmation; known `main`, `master` and resolved default branches still follow Step 4. Report the unresolved metadata without inventing it. Target GitHub metadata at the confirmed repository, including its host when needed.

If the git status from the context above shows a clean working tree (no staged, modified, or untracked files), report that there is nothing to commit and stop.

If the current branch from the context above is empty, the repository is in detached HEAD state. Explain that a branch is required if the user wants this work attached to a branch. When `branch_mutation_authorization: missing`, ask whether to create the exact proposed feature branch now and do not run checkout first. Use the platform's blocking question tool: the host's blocking question tool already in the current tool list, matched by capability (if a matching tool is listed but unloaded, load it through the host's tool-discovery primitive). Fall back to presenting options in chat only when no such tool is in the list or a real question call errors. Never silently skip the question.

- If the user authorizes the displayed branch creation, set `branch_mutation_authorization: authorized`, derive the name from the change content, create it with `git checkout -b <branch-name>`, then run `git branch --show-current` again and use that result as the current branch name for the rest of the workflow.
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

If the current branch from the context above is `main`, `master`, or the resolved default branch from Step 1, committing directly is not an option in this workflow. Display the proposed feature-branch name and require `branch_mutation_authorization: authorized` before creation; otherwise return `branch_mutation_authorization_missing` before staging or committing.

Derive the branch name from the change content, validate it, and create it from the current HEAD so uncommitted work and any local-only commits stay attached to the new branch:

Run these as separate argv calls, stopping on an invalid name or failed checkout:

```text
git check-ref-format --branch <branch-name>
git checkout --no-overwrite-ignore -b <branch-name>
git branch --show-current
```

Use the confirmed branch name for the rest of the workflow. If the branch already exists, derive a safe unique name and retry once. If branch creation still fails, stop before staging and report the failure; do not commit on the default branch.

Write the commit message:

保留分支上他人已有提交的 author 与 trailers，不通过 squash 或重写把其贡献归为本次提交。若本次提交移植他人分支、PR 或 patch 的工作，且该工作不会另以原作者名义落地，则从原提交/patch 精确复制 author 和已有 `Co-authored-by` 身份，并为每人添加 `Co-authored-by: Name <email>` trailer；没有邮箱时在 body 署名，不猜测身份。语义参考、独立改写与直接移植须按实际来源区分，不因读过上游文件就伪造共同作者。此规则不授予历史重写权限。

- **Subject line**: Concise, imperative mood, focused on *why* not *what*. Follow the convention determined in Step 2.
- **Body** (when needed): Add a body separated by a blank line for non-trivial changes. Explain motivation, trade-offs, or anything a future reader would need. Omit the body for obvious single-purpose changes.

When exactly one implementation unit is already known and actually owns this commit, append its U-ID, such as `(U3)`. Omit it for mixed-unit or unclear scope; do not search for a plan just to invent a label.

For each group, stage specific owned files rather than `git add -A` or `git add .`. Write the full message literally with the native file-write tool into a private temporary file outside the repository. Pass its path as one argument; message content must never pass through shell interpolation. Run stage and commit as separate argv calls:

```text
git add -- file1 file2 file3
git commit -F <message-file> -- file1 file2 file3
```

Git's normal message cleanup still applies. Read back the actual commit message and included paths, then remove only this run's temporary file after success or preservation of necessary failure evidence. Never silently stage an excluded path or turn mixed-hunk ownership into a whole-file commit.

提交前核对 owned paths 与已暂存内容。显式路径提交保留其他文件的暂存状态，但会提交这些路径的工作树内容，不保留文件内的 hunk 选择。若同一文件混有其他任务或用户修改，必须使用调用方已验证的 hunk/index 隔离方案，或停止该组提交。不得 reset/stash 用户暂存区；遵循 `skills/spec-commit-push-pr/references/commit-and-push.md` 的同一边界。

### Step 5: Confirm

Run `git status` after the commit to verify success. Report the commit hash(es) and subject line(s).
