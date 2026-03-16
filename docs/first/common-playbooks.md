# Common Playbooks

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

- Recommended Convention: Keep runtime logic under src/core and entry orchestration near src/cli.

### Evidence
- src/cli
- src/config
- src/core
- src/postinstall.ts
- src/preuninstall.ts

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

### Likely Modules
- src/core/skill-runtime/first-doc-projection.ts
- src/core/skill-runtime

### Likely Tests
- tests/unit/first-doc-projection.test.ts

### Risk Points
- canonical docs mismatch
- legacy projection fallback drift

- Recommended Convention: Keep runtime logic under src/core and entry orchestration near src/cli.

### Evidence
- src/cli
- src/config
- src/core
- src/postinstall.ts
- src/preuninstall.ts

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

- Recommended Convention: Keep runtime logic under src/core and entry orchestration near src/cli.

### Evidence
- src/cli
- src/config
- src/core
- src/postinstall.ts
- src/preuninstall.ts