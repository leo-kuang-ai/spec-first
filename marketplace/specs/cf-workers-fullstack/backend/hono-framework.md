# Hono Framework Guide

> Source: llms.txt from https://hono.dev/llms-full.txt

## Overview

Hono is a small, simple, and ultrafast web framework built on Web Standards. It works on Cloudflare Workers, providing excellent performance and developer experience with first-class TypeScript support.

## Key Patterns

### Basic Application Setup

```typescript
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.text("Hello Cloudflare Workers!"));

export default app;
```

### Type-Safe Bindings (Cloudflare Workers)

```typescript
type Bindings = {
  MY_KV: KVNamespace;
  MY_BUCKET: R2Bucket;
  MY_DB: D1Database;
  SECRET_KEY: string;
};

type Variables = {
  user: User;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Access bindings via c.env
app.get("/data", async (c) => {
  const value = await c.env.MY_KV.get("key");
  return c.json({ value });
});

// Access variables via c.get/c.set
app.use("*", async (c, next) => {
  c.set("user", { id: "123", name: "John" });
  await next();
});
```

### Middleware Usage

```typescript
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { bearerAuth } from "hono/bearer-auth";

const app = new Hono();

// Global middleware
app.use("*", logger());
app.use("*", secureHeaders());
app.use("/api/*", cors());

// Route-specific middleware with env variables
app.use("/auth/*", async (c, next) => {
  const auth = bearerAuth({ token: c.env.API_TOKEN });
  return auth(c, next);
});
```

### Zod Validation

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const schema = z.object({
  name: z.string(),
  email: z.string().email(),
});

app.post("/users", zValidator("json", schema), async (c) => {
  const data = c.req.valid("json"); // Type-safe validated data
  return c.json({ success: true, data });
});
```

### Error Handling

```typescript
import { HTTPException } from "hono/http-exception";

// Throw HTTP exceptions
app.get("/protected", async (c) => {
  if (!authorized) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  return c.json({ data: "secret" });
});

// Global error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});
```

### Response Methods

```typescript
// Text response
c.text("Hello");

// JSON response
c.json({ message: "Hello" });

// HTML response
c.html("<h1>Hello</h1>");

// Redirect
c.redirect("/new-path");

// Set status code
c.json({ error: "Not Found" }, 404);

// Set headers
c.header("X-Custom-Header", "value");
return c.json({ data });
```

### Route Grouping

```typescript
import { Hono } from "hono";

const app = new Hono();
const api = new Hono();

api.get("/users", (c) => c.json([]));
api.get("/users/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ id });
});

app.route("/api/v1", api);
```

### WebSocket (Cloudflare Workers)

```typescript
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/cloudflare-workers";

const app = new Hono();

app.get(
  "/ws",
  upgradeWebSocket((c) => ({
    onMessage: (event, ws) => {
      ws.send(`Echo: ${event.data}`);
    },
    onClose: () => {
      console.log("Connection closed");
    },
  })),
);
```

### Using Other Event Handlers

```typescript
const app = new Hono();

// ... routes

export default {
  fetch: app.fetch,
  scheduled: async (event, env, ctx) => {
    // Handle scheduled events (cron)
  },
};
```

## Best Practices

- Always define `Bindings` and `Variables` types for type safety
- Use `c.env` to access environment variables (not `process.env`)
- Use Zod validator middleware for input validation
- Use built-in middleware (cors, logger, secureHeaders) instead of custom implementations
- Group related routes using `app.route()`
- Use `HTTPException` for error handling
- Enable `nodejs_compat` flag in `wrangler.toml` for `AsyncLocalStorage` support

## Cloudflare Workers Specific

### Environment Variables

```typescript
// Local development: use .dev.vars file
// Production: set in Cloudflare dashboard

// Access via c.env (NOT process.env)
app.get("/config", (c) => {
  const apiKey = c.env.API_KEY;
  return c.json({ configured: !!apiKey });
});
```

### Static Assets

```toml
# wrangler.toml
assets = { directory = "public" }
```

### ExecutionContext

```typescript
app.get("/async-task", async (c) => {
  // Use waitUntil for background tasks
  c.executionCtx.waitUntil(logAnalytics(c.req.url));
  return c.json({ status: "ok" });
});
```

### Cache API

```typescript
import { cache } from "hono/cache";

app.get(
  "/cached/*",
  cache({
    cacheName: "my-app",
    cacheControl: "max-age=3600",
  }),
);
```

## Avoid

- Using `process.env` directly (use `c.env` instead)
- Using `console.log` in production (use logger middleware)
- Blocking the main thread with synchronous operations
- Not handling errors properly (always use error handlers)
- Using non-null assertions for request data (use validators)
- Forgetting to export `default app` for Cloudflare Workers

## Testing

```typescript
import { describe, it, expect } from "vitest";

describe("API", () => {
  it("should return 200", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
  });

  it("should handle env bindings", async () => {
    const res = await app.request(
      "/",
      {},
      {
        API_KEY: "test-key",
        MY_KV: mockKV,
      },
    );
    expect(res.status).toBe(200);
  });
});
```

## Reference

- [Hono Official Docs](https://hono.dev)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
