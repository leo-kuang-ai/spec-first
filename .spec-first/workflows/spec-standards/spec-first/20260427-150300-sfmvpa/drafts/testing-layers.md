---
spec_id: testing-layers
title: Testing Layers
source: extracted
confirmation_status: inferred
lifecycle_status: active
level: L3
scope:
  - testing
  - cli
  - crg
  - workflows
priority: 85
severity: medium
confidence: high
status: active
---

# Testing Layers

## Summary for Agent

- The project uses four test layers: unit, smoke, integration, e2e:crg.
- The minimum test scope to run depends on which change surface is touched.
- Running a narrower layer than required for the change surface is a verification shortcut.
- `npm test` runs all layers; use targeted commands for focused validation.

## Rules

### RULE-TESTING-LAYERS-001 Match Test Layer to Change Surface

- Status: inferred
- Scope: testing
- Severity: medium
- Rule: When changing CLI parameters, state files, or runtime-sync logic, run at minimum unit tests and smoke tests (`npm run test:unit`, `npm run test:smoke`).
- Check method: review changed file paths against layer mapping below.

### RULE-TESTING-LAYERS-002 Governance Changes Need Entrypoint Lint First

- Status: inferred
- Scope: testing/workflows
- Severity: medium
- Rule: When changing agent/workflow governance, entry mapping, or contracts, run the entrypoints governance lint (`npm run lint:skills-lint`) before adding contract or unit tests.
- Check method: verify governance lint passes before adding contract tests.

### RULE-TESTING-LAYERS-003 CRG Changes Need CRG Unit and E2E

- Status: inferred
- Scope: testing/crg
- Severity: medium
- Rule: When changing CRG graph construction, retrieval, or SQLite logic, run relevant CRG unit tests and where the impact is broad, also run `npm run test:e2e:crg`.
- Check method: review which CRG tests cover the changed path.

### RULE-TESTING-LAYERS-004 Stage-0 and Context Routing Changes Need Integration Tests

- Status: inferred
- Scope: testing/cli
- Severity: medium
- Rule: When changing Stage-0 context, verification, or context routing, run `npm run test:integration` and supplement with relevant unit tests under `tests/unit/*verification*` and `tests/unit/*context*`.
- Check method: verify integration test output covers the changed routing.

### RULE-TESTING-LAYERS-005 Publish and Packaging Changes Need Build Validation

- Status: inferred
- Scope: testing/cli
- Severity: medium
- Rule: When changing published artifacts, packaging, or install paths, run at minimum `npm run build` and related smoke/release tests.
- Check method: verify `npm run build` and `npm run test:smoke` pass.

## Layer Map

| Change Surface | Minimum Test Layer |
|---|---|
| CLI params / state files / runtime sync | unit + smoke |
| Agent/workflow governance / entry mapping / contract | entrypoints-lint + contract/unit |
| Stage-0 / verification / context routing | integration + unit |
| CRG graph / retrieval / SQLite | crg unit + e2e:crg (if broad impact) |
| Publish / package / install path | build + smoke/release |
| Agent/workflow prose behavior | fresh-source eval (not same-session typed-agent) |
