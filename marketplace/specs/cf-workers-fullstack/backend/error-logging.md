# Error Handling & Logging

> Error handling patterns and logging guidelines.

---

## Error Handling

### HTTPException Pattern

Use Hono's `HTTPException` for API errors:

```typescript
import { HTTPException } from "hono/http-exception";

// Throw HTTP exceptions
app.get("/protected", async (c) => {
  const user = await getUser(id);
  if (!user) {
    throw new HTTPException(404, { message: "User not found" });
  }

  if (!hasPermission(user)) {
    throw new HTTPException(403, { message: "Access denied" });
  }

  return c.json({ data: user });
});
```

### Global Error Handler

```typescript
// Global error handler
app.onError((err, c) => {
  const logger = c.get("logger");

  if (err instanceof HTTPException) {
    logger.warn("http_exception", {
      status: err.status,
      message: err.message,
    });
    return c.json({ error: err.message }, err.status);
  }

  if (err instanceof z.ZodError) {
    logger.warn("validation_error", { issues: err.issues });
    return c.json(
      {
        error: "Validation failed",
        details: err.issues,
      },
      400,
    );
  }

  logger.error("unhandled_error", { error: err });
  return c.json({ error: "Internal Server Error" }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});
```

### Error Response Format

Consistent error response structure:

```typescript
// Single error
{
  "success": false,
  "error": "User not found",
  "code": "NOT_FOUND"
}

// Validation errors
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "path": ["email"], "message": "Invalid email format" }
  ]
}
```

---

## Logging Guidelines

### Overview

Use a structured logging system optimized for Cloudflare Workers. All logs are output as JSON to `console.log`, which can then be:

- Viewed in real-time via `wrangler tail`
- Pushed to external log services via Cloudflare Logpush (Datadog, Logtail, etc.)

### Logging Architecture

```
src/lib/logger.ts              - Logger utilities
src/middleware/request-context.ts - Request context middleware
src/types.ts                   - Shared types (includes logger in Variables)
```

### Core Components

#### 1. Global Logger (No Request Context)

Use for application startup, scheduled jobs, or errors outside request context:

```typescript
import { logger } from "../lib/logger";

// Global logging (no requestId)
logger.info("Application started");
logger.error("Scheduled job failed", error);
```

#### 2. Request Logger (With Context)

Use within request handlers. Automatically includes requestId, method, path:

```typescript
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types";

const myMiddleware = (): MiddlewareHandler<AppEnv> => {
  return async (c, next) => {
    const logger = c.get("logger"); // RequestLogger instance

    logger.info("Processing request", { customField: "value" });

    // Update context (e.g., after authentication)
    logger.setContext({ userId: user.id });

    logger.warn("Rate limit approaching", { remaining: 5 });
    logger.error("Database connection failed", error);

    await next();
  };
};
```

### Log Levels

| Level   | Use Case                                                        |
| ------- | --------------------------------------------------------------- |
| `debug` | Development-only details, verbose tracing                       |
| `info`  | Normal operations, business events (user login, sync completed) |
| `warn`  | Potential issues, degraded performance, rate limits             |
| `error` | Errors that need attention, failed operations                   |

### Log Output Format

All logs are structured JSON:

```json
{
  "timestamp": "2025-12-11T12:00:00.000Z",
  "level": "info",
  "message": "session_authenticated",
  "requestId": "abc123",
  "method": "POST",
  "path": "/api/workspaces",
  "userId": "user_456",
  "sessionId": "sess_789"
}
```

### Standard Log Messages

Use consistent message names for common operations:

| Message                 | Level | When                                          |
| ----------------------- | ----- | --------------------------------------------- |
| `request_start`         | info  | Request begins (auto-logged by middleware)    |
| `request_end`           | info  | Request completes (auto-logged by middleware) |
| `request_error`         | error | Unhandled error (auto-logged by middleware)   |
| `session_authenticated` | info  | User authenticated successfully               |
| `unauthorized_access`   | warn  | Auth failed (401 returned)                    |
| `forbidden_access`      | warn  | Permission denied (403 returned)              |
| `validation_error`      | warn  | Input validation failed                       |
| `db_query_slow`         | warn  | Query took > threshold                        |

### Request Context Middleware

The `requestContext()` middleware is mounted first and provides:

```typescript
// src/index.ts
import { requestContext } from "./middleware/request-context";

app.use("*", requestContext()); // First middleware!
```

What it does:

1. Generates unique `requestId` using `crypto.randomUUID()`
2. Creates `RequestLogger` with request context (method, path)
3. Sets `X-Request-Id` response header
4. Logs `request_start` automatically
5. Logs `request_end` or `request_error` automatically

### Accessing Logger and RequestId

```typescript
// In any route handler or middleware
app.get("/api/example", async (c) => {
  const logger = c.get("logger"); // RequestLogger
  const requestId = c.get("requestId"); // string

  logger.info("Processing example", { step: 1 });

  return c.json({ requestId }); // Can return to client for tracing
});
```

### Best Practices

**DO:**

- Use `c.get('logger')` in all request handlers
- Call `logger.setContext({ userId })` after authentication
- Include relevant metadata in logs (IDs, counts, durations)
- Use consistent message names (snake_case)
- Log at appropriate levels

**DON'T:**

- Use `console.log` directly (no structure, no context)
- Log sensitive data (passwords, tokens, full credit cards)
- Log entire request/response bodies (too verbose, may contain PII)
- Create new logger instances (use the one from context)

### Example Logger Implementation

```typescript
// src/lib/logger.ts
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  method?: string;
  path?: string;
  userId?: string;
  [key: string]: unknown;
}

export class RequestLogger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  setContext(ctx: Partial<LogContext>): void {
    this.context = { ...this.context, ...ctx };
  }

  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...data,
    };
    console.log(JSON.stringify(entry));
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log("debug", message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log("warn", message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log("error", message, data);
  }
}

// Global logger for non-request contexts
export const logger = new RequestLogger();
```
