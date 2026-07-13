# Scenario Capability Matrix

> Lifecycle: current. Source-of-truth for advisory workflow capability interpretation from `developer-scenario-fingerprint-setup.v1`.

## Purpose

The scenario capability matrix translates deterministic scenario fingerprint facts into a compact workflow posture. Scripts prepare the fingerprint facts; LLM workflows decide whether those facts are sufficient for the current user intent, which fallback to choose, and what limitations to disclose.

This matrix is advisory. It is not a hard gate, approval state, central workflow engine, or substitute for source reads, tests, logs, reviewer judgment, or user decisions.

## Inputs

Primary evidence:

- `.spec-first/workspace/scenario-fingerprint-setup.json` (`developer-scenario-fingerprint-setup.v1`)

Required shared fields:

- `advisory: true`
- `state_class`
- `scenario_class_provisional: true`
- `complexity_dimensions.*`
- `topology.*`
- `worktree.*`
- `freshness.*`
- `limitations[]`

## Capability Classes

Allowed values:

- `full`: normal workflow path can use source/test/log evidence without scenario-specific restrictions.
- `bounded`: workflow can proceed, but must keep repo/file scope explicit and disclose relevant limitations.
- `partial`: workflow can proceed for covered surfaces only; uncovered repo/build surfaces require direct source fallback or explicit limitation.
- `fallback-only`: setup/fingerprint facts are insufficient for claims that depend on them; use bounded direct source/test/log evidence or route to setup.
- `blocked-action-required`: do not perform writes, autofix, commits, root-cause claims, or PR-ready review claims until the named action is completed or the user explicitly accepts degraded evidence.

## Default Matrix

| Scenario class | Capability class | Required Evidence | Fallback path | LLM decision point |
| --- | --- | --- | --- | --- |
| `clean-single-repo` | `full` | Fresh setup layer; `complexity_dimensions.multi_repo_workspace=false` | Normal workflow path | Decide which source/test/log evidence matches the user intent |
| `dirty-single-repo` | `bounded` | `worktree.dirty_paths_sample[]`, `dirty_paths_breakdown`, and dirty evidence dimensions | Keep diff scope explicit; disclose relevant dirty paths before commit/PR/review claims | Decide whether dirty state affects the requested workflow |
| `first-time-git-repo` | `fallback-only` | Missing or setup-only fingerprint plus first-time state facts | Recommend `spec-first init` / `spec-runtime-setup` for setup-heavy goals; use direct reads for lightweight goals | Decide whether the task can proceed without setup-owned facts |
| `multi-repo-workspace` | `bounded` | `topology.child_repo_count` and child repo paths | Require explicit `target_repo` or per-child scope before writes/tests/commits | Decide which child repo evidence is relevant |
| `multi-repo-dirty-workspace` | `partial` | Per-child dirty facts, `worktree.dirty_child_count`, and bounded dirty samples | Proceed only for explicitly scoped clean/understood child surfaces; disclose dirty children | Decide whether dirty children are in or out of scope |
| `foreign-residual-workspace` | `blocked-action-required` | `foreign_residual_indicators[]` and, when present, `parent-artifact-quarantine.v1` | Run `spec-first clean --workspace-orphans` preview and `spec-first init`, or get explicit degraded-evidence acceptance | Decide whether any local artifact can be trusted before action |
| `non-git-folder` | `partial` | `target_kind=non-git-folder`, folder snapshot/fingerprint, and no git revision facts | Use direct file reads and non-git verification; no git diff/impact claims | Decide whether non-git evidence is sufficient for the task |
| `non-git-build-workspace` | `partial` | `complexity_dimensions.non_git_build_targets_present` and known build module facts | Scope action to covered git roots or directly inspect uncovered build modules | Decide whether build-target coverage gaps matter for the request |

## High-Risk Overrides

High-risk workflows are those that can mutate source, make review/debug claims with user-visible consequences, or route commits/PR handoffs. The first version applies overrides only to:

- `spec-work`
- `spec-code-review`
- `spec-debug`

Required high-risk overrides:

| Condition | Capability class | Required Evidence | Fallback path | LLM decision point |
| --- | --- | --- | --- | --- |
| `foreign-residual-workspace` or non-empty `foreign_residual_indicators[]` | `blocked-action-required` | Setup fingerprint plus residual indicators/quarantine path | Stop before writes/autofix/root-cause/review claims; run `spec-first clean --workspace-orphans` preview and `spec-first init`, or get explicit degraded-evidence acceptance | Decide whether continuing would rely on untrusted local artifacts |
| optional external-tool evidence unavailable | `fallback-only` | Explicit limitation when the requested claim depends on unavailable optional evidence | Use bounded direct source/test/log evidence; do not claim impact, review coverage, or root cause beyond direct evidence | Decide whether optional external-tool evidence is required for the requested claim |
| `non-git-build-workspace` with `git_alignment_broken=true` | `partial` | uncovered build module list or direct source inventory | Scope action to covered git roots or directly inspect uncovered build modules | Decide whether uncovered build targets are in scope |

## Default Workflow Declaration

Public workflows without a high-risk override declare:

```markdown
## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` (default).
Overrides: none
```

This declaration means the workflow consumes the default matrix as advisory context when scenario fingerprint facts are available. It does not require the workflow to read runtime mirrors, refresh local artifacts, or block lightweight work when direct source evidence is sufficient.

## Boundaries

- Do not collapse scenario fields into a single risk score.
- Do not let scripts decide semantic workflow suitability.
- Do not treat missing fingerprints as failure for existing users; use the `using-spec-first` setup-artifact guidance path.
- Do not update generated runtime mirrors by hand; source workflow files under `skills/` are the truth source.
- Do not expand a plan, review scope, debug target, or work target solely because a scenario fact names an adjacent repo or build module.
