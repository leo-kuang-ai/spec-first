# External Dependencies


## Dependency Surface
- runtime: Node.js >=20.0.0
- package-manager: pnpm
- testing: Vitest
- build: tsup

## Integration Points
- dist/cli/index.js
- src/cli/index.ts
- src/cli
- src/config
- src/core
- src/postinstall.ts
- src/preuninstall.ts
- src/shared

## Evidence
- package.json
- tsconfig.json
- vitest.config.ts
- dist/cli/index.js
- src/cli/index.ts
- src/cli
- src/config
- src/core