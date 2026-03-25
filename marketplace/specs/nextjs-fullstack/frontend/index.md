# Next.js Frontend Development Guidelines

> Universal frontend development guidelines for Next.js full-stack applications with React + TypeScript + TailwindCSS.

## Tech Stack

- **Framework**: Next.js 15, React 19
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS 4, Radix UI
- **API**: oRPC (OpenAPI RPC), React Query (TanStack Query)
- **URL State**: nuqs
- **Auth**: better-auth
- **AI**: Vercel AI SDK (@ai-sdk/react)

---

## Documentation Files

| File                                                 | Description                                          | Priority      |
| ---------------------------------------------------- | ---------------------------------------------------- | ------------- |
| [components.md](./components.md)                     | Server/Client components, semantic HTML, next/image  | **Must Read** |
| [authentication.md](./authentication.md)             | better-auth client, session, protected routes        | **Must Read** |
| [orpc-usage.md](./orpc-usage.md)                     | Type-safe API calls, React Query integration         | **Must Read** |
| [hooks.md](./hooks.md)                               | Query and mutation hook patterns                     | Reference     |
| [api-integration.md](./api-integration.md)           | oRPC client, real-time, AI streaming                 | Reference     |
| [state-management.md](./state-management.md)         | URL state with nuqs, React Context patterns          | Reference     |
| [directory-structure.md](./directory-structure.md)    | Project structure and module conventions             | Reference     |
| [type-safety.md](./type-safety.md)                   | TypeScript guidelines, type inference, Zod           | Reference     |
| [css-layout.md](./css-layout.md)                     | CSS patterns, flexbox, responsive, touch             | Reference     |
| [ai-sdk-integration.md](./ai-sdk-integration.md)     | useChat hook, streaming, tool call handling           | Reference     |
| [quality.md](./quality.md)                           | Pre-commit checklist and code quality standards      | Reference     |

---

## Quick Navigation by Task

### Before Starting Development

| Task                              | Document                                           |
| --------------------------------- | -------------------------------------------------- |
| Understand project structure      | [directory-structure.md](./directory-structure.md)  |
| Learn Server vs Client components | [components.md](./components.md)                   |
| Set up authentication             | [authentication.md](./authentication.md)           |

### During Development

| Task                        | Document                                           |
| --------------------------- | -------------------------------------------------- |
| Make type-safe API calls    | [orpc-usage.md](./orpc-usage.md)                   |
| Create custom hooks         | [hooks.md](./hooks.md)                             |
| Manage application state    | [state-management.md](./state-management.md)       |
| Build UI components         | [components.md](./components.md)                   |
| Ensure type safety          | [type-safety.md](./type-safety.md)                 |
| Integrate AI features       | [ai-sdk-integration.md](./ai-sdk-integration.md)   |
| Handle CSS & layout         | [css-layout.md](./css-layout.md)                   |

### Before Committing

| Task                    | Document                         |
| ----------------------- | -------------------------------- |
| Run quality checklist   | [quality.md](./quality.md)       |
| Verify CSS in both envs | [css-layout.md](./css-layout.md) |
| Check type safety       | [type-safety.md](./type-safety.md) |

---

## Core Rules Summary

| Rule                                                         | Reference                                          |
| ------------------------------------------------------------ | -------------------------------------------------- |
| **Default to Server Components**                             | [components.md](./components.md)                   |
| **Use `<button>` for clickable actions, not `<div>`**        | [components.md](./components.md)                   |
| **Always use `next/image` instead of `<img>`**               | [components.md](./components.md)                   |
| **Import types from backend, never redefine them**           | [type-safety.md](./type-safety.md)                 |
| **No `any` types or `@ts-expect-error` in new code**         | [type-safety.md](./type-safety.md)                 |
| **Use oRPC client for API calls (not raw fetch)**            | [orpc-usage.md](./orpc-usage.md)                   |
| **Use oRPC generated query keys (not manual strings)**       | [orpc-usage.md](./orpc-usage.md)                   |
| **Store shareable state in URL with nuqs**                   | [state-management.md](./state-management.md)       |
| **Use `items-stretch` on main flex containers**              | [css-layout.md](./css-layout.md)                   |
| **Handle both tool call formats (streaming + history)**      | [ai-sdk-integration.md](./ai-sdk-integration.md)   |
| **Always check session loading state before rendering**      | [authentication.md](./authentication.md)           |

---

## Architecture Overview

```
+--------------------------------------------------------------+
|                    Next.js Application                        |
|                                                               |
|  app/                          modules/                       |
|  ├── (marketing)/              ├── [feature]/                 |
|  │   └── [locale]/             │   ├── components/            |
|  └── (app)/                    │   ├── hooks/                 |
|      └── [routes]/             │   ├── context/               |
|                                │   └── lib/                   |
|                                ├── shared/                    |
|                                └── ui/                        |
+-------------------------------+------------------------------+
                                |
          oRPC (type-safe RPC)  |  React Query (cache)
                                |
+-------------------------------+------------------------------+
|                    API Layer (Server)                         |
|  +--------------+  +----------------+  +------------------+  |
|  |   oRPC       |  |   better-auth  |  |   AI SDK         |  |
|  |   Router     |  |   Sessions     |  |   Streaming      |  |
|  +--------------+  +----------------+  +------------------+  |
+--------------------------------------------------------------+
```

---

## Getting Started

1. **Read the Must-Read documents** - Components, authentication, and oRPC usage
2. **Set up your project structure** - Follow [directory-structure.md](./directory-structure.md)
3. **Configure TypeScript paths** - See [type-safety.md](./type-safety.md)
4. **Set up API client** - Use patterns from [orpc-usage.md](./orpc-usage.md)
5. **Build components** - Follow [components.md](./components.md) and [hooks.md](./hooks.md)
6. **Before committing** - Complete the [quality.md](./quality.md) checklist

---

**Language**: All documentation is written in **English**.
