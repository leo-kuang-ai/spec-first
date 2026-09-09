# Prepare The Live Page

Read before workspace selection, startup, or browser handoff. This reference owns preparation; the entrypoint owns authorization and the user-directed polish loop.

## Select The Workspace

With no target, stay in the current checkout. For a PR or branch, inspect existing worktrees first. A target alone grants no branch mutation authority. With the entrypoint's branch authorization, use the selected existing worktree or an available safe checkout capability; do not check out a branch already owned by another worktree, move user changes, or silently create another worktree. Stop with the concrete missing capability or authorization when necessary.

Reject detached HEAD, main/master, and the repository's actual default branch. Determine that default from current repository configuration or remote metadata; an unresolved branch identity blocks checkout/startup.

## Resolve Startup Facts

Set `SKILL_DIR` to the absolute directory containing the loaded Skill in each independent shell call. Shell variables do not persist across tool calls.

```bash
SKILL_DIR="<absolute directory containing spec-polish SKILL.md>"
bash "$SKILL_DIR/scripts/read-launch-json.sh"
```

Resolve one tuple: command, working directory, environment, and numeric port. A selected configuration supplies `runtimeExecutable` plus `runtimeArgs`, repo-relative `cwd` (default repo root), and `env` (augment inherited environment). Preserve every usable selected fact. A complete tuple skips classification, recipes, package-manager resolution, and port resolution.

- `__NO_LAUNCH_JSON__` or `__MISSING_CONFIGURATIONS__`: derive missing facts.
- `__MULTIPLE_CONFIGS__`: present the returned names, obtain the user's selection, then rerun the reader with that name.
- `__INVALID_LAUNCH_JSON__`, `__CONFIG_NOT_FOUND__`, an operational error, or an unusable selected field: report the problem and resolve it before startup.

Classify only when an unresolved command or port requires a framework. Use the selected cwd, or the repository root if none was selected:

```bash
SKILL_DIR="<absolute directory containing spec-polish SKILL.md>"
bash "$SKILL_DIR/scripts/detect-project-type.sh" "<classification-root>"
```

The root must be physically inside the repository. `<type>` names the classification root; `<type>@<relative-dir>` names a subdirectory relative to that root. For `multiple` or `multiple:...`, obtain the intended project selection. For `unknown`, ask only for unresolved facts. Never substitute a guessed command or default port after an unresolved/error result.

Only when the command is missing, read the matching `dev-server-<type>.md` recipe (rails, next, vite, nuxt, astro, remix, sveltekit, or procfile). Resolve a package manager only if needed by that recipe. Resolve a port only if missing; read [Port detection](dev-server-detection.md). Run each resolver against the selected project directory, and do not replace an already selected command, cwd, or environment:

```bash
SKILL_DIR="<absolute directory containing spec-polish SKILL.md>"
bash "$SKILL_DIR/scripts/resolve-package-manager.sh" "<project-root>"
```

```bash
SKILL_DIR="<absolute directory containing spec-polish SKILL.md>"
bash "$SKILL_DIR/scripts/resolve-port.sh" "<project-root>" --type "<base-type>"
```

Validate the completed port as an integer from 1 to 65535. Once all facts are usable, continue. Offer to persist a derived tuple once; write it only with authorization after reading [Launch schema](launch-json-schema.md). Save resolved facts, not untouched template defaults.

## Select One Server And Verify Its URL

Inspect the selected port. Reuse an existing instance only when process/session evidence identifies the intended project, command, and cwd. An unattributed occupied port is a collision: resolve it with the user before proceeding. Never kill an unrelated process or launch past the collision.

If no intended instance exists, start the resolved command with the selected cwd and environment in the background. Preserve its process/session handle and put logs in a private temporary directory owned by this run. Keep reused instances separate from run-owned processes and logs.

Use `http://localhost:<port>` only as an initial URL candidate. Server output or a user correction can replace it, including with HTTPS or an incremented port. Probe the actual URL for up to 30 seconds and attribute the response to the selected instance; a response from another process does not establish readiness. Do not enter the polish loop without that attribution.

On failure, report diagnostics for the selected instance. Show the last 20 log lines only when this run launched it and owns the log. Resolve a corrected URL/configuration or stop.

On success, use an available browser-opening capability with the verified actual URL. Do not infer IDE-specific URL schemes from environment variables. If opening is unavailable or fails, print the URL and continue the human browser loop. Automated inspection still belongs to the entrypoint's `spec-test-browser` handoff.
