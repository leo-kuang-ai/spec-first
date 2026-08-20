---
name: spec-commit-push-pr
description: Internal landing helper for public workflows that already hold explicit commit and landing authorization; commits scoped changes, pushes, and creates or updates a PR with a value-first description.
user-invocable: false
argument-hint: "[PR ref] [mode:pipeline] [archive:on|off]"
---

# Git Commit, Push, and PR

Go from working changes to an open pull request, rewrite an existing PR description, or generate a description without touching git state.

## Invocation And Authorization Boundary

This is an internal-only helper. A public workflow may delegate the full commit/push/PR path only after the current user or a visible upstream handoff has established both `commit_authorization: authorized` and `landing_authorization: authorized`. `workflow invocation does not authorize commit, push, or PR creation`; `mode:pipeline`, tool permission, a feature branch, a green test suite, or an existing PR are execution facts, not authority. Missing commit authority stops before staging/commit with `commit_authorization_missing`; missing landing authority stops before push or PR mutation with `landing_authorization_missing`.

Description-only generation remains non-mutating, but applying a description with `gh pr edit` is a landing mutation and still requires explicit landing authority. This helper never broadens the caller's run-owned file scope or absorbs unrelated dirty paths.

**Asking the user:** When this skill says "ask the user", use the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded) or `request_user_input` in Codex. Fall back to presenting the question in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question.

## Mode detection

Three flavors of intent. Pick one and follow the matching path; otherwise default to the full workflow.

- **Description-only generation.** If the user asked for *just* a PR description with no commit or push intent (e.g., "write a PR description", "draft a PR description for this branch", "describe this PR", or pasted a PR URL/number alone), skip Steps 4-5 AND Step 1's decision tree (its stop gates are full-workflow only and would terminate common cases like "feature branch, all pushed, open PR -> stop"). Use the data from the Context section above instead. Then go to Step 6 to compose. If the user pasted a PR URL/number, pass it to Step 6 as the PR ref so Pre-A resolves the right commit range (otherwise Pre-A defaults to current-branch mode). Print the result back to the user; apply via `gh pr edit`/`gh pr create` only if the user asks.
- **Description update on existing PR.** If the user is asking to update, refresh, or rewrite an existing PR description (with no mention of committing or pushing), follow the Description Update workflow below. The user may also provide a focus (e.g., "update the PR description and add the benchmarking results"). Note any focus for DU-3.
- **Full workflow.** Otherwise, follow the Full workflow below.

**`mode:pipeline` modifier:** Set by orchestrated callers such as `spec-lfg`. Run the resolved mode non-interactively and suppress every blocking ask. The existing-PR rewrite question defaults to **not rewriting**; in description-update mode the preview ask is skipped and the rewrite applies directly because the update invocation is already the apply intent. Any other suppressed ask takes its conservative documented default: keep the current branch when possible, and stop/report instead of guessing when a base, PR, or branch state cannot be resolved. After an authorized full-workflow landing, return a structured `watch_handoff` containing the PR number/URL, head SHA, base ref/SHA when available, and the caller's existing authorization source and scope. This handoff lets the pipeline owner enter its bounded review/CI/head/base-currency watch; it grants no new authority. Ordinary standalone and description-only runs do not start or recommend a watch by default.

The landing disclosure for `mode:pipeline` includes bounded PR-feedback fixes and only a repo-policy-approved, non-rewriting branch-currency update. This helper never authorizes or performs merge, rebase, force-push, or history rewrite as part of that handoff. If the repository policy is absent or currency requires rewriting history, return `branch-currency-update-required` to the caller.

## Context

**On platforms other than Claude Code**, skip to the "Context fallback" section below and run the command there to gather context.

**In Claude Code**, the six labeled sections below contain pre-populated data. Use them directly -- do not re-run these commands.

**Git status:**
!`git status`

**Working tree diff:**
!`git diff HEAD`

**Current branch:**
!`git branch --show-current`

**Recent commits:**
!`git log --oneline -10`

**Remote default branch:**
!`git rev-parse --abbrev-ref origin/HEAD`

**Existing PR check:**
!`gh pr view --json url,title,state`

### Context fallback

**In Claude Code, skip this section — the data above is already available.**

Run these commands separately to gather context without interleaving unrelated output:

```bash
git status
git diff HEAD
git branch --show-current
git log --oneline -10
git rev-parse --abbrev-ref origin/HEAD 2>/dev/null || echo 'DEFAULT_BRANCH_UNRESOLVED'
gh pr view --json url,title,state 2>/dev/null || echo 'NO_OPEN_PR'
```

---

## Description Update workflow

### DU-1: Confirm intent

Ask the user: "Update the PR description for this branch?" If declined, stop.

### DU-2: Find the PR

Use the current branch and existing PR check from context. If the current branch is empty (detached HEAD), report no branch and stop. If the PR check returned `state: OPEN`, note the PR `url` and proceed to DU-3. Otherwise, report no open PR and stop.

### DU-3: Write and apply the updated description

**Read `references/pr-description-writing.md` once now** — the core principle at the top governs every step. DU-3 walks through Pre-A then Steps A through H without re-reading. Run Pre-A in PR mode using the existing PR's URL from DU-2 (it resolves the commit range, diff, and current body). Then continue with Steps A through H from the already-loaded reference to compose the title and body. If the user provided focus (e.g., "include the benchmarking results"), apply it as steering — do not let it override the writing principles or fabricate content the diff does not support.

**Evidence decision:** the writing reference preserves any existing `## Demo` or `## Screenshots` block from the current body by default. If the user's focus asks to refresh or remove evidence, honor that. If no evidence block exists and one would benefit the reader, ask for an existing URL/path or state that evidence capture is not available in this workflow.

**Compare and confirm.** Briefly explain what the new description covers differently from the old one. Ask the user to confirm before applying. If the user provided focus, confirm it was addressed.

If confirmed, apply with `gh pr edit`. Substitute `<TITLE>` verbatim; if it contains `"`, `` ` ``, `$`, or `\`, escape them or switch to single quotes.

The body **must** be written to a temp file and passed via `--body-file <path>`. Never use `--body-file -`, stdin pipes, heredoc-to-stdin, or `--body "$(cat ...)"` — wrappers and stdin handling can silently produce an empty PR body while `gh` still exits 0 and returns a URL.

```bash
BODY_FILE=$(mktemp "${TMPDIR:-/tmp}/spec-pr-body.XXXXXX")
```

Use the platform's file-write tool to write the composed body markdown to `$BODY_FILE` verbatim. Do not embed the body in a shell heredoc, stdin pipe, command substitution, or inline shell string.

```bash
gh pr edit --title "<TITLE>" --body-file "$BODY_FILE"
```

Report the PR URL.

---

## Full workflow

### Step 1: Gather context

Use the context above. All data needed for this step and Step 3 is already available -- do not re-run those commands.

The remote default branch value returns something like `origin/main`. Strip the `origin/` prefix. If it returned `DEFAULT_BRANCH_UNRESOLVED`, an error, or a bare `HEAD`, try:

```bash
gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'
```

If both fail, fall back to `main`.

If the current branch is empty (detached HEAD), explain that a branch is required. Ask whether to create a feature branch now.
- If yes, derive a branch name from the change content, validate it with `git check-ref-format --branch "$BRANCH_NAME"`, create with `git checkout -b "$BRANCH_NAME"`, and use that for the rest of the workflow.
- If no, stop.

If the working tree is clean (no staged, modified, or untracked files), determine the next action:

1. Run `git rev-parse --abbrev-ref --symbolic-full-name @{u}` to check upstream.
2. If upstream exists, run `git log <upstream>..HEAD --oneline` for unpushed commits.

Decision tree:

- **On default branch, unpushed commits or no upstream** -- pushing default directly is not supported. Ask whether to create a feature branch. If yes, read `references/branch-creation.md`, follow its decision flow, then continue from Step 5. If no, stop.
- **On default branch, all pushed, no open PR** -- report no feature branch work. Stop.
- **Feature branch, no upstream** -- skip Step 4, continue from Step 5.
- **Feature branch, unpushed commits** -- skip Step 4, continue from Step 5.
- **Feature branch, all pushed, no open PR** -- skip Steps 4-5, continue from Step 6.
- **Feature branch, all pushed, open PR** -- report up to date. Stop.

### Step 2: Determine conventions

Priority order for commit messages and PR titles:

1. **Repo conventions in context** -- follow project instructions if they specify conventions. Do not re-read; they load at session start.
2. **Recent commit history** -- match the pattern in the last 10 commits.
3. **Default** -- `type(scope): description` (conventional commits).

When using conventional commits, choose the type that most precisely describes the change. Where `fix:` and `feat:` both seem to fit, default to `fix:`: a change that remedies broken or missing behavior is `fix:` even when implemented by adding code. Reserve `feat:` for capabilities the user could not previously accomplish. Other types (`chore:`, `refactor:`, `docs:`, `perf:`, `test:`, `ci:`, `build:`, `style:`) remain primary when they fit better. The user may override for a specific change.

### Step 3: Check for existing PR

Use the current branch and existing PR check from context. If the branch is empty, report detached HEAD and stop.

If the PR check returned `state: OPEN`, note the URL -- this is the existing-PR flow. Continue to Step 4 and 5 (commit any pending work and push), then go to Step 7 to ask whether to rewrite the description. Only run Step 6 if the user confirms the rewrite. Otherwise (no open PR), continue through Steps 6, 7, and 8 in order.

### Step 4: Branch, stage, and commit

1. If on the default branch, branch creation must handle stale local base state, unpushed commits on local `<base>`, and uncommitted checkout collisions. Read `references/branch-creation.md` and follow its decision flow, then continue to step 2 below.
2. Scan changed files for naturally distinct concerns. If files clearly group into separate logical changes, create separate commits (2-3 max). Group at the file level only (no `git add -p`). When ambiguous, one commit is fine.
3. Stage and commit each group. Avoid `git add -A` or `git add .`. Follow conventions from Step 2 and use `-F` for the message body:
   ```bash
   COMMIT_MSG=$(mktemp "${TMPDIR:-/tmp}/spec-commit-message.XXXXXX")
   cat > "$COMMIT_MSG" <<'EOF'
   commit message here
   EOF
   git add file1 file2 file3
   git commit -F "$COMMIT_MSG"
   ```

### Step 5: Push

```bash
git push -u origin HEAD
```

### Step 6: Generate the PR title and body

The working-tree diff from Step 1 only shows uncommitted changes at invocation time. The PR description must cover **all commits** in the PR.

**Read `references/pr-description-writing.md` once now** — the core principle at the top governs every step. Step 6 walks through it in order (Pre-A through H) with one interruption (the evidence decision below). Do not re-read the file later; refer to it by step letter.

**Resolve the commit range and diff.** Run Step Pre-A from the reference (current-branch mode by default; PR mode if a PR ref was passed in from description-only mode). Pre-A handles base detection, in-repo SHA fetching with the `refs/pull/N/head` fallback, and the API-only fallback for fork-PRs and any local-git failure. Use Pre-A's commit list and diff (not Step 1's working-tree diff or `git log -10`) for both the evidence decision below and the rest of the reference.

**Evidence decision (before composition).** Before running the full decision, two short-circuits:

1. **User explicitly asked for evidence.** If the user's invocation requested it ("ship with a demo", "include a screenshot"), proceed directly to capture. If capture turns out to be not possible (no runnable surface, missing credentials, docs-only diff) or clearly not useful, note that briefly and proceed without evidence — do not force capture for its own sake.

2. **Agent judgment on authored changes.** If you authored the commits in this session and know the change produces no material claim a reviewer needs evidence for (internal plumbing, backend refactor without user-facing effect, type-level changes, inert documentation, pure refactors), skip the prompt without asking. Classify by runtime purpose, not extension: markdown or YAML that acts as runtime agent instructions, configuration, generated product content, policy code, or deployment behavior is not auto-skippable.

Otherwise, run the full decision: if the branch diff changes behavior or makes a material claim a reviewer cannot establish from the diff alone (UI, CLI output, API behavior with runnable code, generated artifacts, workflow output, ranking/scoring logic, deployment/config behavior) and evidence is not otherwise blocked (unavailable credentials, paid services, deploy-only infrastructure, hardware), ask: "This PR has behavior or risk that would benefit from evidence. Include existing evidence in the PR description?"

- **Use existing evidence** -- ask for the URL or markdown embed, then splice it in as a `## Demo` section.
- **Skip** -- proceed with no evidence section.

When evidence would not change reviewer confidence (inert documentation, changelog-only edits, release metadata, test-only changes, or pure internal refactors), skip without asking.

**Concept teaching gate (before composition).** Use the repo root from context; if it is empty or shows a literal command string, resolve it at runtime with `git rev-parse --show-toplevel`. Read `<repo-root>/.spec-first/config.local.yaml` with the native file-read tool. Only an active, non-commented `pr_teaching_section:` key counts; lines starting with `#` are comments, and the shipped template documents optional keys as commented examples. The gate is off only when the active value is exactly `false`; a missing file, missing key, or any other value means the default is on. The same read resolves `pr_teaching_archive:` as archive eligibility only: an active value of exactly `true` makes archival available but does not authorize a repo write. A current-user `archive:on` invocation, or a visible upstream handoff that explicitly includes the exact explainer path set, establishes `archive_authorization: authorized`; config, teaching-section eligibility, commit authority, and landing authority do not. `archive:off` disables archival for the run.

- Gate **on** -- judge concept novelty and compose the section per Step B2 of the reference. The gate is single: when it is off, skip judgment, the section, Step 8 trailer and offer, and archival entirely.
- Gate **off** -- compose the description without any concept handling.

**Compose the title and body.** Continue with Steps A through H from the already-loaded reference (commit classification, evidence handling, concept judgment when the gate is on, narrative framing, sizing, writing voice and principles, visual communication, title format, body assembly, the plain-text Spec-First footer, and the compression pass). For an existing PR, the current body was already read in Pre-A.

### Step 7: Create or update the PR

Apply via `gh pr create` (new PR) or `gh pr edit` (existing PR). Substitute `<TITLE>` verbatim; if it contains `"`, `` ` ``, `$`, or `\`, escape them or switch to single quotes.

The body **must** be written to a temp file and passed via `--body-file <path>`. Never use `--body-file -`, stdin pipes, heredoc-to-stdin, or `--body "$(cat ...)"` — wrappers and stdin handling can silently produce an empty PR body while `gh` still exits 0 and returns a URL.

```bash
BODY_FILE=$(mktemp "${TMPDIR:-/tmp}/spec-pr-body.XXXXXX")
```

Use the platform's file-write tool to write the composed body markdown to `$BODY_FILE` verbatim. Do not embed the body in a shell heredoc, stdin pipe, command substitution, or inline shell string; arbitrary PR body text can contain delimiter-like or shell-sensitive content.

**Explainer archival.** This runs only in full workflow, with archive eligibility on, `archive_authorization: authorized`, a composed `## New concepts` section, and a body that will be applied by this run. Before any directory/file write, derive the final slug for every concept, show the exact repo-relative `docs/explainers/YYYY-MM-DD-<concept-slug>.md` paths (including which existing files would be overwritten), and add only those accepted paths to the caller exact write set. Missing authorization or an unaccepted path preview skips archival with `archive_authorization_missing`; it does not block the PR. A declined existing-PR rewrite, or a pipeline-defaulted no rewrite, skips archival entirely so no unlinked doc commit is left behind. All paths resolve from the repo root, never the CWD. With two taught concepts, write one file per concept and stage both in the single commit. Execute these transitions immediately before the `gh` create/edit call:

1. `git check-ignore -q docs/explainers/YYYY-MM-DD-<concept-slug>.md` from the repo root. The check works on not-yet-created paths. If the path is ignored, print a one-line warning and skip archival entirely, writing nothing and never using `git add -f`.
2. Only after the authorized preview, write the file, creating `docs/explainers/` if needed, with YAML frontmatter `title`, `date`, `input_shape: concept`, `subject`, and the teaching content. Overwrite an existing file only when that exact overwrite appeared in the accepted preview.
3. `git add` those file(s) only, commit with `docs(explainer): teach <concept>[, <concept>]`, and push. If the commit reports nothing to commit, the doc is already committed from a prior run; keep the link and continue.
4. Splice a head-branch blob URL per doc into the `## New concepts` section, then rewrite `$BODY_FILE` with the final composed body before applying.

If the doc write, commit, or push fails, warn and continue to PR creation or edit without the link. Never strand the flow between commit and PR.

#### New PR (no existing PR from Step 3)

```bash
test -s "$BODY_FILE" || { echo "ERROR: PR body file is empty"; exit 1; }
if grep -q '<the composed body markdown goes here, verbatim>' "$BODY_FILE"; then echo "ERROR: PR body placeholder was not replaced"; exit 1; fi
PR_URL=$(gh pr create --title "<TITLE>" --body-file "$BODY_FILE")
printf '%s\n' "$PR_URL"
gh pr view "$PR_URL" --json body --jq '.body' | grep -q '[^[:space:]]' || { echo "ERROR: PR body was empty after create"; exit 1; }
```

Keep the title under 72 characters; the writing reference already emits a conventional-commit title in that range.

#### Existing PR (found in Step 3)

The new commits are already on the PR from Step 5. Report the PR URL, then ask whether to rewrite the description.

- If **no** -- skip Step 6 entirely and finish. Do not run composition or evidence capture when the user declined the rewrite.
- If **yes**, perform these three actions in order. They are separate steps with a hand-off boundary between them -- do not stop between actions.
  1. Run Step 6 to compose the new title and body.
  2. **Preview and confirm.** Read the first two sentences of the Summary, plus the total line count. Ask the user (per the "Asking the user" convention at the top of this skill): "New title: `<title>` (`<N>` chars). Summary leads with: `<first two sentences>`. Total body: `<L>` lines. Apply?" The first two sentences of the Summary carry most of the reviewer's attention. If the user declines, they may pass focus text back for a regenerate; do not apply.
  3. If confirmed, apply with `gh pr edit`:

     ```bash
     test -s "$BODY_FILE" || { echo "ERROR: PR body file is empty"; exit 1; }
     if grep -q '<the composed body markdown goes here, verbatim>' "$BODY_FILE"; then echo "ERROR: PR body placeholder was not replaced"; exit 1; fi
     gh pr edit --title "<TITLE>" --body-file "$BODY_FILE"
     gh pr view --json body --jq '.body' | grep -q '[^[:space:]]' || { echo "ERROR: PR body was empty after edit"; exit 1; }
     ```

  Then report the PR URL (Step 8).

### Step 8: Report

Output the PR URL.

For an authorized full-workflow `mode:pipeline` landing, also return:

```yaml
watch_handoff:
  pr_number: <number>
  pr_url: <url>
  head_sha: <sha>
  base_ref: <ref-or-null>
  base_sha: <sha-or-null>
  authorization_source: <visible-upstream-source>
  authorization_scope: <visible-upstream-scope>
```

This is a fact-only handoff to the caller. It does not start a watch, retain
raw provider content, or authorize merge, rebase, force-push, history rewrite,
additional data egress, credentials, or external communication.

If a body applied by this run contains a `## New concepts` section, print one line after the PR URL in every mode: `New concepts: <name>[, <name>]`. In interactive full-workflow runs, follow it with one line per taught concept: `Run spec-explain <name> to go deeper.` Do not print the trailer when this run applied no body, including a rewrite that was declined or pipeline-defaulted to no, or when no PR exists.
