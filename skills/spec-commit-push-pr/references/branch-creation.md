# Branch Creation From Default Branch

When Step 4 fires on the default branch, the local `<base>` (for example local `main`) is not trustworthy as a feature-branch starting point.

Two failure modes drive the rule:

- **Stale-base contamination.** Another session, worktree, or background process may have advanced local `<base>` past the confirmed remote base with commits unrelated to this work. Branching from local HEAD would carry those into the new PR.
- **Forgot-to-branch.** The user authored real commits on local `<base>` intending them for a feature branch. Branching from the confirmed remote base would silently drop those commits from the new branch.

Local git state alone cannot distinguish these. The skill therefore surfaces the choice to the user when unpushed commits are present.

## Decision Flow

Run the steps in order. Each outcome determines whether the next step runs.

### 1. Fetch fresh remote base

Resolve the exact base repository and matching fetch remote from `context.md`; `origin` is not necessarily the upstream repository. Run each command separately with literal argv values, inspecting its exit status before the next dependent call:

```text
git check-ref-format --branch <base>
git check-ref-format --branch <branch-name>
git fetch --no-tags <base-remote> refs/heads/<base>
git rev-parse --verify FETCH_HEAD
```

The final call runs only after a successful single-ref fetch. Capture that exact commit as `<fresh-base-sha>` before another fetch; do not substitute an older remote-tracking ref. Failed validation stops before fetch/checkout.

- **Fetch succeeds:** continue to step 2.
- **Fetch fails:** skip to "Fetch failure fallback" below.

### 2. Check for unpushed local commits on `<base>`

```text
git log <fresh-base-sha>..HEAD --oneline
```

- **Empty output:** no unpushed commits; select `<fresh-base-sha>` as `<base-ref>` and continue to step 3.
- **Non-empty output:** unpushed commits exist on local `<base>`. Consume any already-settled carry-forward decision for this exact commit set. If unresolved, show the commit list and ask, using the platform's blocking question tool:

```text
Local `<base>` has N commits absent from the fetched `<base-remote>/<base>`. Carry them onto the new feature branch, or leave them on local `<base>`?
```

Options:

- **Carry forward** — intent is "I forgot to branch first"; select the captured current HEAD as `<base-ref>`.
- **Leave on `<base>`** — intent is "stale-base contamination from another session"; select `<fresh-base-sha>` as `<base-ref>`.

If the blocking tool is unavailable and the workflow falls back to chat, wait for the user's reply. Never silently choose. Carrying unrelated commits into a PR is worse than asking again.

### 3. Create the feature branch

Before checkout, capture the current branch/HEAD, index entries and staged diff,
unstaged diff, and task-owned untracked paths/content. This is a recovery baseline,
not permission to modify unrelated state.

```text
git checkout --no-overwrite-ignore -b <branch-name> <base-ref>
```

- **Checkout succeeds:** branch created; re-read branch/HEAD and continue through the caller's `commit-and-push.md` checkpoint.
- **Checkout fails because uncommitted changes would be overwritten:** This includes ignored-file collisions; `--no-overwrite-ignore` prevents overwriting that local content. Stop and return blocked to the caller. Re-read branch/HEAD, index and working-tree state against the baseline; report the collision and any observed difference. Preserve staged/unstaged selection, partial-file edits, unrelated work, and untracked content. Do not automatically stash, reset, clean, force checkout, or retry the branch switch.

The caller may choose an isolated worktree with an explicitly scoped transfer,
or arrange a safe checkout after preserving the current work. Such recovery
requires its own concrete scope and verification; landing authorization alone
does not authorize hiding or moving unrelated changes. In pipeline mode return
the blocker and recovery options without guessing, waiting, or resolving user
conflicts automatically.

## Fetch Failure Fallback

If the exact-base fetch fails because of network, auth, or remote problems, base freshness cannot be verified and remote-relative unpushed-commit checks are unreliable. Do not silently branch from local HEAD.

```text
git rev-parse --abbrev-ref --symbolic-full-name @{u}
```

A nonzero exit means unresolved upstream; inspect it directly rather than masking failure.

- **If an upstream ref is available:** show `git log <upstream>..HEAD --oneline`, then ask the same blocking **Carry forward** vs **Leave on `<base>`** question before creating the branch. If the user chooses **Carry forward**, select the captured current HEAD as `<base-ref>`; if the user chooses **Leave on `<base>`**, stop because the fresh remote base could not be verified.
- **If no upstream ref is available:** stop and surface the fetch failure. Ask the user to fix network/auth and retry, or explicitly request a local-HEAD branch after acknowledging base freshness was not verified.

Only after that explicit acknowledgement may you run:

```text
git checkout --no-overwrite-ignore -b <branch-name> HEAD
```

Note in the user-facing summary that base freshness was not verified and that the user explicitly accepted local-HEAD branching.
