# Compound Refresh Recommendation

Consolidate the two learnings into one document while preserving both recovery practices. Refine the glossary so **Ledger space remains resolvable as an alias of Workspace**. Publish nothing: the supplied validation receipt records a failed candidate, and this trial authorizes recommendations only.

## Summary

- Scanned: **2 learnings**, plus the glossary, its supplied consumer, and one deliberately invalid candidate.
- Worth lens: **off**.
- Completed mutations: **0** updated, consolidated, replaced, deleted, or marked stale.
- Recommended: **1 consolidation involving 2 learnings**, and **1 glossary refinement**.
- `CONCEPTS.md`: **changes recommended, not published**.
- Existing consumer: `import-v1.md` retained without edits.
- No evidence establishes that either learning is stale.

All short filenames below refer to:

`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/`

## Applied

**None.** No files were written, deleted, committed, or published. No validators or tests were executed in this trial.

The supplied receipt is evidence of an earlier validation failure, not an action performed here.

## Recommended

### Consolidate `learning-a.md` and `learning-b.md`

Use **`learning-a.md` as the proposed canonical target**, retaining its existing path. This is an editorial choice for this draft; the supplied evidence does not establish chronological precedence or a pre-existing canonical designation.

| File | Classification | Evidence and proposed disposition |
|---|---|---|
| `learning-a.md` | Consolidate — canonical target | Contains “Validate numeric amounts before write” and the unique instruction “Preserve original bank exports for row-level reconciliation.” Retain both. |
| `learning-b.md` | Consolidate — source of additional recovery guidance | Repeats numeric validation and adds “compare original import IDs before reimport; never erase unrelated rows.” Merge both recovery constraints into the canonical candidate. Any subsequent deletion remains blocked pending publication and consumer checks. |
| `CONCEPTS.md` | Update — vocabulary refinement | Defines Workspace and explicitly identifies Ledger space as its historical alias. Group the alias under the surviving definition without losing its meaning. |
| `import-v1.md` | Keep | Explicitly says `ledger_space_id` identifies the Workspace and that the old term “must remain resolvable.” Preserve this consumer and its implementation-specific explanation. |
| `invalid-candidate.md` | Exclude from promotion; retain unchanged as validation evidence | Has empty `source_refs`, null `invalidation_condition`, and an unsupported request-shape diagnosis addition. It is not a verified replacement learning. |

The learnings share the same validation rule and offer complementary, compact import-recovery guidance. One document can retain all of it without becoming unwieldy. **Neither original fully subsumes the other today**: deleting either before merging would lose unique knowledge.

These are documented practices in the supplied corpus. No application implementation, incident evidence, or tests were supplied to establish their operational effectiveness. Preserve the practices with that limitation; missing corroboration does not justify removing or stale-marking them.

### Proposed complete canonical content: `learning-a.md`

The following is a **candidate**, not a validated or published learning. Its classification and severity are editorial judgments; `low` describes the documentation-maintenance issue, not the potential financial impact of an import failure.

```markdown
---
title: "Numeric validation and recoverable bank imports"
module: "Bank import guidance"
date: "2026-10-30"
problem_type: documentation_gap
component: documentation
severity: low
source_refs:
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/learning-a.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/learning-b.md"
invalidation_condition: "Reassess when an authoritative import contract or verified implementation changes numeric validation before writes, the use of original exports for row-level reconciliation, or original import IDs for retry recovery; compare that evidence against each retained rule before revising or retiring it."
applies_when:
  - "Preparing numeric amounts for a bank import write"
  - "Reconciling imported rows against original bank exports"
  - "Investigating duplicate rows before retrying an import"
tags:
  - "bank-import"
  - "numeric-validation"
  - "row-reconciliation"
  - "retry-recovery"
---

# Numeric validation and recoverable bank imports

## Context

The supplied learnings repeat a numeric-validation rule while recording
different recovery precautions. This document brings those precautions together
without discarding either source's unique guidance.

## Guidance

- Validate numeric amounts before writing.
- Preserve original bank exports for row-level reconciliation.
- When investigating retry duplicates, compare original import IDs before
  reimporting.
- Never erase unrelated rows during recovery.

## Why This Matters

Validation, reconciliation, and retry recovery serve different purposes.
Preserving the original exports retains the material needed for row-level
comparison. Comparing original import IDs preserves the supplied retry
diagnostic step, while the unrelated-row constraint limits recovery scope.

These practices come from the supplied learning documents. Their implementation
and effectiveness have not been independently verified against application code,
tests, or incident evidence in this review.

## When to Apply

Use this guidance when preparing bank imports, reconciling imported rows, or
investigating duplicate rows before a retry.

## Evidence and Limits

The source references identify the original learning documents as read for this
draft. They establish the provenance of the documented practices, not a verified
production incident or implementation.

Before replacing either original or deleting a subsumed path, preserve its
original contents in verifiable durable history or retained recovery evidence
and update these references to recoverable historical sources. A self-reference
to the rewritten canonical document is not sufficient historical provenance.

No request-shape diagnosis is established by the supplied evidence.
```

The provenance note is a real publication dependency: the proposed current-path references must not become a circular reference and a deleted-path reference after consolidation. Neither a Git revision nor a durable parent-owned report path was supplied, so none is invented here.

### Proposed complete glossary content: `CONCEPTS.md`

```markdown
# Concepts

## Workspace

A tenant-isolated accounting scope.

*Historical alias:* Ledger space.

Ledger space names the same concept, not a retired or replacement concept.
Keep the historical name resolvable for readers of existing import contracts.
```

This preserves the sole established domain concept and its historical name. It adds no speculative concepts.

The exact API field `ledger_space_id` belongs in `import-v1.md`, where it already appears. Keeping that implementation detail in the consumer allows the glossary to remain independently understandable.

Proposed vocabulary accounting: **0 added, 1 refined, 1 alias folded, 0 retired**. These counts describe the candidate only.

## Reviewed Without Edits

`import-v1.md` remains:

```markdown
Legacy API field ledger_space_id still identifies the Workspace. The old term is consumed here and must remain resolvable.
```

This is positive evidence of an existing historical consumer. Removing Ledger space without a surviving alias would break the reader’s ability to interpret that consumer.

The original learning files and invalid candidate also remain untouched while their proposed actions are pending.

## Actual Validation-Failure Receipt

Read:

`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/refresh-validation-failure.json`

The receipt records:

- Invocation of `validate-frontmatter.py --promotion` against `invalid-candidate.md`.
- **Exit code: `1`**.
- Empty stdout.
- These stderr findings:

```text
promotion requires non-empty top-level 'source_refs' array
promotion requires non-empty top-level 'invalidation_condition'
```

- Candidate SHA-256:

```text
335ff42d6323b91a91ded75141eb22646560eba738d3aaf1d6da30a42b1df427
```

- Scope: “Actual local deliberately invalid candidate validation; no publication attempted.”

That failure **blocks promotion of the receipt’s candidate**. It does not validate the new candidate above, establish a publication attempt, or imply a partial publication.

The invalid candidate also introduces a request-shape diagnosis absent from the older learnings. Filling metadata alone would not make that new claim trustworthy. It is intentionally excluded from the consolidation draft.

## Remaining Publication Dependencies

For a future separately authorized publisher:

1. Resolve the actual durable targets and record their current identity and hashes. This trial treats fixture paths as review inputs, not permission to modify evaluation fixtures.
2. Preserve recoverable original evidence and replace the draft’s provisional provenance references with durable historical references.
3. Check inbound citations and catalog entries in the actual target repository. The supplied fixture contains no explicit learning-path citations, but that does not establish absence elsewhere.
4. Validate the exact canonical candidate with the promotion validator and claims checker, including links at its intended final location. Perform a semantic review of retained guidance, provenance, and the invalidation condition.
5. Recheck target freshness before authorized writes. Verify the glossary and canonical content at their actual destinations, then repair affected citations or catalog rows.
6. Delete `learning-b.md` only after its unique content and consumers are preserved, dependent publication is verified, and recovery evidence is available. Never delete the surviving `learning-a.md` target.

Until those steps succeed, the consolidation and glossary change remain **Recommended**.

## Evidence and Authority Boundaries

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

The explicit read-only request controls this trial. Review was inline; no independent-review coverage is claimed.

Freshness is limited to the supplied fixture contents read during this trial on **2026-10-30**. Target hashes, Git revisions, broader consumer coverage, and live application behavior were not established. The original learnings contain no declared invalidation conditions; this is a legacy evidence gap, not proof of staleness.

No runtime assets were examined or changed. No tests, validation execution, external requests, delegation, or user questions occurred.

Discoverability assessment remains unverified because no fixture-local root instruction file or catalog was supplied. No instruction-file update is proposed from unseen content, and no broader directory or repository discovery was performed.
