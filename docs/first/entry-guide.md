# First Runtime Entry Guide

## runtime-extension

### Read First
- .spec-first/runtime/first/summary.json
- .spec-first/runtime/first/steering.json

### Then Read
- src/core/skill-runtime
- src/core/skill-runtime/first-runtime-store.ts

### Avoid Entry
- docs/first/tech-stack.md

### Related Flows
- flow-cli-entry

## docs-projection

### Read First
- docs/first/README.md
- .spec-first/runtime/first/change-map.json

### Then Read
- src/core/skill-runtime/first-doc-projection.ts

### Avoid Entry
- legacy docs as truth

### Related Flows
- flow-doc-projection

## cli-orchestration

### Read First
- src/cli/index.ts
- .spec-first/runtime/first/critical-flows.json

### Then Read
- src/cli
- src/cli/commands/first.ts

### Avoid Entry
- docs-only truth

### Related Flows
- flow-cli-entry