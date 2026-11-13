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
