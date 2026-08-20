---
name: spec-polish
description: "Start the dev server, inspect the feature in browser, and iterate on polish."
disable-model-invocation: true
argument-hint: "[PR number, branch name, or blank for current branch]"
---

# Polish

Start the dev server, open the feature in a browser, and iterate. You use the feature, say what feels off, and fixes happen.

## Workflow Contract Summary

### When To Use
Use when a feature or branch is ready for hands-on browser polish: start its dev server, inspect the feature in browser, and make iterative UI/UX fixes from direct feedback.

### When Not To Use
Do not use for initial requirements, implementation planning, non-browser backend work, static code review, broad visual audits, or MCP setup/repair beyond the browser helper handoff.

### Inputs
A PR number, branch name, or current branch; project dev-server conventions; feature URL/route when known; user feedback from browser inspection.

### Outputs
Running local dev server URL, browser handoff, authorized scoped polish edits, verification notes, and an explicit commit status.

### Artifacts
Authorized source edits in the user's project, dev-server log in temp space, optional browser screenshots/inspection notes, and a final commit only when separately authorized.

### Failure Modes
Wrong branch, main/master branch, missing branch-mutation authority, missing dev-server command, unresolved port, server startup failure, browser helper unavailable, or user feedback requiring upstream product/design decisions.

### Workflow
Select the branch, start the dev server, resolve the browser handoff, iterate on user-reported polish issues, and stop when the user says the loop is complete.

### Downstream Consumers
The user reviewing the browser result, `spec-work` for deeper implementation follow-up, and release/review workflows that consume the final branch changes.

## Mutation Authority Boundary

Before checkout or the first source edit, derive four independent run-local facts from the current user request and any visible upstream handoff:

```yaml
branch_mutation_authorization: authorized | missing
local_fix_authorization: authorized | missing
commit_authorization: authorized | missing
landing_authorization: authorized | missing
```

- A PR number or branch name selects review/polish scope; it does not authorize checkout. Set `branch_mutation_authorization: authorized` only when the current user or upstream owner explicitly requests the switch/worktree, or the user accepts the concrete checkout/isolation action after it is disclosed.
- Set `local_fix_authorization: authorized` only when the current user explicitly requests polishing/fixes or the upstream handoff explicitly owns local apply. A route recommendation, branch target, or tool permission is not mutation authority.
- Set `commit_authorization: authorized` only for an explicit commit request. `done` is a completion signal, not commit authorization.
- Set `landing_authorization: authorized` only for an explicit push/PR request. Without landing authorization, do not push and do not open a PR.
- These facts are non-transitive: local fixes do not imply checkout, commit, or landing; commit does not imply landing.

## Phase 0: Get on the right branch

1. If blank, use the current branch.
2. If a PR number or branch name was provided, resolve it as scope and probe for existing worktrees without switching. When it is not the current checkout:
   - with `branch_mutation_authorization: authorized`, use the explicitly approved existing-worktree/checkout action;
   - otherwise stop before mutation with `branch_mutation_authorization_missing`, name the current and requested refs, and ask the user to switch themselves or authorize the exact action.
3. Verify the selected checkout is not main/master.

## Phase 1: Start the dev server

The scripts below ship in this skill's `scripts/` directory. The Bash tool's working directory is the user's project, not the skill directory, so a bare `scripts/<name>` path will not resolve — invoke each by the skill's own absolute path. Every runnable block below sets `SKILL_DIR` inline (shell state does not persist between Bash tool calls, so each command must carry it); replace the `<absolute path …>` placeholder with the directory you loaded this `spec-polish` SKILL.md from before running.

### 1.1 Check for `.claude/launch.json`

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>";
bash "$SKILL_DIR/scripts/read-launch-json.sh"
```

If it finds a configuration, use it — the user already told us how to start the project.

### 1.2 Auto-detect (when no launch.json)

Identify the framework:

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>";
bash "$SKILL_DIR/scripts/detect-project-type.sh"
```

Route by type to the matching recipe reference for start command and port defaults:

| Type | Recipe |
|------|--------|
| `rails` | `references/dev-server-rails.md` |
| `next` | `references/dev-server-next.md` |
| `vite` | `references/dev-server-vite.md` |
| `nuxt` | `references/dev-server-nuxt.md` |
| `astro` | `references/dev-server-astro.md` |
| `remix` | `references/dev-server-remix.md` |
| `sveltekit` | `references/dev-server-sveltekit.md` |
| `procfile` | `references/dev-server-procfile.md` |
| `unknown` | Ask the user how to start the project |

For framework types that need a package manager, run the resolver and substitute the result into the start command:

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>";
bash "$SKILL_DIR/scripts/resolve-package-manager.sh"
```

Resolve the port:

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>";
bash "$SKILL_DIR/scripts/resolve-port.sh" --type <type>
```

### 1.3 Start the server

Start the dev server in the background, log output to a temp file. Probe `http://localhost:<port>` for up to 30 seconds. If it doesn't come up, show the last 20 lines of the log and ask the user what to do.

### 1.4 Open in browser

Load `references/ide-detection.md` for the env-var probe table. Open the browser using the IDE's mechanism (Claude Code → `open`, Cursor → Cursor browser, VS Code → Simple Browser).

Tell the user:
```
Dev server running on http://localhost:<port>
Browse the feature and tell me what could be better.
```

## Phase 2: Iterate

This is the core loop. The user browses the feature and tells you what to improve. You fix it. Repeat until they're happy.

- When the user describes something to fix, that explicit request may authorize that bounded fix. Re-resolve `local_fix_authorization` for the requested change; when authorized, make only that scoped change and let the dev server hot-reload. When missing, describe the proposed fix without editing and return `local_fix_authorization_missing`.
- When the user asks to check something → invoke the internal `spec-test-browser` owner with `current target-origin:http://127.0.0.1:<port>` (normalize the caller-owned server handoff to its exact loopback root before invoking). Pass only the smallest repo-relative route/action plan needed for the check. `spec-polish` never constructs `agent-browser` argv or bypasses the owner's exact-origin, durable-effect, synthetic-input, private-evidence, or cleanup gates. Consume only structured route/step facts and private screenshot/inspection refs. If the owner returns `not_supported` or `not_run`, surface its reason code, recommend `spec-runtime-setup` when capability is missing, and continue the human browser loop without claiming automated inspection.
- When the user says they're done, stop the loop. If `commit_authorization: authorized`, commit only run-owned verified paths. Otherwise leave the changes uncommitted and return `commit_status: not-created` with reason `commit_authorization_missing`.

Return a compact closeout with changed paths, verification notes, `commit_status`, `landing_status`, and limitations. This workflow never infers push or PR authority from completion.

## References

Reference files (loaded on demand):
- `references/launch-json-schema.md` — launch.json schema + per-framework stubs
- `references/ide-detection.md` — host IDE detection and browser-handoff
- `references/dev-server-detection.md` — port resolution documentation
- `references/dev-server-rails.md` — Rails dev-server defaults
- `references/dev-server-next.md` — Next.js dev-server defaults
- `references/dev-server-vite.md` — Vite dev-server defaults
- `references/dev-server-nuxt.md` — Nuxt dev-server defaults
- `references/dev-server-astro.md` — Astro dev-server defaults
- `references/dev-server-remix.md` — Remix dev-server defaults
- `references/dev-server-sveltekit.md` — SvelteKit dev-server defaults
- `references/dev-server-procfile.md` — Procfile-based dev-server defaults

Scripts (invoked via `bash "$SKILL_DIR/scripts/<name>"` — see Phase 1 for `SKILL_DIR`):
- `scripts/read-launch-json.sh` — launch.json reader
- `scripts/detect-project-type.sh` — project-type classifier
- `scripts/resolve-package-manager.sh` — lockfile-based package-manager resolver
- `scripts/resolve-port.sh` — port resolution cascade
