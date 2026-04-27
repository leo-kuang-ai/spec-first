---
spec_id: nodejs-conventions
title: Node.js Conventions
status: active
source: extracted
confirmation_status: confirmed
lifecycle_status: active
level: L3
scope:
  - common
priority: 75
severity: low
confidence: medium
---

# Node.js Conventions

## Summary for Agent

- The project targets Node.js >= 20.0.0 with CommonJS modules (`require`/`module.exports`).
- Every source file must start with `'use strict';` as the first non-comment statement.
- No ESM syntax or dynamic `import()` is used.

## Rules

### RULE-NODEJS-001 CommonJS And Node 20+

- Status: inferred
- Scope: common
- Severity: low
- Rule: All source files must use CommonJS (`require`/`module.exports`) and target Node.js >= 20; do not introduce ESM syntax or `"type": "module"` in `package.json`.
- Check method: Verify new files use `require`, and `package.json` does not declare `"type": "module"`.

### RULE-NODEJS-002 Strict Mode Required

- Status: inferred
- Scope: common
- Severity: low
- Rule: Every `.js` source file must begin with `'use strict';` as the first non-comment statement.
- Check method: Confirm `'use strict';` appears at the top of each added or modified `.js` file.
