# First Runtime Steering

## Product Steering
- Overview: AI-workflow CLI for spec-driven development — quality gates, traceability, and feature lifecycle management for AI-era teams

### Core Scenarios
- AI-workflow CLI for spec-driven development — quality gates, traceability, and feature lifecycle management for AI-era teams

### Non Goals
- legacy docs as canonical truth

### Glossary
- Feature
- StageState

## Tech Stack
- runtime: Node.js >=20.0.0
- language: TypeScript
- package-manager: pnpm
- testing: Vitest
- build: tsup

## Constraints
- 项目端类型待确认

## Forbidden Patterns
- docs-only truth

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