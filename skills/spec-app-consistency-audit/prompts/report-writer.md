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

Without a current valid verification plan, emit `verification_compiler_status:not_run`, `verification_execution_status:not_run` and empty task refs. With a valid U5 plan, emit compiler status, execution `not_run`, task/blocked/human-checkpoint counts and current plan ref. Never describe generated tasks as executed, passed, failed or verified. Regression suggestions remain advisory and are not compiled verification tasks. Do not read stale `latest-summary.json`.
