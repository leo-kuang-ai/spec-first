# Cloudflare Workers Frontend Development Guidelines

> **Tech Stack**: React Router v7 + Vite + TypeScript + TailwindCSS + shadcn/ui

## Related Guidelines

| Guideline              | Location      | When to Read                                 |
| ---------------------- | ------------- | -------------------------------------------- |
| **Shared Guidelines**  | `../shared/`  | Always -- coding standards, Git conventions  |
| **Backend Guidelines** | `../backend/` | When working with API integration or types   |

---

## Documentation Files

| File                                             | Description                          | Priority        |
| ------------------------------------------------ | ------------------------------------ | --------------- |
| [directory-structure.md](./directory-structure.md) | Project structure and conventions   | **Must Read**   |
| [type-safety.md](./type-safety.md)               | Type patterns and backend imports    | **Must Read**   |
| [hooks.md](./hooks.md)                           | Query, mutation, and custom hooks    | **Must Read**   |
| [authentication.md](./authentication.md)         | Better Auth integration              | **Must Read**   |
| [components.md](./components.md)                 | UI components, routing, rendering    | Reference       |
| [quality.md](./quality.md)                       | Performance, accessibility, testing  | Reference       |

---

## Quick Navigation by Task

### Before Starting Development

| Task                              | Document                                             |
| --------------------------------- | ---------------------------------------------------- |
| Understand project structure      | [directory-structure.md](./directory-structure.md)    |
| Know type import patterns         | [type-safety.md](./type-safety.md)                   |
| Learn hook conventions            | [hooks.md](./hooks.md)                               |

### During Development

| Task                              | Document                                             |
| --------------------------------- | ---------------------------------------------------- |
| Create custom hooks               | [hooks.md](./hooks.md)                               |
| Build UI components               | [components.md](./components.md)                     |
| Implement authentication          | [authentication.md](./authentication.md)             |
| Ensure type safety                | [type-safety.md](./type-safety.md)                   |

### Before Committing

| Task                              | Document                                             |
| --------------------------------- | ---------------------------------------------------- |
| Check code quality                | [quality.md](./quality.md)                           |
| Verify accessibility              | [quality.md](./quality.md)                           |

---

## Core Rules Summary

| Rule                                          | Reference                                          |
| --------------------------------------------- | -------------------------------------------------- |
| **Import types from backend**                 | [type-safety.md](./type-safety.md)                 |
| **Use `@/` import alias for app/**            | [directory-structure.md](./directory-structure.md)  |
| **Use Better Auth client (v3.x, UPPERCASE)**  | [authentication.md](./authentication.md)           |
| **Register routes in routes.ts**              | [components.md](./components.md)                   |
| **Use semantic HTML**                         | [components.md](./components.md)                   |
| **No `any` type, no `!` assertions**          | [quality.md](./quality.md)                         |
| **Lazy-load non-critical routes**             | [quality.md](./quality.md)                         |
| **Use `isMounted` for SSR-safe auth**         | [authentication.md](./authentication.md)           |
| **Query hooks for reads, mutation hooks for writes** | [hooks.md](./hooks.md)                      |

---

## Architecture Overview

```
+----------------------------------------------------------+
|                  Cloudflare Workers                       |
|  +--------------+  +------------------+                   |
|  |   Hono API   |  |  Static Assets   |                   |
|  |   (Backend)  |  |  (Vite Build)    |                   |
|  +------+-------+  +--------+---------+                   |
+---------|--------------------|----------------------------+
          | /api/*             | /*
          |                    |
+---------|--------------------|----------------------------+
|         v                    v     Browser                 |
|  +--------------+  +--------------+  +-----------------+  |
|  |   React      |  |   Auth       |  |   React Query   |  |
|  |   Router v7  |  |   Provider   |  |   Cache         |  |
|  +--------------+  +--------------+  +-----------------+  |
|         |                                                  |
|  +--------------+  +--------------+  +-----------------+  |
|  |   Routes     |  |   Feature    |  |   shadcn/ui     |  |
|  |   (Pages)    |  |   Modules    |  |   Components    |  |
|  +--------------+  +--------------+  +-----------------+  |
+----------------------------------------------------------+
```

---

## Reference Files

| Feature           | Reference Path                |
| ----------------- | ----------------------------- |
| Auth Client       | `app/lib/auth-client.ts`      |
| Query Client      | `app/lib/query-client.ts`     |
| Route Config      | `app/routes.ts`               |
| UI Components     | `app/components/ui/`          |
| Layout Components | `app/components/layout/`      |
| Feature Modules   | `app/modules/{feature}/`      |
| Shared Hooks      | `app/hooks/`                  |

---

## Examples

| Example         | Location                                                 | Description                   |
| --------------- | -------------------------------------------------------- | ----------------------------- |
| Frontend Design | [examples/frontend-design/](./examples/frontend-design/) | Design patterns and templates |

The `examples/frontend-design/` directory contains reference implementations for:
- Minimalist landing page hero component
- Maximalist dashboard with layered gradients
- Custom font configuration for Tailwind
- Reusable CSS animation library

---

## Getting Started

1. **Read the Must-Read documents** -- directory structure, type safety, hooks, and authentication
2. **Set up your project structure** -- Follow [directory-structure.md](./directory-structure.md)
3. **Configure TypeScript paths** -- Set up `@/` alias per [directory-structure.md](./directory-structure.md)
4. **Set up auth** -- Follow [authentication.md](./authentication.md) for Better Auth integration
5. **Build features** -- Use hooks from [hooks.md](./hooks.md) and components from [components.md](./components.md)
6. **Check quality** -- Review [quality.md](./quality.md) before committing

---

**Language**: All documentation must be written in **English**.
