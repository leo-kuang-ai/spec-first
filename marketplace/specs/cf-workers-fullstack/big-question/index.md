# Common Issues and Solutions

> Documented pitfalls from building and deploying production Cloudflare Workers applications.
> These issues apply to any project running on the Workers runtime with Hono, Drizzle, and Vite.

## Severity Levels

| Level    | Description                                          |
| -------- | ---------------------------------------------------- |
| Critical | App crashes or fails to start                        |
| Warning  | Feature completely broken, data loss possible        |
| Info     | Degraded experience, workaround exists               |

---

## Issue Index

| Issue | Category | Severity |
| ----- | -------- | -------- |
| [Node.js Compatibility](./workers-nodejs-compat.md) | Runtime Compatibility | Critical |
| [Cross-Layer Contract](./cross-layer-contract.md) | Architecture | Warning |
| [System Constraints](./system-constraints.md) | System Design | Warning |
| [Environment Configuration](./env-configuration.md) | Configuration | Warning |
| [CSS Debugging Thinking Guide](./css-debugging-thinking-guide.md) | CSS/UI | Info |

---

## Quick Debugging Checklist

### App Crashes on Startup (Critical)

1. Check for `Cannot find module` or `node:*` errors -> See [workers-nodejs-compat.md](./workers-nodejs-compat.md)
2. Verify `compatibility_flags` includes `nodejs_compat`
3. Check `compatibility_date` is recent enough

### Data Not Syncing (Warning)

1. Is the data written to all required tables? -> See [cross-layer-contract.md](./cross-layer-contract.md)
2. Are cross-layer contracts documented and enforced?
3. Do end-to-end tests cover the full data flow?

### Wrong URLs in Production (Warning)

1. Are URLs using runtime environment variables? -> See [env-configuration.md](./env-configuration.md)
2. Is `c.env` being passed to helper functions?
3. Are secrets configured in Cloudflare Dashboard?

### Data Integrity Issues (Warning)

1. Are system constraints properly translated to code? -> See [system-constraints.md](./system-constraints.md)
2. Do queries use deterministic ordering?
3. Are uniqueness checks performed before writes?

### CSS/Styling Issues (Info)

1. Use `getComputedStyle()` to check actual values -> See [css-debugging-thinking-guide.md](./css-debugging-thinking-guide.md)
2. Check if CSS variables are in correct namespace (Tailwind v4: `--color-*`)
3. Verify background is not transparent (`rgba(0,0,0,0)`)

---

## Technology Stack Coverage

These pitfalls were discovered while building with:

- **Cloudflare Workers** (Wrangler v4+)
- **Hono** as web framework
- **Turso** (libSQL) for database
- **Drizzle ORM** for database abstraction
- **Vite** with `@cloudflare/vite-plugin`
- **TypeScript** throughout

Most issues apply to similar stacks (e.g., itty-router, D1, Prisma, etc.).

---

## How to Contribute

When you encounter a new pitfall:

1. Create a new `.md` file in this directory following the existing format:
   - **Problem** section describing the symptom
   - **Initial Attempts (All Failed)** showing common wrong approaches
   - **Root Cause** explaining why the issue occurs
   - **Solution** with concrete code examples
   - **Prevention Checklist** for future avoidance
2. Add an entry to the Issue Index table above with the appropriate category and severity
3. Add a corresponding entry to the Quick Debugging Checklist section
