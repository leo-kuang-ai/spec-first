---
name: spec-dogfood
description: "Hands-off, diff-scoped browser QA of the active branch or PR. Use when a branch needs autonomous user-flow dogfooding before review or shipping: map changed flows, delegate exact-origin browser execution to spec-test-browser, fix small breakages with regression tests, record human-decision blockers, and write a durable report. Do not use for collaborative UI polish, ordinary browser smoke tests, code review, implementation planning, or broad whole-app exploration."
disable-model-invocation: true
argument-hint: "[PR number, branch name, or blank for current branch] [--port PORT]"
---

# Dogfood

Act as a QA engineer who dogfoods the **active branch** end-to-end: understand every change, test every change in a real browser as a user would, and fix small breakages autonomously until the branch has a clear readiness verdict.

This is **diff-scoped**, not whole-app exploration. You test what *this branch* introduced or modified versus the trunk.

**Outcome:** every changed user journey is exercised through the delegated browser owner, judged for correctness and experience, and any authorized small breakage is regression-tested. **Done:** every matrix row is `Pass`, `Fixed`, `Skipped`, or terminal `Blocked`; the automated suite has been run once and recorded; and the report is finalized. A green matrix with a red suite is a not-ready verdict, not a ready claim.

## Workflow Contract Summary

Read `references/phases.md` before executing the dogfood phases.

### When To Use
Use when a PR, branch, or current non-trunk branch needs autonomous browser dogfooding before review or shipping: changed-flow mapping, persona-aware journey testing, small fixes, regression tests, and a durable report.

### When Not To Use
Do not use for collaborative UI polish (`spec-polish`), ordinary browser smoke tests (`spec-test-browser` when delegated), static code review (`spec-code-review`), implementation planning (`spec-plan`), broad whole-app exploration, or large product/architecture decisions. When routing out for one of these, name the listed destination skill explicitly in your reply — recognizing the mismatch without naming where the request belongs leaves the owner without a route.

### Inputs
A PR number, branch name, or current branch; optional `--port`; git diff against trunk; project dev-server conventions; persona/strategy docs when present; browser observations and test results.

### Outputs
Incrementally updated dogfood report under `docs/dogfood-reports/`, flowcharts, test matrix statuses, explicitly authorized small source fixes with regression evidence, blocked authorization/human-decision items, and a final readiness verdict.

### Artifacts
`docs/dogfood-reports/<YYYY-MM-DD>-<branch-slug>-dogfood.md`, authorized source/test changes, commits only when separately requested, transient screenshots in OS temp, and optional reusable learnings handed to `spec-compound`.

### Failure Modes
Trunk target with no diff, unsafe checkout or dirty working tree, missing `spec-test-browser` execution owner/capability, missing or failing dev server, external-interaction flows needing human verification, ambiguous fixes requiring human product/architecture decisions, or failing automated suite after browser matrix completion.

### Workflow
Resolve the target branch/PR, optionally isolate with `spec-worktree`, analyze the diff, map changed user flows, build a matrix, start the app, execute each scenario through `spec-test-browser`, fix only small unambiguous issues, update the report throughout, then run the automated suite and finalize the verdict.

### Downstream Consumers
Human reviewers, `spec-code-review`, `spec-work` for larger follow-up fixes, `spec-compound` for reusable learnings, and PR/commit workflows that consume the readiness evidence.

## Use The Browser Execution Owner

This workflow never executes a browser CLI directly. Invoke `spec-test-browser` with `mode:pipeline` and an explicit exact loopback `target-origin:<origin>` so its unique wrapper owns capability probing, request-time exact-origin enforcement, action validation, private evidence, and cleanup. Do not use Chrome MCP tools, other browser-control tools, or hand-built browser argv as a second execution path.

## Prerequisites

- A local dev server you can start (`bin/dev`, `rails server`, `npm run dev`, etc.).
- The internal `spec-test-browser` Skill is available to own browser execution. Do not probe or execute its private CLI directly; its `mode:pipeline` call returns the authoritative capability/exact-origin result. If the owner is unavailable, stop with: "Browser execution owner unavailable. Run `spec-runtime-setup` to inspect browser readiness, then rerun `spec-dogfood`. This does not block spec-first baseline."

## Reusing Spec-First Skills

`spec-dogfood` is an orchestrator. Prefer delegating to existing Spec-First skills over re-deriving their behavior:

| When | Skill | Why |
|------|-------|-----|
| Phase 0 isolation | `spec-worktree` | Run the dogfood in an isolated worktree so the main checkout stays clean. |
| A failure's root cause is non-obvious | `spec-debug` | Systematic root-cause analysis instead of guess-and-check. |
| Authorized commit checkpoint | `spec-commit` | Create a consistent, well-scoped commit only after separate commit authorization. |
| A bug reveals a reusable lesson | `spec-compound` | Capture the learning so the team compounds knowledge. |

## Mutation Authority Boundary

Before isolation/checkout, browser execution, or the first source fix, derive five independent run-local facts from the current user request and any visible upstream handoff:

```yaml
branch_mutation_authorization: authorized | missing
browser_effect_authorization: authorized | missing
local_fix_authorization: authorized | missing
commit_authorization: authorized | missing
landing_authorization: authorized | missing
```

- A PR/branch argument selects the dogfood target; `branch-selection-is-not-authorization`. Branch/worktree mutation requires the current user or upstream owner to explicitly request the exact checkout/isolation action, or the user to approve it after disclosure.
- Classify every planned browser flow by expected effect as `read-only | ephemeral-local | durable-local | external | unknown`, regardless of whether the triggering action looks like navigation, click, form submit, or a key press. Read-only and ephemeral-local flows may enter the pipeline with synthetic data. Durable-local, external, and unknown flows require separate `browser_effect_authorization: authorized`; when it is missing, record `browser_effect_authorization_missing`, do not put the step in a browser test plan, and keep the scenario blocked. Even when such authority exists, use only behavior the `spec-test-browser` owner admits; its pipeline refusal remains authoritative.
- A request to inspect, QA, or dogfood does not by itself authorize source fixes. Set `local_fix_authorization: authorized` only when the current user/upstream explicitly requests applying small fixes; otherwise keep source findings report-only and record `fix_authorization_missing`.
- Set `commit_authorization: authorized` only when commit creation is separately explicit. A verified fix may remain uncommitted with `commit_authorization_missing`.
- Set `landing_authorization: authorized` only for an explicit push/PR request. Without landing authorization, do not push and do not open a PR.
- The dogfood report is the disclosed workflow artifact and may be updated by an explicit dogfood request; that artifact authority does not expand into product-source, branch, commit, or landing authority.

## Workflow

```
0. Scope        Resolve the target; change checkout only with branch authorization
1. Analyze      Diff branch vs trunk, understand every change
2. Map+Matrix   Map user flows as Mermaid flowcharts, then derive the test matrix as a task list
3. Serve        Detect port and start the caller-owned dev server
4. Execute      Work the matrix through spec-test-browser mode:pipeline
5. Fix loop     On failure: authorized fix -> regression proof -> optional commit -> continue
6. Report       Write durable doc to docs/dogfood-reports/ (flows, matrix, fixes, learnings, verdict)
```

## Phase procedures

Read `references/phases.md` before executing the dogfood phases. It owns scope, flow mapping, matrix execution, fix loop, and report completion.
