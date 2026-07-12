# App Behavior Model v1

## Purpose and boundary

`app-behavior-model.v1` is a producer-local, run-local model of one changed App feature's critical journeys. Its consumers are App Assurance obligations, counterexample search and reporting. It is not a universal workflow IR, a whole-App knowledge graph, a code-review handoff or confirmed project truth.

The host LLM produces raw semantic JSON under the current run's ephemeral `input/` boundary. `normalize-behavior-model.js` redacts and validates it into `app-behavior-model.json`. The normalizer never calls a model, invents semantic links, merges similar names or upgrades authority.

## Core vocabulary

- Feature: changed product capability in audit scope.
- Journey: entry/preconditions, ordered transitions, happy exit and at least one failure/cancel exit.
- Surface: screen, view or other user-facing interaction surface.
- State: behaviorally distinguishable condition; UI detail is optional.
- Event: user, system or lifecycle stimulus.
- Transition: source state + event + target state on a surface.
- Navigation: movement between surfaces, including external or back navigation.
- Platform Ownership: shared, Android, iOS, split or unknown responsibility for a semantic subject.

Every core item carries a stable run-local ID, platform scope, semantic status, evidence refs, freshness, confidence and limitations. `observed` requires direct evidence. `inferred`, `contradicted` and `unknown` require explicit limitations.

## Identity and contradictions

Name similarity only creates an identity candidate. A PRD page, Figma frame and code screen become one supported behavior identity only when allowed semantic evidence supports that mapping. Conflicting source assertions remain first-class contradictions until resolved; normalization never silently selects a winner.

## Evidence and freshness

`evidence_catalog` contains short, redacted, traceable locators and hashes. Core `evidence_refs` resolve only within the same model. `run_id` and `prepare_fingerprint` must match U1 prepared metadata. A mismatch blocks semantic continuation; U2 does not recompute or replace the U1 lifecycle fingerprint.

Normalized artifacts use `retention_class:run_local`. Raw source excerpts, staged model input/output and prompt context remain ephemeral and are cleaned by U1 finalize/abort. Host transcripts remain outside run-directory cleanup authority.

## Core versus extensions

Core is always required. Optional extensions are evidence-triggered:

- state kind, rendered outcome, available/disabled events, entry/exit conditions, terminal/transient and recoverability;
- permissions/guards;
- side effects;
- decision branches;
- back navigation;
- re-entry/resume;
- cross-cutting obligation refs.

Missing extension fields cap only the related obligation at unresolved/not-evaluable. They do not invalidate an otherwise complete core journey.

## Coverage behavior

- No materialized Figma: design alignment is `not_evaluable`; do not fabricate design nodes.
- No PRD: cap product-intent conclusions.
- One platform only: the missing platform's parity is `not_evaluable`.
- Partial source scan, generated route, dynamic DI or hidden platform source: absence claims remain unresolved.
- Partial Figma evidence caps only the missing variants, prototype transitions or accessibility subclaims; it does not make all design input unavailable.

## Anti-patterns

- Building a complete App graph during Trial.
- Treating schema validity, confidence or multi-agent agreement as confirmation.
- Auto-linking same-name surfaces.
- Creating placeholder nodes to satisfy references.
- Persisting raw excerpts, absolute paths, credentials or token-bearing URLs.
- Letting scripts decide business completeness or architecture adequacy.
