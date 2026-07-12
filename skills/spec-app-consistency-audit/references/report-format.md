# App Assurance Journey Report Format

## Scope, freshness and coverage caps

State current-run inputs, final freshness, unavailable sources, degraded modes and claim-specific caps. No evidence is not a pass. Missing Figma caps design alignment only; missing platform source caps parity only.

## Changed journeys

For each selected journey show platform scope, coverage status, proof-obligation counts, accepted/rejected finding refs and limitations. Do not render empty fixed expert sections.

## Findings and challenge results

Each finding retains severity, claim family/type, affected surface, confidence, project evidence, model/obligation/counterexample refs, conclusion cap, semantic adjudication, lifecycle, impact and recommendation. Rejected/downgraded candidates remain visible with reason codes.

## Unresolved and not evaluable

List unresolved obligations, missing evidence and the minimum verification hint from U3. These hints are not executable tasks.

## Verification status

Before U5:

```text
verification_compiler_status: not_run
verification_task_refs: []
```

Regression suggestions remain advisory and must not be described as compiled verification work.

## Empty-result wording

- Completed isolated adjudication + critical obligations processed + current final freshness + no findings: `no_findings_after_completed_adjudication`.
- Semantic stage absent: `semantic_not_run`.
- Degraded, stale, incomplete or isolation-unverified: `coverage_limited`.

## Privacy and retention

Use short redacted summaries and repo-relative locators. Never persist credentials, token-bearing URLs, absolute local paths or long raw excerpts. State that host transcripts are outside run-directory cleanup authority.
