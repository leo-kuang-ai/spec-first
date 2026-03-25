# Environment Variables Best Practices

> **Severity**: P1 - Wrong URLs in production

## Problem

After deploying to production, URLs in the application point to `localhost:5173` instead of the production domain:

- OAuth callbacks redirect to localhost
- API endpoints use localhost URLs
- Email links contain localhost addresses

Users see `ERR_CONNECTION_REFUSED` when clicking links.

## Example Scenario

```
User clicks "Login with Google"
         |
Application constructs callback URL
         |
URL is: http://localhost:5173/api/auth/callback/google
         |
Browser tries to connect to localhost
         |
ERR_CONNECTION_REFUSED
```

## Initial Attempts (All Failed)

### 1. Configure OAuth provider with production URL

```
Google Console -> OAuth -> Redirect URI -> https://myapp.com/...
```

**Why it fails**: The OAuth provider redirect is correct, but the application internally generates localhost URLs. The provider setting doesn't affect application-generated URLs.

### 2. Check deployment environment

```bash
wrangler secret list
# DATABASE_URL: [configured]
# AUTH_SECRET: [configured]
# APP_URL: [not set]
```

**Why it fails**: The secret might be missing, or the code doesn't read it correctly.

### 3. Set environment variable at build time

```typescript
// vite.config.ts
define: {
  'process.env.APP_URL': JSON.stringify('https://myapp.com')
}
```

**Why it fails**: Build-time variables are baked into the bundle. Different deployments (staging, production) need different URLs.

## Root Cause

Two distinct issues cause this problem:

### Issue 1: Build-Time vs Runtime Variables

| Variable Type                         | When Resolved       | Use Case                      |
| ------------------------------------- | ------------------- | ----------------------------- |
| Build-time (`import.meta.env.VITE_*`) | During `vite build` | Public, static values         |
| Runtime (`c.env.*`)                   | During request      | Secrets, environment-specific |

URLs that change per environment must be runtime variables.

### Issue 2: Missing Context Passing

In Cloudflare Workers, environment variables are accessed through the request context, not global variables:

```typescript
// WRONG: Global access (doesn't work in Workers)
const url = process.env.APP_URL;

// CORRECT: Context access
app.get("/auth", (c) => {
  const url = c.env.APP_URL;
});
```

If helper functions don't receive the context, they can't access runtime variables.

## Solution

### 1. Use Runtime Environment Variables

Configure in `wrangler.toml` for local development:

```toml
[vars]
APP_URL = "http://localhost:5173"
```

Set secrets for production:

```bash
wrangler secret put APP_URL
# Enter: https://myapp.com
```

### 2. Create a URL Helper with Fallback Chain

```typescript
// lib/url.ts
export function getBaseUrl(env?: { APP_URL?: string }): string {
  // 1. Runtime env (Workers)
  if (env?.APP_URL) {
    return env.APP_URL;
  }

  // 2. Client-side (browser)
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // 3. Build-time env (SSR/SSG)
  if (import.meta.env.VITE_APP_URL) {
    return import.meta.env.VITE_APP_URL;
  }

  // 4. Development fallback
  return "http://localhost:5173";
}
```

### 3. Pass Context to Helper Functions

```typescript
// WRONG: Helper doesn't receive env
function createAuth() {
  const baseUrl = getBaseUrl(); // No env, falls back to localhost
  return new Auth({ baseUrl });
}

// CORRECT: Pass env from request context
function createAuth(env: Env) {
  const baseUrl = getBaseUrl(env);
  return new Auth({ baseUrl });
}

// In route handler
app.use("/api/auth/*", (c) => {
  const auth = createAuth(c.env);
  return auth.handle(c.req.raw);
});
```

### 4. Use Factory Pattern for Services

For services that need environment configuration:

```typescript
// services/auth.ts
export function createAuthService(env: Env) {
  const baseUrl = getBaseUrl(env);

  return {
    getLoginUrl: () => `${baseUrl}/api/auth/login`,
    getCallbackUrl: () => `${baseUrl}/api/auth/callback`,
    // ...
  };
}

// In route
app.get("/login", (c) => {
  const auth = createAuthService(c.env);
  return c.redirect(auth.getLoginUrl());
});
```

## Workers Environment Variable Patterns

### Pattern 1: Request-Scoped Config

```typescript
// Create config per request
app.use("*", async (c, next) => {
  c.set("config", {
    baseUrl: getBaseUrl(c.env),
    apiVersion: c.env.API_VERSION ?? "v1",
  });
  await next();
});

// Access in handlers
app.get("/info", (c) => {
  const config = c.get("config");
  return c.json({ baseUrl: config.baseUrl });
});
```

### Pattern 2: Service Injection

```typescript
// Create services once per request
app.use("*", async (c, next) => {
  c.set("services", {
    auth: createAuthService(c.env),
    email: createEmailService(c.env),
  });
  await next();
});
```

### Pattern 3: Type-Safe Env

```typescript
// types/env.d.ts
interface Env {
  APP_URL: string;
  DATABASE_URL: string;
  AUTH_SECRET: string;
}

// Validated access
function requireEnv(env: Env, key: keyof Env): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
```

## Key Insight

**In Workers, environment-sensitive config must flow from request context, not from global/build-time constants.**

The mental model:

```
Traditional Node.js:
  process.env.URL -> Global, set at startup

Cloudflare Workers:
  c.env.URL -> Per-request, from bindings
```

## Environment Variable Checklist

| Variable                 | Build-time OK? | Runtime Required? |
| ------------------------ | -------------- | ----------------- |
| API keys/secrets         | No             | Yes               |
| Base URLs                | No             | Yes               |
| Feature flags            | Maybe          | Preferred         |
| Public config (logo URL) | Yes            | Optional          |
| Version numbers          | Yes            | Optional          |

## Verification

After deployment, verify URLs are correct:

```bash
# Check a URL-generating endpoint
curl https://myapp.com/api/auth/login-url
# Should return: {"url": "https://myapp.com/api/auth/login"}

# NOT: {"url": "http://localhost:5173/api/auth/login"}
```

## References

- [Cloudflare Workers Environment Variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)
- [Hono Context and Environment](https://hono.dev/api/context)
- [Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
