# Backend Development Guidelines Index

> **Tech Stack**: Cloudflare Workers + Hono + Drizzle ORM + Edge SQLite (e.g., Turso, PlanetScale)

## Related Guidelines

| Guideline                 | Location     | When to Read                 |
| ------------------------- | ------------ | ---------------------------- |
| **Shared Code Standards** | `../shared/` | Always - applies to all code |

---

## Documentation Files

| File                                     | Description                                     | When to Read                    |
| ---------------------------------------- | ----------------------------------------------- | ------------------------------- |
| [api-module.md](./api-module.md)         | API module organization, types, procedures, lib | Creating/modifying API modules  |
| [api-patterns.md](./api-patterns.md)     | Best practices, common patterns, anti-patterns  | Implementing API features       |
| [type-safety.md](./type-safety.md)       | Zod schemas, Hono header types                  | Type-related decisions          |
| [database.md](./database.md)             | Drizzle ORM, edge SQLite, batch operations      | Database operations             |
| [environment.md](./environment.md)       | Environment variables, request context          | Configuration, context patterns |
| [error-logging.md](./error-logging.md)   | Error handling, logging patterns                | Error handling decisions        |
| [hono-framework.md](./hono-framework.md) | Hono framework patterns                         | Hono-specific features          |
| [security.md](./security.md)             | Authentication, security patterns               | Security implementation         |
| [storage.md](./storage.md)               | KV, R2 storage, session caching                 | Caching, file storage           |
| [quality.md](./quality.md)               | Code quality guidelines                         | Before committing               |

---

## Quick Navigation

### API Module Structure

| Task                    | File                                 |
| ----------------------- | ------------------------------------ |
| API module organization | [api-module.md](./api-module.md)     |
| Directory structure     | [api-module.md](./api-module.md)     |
| Write types.ts          | [api-module.md](./api-module.md)     |
| Write router.ts         | [api-module.md](./api-module.md)     |
| Write procedures        | [api-module.md](./api-module.md)     |
| Write lib helpers       | [api-module.md](./api-module.md)     |
| Best practices          | [api-patterns.md](./api-patterns.md) |
| Common patterns         | [api-patterns.md](./api-patterns.md) |
| Anti-patterns           | [api-patterns.md](./api-patterns.md) |

### Type Safety

| Task                | File                               |
| ------------------- | ---------------------------------- |
| Zod schema patterns | [type-safety.md](./type-safety.md) |
| Zod v4 notes        | [type-safety.md](./type-safety.md) |
| Hono header types   | [type-safety.md](./type-safety.md) |
| Non-null assertions | [type-safety.md](./type-safety.md) |

### Database (Drizzle + Edge SQLite)

| Task                     | File                         |
| ------------------------ | ---------------------------- |
| Drizzle patterns         | [database.md](./database.md) |
| Edge DB integration      | [database.md](./database.md) |
| Batch operations         | [database.md](./database.md) |
| No await in loops        | [database.md](./database.md) |
| Workers pitfalls         | [database.md](./database.md) |
| Pagination (cursor/page) | [database.md](./database.md) |

### Error Handling & Logging

| Task                     | File                                   |
| ------------------------ | -------------------------------------- |
| HTTPException patterns   | [error-logging.md](./error-logging.md) |
| Global error handler     | [error-logging.md](./error-logging.md) |
| Structured logging       | [error-logging.md](./error-logging.md) |
| Request context logger   | [error-logging.md](./error-logging.md) |

### Environment & Configuration

| Task                        | File                               |
| --------------------------- | ---------------------------------- |
| Environment variables       | [environment.md](./environment.md) |
| Request context             | [environment.md](./environment.md) |
| Workers global restrictions | [environment.md](./environment.md) |
| Frontend (Vite) env vars    | [environment.md](./environment.md) |

### Authentication & Security

| Task                    | File                         |
| ----------------------- | ---------------------------- |
| Authentication patterns | [security.md](./security.md) |
| Token security          | [security.md](./security.md) |
| Session management      | [security.md](./security.md) |
| OAuth security          | [security.md](./security.md) |

### Storage & Caching

| Task            | File                       |
| --------------- | -------------------------- |
| Session caching | [storage.md](./storage.md) |
| R2 storage      | [storage.md](./storage.md) |
| KV storage      | [storage.md](./storage.md) |

### Hono Framework

| Task                 | File                                     |
| -------------------- | ---------------------------------------- |
| Basic app setup      | [hono-framework.md](./hono-framework.md) |
| Middleware usage      | [hono-framework.md](./hono-framework.md) |
| Route grouping       | [hono-framework.md](./hono-framework.md) |
| WebSocket            | [hono-framework.md](./hono-framework.md) |
| Testing              | [hono-framework.md](./hono-framework.md) |

### Import Paths & Quality

| Task           | File                       |
| -------------- | -------------------------- |
| Code quality   | [quality.md](./quality.md) |
| ESLint rules   | [quality.md](./quality.md) |
| Review process | [quality.md](./quality.md) |

---

## Core Rules Summary

| Rule                                                        | Reference                                    |
| ----------------------------------------------------------- | -------------------------------------------- |
| **API modules follow domain layout**                        | [api-module.md](./api-module.md)             |
| **Separate API routes from frontend routes**                | [api-module.md](./api-module.md)             |
| **All types from Zod schemas**                              | [type-safety.md](./type-safety.md)           |
| **No non-null assertions `!`**                              | [type-safety.md](./type-safety.md)           |
| **No await in loops**                                       | [database.md](./database.md)                 |
| **Use request context for per-request state**               | [environment.md](./environment.md)           |
| **Use `c.env` for environment variables** (not process.env) | [environment.md](./environment.md)           |
| **Mount `requestContext()` first**                          | [environment.md](./environment.md)           |
| **Use structured logger**, not `console.log`                | [error-logging.md](./error-logging.md)       |
| **Hash tokens before storing in database**                  | [security.md](./security.md)                 |
| **No `any` types** (use `unknown` if needed)                | [quality.md](./quality.md)                   |
| **Validate all inputs with Zod**                            | [quality.md](./quality.md)                   |
| **Use explicit edge driver** (`/http` or `/web`)            | [database.md](./database.md)                 |
| **No global scope I/O** (random, fetch, timeout)            | [environment.md](./environment.md)           |
| **Use `waitUntil` for background tasks**                    | [hono-framework.md](./hono-framework.md)     |

---

## Example Project Structure

```
src/
├── routes/[domain]/
│   ├── types.ts           # Zod schemas + TypeScript types
│   ├── router.ts          # Route definitions
│   ├── procedures/        # Endpoint handlers
│   │   ├── create.ts
│   │   ├── update.ts
│   │   └── list.ts
│   └── lib/               # Shared business logic
├── middleware/            # Hono middleware
├── lib/                   # Shared utilities
│   ├── db.ts              # Database client
│   └── logger.ts          # Logging utilities
└── index.ts               # Hono app entry
```

---

## Reference Files

| Feature              | Typical Location                    |
| -------------------- | ----------------------------------- |
| Hono App Entry       | `src/index.ts`                      |
| Database Client      | `src/lib/db.ts` or `src/db/index.ts`|
| Schema Definition    | `src/db/schema.ts`                  |
| Drizzle Config       | `drizzle.config.ts`                 |
| Shared Types (AppEnv)| `src/types.ts`                      |
| Bindings Type        | `src/types/bindings.ts`             |
| Auth Middleware       | `src/middleware/auth.ts`            |
| Request Context      | `src/middleware/request-context.ts`  |
| Logger Utilities     | `src/lib/logger.ts`                 |
| Security Helpers     | `src/lib/security.ts`               |
| Session Cache        | `src/lib/session-cache.ts`          |
| R2 Storage Helpers   | `src/lib/r2/index.ts`               |
| Domain Router        | `src/routes/{domain}/router.ts`     |
| Domain Types         | `src/routes/{domain}/types.ts`      |
| Domain Procedures    | `src/routes/{domain}/procedures/`   |
| Domain Lib           | `src/routes/{domain}/lib/`          |
| Wrangler Config      | `wrangler.toml`                     |
| Local Dev Env Vars   | `.dev.vars`                         |
| Frontend Env Vars    | `.env`                              |
| Migration Output     | `drizzle/`                          |

---

**Language**: All documentation must be written in **English**.
