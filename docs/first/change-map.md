# First Runtime Change Map

## runtime-asset-extension

### Likely Modules
- src/core/skill-runtime

### Likely Commands
- src/cli/commands/first.ts

### Likely Configs
- package.json

### Likely Tests
- tests/unit/first-runtime-store.test.ts
- tests/unit/first-runtime-types.test.ts

### Risk Points
- runtime index drift
- legacy compatibility regression

## docs-projection-adjustment

### Likely Modules
- src/core/skill-runtime/first-doc-projection.ts
- src/core/skill-runtime

### Likely Commands
- 无

### Likely Configs
- 无

### Likely Tests
- tests/unit/first-doc-projection.test.ts

### Risk Points
- canonical docs mismatch
- legacy projection fallback drift

## cli-entry-orchestration

### Likely Modules
- src/cli
- src/core/skill-runtime

### Likely Commands
- src/cli/commands/first.ts

### Likely Configs
- package.json
- tsconfig.json

### Likely Tests
- tests/unit/first-command.test.ts
- tests/unit/first-refresh.test.ts

### Risk Points
- runtime truth refresh gap
- half-switch state