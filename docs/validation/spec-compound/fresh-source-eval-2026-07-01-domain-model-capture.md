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

Execution record:

- Mode: fresh-source eval using a bounded read-only reviewer over current disk source; runtime mirrors were excluded from eval evidence.
- Dispatch boundary: the reviewer was asked to evaluate only the listed source paths, not to edit files, create context/ADR artifacts, or rely on current-session cached skill text.
- Reviewer prompt summary: verify that Domain Model Capture is an adapted discipline inside `spec-compound`, preserves one primary `docs/solutions/` learning, keeps `CONCEPTS.md` update-only advisory, treats `CONTEXT.md`/`CONTEXT-MAP.md`/`docs/adr/**` as preview-only candidates, keeps scripts/tests at deterministic-anchor level, and aligns `spec-compound-refresh` without rerunning full capture.
- Reviewer output artifact: the raw reviewer transcript was not stored as a separate durable artifact; the material result is preserved below as a structured excerpt plus the exact source paths cited. This validation record is therefore the audit artifact.

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

Reviewer raw-result excerpt:

```text
Verdict: passed.
No P0/P1 findings.
The source defines Domain Model Capture as package-local and self-contained, keeps one primary docs/solutions learning, keeps CONCEPTS.md advisory/update-only, and keeps context/ADR as preview-only candidates. Refresh collects vocabulary/domain drift but does not rerun full Domain Model Capture. Tests lock deterministic anchors while leaving term qualification and ADR candidacy to LLM semantic judgment.
```

## Final Fixes After Review

The review passes raised P2/P3 concerns, all addressed in source and contract tests:

| Finding | Resolution evidence |
| --- | --- |
| Lightweight compound output omitted explicit context/ADR candidate status. | `skills/spec-compound/SKILL.md` lightweight output now includes `Context/ADR candidates: <none | preview only — path/reason/evidence>`; `tests/unit/spec-compound-contracts.test.js` checks lightweight, full success, and alternate output sections. |
| `spec-compound-refresh` discoverability could create instruction-file churn after a no-op vocabulary scan. | `skills/spec-compound-refresh/SKILL.md` and `skills/spec-compound-refresh/references/concepts-vocabulary.md` now trigger discoverability only after added/refined/scrubbed entries or explicit vocabulary discoverability maintenance; contract tests assert the narrowed wording. |
| Domain Model Capture output order and enum could drift between entrypoint and reference. | `skills/spec-compound/SKILL.md` and `skills/spec-compound/references/domain-model-capture.md` now use the same three-line order: `Domain model capture`, `CONCEPTS.md`, then `Context/ADR candidates`; tests enforce section-local order. |
| Contract tests over-counted global examples instead of checking the relevant output templates. | `tests/unit/spec-compound-contracts.test.js` now validates the required fields inside each output block rather than relying on global occurrence counts. |
| Later report-only review found the validation record was too thin to audit and path-leak checks were too narrow. | This file now preserves the reviewer prompt summary, structured result excerpt, and fix mapping; `tests/unit/spec-compound-contracts.test.js` now rejects broad external local path patterns such as `/Users/`, `/home/`, `/private/var/`, and Windows user-home paths in the relevant source surfaces. |

The final source audit confirmed these fixes from current disk source and locked them with `tests/unit/spec-compound-contracts.test.js` assertions.

## Deterministic Checks

Final checks run for this closeout:

- `npx jest tests/unit/spec-compound-contracts.test.js tests/unit/concepts-vocabulary-contracts.test.js tests/unit/workflow-eval-readiness-contracts.test.js tests/unit/changelog-format.test.js tests/unit/plan-status-taxonomy.test.js --runInBand` — passed.
- `npm run lint:skill-entrypoints` — passed.
- skill-creator `quick_validate.py skills/spec-compound` helper — passed.
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
