---
spec_id: changelog-iron-law
title: Changelog Iron Law
source: extracted
confirmation_status: inferred
lifecycle_status: active
level: L2
scope:
  - repo
  - governance
priority: 90
severity: high
confidence: high
status: active
---

# Changelog Iron Law

## Summary for Agent

- Every source code change must have a corresponding CHANGELOG.md entry.
- The CHANGELOG format is machine-tested; entries that deviate from the format pattern will fail `tests/unit/changelog-format.test.js`.
- Author identity must come from the host's developer profile.
- User-visible changes must be explicitly marked.

## Rules

### RULE-CHANGELOG-001 Every Code Change Requires a CHANGELOG Entry

- Status: inferred
- Scope: repo/governance
- Severity: high
- Rule: Any addition, deletion, or modification to project source code must be accompanied by a CHANGELOG.md entry in the same commit or PR.
- Check method: verify CHANGELOG.md contains an entry for the change before closing.

### RULE-CHANGELOG-002 Use the Canonical CHANGELOG Format

- Status: inferred
- Scope: repo/governance
- Severity: high
- Rule: Each entry must follow the format `- vX.Y.Z YYYY-MM-DD HH:MM:SS 作者: 变更摘要`; datetime must be `YYYY-MM-DD HH:MM:SS`.
- Check method: `tests/unit/changelog-format.test.js` verifies the format guidance.

### RULE-CHANGELOG-003 Author Must Come from Host Developer Profile

- Status: inferred
- Scope: repo/governance
- Severity: medium
- Rule: The author field must use the project-level developer profile file; if the profile is missing, run `spec-first init` with the appropriate host flag and user/lang options first.
- Check method: verify author matches the host profile.

### RULE-CHANGELOG-004 Mark User-Visible Changes

- Status: inferred
- Scope: repo/governance
- Severity: low
- Rule: Changes that affect user-facing behavior, command surface, or output must append `(user-visible)` at the end of the CHANGELOG entry.
- Check method: check entries against user-facing change types.
