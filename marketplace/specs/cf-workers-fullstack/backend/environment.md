# Environment & Request Context

> Environment variables and request context patterns.

---

## Environment Variables (Cloudflare Workers)

### Overview

Environment variables in Cloudflare Workers have unique characteristics compared to traditional Node.js applications. This guide covers best practices, common pitfalls, and solutions specific to Workers runtime.

**Key Concept**: There are TWO types of environment variables:

1. **Workers Runtime Variables** - For backend code (accessed via `c.env`)
2. **Vite Build-Time Variables** - For frontend code (accessed via `import.meta.env.VITE_*`)

### Workers Runtime Environment Variables

#### Access Methods

**RECOMMENDED: Use `c.env` (Context Environment)**

```typescript
import { Hono } from "hono";

type Bindings = {
  DATABASE_URL: string;
  API_KEY: string;
  MY_KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/config", (c) => {
  // Correct - Access via c.env
  const apiKey = c.env.API_KEY;
  const dbUrl = c.env.DATABASE_URL;

  return c.json({ configured: !!apiKey });
});
```

**ALTERNATIVE: Use `process.env` (Requires Configuration)**

Since April 2025, `process.env` is supported with `nodejs_compat` compatibility flag:

```toml
# wrangler.toml
compatibility_flags = ["nodejs_compat"]
compatibility_date = "2025-04-01"
```

```typescript
// With nodejs_compat enabled (after 2025-04-01)
app.get("/config", (c) => {
  const apiKey = process.env.API_KEY;
  return c.json({ configured: !!apiKey });
});
```

**NEVER: Use global scope for environment variables**

```typescript
// BAD - Stale values in global scope
const API_KEY = process.env.API_KEY; // Cached at module load

app.get("/", (c) => {
  // This uses the old cached value even if env changes
  return c.json({ key: API_KEY });
});

// GOOD - Always access fresh values
app.get("/", (c) => {
  const apiKey = c.env.API_KEY; // Fresh value per request
  return c.json({ key: apiKey });
});
```

#### Local Development Configuration

**File: `.dev.vars`**

Use `.dev.vars` for local development environment variables:

```bash
# .dev.vars (local development only)
DATABASE_URL=libsql://localhost:8080
API_KEY=dev-api-key-123
AUTH_SECRET=local-secret-min-32-characters
AUTH_URL=http://localhost:8787
```

**CRITICAL: Add to .gitignore**

```gitignore
# .gitignore
.dev.vars
.dev.vars.*
.env
.env.*
```

**Environment-Specific Files**

Create separate files for different environments:

```bash
.dev.vars              # Default local development
.dev.vars.staging      # Staging environment
.dev.vars.production   # Production environment (DO NOT COMMIT)
```

Use with wrangler:

```bash
# Use staging environment
wrangler dev --env staging
```

#### Production Configuration

**Non-Sensitive Variables: `wrangler.toml`**

```toml
# wrangler.toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2025-04-01"

[vars]
# OK - Non-sensitive configuration
ENVIRONMENT = "production"
API_VERSION = "v1"
LOG_LEVEL = "info"

# NEVER - Sensitive information
# API_KEY = "secret-key"  # DON'T DO THIS
```

**Sensitive Variables: Wrangler Secrets**

```bash
# Set secrets via CLI (encrypted, not visible in dashboard)
wrangler secret put API_KEY
wrangler secret put DATABASE_URL
wrangler secret put AUTH_SECRET

# List secrets (only names, not values)
wrangler secret list

# Delete secret
wrangler secret delete API_KEY
```

**Or via Cloudflare Dashboard:**

1. Go to Workers & Pages -> Your Worker -> Settings -> Variables
2. Add under "Encrypted" section (not "Plain text")

#### Type Safety for Bindings

**Always define Bindings type:**

```typescript
// src/types/bindings.ts
export type CloudflareBindings = {
  // Environment variables
  DATABASE_URL: string;
  API_KEY: string;
  AUTH_SECRET: string;
  AUTH_URL: string;

  // KV Namespaces
  MY_KV: KVNamespace;

  // R2 Buckets
  MY_BUCKET: R2Bucket;

  // D1 Databases
  DB: D1Database;
};

// src/index.ts
import { Hono } from "hono";
import type { CloudflareBindings } from "./types/bindings";

const app = new Hono<{ Bindings: CloudflareBindings }>();
```

**Generate types automatically:**

```bash
# Generate TypeScript types from wrangler.toml
npx wrangler types --env-interface CloudflareBindings
```

Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@cloudflare/workers-types", "./worker-configuration.d.ts"]
  }
}
```

### Frontend (Vite) Environment Variables

**CRITICAL: Frontend variables are BAKED INTO BUILD**

Frontend environment variables are replaced with static strings during build. They are NOT runtime variables.

#### Configuration

**File: `.env` (for Vite)**

```bash
# .env (Vite build-time variables)
# Must use VITE_ prefix
VITE_API_URL=http://localhost:8787
VITE_APP_NAME=My App
```

**File: `.env.production`**

```bash
# .env.production
VITE_API_URL=https://api.example.com
```

#### Usage in Frontend Code

```typescript
// src/client/config.ts

// GOOD - Use import.meta.env for client code
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:8787",
  appName: import.meta.env.VITE_APP_NAME || "My App",
};

// BAD - process.env doesn't work in browser
const apiUrl = process.env.VITE_API_URL; // undefined in browser

// BAD - c.env doesn't exist in client
const apiUrl = c.env.API_URL; // Error: c is not defined
```

**In React components:**

```tsx
// GOOD
function App() {
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${apiUrl}/api/data`);
  }, [apiUrl]);
}
```

#### Security Considerations

**NEVER expose sensitive data in frontend variables:**

```bash
# BAD - These will be visible in bundled JavaScript
VITE_DATABASE_URL=postgres://...
VITE_API_SECRET=secret-key-123
VITE_ENCRYPTION_KEY=xyz...

# GOOD - Only public configuration
VITE_API_URL=https://api.example.com
VITE_APP_NAME=My App
VITE_PUBLIC_KEY=public-key-abc
```

**Frontend variables are PUBLIC** - Anyone can view them in browser DevTools.

### Common Pitfalls & Solutions

#### Pitfall 1: Using Wrong Access Method

```typescript
// BAD - process.env without nodejs_compat
app.get("/data", async (c) => {
  const db = createDb(process.env.DATABASE_URL); // undefined
});

// GOOD - Use c.env
app.get("/data", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
});
```

#### Pitfall 2: Global Scope Caching

```typescript
// BAD - Cached at module load, becomes stale
const client = createClient(process.env.API_KEY);

app.get("/", (c) => {
  return client.fetch(); // Uses old key even if secret updated
});

// GOOD - Create per request or use factory function
app.get("/", (c) => {
  const client = createClient(c.env.API_KEY);
  return client.fetch();
});

// GOOD - Factory function pattern
const createClientFromEnv = (env: CloudflareBindings) => {
  return createClient(env.API_KEY);
};

app.get("/", (c) => {
  const client = createClientFromEnv(c.env);
  return client.fetch();
});
```

#### Pitfall 3: Mixing .env and .dev.vars

```bash
# BAD - Both files present causes confusion
.env          # Some vars here
.dev.vars     # Other vars here

# GOOD - Use only .dev.vars for Workers
.dev.vars     # All Workers runtime vars
.env          # Only for Vite build vars (VITE_ prefix)
```

**Wrangler precedence:**

1. If `.dev.vars` exists -> `.env` is ignored for Workers
2. Use `.dev.vars` for Workers, `.env` for Vite

#### Pitfall 4: import.meta.env in Workers Code

```typescript
// BAD - import.meta.env doesn't work in Workers runtime
// src/index.ts (Workers code)
const dbUrl = import.meta.env.DATABASE_URL; // undefined at runtime

// GOOD - Use c.env in Workers
const dbUrl = c.env.DATABASE_URL;
```

**Rule**: `import.meta.env` is for Vite-bundled frontend code ONLY.

#### Pitfall 5: Drizzle Config with import.meta.env

```typescript
// BAD - drizzle-kit runs in Node, not Vite
// drizzle.config.ts
export default defineConfig({
  dbCredentials: {
    url: import.meta.env.DATABASE_URL, // Error: "import.meta" not available
  },
});

// GOOD - Use dotenv + process.env
import { config } from "dotenv";
config({ path: ".env" });

export default defineConfig({
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

#### Pitfall 6: Exposing Secrets in wrangler.toml

```toml
# BAD - Secrets in plain text (committed to git)
[vars]
DATABASE_PASSWORD = "super-secret-123"
API_KEY = "sk-xxx"

# GOOD - Use wrangler secrets
# (Set via CLI, encrypted, not in config file)
```

```bash
wrangler secret put DATABASE_PASSWORD
wrangler secret put API_KEY
```

#### Pitfall 7: Not Defining TypeScript Types

```typescript
// BAD - No type safety
app.get("/", (c) => {
  const key = c.env.API_KEY; // Type: any
});

// GOOD - Strong typing
type Bindings = {
  API_KEY: string;
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  const key = c.env.API_KEY; // Type: string
  const invalid = c.env.TYPO; // Type error: Property 'TYPO' does not exist
});
```

### Environment-Specific Patterns

#### Development vs Production

```typescript
// GOOD - Environment-aware logic
app.get("/debug", (c) => {
  const isDev = c.env.ENVIRONMENT === "development";

  if (isDev) {
    // Show detailed debug info in dev
    return c.json({ debug: true, env: c.env });
  }

  return c.json({ message: "Debug disabled in production" });
});
```

#### Multiple Environments

```toml
# wrangler.toml
name = "my-worker"

[env.staging]
vars = { ENVIRONMENT = "staging" }

[env.production]
vars = { ENVIRONMENT = "production" }
```

```bash
# Deploy to specific environment
wrangler deploy --env staging
wrangler deploy --env production
```

### Best Practices Checklist

**Setup:**

- [ ] Add `.dev.vars` to `.gitignore`
- [ ] Define `Bindings` type for all env variables
- [ ] Run `wrangler types` to generate TypeScript types
- [ ] Use `.dev.vars` for Workers, `.env` for Vite
- [ ] Prefix frontend vars with `VITE_`

**Security:**

- [ ] Never commit secrets to git
- [ ] Use `wrangler secret put` for sensitive data
- [ ] Don't put secrets in `[vars]` in `wrangler.toml`
- [ ] Don't expose backend secrets in `VITE_` variables
- [ ] Review `.gitignore` includes all env files

**Code:**

- [ ] Use `c.env` to access variables in Workers
- [ ] Use `import.meta.env.VITE_*` in frontend code
- [ ] Don't cache env values in global scope
- [ ] Always type your Bindings interface
- [ ] Use `process.env` in `drizzle.config.ts` (with dotenv)

**Deployment:**

- [ ] Set production secrets via `wrangler secret put`
- [ ] Use environment-specific configs for staging/prod
- [ ] Verify all required secrets are set before deploy
- [ ] Test with production-like env vars in staging

### Quick Reference

| Context                   | Access Method              | File            | Notes                                      |
| ------------------------- | -------------------------- | --------------- | ------------------------------------------ |
| **Workers Runtime**       | `c.env.VAR_NAME`           | `.dev.vars`     | Recommended method                         |
| **Workers Runtime**       | `process.env.VAR_NAME`     | `.dev.vars`     | Requires `nodejs_compat` flag              |
| **Frontend (Vite)**       | `import.meta.env.VITE_VAR` | `.env`          | Baked into build, must have `VITE_` prefix |
| **Drizzle Config**        | `process.env.VAR_NAME`     | `.env`          | Use dotenv package                         |
| **Production Secrets**    | -                          | CLI/Dashboard   | `wrangler secret put VAR_NAME`             |
| **Production Non-Secret** | -                          | `wrangler.toml` | `[vars]` section                           |

---

## Request Context & Shared Types

### Overview

Use a centralized type system and request context middleware to ensure type safety and consistent logging across all routes.

### Key Types

```typescript
// src/types.ts
import type { RequestLogger } from "./lib/logger";

// Cloudflare Workers environment bindings
export type Bindings = {
  DATABASE_URL: string;
  AUTH_URL: string;
  AUTH_SECRET: string;
  OAUTH_CLIENT_ID?: string;
  OAUTH_CLIENT_SECRET?: string;
};

// Context variables (set by middleware)
export type Variables = {
  requestId: string; // Set by requestContext middleware
  logger: RequestLogger; // Set by requestContext middleware
  session?: Session; // Set by requireSession/optionalSession
  user?: SessionUser; // Set by requireSession/optionalSession
};

// Combined type for Hono app
export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
```

### Using AppEnv in Routes

All routes and middleware should use `AppEnv` type:

```typescript
import { Hono } from "hono";
import type { AppEnv } from "../types";

// Good - Use shared AppEnv
const app = new Hono<AppEnv>();

app.get("/example", async (c) => {
  const logger = c.get("logger"); // Type-safe: RequestLogger
  const user = c.get("user"); // Type-safe: SessionUser | undefined
  // ...
});

// Bad - Duplicate type definitions
const app = new Hono<{
  Bindings: { DATABASE_URL: string /* ... */ };
}>();
```

### Request Context Middleware

The `requestContext()` middleware MUST be the first middleware mounted:

```typescript
// src/index.ts
import { Hono } from "hono";
import { requestContext } from "./middleware/request-context";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

// MUST be first - provides requestId and logger
app.use("*", requestContext());

// Other middleware and routes...
app.route("/api/workspaces", workspaceRoutes);
```

### Cloudflare Workers Global Scope Restrictions

**CRITICAL**: Cloudflare Workers prohibit certain operations in global scope:

- `crypto.getRandomValues()` / `crypto.randomUUID()`
- `fetch()` / `connect()`
- `setTimeout()` / `setInterval()`

This affects libraries that call random at import time.

```typescript
// BAD - Random in module scope
const REQUEST_ID = crypto.randomUUID(); // Same ID for all requests!

// GOOD - Call inside request handler
export const requestContext = () => {
  return async (c, next) => {
    // crypto.randomUUID() is allowed inside handlers
    const requestId = crypto.randomUUID();
    c.set("requestId", requestId);
    await next();
  };
};
```

**Deploy Error Message (if you hit this):**

```
Uncaught Error: Disallowed operation called within global scope.
Asynchronous I/O (ex: fetch() or connect()), setting a timeout,
and generating random values are not allowed within global scope.
```

**Solution**: Move the operation inside a request handler or middleware.

### Best Practices

1. **Always use `AppEnv`** from `src/types.ts` for Hono apps
2. **Mount `requestContext()` first** - before any other middleware
3. **Access `logger` from context** - don't create new instances
4. **Check global scope** - no random/fetch/timeout at module level
5. **Use `crypto.randomUUID()`** inside handlers

## Reference

- [Cloudflare Workers - Environment Variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)
- [Cloudflare Workers - Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Vite - Environment Variables](https://vite.dev/guide/env-and-mode.html)
