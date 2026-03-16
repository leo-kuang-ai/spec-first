# First Runtime Reboot Guide

- Project What: AI-workflow CLI for spec-driven development — quality gates, traceability, and feature lifecycle management for AI-era teams

## Where To Start
- .spec-first/runtime/first/summary.json
- docs/first/README.md

## Current Critical Areas
- runtime truth first
- 项目端类型待确认

## Common Change Paths
- src/cli
- src/config
- src/core
- dist/cli/index.js
- src/cli/index.ts

## Verify Checklist
- pnpm vitest run tests/unit/first-*.test.ts
- pnpm typecheck