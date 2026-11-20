# Task Pack Review Lens

This reference is loaded only when the `spec-doc-review` has categorized the document as `task-pack`. It enables the existing document-review owner to consume the high-risk handoff of `spec-write-tasks` without introducing new workflow, task-pack schema, approval state, or a second set of validator.

## Ownership

- `spec-first tasks validate` is responsible for identity, freshness, structure, path containment, and machine-readable contract shape.
- `spec-doc-review` is responsible for task quality, source-plan fidelity, dependency/wave, files/side effects, verification/review intent, and semantic judgment with respect to the terminal owner within the deterministic floor.
- `spec-write-tasks` remains the task pack producer and regeneration owner.
- `source_plan` remains the sole authority for scope, acceptance, architecture, non-goals, and verification; the task pack is merely a derived execution index.

## Deterministic Intake

First parse an existing `artifact_root` that contains both a task pack and its `source_plan`. `--repo` selects only the artifact/source resolution root, without granting downstream mutation authority. Run real CLI:

```text
spec-first tasks validate <task-pack-path> --repo <artifact-root> --json
```

Must confirm before proceeding with semantic review:

- process successful and `schema_version: task-pack-validation/v1`;
- `identity_basis: source-plan-path+body-hash`;
- `task_pack_validity: valid`; `deterministic_handoff: true`
- the receipt contains only one concrete artifact-root-relative `source_plan.path`;
- `task_pack_path`, `source_plan.path`, `task_pack.metadata.source_plan_hash`, `task_pack.contract`, `task_pack.execution_focus`, `validation`, `errors`, and `limitations` are derived from the current receipt; the current validator does not return the task-pack digest and therefore must not forge or infer this field from path.

Do not dispatch personas, do not downgrade the file to a regular plan, and do not have the LLM compute hash when CLI is unavailable, invalid, stale, wrong-chain, draft, path escape, source-plan missing, or any other deterministic failure occurs. Return `review_status: incomplete`, retain CLI `reason_code`, and form:

```yaml
task_pack_outcome:
  review_result: incomplete
  task_pack_validity: <CLI value or unverifiable>
  deterministic_handoff: false
  source_plan: <receipt path or null>
  reason_code: <CLI reason code>
  next_action: spec-write-tasks
```

## Current Source-Plan Read

After deterministic validation passes, read the current source plan pointed to by the receipt, rather than the summary or previous review declaration in the task pack. First check the metadata/content shape: the unified plan must have `artifact_readiness: implementation-ready` + `execution: code`; for the compatible legacy code plan, judgment follows the current plan content-shape rules. Direct the terminal owner to `spec-plan` when requirements-only, knowledge work, invalid readiness, or lack of current necessary decision exists.

Read bounded by task refs: Goal Capsule, Requirements/Scope Boundaries, related KTD, Verification Contract, Definition of Done, as well as U-ID / requirement sections referenced by tasks. Do not aim for completeness and inject the entire long plan into each persona.

## Task-Pack-Specific Semantic Lens

The `Task Pack Contract` JSON serves as the authoritative task structure; human-readable components such as Task Cards, Task Graph, Execution Waves, and Traceability Matrix can only assist in review and must be treated as findings and returned to the producer if conflicts arise. Prose must not override the JSON.

All selected personas apply the following shared lens, then overlay their individual persona scope:

1. **Source-plan fidelity**: For each task, the `source_unit` or requirement references must be traceable back to the current plan; the union of tasks must cover all material units in this round, or explicitly document plan-owned non-goal/defer items; no new acceptances, public contracts, architecture decisions, provider/source ownership, or repository scope may be introduced without plan authorization.
2. **Dependency and wave truth**: `dependencies` and `execution_waves` reflect true temporal ordering; prerequisites must not be hidden, shared file tasks must not be placed in the same wave, or a wave label must not be used to falsely imply isolation.
3. **Files and effects**: `files` and `expected_side_effects` align with the source-plan scope, current source owner, and source/runtime boundary; generated runtime mirror shall not be used as the source write owner.
4. **Verification quality**: `test_focus` and `done_signal` must be observable and cover task risks; candidate commands, review status, or artifact existence must not be used as evidence of completion.
5. **Stop and review semantics**: `stop_if` can correctly return the owner when expansion occurs in acceptance/architecture/ownership/verification; `review_gate` merely expresses review intent and is not equivalent to approval or progress state; `review_focus` should point to specific risks.
6. **Human/machine parity**: Task Cards, Traceability Matrix, Task Graph, and Execution Waves must not contradict machine-readable JSON; the `Task Pack Contract` JSON takes precedence, but mismatches remain P1/P0 issues that must be fixed by the producer.

Do not treat deterministic validation as semantic fit, and do not consider a review completion as automatic proof of correct task splitting, file scope, wave dependency, or source-plan coverage.

## Persona Packet

For each selected persona, `{document_content}` uses the following partitioning and sets `slices=mixed`:

```text
<task-pack-review-lens>This reference document in full</task-pack-review-lens>
<deterministic-intake>Compact facts of this CLI receipt</deterministic-intake>
<task-pack>Complete current task pack</task-pack>
<source-plan>Current plan's focused sections</source-plan>
```

Task-pack review is always `report-only` / `mutation_reason: task-pack-derived-artifact`. Confidence-100 `safe_auto` only enters `producer_fix_candidates`; reviewer does not directly patch derived task pack.

## Terminal Owner

After synthesis, only return a `task_pack_outcome`:

- current deterministic intake valid, mandatory coverage complete, no unresolved P0/P1 or task-pack-specific blocker → `review_result: passed`, `reason_code: task-pack-review-passed`, `next_action: spec-work-task-pack`
- task pack has unresolved P0/P1 issues in coverage, splitting, dependency/wave, files/effects, verification/review intent, or human/machine parity, while the current source plan provides sufficient decision-making → `review_result: blocked`, `reason_code: task-pack-regeneration-required`, `next_action: spec-write-tasks`
- root cause is missing/conflicting scope, acceptance, architecture, source owner, repo scope, or verification decision in the current source plan → `review_result: blocked`, `reason_code: source-plan-revision-required`, `next_action: spec-plan`;
- mandatory reviewer coverage incomplete → `review_result: incomplete`, retain coverage reason, do not return execution-ready implication.

P2/P3, FYI, and residual are retained in the review envelope, but they do not individually block `spec-work-task-pack`. `Review complete` only indicates that the review workflow has reached a terminal signal; only `task_pack_outcome` expresses the next owner for that task pack.

`roster:full` selects only the actual qualified personas, without granting subagent dispatch. Whether dispatch still evaluates the independent authorization/capability gate of `spec-doc-review`; when authorization is missing, it applies the same persona assets in an inline/serial manner and records `dispatch_authorization_missing`.
