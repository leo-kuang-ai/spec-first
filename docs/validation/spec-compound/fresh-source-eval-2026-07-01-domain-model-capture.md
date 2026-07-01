---
title: "fresh-source eval: spec-compound domain model capture"
date: 2026-07-01
status: passed
workflow: spec-compound
plan: docs/plans/2026-07-01-001-feat-spec-compound-domain-modeling-capture-plan.md
---

# fresh-source eval: spec-compound domain model capture

## Scope

This eval reviewed the current source files on disk after integrating Domain Model Capture into `spec-compound`.

Source paths:

- `skills/spec-compound/SKILL.md`
- `skills/spec-compound/references/domain-model-capture.md`
- `skills/spec-compound/references/concepts-vocabulary.md`
- `skills/spec-compound-refresh/SKILL.md`
- `skills/spec-compound-refresh/references/concepts-vocabulary.md`
- `skills/spec-compound/evals/examples.json`
- `tests/unit/spec-compound-contracts.test.js`

Runtime mirrors were not treated as source evidence. Final closeout separately refreshed generated mirrors from source and checked runtime parity.

## Changed Behavior

`spec-compound` now has a scoped Domain Model Capture step that adapts glossary challenge, fuzzy term sharpening, scenario stress, code cross-reference, and ADR-candidate discipline while preserving one primary `docs/solutions/` learning document.

`CONCEPTS.md` remains update-only advisory vocabulary. `CONTEXT.md`, `CONTEXT-MAP.md`, and `docs/adr/**` remain preview-only candidates in ordinary compound runs.

`spec-compound-refresh` now collects vocabulary/domain drift but does not rerun full Domain Model Capture and does not edit context or ADR files in `mode:autofix`.

## Reviewer Result

```yaml
fresh_source_eval:
  status: passed
  reviewer_context: "fresh source snippets from current disk plus final source audit after P2 fixes"
  runtime_paths_checked: []
  checks:
    trigger_precision: passed
    source_runtime_boundary: passed
    host_entrypoints: passed
    internal_only_boundary: passed
    deterministic_vs_semantic_boundary: passed
    tests: passed
  findings: []
```

Evidence cited by the reviewer:

- `skills/spec-compound/SKILL.md`
- `skills/spec-compound/references/domain-model-capture.md`
- `skills/spec-compound/references/concepts-vocabulary.md`
- `skills/spec-compound-refresh/SKILL.md`
- `skills/spec-compound-refresh/references/concepts-vocabulary.md`
- `tests/unit/spec-compound-contracts.test.js`

## Final Fixes After Review

The review passes raised P2/P3 concerns, all addressed in source and contract tests:

- Lightweight compound output now includes `Context/ADR candidates: <none | preview only — path/reason/evidence>`, matching full success and alternate full output examples.
- `spec-compound-refresh` discoverability now triggers only when refresh added, refined, or scrubbed entries in an existing `CONCEPTS.md`, or when the user explicitly asked for vocabulary discoverability maintenance. A scan with no qualifying terms does not create instruction-file churn.
- Domain Model Capture output now uses the same three-line order and enum across the entrypoint and reference: `Domain model capture`, `CONCEPTS.md`, then `Context/ADR candidates`.
- Contract tests now validate those three output sections by section and enforce field order, instead of treating the global example count as the contract.

The final source audit confirmed these fixes from current disk source and locked them with `tests/unit/spec-compound-contracts.test.js` assertions.

## Deterministic Checks

Final checks run for this closeout:

- `npx jest tests/unit/spec-compound-contracts.test.js tests/unit/concepts-vocabulary-contracts.test.js tests/unit/workflow-eval-readiness-contracts.test.js tests/unit/changelog-format.test.js tests/unit/plan-status-taxonomy.test.js --runInBand` — passed.
- `npm run lint:skill-entrypoints` — passed.
- `python3 /Users/kuang/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/spec-compound` — passed.
- `git diff --check -- CHANGELOG.md docs/plans/2026-07-01-001-feat-spec-compound-domain-modeling-capture-plan.md docs/validation/spec-compound/fresh-source-eval-2026-07-01-domain-model-capture.md skills/spec-compound/SKILL.md skills/spec-compound/references/domain-model-capture.md skills/spec-compound/references/concepts-vocabulary.md skills/spec-compound/evals/examples.json skills/spec-compound-refresh/SKILL.md skills/spec-compound-refresh/references/concepts-vocabulary.md tests/unit/spec-compound-contracts.test.js` — passed.
- `node bin/spec-first.js init -y --claude` — passed.
- `node bin/spec-first.js init -y --codex` — passed.
- `git diff --name-only -- .claude .codex .agents/skills` — passed with no tracked runtime diff.
- `rg` runtime anchor checks confirmed generated Claude/Codex mirrors include the new Domain Model Capture and output-template anchors.

## Boundary Notes

- The new reference is package-local and does not depend on external local `domain-modeling` paths.
- The change does not add a public workflow, command, or standalone `domain-modeling` entrypoint.
- Scripts and tests only lock deterministic anchors and source boundaries; term qualification and ADR candidacy remain LLM-owned semantic judgment.
- Runtime projection was refreshed only through `spec-first init` from source; generated mirrors were not hand-edited and remain excluded from tracked source diff.
