---
title: CE-first skill migration method
date: 2026-07-08
category: docs/solutions/conventions
module: skill-migration
problem_type: convention
component: development_workflow
severity: high
applies_when:
  - Migrating CE skills into spec-first skills
  - Auditing whether a migrated spec-first skill still preserves CE behavior
  - Repairing CE-to-spec-first drift in skill references, scripts, tests, or docs
tags: [ce-migration, skill-migration, source-runtime-boundary, artifact-contracts]
---

# CE-first skill migration method

## Context

During the CE-to-spec-first skill migration audit, a recurring failure mode appeared: after correctly removing obvious CE names and paths, it was tempting to "improve" a migrated skill by rewriting its output chain to match a newer spec-first preference.

That is not the migration contract. CE is the behavior source for the migrated skill. The spec-first version should preserve CE's phases, inputs, outputs, artifacts, fallback behavior, helper semantics, and downstream handoffs unless there is an explicit, documented spec-first boundary that requires projection.

The `ce-sweep` to `spec-sweep` review made the distinction concrete. Necessary projection included `ce-sweep` to `spec-sweep`, the CE machine-local config root to the spec-first machine-local config root, `/tmp/compound-engineering/ce-sweep` to `/tmp/spec-first/spec-sweep`, `ce-brainstorm` to `spec-brainstorm`, and `/lfg` to `spec-lfg`. But changing CE's `docs/plans/` unified-plan output hint into a `docs/brainstorms/` requirements-document hint was not a necessary projection; it changed the CE behavior contract. The correction was to keep CE's output chain and only project the names.

## Guidance

Treat CE as the behavior source and spec-first as the projection target.

The migration sequence should be:

1. Read every CE source file for the skill: `SKILL.md`, references, assets, scripts, and local agent prompts.
2. Read every spec-first target file that already exists.
3. Classify every difference as one of three things:
   - Necessary projection: names, paths, host entrypoints, local config roots, scratch roots, and source/runtime boundaries that must change for spec-first.
   - Preserved CE behavior: phases, artifact shapes, state machines, helper semantics, output paths, and downstream handoffs that should remain intact.
   - Accidental drift: changes introduced because the spec-first version looked cleaner or more current, but CE did not make that change.
4. Patch accidental drift back toward CE.
5. Record each preserved behavior and necessary projection in the migration audit document.
6. Add focused tests only where they lock a real migration contract or regression, not as a synthetic checklist.

Necessary projection is narrow. Examples:

```text
ce-sweep                         -> spec-sweep
ce-brainstorm                    -> spec-brainstorm
/lfg                             -> spec-lfg
.compound-engineering/...        -> .spec-first/...
/tmp/compound-engineering/<name> -> /tmp/spec-first/<name>
product_contract_source: ce-*    -> product_contract_source: spec-*
```

Preserved CE behavior is broad. Examples:

```text
first-run interview phases
standing approval semantics
lease/state engine ownership
ack/read-back/cursor discipline
media analysis scratch artifact pattern
rolling plan path and reconciliation rules
schedule helper handoff plus platform fallback
unrelated local config key preservation
```

Do not use "remove CE traces" as the primary rule. A string can be an invalid CE residual, a necessary projection candidate, or a legitimate CE behavior cue that should be expressed in spec-first names. Decide from behavior first, then edit text.

## Why This Matters

The risk in this migration is not only leaving old names behind. The larger risk is silently dropping CE capabilities while producing a cleaner-looking spec-first skill.

When a downstream skill relies on a CE artifact, state file, helper prompt, or plan shape, changing that output during migration creates a hidden compatibility break. Tests that only assert "no `ce-*` strings remain" can pass while the behavior contract is lost. The right invariant is:

> CE capability preserved, spec-first boundary projected.

This also keeps source/runtime discipline clear. Source changes belong in `skills/`, docs, scripts, and tests. Generated runtime mirrors under `.agents/skills/`, `.claude/`, or `.codex/` are not edited by hand.

## When to Apply

- A CE skill is being copied, replaced, or audited against a `spec-*` skill.
- A migrated skill still references CE names, paths, artifact contracts, or helper assumptions.
- A review suggests "modernizing" a migrated skill's output path, handoff, or artifact contract.
- The team needs to decide whether a difference is an intentional spec-first divergence or accidental behavior loss.

## Examples

### Keep CE output behavior; project only names

For `ce-sweep`:

```text
CE behavior:
  analyzer handoff tells brainstorm to write a durable unified plan under docs/plans/

Correct projection:
  spec-brainstorm writes the durable unified plan under docs/plans/

Incorrect rewrite:
  spec-brainstorm writes durable requirements under docs/brainstorms/
```

The incorrect rewrite may match another spec-first workflow's current convention, but it is not what CE sweep specified.

### Preserve unrelated config key handling

CE interview text used `work_delegate_*`, `pulse_*`, and `plan_*` as examples of unrelated local config keys that must be preserved while writing sweep keys.

The correct migration keeps that preservation rule. It may clarify that `work_delegate_*` is not active sweep config, but it should not delete the example merely because another setup review retired it as a persisted setup preference. The local config write rule is broader than the lifecycle status of one key family.

### Schedule helper wording

CE referred to an in-plugin `schedule` skill. In spec-first, the plugin wording is not valid, but the behavior is:

```text
Use installed schedule helper if available; otherwise point to cron, GitHub Actions, or host-native automation.
```

That is a projection, not a behavior change.

## Related

- `docs/solutions/architecture-patterns/upstream-ce-sync-upgrade-methodology-2026-04-26.md` — broader CE update synchronization protocol.
- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md` — source/runtime boundary for generated mirrors.
- `docs/validation/2026-07-08-ce-to-spec-first-skill-audit-plan.md` — active migration audit ledger for CE skill mappings.
- `docs/validation/2026-07-08-completed-skill-path-audit-summary.md` — running record of user corrections during migration review.
