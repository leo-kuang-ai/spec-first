---
mode: quick
---

# Tech Stack

> **spec-first v1.1.0** — AI-workflow CLI for spec-driven development

## Overview

| Category | Technology | Version |
|----------|-----------|---------|
| **Runtime** | Node.js | >=20.0.0 |
| **Module System** | ESM | `"type": "module"` |
| **Language** | TypeScript | ^5.4.0 |

## Build & Bundle

| Tool | Version | Purpose |
|------|---------|---------|
| tsup | ^8.5.1 | TypeScript bundler |
| TypeScript | ^5.4.0 | Type checker + compiler |

## Testing

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | ^1.6.1 | Test framework |
| @vitest/coverage-v8 | ^1.6.1 | Code coverage (v8) |
| jsdom | ^28.1.0 | DOM simulation |

**Coverage Threshold**: lines/functions/statements 75%, branches 65%

## Code Quality

| Tool | Version | Purpose |
|------|---------|---------|
| ESLint | ^10.0.2 | Linting |
| typescript-eslint | ^8.56.1 | TypeScript ESLint rules |
| @eslint/js | ^10.0.1 | ESLint JS config |
| Prettier | ^3.8.1 | Code formatting |

## Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| handlebars | ^4.7.8 | Template engine |
| js-yaml | ^4.1.0 | YAML parser |
| semver | ^7.7.4 | Semantic versioning |
| update-notifier | ^7.0.0 | CLI update notifications |

## TypeScript Configuration

| Option | Value |
|--------|-------|
| Target | ES2022 |
| Module | ESNext |
| Module Resolution | bundler |
| Strict Mode | enabled |
| verbatimModuleSyntax | enabled |
| isolatedModules | enabled |
| Declaration | enabled |

## Package Manager

pnpm (with overrides for rollup, minimatch, esbuild)
