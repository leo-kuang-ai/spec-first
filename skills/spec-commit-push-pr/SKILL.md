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

**Asking the user:** When this skill says "ask the user", use the platform's blocking question tool: the host's blocking question tool already in the current tool list, matched by capability (if a matching tool is listed but unloaded, load it through the host's tool-discovery primitive). Fall back to presenting the question in chat only when no such tool is in the list or a real question call errors. Never silently skip the question.

## Mode detection

Three flavors of intent. Pick one and follow the matching path; otherwise default to the full workflow.

- **Description-only generation.** If the user asked for *just* a PR description with no commit or push intent (e.g., "write a PR description", "draft a PR description for this branch", "describe this PR", or pasted a PR URL/number alone), skip Steps 4-5 AND Step 1's decision tree (its stop gates are full-workflow only and would terminate common cases like "feature branch, all pushed, open PR -> stop"). Use the data from the Context section above instead. Then go to Step 6 to compose. If the user pasted a PR URL/number, pass it to Step 6 as the PR ref so Pre-A resolves the right commit range (otherwise Pre-A defaults to current-branch mode). Print the result back to the user; apply via `gh pr edit`/`gh pr create` only if the user asks.
- **Description update on existing PR.** If the user is asking to update, refresh, or rewrite an existing PR description (with no mention of committing or pushing), follow the Description Update workflow below. The user may also provide a focus (e.g., "update the PR description and add the benchmarking results"). Note any focus for DU-3.
- **Full workflow.** Otherwise, follow the Full workflow below.

**`mode:pipeline` modifier:** Set by orchestrated callers such as `spec-lfg`. Run the resolved mode non-interactively and suppress every blocking ask. The existing-PR rewrite question defaults to **not rewriting**; in description-update mode the preview ask is skipped and the rewrite applies directly because the update invocation is already the apply intent. Any other suppressed ask takes its conservative documented default: keep the current branch when possible, and stop/report instead of guessing when a base, PR, or branch state cannot be resolved. After an authorized full-workflow landing, return a structured `watch_handoff` containing the PR number/URL, head SHA, base ref/SHA when available, and the caller's existing authorization source and scope. This handoff lets the pipeline owner enter its bounded review/CI/head/base-currency watch; it grants no new authority. Ordinary standalone and description-only runs do not start or recommend a watch by default.

The landing disclosure for `mode:pipeline` includes bounded PR-feedback fixes and only a repo-policy-approved, non-rewriting branch-currency update. This helper never authorizes or performs merge, rebase, force-push, or history rewrite as part of that handoff. If the repository policy is absent or currency requires rewriting history, return `branch-currency-update-required` to the caller.

## Context

Read `references/context.md` before Step 1. It owns the portable context
probes, exit-code interpretation, fork and detached-HEAD traps, and the
re-verification points used before push or PR mutation. Host-provided context
may be used when it is explicit and complete; otherwise run the reference's
argv-form probes separately and keep non-zero results visible as unknown
state, never as a successful empty result.

---

## Description Update workflow

Use the caller's explicit description-update request as apply intent; do not
ask for the same intent again. Resolve the exact PR through
`references/context.md`. Only a successful empty query proves no open PR;
unknown or ambiguous state blocks mutation. Then run Step 6 in PR mode and
Step 7's update route. Description-only and description-update modes never
branch, stage, commit, push, or archive repository files.

## Full workflow

### Step 1: Resolve branch and PR state

Follow `references/context.md` for branch routing, default-branch resolution,
and matching the exact head owner and branch. Do not guess an unresolved base
or take the first PR in a multi-fork result. Branch creation is allowed only
inside the caller's established mutation scope.

### Step 2: Determine conventions

Use the context reference's order: project instructions, recent commits,
then Conventional Commits. Prefer `fix:` over `feat:` when ambiguous unless
the user overrides.

### Step 3: Select the existing-PR route

Preserve the matching PR URL and body for composition. Full workflow pushes
authorized pending work first, then asks about a rewrite only if that intent
is not already established. Pipeline mode defaults to keeping the existing
description. A clean, fully pushed branch with an existing PR proceeds to
Step 8's factual handoff.

### Step 4: Branch, stage, and commit

Read `references/commit-and-push.md` before staging or committing. It owns
branch creation, logical groups, exact-path exclusions, index isolation, and
message construction. Never use `git add -A` or `git add .`, and never absorb
unrelated staged work. If there is no authorized uncommitted work, skip commit.

### Step 5: Push

Follow the push section of `references/commit-and-push.md`. Re-check the live
branch, remote, and existing PR before pushing. A successful local commit is
not proof of push success; failed or unknown publication returns its actual
local SHA and blocker to the caller.

### Step 6: Generate the PR title and body

Read `references/pr-description-writing.md` in full, then
`references/compose.md`. Resolve Pre-A before writing: the complete PR commit
range, current body, and evidence determine the description, never the initial
working-tree diff alone. Pass the confirmed PR URL for every existing rewrite.
The compose reference owns the `pr_teaching_section:` and
`pr_teaching_archive:` active-key rules and separate archive authority.
Run Steps A through H, including the final audit, before returning a body.

### Step 7: Create or update the PR

Read `references/apply-and-handoff.md` before any PR or archive write. It owns
fresh PR resolution, no-op comparison, previews, archival, body transport, and
read-back. Only a known matching PR can be edited; only confirmed absence can
create one. Pass the body with `--body-file <path>`, never stdin, and confirm
the applied body from remote facts before claiming success.

### Step 8: Report

Output the PR URL.

Before reporting success, render every inherited or returned typed `needs-human` residual under `## Needs your decision` and return the exact objects unchanged to the top-level caller. Include quoted_feedback, investigation, decision_reason, every option/tradeoff, non-null recommendation, and all thread_urls. A watch opt-out, description-only mode, or skipped rewrite does not suppress a known decision. A non-empty set is a decision handoff, not overall completion; leave covered threads open. This helper does not create a decision store or gain additional remote-write authority.

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

If a body applied by this run contains a `## New concepts` section, print one line after the PR URL in every mode: `New concepts: <name>[, <name>]`. In interactive full-workflow runs, follow it with one line per taught concept: `Run spec-explain <name> to go deeper.` Render that invocation using the host rule in `references/apply-and-handoff.md`. Do not print the trailer when this run applied no body, including a rewrite that was declined or pipeline-defaulted to no, or when no PR exists.

Read `references/context.md` before composing commit or PR text.
