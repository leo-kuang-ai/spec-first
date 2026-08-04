# Branch Creation From Default Branch

When Step 4 fires on the default branch, the local `<base>` (for example local `main`) is not trustworthy as a feature-branch starting point.

Two failure modes drive the rule:

- **Stale-base contamination.** Another session, worktree, or background process may have advanced local `<base>` past `origin/<base>` with commits unrelated to this work. Branching from local HEAD would carry those into the new PR.
- **Forgot-to-branch.** The user authored real commits on local `<base>` intending them for a feature branch. Branching from `origin/<base>` would silently drop those commits from the new branch.

Local git state alone cannot distinguish these. The skill therefore surfaces the choice to the user when unpushed commits are present.

## Decision Flow

Run the steps in order. Each outcome determines whether the next step runs.

### 1. Fetch fresh remote base

```bash
BASE="<base>"
BRANCH_NAME="<branch-name>"
git check-ref-format --branch "$BASE" >/dev/null || { echo "ERROR: invalid base branch name: $BASE"; exit 1; }
git check-ref-format --branch "$BRANCH_NAME" >/dev/null || { echo "ERROR: invalid feature branch name: $BRANCH_NAME"; exit 1; }
git fetch --no-tags origin "$BASE"
```

- **Fetch succeeds:** continue to step 2.
- **Fetch fails:** skip to "Fetch failure fallback" below.

### 2. Check for unpushed local commits on `<base>`

```bash
git log "origin/$BASE"..HEAD --oneline
```

- **Empty output:** no unpushed commits; set `BASE_REF=origin/<base>` and continue to step 3.
- **Non-empty output:** unpushed commits exist on local `<base>`. Show the commit list and ask, using the platform's blocking question tool:

```text
Local `<base>` has N unpushed commits not on `origin/<base>`. Carry them onto the new feature branch, or leave them on local `<base>`?
```

Options:

- **Carry forward** — intent is "I forgot to branch first"; set `BASE_REF=HEAD`.
- **Leave on `<base>`** — intent is "stale-base contamination from another session"; set `BASE_REF=origin/<base>`.

If the blocking tool is unavailable and the workflow falls back to chat, wait for the user's reply. Never silently choose. Carrying unrelated commits into a PR is worse than asking again.

### 3. Create the feature branch

```bash
git checkout -b "$BRANCH_NAME" "$BASE_REF"
```

- **Checkout succeeds:** branch created; continue to Step 4.2 in `SKILL.md`.
- **Checkout fails because uncommitted changes would be overwritten:** use stash/retry/pop:

```bash
git stash push -u -m "spec-commit-push-pr: pre-branch $BRANCH_NAME"
git checkout -b "$BRANCH_NAME" "$BASE_REF"
git stash pop
```

If `git stash pop` reports conflicts, surface the conflict output and stash ref to the user for manual resolution. Do not attempt to auto-resolve conflicts.

This stash/retry/pop is only for checkout collisions. It is not a conflict-resolution mechanism.

## Fetch Failure Fallback

If `git fetch --no-tags origin "$BASE"` fails because of network, auth, or remote problems, base freshness cannot be verified and remote-relative unpushed-commit checks are unreliable. Do not silently branch from local HEAD.

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || true
```

- **If an upstream ref is available:** show `git log <upstream>..HEAD --oneline`, then ask the same blocking **Carry forward** vs **Leave on `<base>`** question before creating the branch. If the user chooses **Carry forward**, set `BASE_REF=HEAD`; if the user chooses **Leave on `<base>`**, stop because the fresh remote base could not be verified.
- **If no upstream ref is available:** stop and surface the fetch failure. Ask the user to fix network/auth and retry, or explicitly request a local-HEAD branch after acknowledging base freshness was not verified.

Only after that explicit acknowledgement may you run:

```bash
git checkout -b "$BRANCH_NAME" HEAD
```

Note in the user-facing summary that base freshness was not verified and that the user explicitly accepted local-HEAD branching.
