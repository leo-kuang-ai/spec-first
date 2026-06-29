# task-governance-signals.v1

`task-governance-signals.v1` is the canonical contract for deterministic task-size and task-risk facts.

The helper emits a `candidate_level` in `spec-plan` depth language: `lightweight`, `standard`, or `deep`. This is advisory input only. The workflow LLM confirms or overrides the final plan depth and records the reason.

## Signal Sources

- `plan-declared`: pre-code / pre-plan planning context. Inputs are the user request, origin document text, candidate paths/modules from bounded source reads, and text keywords. It must not depend on draft Implementation Units because Phase 0.6 runs before the plan is written.
- `git-diff`: code already changed. Inputs are `git diff --numstat` facts, parsed as `<added>\t<deleted>\t<path>`.

## Input Schema (`--input` file, plan-declared source)

`plan-declared` collection reads a JSON file passed via `--input`. The producer is the only place this shape is defined; consumers must build the file to match. Unknown keys are ignored, and a missing/unreadable file degrades to empty signals with `reason_code: planning-context-unreadable` (it does not error).

| Field | Type | Meaning |
| --- | --- | --- |
| `request` | string | The user request text. Scanned for keywords. |
| `origin_text` | string | Origin requirement/plan text. Scanned for keywords. |
| `text` | string | Any extra free text to scan. |
| `candidate_paths` | string[] | Candidate file paths from bounded source reads. Counted in `declared_path_count`. |
| `paths` | string[] | Additional declared paths, merged with `candidate_paths`. |
| `source_refs` | string[] | Source reference paths. Counted in `source_ref_count`. |
| `target_areas` | string[] | Declared target areas; merged with top dirs of declared paths. |

All fields are optional; absent fields are treated as empty. `git-diff` source ignores `--input` (passing both is rejected).

## Collection Status

`collection_status` is a top-level field on every output. It reports whether signal collection was trustworthy, which is a **distinct axis** from `candidate_level`. A collection failure still yields a valid `candidate_level` (empty signals fall to `lightweight`), so a consumer must not read `candidate_level` alone — a `lightweight` candidate under `degraded`/`unavailable` is **not** trustworthy low-risk; treat depth as unknown and fall back to direct evidence.

It is advisory and never-blocking: the exit code stays `0` for `ok`, `degraded`, and `unavailable`. A non-zero exit is reserved for a rejected invocation (bad arguments, schema unavailable/invalid).

The value is derived from the source `reason_code` (the first entry of `reason_codes`):

| Source reason_code | `collection_status` |
| --- | --- |
| `git-diff-collected` | `ok` |
| `empty-diff` | `ok` |
| `plan-declared-collected` | `ok` |
| `no-diff-base` | `degraded` |
| `git-diff-failed` | `degraded` |
| `planning-context-unreadable` | `degraded` |
| `not-a-repo` | `unavailable` |

Cross-contract note: `collection_status` deliberately shares the `unavailable` vocabulary with `resource-governance-lens.v1`'s top-level `status`, but it is a different axis. `resource-lens.status` answers "did I find advisory items" and has no `degraded`; `collection_status` answers "was collection trustworthy" and needs `degraded` because task-signals has a `--base-ref`/`--input` that can fail while the repo still exists — a state resource-lens has no equivalent for.

## Canonical Fields

The JSON schema in `task-governance-signals.schema.json` is the canonical field definition. Other docs may describe consumption, but must not redefine field shape.

The contract intentionally has no `score` and no numeric `confidence`. Scripts enforce schema/shape invariants and expose facts; the LLM decides plan-depth adequacy above that floor.

## Consumers

Consumers must treat `candidate_level` and the transparent buckets as advisory facts. `collection_status` must be read alongside `candidate_level`; a `lightweight` candidate without trustworthy collection is not confirmed low risk.

- `spec-plan` Phase 0.6 consumes `plan-declared` output before a plan exists. The workflow LLM confirms or overrides plan depth and records the reason.
- `spec-write-tasks` may use `plan-declared` output only as optional cross-check evidence after a source plan exists. At task-compilation time, written source-plan structure is the primary evidence: implementation-unit count, declared `Files`, dependency chains, cross-module surfaces, verification spread, and `plan_depth` when present. `spec-write-tasks` must not treat `plan-declared` as a hard gate or a second source of truth, and must fall back to direct plan evidence when collection is degraded, unavailable, absent, or weaker than the written plan structure.

## Transparent Buckets

The default producer uses simple, visible buckets. The thresholds below are advisory and intentionally visible so the workflow LLM can question or override them; they are candidate facts, not final task classification.

`deep` when any of:

| Signal | Threshold |
| --- | --- |
| `line_delta` | `>= 1000` |
| `file_count` | `>= 10` |
| `declared_path_count` | `>= 8` |
| `source_ref_count` | `>= 6` |
| `target_area_count` | `>= 4` |
| `critical_path_hits` | `>= 2` |

Otherwise `standard` when any of:

| Signal | Threshold |
| --- | --- |
| `line_delta` | `>= 400` |
| `file_count` | `>= 4` |
| `declared_path_count` | `>= 3` |
| `source_ref_count` | `>= 2` |
| `cross_module` | `true` |
| `keyword_hits` | `>= 1` |
| `critical_path_hits` | `>= 1` |

Otherwise `lightweight` (no broad surface and no high-risk signal).
