# Proof Obligations And Counterexample Search

## Boundary

U3 converts a validated current-run Behavior IR into proof obligations and candidate counterexamples. It does not create issues, adjudicate candidates, assign merge severity, or emit a full verification plan.

Authority is per obligation. A mixed artifact never upgrades its members. Scripts may confirm only artifact, reference, hash and freshness invariants. State completeness, recovery adequacy, navigation semantics and platform ownership remain LLM advisory judgments.

## Obligation lifecycle

- `script_confirmed`: only a script-produced mechanical invariant.
- `not_assessed`: a mechanically generated semantic proof question awaiting judgment.
- `llm_advisory`: an LLM-produced or LLM-assessed semantic claim.

Assessments use `proven | disproven | unresolved | not_evaluable`. U3 assessments do not become confirmed findings. U4 owns challenge, issue synthesis and evidence adjudication.

## Absence claims

An absence claim requires positive expectation evidence and a bounded negative search scope. `coverage_cap:complete` is valid only when the scan is not truncated, required platform sources were included, providers were ready, and generated code, dynamic routing and DI bindings were covered. Otherwise the obligation is forced to `unresolved` with a candidate/advisory cap.

## Counterexamples

Counterexamples begin and remain `candidate` in U3. Each binds one obligation, model refs, direct evidence, missing evidence and a minimum verification hint. Dedupe merges evidence and limitations only; it never raises authority or conclusion cap.

Core search covers critical-journey failures, duplicate submit, navigation reachability and platform ownership. Permission/lifecycle and accessibility lenses load only when the IR or obligation category supplies a matching signal. Rule packs can seed a question but cannot provide direct project evidence.

## Stop conditions

Stop when selected critical-journey obligations have been searched, no unhandled high-impact signal remains, or the journey/token/time/count budget is exhausted. Budget exhaustion must record omitted obligation or counterexample refs; silent truncation is invalid.
