# Compound Refresh Recommendation

Recommend one consolidation candidate and one glossary refinement. Preserve both original learnings until the consolidated successor and its consumers are verified. Retain **Ledger space** as an alias of **Workspace** because the supplied `import-v1` consumer still uses it.

**Nothing was applied or published.** This is a read-only, mediated draft. The supplied validation receipt records a real failure; it does not validate the proposed content below.

## Scope and evidence

All fixture paths below are relative to:

`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/`

Reviewed:

- `learning-a.md`
- `learning-b.md`
- `CONCEPTS.md`
- `import-v1.md`
- `invalid-candidate.md`

Also consumed the named `wave1/refresh-validation-failure.json` receipt and the assigned frozen Skill’s relevant references, schema, and template.

The supplied corpus establishes what these documents say. It does not establish application behavior, successful incident recovery, or exhaustive consumer coverage. No application source, tests, external evidence, or repository-wide citations were inspected. The two original learnings declare no invalidation conditions; that is a legacy evidence gap, not proof of staleness.

```yaml
mutation_authorization: missing
commit_authorization: missing
landing_authorization: missing
commit_reason: commit_authorization_missing
worker_dispatch_authorization: missing
capability_probe: not_applicable
worker_dispatch_capability: unknown
worker_context_isolation: unknown
worker_model_override: unknown
worker_bounded_parallelism: unknown
worker_dispatch_outcome: dispatch_authorization_missing
```

Investigation and semantic review were inline. No independent review or additional delegation occurred.

## Summary

| Outcome | Result |
|---|---|
| Learnings scanned | 2 |
| Consolidation recommended | 1 cluster containing 2 learnings |
| Updated, consolidated, replaced, deleted, or stale-marked durably | 0 |
| Existing consumer reviewed without edits | `import-v1.md` |
| Failed candidate retained without promotion | `invalid-candidate.md` |
| Glossary | Refinement recommended, not published |
| Worth lens | Off |

## Applied

None. No files were written, deleted, staged, committed, or published. No validation commands were executed during this review.

There is no partial publication: all five supplied fixture files remain unchanged by this trial.

## Recommended

### Consolidate `learning-a.md` into `learning-b.md`

**Classification:** Consolidate, conditional on validation and consumer checks.

Both learnings state:

> Validate numeric amounts before write.

Each also carries distinct recovery knowledge:

| Source | Unique content that must survive |
|---|---|
| `learning-a.md` | “Preserve original bank exports for row-level reconciliation.” |
| `learning-b.md` | “For retry duplicates, compare original import IDs before reimport; never erase unrelated rows.” |

Choose `learning-b.md` as the proposed canonical target because it already covers validation and retry recovery. This is an editorial choice based on supplied content, not evidence that it is newer or more authoritative.

A compact combined document can retain both recovery paths without becoming unwieldy. Neither original currently subsumes the other: deleting either now would lose guidance. There is no evidence supporting Replace or Stale.

**Dependency group:**

1. Prepare and validate the complete canonical candidate.
2. Establish durable provenance for both originals; the candidate must not depend on a deleted source reference that becomes unresolvable.
3. Inspect inbound citations, anchors, and catalog entries within an authorized publication scope.
4. Preserve or redirect substantive consumers to the actual retained content.
5. Publish and verify the canonical document and required citation repairs.
6. Only then consider deleting `learning-a.md`, with its original content recoverable.

The supplied fixture contains no explicit inbound references to either learning. That limited observation does not establish repository-wide absence. No deletion is approved by this review.

### Refine `CONCEPTS.md`

**Classification:** Update; consolidate the existing synonym presentation under the surviving Workspace entry.

The current glossary defines Workspace as:

> a tenant-isolated accounting scope.

It explicitly identifies Ledger space as a historical alias. The consumer in `import-v1.md` supplies substantive compatibility evidence:

> Legacy API field ledger_space_id still identifies the Workspace. The old term is consumed here and must remain resolvable.

Therefore:

- Preserve **Workspace** and its existing meaning.
- Preserve **Ledger space** as a visible, searchable alias.
- Retain a short historical explanation because an actual supplied consumer needs it.
- Keep `ledger_space_id` in the consumer document rather than moving API-field details into the glossary.
- Do not retire the term or imply the legacy consumer has migrated.

No additional core domain model was supplied. Adding invented definitions for imports, rows, or bank exports would exceed the evidence.

Proposed accounting: **0 added, 1 refined, 1 synonym folded, 0 retired**. These are candidate operations, not published changes.

### Preserve `invalid-candidate.md` as failed evidence

**Classification:** Keep unchanged as a deliberately invalid validation fixture; exclude it from promoted learning counts.

Its unsupported request-shape diagnosis must not enter the consolidated learning. The supplied text says such a detail exists but supplies no diagnosis, supporting source, or verified result.

The actual receipt records:

```text
exit_code: 1

promotion requires non-empty top-level 'source_refs' array
promotion requires non-empty top-level 'invalidation_condition'
```

Receipt candidate SHA-256:

```text
335ff42d6323b91a91ded75141eb22646560eba738d3aaf1d6da30a42b1df427
```

The receipt expressly states that no publication was attempted. This is evidence of a failed promotion check on that candidate, not a check on the draft below. The hash was read from the receipt and was not independently recomputed.

Publication remains blocked for the invalid candidate. Merely adding nonempty metadata would not establish semantic support for its extra diagnosis.

## Reviewed without edits

### `import-v1.md`

**Classification:** Keep.

It is the supplied historical consumer that makes the Ledger space alias load-bearing. Preserve its complete content:

```markdown
Legacy API field ledger_space_id still identifies the Workspace. The old term is consumed here and must remain resolvable.
```

Its compatibility statement was observed in the fixture, not confirmed against running application code.

### Original recovery material

Keep `learning-a.md` and the current `learning-b.md` intact pending successful consolidation. Missing corroborating application evidence does not justify stripping plausible recovery guidance or marking it stale.

## Proposed final content

The following is complete proposed text, returned in this report only. It has not been saved or validated.

### Canonical candidate: `learning-b.md`

The classification is knowledge-track `best_practice`, with `application_code` as the affected responsibility. `medium` is a provisional editorial impact classification, not measured incident severity.

The source references below point to the supplied evidence while both originals remain present. Before any eventual deletion, the publisher must replace references that would become missing or self-referential with verified, durable provenance. No revision identifier is invented here.

```markdown
---
title: Safe numeric imports and retry recovery
date: "2026-10-30"
module: Accounting imports
problem_type: best_practice
component: application_code
severity: medium
source_refs:
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/learning-a.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/learning-b.md"
invalidation_condition: "Re-review this guidance when the import contract changes numeric validation before writes, original-export retention, import-ID comparison during retries, or protection of unrelated rows; compare the changed contract and relevant tests with each retained recommendation before revising it."
applies_when:
  - "Importing numeric amounts from bank exports"
  - "Reconciling imported rows against original bank exports"
  - "Investigating duplicate rows during an import retry"
tags:
  - "numeric-validation"
  - "bank-imports"
  - "retry-recovery"
  - "row-reconciliation"
---

# Safe numeric imports and retry recovery

## Context

The supplied learnings share a numeric-validation rule and contribute complementary recovery guidance. This document preserves both contributions. Application behavior and recovery outcomes have not been independently verified.

## Guidance

- Validate numeric amounts before write.
- Preserve original bank exports for row-level reconciliation.
- For retry duplicates, compare original import IDs before reimport.
- Never erase unrelated rows during recovery.

## Why This Matters

Numeric validation, row-level reconciliation, and retry identification address different parts of import safety. Combining the learnings must retain the original export evidence, the import-ID comparison, and the boundary protecting unrelated rows.

## When to Apply

Use this guidance when importing numeric amounts, reconciling imported rows, or investigating duplicate rows after a retry.

## Evidence Limits

These recommendations are preserved from the two supplied learning documents. No application implementation, test result, or verified incident account was supplied. No request-shape diagnosis is established by this evidence.
```

### Glossary candidate: `CONCEPTS.md`

```markdown
# Concepts

Shared domain vocabulary for this project.

## Workspace

A tenant-isolated accounting scope.

*Historical alias:* Ledger space.

Ledger space names the same concept as Workspace. Retain this alias so readers of historical import interfaces can resolve the term.
```

### Conditional disposition: `learning-a.md`

No replacement text is proposed at this path. Its eventual deletion is dependent on verified publication of the canonical content, durable recovery evidence, and resolved citations. Until those conditions are met, retain the original unchanged:

```markdown
Validate numeric amounts before write. Preserve original bank exports for row-level reconciliation.
```

### `invalid-candidate.md`

No repair or publication is proposed. Preserve the deliberately invalid fixture unchanged:

```markdown
---
title: Numeric input validation
source_refs: []
invalidation_condition: null
---
The candidate adds a request-shape diagnosis detail absent from the older learning. This deliberately invalid promotion candidate must not be reported as validated or published.
```

## Validation, consumers, and publication status

| Check | Actual result |
|---|---|
| Supplied invalid-candidate promotion check | Failed, exit 1, according to the actual receipt |
| Proposed canonical candidate schema/script validation | Not run |
| Proposed canonical claims and final-path link checks | Not run |
| Glossary semantic review | Inline review supports preserving Workspace and its historical alias |
| Consolidation semantic review | Content preservation is supported; durable promotion approval remains withheld |
| Exhaustive inbound citations and catalog identities | Not checked; outside supplied evidence |
| Target existence/hash snapshots and freshness rechecks | Not performed |
| Filesystem publication and post-publication verification | Not attempted |
| Independent review | Not performed |

Manual reading supports the proposed content union; it is not a validator pass or confirmation of application behavior. The workflow’s ordered-publication rules are procedural requirements, not evidence that a transactional runtime gate executed.

Discoverability through project instruction files was not assessed because no such fixture was supplied and the request prohibits reading beyond the assigned materials. No instruction-file change is proposed. No catalog or archive fixture was supplied; their broader existence and cleanup needs remain unassessed.

The deliverable is this recommendation and its proposed text. Any parent persistence of this response records a trial artifact; it does not publish the learning or glossary.
