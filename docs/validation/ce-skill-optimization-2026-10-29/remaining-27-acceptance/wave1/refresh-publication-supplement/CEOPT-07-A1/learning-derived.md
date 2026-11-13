---
title: "Numeric amount validation and import recovery"
date: "2026-10-30"
module: "Accounting imports"
problem_type: best_practice
component: application_code
severity: medium
source_refs:
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/refresh-publication-supplement/CEOPT-07-A1/source-recovery/learning-a.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/refresh-publication-supplement/CEOPT-07-A1/source-recovery/learning-b.md"
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

## Parent evaluation provenance

Only the source references above were rebound to retained byte-identical originals by the parent. This is an evaluation derivative, not a newly verified application fix or a model-authored publication result. The original fixture guidance remains historically attributed and operationally unverified.
