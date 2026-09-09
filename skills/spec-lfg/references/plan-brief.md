1. Invoke the `spec-plan` skill with the exact `forwarded_arguments` payload. When
   `spec-brainstorm` invoked LFG, this payload is the absolute requirements-only
   unified plan path, so `spec-plan` recognizes it as an explicit Product Contract
   source and enriches that same artifact in place.

   GATE: STOP. If spec-plan reported the task is non-software and cannot be processed in pipeline mode, stop the pipeline and inform the user that LFG requires software tasks. Otherwise, verify that the `spec-plan` workflow produced a plan file in `docs/plans/`. If no plan file was created, invoke `spec-plan` again with the same `forwarded_arguments` payload. Do NOT proceed to step 2 until a written plan exists. **Record the plan file path** — it will be passed to spec-work in step 2 and spec-code-review in step 4.

   Read the plan metadata before continuing. If the plan has `artifact_contract: spec-unified-plan/v1`, proceed only when it has `artifact_readiness: implementation-ready` and `execution: code`. Stop the pipeline for `artifact_readiness: requirements-only`, any unrecognized readiness value, `execution: knowledge-work`, approach-plan outputs, answer-seeking/universal outputs, or invalid progress-like readiness values. LFG never launches `/goal` directly; when goal-mode or dynamic workflows are appropriate, `spec-work` owns that implementation engine choice and must return control to LFG afterward.
