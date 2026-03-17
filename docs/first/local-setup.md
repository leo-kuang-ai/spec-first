# Local Setup


## Entry Paths
- .spec-first/runtime/first/summary.json
- .spec-first/runtime/first/steering.json
- docs/first/README.md
- .spec-first/runtime/first/change-map.json
- src/cli/index.ts
- .spec-first/runtime/first/critical-flows.json

## Then Read
- src/core/skill-runtime
- src/core/skill-runtime/first-runtime-store.ts
- src/core/skill-runtime/first-doc-projection.ts
- src/cli
- src/cli/commands/first.ts

## Recommended Rules
- Use Vitest-style automated regression coverage and keep test evidence alongside runtime changes.

## Verify Checklist
- pnpm vitest run tests/unit/first-*.test.ts
- pnpm typecheck