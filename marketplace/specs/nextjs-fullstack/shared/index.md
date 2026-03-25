# Shared Development Guidelines

> These guidelines apply to all Next.js full-stack applications using this architecture.

---

## Documentation Files

| File                                   | Description                          | When to Read            |
| -------------------------------------- | ------------------------------------ | ----------------------- |
| [code-quality.md](./code-quality.md)   | Code quality mandatory rules         | Always                  |
| [typescript.md](./typescript.md)       | TypeScript best practices            | Type-related decisions  |
| [dependencies.md](./dependencies.md)   | Dependency versions and constraints  | Adding/updating deps    |

---

## Quick Navigation

| Task                        | File                                   |
| --------------------------- | -------------------------------------- |
| Code quality rules          | [code-quality.md](./code-quality.md)   |
| Type annotations            | [typescript.md](./typescript.md)       |
| Dependency management       | [dependencies.md](./dependencies.md)   |

---

## Core Rules (MANDATORY)

| Rule                                      | File                                   |
| ----------------------------------------- | -------------------------------------- |
| No non-null assertions (`!`)              | [code-quality.md](./code-quality.md)   |
| No `any` type                             | [code-quality.md](./code-quality.md)   |
| No `@ts-expect-error` / `@ts-ignore`      | [code-quality.md](./code-quality.md)   |
| No `console.log` (use structured logging) | [code-quality.md](./code-quality.md)   |
| Zod-first type definitions                | [typescript.md](./typescript.md)       |
| Import types from backend, never redefine | [typescript.md](./typescript.md)       |
| Standard response format (`success` + `reason`) | [typescript.md](./typescript.md) |

---

## Before Every Commit

- [ ] `pnpm lint` - 0 errors
- [ ] `pnpm type-check` - 0 errors
- [ ] `pnpm build` - production build succeeds
- [ ] No `any` types in new code
- [ ] No non-null assertions (`!`)
- [ ] No `@ts-expect-error` or `@ts-ignore` comments
- [ ] No `console.log` statements (use `logger`)
- [ ] Tests pass (if applicable)

---

## Code Review Checklist

- [ ] Types are explicit, not `any`
- [ ] API inputs/outputs have Zod schemas
- [ ] Error handling returns structured responses
- [ ] No duplicate type definitions (import from source of truth)
- [ ] Naming follows conventions (files: kebab-case, components: PascalCase)
- [ ] Unused imports and dead code removed
- [ ] No swallowed errors (silent `catch` blocks)

---

**Language**: All documentation must be written in **English**.
