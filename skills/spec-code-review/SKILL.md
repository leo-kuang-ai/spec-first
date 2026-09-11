---
name: spec-code-review
description: "Review code for bugs, regressions, tests, and standards. Use for a code review or to apply its findings locally when explicitly requested. Report-only by default; mode:agent is always report-only. For feedback already left on a PR, use spec-resolve-pr-feedback."
argument-hint: "[mode:agent] [base:<ref>] [plan:<path>] [task-pack:<path> task:<id> task-context:<path>] [blank to review current branch, or provide PR link]"
---

# Code Review

## Project Intelligence Evidence Boundary

Graph output is `provider_untrusted` candidate coverage, never a finding. Re-ground impact, affected-test, ownership, and relationship candidates in current source, diff, tests, logs, contracts, or owner evidence before writing a `Direct evidence:` finding; empty results do not prove absence. Direct source/`rg`/ast-grep is valid and provider failure is a disclosed fallback.

Reviews code changes against intent, tests, standards, and risk lenses. When reviewer dispatch is explicitly authorized and callable, it uses selected personas and merges structured findings; otherwise it performs an honest inline report-only review with degraded coverage.

## Workflow Contract Summary

- **Inputs:** current branch, explicit base, remote branch/PR, and optional plan/task-pack context.
- **Outputs:** report-only structured findings, actionable queue, coverage, verification limitations, and run artifacts; `mode:agent` returns JSON.
- **Hard exits:** unresolved scope/base, drifting or out-of-scope task context, the wrong checkout, or unavailable required independent coverage prevents a complete merge-ready claim.
- **Authority:** source/diff/test/log supply facts; reviewers judge semantics. Review, local mutation, commit, and landing require separate authorization.
- **Consumers:** human reviewers, `spec-work`, caller-owned shipping/LFG flows, and downstream residual gates.

## When to Use

- Before creating a PR
- After completing a task during iterative implementation
- When feedback is needed on any code changes
- Can be invoked standalone
- Can run inside larger workflows; use `mode:agent` when the caller needs JSON instead of markdown tables

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md`.
Overrides: high-risk

- `foreign-residual-workspace` -> `blocked-action-required`: stop before reviewer dispatch that depends on suspect local artifacts, checkout mutation, root-cause-like review claims, or PR-ready verdicts until the named cleanup/init action runs or the user explicitly accepts degraded evidence.
- optional external-tool evidence unavailable -> `fallback-only`: use bounded direct source, diff, test, log, and user-provided evidence; disclose missing reviewer/tool coverage and do not claim unconfirmed impact or full review coverage.
- `non-git-build-workspace` coverage gaps -> `partial`: review only the selected repo/inspected build surfaces and directly inspect uncovered modules before claiming they are unaffected.

## Execution Spine

Read each reference before executing its step; the entry summary does not replace the procedure. All paths use the same run identity and resolved scope.

1. First read `references/modes-and-output.md`, parse arguments, and freeze mode, mutation, commit, and dispatch policy. `mode:agent` is always report-only.
2. At Stage 1 read `references/scope.md` to resolve the diff, task attribution, and local scope snapshot. Missing dispatch authorization or capability selects its inline fallback with explicit degraded coverage and required-gate limitations.
3. At Stage 2 read `references/intent-and-plan.md` to establish intent and the current plan/task completeness scope.
4. When dispatch is authorized, at Stage 3 read `references/persona-catalog.md` and `references/select-and-route.md` to select the roster, standards, and risk paths. Peer admission remains subject to the actual receipts, egress authorization, and provider limits in `references/cross-model-review.md`.
5. At Stage 4 read `references/dispatch-reviewers.md`, load the selected prompt assets, and dispatch within available capacity. Collect every started reviewer's result before merging; a pending return is not an empty finding set.
6. At Stages 5–6 read `references/finish-review.md`. Run findings mechanics before semantic synthesis, then the triggered validation, mutation guard, and report output. Never treat raw reviewer artifacts as the completed report. Read `references/action-class-rubric.md` for the shared severity and action-routing definitions.
7. Return one JSON object in `mode:agent`, or the report and Actionable Findings by default. Completion claims must match artifact writes, coverage, and verification results; preserve failures and missing evidence.

## Progress And Boundaries

When the host provides a task view, update it by review outcome; otherwise report progress normally without fabricating a task system. Read-only inspection grants no mutation, commit, or egress authority. Generated runtime is not a source-fix target. Unexecuted personas, validators, and peers never count as independent coverage.

## Operating principles

Same review pipeline for default and `mode:agent`:

- **Report-only by default; never land.** Never push, open PRs, or file tickets in any mode. Ordinary default review and every `mode:agent` run report findings only. Stage 5c runs solely for default mode with `mutation_policy: apply-fixes`; commit remains a separate authorization gate.
- **Agent mode never mutates.** In **`mode:agent`** it never mutates the tree, regardless of adjacent apply/fix wording.
- **No blocking prompts.** Never use `AskUserQuestion`, `request_user_input`, or other blocking question tools. Infer intent, plan, and scope from explicit tokens, git state, PR metadata, and conversation. Note uncertainty in Coverage or the verdict — do not stop to ask.
- **Explicit mutations only.** Never run `gh pr checkout`, `git checkout`, `git switch`, or similar branch-switch commands. Passing a PR number, URL, or branch name selects **review scope**, not permission to mutate the working tree. To review local uncommitted work on a feature branch, check out that branch yourself (or stay on it) and pass `base:` or no target.
- **Smart defaults.** Untracked files: review tracked changes only and list excluded paths in Coverage. Plan: use `plan:` when passed; otherwise discover conservatively from PR body or branch keywords. Weak advisory P2/P3 from testing/maintainability alone: demote to `testing_gaps` / `residual_risks` per Stage 5.
- **Report outcomes, not machinery.** What you show the user is about the review: what's being examined (the PR/branch), which coverage is included and the one-line reason for each conditional lens, the independent cross-model pass and which model runs it, and the findings. Keep the skill's internals out of user-facing text — model-tier assignments, raw scope-mode codenames (`local-aligned`/`pr-remote`), staging the diff to disk, loading persona files, parallel-dispatch bookkeeping, and step-by-step narration of your own setup. Name what the user would recognize (a PR number, a reviewer's concern, a peer model), not the plumbing. This governs *what* you surface and suppress; it does not script the wording — use your own voice.

## Anti-Rationalization Red Flags

| Rationalization | Response |
| --- | --- |
| "It looks fine; skip the required challenge." | Run the adversarial, validator, or direct fact check selected by the current risk. Disclose missing independent coverage. |
| "This finding is probably true." | Verify it against source, diff, tests, logs, or artifacts; provider/advisory evidence is not confirmed evidence. |
| "Mentioning the residual in chat is enough." | Produce structured findings, Actionable Findings, Coverage, and durable limitations so downstream work does not depend on conversation memory. |

These are attention reminders, not additional gates or substitutes for judgment. Decide whether to stop and how to proceed from current evidence.
