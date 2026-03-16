# First Runtime Critical Flows

## CLI Entry Flow

- Flow ID: flow-cli-entry

### Entry Points
- dist/cli/index.js

### Core Modules
- src/cli
- src/core/skill-runtime

### Invariants
- runtime truth first
- CLI orchestration must preserve canonical runtime assets

### Verification Hooks
- pnpm vitest run tests/unit/first-*.test.ts
- pnpm typecheck

## Docs Projection Flow

- Flow ID: flow-doc-projection

### Entry Points
- src/core/skill-runtime/first-doc-projection.ts

### Core Modules
- src/core/skill-runtime

### Invariants
- runtime truth first
- canonical projection docs must reflect runtime truth

### Verification Hooks
- pnpm vitest run tests/unit/first-doc-projection.test.ts
- pnpm lint