# Refresh recommendation

Consolidate the two short learnings into one candidate that preserves **all four safeguards**. Refine the glossary around **Workspace**, retaining **Ledger space** as a resolvable historical alias because `import-v1.md` still consumes it. **Nothing has been applied or published.**

## Compound Refresh Summary

- Scanned: 2 learnings, 1 glossary, 1 consumer document, and 1 deliberately invalid candidate.
- Worth lens: off.
- Kept: 1 consumer document, without edits.
- Updated, consolidated, replaced, deleted, or marked stale: **0 applied**.
- Recommended: 1 consolidation covering both learnings; 1 glossary refinement.
- `CONCEPTS.md`: changes recommended, not published.
- Validation: supplied failure receipt consumed; no validator or tests executed.
- Review: inline interpretation of the supplied material, not independent implementation verification.

Paths below are relative to:

`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/`

This was a read-only, mediated drafting task. Mutation, commit, landing, and further worker dispatch were not authorized. No questions, external requests, or delegation were performed.

## Applied

**None.** No files were written, deleted, staged, committed, or published. All five supplied fixture files remain unchanged by this trial.

The supplied receipt also states: **“no publication attempted.”** It does not establish any partial publication.

## Reviewed without edits

### `import-v1.md` — Keep

The consumer states:

> Legacy API field ledger_space_id still identifies the Workspace. The old term is consumed here and must remain resolvable.

This is substantive compatibility evidence within the supplied corpus. It prevents treating “Ledger space” as an unused term merely because Workspace is the preferred name.

Keep this document unchanged. Preserve the API field spelling here; implementation details belong in consumer documentation rather than in the shared glossary. The fixture does not include executable consumer code, so actual runtime compatibility remains unverified.

## Recommended

### `learning-a.md` and `learning-b.md` — Consolidate candidate

Both state:

> Validate numeric amounts before write.

Their unique content is complementary:

| Source | Content that must survive |
|---|---|
| `learning-a.md` | Preserve original bank exports for row-level reconciliation. |
| `learning-b.md` | Compare original import IDs before reimport when handling retry duplicates. |
| `learning-b.md` | Never erase unrelated rows. |

Neither document fully supersedes the other. Deleting either without first preserving its unique content would lose recovery knowledge. Together, their content remains small enough for one searchable learning.

The proposed canonical document is **Bank import validation and recovery**, with separate reconciliation and retry sections. This is an editorial consolidation recommendation, not a finding that the implementation changed or that either learning became stale.

The proposed durable destination below is illustrative and requires owner confirmation of the actual knowledge-store target before publication:

`docs/solutions/best-practices/bank-import-validation-and-recovery.md`

The fixture paths remain source evidence, not deletion targets. If equivalent production learning files are later consolidated, remove those old files only after the successor, substantive citations, catalog entries, and recovery provenance have been verified. No catalog or broader citation inventory was supplied; their absence from this fixture is not proof that no consumers exist.

### Proposed canonical content

```markdown
---
title: "Bank import validation and recovery"
date: "2026-10-30"
module: "Bank imports"
problem_type: best_practice
component: application_code
severity: medium
source_refs:
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/learning-a.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/learning-b.md"
invalidation_condition: "Reassess this guidance when the bank-import contract changes amount validation, original-export retention, import-ID identity, or retry recovery scope. Compare the revised contract and relevant tests with each safeguard before changing or removing it."
applies_when:
  - "Importing numeric amounts from bank exports"
  - "Reconciling imported rows against original bank exports"
  - "Investigating duplicate imports after a retry"
tags:
  - "bank-import"
  - "numeric-validation"
  - "reconciliation"
  - "retry-recovery"
---

# Bank import validation and recovery

## Context

The supplied learnings share a rule for validating numeric amounts and
provide complementary safeguards for reconciliation and retry recovery.

This document consolidates that recorded guidance. The supplied evidence
does not demonstrate its enforcement in application code or a verified
production incident.

## Guidance

### Validate before writing

Validate numeric amounts before write.

### Preserve reconciliation evidence

Preserve original bank exports for row-level reconciliation.

### Recover from retry duplicates

For retry duplicates, compare original import IDs before reimport.
Never erase unrelated rows.

## Why This Matters

Keeping these safeguards together makes the validation rule discoverable
alongside the recovery knowledge that must remain available when an import
needs reconciliation or a retry produces duplicates.

## Evidence and limitations

The two source learnings support the guidance above. They do not specify
the numeric acceptance rules, export-retention mechanism, import-ID format,
or an implementation for duplicate removal.

No implementation verification, test execution, or production outcome is
claimed. The classification and severity are editorial judgments for this
candidate, not measured incident attributes.
```

The candidate includes the required v2 knowledge-track fields and concrete promotion fields. Its references ground the consolidation in supplied documents; they do not elevate those documents into implementation evidence. The original source files must remain recoverable if this draft is adopted.

### `CONCEPTS.md` — Update candidate

The glossary defines Workspace as a tenant-isolated accounting scope and already identifies Ledger space as its historical alias. The consumer supplies a positive reason to preserve that alias.

Refine the presentation into one preferred concept and a resolvable alias entry. This is **not concept retirement**. Do not introduce additional accounting entities, lifecycle rules, or tenancy guarantees unsupported by the fixture.

### Proposed complete `CONCEPTS.md`

```markdown
# Concepts

Shared domain vocabulary for this project — entities, named processes,
and status concepts with project-specific meaning. Seeded with core domain
vocabulary, then accretes as spec-compound and spec-compound-refresh process
learnings; direct edits are fine. Glossary only, not a spec or catch-all.

## Workspace

A tenant-isolated accounting scope.

*Historical alias:* Ledger space.

## Ledger space

A historical name for [Workspace](#workspace), retained so existing
consumers can resolve the term.
```

This preserves both names and gives the historical name an explicit anchor. The `ledger_space_id` implementation detail remains in `import-v1.md`; no consumer rewrite is required by this proposal.

Proposed vocabulary effects: Workspace refined; Ledger space preserved as an alias with a resolvable entry; no new domain concept added and no concept retired.

### `invalid-candidate.md` — Retain as failed validation evidence; do not promote

This file is a deliberate invalid candidate, not a third trustworthy learning.

The actual receipt at:

`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/refresh-validation-failure.json`

records:

- Command: `validate-frontmatter.py --promotion` against `invalid-candidate.md`.
- Exit code: **1**.
- Standard output: empty.
- Errors:

```text
promotion requires non-empty top-level 'source_refs' array
promotion requires non-empty top-level 'invalidation_condition'
```

The receipt records candidate SHA-256:

```text
335ff42d6323b91a91ded75141eb22646560eba738d3aaf1d6da30a42b1df427
```

That hash is receipt evidence; it was not recomputed in this trial.

The candidate also introduces a request-shape diagnosis detail absent from the two learnings. Adding syntactically valid promotion fields would not establish that claim. Exclude it from the proposed canonical learning unless independent supporting evidence becomes available.

Do not overwrite the deliberate failure fixture merely to make it pass. The supplied failure blocks promotion of that candidate; it neither validates nor automatically invalidates the distinct consolidation draft above.

## Validation and publication boundary

The draft received an inline textual review against the supplied schema and vocabulary rules. That review is **not a validator pass**. Execution was prohibited, so the new draft has no promotion-validator or claims-check receipt.

Before any later authorized publication:

1. Resolve the actual repository and final targets; record existence and hashes, ownership, and recovery copies.
2. Validate the exact canonical candidate with the promotion validator and claims checker at its intended final destination.
3. Verify source recoverability, inbound citations, relative links, anchors, and any catalog rows against the planned final tree.
4. Approve the semantics: all four safeguards survive, the historical alias remains resolvable, and no unsupported diagnosis has entered the learning.
5. Recheck freshness before mutation. Publish approved glossary and canonical content before dependent citation cleanup or any deletion.
6. Verify final destinations and consumers before marking a consolidation Applied.

A failed prerequisite leaves the dependent deletion blocked. Per-file publication does not provide a global multi-file transaction.

## Remaining evidence gaps

- No application source, tests, import contract, or runtime behavior was supplied.
- The legacy learnings contain no declared invalidation conditions; this is a documentation gap, not evidence of staleness.
- Broader inbound citations, catalogs, instruction-file discoverability, and historical recovery availability were not inspected because they are outside the permitted inputs.
- No legacy archive was present in the supplied fixture inventory; no conclusion is made about the wider repository.
- Root instruction discoverability for the knowledge store and glossary remains unassessed.
- No commit or landing was authorized; `commit_reason: commit_authorization_missing`.

**Delivery status:** complete read-only recommendation with proposed content; all mutations remain candidates, and publication is not complete.
