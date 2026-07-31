# Apply Findings

Load this reference only from Stage 5c after the orchestrator has confirmed all
three admission conditions: default mode, `mutation_policy: apply-fixes`, and a
non-degraded local reviewed-tree scope. This reference never grants mutation
authority by itself.

## Act policy

Default to applying every finding that is a clear improvement and a reversible
edit, regardless of severity. The work is a tracked, visible diff that can be
reverted. Decide by judgment, not a safety checklist:

- Apply clear improvements such as test hardening, dead-code removal, or a
  localized fix with a concrete `suggested_fix`.
- Push back when the reviewer is wrong; keep the finding and explain why.
- Skip taste calls and conflicting suggestions with an explicit reason.

Severity, confidence, and cross-reviewer agreement determine priority and
visibility; they do not replace the Stage 5c admission gate.

## Scope and verification

- Apply only when the working tree is the reviewed `local-aligned` or standalone
  tree. Remote PR or branch scope is report-only.
- Run affected tests and lint after every applied fix. Revert a fix that fails
  its verification and return it to the finding queue.
- Review only the Stage 5c diff against the pre-apply checkpoint. If follow-up
  edits are needed, rerun the affected checks.
- Treat auth/authz, public contracts, persistence, and concurrency changes as
  green-but-still-review-sensitive even when targeted tests pass.

## Commit boundary

Record the pre-apply Git state and dirty overlap before editing.

- `mutation_policy: apply-fixes` does not authorize commit.
- Without separate commit authorization, leave verified fixes uncommitted.
- With authorization and a clean pre-review tree, commit only review-owned
  verified fixes using the repository convention.
- Never stage unrelated paths or overlap user-owned dirty hunks.
- Never push, open a PR, or file tickets from this workflow.

After apply, remove applied findings from `triage_groups`; groups describe only
remaining work.
