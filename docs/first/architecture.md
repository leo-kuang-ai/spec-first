# Architecture


## Topology
- entry -> runtime assets -> docs projection

## Modules
- src/cli
- src/config
- src/core
- src/postinstall.ts
- src/preuninstall.ts
- src/shared

## Boundaries
- dist/cli/index.js
- src/cli/index.ts

## Entry Rules
- read runtime truth first

## Critical Flows
- CLI Entry Flow
- Docs Projection Flow