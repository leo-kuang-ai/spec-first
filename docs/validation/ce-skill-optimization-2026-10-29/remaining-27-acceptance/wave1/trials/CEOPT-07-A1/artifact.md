# Compound Refresh Recommendation

Recommend consolidating the two overlapping learnings while preserving both recovery procedures, and folding **Ledger space** into **Workspace** as a resolvable historical alias. Nothing was applied. The supplied validation receipt records a failed promotion check; neither that candidate nor the proposed content below is validated or published.

## Scope and evidence

Reviewed the frozen Skill package and these supplied fixture files:

`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/`

- `learning-a.md`
- `learning-b.md`
- `CONCEPTS.md`
- `import-v1.md`
- `invalid-candidate.md`

Also read the named `refresh-validation-failure.json` receipt. No product implementation, tests, production behavior, Git revision, or repository-wide consumers were inspected. The fixtures establish what the supplied corpus says; they do not independently prove that operational guidance matches deployed behavior.

This is a read-only, mediated recommendation. No files were written, validators executed, external requests made, workers delegated, or questions asked.

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
worker_dispatch_outcome: "dispatch_authorization_missing; investigation performed inline"
```

## Summary

| Outcome | Actual result |
|---|---|
| Learnings scanned | 2 existing learnings; 1 failed candidate examined separately |
| Worth lens | Off |
| Updated | 0 applied |
| Consolidated | 0 applied; 1 cluster recommended |
| Replaced | 0 |
| Deleted | 0 |
| Marked stale | 0 |
| Reviewed without edits | `import-v1.md`; all original files remain unchanged |
| `CONCEPTS.md` | Alias-fold candidate recommended, not published |

Missing corroboration is a verification gap, not evidence that either learning is stale.

## Applied

**None.** No publication or deletion occurred. There are no partial filesystem effects from this review.

The actual receipt reports:

- Command: `bash skills/spec-compound-refresh/scripts/run-python.sh skills/spec-compound-refresh/scripts/validate-frontmatter.py --promotion docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/invalid-candidate.md`
- Exit code: **1**
- Candidate SHA-256 recorded by the receipt: `335ff42d6323b91a91ded75141eb22646560eba738d3aaf1d6da30a42b1df427`
- Reported failures:

```text
promotion requires non-empty top-level 'source_refs' array
promotion requires non-empty top-level 'invalidation_condition'
```

The receipt explicitly says no publication was attempted. Its hash was read, not independently recomputed. This evidence applies to the named invalid candidate, not to the new drafts in this response. Adding fields to a draft would not retroactively turn the failed check into a pass.

## Recommended

### Per-file decisions

All paths below are relative to the fixture root.

| File | Classification | Evidence and recommendation |
|---|---|---|
| `learning-a.md` | Consolidate, pending | Shares “Validate numeric amounts before write” with B. Its unique instruction, “Preserve original bank exports for row-level reconciliation,” must survive in the canonical content. Keep the original until successor publication, citation checks, and recovery preservation succeed. |
| `learning-b.md` | Consolidate, proposed canonical target | Shares the validation instruction and contributes “compare original import IDs before reimport” and “never erase unrelated rows.” Retain its path and incorporate A’s export-preservation instruction. Neither existing file currently covers all guidance. |
| `CONCEPTS.md` | Update, alias fold | Defines Workspace as “a tenant-isolated accounting scope” and identifies Ledger space as its historical alias. Fold the synonym into the surviving Workspace entry without removing the alias. |
| `import-v1.md` | Keep | Explicitly states that `ledger_space_id` identifies the Workspace and that the old term remains consumed. This is positive evidence against retiring the alias. No consumer rewrite is justified. |
| `invalid-candidate.md` | Keep as failure evidence; exclude from promotion | Empty `source_refs` and null `invalidation_condition` match the actual validation failure. Its request-shape diagnosis claim is not corroborated by either learning. Preserve this deliberately invalid fixture; do not silently repair it or merge the unsupported diagnosis into canonical knowledge. |

### Consolidation rationale and dependencies

The learnings share a validation instruction and describe complementary recovery practices in a small import-related scope. Combining them avoids duplicate maintenance without creating a large or hard-to-search document. Choosing B is a proposed editorial choice based on its broader retry guidance, not a claim that B is newer or more authoritative.

The canonical content must retain all four instructions:

1. Validate numeric amounts before writing.
2. Preserve original bank exports for row-level reconciliation.
3. Compare original import IDs before reimporting retry duplicates.
4. Never erase unrelated rows.

No supplied file explicitly cites either learning by filename. That bounded observation does **not** establish the absence of other inbound citations, heading dependencies, or catalog rows. A publisher must inspect actual consumers before deleting A. Substantive references must continue to resolve to the retained content, and any catalog must retain one canonical entry.

### Proposed final content: `learning-b.md`

The following is a complete candidate, not an approved durable learning. Classification and severity are editorial judgments; no measured incident severity is available. The source references intentionally identify the frozen evidence. Those originals must remain recoverable if a later publisher deletes a source path.

```markdown
---
title: "Numeric amount validation and import recovery"
date: "2026-10-30"
module: "Accounting imports"
problem_type: best_practice
component: application_code
severity: medium
source_refs:
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/learning-a.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/learning-b.md"
invalidation_condition: "Reassess this guidance when the governing import contract changes numeric validation before writes, original export retention, import identity comparison, or protection of unrelated rows. Check the applicable contract and recovery documentation before revising any affected instruction."
applies_when:
  - "Writing numeric amounts during accounting imports"
  - "Reconciling imported rows against original bank exports"
  - "Investigating retry duplicates before reimport"
tags:
  - "numeric-validation"
  - "import-recovery"
  - "row-reconciliation"
---

# Numeric amount validation and import recovery

## Context

The supplied learnings share a numeric validation instruction and contribute
different recovery precautions. This consolidation preserves both sets of
guidance. Product implementation and operational outcomes have not been
independently verified.

## Guidance

- Validate numeric amounts before write.
- Preserve original bank exports for row-level reconciliation.
- For retry duplicates, compare original import IDs before reimport.
- Never erase unrelated rows.

## Why This Matters

The original exports retain the basis for row-level reconciliation.
Comparing original import IDs preserves the identity check specified for
retry duplicates. Protecting unrelated rows keeps recovery bounded to the
affected import.

## When to Apply

Apply these precautions when writing numeric amounts, reconciling imported
rows, or assessing duplicate imports before a retry.

## Evidence Boundary

These instructions are retained from the supplied learning documents.
No implementation inspection, test execution, successful recovery, or
request-shape diagnosis is established by this draft.
```

If this candidate is eventually promoted at the fixture’s own `learning-b.md` path, its second source reference would point to rewritten content, while deleting A would remove the first referenced original. Before such publication, preserve both originals in an actual durable recovery location or verified Git revision and replace the references with those exact recoverable identities. No revision or recovery path is invented here. This unresolved provenance requirement blocks promotion and deletion, not preparation of the draft.

### Proposed final content: `CONCEPTS.md`

```markdown
# Concepts

## Workspace

A tenant-isolated accounting scope.

*Historical alias:* Ledger space.

The historical alias remains resolvable for consumers that use the older
terminology; it identifies the same concept.
```

This folds one synonym into one surviving concept. It does not retire Ledger space or introduce another entity. No additional project-specific domain noun is established by the supplied evidence.

The glossary deliberately omits the implementation field name. Its mapping remains in the consumer document, where it belongs.

### Preserved final content: `import-v1.md`

No change is recommended:

```markdown
Legacy API field ledger_space_id still identifies the Workspace. The old term is consumed here and must remain resolvable.
```

`learning-a.md` and `invalid-candidate.md` remain unchanged unless separately authorized, validated maintenance later establishes a safe disposition. In particular, the failed fixture remains failure evidence.

## Validation and publication still required

Semantic review was performed inline. It supports the proposed content union and alias preservation within the supplied corpus, but does not approve operational truth or durable promotion.

No validator or claims check was run on the proposed drafts. Execution was prohibited; this is not evidence that the tools are unavailable. The existing failed receipt remains the only supplied tool-validation result.

Before any later publication:

1. Resolve the actual destination repository and write authority; preserve original evidence and obtain real target identity and freshness facts.
2. Verify operational claims against governing evidence, and replace mutable or deletion-bound source references with recoverable references.
3. Check actual inbound references, catalogs, and final-path links, preserving substantive consumers.
4. Run promotion and claims checks on the exact learning candidate, and assess their results semantically. The glossary does not require learning frontmatter.
5. Publish only approved candidates and verify their actual destinations. Delete A only after canonical content, dependent references, and original recovery material are verified.

Any failed prerequisite leaves the dependent consolidation incomplete. Candidate preparation, a successful scratch write, or a repaired field shape is not an Applied result.

Discoverability could not be assessed: no root instruction file or knowledge catalog was supplied in the permitted scope. No instruction-file change or repository-wide cleanup is recommended from that absence alone.
