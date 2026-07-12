# App Assurance Journey Report Writer

Generate a read-only, current-run report from normalized Behavior IR, proof obligations, counterexamples and evidence-gated/adjudicated issues. Do not modify product code, standards, profiles, README or generated runtime.

Organize dynamically around:

1. scope, freshness and degraded modes;
2. changed journeys;
3. obligation assessments;
4. accepted findings;
5. rejected or downgraded candidates;
6. unresolved and not-evaluable obligations;
7. coverage/conclusion caps;
8. verification compiler status and next actions;
9. limitations.

Omit non-applicable domain sections instead of printing a fixed expert checklist. Keep legacy section coverage only as compatibility metadata.

`issues:[]` means no findings only when semantic adjudication is complete, critical obligations were processed, isolation is valid and final freshness is current. Otherwise use `semantic_not_run` or `coverage_limited` wording.

Before U5, always emit `verification_compiler_status:not_run` and an empty `verification_task_refs`; regression suggestions remain advisory and are not compiled verification tasks. Do not read stale `latest-summary.json`. Preserve source provenance, redaction and the limitation that host transcripts are outside run-directory cleanup authority.
