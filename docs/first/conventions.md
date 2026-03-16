# First Runtime Conventions

## API

### Observed Patterns
- CLI: spec-first

### Deviations
- 无

- Recommended Convention: Expose command surfaces through stable spec-first CLI verbs.

### Evidence
- CLI: spec-first
- dist/cli/index.js
- src/cli/index.ts
- package.json
- tsconfig.json

## Module

### Observed Patterns
- src/cli
- src/config
- src/core
- src/postinstall.ts
- src/preuninstall.ts
- src/shared

### Deviations
- 无

- Recommended Convention: Keep runtime logic under src/core and entry orchestration near src/cli.

### Evidence
- src/cli
- src/config
- src/core
- src/postinstall.ts
- src/preuninstall.ts

## Testing

### Observed Patterns
- testing: Vitest

### Deviations
- 无

- Recommended Convention: Use Vitest-style automated regression coverage and keep test evidence alongside runtime changes.

### Evidence
- runtime: Node.js >=20.0.0
- language: TypeScript
- package-manager: pnpm
- testing: Vitest
- build: tsup

## Project Rules

### Observed Patterns
- runtime truth first
- 项目端类型待确认

### Deviations
- 无

- Recommended Convention: Treat .spec-first/runtime/first as canonical truth before projecting docs/first views.

### Evidence
- package.json
- tsconfig.json
- vitest.config.ts
- dist/cli/index.js
- src/cli/index.ts