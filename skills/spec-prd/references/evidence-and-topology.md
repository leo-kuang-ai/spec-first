# Evidence And Topology

Load this reference before writing `Current System Snapshot`, `Change Delta`, topology, source-of-truth, or source-backed PRD claims.

This is the steel frame for brownfield PRDs: first establish trustworthy current-state evidence, then classify the system-shape risk that would otherwise make planning invent WHAT.

## Contents

- [Evidence Tags](#evidence-tags)
- [Candidate Boundary](#candidate-boundary)
- [Calibration Source Boundary](#calibration-source-boundary)
- [Current-State Coverage](#current-state-coverage)
- [Topology Framing Gate](#topology-framing-gate)
- [Boundary Blocks](#boundary-blocks)
- [Readiness Gates](#readiness-gates)
- [Contradiction Handling](#contradiction-handling)

## Evidence Tags

Use the strongest available evidence and label every material current-state claim:

1. `confirmed-source` - repo source, tests, docs, contracts, templates, or deterministic command output directly confirms the claim.
2. `user-stated` - the product owner explicitly states the claim and it is not contradicted by confirmed source.
3. `source-candidate` - a bounded source search or user-provided pointer identifies a candidate file/symbol/flow, but direct source confirmation has not happened.
4. `external-research` - explicit external source, with date and link or citation.
5. `assumption` - agent inference carried because it is safe, visible, and reviewable.

These PRD tags are authoring provenance labels, not a provider contract. Do not introduce provider-specific evidence enums.

## Candidate Boundary

Candidate source hits can guide what to read next, but they must not be written as confirmed current-state facts until direct source/docs/tests or deterministic command output confirms the claim.

Candidates retrieved from a local knowledge base, code index, prior-artifact summary, or any retrieval layer are `source-candidate` evidence by the same rule: they are advisory pointers for what to read, not confirmed truth. Confirm a material knowledge-base candidate with a direct source/docs/tests read or deterministic command before marking it `confirmed-source`; when retrieval is unavailable, degrade to bounded direct reads, `rg`, ast-grep, and docs/tests/package facts.

If a claim affects scope, acceptance, compliance, money movement, user-visible behavior, permission boundaries, source-of-truth, or downstream consumers, confirm it with direct source/docs/tests or record it as `assumption` / `Outstanding Questions`.

## Calibration Source Boundary

Use PRD/user decisions as the authority for product WHAT, acceptance, scope, and non-goals. Calibration sources can improve precision, but they do not create product requirements by themselves:

- project docs, SPECs, glossaries, and standards calibrate canonical terms, domain boundaries, existing rules, and design-before-planning questions;
- source, code, tests, and code indexes confirm current behavior, active surfaces, candidate paths, contradictions, regression risks, and downstream consumers;
- prior plans, learnings, and archive cases warn about historical risks, but do not replace current acceptance or owner decisions.

When the owner input is itself split across a ratified decision record (review conclusions, sign-off minutes) and raw discussion (verbatim transcript, chat log) or an older draft, separate them by decision status, not by document type: a ratified owner decision sets scope, acceptance, or non-goals as `user-stated` until confirmed source contradicts it, while proposals, rejected ideas, thinking-aloud, and superseded draft text stay reference-claims even though they share the same meeting. If a ratified decision conflicts with the raw discussion or draft, record a `contradiction` and ask one minimal owner question rather than silently ranking one above the other.

For Feature Slices, candidate modules and source refs are evidence pointers only. A code index hit, SPEC statement, or historical case must not infer a user goal, add a new acceptance criterion, or override an explicit PRD non-goal without owner confirmation.

## Current-State Coverage

Right-size the snapshot, but check these dimensions before deciding something is irrelevant:

- existing user-visible capability or workflow
- pages, routes, commands, APIs, background jobs, skills, agents, or CLI entries involved
- roles, permissions, accounts, tenant/market/region rules, and actor boundaries
- status, exception, empty, loading, retry, cancellation, and failure behavior
- configuration, feature flags, generated/runtime assets, package surfaces, and docs/tests/contracts that already define the behavior

Current-state discovery constrains the PRD. It does not expand product scope by itself.

## Change Delta Vocabulary

Every material change should be classified:

- `keep` - explicitly preserved behavior or surface
- `extend` - added behavior on top of an existing capability
- `replace` - new behavior supersedes existing behavior
- `remove` - existing behavior is retired
- `unknown` - the owner or source evidence has not resolved the delta

Avoid "same as before" or "reuse existing logic" unless the preserved behavior and delta are explicit.

## Topology Framing Gate

Run this gate early when the request, PRD, or source evidence signals removal, migration, workflow/contract change, source-of-truth movement, generated/runtime mirrors, package/docs/test cleanup, or cross-surface scope. Reuse it before drafting when current-state analysis reveals the same risks.

The gate classifies the **shape of the system change**, not the user's input intent. It is run-local authoring discipline, not a required final PRD section.

```text
candidate_topologies:
load_bearing_surfaces:
source_of_truth_risk:
producer_consumer_risk:
negative_space_risk:
owner_question_needed:
evidence_plan:
```

Use `unknown` where the prompt is not enough. Do not keep reading indefinitely to avoid one hard product decision; if the missing answer changes WHAT, enter the one-question-at-a-time grill and ask the owner question that closes or narrows the named PRD write target.

## Evidence Plan

Before turning current-state observations into PRD claims, identify the evidence needed for each load-bearing surface:

```text
claim_or_question | surface | source_to_read_or_command | required_evidence_tag | why_load_bearing | fallback_if_unconfirmed
```

Evidence planning is mandatory for workflow, contract, setup/runtime, migration, replace, remove, source-of-truth, generated/runtime, mixed-surface PRDs, and any increment whose standard PRD sections would otherwise rely on unconfirmed source claims. It can be abbreviated only when a small single-surface `add` or `extend` increment is already source-resolved.

Use the plan to prevent two failure modes:

- broad repo reading without knowing which WHAT decision it proves;
- narrow reading that misses package, docs, tests, runtime generation, or downstream consumers.

Every material final claim must still use the evidence tags above. External-tool output, generated mirrors, historical docs, and old plans remain pointers unless direct source/docs/tests confirm the current fact.

## Topology Types

Choose the primary topology that most affects planning invention risk. A PRD may mention secondary topologies only when they matter.

| Topology | Use when | PRD precision risk |
| --- | --- | --- |
| `add` | A new capability, entry, state, artifact, or workflow surface is introduced. | Plan may invent where it attaches or who consumes it. |
| `extend` | Existing capability gains behavior while preserving identity. | A real identity/default/permission change may be hidden as "enhancement". |
| `replace` | New behavior supersedes old behavior. | Old behavior exit, compatibility, migration, and rollback may be underspecified. |
| `remove` | Existing active behavior, entry, artifact, or integration is retired. | Producers, consumers, tests, docs, and package surfaces may remain alive. |
| `migrate` | Source-of-truth, data ownership, runtime delivery, or config authority moves. | Dual-write, drift, validation, and rollback boundaries may be invented later. |
| `split` | One large product/system scope becomes multiple independently plannable scopes. | Shared identity, release order, and cross-scope contracts may drift. |
| `merge` | Multiple concepts, entries, or workflows collapse into one. | Old names/routes/docs may stay current or consumers may not know the canonical path. |
| `policy-change` | Defaults, permissions, gating, compliance, operational rules, or support policy change. | Behavior vs documentation-only change may blur. |
| `workflow-change` | Skill, agent, command, handoff, review, setup, or runtime workflow behavior changes. | Entry, artifact, downstream consumer, and generated runtime boundaries may be missed. |
| `contract-change` | Schema, artifact, API, config, CLI output, package surface, or test contract changes. | Versioning, producer/consumer coverage, and compatibility may be incomplete. |

## Boundary Blocks

Use these compact blocks only when they reduce planning invention.

### Surface Map

```text
surface | current behavior | owner/source | artifact/contract | consumer | delta | evidence
```

Suggested surfaces: user entry, CLI/API/UI, skill/agent/workflow, config, runtime generation, artifact/schema/report, docs/onboarding, tests/fixtures/package, release/ops/support.

### Producer / Artifact / Consumer

Use when any durable or semi-durable output exists:

```text
producer | artifact/schema/path | freshness/authority | consumers | change effect | evidence
```

Producer/consumer discovery is required when the PRD changes workflow handoff, generated assets, setup facts, review facts, schemas, reports, package contents, or any artifact another skill, CLI command, test, or document consumes.

### Source-Of-Truth Resolution

Use for generated assets, mirrored docs, config, schemas, artifacts, templates, external-tool facts, or source/runtime boundaries:

```text
current_source_of_truth:
target_source_of_truth:
generated_mirrors:
non_authoritative_refs:
conflict_rule:
```

Historical docs, stale artifacts, generated mirrors, copied docs, and external-tool output are not source-of-truth unless the PRD explicitly promotes them and explains why.

### Negative Space

For high-risk, mixed-surface, workflow, contract, migration, replace, or remove changes, add negative acceptance examples for what must not be generated, called, installed, exposed, linked, consumed, widened, or treated as current truth.

## Owner Question Ladder

Ask only questions that decide scope, behavior, source-of-truth, or acceptance. Prefer source reads over owner questions when the repo can answer the point.

- `add`: Where does this attach, who is the first real consumer, and which existing defaults/permissions must remain unchanged?
- `extend`: Which identity is preserved, and which default, entry, permission, or actor behavior must not change?
- `replace`: What is the old behavior's exit rule, coexistence window, compatibility promise, and rollback boundary?
- `remove`: Which active entries, generated outputs, docs/tests/package surfaces, and downstream consumers must be gone versus archived?
- `migrate`: What is the current authority, target authority, coexistence/read path, drift check, and backout rule?
- `split`: Which child scope is independently plannable first, and what shared identity or dependency must stay common?
- `merge`: What is the canonical name/entry, and what happens to old aliases, routes, docs, and consumers?
- `policy-change`: Who owns the policy decision, when does it take effect, and what exception/support/audit language is required?
- `workflow-change`: Which public entry, internal helper, dispatch boundary, handoff artifact, generated runtime mirror, and downstream skill changes?
- `contract-change`: Who produces the contract, who consumes it, what version/compatibility rule applies, and which fixtures/tests prove it?

A lengthening owner-question sequence is not a stop reason; grilling continues relentlessly by default. Each owner question must name the gap it advances, the source attempt already made, and the PRD write target it changes. When the target surface is anchored enough for guided owner adjudication, load `grill-with-docs-integration.md` and continue one-question-at-a-time under the parent Interaction Method; a branch stops only at a legal stop point in SKILL.md `Canonical: Four Legal Stop Points`. When the anchor is missing, the topic is broad discovery, or no defensible question sequence exists, `route-out`: summarize the unresolved decision cluster and route to PRD refine/doc review, brainstorm, or blocker closeout. When the owner gives no cap/continue signal, fall back to checkpoint per Canonical rather than silently emitting ready.

## Readiness Gates

- Low-risk `add` / `extend`: entry or preserved identity, first consumer, permissions/defaults, empty/error behavior, and non-goals are explicit.
- `replace` / `remove` / `migrate` / `merge` / `split`: exit/coexistence, active surfaces, generated outputs, docs/tests/package, rollback/archive, shared identity, old aliases, and consumer updates are explicit where relevant.
- `policy-change` / `workflow-change` / `contract-change`: decision owner, effective date/default, public entry, internal helper boundary, artifacts, handoff, dispatch, generated runtime, schema/version, consumers, fixtures/tests, and release impact are explicit where relevant.

If this lens exposes unanswered questions that would force `spec-plan` to decide WHAT, the PRD is not `ready-for-planning`. Ask the source-backed grill question that closes or narrows the named PRD write target, record a visible assumption, or route to doc review.

## Contradiction Handling

A contradiction can arise from user wording, confirmed source, and the project domain glossary (`docs/contracts/domain-glossary.md`) when it exists. If any two conflict:

1. Record the mismatch as `contradiction`.
2. Cite the source path or source tag for each side, including the glossary's `canonical_name` when relevant.
3. Give an evidence-backed recommended default when one is safe. Prefer the established canonical term over a new ad-hoc one unless source proves the canonical is stale.
4. Ask one grill owner question that decides or narrows the named scope, acceptance, or PRD write-target gap.

Do not silently convert user-stated claims into confirmed source facts, and do not silently override an established canonical term.

## Confirmed Claim Rule

A current-state claim without an evidence tag cannot be treated as `confirmed-source`. Put it in `Evidence And Assumptions` or `Outstanding Questions` until confirmed.
