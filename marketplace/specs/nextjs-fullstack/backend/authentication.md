# Authentication Guidelines

This document covers backend authentication integration using better-auth, including session management, protected procedures, and OAuth configuration.

## 1. Overview

### What is better-auth

better-auth is a modern authentication library for TypeScript applications that provides:

- Session-based authentication with secure cookie management
- Multiple authentication methods (email/password, OAuth, magic links, passkeys)
- Built-in support for organizations and multi-tenancy
- Database adapter integration (Drizzle ORM)
- Two-factor authentication (2FA)
- Admin functionality

### Session-based Authentication

The authentication system uses secure, HTTP-only cookies to manage user sessions:

- Sessions are stored in the database and cached in Redis for performance
- Session tokens are automatically validated on each request
- Cookie names are prefixed with `__Secure-` in production (HTTPS)

### Supported Providers

| Provider | Type | Description |
|----------|------|-------------|
| Email/Password | Credential | Traditional email and password authentication |
| Google | OAuth | Social login with Google account |
| GitHub | OAuth | Social login with GitHub account |
| Magic Link | Passwordless | Email-based one-time login links |
| Passkey | Passwordless | WebAuthn/FIDO2 biometric authentication |

## 2. Auth Configuration

### Server-side Auth Setup

The auth configuration is defined in the auth package:

```typescript
// packages/auth/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@your-app/database";
import {
  admin,
  magicLink,
  organization,
  passkey,
  twoFactor,
  username,
} from "better-auth/plugins";

export const auth = betterAuth({
  baseURL: process.env.APP_URL,
  appName: "Your App Name",

  // Database adapter
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    freshAge: 0,
  },

  // Account linking for OAuth providers
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },

  // Plugins
  plugins: [
    username(),
    admin(),
    passkey(),
    magicLink({
      sendMagicLink: async ({ email, url }, request) => {
        // Send magic link email
        await sendEmail({
          to: email,
          templateId: "magicLink",
          context: { url },
        });
      },
    }),
    organization({
      sendInvitationEmail: async ({ email, id, organization }, request) => {
        // Send organization invitation email
      },
    }),
    twoFactor(),
  ],
});

// Export session type
export type Session = typeof auth.$Infer.Session;
```

### Database Adapter (Drizzle)

better-auth uses Drizzle ORM for database operations. The required tables are automatically created:

- `user` - User accounts
- `session` - Authentication sessions
- `account` - OAuth provider accounts (Google, GitHub, etc.)
- `verification` - Email verification tokens

### Session Configuration

```typescript
session: {
  // Session lifetime (default: 7 days)
  expiresIn: 60 * 60 * 24 * 7,

  // Fresh session age for sensitive operations (0 = always require re-auth)
  freshAge: 0,
}
```

## 3. Protected Procedures

### Procedure Types

The API layer provides three procedure types with different authentication levels:

```typescript
// packages/api/orpc/procedures.ts
import { ORPCError, os } from "@orpc/server";

// Public procedure - no authentication required
export const publicProcedure = os
  .$context<{ headers: Headers }>()
  .use(logIdMiddleware);

// Protected procedure - requires authenticated user
export const protectedProcedure = publicProcedure.use(
  async ({ context, next }) => {
    const { session } = await getSessionWithCache(context.headers);

    if (!session) {
      throw new ORPCError("UNAUTHORIZED");
    }

    return await next({
      context: {
        session: session.session,
        user: session.user,
      },
    });
  },
);

// Admin procedure - requires admin role
export const adminProcedure = protectedProcedure.use(
  async ({ context, next }) => {
    if (context.user.role !== "admin") {
      throw new ORPCError("FORBIDDEN");
    }

    return await next();
  },
);
```

### Using Protected Procedures

**Basic protected endpoint:**

```typescript
// procedures/get-profile.ts
import { protectedProcedure } from "../../../orpc/procedures";

export const getProfile = protectedProcedure
  .route({
    method: "GET",
    path: "/users/profile",
    tags: ["Users"],
    summary: "Get current user profile",
  })
  .handler(async ({ context }) => {
    // Access authenticated user from context
    const { user, session } = context;

    return {
      success: true,
      reason: "Profile retrieved",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  });
```

**Admin-only endpoint:**

```typescript
// procedures/list-users.ts
import { adminProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const listUsers = adminProcedure
  .route({
    method: "GET",
    path: "/admin/users",
    tags: ["Administration"],
    summary: "List all users",
  })
  .input(
    z.object({
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
    }),
  )
  .handler(async ({ input: { limit, offset } }) => {
    const users = await getUsers({ limit, offset });
    return { users };
  });
```

### Accessing User Session in Context

The protected procedure middleware injects session data into the context:

```typescript
interface ProtectedContext {
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    // ... other session fields
  };
  user: {
    id: string;
    email: string;
    name: string;
    role: "user" | "admin";
    // ... other user fields
  };
}
```

**Accessing context in handlers:**

```typescript
.handler(async ({ context, input }) => {
  const { user, session } = context;

  // Use user.id for database queries
  const userOrders = await getOrdersByUserId(user.id);

  // Check user role
  if (user.role === "admin") {
    // Admin-specific logic
  }

  return { success: true, reason: "Success", orders: userOrders };
});
```

### Role-based Access Control

**Custom role middleware:**

```typescript
// Create a middleware for specific roles
const organizationAdminProcedure = protectedProcedure.use(
  async ({ context, input, next }) => {
    const { organizationId } = input as { organizationId: string };

    const membership = await getOrganizationMembership(
      organizationId,
      context.user.id
    );

    if (!membership || membership.role !== "owner") {
      throw new ORPCError("FORBIDDEN", {
        message: "Organization admin access required",
      });
    }

    return await next({
      context: {
        ...context,
        organization: membership.organization,
      },
    });
  },
);
```

**Verifying organization membership:**

```typescript
// lib/membership.ts
import { getOrganizationMembership } from "@your-app/database";

export async function verifyOrganizationMembership(
  organizationId: string,
  userId: string,
) {
  const membership = await getOrganizationMembership(organizationId, userId);

  if (!membership) {
    return null;
  }

  return {
    organization: membership.organization,
    role: membership.role,
  };
}
```

## 4. Session Management

### Session Caching

Sessions are cached in Redis to reduce database load:

```typescript
// lib/session-cache.ts
import { auth } from "@your-app/auth";
import { redis } from "./redis";

const SESSION_CACHE_PREFIX = "session";
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

export async function getSessionWithCache(
  headers: Headers,
): Promise<{ session: Session | null; fromCache: boolean }> {
  const sessionToken = getSessionTokenFromHeaders(headers);

  if (!sessionToken) {
    const fresh = await fetchSession(headers);
    return { session: fresh, fromCache: false };
  }

  // Try cache first
  const cached = await redis.get(`${SESSION_CACHE_PREFIX}:${sessionToken}`);
  if (cached) {
    return { session: JSON.parse(cached), fromCache: true };
  }

  // Fetch from database
  const fresh = await auth.api.getSession({ headers });

  if (fresh) {
    // Cache the session
    await redis.set(
      `${SESSION_CACHE_PREFIX}:${sessionToken}`,
      JSON.stringify(fresh),
      { ex: SESSION_TTL }
    );
  }

  return { session: fresh, fromCache: false };
}
```

### Getting Session Token from Headers

```typescript
export function getSessionTokenFromHeaders(headers: Headers): string | null {
  // Check Authorization header first
  const authHeader = headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }

  // Fall back to cookie
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  const cookies = parseCookie(cookieHeader);
  const cookieName = process.env.NODE_ENV === "production"
    ? "__Secure-better-auth.session_token"
    : "better-auth.session_token";

  return cookies[cookieName] ?? null;
}
```

### Session Invalidation

```typescript
// Delete session cache on logout or session change
export async function deleteSessionCache(sessionToken: string): Promise<void> {
  await redis.del(`${SESSION_CACHE_PREFIX}:${sessionToken}`);
}
```

## 5. OAuth Integration

### Google OAuth Setup

**Configuration:**

```typescript
// auth.ts
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    scope: [
      "email",
      "profile",
      "openid",
      // Add additional scopes as needed
      // "https://www.googleapis.com/auth/calendar",
    ],
    // Get refresh token for offline access
    accessType: "offline",
    prompt: "consent",
  },
},
```

**Environment variables:**

```bash
# .env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### GitHub OAuth Setup

```typescript
socialProviders: {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID as string,
    clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    scope: ["user:email"],
  },
},
```

### Accessing OAuth Tokens

To access stored OAuth tokens for API calls:

```typescript
import { db } from "@your-app/database";
import { account } from "@your-app/database/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function getOAuthToken(userId: string, provider: string) {
  const accountRecord = await db.query.account.findFirst({
    where: and(
      eq(account.userId, userId),
      eq(account.providerId, provider)
    ),
  });

  if (!accountRecord) {
    return null;
  }

  return {
    accessToken: accountRecord.accessToken,
    refreshToken: accountRecord.refreshToken,
    expiresAt: accountRecord.accessTokenExpiresAt,
  };
}
```

### Token Refresh

better-auth handles token refresh automatically. For manual refresh:

```typescript
import { auth } from "@your-app/auth";

export async function refreshOAuthToken(userId: string, provider: string) {
  // Use auth API to refresh token
  const result = await auth.api.refreshAccessToken({
    userId,
    providerId: provider,
  });

  return result;
}
```

## 6. Error Handling

### Standard Auth Errors

Use oRPC error codes for authentication failures:

```typescript
import { ORPCError } from "@orpc/server";

// User not authenticated
throw new ORPCError("UNAUTHORIZED");

// User authenticated but lacks permission
throw new ORPCError("FORBIDDEN", {
  message: "Admin access required",
});

// Session expired
throw new ORPCError("UNAUTHORIZED", {
  message: "Session expired, please login again",
});
```

### Error Response Pattern

```typescript
// Consistent error response structure
export const authErrorSchema = z.object({
  success: z.literal(false),
  reason: z.string(),
  code: z.enum(["UNAUTHORIZED", "FORBIDDEN", "SESSION_EXPIRED"]).optional(),
});

// In handler
if (!hasPermission) {
  return {
    success: false,
    reason: "You do not have permission to perform this action",
    code: "FORBIDDEN",
  };
}
```

### Handling Session Expiration

```typescript
// Graceful session expiration handling
export async function handleSessionExpiration(sessionToken: string) {
  // Clear cache
  await deleteSessionCache(sessionToken);

  // Log the event
  logger.info("Session expired", { sessionToken: sessionToken.slice(0, 10) });

  throw new ORPCError("UNAUTHORIZED", {
    message: "Your session has expired. Please login again.",
  });
}
```

## 7. Best Practices

### Always Validate Session in Protected Routes

```typescript
// GOOD - Use protectedProcedure for authenticated endpoints
export const updateProfile = protectedProcedure
  .route({ method: "PATCH", path: "/users/profile" })
  .handler(async ({ context }) => {
    // context.user is guaranteed to exist
  });

// BAD - Manual session check in public procedure
export const updateProfile = publicProcedure
  .handler(async ({ context }) => {
    const session = await getSession(context.headers);
    if (!session) throw new ORPCError("UNAUTHORIZED");
    // Error-prone and inconsistent
  });
```

### Use Middleware for Reusable Auth Checks

```typescript
// Create reusable middleware for common patterns
const withOrganization = async ({ context, input, next }) => {
  const { organizationId } = input;

  const membership = await verifyOrganizationMembership(
    organizationId,
    context.user.id
  );

  if (!membership) {
    throw new ORPCError("FORBIDDEN", {
      message: "Not a member of this organization",
    });
  }

  return next({
    context: { ...context, organization: membership.organization },
  });
};

// Use in procedures
export const getOrganizationData = protectedProcedure
  .use(withOrganization)
  .handler(async ({ context }) => {
    // context.organization is now available
  });
```

### Proper Error Responses

```typescript
// Always return meaningful error messages
.handler(async ({ context, input }) => {
  try {
    const result = await performAction(input);
    return { success: true, reason: "Action completed", data: result };
  } catch (error) {
    if (error instanceof ORPCError) {
      throw error; // Re-throw oRPC errors
    }

    logger.error("Action failed", { error, userId: context.user.id });

    return {
      success: false,
      reason: "An unexpected error occurred",
    };
  }
});
```

### Secure Session Token Handling

```typescript
// Never log full session tokens
logger.info("Session validated", {
  sessionToken: `${token.substring(0, 10)}...`,
  userId: session.user.id,
});

// Clear sensitive data from responses
const sanitizedUser = {
  id: user.id,
  email: user.email,
  name: user.name,
  // Don't include: passwordHash, sessionTokens, etc.
};
```

### Cache Invalidation on Auth Events

```typescript
// In auth hooks
hooks: {
  after: createAuthMiddleware(async (ctx) => {
    if (ctx.path.startsWith("/sign-out")) {
      const sessionToken = getSessionTokenFromHeaders(ctx.headers);
      if (sessionToken) {
        await deleteSessionCache(sessionToken);
      }
    }
  }),
}
```

## Client-side Auth Usage

For client-side authentication, use the auth client:

```typescript
// packages/auth/client.ts
import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  magicLinkClient,
  organizationClient,
  passkeyClient,
  twoFactorClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    magicLinkClient(),
    organizationClient(),
    adminClient(),
    passkeyClient(),
    twoFactorClient(),
  ],
});
```

**Usage in React components:**

```typescript
import { authClient } from "@your-app/auth/client";

// Sign in
await authClient.signIn.email({
  email: "user@example.com",
  password: "password",
});

// Sign out
await authClient.signOut();

// Get current session
const session = await authClient.getSession();

// Use hooks
const { data: session, isPending } = authClient.useSession();
```

## Quick Reference

| Task | Solution |
|------|----------|
| Require authentication | Use `protectedProcedure` |
| Require admin role | Use `adminProcedure` |
| Get current user | Access `context.user` in handler |
| Get session data | Access `context.session` in handler |
| Check organization membership | Use `verifyOrganizationMembership` helper |
| Throw auth error | `throw new ORPCError("UNAUTHORIZED")` |
| Throw permission error | `throw new ORPCError("FORBIDDEN")` |
