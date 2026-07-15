---
name: "source-command-spec-polish"
description: "Start the dev server and iterate on browser-visible polish"
---

# source-command-spec-polish

Use this skill when the user asks to run the migrated source command `spec-polish`.

## Command Template

Command support root: `.Codex/spec-first/workflows/spec-polish`. Treat it as the loaded skill directory whenever this inlined workflow refers to `SKILL_DIR` or the directory containing `SKILL.md`.

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
Running local dev server URL, browser handoff, scoped polish edits, verification notes, and a commit when the user says the polish loop is done.

### Artifacts
Source edits in the user's project, dev-server log in temp space, optional browser screenshots/inspection notes, and the final commit if requested by the loop.

### Failure Modes
Wrong branch, main/master branch, missing dev-server command, unresolved port, server startup failure, browser helper unavailable, or user feedback requiring upstream product/design decisions.

### Workflow
Select the branch, start the dev server, resolve the browser handoff, iterate on user-reported polish issues, and stop when the user says the loop is complete.

### Downstream Consumers
The user reviewing the browser result, `spec-work` for deeper implementation follow-up, and release/review workflows that consume the final branch changes.

## Phase 0: Get on the right branch

1. If a PR number or branch name was provided, check it out (probe for existing worktrees first).
2. If blank, use the current branch.
3. Verify the current branch is not main/master.

## Phase 1: Start the dev server

The scripts below ship in this skill's `scripts/` directory. The Bash tool's working directory is the user's project, not the skill directory, so a bare `scripts/<name>` path will not resolve — invoke each by the skill's own absolute path. Every runnable block below sets `SKILL_DIR` inline (shell state does not persist between Bash tool calls, so each command must carry it); replace the `<absolute path …>` placeholder with the directory you loaded this `spec-polish` SKILL.md from before running.

### 1.1 Check for `.Codex/launch.json`

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/read-launch-json.sh"
```

If it finds a configuration, use it — the user already told us how to start the project.

### 1.2 Auto-detect (when no launch.json)

Identify the framework:

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/detect-project-type.sh"
```

Route by type to the matching recipe reference for start command and port defaults:

| Type | Recipe |
|------|--------|
| `rails` | `.Codex/spec-first/workflows/spec-polish/references/dev-server-rails.md` |
| `next` | `.Codex/spec-first/workflows/spec-polish/references/dev-server-next.md` |
| `vite` | `.Codex/spec-first/workflows/spec-polish/references/dev-server-vite.md` |
| `nuxt` | `.Codex/spec-first/workflows/spec-polish/references/dev-server-nuxt.md` |
| `astro` | `.Codex/spec-first/workflows/spec-polish/references/dev-server-astro.md` |
| `remix` | `.Codex/spec-first/workflows/spec-polish/references/dev-server-remix.md` |
| `sveltekit` | `.Codex/spec-first/workflows/spec-polish/references/dev-server-sveltekit.md` |
| `procfile` | `.Codex/spec-first/workflows/spec-polish/references/dev-server-procfile.md` |
| `unknown` | Ask the user how to start the project |

For framework types that need a package manager, run the resolver and substitute the result into the start command:

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/resolve-package-manager.sh"
```

Resolve the port:

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/resolve-port.sh" --type <type>
```

### 1.3 Start the server

Start the dev server in the background, log output to a temp file. Probe `http://localhost:<port>` for up to 30 seconds. If it doesn't come up, show the last 20 lines of the log and ask the user what to do.

### 1.4 Open in browser

Load `.Codex/spec-first/workflows/spec-polish/references/ide-detection.md` for the env-var probe table. Open the browser using the IDE's mechanism (Codex → `open`, Cursor → Cursor browser, VS Code → Simple Browser).

Tell the user:
```
Dev server running on http://localhost:<port>
Browse the feature and tell me what could be better.
```

## Phase 2: Iterate

This is the core loop. The user browses the feature and tells you what to improve. You fix it. Repeat until they're happy.

- When the user describes something to fix → make the change, the dev server hot-reloads
- When the user asks to check something → use a browser-automation capability to screenshot or inspect the page; prefer `agent-browser` if it's installed. If it is missing, tell them: "Browser automation helper unavailable. Run `spec-runtime-setup` to see the current `agent-browser` install command, install it manually if browser automation is needed, then continue. This does not block spec-first baseline." Continue the human browser loop when automated screenshots are unavailable.
- When the user says they're done → commit the fixes and stop

No checklist. No envelope. Just conversation.

## References

Reference files (loaded on demand):
- `.Codex/spec-first/workflows/spec-polish/references/launch-json-schema.md` — launch.json schema + per-framework stubs
- `.Codex/spec-first/workflows/spec-polish/references/ide-detection.md` — host IDE detection and browser-handoff
- `.Codex/spec-first/workflows/spec-polish/references/dev-server-detection.md` — port resolution documentation
- `.Codex/spec-first/workflows/spec-polish/references/dev-server-rails.md` — Rails dev-server defaults
- `.Codex/spec-first/workflows/spec-polish/references/dev-server-next.md` — Next.js dev-server defaults
- `.Codex/spec-first/workflows/spec-polish/references/dev-server-vite.md` — Vite dev-server defaults
- `.Codex/spec-first/workflows/spec-polish/references/dev-server-nuxt.md` — Nuxt dev-server defaults
- `.Codex/spec-first/workflows/spec-polish/references/dev-server-astro.md` — Astro dev-server defaults
- `.Codex/spec-first/workflows/spec-polish/references/dev-server-remix.md` — Remix dev-server defaults
- `.Codex/spec-first/workflows/spec-polish/references/dev-server-sveltekit.md` — SvelteKit dev-server defaults
- `.Codex/spec-first/workflows/spec-polish/references/dev-server-procfile.md` — Procfile-based dev-server defaults

Scripts (invoked via `bash "$SKILL_DIR/scripts/<name>"` — see Phase 1 for `SKILL_DIR`):
- `.Codex/spec-first/workflows/spec-polish/scripts/read-launch-json.sh` — launch.json reader
- `.Codex/spec-first/workflows/spec-polish/scripts/detect-project-type.sh` — project-type classifier
- `.Codex/spec-first/workflows/spec-polish/scripts/resolve-package-manager.sh` — lockfile-based package-manager resolver
- `.Codex/spec-first/workflows/spec-polish/scripts/resolve-port.sh` — port resolution cascade
