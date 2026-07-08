---
name: spec-worktree
description: Internal helper for public workflows that need an isolated git worktree for parallel feature work or PR review; use only when delegated by `spec-work`, `spec-code-review`, or another public workflow.
user-invocable: false
allowed-tools: Bash(bash *worktree-manager.sh*)
---

# Worktree Isolation

Detect whether the current checkout is already isolated, then create a worktree under `.worktrees/<branch>` only when creation is still needed. The bundled script adds branch-specific setup that `git worktree add` alone does not handle:

- Does not copy `.env*` files by default; `--copy-env` is an explicit opt-in for workflows that need local env files
- Trusts `mise`/`direnv` configs, with branch-aware safety rules so review branches do not auto-grant trust to untrusted `.envrc` content
- Adds `.worktrees` to `.gitignore` if not already ignored
- Does not modify the main repo checkout — `from-branch` is fetched, not checked out

## Step 0: Detect existing isolation

Before creating anything, invoke the bundled script with `detect --json` through the same `bash -c` wrapper whose command text includes `exec bash ...worktree-manager.sh`:

```bash
bash -c 'if [ -n "${CLAUDE_SKILL_DIR:-}" ]; then exec bash "$CLAUDE_SKILL_DIR/scripts/worktree-manager.sh" "$@"; fi; exec bash "$(git rev-parse --show-toplevel)"/"skills/spec-worktree/scripts/worktree-manager.sh" "$@"' _ detect --json
```

The output is the deterministic facts contract `spec-worktree-detect.v1`:

```json
{
  "schema_version": "spec-worktree-detect.v1",
  "state": "ordinary-checkout | linked-worktree | submodule | unknown",
  "reason_code": "same-git-dir | linked-worktree | submodule-superproject | not-git-repo | git-query-failed | output-contract-failed",
  "worktree_root": "<absolute path or null>",
  "main_worktree_root": "<absolute path or null>",
  "git_dir": "<resolved absolute path or null>",
  "common_dir": "<resolved absolute path or null>",
  "branch": "<current branch or null>"
}
```

`state=ordinary-checkout` and `state=submodule` mean creation may proceed if the workflow still needs isolation. For `state=submodule`, the new worktree is created under the submodule's own working tree (`<submodule-root>/.worktrees/<branch>`), not the superproject. `state=linked-worktree` means the current checkout is already isolated; report `worktree_root` and `branch`, then work in place instead of creating another worktree. `state=unknown` or any non-zero detect exit means stop and report `reason_code`; do not fall back to raw `git worktree add`.

The script computes this by comparing resolved absolute `--absolute-git-dir` and resolved absolute `--git-common-dir`. Equal paths are an ordinary checkout. Different paths plus non-empty `--show-superproject-working-tree` are a submodule. Different paths plus empty superproject output are an existing linked worktree.

`detect --json` requires `node` on `PATH` to serialize the facts. When `node` is missing the command still prints a parseable `state=unknown`/`reason_code=output-contract-failed` object and exits non-zero, so a consumer always gets a structured reason_code rather than empty output.

## Creating a worktree

Invoke the bundled script through a `bash -c` wrapper whose command text includes `exec bash ...worktree-manager.sh`. On Claude Code, `${CLAUDE_SKILL_DIR}` resolves to the skill's own runtime directory across marketplace-cached installs and local plugin development. In source or non-Claude runtime contexts, use the repo-root fallback path so generated Codex assets can rewrite it to the installed skill directory. This shape intentionally matches the narrow `allowed-tools` pattern.

```bash
bash -c 'if [ -n "${CLAUDE_SKILL_DIR:-}" ]; then exec bash "$CLAUDE_SKILL_DIR/scripts/worktree-manager.sh" "$@"; fi; exec bash "$(git rev-parse --show-toplevel)"/"skills/spec-worktree/scripts/worktree-manager.sh" "$@"' _ create [--copy-env] <branch-name> [from-branch]
```

Defaults:
- `from-branch` defaults to origin's default branch (or `main` if that cannot be resolved)
- The new branch is created at `origin/<from-branch>` (or the local ref if the remote is unavailable)
- `.env*` files are not copied unless `--copy-env` is passed

Examples:
```bash
bash -c 'if [ -n "${CLAUDE_SKILL_DIR:-}" ]; then exec bash "$CLAUDE_SKILL_DIR/scripts/worktree-manager.sh" "$@"; fi; exec bash "$(git rev-parse --show-toplevel)"/"skills/spec-worktree/scripts/worktree-manager.sh" "$@"' _ create feat/login
bash -c 'if [ -n "${CLAUDE_SKILL_DIR:-}" ]; then exec bash "$CLAUDE_SKILL_DIR/scripts/worktree-manager.sh" "$@"; fi; exec bash "$(git rev-parse --show-toplevel)"/"skills/spec-worktree/scripts/worktree-manager.sh" "$@"' _ create fix/email-validation develop
bash -c 'if [ -n "${CLAUDE_SKILL_DIR:-}" ]; then exec bash "$CLAUDE_SKILL_DIR/scripts/worktree-manager.sh" "$@"; fi; exec bash "$(git rev-parse --show-toplevel)"/"skills/spec-worktree/scripts/worktree-manager.sh" "$@"' _ create --copy-env feat/local-env
```

After creation, switch to the worktree with `cd .worktrees/<branch-name>`.

The `create` command consumes the same detection function before creating `.worktrees/<branch>` or running `git worktree add`. It refuses `linked-worktree`, `unknown`, `not-git-repo`, `git-query-failed`, and `output-contract-failed` states so this helper cannot create nested or invisible worktrees by bypassing Step 0.

## Env File Opt-In

Use `--copy-env` only when the workflow explicitly needs local environment files in the new worktree. The opt-in path copies `.env*` files except `.env.example`, `.env.template`, and `.env.sample`, prints only file names, backs up pre-existing destination files, and appends `.env-copy.log` with timestamp, source path, destination path, byte size, and an 8-character content fingerprint. The log does not include file contents and is added to the worktree git exclude file.

Even when env files were copied intentionally, downstream staging must still treat them as denied by default. A batch may stage an env file only when the task/implementation unit declares the exact env path in `expected_side_effects` and explicitly states that changing that env file is intended.

## Other worktree operations

Use `git` directly — no wrapper is needed and none is provided:

```bash
git worktree list                          # list worktrees
git worktree remove .worktrees/<branch>    # remove a worktree
cd .worktrees/<branch>                     # switch to a worktree
cd "$(git rev-parse --show-toplevel)"      # return to main checkout
```

Do not manually copy `.env*` files as a default setup step. If an existing worktree needs env files, recreate it with `--copy-env` or copy files manually only after a human explicitly opts in and records the same file-name-only audit information.

## Dev tool trust behavior

When mise or direnv configs are present, the script attempts to trust them so hooks and scripts do not block on interactive prompts. Trust is baseline-checked against a reference branch:

- **Trusted base branches** (`main`, `develop`, `dev`, `trunk`, `staging`, `release/*`): the new worktree's configs are compared against that branch; unchanged configs are auto-trusted. `direnv allow` is permitted.
- **Other branches** (feature branches, PR review branches): configs are compared against the default branch; `direnv allow` is skipped regardless, because `.envrc` can source files that direnv does not validate.

Modified configs are never auto-trusted. The script prints the manual trust command to run after review.

## When to create a worktree

Create a worktree when:
- Reviewing a PR while keeping the main checkout free for other work
- Running multiple features in parallel without branch-switching overhead
- Keeping the default branch free of in-progress state

Do not create a worktree for single-task work that can happen on a branch in the main checkout, and never create one when Step 0 reports `state=linked-worktree`.

## Integration

`spec-work` and `spec-code-review` offer this skill as an option. When the user selects "worktree" in those flows, run Step 0 first. If isolation already exists, proceed in place. Otherwise invoke `create` through the same `${CLAUDE_SKILL_DIR}` branch plus source/runtime fallback shown above, using a meaningful branch name derived from the work description (e.g., `feat/crowd-sniff`, `fix/email-validation`). Avoid auto-generated names like `worktree-jolly-beaming-raven` that obscure the work.

## Troubleshooting

**"Worktree already exists"**: the path is already in use. Either switch to it (`cd .worktrees/<branch>`) or remove it (`git worktree remove .worktrees/<branch>`) before recreating.

**"Cannot remove worktree: it is the current worktree"**: `cd` out of the worktree first, then `git worktree remove`.

**Dev tool trust was skipped**: the script prints the manual command. Review the config diff (`git diff <base-ref> -- .envrc`), then run the printed command from the worktree directory.
