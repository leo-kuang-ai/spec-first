# Compound Refresh Recommendation

**Recommend one consolidated learning and one glossary refinement. Nothing was applied or published.** Preserve both original learnings until the consolidated candidate, its evidence references, and affected consumers are validated.

## Summary

| Measure | Result |
|---|---|
| Learnings reviewed | 2 |
| Consolidation recommended | 1 cluster containing 2 learnings |
| Completed updates, consolidations, replacements, or deletions | 0 |
| Stale annotations recommended | 0 |
| Supporting consumer reviewed | `import-v1.md` |
| Validation fixture reviewed | `invalid-candidate.md` |
| Glossary | Changes recommended, not published |
| Worth lens | Off |
| Review method | Inline, read-only; no independent review |

All fixture filenames below are relative to:

`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/`

This review used the assigned frozen `spec-compound-refresh` package, these fixtures, and the named validation receipt. It did not inspect application implementation, run validation or tests, access external systems, or modify files.

## Applied

**None.** This response contains proposed content only.

The supplied receipt records an earlier validation failure with no publication attempted. It does not establish any successful filesystem mutation by this review.

## Recommended

### 1. Consolidate the two learnings without losing recovery knowledge

| File | Classification | Evidence and disposition |
|---|---|---|
| `learning-a.md` | Consolidate candidate | Shares “Validate numeric amounts before write” with B. Its unique instruction, “Preserve original bank exports for row-level reconciliation,” must survive. Retain the original now. |
| `learning-b.md` | Consolidate candidate; preferred canonical content | Adds “compare original import IDs before reimport” and “never erase unrelated rows.” Preserve both instructions and merge A’s original-export retention instruction. |

B provides the broader starting point, but it does **not** currently subsume A. The shared numeric-validation rule alone is insufficient grounds to delete A.

The combined document remains short and supports one coherent task: validating bank imports while retaining the information and safeguards needed for recovery. There is no supplied evidence that these practices are obsolete, and no basis for stale-marking them.

**Evidence limitation:** The fixtures establish what the existing corpus says. They do not independently establish that current application code enforces those rules, that a particular incident was resolved, or that the guidance has been validated against a live import implementation. The legacy learnings contain no declared invalidation conditions; none can be retrospectively claimed as checked.

### Proposed consolidated content

Suggested eventual destination:

`docs/solutions/best-practices/bank-import-validation-and-recovery.md`

This is a proposed destination, not an existing or written file. Its source references intentionally retain the supplied fixture originals as documentary evidence. They must remain accessible if this proposal is later adopted.

```markdown
---
title: Bank import validation and recovery
date: "2026-10-30"
module: "Bank imports"
problem_type: best_practice
component: application_code
severity: medium
source_refs:
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/learning-a.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/learning-b.md"
invalidation_condition: "Reassess this guidance if the bank-import contract changes numeric validation timing, original-export availability, import-ID identity, or retry cleanup scope. Check the governing import contract and corresponding source or tests before revising or removing any recovery instruction."
applies_when:
  - "Validating bank-import amounts before writing data"
  - "Reconciling imported rows against original bank exports"
  - "Investigating duplicate imports before retrying"
tags:
  - "bank-import"
  - "numeric-validation"
  - "reconciliation"
  - "retry-recovery"
---

# Bank import validation and recovery

## Context

The supplied learnings share a numeric-validation rule and preserve
complementary recovery instructions for reconciliation and retry duplicates.

## Guidance

- Validate numeric amounts before writing data.
- Preserve original bank exports for row-level reconciliation.
- For retry duplicates, compare original import IDs before reimporting.
- Never erase unrelated rows.

## Why This Matters

Numeric validation addresses input quality before a write. Original bank
exports retain the evidence needed for row-level reconciliation. Original
import IDs support duplicate investigation before retrying, while the
unrelated-row safeguard limits destructive recovery actions.

## When to Apply

Use these rules when preparing bank-import writes, reconciling imported
rows, or investigating duplicate imports before a retry.

## Evidence and Limits

This document consolidates the supplied learning-a.md and learning-b.md
fixtures. Both state the numeric-validation rule; learning-a.md supplies
the original-export retention rule, and learning-b.md supplies the
import-ID comparison and unrelated-row preservation rules.

No application source, execution trace, or test result was supplied to
confirm implementation behavior. This candidate preserves existing
guidance and does not claim a newly verified fix.
```

The proposed `severity: medium` is an editorial classification for the guidance, not measured incident severity. Semantic promotion remains pending current implementation or governing-contract evidence.

### 2. Refine the glossary while preserving the historical consumer

`CONCEPTS.md` defines Workspace as “a tenant-isolated accounting scope” and identifies Ledger space as its historical alias. `import-v1.md` supplies a concrete continuing consumer:

> Legacy API field ledger_space_id still identifies the Workspace. The old term is consumed here and must remain resolvable.

Therefore, **fold the synonym into the Workspace entry while retaining the literal alias**. This is vocabulary consolidation, not concept retirement. Removing Ledger space entirely would break the supplied consumer’s terminology mapping.

Proposed complete `CONCEPTS.md` content:

```markdown
# Concepts

## Workspace

A tenant-isolated accounting scope.

*Historical alias:* Ledger space.
```

This retains the domain definition and alias without putting an API field or version-specific implementation detail into the glossary. No additional domain nouns are sufficiently defined by the supplied materials to justify seeding them.

Recommended glossary accounting: **0 added, 1 refined, 1 alias folded, 0 retired**. These are proposed changes, not published results.

## Reviewed Without Edits

### `import-v1.md` — Keep

Preserve its complete content:

```markdown
Legacy API field ledger_space_id still identifies the Workspace. The old term is consumed here and must remain resolvable.
```

It supplies the substantive reason to retain the historical alias. This review does not claim that an executable import-v1 implementation was inspected.

### `invalid-candidate.md` — Keep as validation evidence; reject promotion

This deliberately invalid fixture is not an accepted learning or a verified successor. Preserve it as evidence of the failed gate.

Its asserted request-shape diagnosis detail is absent from the older learnings and has no supporting implementation evidence in the supplied corpus. Do not copy that detail into the consolidated guidance merely to preserve every sentence of a rejected candidate.

## Actual Validation Receipt

Receipt consumed:

`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/refresh-validation-failure.json`

It records:

- Validator invocation with `--promotion` against `invalid-candidate.md`.
- Exit code: **1**.
- Empty stdout.
- Reported failures:

```text
promotion requires non-empty top-level 'source_refs' array
promotion requires non-empty top-level 'invalidation_condition'
```

- Recorded candidate SHA-256:

```text
335ff42d6323b91a91ded75141eb22646560eba738d3aaf1d6da30a42b1df427
```

- Explicit scope: “Actual local deliberately invalid candidate validation; no publication attempted.”

The fixture visibly contains `source_refs: []` and `invalidation_condition: null`, consistent with the reported errors. I did not recompute its hash or rerun the validator.

**The failure blocks promotion of that candidate.** It does not constitute a validation result for the new draft above. Adding non-empty fields would address the reported shapes, but would not by itself establish source credibility, diagnosis correctness, or semantic adequacy.

## Consumer Preservation and Publication Conditions

The supplied files contain no explicit links between the two learnings. That bounded observation does not establish that a real repository has no inbound citations, catalog entries, or substantive consumers.

Before any later publication:

1. Map the proposed canonical destination to the actual corpus and establish authorized targets, existence, and freshness hashes.
2. Obtain current evidence for the retained import guidance and resolve the draft’s semantic promotion gap.
3. Validate the learning’s frontmatter, claims, and links at its intended final destination; assess glossary compatibility separately.
4. Inspect actual inbound citations and catalog rows. Preserve substantive recovery references, repair affected links and anchors, and leave one canonical catalog entry where applicable.
5. Publish and verify the glossary and canonical learning before dependent reference changes or deletion.
6. Retire superseded live-corpus documents only after all unique content and consumers survive, originals are recoverable, and no surviving `source_refs` becomes dangling.

The supplied fixtures remain evidence and are not deletion targets. The canonical successor must never also appear in a deletion set. Failed checks leave dependent consolidation and deletion incomplete.

No target snapshots, final-tree link checks, source-behavior verification, or publication checks were performed in this read-only trial. These are workflow conditions, not a claim of transactional enforcement.

## Discoverability and Authority

No fixture root instruction file or catalog was supplied. Their discoverability and cleanup requirements remain unverified; this review did not inspect unrelated project instructions or propose unsupported edits.

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

The request expressly restricts this task to drafting and interpretation. All proposed changes remain **Recommended**; no files were written, deleted, committed, or published.
