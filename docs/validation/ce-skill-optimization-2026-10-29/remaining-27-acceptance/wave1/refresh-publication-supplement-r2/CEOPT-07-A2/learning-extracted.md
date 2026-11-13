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
