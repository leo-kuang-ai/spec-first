# Committing the refresh

## Phase 5: Commit Changes

After all actions are executed and the report is generated, close out Git state without widening authority. Skip this phase if no files were modified (all Keep, or all writes failed).

### Detect git context

Before any Git action, check:
1. Which branch is currently checked out (main/master vs feature branch)
2. Whether the working tree has other uncommitted changes beyond what compound-refresh modified
3. Recent commit messages to match the repo's commit style
4. The exact files modified by this run and whether any pre-existing dirty hunks overlap them

### Missing commit authorization

When `commit_authorization: missing`, do not create/switch a branch, stage, commit, push, or open a PR. Leave verified refresh edits uncommitted and include:

- `commit_status: not-created`
- `commit_reason: commit_authorization_missing`
- the exact uncommitted paths
- one logical commit candidate message for a later authorized owner

Headless mode never asks for authority and therefore follows this path unless the visible upstream handoff explicitly supplied commit authorization.

### Authorized commit

When `commit_authorization: authorized`, Stage only compound-refresh-owned verified paths. Never stage unrelated dirty paths. A pre-existing overlapping dirty hunk requires an explicit bounded preservation decision; otherwise leave the refresh uncommitted instead of guessing ownership.

On main/master/default branch, commit authorization alone does not authorize branch creation or direct default-branch commit. Require the current user to name the intended branch/default-branch action explicitly; otherwise keep the changes uncommitted.

On an existing feature branch, create one isolated commit only after the refresh checks pass. Report the commit SHA and exact paths.

### Landing authority

`commit_authorization` never implies `landing_authorization`. Without landing authorization, stop after the local commit and do not push or open/update a PR. With explicit landing authorization, push only the authorized branch and create/update only the named PR target after the workflow's verification and report gates pass.

### Interactive authorization acquisition

In interactive mode, if the initial request did not authorize commit, offer only a bounded commit decision after presenting the verified diff: `Commit these refresh-owned paths` or `Leave verified changes uncommitted`. A positive answer authorizes the local commit only. Ask a separate question for push/PR only when outward landing is genuinely requested; never bundle commit and landing into one implied choice.

### Commit message

Write a descriptive commit message that:
- Summarizes what was refreshed (e.g., "update 3 stale learnings, consolidate 2 overlapping docs, delete 1 obsolete doc")
- Follows the repo's existing commit conventions (check recent git log for style)
- Is succinct — the details are in the changed files themselves
