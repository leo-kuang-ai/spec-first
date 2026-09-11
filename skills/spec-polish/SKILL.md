---
name: spec-polish
description: "Start the dev server, inspect the feature in browser, and iterate on polish. Browser-interactive polish only: static code review belongs to spec-code-review and implementation planning to spec-plan — route such requests out by naming the destination skill, never by doing the work here."
disable-model-invocation: true
argument-hint: "[PR number, branch name, or blank for current branch]"
---

# Polish

Start the dev server, open the feature in a browser, and iterate. You use the feature, say what feels off, and fixes happen.

## Workflow Contract Summary

### When To Use
Use when a feature or branch is ready for hands-on browser polish: start its dev server, inspect the feature in browser, and make iterative UI/UX fixes from direct feedback.

### When Not To Use
Do not use for initial requirements, implementation planning, non-browser backend work, static code review, broad visual audits, or MCP setup/repair beyond the browser helper handoff. When routing out for one of these, name the destination skill explicitly in your reply (static code review belongs to `spec-code-review`) — recognizing the mismatch and then doing the excluded work anyway is adopting the wrong workflow, not a helpful fallback. A direct user request to do the excluded work inside this workflow ("帮我静态审查一下,不用起服务") is still a routing-out condition: name `spec-code-review`, do not run the review here — not even a partial, "quick pass" version of it.

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

## Prepare The Live Page

Before checkout, server discovery, startup, or browser handoff, read [Run preparation](references/run.md). It owns workspace safety, startup facts, server attribution, and the verified actual URL. Keep the mutation facts above in force. Do not enter the loop until the selected server is reachable.

## Phase 2: Iterate

This is the core loop. The user browses the feature and tells you what to improve. You fix it. Repeat until they're happy.

- When the user describes something to fix, that explicit request may authorize that bounded fix. Re-resolve `local_fix_authorization` for the requested change; when authorized, make only that scoped change and let the dev server hot-reload. When missing, describe the proposed fix without editing and return `local_fix_authorization_missing`.
- When the user asks to check something, invoke the internal `spec-test-browser` owner with `current target-origin:<verified-loopback-origin>` (retain the verified scheme, hostname, and port; strip the route into a separate action plan). Pass only the smallest repo-relative route/action plan needed for the check. `spec-polish` never constructs `agent-browser` argv or bypasses the owner's exact-origin, durable-effect, synthetic-input, private-evidence, or cleanup gates. Consume only structured route/step facts and private screenshot/inspection refs. If the owner returns `not_supported` or `not_run`, surface its reason code, recommend `spec-runtime-setup` when capability is missing, and continue the human browser loop without claiming automated inspection.
- When the user says they're done, stop the loop. If `commit_authorization: authorized`, use the internal `spec-commit` owner to commit only run-owned verified paths. Otherwise leave the changes uncommitted and return `commit_status: not-created` with reason `commit_authorization_missing`.

Return a compact closeout with changed paths, verification notes, `commit_status`, `landing_status`, and limitations. This workflow never infers push or PR authority from completion.

## References

Reference files (loaded on demand):
- `references/launch-json-schema.md` — launch.json schema + per-framework stubs
- `references/run.md` - workspace, server startup, and browser handoff
- `references/dev-server-detection.md` — port resolution documentation
- `references/dev-server-rails.md` — Rails dev-server defaults
- `references/dev-server-next.md` — Next.js dev-server defaults
- `references/dev-server-vite.md` — Vite dev-server defaults
- `references/dev-server-nuxt.md` — Nuxt dev-server defaults
- `references/dev-server-astro.md` — Astro dev-server defaults
- `references/dev-server-remix.md` — Remix dev-server defaults
- `references/dev-server-sveltekit.md` — SvelteKit dev-server defaults
- `references/dev-server-procfile.md` — Procfile-based dev-server defaults

The Bash tool's working directory is the user's project, not the skill directory, so a bare `scripts/<name>` path will not resolve — invoke each by the skill's own absolute path via `SKILL_DIR` (see `references/run.md`). Scripts:
- `scripts/read-launch-json.sh` — launch.json reader
- `scripts/detect-project-type.sh` — project-type classifier
- `scripts/resolve-package-manager.sh` — lockfile-based package-manager resolver
- `scripts/resolve-port.sh` — port resolution cascade
