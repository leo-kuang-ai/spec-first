---
spec_id: architecture
title: Architecture
source: extracted
confirmation_status: confirmed
lifecycle_status: active
level: L3
scope:
  - repo
  - cli
  - crg
priority: 90
severity: high
confidence: high
status: active
---

# Architecture

## Summary for Agent

- Deterministic scripts own parsing, graph construction, validation, and artifact writes.
- The LLM owns semantic choice of change surface, tradeoffs, and next-step selection.
- CRG facts are advisory evidence, not a gate.
- When graph evidence is unavailable, use targeted direct repo reads rather than stale generated summaries.

## Rules

### RULE-ARCHITECTURE-001 Preserve Script/LLM Boundary

- Status: confirmed
- Scope: repo/cli/crg
- Severity: high
- Rule: Scripts must execute deterministic flows and produce structured evidence; LLMs decide how that evidence applies.
- Check method: review command helpers for deterministic behavior and skill prose for semantic decision ownership.

