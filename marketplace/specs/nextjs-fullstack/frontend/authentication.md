# Frontend Authentication with better-auth

This document provides guidelines for implementing client-side authentication using better-auth in a Next.js React application.

## 1. Overview

better-auth provides a comprehensive authentication solution for React applications with:

- **Session Management**: Cookie-based sessions with automatic refresh
- **Multiple Auth Methods**: Password, magic link, OAuth, and passkeys
- **Type Safety**: Full TypeScript support with inferred types
- **Plugin Architecture**: Extensible through plugins (2FA, organizations, admin, etc.)

### Key Concepts

- **Auth Client**: The main interface for all authentication operations
- **Session Context**: React context for accessing session state across components
- **Middleware**: Server-side route protection before rendering

## 2. Auth Client Setup

### Creating the Auth Client

Create a centralized auth client that can be imported throughout your application:

```typescript
// packages/auth/client.ts
import {
  adminClient,
  inferAdditionalFields,
  magicLinkClient,
  organizationClient,
  passkeyClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from ".";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    magicLinkClient(),
    organizationClient(),
    adminClient(),
    passkeyClient(),
    twoFactorClient(),
  ],
});

export type AuthClientErrorCodes = typeof authClient.$ERROR_CODES & {
  INVALID_INVITATION: string;
};
```

### Configuration Options

The auth client supports various plugins based on your needs:

| Plugin | Purpose |
|--------|---------|
| `inferAdditionalFields` | Type inference for custom user fields |
| `magicLinkClient` | Passwordless email login |
| `organizationClient` | Multi-tenant organization support |
| `adminClient` | Admin user management |
| `passkeyClient` | WebAuthn/Passkey authentication |
| `twoFactorClient` | Two-factor authentication |

## 3. Session Hook/Context

### Session Context Definition

Define the session context type and create the context:

```typescript
// lib/session-context.ts
import type { Session } from "@your-app/auth"; // Replace with your monorepo package path
import React from "react";

export const SessionContext = React.createContext<
  | {
      session: Session["session"] | null;
      user: Session["user"] | null;
      loaded: boolean;
      reloadSession: () => Promise<void>;
    }
  | undefined
>(undefined);
```

### Session Provider Component

Wrap your application with a SessionProvider to manage session state:

```typescript
// components/SessionProvider.tsx
"use client";
import { authClient } from "@your-app/auth/client"; // Replace with your monorepo package path
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { SessionContext } from "../lib/session-context";

// Query key for session caching
export const sessionQueryKey = ["user", "session"] as const;

// Custom hook for fetching session
export const useSessionQuery = () => {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: async () => {
      const { data, error } = await authClient.getSession({
        query: {
          disableCookieCache: true,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to fetch session");
      }

      return data;
    },
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    retry: false,
  });
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: session } = useSessionQuery();
  const [loaded, setLoaded] = useState(!!session);

  useEffect(() => {
    if (session && !loaded) {
      setLoaded(true);
    }
  }, [session, loaded]);

  return (
    <SessionContext.Provider
      value={{
        loaded,
        session: session?.session ?? null,
        user: session?.user ?? null,
        reloadSession: async () => {
          const { data: newSession, error } = await authClient.getSession({
            query: {
              disableCookieCache: true,
            },
          });

          if (error) {
            throw new Error(error.message || "Failed to fetch session");
          }

          queryClient.setQueryData(sessionQueryKey, () => newSession);
        },
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
```

### useSession Hook

Create a convenient hook to access session data:

```typescript
// hooks/use-session.ts
import { useContext } from "react";
import { SessionContext } from "../lib/session-context";

export const useSession = () => {
  const sessionContext = useContext(SessionContext);

  if (sessionContext === undefined) {
    throw new Error("useSession must be used within SessionProvider");
  }

  return sessionContext;
};
```

### Usage Example

```typescript
function UserGreeting() {
  const { user, loaded } = useSession();

  if (!loaded) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in</div>;
  }

  return <div>Welcome, {user.name}!</div>;
}
```

## 4. Protected Routes

### Middleware for Route Protection

Use Next.js middleware to protect routes at the server level:

```typescript
// middleware.ts
import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { withQuery } from "ufo";

export default async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;
  const sessionCookie = getSessionCookie(req);

  // Protect /app routes
  if (pathname.startsWith("/app")) {
    if (!sessionCookie) {
      return NextResponse.redirect(
        new URL(
          withQuery("/auth/login", {
            redirectTo: pathname,
          }),
          origin,
        ),
      );
    }

    return NextResponse.next();
  }

  // Allow auth routes
  if (pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

### Client-Side Route Protection

For additional client-side protection, redirect authenticated users away from auth pages:

```typescript
"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/hooks/use-session";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loaded } = useSession();
  const redirectPath = "/app/dashboard";

  useEffect(() => {
    if (loaded && user) {
      router.replace(redirectPath);
    }
  }, [user, loaded, router]);

  if (!loaded) {
    return <LoadingSpinner />;
  }

  if (user) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
```

### Loading States

Always handle loading states to prevent flash of unauthorized content:

```typescript
function ProtectedContent() {
  const { user, loaded } = useSession();

  // Show loading while session is being fetched
  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  // Redirect or show unauthorized message
  if (!user) {
    return <Redirect to="/auth/login" />;
  }

  return <DashboardContent user={user} />;
}
```

## 5. Login/Logout Flows

### Email/Password Sign In

```typescript
"use client";
import { authClient } from "@your-app/auth/client"; // Replace with your monorepo package path
import { useRouter } from "next/navigation";

function LoginForm() {
  const router = useRouter();

  const onSubmit = async (values: { email: string; password: string }) => {
    try {
      const { data, error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });

      if (error) {
        throw error;
      }

      // Handle 2FA redirect if enabled
      if ((data as any).twoFactorRedirect) {
        router.replace("/auth/verify");
        return;
      }

      // Redirect to dashboard
      router.replace("/app/dashboard");
    } catch (e) {
      // Handle error
      console.error("Login failed:", e);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### Magic Link Sign In

```typescript
const signInWithMagicLink = async (email: string) => {
  const { error } = await authClient.signIn.magicLink({
    email,
    callbackURL: "/app/dashboard",
  });

  if (error) {
    throw error;
  }

  // Show success message - user will receive email
  showNotification("Check your email for the login link");
};
```

### OAuth Sign In

```typescript
"use client";
import { authClient } from "@your-app/auth/client"; // Replace with your monorepo package path

function SocialSigninButton({ provider }: { provider: string }) {
  const redirectPath = "/app/dashboard";

  const onSignin = () => {
    const callbackURL = new URL(redirectPath, window.location.origin);
    authClient.signIn.social({
      provider, // "google", "github", etc.
      callbackURL: callbackURL.toString(),
    });
  };

  return (
    <button onClick={onSignin}>
      Sign in with {provider}
    </button>
  );
}
```

### Passkey Sign In

```typescript
const signInWithPasskey = async () => {
  try {
    await authClient.signIn.passkey();
    router.replace("/app/dashboard");
  } catch (e) {
    console.error("Passkey authentication failed:", e);
  }
};
```

### Sign Out

```typescript
import { authClient } from "@your-app/auth/client"; // Replace with your monorepo package path

const onLogout = () => {
  authClient.signOut({
    fetchOptions: {
      onSuccess: async () => {
        // Redirect to home or login page
        window.location.href = new URL("/", window.location.origin).toString();
      },
    },
  });
};
```

## 6. User Profile

### Accessing Current User

Use the `useSession` hook to access user data:

```typescript
function UserProfile() {
  const { user, loaded } = useSession();

  if (!loaded || !user) {
    return null;
  }

  const { name, email, image } = user;

  return (
    <div className="flex items-center gap-2">
      <img src={image} alt={name} className="w-10 h-10 rounded-full" />
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-500">{email}</p>
      </div>
    </div>
  );
}
```

### Updating User Profile

```typescript
"use client";
import { authClient } from "@your-app/auth/client"; // Replace with your monorepo package path
import { useSession } from "@/hooks/use-session";

function ChangeNameForm() {
  const { user, reloadSession } = useSession();

  const onSubmit = async ({ name }: { name: string }) => {
    const { error } = await authClient.updateUser({
      name,
    });

    if (error) {
      showError("Failed to update name");
      return;
    }

    showSuccess("Name updated successfully");

    // Reload session to reflect changes
    await reloadSession();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        type="text"
        defaultValue={user?.name ?? ""}
        {...register("name")}
      />
      <button type="submit">Save</button>
    </form>
  );
}
```

### Updating Other Profile Fields

```typescript
// Update avatar
const updateAvatar = async (imageUrl: string) => {
  const { error } = await authClient.updateUser({
    image: imageUrl,
  });

  if (!error) {
    await reloadSession();
  }
};

// Update language preference (if custom field)
const updateLanguage = async (language: string) => {
  const { error } = await authClient.updateUser({
    language,
  });

  if (!error) {
    await reloadSession();
  }
};
```

## 7. Server-Side Session Access

For server components, access the session directly:

```typescript
// lib/server.ts
import "server-only";
import { auth } from "@your-app/auth"; // Replace with your monorepo package path
import { headers } from "next/headers";
import { cache } from "react";

export const getSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: {
      disableCookieCache: true,
    },
  });

  return session;
});

export const getActiveOrganization = cache(async (slug: string) => {
  try {
    const activeOrganization = await auth.api.getFullOrganization({
      query: {
        organizationSlug: slug,
      },
      headers: await headers(),
    });

    return activeOrganization;
  } catch {
    return null;
  }
});
```

### Usage in Server Components

```typescript
// app/(app)/dashboard/page.tsx
import { getSession } from "@/lib/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
    </div>
  );
}
```

## 8. Best Practices

### Always Check Session Before Protected Operations

```typescript
function DeleteAccountButton() {
  const { user, loaded } = useSession();

  const handleDelete = async () => {
    if (!loaded || !user) {
      showError("Not authenticated");
      return;
    }

    // Proceed with deletion
  };

  return (
    <button onClick={handleDelete} disabled={!loaded || !user}>
      Delete Account
    </button>
  );
}
```

### Handle Loading States Properly

```typescript
function AuthenticatedComponent() {
  const { user, loaded } = useSession();

  // Always handle loading state first
  if (!loaded) {
    return <Skeleton />;
  }

  // Then handle unauthenticated state
  if (!user) {
    return <LoginPrompt />;
  }

  // Finally render authenticated content
  return <ProtectedContent user={user} />;
}
```

### Proper Redirect After Auth

```typescript
function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const onLoginSuccess = () => {
    // Redirect to original destination or default
    const destination = redirectTo ?? "/app/dashboard";
    router.replace(destination);
  };
}
```

### Invalidate Session Cache After Auth Changes

```typescript
import { useQueryClient } from "@tanstack/react-query";

function AuthComponent() {
  const queryClient = useQueryClient();

  const onAuthChange = () => {
    // Invalidate session cache to trigger refetch
    queryClient.invalidateQueries({
      queryKey: sessionQueryKey,
    });
  };
}
```

### Error Handling

```typescript
const handleAuthError = (error: any) => {
  // Get error code from better-auth error
  const errorCode = error?.code;

  // Map to user-friendly message
  const errorMessages: Record<string, string> = {
    INVALID_CREDENTIALS: "Invalid email or password",
    USER_NOT_FOUND: "No account found with this email",
    EMAIL_NOT_VERIFIED: "Please verify your email first",
    TOO_MANY_REQUESTS: "Too many attempts. Please try again later",
  };

  const message = errorMessages[errorCode] ?? "An error occurred";
  showError(message);
};
```

### Security Considerations

1. **Never store sensitive auth data in localStorage** - better-auth uses secure HTTP-only cookies
2. **Always validate sessions server-side** - Middleware protection is essential
3. **Use HTTPS in production** - Required for secure cookies
4. **Implement CSRF protection** - better-auth handles this automatically
5. **Set appropriate session expiry** - Configure in server auth options

## 9. Common Patterns

### Conditional Rendering Based on Auth

```typescript
function Navigation() {
  const { user, loaded } = useSession();

  return (
    <nav>
      <Link href="/">Home</Link>
      {loaded && (
        <>
          {user ? (
            <>
              <Link href="/app/dashboard">Dashboard</Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/auth/login">Login</Link>
              <Link href="/auth/signup">Sign Up</Link>
            </>
          )}
        </>
      )}
    </nav>
  );
}
```

### Auth State Persistence Across Tabs

```typescript
// Session is automatically synced via cookies
// For real-time sync, listen to storage events
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === "auth-sync") {
      reloadSession();
    }
  };

  window.addEventListener("storage", handleStorageChange);
  return () => window.removeEventListener("storage", handleStorageChange);
}, []);
```

### Automatic Session Refresh

```typescript
// Configure in useSessionQuery
export const useSessionQuery = () => {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    refetchOnWindowFocus: true,
  });
};
```
