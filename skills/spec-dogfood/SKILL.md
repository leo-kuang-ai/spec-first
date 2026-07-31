---
name: spec-dogfood
description: "Hands-off, diff-scoped browser QA of the active branch or PR. Use when a branch needs autonomous user-flow dogfooding before review or shipping: map changed flows, drive agent-browser, fix small breakages with regression tests, record human-decision blockers, and write a durable report. Do not use for collaborative UI polish, ordinary browser smoke tests, code review, implementation planning, or broad whole-app exploration."
disable-model-invocation: true
argument-hint: "[PR number, branch name, or blank for current branch] [--port PORT]"
---

# Dogfood

Act as a QA engineer who dogfoods the **active branch** end-to-end: understand every change, test every change in a real browser as a user would, and fix small breakages autonomously until the branch has a clear readiness verdict.

This is **diff-scoped**, not whole-app exploration. You test what *this branch* introduced or modified versus the trunk.

## Workflow Contract Summary

### When To Use
Use when a PR, branch, or current non-trunk branch needs autonomous browser dogfooding before review or shipping: changed-flow mapping, persona-aware journey testing, small fixes, regression tests, and a durable report.

### When Not To Use
Do not use for collaborative UI polish (`spec-polish`), ordinary browser smoke tests (`spec-test-browser` when delegated), static code review (`spec-code-review`), implementation planning (`spec-plan`), broad whole-app exploration, or large product/architecture decisions.

### Inputs
A PR number, branch name, or current branch; optional `--port`; git diff against trunk; project dev-server conventions; persona/strategy docs when present; browser observations and test results.

### Outputs
Incrementally updated dogfood report under `docs/dogfood-reports/`, flowcharts, test matrix statuses, explicitly authorized small source fixes with regression evidence, blocked authorization/human-decision items, and a final readiness verdict.

### Artifacts
`docs/dogfood-reports/<YYYY-MM-DD>-<branch-slug>-dogfood.md`, authorized source/test changes, commits only when separately requested, transient screenshots in OS temp, and optional reusable learnings handed to `spec-compound`.

### Failure Modes
Trunk target with no diff, unsafe checkout or dirty working tree, missing `agent-browser`, missing or failing dev server, external-interaction flows needing human verification, ambiguous fixes requiring human product/architecture decisions, or failing automated suite after browser matrix completion.

### Workflow
Resolve the target branch/PR, optionally isolate with `spec-worktree`, analyze the diff, map changed user flows, build a matrix, start the app, execute each scenario with `agent-browser`, fix only small unambiguous issues, update the report throughout, then run the automated suite and finalize the verdict.

### Downstream Consumers
Human reviewers, `spec-code-review`, `spec-work` for larger follow-up fixes, `spec-compound` for reusable learnings, and PR/commit workflows that consume the readiness evidence.

## Use `agent-browser` Only For Browser Automation

This workflow drives the browser exclusively through the `agent-browser` CLI. Do not use Chrome MCP tools (`mcp__claude-in-chrome__*`), any browser MCP integration, or other built-in browser-control tools. If the platform offers multiple ways to control a browser, always choose `agent-browser`. Use the direct binary, never `npx agent-browser` (the direct binary uses the fast Rust client).

## Prerequisites

- A local dev server you can start (`bin/dev`, `rails server`, `npm run dev`, etc.).
- `agent-browser` installed. Check:

  ```bash
  command -v agent-browser >/dev/null 2>&1 && echo "Ready" || echo "NOT INSTALLED"
  ```

If not installed, stop with this message: "Browser automation helper unavailable. Run `spec-runtime-setup` to see the current `agent-browser` install command, install it manually if browser automation is needed, then rerun `spec-dogfood`. This does not block spec-first baseline." This workflow cannot function without `agent-browser`.

## Reusing Spec-First Skills

`spec-dogfood` is an orchestrator. Prefer delegating to existing Spec-First skills over re-deriving their behavior:

| When | Skill | Why |
|------|-------|-----|
| Phase 0 isolation | `spec-worktree` | Run the dogfood in an isolated worktree so the main checkout stays clean. |
| A failure's root cause is non-obvious | `spec-debug` | Systematic root-cause analysis instead of guess-and-check. |
| Authorized commit checkpoint | `spec-commit` | Create a consistent, well-scoped commit only after separate commit authorization. |
| A bug reveals a reusable lesson | `spec-compound` | Capture the learning so the team compounds knowledge. |

## Mutation Authority Boundary

Before isolation/checkout or the first source fix, derive four independent run-local facts from the current user request and any visible upstream handoff:

```yaml
branch_mutation_authorization: authorized | missing
local_fix_authorization: authorized | missing
commit_authorization: authorized | missing
landing_authorization: authorized | missing
```

- A PR/branch argument selects the dogfood target; `branch-selection-is-not-authorization`. Branch/worktree mutation requires the current user or upstream owner to explicitly request the exact checkout/isolation action, or the user to approve it after disclosure.
- A request to inspect, QA, or dogfood does not by itself authorize source fixes. Set `local_fix_authorization: authorized` only when the current user/upstream explicitly requests applying small fixes; otherwise keep source findings report-only and record `fix_authorization_missing`.
- Set `commit_authorization: authorized` only when commit creation is separately explicit. A verified fix may remain uncommitted with `commit_authorization_missing`.
- Set `landing_authorization: authorized` only for an explicit push/PR request. Without landing authorization, do not push and do not open a PR.
- The dogfood report is the disclosed workflow artifact and may be updated by an explicit dogfood request; that artifact authority does not expand into product-source, branch, commit, or landing authority.

## Workflow

```
0. Scope        Resolve the target; change checkout only with branch authorization
1. Analyze      Diff branch vs trunk, understand every change
2. Map+Matrix   Map user flows as Mermaid flowcharts, then derive the test matrix as a task list
3. Serve        Detect port, start dev server, open agent-browser
4. Execute      Work the matrix one item at a time with agent-browser
5. Fix loop     On failure: authorized fix -> regression proof -> optional commit -> continue
6. Report       Write durable doc to docs/dogfood-reports/ (flows, matrix, fixes, learnings, verdict)
```

### Phase 0: Scope and Get on the Right Branch

Parse the invocation arguments supplied by the current host: a PR number, a branch name, or blank (use current branch). Preserve quoted paths/tokens while stripping a recognized `--port PORT` pair if present.

1. **Identify the target — keep PR identity; do not switch the working tree yet.**
   - **PR number:** the target *is the PR* — carry the number through every later step (trunk check, isolation, checkout). Read its head only for display (`gh pr view <number> --json headRefName,isCrossRepository`), but do **not** reduce it to a bare branch name: a fork PR's head can even be named `main`/`master`. Do not check out yet.
   - **Branch name:** the target is that branch.
   - **Blank:** the target is the current branch.
2. **Refuse to run on the trunk — branch/blank targets only.** If a *branch-name or blank* target resolves to the trunk (`main`/`master`/the detected default), stop — there is no diff to dogfood. A **PR is always diffable** (it has a base), so this check never applies to a PR target; never refuse `spec-dogfood <number>` just because the PR's head branch happens to be named `main`.
3. **Decide isolation by what you're testing; let `spec-worktree` own the worktree mechanics.** Do not re-derive worktree detection or creation here — `spec-worktree` handles existing-isolation detection, attaching to a ref, and the "already checked out" constraint, and reports its decision back. The target remains scope until branch mutation is authorized:
   - **Blank / current-branch target:** do **not** isolate — dogfood in place. You are already on the branch under test, any separately authorized fixes belong in this checkout, and git cannot check the same branch out in a second worktree anyway. (If you happen to already be in a worktree, that is fine — you are simply dogfooding here.)
   - **A PR or a different named branch:** offer the concrete isolation/checkout choices with their side effects. Choosing an option is the authorization source for that exact action. On authorized isolation, invoke `spec-worktree` existing-ref mode through its bundled script: `isolate pr:<number>` for PR targets, or `isolate <branch>` for branch targets. It may return `already_checked_out branch=<name> path=<path>`; use that existing checkout and never switch the primary checkout. On an explicitly authorized in-place switch, use `gh pr checkout <number>` or `git checkout <branch>` after dirty-state safety checks. If no blocking interaction exists or the user declines both mutations, stop with `branch_mutation_authorization_missing`; do not silently switch the primary checkout.
4. **Resume if a prior run exists.** Look for an existing report at `docs/dogfood-reports/*-<branch-slug>-dogfood.md` (see the branch-slug rule under Resumability). If one is found with unfinished scenarios, ask whether to resume it or start fresh. To resume, re-hydrate the task list from its matrix: `Pass`/`Fixed`/`Skipped` stay done; `Pending` and `in_progress` become the remaining auto-runnable work. The three `Blocked` states are **not** auto-runnable — `Blocked (fix authorization)`, `Blocked (needs human verify)`, and `Blocked (human decision)` all wait on a person, so surface them and ask how to proceed rather than silently re-queuing them.

### Resumability (stop and return at any point)

This workflow is designed to be interrupted and resumed. Two pieces of state make that safe:

- **The task list** (the harness's task tool — `TaskCreate`/`TaskUpdate` on Claude Code, `update_plan` on Codex, or the equivalent elsewhere) is the live to-do — one task per matrix scenario. Mark each `in_progress` when you start it and `completed` only when it genuinely passes.
- **The report doc** at `docs/dogfood-reports/<YYYY-MM-DD>-<branch-slug>-dogfood.md` is the durable checkpoint that survives across sessions. `<branch-slug>` is the branch name lowercased with every run of non-alphanumeric characters (slashes included) collapsed to a single `-` (e.g. `feature/Foo_Bar` -> `feature-foo-bar`). **Create it as soon as the matrix exists (end of Phase 2) by instantiating `references/dogfood-report-template.md`** (read that template now if you haven't) so the checkpoint carries the template-owned section shape from the start — then fill in every scenario at `Pending`, and **update it incrementally** after each scenario judgment and each verified fix/commit-status change, not only at the end. An interrupted run must leave a template-shaped checkpoint, not a bare matrix.

Because tasks are session-scoped but the report doc is on disk, the report is the source of truth for resuming. Always keep the two in sync so a later run (or a teammate) can pick up exactly where this one stopped.

### Phase 1: Analyze Changes

Derive the trunk ref once, then pull the full diff against it and read it. Do not hard-code `main` — a repo whose default branch is `master` (or anything else) would fail with `fatal: ambiguous argument 'main...HEAD'`.

```bash
# Resolve the trunk to a ref that actually exists. Start from the detected
# default name (origin/HEAD, then gh), then fall back to common names. For each
# candidate prefer a local branch; else use the remote-tracking ref QUALIFIED as
# origin/<branch> — an unqualified name resolves via refs/remotes/<name>, NOT
# refs/remotes/origin/<name>, so a remote-only trunk would otherwise miss. This
# qualification applies to the detected default too (PR/CI checkouts often have
# only origin/main, no local main).
DEFAULT=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')
DEFAULT=${DEFAULT:-$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null)}
TRUNK=""
for cand in "$DEFAULT" main master; do
  [ -n "$cand" ] || continue
  if git show-ref --verify --quiet "refs/heads/$cand"; then
    TRUNK=$cand; break
  elif git show-ref --verify --quiet "refs/remotes/origin/$cand"; then
    TRUNK="origin/$cand"; break
  fi
done
TRUNK=${TRUNK:-main}

git diff --name-only "$TRUNK...HEAD"   # what changed
git diff "$TRUNK...HEAD"               # how it changed
```

Build a mental model of every change: new features, modified behavior, new routes/views/components, touched data flows. Note anything that produces user-visible behavior — that is what the matrix must cover.

**Ground in the product's personas and vision.** Look for persona and vision context so flows can be judged from real users' eyes, not just "does it work." Check, in order: `STRATEGY.md` (its "Who it's for" section names the primary persona and their job-to-be-done), `VISION.md`, and any persona docs (e.g. `docs/personas/`, `PERSONAS.md`). Capture the 1-3 primary personas and what each cares about. If none exist, infer a reasonable primary persona from the product and the diff, and say so in the report.

### Phase 2: Map the Flows, Then Build the Matrix

Do not jump straight to a flat list of pages. First **understand the user flows the diff touches**, then derive the matrix from them. A matrix built without a flow model tests pages in isolation and misses the journey — the email that "sends" but lands in the wrong thread.

#### 2a. Map the user flows (required)

For every user-visible change, trace the **complete journey** end to end and draw it. Map each flow as a **Mermaid `flowchart`** so the journey is explicit and reviewable before any testing happens — entry point, each user action, branch points (success / validation error / empty / permission-denied), side effects (emails, jobs, notifications), and the true end state.

> Email example: it's not enough that "an email sends." Does it go to the *right* recipient? When the user clicks through, does the app land on and scroll to the *right* message? Does the content make sense? Does the whole flow align with the product's vision and UX? The flowchart must carry the click-through and its destination, not stop at "email sent."

```mermaid
flowchart TD
    A[User opens /threads] --> B[Clicks 'Reply']
    B --> C{Form valid?}
    C -->|No| D[Inline validation error shown]
    C -->|Yes| E[Reply saved]
    E --> F[Notification email sent to thread participants]
    E --> G[UI scrolls to new reply, focus on it]
    F --> H[Recipient clicks email link]
    H --> I{Lands on correct thread + scrolls to the reply?}
```

Produce one flowchart per distinct journey, scaled to the diff: a one-route or copy-only change gets a single small flowchart, a multi-step feature gets several. Cover the happy path **and** the branch points (error, empty, boundary, permission). Mapping the flows before the matrix is never skipped — these diagrams ARE the understanding; they become the spine of the matrix and belong in the final report.

#### 2b. Derive the matrix from the flows

Walk each flowchart and turn every node and branch into one or more test scenarios. Read `references/test-matrix-taxonomy.md` for the full set of dimensions (journeys, functional checks, experiential checks, edge/error/empty states, accessibility, responsiveness). Cover both **functional** ("does it work?") and **experiential** ("does it feel right and align with the product?").

Map changed files to concrete routes (views -> their pages, components -> pages rendering them, layouts -> all pages, stylesheets -> visual regression on key pages) and attach those routes to the flows that exercise them.

**Load the matrix as a task list** (the harness's task tool, as above), one task per scenario, so progress is tracked and nothing is skipped. Order tasks by flow, following the flowcharts, not by file.

### Phase 3: Detect Port and Start the Dev Server

Determine the port (priority: explicit `--port` > a port explicitly stated in your in-context project instructions > `package.json` dev script > `.env*` `PORT=` > default `3000`). If a server is already listening on it, reuse it. Otherwise start the project's dev command (`bin/dev`, `rails server`, `npm run dev`, etc.) in the background and poll the port until it accepts connections before opening the browser. This skill is hands-off, so start the server automatically without asking — do not block on a confirmation.

```bash
agent-browser open "http://localhost:${PORT}"
agent-browser snapshot -i
```

### Phase 4: Execute the Matrix

Work the task list **one item at a time**. For each scenario, mark the task `in_progress`, then:

1. **Document** what you're testing (the journey and the expected outcome).
2. **Drive it** with agent-browser — navigate, snapshot for interactive refs, click, fill, submit, follow the journey to its real end state:

   ```bash
   agent-browser open "http://localhost:${PORT}/<route>"
   agent-browser snapshot -i
   agent-browser click @e1
   agent-browser fill @e2 "value"
   agent-browser screenshot "$(mktemp -d)/<scenario>.png"   # scratch dir, not the repo root
   agent-browser errors      # check console/page errors
   ```

   Write transient screenshots to OS temp (e.g. `mktemp -d`), never the repo root. Only copy a screenshot into the report's location if you intend to embed it in the final report.

3. **Judge** both correctness and experience: right data, right destination, sensible content, no console errors, and does it feel aligned with the product?
4. **Walk it as each persona.** Re-run the journey in your head from each primary persona's perspective (from Phase 1) and ask where they'd feel a **paper cut** — a small friction that wouldn't fail a functional test but degrades the experience: a confusing label, an extra click, an unexpected jump, a slow-feeling step, missing feedback, copy that doesn't match how that persona thinks. A scenario can be functionally `Pass` yet still carry paper cuts. Note each paper cut, which persona feels it, and its severity.
5. **Record** pass/fail plus any paper cuts, with specifics. Mark the task `completed` only when it genuinely passes. Paper cuts do not block a `Pass`, but a **sharp** paper cut (one severe enough to fix now) is routed into the Phase 5 fix loop just like a failure — apply the same auto-fix-vs-escalate judgment to it. Log the rest in the report.

**External-interaction flows** (OAuth, real email delivery, payments, SMS) can't be fully driven headlessly — pause, ask the user to verify that leg, and mark the scenario `Blocked (needs human verify)` until they confirm. Then continue.

### Phase 5: Fix Loop (Authorization-Aware)

When a scenario fails — or a passing scenario carries a sharp paper cut worth fixing now — first decide whether local fix authority exists and whether the change is small enough for this workflow.

**Judge the size of the fix before touching code.** A fix is eligible only when separately authorized and small, well-understood, and low-risk: a clear bug with an obvious correct fix, contained to a few files, with no schema/architecture/product trade-off. Even with local fix authority, do not implement a large or ambiguous change that requires an architectural, schema, product, or UX decision; record it for a human instead.

**For authorized fixes:**

When `local_fix_authorization: missing`, do not touch product source. Record the issue and `fix_authorization_missing`, mark the scenario `Blocked (fix authorization)`, and continue with other independent scenarios. Do not relabel an unfixed failure as `Pass`.

1. Investigate the root cause. If it's non-obvious, use `spec-debug`.
2. Apply the fix in the code.
3. **Add an automated regression test** that fails before the fix and passes after, so the bug can't return. This is the default for behavioral and code bugs. When an automated test is genuinely impractical — a pure copy, spacing, or visual fix with no behavioral assertion to make — substitute a documented browser-replay or screenshot check and **state in the report why no automated test was meaningful**. Do not invent a hollow test just to satisfy the step.
4. If `commit_authorization: authorized`, commit the fix with a clear message using `spec-commit`, one logical fix per commit. Otherwise leave the verified fix uncommitted, record `commit_authorization_missing`, and use `uncommitted` in the report's Commit field.
5. Re-run the failing scenario in the browser to confirm it now passes; then continue the matrix.
6. If the bug carried a reusable lesson, capture it with `spec-compound`.

**For changes too big to make autonomously:** do not implement. Record it in the report's **Decisions for a human** section with: what's broken, why it's not a safe autonomous fix, the options you see (with trade-offs), and your recommendation. Mark the scenario `Blocked (human decision)` in the matrix, then continue with the rest. Never make a large, irreversible, or product-altering change just to clear a matrix item.

Keep iterating until every task is `completed` or in a terminal `Blocked` state — `Blocked (fix authorization)`, `Blocked (human decision)`, or `Blocked (needs human verify)`. All three wait on a person, so do not re-queue them. Re-test anything a fix might have affected.

**Before declaring the branch ready, run the project's automated test suite once** (the new regression tests plus everything that already exists). Discover the test command from the project's active instructions and conventions already in your context — do not assume a specific runner. Record the result in the report; a green matrix with a red suite is not "ready."

### Phase 6: Write the Report Artifact

The report doc was created at the end of Phase 2 and updated incrementally throughout (see Resumability). When the matrix is green (or every remaining item is explicitly blocked), **finalize** it at `docs/dogfood-reports/<YYYY-MM-DD>-<branch-slug>-dogfood.md` in the repo under test, then surface a short summary in chat with the file path.

**Finalize against `references/dogfood-report-template.md`** — the same template the Phase 2 checkpoint was instantiated from, which owns the required sections and what each must carry. Confirm every template-owned section is present and complete; do not reconstruct the section list from memory, as that drifts from the template. Carry forward the cross-phase obligations this skill produced: the Mermaid flowcharts from Phase 2a, a matrix row per scenario with its commit SHA or `uncommitted`, each fix's root cause and the regression test added (or why none was meaningful), authorization blockers, paper cuts attributed by persona, learnings worth feeding to `spec-compound`, and a final readiness verdict that records the Phase 5 automated-suite result. Without landing authorization, do not push and do not open a PR.
