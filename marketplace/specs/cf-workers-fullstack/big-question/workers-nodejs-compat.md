# Cloudflare Workers Node.js Compatibility

> **Severity**: P0 - App fails to start

## Problem

When integrating third-party libraries in a Cloudflare Workers project, the app fails with errors like:

```
SyntaxError: Named export 'xxx' not found
Failed to load url node:module
Failed to load url node:crypto
```

Development server crashes because the library depends on Node.js built-in modules that Workers doesn't support by default.

## Common Libraries Affected

- **Authentication**: Better Auth, Lucia Auth, Auth.js
- **Database**: Drizzle ORM, Prisma (edge adapter)
- **Utilities**: nanoid, uuid, bcrypt
- **HTTP**: undici, got
- Any library using `node:crypto`, `node:module`, `node:fs`, etc.

## Initial Attempts (All Failed)

### 1. Assume library works out of the box

```typescript
import { auth } from "better-auth";
// Error: Failed to load url node:module
```

**Why it fails**: Many modern TypeScript libraries use Node.js built-in modules internally. Workers runtime doesn't provide these by default.

### 2. Search for "Workers-compatible" alternatives

**Why it fails**: Often unnecessary. Cloudflare provides compatibility layers for most use cases.

### 3. Bundle with polyfills manually

```typescript
// vite.config.ts
resolve: {
  alias: {
    'node:crypto': 'crypto-browserify'
  }
}
```

**Why it fails**: Incomplete coverage, maintenance burden, and often introduces new issues.

## Root Cause

Cloudflare Workers uses the V8 JavaScript engine directly, without Node.js APIs. By default, Node.js built-in modules (`node:*`) are unavailable.

```
Library code: import crypto from 'node:crypto'
                    |
Workers runtime: "What is node:crypto? Never heard of it."
                    |
              CRASH
```

## Solution

### Step 1: Enable nodejs_compat Flag

In `wrangler.toml` or `wrangler.jsonc`:

```jsonc
{
  "compatibility_date": "2025-01-01",
  "compatibility_flags": ["nodejs_compat"],
}
```

Or in TOML format:

```toml
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]
```

### Step 2: Use Recent Compatibility Date

The `compatibility_date` determines which Workers runtime features are available:

```jsonc
{
  // Recommended: Use a recent date (within last 6 months)
  "compatibility_date": "2025-01-01",
}
```

### Step 3: Keep Tooling Updated

When using `@cloudflare/vite-plugin`, ensure it stays in sync with `wrangler`:

```bash
pnpm update @cloudflare/vite-plugin wrangler --latest
```

Version mismatches between these packages cause ESM/CJS compatibility issues.

## Why This Works

1. **`nodejs_compat`**: Tells the Workers runtime to provide polyfills for Node.js built-in modules. Most common APIs (`crypto`, `buffer`, `util`, etc.) are supported.

2. **Recent `compatibility_date`**: Ensures you get the latest polyfill implementations and bug fixes.

3. **Synced tooling versions**: The Vite plugin and Wrangler must agree on module resolution semantics.

## Compatibility Checklist for Third-Party Libraries

Before adding a new library:

1. **Check documentation** for Workers/Edge compatibility notes
2. **Search issues** for "cloudflare workers" or "edge runtime"
3. **Test in dev** with `pnpm dev` before deploying
4. **Review imports** - if it uses `node:*` modules, ensure `nodejs_compat` is enabled

## Key Insight

**Not all Node.js APIs are supported**, even with `nodejs_compat`:

| Supported     | Not Supported        |
| ------------- | -------------------- |
| `node:crypto` | `node:fs`            |
| `node:buffer` | `node:child_process` |
| `node:util`   | `node:net`           |
| `node:events` | `node:dns`           |
| `node:stream` | `node:cluster`       |

For filesystem operations, use Workers KV, R2, or Durable Objects instead.

## Verification

After enabling the flag, verify your app starts:

```bash
# Local development
pnpm dev

# Deploy preview
wrangler deploy --dry-run
```

Check the console for any remaining `node:*` errors.

## References

- [Cloudflare Workers Node.js Compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)
- [Compatibility Flags Documentation](https://developers.cloudflare.com/workers/configuration/compatibility-dates/)
- [Workers Runtime APIs](https://developers.cloudflare.com/workers/runtime-apis/)
