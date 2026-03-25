# Backend Development Guidelines Index

> **Tech Stack**: Next.js 15 API Routes + oRPC + Drizzle ORM + PostgreSQL

## Related Guidelines

| Guideline                 | Location     | When to Read                 |
| ------------------------- | ------------ | ---------------------------- |
| **Shared Code Standards** | `../shared/` | Always - applies to all code |

---

## Documentation Files

| File                                                 | Description                                        | When to Read                       |
| ---------------------------------------------------- | -------------------------------------------------- | ---------------------------------- |
| [directory-structure.md](./directory-structure.md)   | Module organization and directory layout           | Starting a new feature             |
| [orpc-usage.md](./orpc-usage.md)                     | oRPC router, procedures, middleware patterns       | Creating/modifying API endpoints   |
| [type-safety.md](./type-safety.md)                   | Zod schemas, type narrowing, response patterns     | Type-related decisions             |
| [database.md](./database.md)                         | Drizzle ORM, queries, transactions, SQL patterns   | Database operations                |
| [authentication.md](./authentication.md)             | better-auth, sessions, OAuth, protected procedures | Auth-related features              |
| [logging.md](./logging.md)                           | Structured logging, Sentry tracing, telemetry      | Debugging, observability           |
| [performance.md](./performance.md)                   | Concurrency, caching, batch processing, streaming  | Performance optimization           |
| [ai-sdk-integration.md](./ai-sdk-integration.md)     | Vercel AI SDK, tool calling, prompt patterns       | AI-powered features                |
| [quality.md](./quality.md)                           | Pre-commit checklist for backend code              | Before committing                  |

---

## Quick Navigation

### Service Module Structure

| Task                          | File                                               |
| ----------------------------- | -------------------------------------------------- |
| Project structure             | [directory-structure.md](./directory-structure.md) |
| Domain module pattern         | [directory-structure.md](./directory-structure.md) |
| Write types.ts                | [directory-structure.md](./directory-structure.md) |
| Write procedure               | [directory-structure.md](./directory-structure.md) |
| Write lib/ helpers            | [directory-structure.md](./directory-structure.md) |
| Router setup                  | [orpc-usage.md](./orpc-usage.md)                   |
| Middleware composition        | [orpc-usage.md](./orpc-usage.md)                   |
| Naming conventions            | [directory-structure.md](./directory-structure.md) |

### Type Safety

| Task                 | File                               |
| -------------------- | ---------------------------------- |
| Type safety patterns | [type-safety.md](./type-safety.md) |
| Discriminated unions | [type-safety.md](./type-safety.md) |
| Zod-first types      | [type-safety.md](./type-safety.md) |
| Zod error handling   | [type-safety.md](./type-safety.md) |
| Standard response    | [type-safety.md](./type-safety.md) |

### Database (Drizzle + PostgreSQL)

| Task                    | File                         |
| ----------------------- | ---------------------------- |
| Query organization      | [database.md](./database.md) |
| Batch queries (inArray) | [database.md](./database.md) |
| Conflict handling       | [database.md](./database.md) |
| Transactions            | [database.md](./database.md) |
| JSON column operations  | [database.md](./database.md) |
| Raw SQL camelCase       | [database.md](./database.md) |
| Enum comparison         | [database.md](./database.md) |

### Error Handling / Logging

| Task                        | File                           |
| --------------------------- | ------------------------------ |
| Structured logging          | [logging.md](./logging.md)     |
| Sentry span tracing         | [logging.md](./logging.md)     |
| Error capture               | [logging.md](./logging.md)     |
| oRPC error codes            | [orpc-usage.md](./orpc-usage.md) |
| Batch operation logging     | [logging.md](./logging.md)     |

### Performance

| Task                          | File                               |
| ----------------------------- | ---------------------------------- |
| Parallel execution            | [performance.md](./performance.md) |
| Concurrency control (p-limit) | [performance.md](./performance.md) |
| Exponential backoff retry     | [performance.md](./performance.md) |
| Redis caching                 | [performance.md](./performance.md) |
| Distributed locks             | [performance.md](./performance.md) |
| Chunked batch processing      | [performance.md](./performance.md) |
| Streaming large datasets      | [performance.md](./performance.md) |

### Authentication

| Task                        | File                                   |
| --------------------------- | -------------------------------------- |
| Protected procedures        | [authentication.md](./authentication.md) |
| Admin procedures            | [authentication.md](./authentication.md) |
| Session caching (Redis)     | [authentication.md](./authentication.md) |
| OAuth integration           | [authentication.md](./authentication.md) |
| Role-based access control   | [authentication.md](./authentication.md) |
| Client-side auth            | [authentication.md](./authentication.md) |

### AI Integration

| Task                        | File                                           |
| --------------------------- | ---------------------------------------------- |
| generateText / generateObject | [ai-sdk-integration.md](./ai-sdk-integration.md) |
| Streaming (streamText)      | [ai-sdk-integration.md](./ai-sdk-integration.md) |
| Tool calling                | [ai-sdk-integration.md](./ai-sdk-integration.md) |
| Telemetry configuration     | [ai-sdk-integration.md](./ai-sdk-integration.md) |
| Prompt engineering          | [ai-sdk-integration.md](./ai-sdk-integration.md) |
| AI error handling           | [ai-sdk-integration.md](./ai-sdk-integration.md) |

---

## Core Rules Summary

| Rule                                                             | Reference                                          |
| ---------------------------------------------------------------- | -------------------------------------------------- |
| **No `await` in loops** - use `inArray` for batch queries        | [database.md](./database.md)                       |
| **No `console.log`** - use structured logger                     | [logging.md](./logging.md)                         |
| **No non-null assertions `!`** - use type narrowing              | [type-safety.md](./type-safety.md)                 |
| **All API inputs/outputs have Zod schemas**                      | [type-safety.md](./type-safety.md)                 |
| **Import enums from utils** - not from database package          | [type-safety.md](./type-safety.md)                 |
| **Standard response format** - always include `success`/`reason` | [type-safety.md](./type-safety.md)                 |
| **Use `protectedProcedure`** for authenticated endpoints         | [authentication.md](./authentication.md)           |
| **One procedure per file** - keep procedures focused             | [orpc-usage.md](./orpc-usage.md)                   |
| **Service modules follow domain layout**                         | [directory-structure.md](./directory-structure.md) |
| **Use `Promise.all`** for independent parallel operations        | [performance.md](./performance.md)                 |
| **Use `p-limit`** for external API concurrency control           | [performance.md](./performance.md)                 |
| **Always enable AI telemetry** for token tracking                | [ai-sdk-integration.md](./ai-sdk-integration.md)   |
| **Cast `::jsonb`** for PostgreSQL JSON operations                | [database.md](./database.md)                       |
| **Double-quote camelCase** column names in raw SQL               | [database.md](./database.md)                       |
| **Use structured context** in logs - no string interpolation     | [logging.md](./logging.md)                         |
| **Run pre-commit checklist** before committing                   | [quality.md](./quality.md)                         |

---

## Reference Files

| Feature              | Typical Location                        |
| -------------------- | --------------------------------------- |
| Drizzle Client       | `packages/database/drizzle/client.ts`   |
| Schema Definition    | `packages/database/drizzle/schema/`     |
| Database Queries     | `packages/database/drizzle/queries/`    |
| oRPC Router          | `packages/api/orpc/router.ts`           |
| Base Procedures      | `packages/api/orpc/procedures.ts`       |
| Middleware           | `packages/api/orpc/middleware/`         |
| Service Module       | `packages/api/modules/{domain}/`        |
| Module Types (Zod)   | `packages/api/modules/{domain}/types.ts`|
| Auth Configuration   | `packages/auth/auth.ts`                 |
| Auth Client          | `packages/auth/client.ts`               |
| Shared Utils/Enums   | `packages/utils/`                       |

---

**Language**: All documentation must be written in **English**.
