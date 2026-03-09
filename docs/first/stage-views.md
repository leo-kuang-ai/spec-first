# First Runtime Stage Views

## Spec View

- Summary: Derived from 01_specify runtime stage

### Business Capabilities
- docs/first/domain-model.md
- docs/first/api-docs.md

### Core Entities
- 无

### Dependencies
- src/core/trace-engine/
- templates/

### Warnings
- 00_init: src/cli/index.ts
- 00_init: package.json

## Design View

- Summary: Derived from 02_design runtime stage

### Module Boundaries
- src/core/process-engine/
- src/core/skill-runtime/

### Integration Points
- docs/first/tech-stack.md
- docs/first/codebase-overview.md
- docs/first/domain-model.md

### Technical Constraints
- 无

### Risks
- 无

## Code View

- Summary: Derived from 04_implement runtime stage

### Entry Points
- src/
- tests/

### Likely Change Areas
- src/core/trace-engine/
- src/core/change-mgr/
- docs/first/tech-stack.md
- docs/first/codebase-overview.md

### Call Path Hints
- 03_plan -> src/core/trace-engine/
- 03_plan -> src/core/change-mgr/

### Coupling Points
- docs/first/codebase-overview.md
- docs/first/domain-model.md
- src/core/process-engine/
- src/core/skill-runtime/

### Change Hazards
- 无

### Verification Hooks
- src/core/gate-engine/
- tests/

## Verify View

- Summary: Derived from 05_verify runtime stage

### Critical Flows
- src/core/gate-engine/
- tests/

### Validation Focus
- docs/first/domain-model.md
- docs/first/codebase-overview.md

### Test Focus
- src/core/gate-engine/
- tests/

### Risk Areas
- 无

### Recommended Checks
- docs/first/domain-model.md
- docs/first/codebase-overview.md

### Validation Hooks
- 无

### Release Blockers
- 无
