---
title: "Numeric validation and safe import recovery"
date: "2026-10-30"
module: "Accounting imports"
problem_type: best_practice
component: application_code
severity: medium
source_refs:
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/learning-a.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/learning-b.md"
invalidation_condition: "Re-review this guidance if the governing import contract changes numeric validation timing, original export retention, import ID identity, or recovery deletion scope; compare the revised contract and implementation evidence against each preserved safeguard before changing or retiring it."
applies_when:
  - "Validating numeric amounts before an import write"
  - "Reconciling imported rows with original bank exports"
  - "Investigating retry duplicates before reimport"
tags: ["accounting-imports", "numeric-validation", "reconciliation", "retry-recovery"]
---

# Numeric validation and safe import recovery

## Context

The supplied learnings share a numeric-validation rule and contribute complementary safeguards for reconciliation and retry recovery.

## Guidance

- Validate numeric amounts before write.
- Preserve original bank exports for row-level reconciliation.
- For retry duplicates, compare original import IDs before reimport.
- Never erase unrelated rows during retry recovery.

## Why This Matters

Keeping these rules together preserves both reconciliation evidence and the boundary on retry recovery. Numeric validation alone does not replace either safeguard.

## When to Apply

Use this guidance when validating import amounts, reconciling imported rows, or investigating duplicates before a retry.

## Evidence and limitations

This candidate consolidates the supplied learning-a.md and learning-b.md texts. Their shared rule and unique recovery guidance are preserved.

No implementation, test, incident record, or governing import contract was supplied. Application behavior and operational effectiveness remain unverified. The separate invalid promotion candidate does not establish a request-shape diagnosis and contributes no confirmed diagnosis to this learning.

## Source preservation

The source references identify the original fixture texts. Before deleting or overwriting those sources during any future publication, preserve their original contents in a durable, recoverable form and update these references to that verified evidence. The canonical document must not rely solely on a deleted path or its own rewritten contents as proof of provenance.
