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
