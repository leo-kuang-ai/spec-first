# Contract Reset Lite Product Analysis

This reference is loaded only when the invocation explicitly includes
`analysis_profile=contract-reset-lite`. It is an opt-in evaluation branch, not
the default `spec-prd` contract and not authorization to promote the historical
Contract Reset candidate.

## Invariants

- Keep the current durable artifact topology:
  `docs/brainstorms/*-requirements.md` with `artifact_kind: prd-requirements`.
- Keep create/refine preview-first, validate report-only, the existing
  Decision Card, checker/finalizer, producer receipt, and optional downstream
  `--verify-receipt` diagnostic.
- Create no separate Product Analysis artifact, progress ledger, second OQ
  schema, unified-plan sibling, migration manifest, consumer gate, or runtime
  projection.
- Scripts continue to own structure, trace, path, hash, and receipt facts. The
  LLM owns analysis, recommendation, and semantic-readiness judgment but never
  confirms a product decision. The current user is the sole human product
  confirmer for target WHAT, priority, risk acceptance, scope caps, and defer
  decisions.
- Specialist, regulatory, privacy, security, financial, and professional
  materials are confirmation evidence, not additional human roles. An
  independent planner or reviewer may evaluate Lite outcomes, but does not
  confirm product decisions or join the user interaction path.

## Single Run-Local Product Analysis Brief

Build one visible run-local Brief before any durable PRD write. The Brief is
the Lite representation of the Requirement Analysis Gate, Product Expert Lens
risk ranking, and Push-Right owner checkpoint; do not render those as parallel
mandatory maps.

The Brief must contain:

| Field | Required content |
| --- | --- |
| `product_frame` | actor, problem, expected outcome, why now, success evidence, candidate release slice |
| `current_target_delta` | confirmed current behavior, target behavior, and the observable delta |
| `source_inventory` | each identified source with the fields defined below |
| `confirmation_conflicts` | conflicting, superseded, unread, or insufficient-basis claims and affected PRD write targets |
| `candidate_behaviors` | states, errors, permissions, degraded behavior, compatibility, and observable scenarios that may become Requirements or Acceptance Examples |
| `priority_confirmation` | evidence supporting the current user's priority/risk confirmation; otherwise keep the priority candidate labeled |
| `acceptance_gaps` | load-bearing R/AE gaps and what planning would have to invent if they remain open |
| `design_coverage` | `not-applicable`, covered refs, or unread/degraded items with their readiness consequence |
| `next_source_or_decision` | the single highest-value source read or current-user confirmation to perform next |
| `closure_summary` | source-resolved, owner-answered/capped, evidence-backed assumption, implementation-only HOW pushdown, blocker, or route-out residue |

The Brief is complete only when every load-bearing gap points to a PRD write
target and the next action is unambiguous. If this cannot be achieved, the
legal result is `ask-owner-first`, `checkpoint-prd`, or `route-out`, not a
smaller Brief that hides the gap.

## Source Inventory And Confirmation Basis

For every identified PRD, meeting note, code/test/doc source, design ref,
provider output, screenshot/OCR extraction, external research item, or owner
answer, record:

- `source_ref` and `source_type`;
- `read_status`;
- `evidence_tag` (`confirmed-source`, `user-stated`, `source-candidate`,
  `provider_untrusted`, `external-research`, or `assumption`);
- freshness/version;
- confirmation scope and basis;
- sensitivity and sanitization limitation;
- affected PRD write target and readiness consequence.

`read_status` proves accessibility only. Code and tests confirm current
behavior, not target scope or priority. Meeting material becomes a confirmed
target decision only when its ratification state, confirmation basis, and
freshness are all supported. Model knowledge, external research, provider
output, and design proposals remain candidate evidence until project source or
the current user confirms the claim.

The current user is the only human question recipient and the sole product
confirmer. Regulatory, privacy, security, financial, and professional claims
must still record evidence need, affected R/AE refs, confirmation timing, and
fallback, but named specialists or historical sign-off roles remain evidence
provenance rather than a second contact. When reliable formal source is
missing, ask the current user whether to confirm explicitly, defer, scope-cap,
or keep the item as `source-candidate`, assumption, or blocker with a reopen
condition. Never have the LLM confirm it automatically.

## Release-Bounded Closure

Resolve source-answerable gaps before asking the user. Ask only the current
highest-risk load-bearing question, one at a time, using the normal Interaction
Method.

A question can move out of the current release only when the Brief records
checkable evidence that it does not change acceptance, compatibility, rollout,
data authority, permissions, fallback behavior, or the current R/AE set, plus
a reopen condition. The phrase "not in this release" alone is not closure.
Map an evidence-backed exclusion to the existing
`source-backed-non-WHAT-assumption` disposition; otherwise keep it blocking or
obtain an owner cap.

Compact analysis is allowed for a single surface with no source conflict,
high-risk evidence/confirmation gap, or load-bearing unread evidence. Compact
means fewer rows, not skipping the Brief, semantic review, Decision Card,
checker, or finalize.

Load deeper references only when the Brief exposes their trigger:

- domain/glossary conflict -> `domain-language-and-decision-ledger.md`;
- unresolved rough/draft behavior requiring sustained interview ->
  `grill-with-docs-integration.md`;
- design material -> `design-source-evidence.md`;
- oversized/resume-risk input -> `large-input-checkpoint.md`.

Do not load `product-expert-lens.md` as a second mandatory analysis pass in
Lite mode; the Brief already owns risk ordering. It may be consulted only when
the Brief cannot rank competing product risks without its rubric.

## Legacy Artifact Mapping

Write only useful results into the existing PRD contract:

| Brief content | Existing durable destination |
| --- | --- |
| product frame | Summary |
| current/target/delta | Current System Snapshot and Change Delta |
| source inventory / confirmation conflicts | Evidence And Assumptions and Decision Notes |
| candidate behaviors / acceptance gaps | Requirements and Acceptance Examples |
| scope proof / reopen condition | Scope Boundaries, Planning Recheck, or Outstanding Questions |
| owner answer or cap | Owner Decision Trace and the specifically bound OQ |
| design coverage | Design Source Coverage |
| closure summary | Readiness Self-Check and Decision Card declarations |

Set `preflight_sweep_closure` from the Brief result so the existing checker can
verify the compatibility declaration. Set `clarification_evidence` to a
non-`skipped` value that truthfully identifies the source or owner round-trip.
Derive the existing Decision Card from the Brief; do not add a second durable
readiness or decision schema.

## Semantic Review And Completion

Before `final-prd`, confirm:

- actor/problem/outcome/why-now/success evidence and the release slice are
  explicit;
- current facts are separated from target decisions;
- no source, model, design proposal, provider output, or user answer exceeds
  its evidence or confirmation scope;
- each load-bearing Requirement has an observable Acceptance Example or trace;
- critical state, error, permission, degraded, compatibility, fallback, and
  reopen behavior is closed or visibly blocking;
- an independent planner would not need to invent load-bearing WHAT. This is
  an evaluation check, not a second product-confirmation role.

If any check fails, keep `write_mode=checkpoint-prd` or `ask-owner-first` and
name the next source/decision. If they pass, use the normal legacy
`prd-output-template.md`, `prd-readiness-lens.md`, and producer-local finalizer.
Validate uses the same Brief only as a report structure and remains zero
mutation.
