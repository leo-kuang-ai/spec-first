# Thinking Guides for Next.js Full-Stack Projects

> **Purpose**: Systematic thinking guides to catch issues before they become bugs.
>
> **Core Philosophy**: 30 minutes of thinking saves 3 hours of debugging.

---

## Why Thinking Guides?

**Most bugs and tech debt come from "didn't think of that"**, not from lack of skill:

- Didn't think about what happens at layer boundaries -> cross-layer bugs
- Didn't think about code patterns repeating -> duplicated code everywhere
- Didn't think about edge cases -> runtime errors
- Didn't think about future maintainers -> unreadable code

These guides help you **ask the right questions before coding**.

---

## Available Thinking Guides

| Guide                                                             | Purpose                                       | When to Use                                      |
| ----------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------ |
| [Cross-Layer Thinking](./cross-layer-thinking-guide.md)           | Think through data flow across layers         | Before implementing features that span 3+ layers |
| [Pre-Implementation Checklist](./pre-implementation-checklist.md) | Verify readiness before coding                | Before starting any feature implementation       |

---

## Quick Reference: When to Use Which Guide

### Cross-Layer Issues

Use [Cross-Layer Thinking Guide](./cross-layer-thinking-guide.md) when:

- [ ] Feature touches 3+ layers (Server Component, Client Component, oRPC, Database)
- [ ] Data format changes between layers
- [ ] Multiple consumers need the same data
- [ ] You're not sure where to put some logic
- [ ] Integrates with external services or third-party APIs

### Before Writing Code

Use [Pre-Implementation Checklist](./pre-implementation-checklist.md) when:

- [ ] About to add a constant or config value
- [ ] About to implement new logic
- [ ] About to define a type or Zod schema
- [ ] About to create a component or hook
- [ ] About to add an oRPC procedure
- [ ] Feels like you've seen similar code before

---

## The Pre-Modification Rule (CRITICAL)

> **Before changing ANY value, ALWAYS search first!**

```bash
# Search for the value you're about to change
rg "value_to_change" --type ts

# Check how many files define this value
rg "CONFIG_NAME" --type ts -c
```

This single habit prevents most "forgot to update X" bugs.

---

## Next.js-Specific Layers

In Next.js full-stack projects with oRPC and Drizzle, these are the typical layers:

```
Server Components (RSC - data fetching, static rendering)
        |
        v
Client Components ('use client' - interactivity, React Query)
        |
        v
API Routes / oRPC Router (type-safe RPC, middleware, validation)
        |
        v
Service / Business Logic (shared utilities, domain rules)
        |
        v
Database Layer (Drizzle ORM, PostgreSQL, migrations)
```

Each boundary is a potential source of bugs due to:

- **Serialization** - Only serializable data crosses the RSC/Client boundary (no functions, no Date objects, no Maps)
- **Type mismatches** - Zod schemas on oRPC may not match what the frontend expects
- **Auth context** - Session availability differs between Server Components, API routes, and middleware
- **Rendering mode** - Server Components vs Client Components have different capabilities and constraints
- **Async timing** - React Query caching, stale data, and race conditions

---

## Core Principles

1. **Search Before Write** - Always search for existing patterns before creating new ones
2. **Think Before Code** - 5 minutes of checklist saves 50 minutes of debugging
3. **Document Assumptions** - Make implicit assumptions explicit
4. **Verify All Layers** - Changes often need updates in multiple places
5. **Learn From Bugs** - Add lessons to these guides after fixing non-trivial bugs

---

## Contributing

Found a new "didn't think of that" moment? Add it:

1. If it's a **general thinking pattern** -> Add to existing guide or create new one
2. If it caused a bug -> Add to "Lessons Learned" section in the relevant guide
3. If it's **project-specific** -> Create a separate project-specific guide

---

**Language**: All documentation should be written in **English**.
