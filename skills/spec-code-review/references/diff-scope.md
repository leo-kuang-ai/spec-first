# Diff Scope Rules

These rules apply to every reviewer. They define what is "your code to review" versus pre-existing context.

## Scope Discovery

Use the resolved `BASE:`, `FILES:`, and `DIFF:` markers passed by the parent orchestrator. The scope step in `SKILL.md` already handled branch, PR, base, working-copy, and untracked-file discovery before this prompt was assembled.

Do not recompute the diff range, change branches, or replace the parent-provided file list. Non-mutating `git show`, `git diff`, `git blame`, or `gh pr view` reads are allowed only to inspect code or metadata inside the parent-provided scope and surrounding context.

## Finding Classification Tiers

Every finding you report falls into one of three tiers based on its relationship to the diff:

### Primary (directly changed code)

Lines added or modified in the diff. This is your main focus. Report findings against these lines at full confidence.

### Secondary (immediately surrounding code)

Unchanged code within the same function, method, or block as a changed line. If a change introduces a bug that's only visible by reading the surrounding context, report it -- but note that the issue exists in the interaction between new and existing code.

### Boundary (authorized scope)

Check whether the changed files and behavior match the authorized work described by the review context, plan, task, PR intent, or declared file list.

- If an explicit touch set or declared file list exists, treat changes outside it as possible `unauthorized_file_change`.
- If a plan or task says what the change should accomplish, treat unrelated behavior changes as possible `scope_creep`.
- If the implementation claims tests, generated runtime refresh, or verification that the diff/log evidence does not support, flag `unverifiable_claim` or `missing_verification` where the review context gives enough evidence.
- If the review context has only diff/branch intent and no explicit scope source, do not call the boundary clean. Report the limitation as `scope_boundary: unknown` through Coverage rather than inventing authorization.

Boundary findings still need direct diff/source/test/log/contract evidence. Implementer summaries, commit messages, or PR prose are claims to verify, not proof.

### Pre-existing (unrelated to this diff)

Issues in unchanged code that the diff didn't touch and doesn't interact with. Mark these as `"pre_existing": true` in your output. They're reported separately and don't count toward the review verdict.

**The rule:** If you'd flag the same issue on an identical diff that didn't include the surrounding file, it's pre-existing. If the diff makes the issue *newly relevant* (e.g., a new caller hits an existing buggy function), it's secondary.
