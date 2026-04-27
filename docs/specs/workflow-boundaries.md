---
spec_id: workflow-boundaries
title: Workflow Boundaries
source: extracted
confirmation_status: confirmed
lifecycle_status: active
level: L3
scope:
  - workflows
  - standards
priority: 90
severity: high
confidence: high
status: active
---

# Workflow Boundaries

## Summary for Agent

- `spec-graph-bootstrap` prepares CRG-backed engineering facts.
- `spec-standards` turns CRG/direct evidence into reviewable standards proposals.
- `docs/specs/**` is the formal standards source after human promotion.
- `specs resolve`, `specs check`, and `specs refresh` improve inputs and reports; they are not hard gates.

## Rules

### RULE-WORKFLOW-BOUNDARY-001 Keep Standards Proposal And Formal Standards Separate

- Status: confirmed
- Scope: standards
- Severity: high
- Rule: Proposal artifacts under `.spec-first/workflows/spec-standards/**` are not formal standards until a human-confirmed promote writes to `docs/specs/**`.
- Check method: verify workflow outputs and docs distinguish proposal-only artifacts from formal standards assets.

