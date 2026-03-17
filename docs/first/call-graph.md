# Call Graph

## CLI Entry Flow

### Entry Points
- dist/cli/index.js

### Core Modules
- src/cli
- src/core/skill-runtime

### Verification Hooks
- pnpm vitest run tests/unit/first-*.test.ts
- pnpm typecheck

## Docs Projection Flow

### Entry Points
- src/core/skill-runtime/first-doc-projection.ts

### Core Modules
- src/core/skill-runtime

### Verification Hooks
- pnpm vitest run tests/unit/first-doc-projection.test.ts
- pnpm lint