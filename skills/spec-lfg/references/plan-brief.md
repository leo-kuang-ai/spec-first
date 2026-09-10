# Plan Input And Readiness (Step 1)

When the invoking conversation carries settled product or planning decisions, provide a separate transient brief alongside the unchanged `forwarded_arguments`: direction, each decision's provenance class (`user-directed` or `user-approved`), rejected alternative, one-line reason, open areas, and a standing instruction to report contradictory evidence. Include only decisions relevant to this task. Demote an entry with no examined alternative to a directive or open area; omit the brief entirely when none qualify. A retry reuses the same brief verbatim. Once the plan is written, its labeled decision owners are canonical. Model/harness routing instructions are execution context, never settled product decisions.

A blocked result carrying `settled-decision-invalidated` must retain that reason and its evidence; never retry it as a missing-plan case.

Invoke the `spec-plan` skill with the exact `forwarded_arguments` payload. When
   `spec-brainstorm` invoked LFG, this payload is the absolute requirements-only
   unified plan path, so `spec-plan` recognizes it as an explicit Product Contract
   source and enriches that same artifact in place.

   GATE: STOP. A `status: blocked` return is terminal even when `artifact_path` names a readable plan. Preserve `artifact_path` when present, `phase`, `blocker`, and `recovery_path`; do not retry or enter implementation. Failed, malformed, non-software, or otherwise invalid results also stop.

   Check only the path that `spec-plan` reported writing this run. An existing file in `docs/plans/` that this invocation did not report cannot satisfy the gate. Only when there is no blocker or invalid result and no reported path, invoke `spec-plan` once more with the same `forwarded_arguments` payload. A second missing path stops as blocked; never substitute a stale matching file. Record the reported plan path for steps 2 and 4, and verify that it exists before advancing.

   Read the plan metadata before continuing. If the plan has `artifact_contract: spec-unified-plan/v1`, proceed only when it has `artifact_readiness: implementation-ready` and `execution: code`. Stop the pipeline for `artifact_readiness: requirements-only`, any unrecognized readiness value, `execution: knowledge-work`, approach-plan outputs, answer-seeking/universal outputs, or invalid progress-like readiness values. LFG never launches `/goal` directly; when goal-mode or dynamic workflows are appropriate, `spec-work` owns that implementation engine choice and must return control to LFG afterward.
