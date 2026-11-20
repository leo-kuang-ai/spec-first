# Implementation Quality And Architecture Fit

This reference is the implementation-quality owner for `spec-work`. It is responsible for durable-surface trigger, current-source capability inventory, `reuse / extend / compose / new` recheck, thin-glue ownership, future-only refusal, wrong-owner escape, material deviation note, and simplification classification.

It does not redesign the plan. `spec-plan` is responsible for architectural design; `spec-work` only verifies whether the plan/task decision remains compatible with the current source. Stop and return to `spec-plan` or task-pack regeneration when new public contract, cross-module architecture, schema/runtime/provider/source-of-truth decisions are required.

## Owned

- Conduct a current-source capability inventory and review of the four implementation options prior to durable surface mutation.
- Constraints: thin-glue owns/does-not-own, failure/degradation/observability/evidence seam.
- Reject future-only wrappers, wrong-owner reuse, and unauthorized architectural expansion.
- In phase boundary classification simplification, and record material deviation/claim limitation.

## Not Owned

- Redesign the plan, invent an acceptance/public contract or alternative `spec-plan` architecture decision.
- Turn generic best practices, single nearby pattern, or provider candidate into hard rules.
- Use a script to decide ownership fit, four-posture, or simplification semantics.

## Trigger

Read before adding or substantially modifying any of the following durable surfaces: dependency, file, abstraction, helper, wrapper, adapter, orchestrator, public contract, schema, config/runtime surface, source-of-truth entry, workflow handoff, provider/repo boundary, generator, template, agent/skill prompt, artifact contract, or generated runtime delivery.

## Fallback

The following typically do not trigger a full lens: typos/documentation wording, changelog-only changes, bounded updates based on test expectations, localized implementations with clearly assigned owners, pure formatting, and minor fixes without a durable surface. They continue to adhere to the scope/source/runtime/verification boundaries, but do not output the architecture matrix or lengthy decision note.

## Current-Source Capability Inventory

Perform bounded inventory before invention:

1. Does the current source already have the capability to fully meet the requirements?
2. What are the current owner, source-of-truth, public/internal contract, and extension point?
3. Can coordination be achieved through caller, config, existing workflow, or narrow adapter without duplicating a second implementation?
4. Determine whether `compose / thin-glue` or `new` in plan has become outdated due to evolution of current source;
5. The generated runtime mirror serves solely as drift/consumer evidence and is never the candidate owner.

The stopping condition is "sufficient to judge fit," not "proof that there is absolutely no similar code in the repository."Provider/graph is used solely for candidate navigation; key owner/contract responsibilities still require confirmation from source/test/doc.

## Four-Posture Recheck

Choose the option that fits the proposed change:

- `reuse`: The existing capability/contract is already sufficient; use it directly without wrapping.
- `extend`: The existing owner already possesses this boundary and can absorb the focused behavior without shifting responsibility;
- `compose / thin-glue`: Multiple authoritative capabilities remain independent, connected only through a narrow seam;
- `new`: Reusing, extending, or composing will all blur responsibilities, distort contracts, hide coupling, or introduce an ambiguous source of truth; thus, a new boundary must be justified by current requirements.

Reuse is not a quota. If the nearby capability is owned by the wrong party, business rules must not be forcibly inserted to "reduce file count"; instead, prioritize identifying the correct owner or extension seam. Only when the seam cannot support the requirement should a plan be used to establish a newly authorized boundary. No single suspicious nearby pattern, generic best practice, or imagined future consumer can independently authorize a new abstraction.

Use the following priority order when evidence conflicts: confirmed active standard/source-of-truth > explicit plan/task decision > owner/source module boundary > nearby pattern. If the plan's effective owner shows a significant drift from the current source's effective owner, adopt the current valid posture and record a material deviation; if this would alter acceptance/public boundaries, stop implementation and return to planning.

## Thin-Glue Boundary

Thin glue can have:

- contract/representation translation;
- sequencing vs. orchestration
- participant failure propagation;
- Aggregation of partial failures; rollback/fallback/degradation routing
- cross-step observability, trace/correlation, and evidence aggregation
- A clear safety/authorization boundary.

Thin glue does not have:

- duplicated domain truth or new business policy;
- participant's copy of the existing validation rule;
- parallel durable state / second source of truth;
- To suppress failures by swallowing error, partial result, or owner identity;
- Convenience APIs or future-only options unrelated to coordination.

If the wrapper does not add real translation, sequencing, safety, or evidence/observability boundary, delete or do not create it. If glue begins to decide domain rules, persistent state, or final truth, the behavior should be moved back to the correct owner, or genuinely new boundaries should be established based on the plan.

Can respond at least when composing:

- Each participant remains authoritative for what;
- glue owns / does-not-own what;
- How failures (single participant failure, multiple partial failures, timeout/retry) are propagated;
- How is the degraded path visible to the caller?
- How to preserve cross-seam evidence for logs, metrics, artifacts, and reason_code.

## Scope And Authorization Stop-Back

If the active plan/task does not have authorization for new public API/contract, cross-module abstraction, schema/runtime/config surface, source-of-truth entry, workflow handoff, provider/repo boundary, or generated runtime delivery, it shall not proceed to on-the-spot design during the implementation phase. Stop mutation and return: direct evidence found, current four implementation options, rationale for how this changes scope/ownership, and recommended repair path for `spec-plan` / `spec-write-tasks`.

“It's convenient to implement”, “might be reusable later”, “it's commonly done in the industry” are not authorization.

## Material Deviation Note

Record a compact note only when recheck changes the plan's material implementation direction, rejects an obvious overbuild, retains non-obvious protected code, or selects a different owner/seam.

- `question`
- `planned_posture`
- `current_posture`
- `existing_capabilities_inspected`
- `source_of_truth`
- `direct_evidence`
- `chosen_answer`
- `consequence`
- `limitations` / `deferred_reason`

Normal local edit remains silent, without generating empty matrices or ceremony notes.

## Simplification At Phase Boundaries

Perform the helper check once after a behavior cluster/dependency wave is completed, or before entering final review; do not run the helper after every single line change. Classify first, then act:

| Classification | Action |
| --- | --- |
| `remove-now` | Remove current-run dead code, duplicate wrapper, unused file/import/test, speculative option, and rerun the same feedback loop. |
| `minimality-debt` | Real but out-of-scope debt is routed to the existing `deferred_follow_up[]` / review residual / tracker sink, recording title, reason, evidence, and owner; do not expand scope inadvertently, do not create a new debt schema. |
| `protected` | Retain security, data integrity, privacy, a11y, observability, rollback, compatibility, required verification, or confirmed owner constraint; treat gaps as `protected-gap` residual/review focus. |
| `architecture-mismatch` | Fix authorized wrong-layer/duplicate-owner/source-runtime issues within scope; halt and request architectural decision if new architecture is required. |

Extract helper is not the default answer. Extract only when the helper has a stable owner, current semantic repetition, a clear contract, and reduces coupling/duplication without hiding control flow. Two code segments that appear similar but have different semantics or lifecycles can remain separated.

Simplification must not remove required checks, error propagation, a11y state, observability breadcrumbs, or security boundaries in pursuit of LOC. We can't package the broad debt caused by the current run as a "cleanup" task.

## Fallback And Claim Boundary

Do not add unapproved durable surfaces when owner, source-of-truth, or architecture fit cannot be confirmed; use the existing narrowest path, return blocker/limitation, and revert plan. Source contract tests can only verify the existence of these prompt anchors, not prove that the model has stably made correct four-posture judgments; when fresh-source/host/field evidence is missing, declarations are made at the layer level.

Scripts can inventory paths, read Git, and validate schema/hash/containment; LLMs handle owner fit, four postures, thin-glue adequacy, material deviation, and simplification semantic judgment.
