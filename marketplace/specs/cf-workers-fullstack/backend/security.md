# Security Patterns

> Authentication, token management, session handling, and secure patterns for Cloudflare Workers.

---

## Overview

This guide covers security patterns for Cloudflare Workers including:

- Token generation and hashing
- Session management
- OAuth security
- Authentication middleware

---

## Token Security

### Secure Token Generation

Use `crypto.getRandomValues()` for cryptographically secure random tokens:

```typescript
// src/lib/security.ts

/**
 * Generate secure random string
 * - Uses Web Crypto API (Cloudflare Workers compatible)
 * - Base62 encoding (a-z, A-Z, 0-9)
 * - 32 chars = ~190 bits entropy
 */
export function generateSecureCode(length = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}
```

**Important**: Call `crypto.getRandomValues()` inside request handlers, NOT in global scope.

### Token Hashing (SHA-256)

Never store raw tokens in database. Always hash them:

```typescript
/**
 * Hash token using SHA-256
 * - Original token returned to client
 * - Hash stored in database
 * - If database leaks, attacker cannot use tokens
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
```

### Timing-Safe Comparison

Prevent timing attacks when verifying tokens:

```typescript
/**
 * Timing-safe string comparison
 * Execution time is constant regardless of where mismatch occurs
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function verifyToken(
  token: string,
  hash: string,
): Promise<boolean> {
  const tokenHash = await hashToken(token);
  return timingSafeEqual(tokenHash, hash);
}
```

---

## Session Management

### Session Table Schema

Include device tracking fields for session management:

```typescript
export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  token: text("token").notNull(), // Store HASH, not raw token
  userId: text("userId").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  // Device tracking
  deviceType: text("deviceType"), // 'desktop' | 'web' | 'mobile'
  deviceId: text("deviceId"), // Unique device identifier
  appVersion: text("appVersion"), // Client version
  // Context
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
});
```

### Session Cleanup Strategy

Prevent session table bloat with cleanup on new session creation:

```typescript
async function cleanupSessions(
  db: Database,
  userId: string,
  deviceId: string | undefined,
  deviceType: string,
  logger: RequestLogger,
): Promise<void> {
  const now = new Date();

  // 1. Clean expired sessions
  await db
    .delete(schema.session)
    .where(
      and(
        eq(schema.session.userId, userId),
        eq(schema.session.deviceType, deviceType),
        lt(schema.session.expiresAt, now),
      ),
    );

  // 2. Same-device replacement (if deviceId provided)
  if (deviceId) {
    await db
      .delete(schema.session)
      .where(
        and(
          eq(schema.session.userId, userId),
          eq(schema.session.deviceType, deviceType),
          eq(schema.session.deviceId, deviceId),
        ),
      );
  }

  // 3. Limit max sessions per user (e.g., 10)
  const MAX_SESSIONS = 10;
  const existingSessions = await db.query.session.findMany({
    where: and(
      eq(schema.session.userId, userId),
      eq(schema.session.deviceType, deviceType),
      gt(schema.session.expiresAt, now),
    ),
    orderBy: [desc(schema.session.createdAt)],
    columns: { id: true },
  });

  if (existingSessions.length >= MAX_SESSIONS) {
    const toDelete = existingSessions.slice(MAX_SESSIONS - 1);
    for (const session of toDelete) {
      await db.delete(schema.session).where(eq(schema.session.id, session.id));
    }
  }
}
```

---

## OAuth Security

### Redirect URI Validation

Whitelist-based validation for OAuth redirect URIs:

```typescript
const ALLOWED_REDIRECT_URIS = [
  "yourapp://auth/callback",
  "yourapp://auth-complete",
];

/**
 * Normalize custom protocol URI for comparison
 * Note: yourapp://auth/callback parses as host="auth", pathname="/callback"
 */
function normalizeCustomUri(url: URL): string {
  return `${url.protocol}//${url.host}${url.pathname}`;
}

export function isValidRedirectUri(uri: string): boolean {
  try {
    const url = new URL(uri);

    // Must be your custom protocol
    if (url.protocol !== "yourapp:") {
      return false;
    }

    const normalizedUri = normalizeCustomUri(url);

    return ALLOWED_REDIRECT_URIS.some((allowed) => {
      const allowedUrl = new URL(allowed);
      return normalizedUri === normalizeCustomUri(allowedUrl);
    });
  } catch {
    return false;
  }
}
```

**Common Pitfall**: Custom protocol URLs like `yourapp://auth/callback` parse with:

- `host = "auth"`
- `pathname = "/callback"`

This is different from what you might expect!

### One-Time Code Pattern (Desktop/Mobile OAuth)

For OAuth flows where the client cannot receive cookies:

```typescript
// 1. After successful login, generate one-time code
const code = generateSecureCode();
await db.insert(loginCode).values({
  code,
  userId: user.id,
  redirectUri,
  expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
});

// 2. Client exchanges code for token (with optimistic locking)
const updateResult = await db
  .update(loginCode)
  .set({ usedAt: new Date() })
  .where(
    and(
      eq(loginCode.id, codeRecord.id),
      isNull(loginCode.usedAt), // Optimistic lock
    ),
  );

if (updateResult.rowsAffected === 0) {
  throw new HTTPException(401, { message: "Code already used" });
}

// 3. Create session with hashed token
const sessionToken = generateSecureCode();
const sessionTokenHash = await hashToken(sessionToken);

await db.insert(session).values({
  token: sessionTokenHash, // Store hash
  userId: codeRecord.userId,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  deviceType: "desktop",
});

// Return raw token to client
return c.json({ accessToken: sessionToken });
```

---

## Authentication Middleware

### Basic Auth Middleware Pattern

```typescript
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types";
import { HTTPException } from "hono/http-exception";

export const requireSession = (): MiddlewareHandler<AppEnv> => {
  return async (c, next) => {
    const logger = c.get("logger");

    // Check cookie session first (web)
    const cookieSession = await getCookieSession(c);
    if (cookieSession) {
      c.set("session", cookieSession.session);
      c.set("user", cookieSession.user);
      logger.setContext({ userId: cookieSession.user.id });
      return next();
    }

    // Check bearer token (desktop/mobile)
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const tokenSession = await getTokenSession(c.env, token);

      if (tokenSession) {
        c.set("session", tokenSession.session);
        c.set("user", tokenSession.user);
        logger.setContext({ userId: tokenSession.user.id });
        return next();
      }
    }

    logger.warn("unauthorized_access");
    throw new HTTPException(401, { message: "Unauthorized" });
  };
};

export const optionalSession = (): MiddlewareHandler<AppEnv> => {
  return async (c, next) => {
    // Same logic but don't throw on failure
    try {
      // ... authentication logic
    } catch {
      // Continue without session
    }
    return next();
  };
};
```

### Middleware Selection Guide

| Middleware          | Cookie (Web) | Bearer Token (Desktop) | Use Case                       |
| ------------------- | ------------ | ---------------------- | ------------------------------ |
| `requireSession()`  | Yes          | Yes                    | User-facing APIs               |
| `optionalSession()` | Yes          | Yes                    | Public APIs with optional auth |

**Use `requireSession()` for:**

- User-facing APIs (workspaces, docs, etc.)
- APIs that require authentication

```typescript
// src/routes/workspaces/router.ts
import { requireSession } from "../../middleware/auth";

const app = new Hono<AppEnv>();
app.use("*", requireSession());
```

---

## API Key Pattern (Optional)

If your application needs API keys for third-party integrations:

### API Key Format

API Keys use a distinctive prefix for easy identification:

```
pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
|  └─────────────────────────────────── 32 random chars
└──────────────────────────────────────── "pk_" prefix (Project Key)
```

The middleware can detect the prefix in Bearer tokens and route to API Key validation.

### API Key Table Schema

```typescript
export const apiKey = sqliteTable("api_key", {
  id: text("id").primaryKey(),
  keyHash: text("key_hash").notNull(), // Store hash only
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
```

---

## Security Checklist

**Token Handling:**

- [ ] Generate tokens with `crypto.getRandomValues()`
- [ ] Hash tokens with SHA-256 before storing
- [ ] Use timing-safe comparison for verification
- [ ] Never log raw tokens

**Session Management:**

- [ ] Set reasonable expiration (e.g., 30 days for desktop)
- [ ] Track device type and ID
- [ ] Clean up expired sessions
- [ ] Limit max sessions per user
- [ ] Support same-device replacement

**OAuth Security:**

- [ ] Whitelist-based redirect URI validation
- [ ] One-time codes for token exchange
- [ ] Optimistic locking to prevent code reuse
- [ ] Short expiration for exchange codes (5 min)

**General:**

- [ ] Use HTTPS in production
- [ ] Set secure cookie flags (Secure, HttpOnly, SameSite)
- [ ] Validate all user input
- [ ] Rate limit authentication endpoints
- [ ] Log authentication events (success and failure)

---

## Authentication Libraries

For production applications, consider using established authentication libraries:

- **Better Auth** - TypeScript-first authentication framework
- **Lucia** - Lightweight auth library
- **Auth.js** - OAuth provider support

These libraries handle many security concerns automatically.

## Reference

- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [OWASP Session Management](https://owasp.org/www-project-cheat-sheets/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
