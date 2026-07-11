# Evaluation And Governance Status

Source-only governance detail for `spec-app-consistency-audit`. This file is
maintainer evidence under `evals/` and is intentionally excluded from generated
runtime packages.

## Maturity

Current posture: production, team-reused workflow command.

This package is not governed-ready and not public-claim-ready. Do not claim governed
status until trust, output-quality, and reviewer-scored output evidence exists.

Owner: Spec-First maintainers.

Review cadence: per release, or whenever trigger, runner, artifact, or handoff
contracts change.

## Eval Status

`skills/spec-app-consistency-audit/evals/examples.json` is examples-as-context for
trigger, near-neighbor boundary, failure, and expected-output coverage. It is not a
deterministic router and does not prove semantic output quality.

`skills/spec-app-consistency-audit/evals/recorded-output-fixtures.json` is minimal
recorded fixture evidence for no-raw-issues, degraded-mode preservation, and
code-review handoff fields. It is deterministic file-backed evidence, not
provider-backed model execution or reviewer-scored output quality evidence.

LLM judgment still owns route choice, expert selection, evidence sufficiency, issue
validity, severity, impact, recommendation, and downstream handoff judgment.

## Governed-Package Evidence Labels

- `file-backed fixture`: current evidence includes focused Jest runner/artifact
  tests, the canonical eval fixture, and minimal recorded output fixtures. Blind
  holdout and reviewer-scored output eval remain absent.
- `input_files`: PRD/product input, local Figma context JSON, App source root, diff
  base, staged raw issues, and run-scoped artifacts.
- `output contract`: run-scoped artifacts, headless envelope, `issues.json`,
  `audit-report.json`, and Report-Writer handoff fields.
- `rollback boundary`: source-only changes here; generated runtime mirrors refresh
  through `spec-first init`.
- `trust report`: `missing evidence`.
- `reports/output_quality_scorecard.md`: `missing evidence`.

## Promotion Boundary

Treat focused Jest tests and structural eval fixtures as file-backed readiness
evidence only. They do not replace fresh-source eval, blind output review, or
human-owner acceptance for semantic quality claims.

Do not add a per-skill `manifest.json` unless spec-first adopts that as a source
truth; lifecycle delivery currently lives in the dual-host governance contract.
