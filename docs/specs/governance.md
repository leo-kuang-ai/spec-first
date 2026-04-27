---
spec_id: governance
title: Governance
source: extracted
confirmation_status: confirmed
lifecycle_status: active
level: L3
scope:
  - repo
  - workflows
priority: 90
severity: high
confidence: high
status: active
---

# Governance

## Summary for Agent

- Source assets live under `skills/`, `agents/`, `templates/`, `src/cli/`, and docs.
- Generated runtime assets under `.claude/`, `.codex/`, and `.agents/skills/` are not source of truth.
- Behavior-changing source edits require a `CHANGELOG.md` entry.
- Workflow contracts should be guarded by focused contract tests.

## Rules

### RULE-GOVERNANCE-001 Do Not Edit Runtime Copies As Source

- Status: confirmed
- Scope: workflows
- Severity: high
- Rule: Modify source assets and regenerate runtime assets through `spec-first init`; do not hand-edit generated runtime copies as source changes.
- Check method: review changed paths and generated asset drift.

