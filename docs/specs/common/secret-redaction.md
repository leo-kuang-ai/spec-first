---
spec_id: secret-redaction
title: Secret Redaction Policy
status: active
source: extracted
confirmation_status: confirmed
lifecycle_status: active
level: L3
scope:
  - common
  - cli
priority: 85
severity: high
confidence: high
---

# Secret Redaction Policy

## Summary for Agent

- No credentials (private keys, bearer tokens, passwords, API keys) may appear in proposal payloads, spec drafts, evidence maps, or formal spec files.
- Workflow helpers scan payloads for credential patterns before writing any artifact and reject on detection.
- Files that may contain credentials must be excluded from evidence gathering; the exclusion must be recorded as a limitation.

## Rules

### RULE-SECRET-001 Reject Payloads Containing Credentials

- Status: inferred
- Scope: common/cli
- Severity: high
- Rule: Before writing any proposal artifact, the helper must scan the serialized payload for credential patterns (PEM headers, bearer token prefixes, credential assignments) and throw an error on detection.
- Check method: Confirm `containsSecretLikeValue` or equivalent check runs against the full payload before any file write.

### RULE-SECRET-002 Exclude And Record Sensitive Files

- Status: inferred
- Scope: common/cli
- Severity: high
- Rule: CRG build and direct evidence gathering must exclude files that may contain credentials, recording each exclusion as a `sensitive-file-skip` limitation rather than ingesting their content.
- Check method: Review graph build pipeline for sensitive file detection and limitation recording.
