# Shared Development Guidelines

> These guidelines apply to all Cloudflare Workers applications using this architecture.

---

## Documentation Files

| File                                               | Description                               | When to Read               |
| -------------------------------------------------- | ----------------------------------------- | -------------------------- |
| [dependency-versions.md](./dependency-versions.md) | **Critical version pinning requirements** | **Before installing deps** |
| [code-quality.md](./code-quality.md)               | Code quality mandatory rules              | Always                     |
| [typescript.md](./typescript.md)                   | TypeScript best practices                 | Type-related decisions     |
| [timestamp.md](./timestamp.md)                     | Timestamp format specification            | Date/time handling         |

---

## Quick Navigation

| Task                        | File                                               |
| --------------------------- | -------------------------------------------------- |
| **Dependency versions**     | [dependency-versions.md](./dependency-versions.md) |
| Code quality rules          | [code-quality.md](./code-quality.md)               |
| Type annotations            | [typescript.md](./typescript.md)                   |
| Timestamp handling          | [timestamp.md](./timestamp.md)                     |
| Tailwind v4 gotchas         | [dependency-versions.md](./dependency-versions.md#tailwind-css-v4-gotchas) |
| Radix UI layout shift fixes | [dependency-versions.md](./dependency-versions.md#radix-ui-via-better-auth-ui) |

---

## Core Rules (MANDATORY)

| Rule                                     | File                                               |
| ---------------------------------------- | -------------------------------------------------- |
| **Check dependency version constraints** | [dependency-versions.md](./dependency-versions.md) |
| No non-null assertions (`!`)             | [code-quality.md](./code-quality.md)               |
| Use explicit type annotations            | [typescript.md](./typescript.md)                   |
| Use Unix milliseconds for timestamps     | [timestamp.md](./timestamp.md)                     |

---

## Before Every Commit

- [ ] `pnpm lint` - 0 errors
- [ ] `pnpm typecheck` - 0 errors
- [ ] No non-null assertions (`!`)
- [ ] Tests pass (if applicable)
- [ ] Dependency versions match constraints in [dependency-versions.md](./dependency-versions.md)

---

## Code Review Checklist

- [ ] Types are explicit, not `any`
- [ ] Error handling is proper
- [ ] Naming follows conventions
- [ ] No duplicate code
- [ ] Dependencies use correct versions
- [ ] Tailwind v4 color mappings present if using shadcn (see [dependency-versions.md](./dependency-versions.md#tailwind-css-v4-gotchas))

---

**Language**: All documentation must be written in **English**.
