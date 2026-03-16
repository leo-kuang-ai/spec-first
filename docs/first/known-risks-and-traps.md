# Known Risks And Traps

## Current Critical Areas
- runtime truth first
- 项目端类型待确认

## Summary Risks
- 项目端类型待确认

## CLI Entry Flow

### Invariants
- runtime truth first
- CLI orchestration must preserve canonical runtime assets

### Verification Hooks
- pnpm vitest run tests/unit/first-*.test.ts
- pnpm typecheck

### Risk Points
- runtime index drift
- legacy compatibility regression
- canonical docs mismatch
- legacy projection fallback drift
- runtime truth refresh gap
- half-switch state

## Docs Projection Flow

### Invariants
- runtime truth first
- canonical projection docs must reflect runtime truth

### Verification Hooks
- pnpm vitest run tests/unit/first-doc-projection.test.ts
- pnpm lint

### Risk Points
- runtime index drift
- legacy compatibility regression
- canonical docs mismatch
- legacy projection fallback drift
- runtime truth refresh gap
- half-switch state