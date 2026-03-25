# Authentication (Better Auth)

> Complete guide for Better Auth integration in React Router.

---

## Recommended Package

> Better Auth UI is the recommended solution for authentication interfaces in this stack. Use a recent stable release that supports SSR and CSS exports.

| Package | Notes |
|---------|-------|
| `@daveyplate/better-auth-ui` | v3.x API with SSR fixes, CSS export (recommended) |
| `better-auth` | Backend authentication |

**Why v3.x?**
- v1.x has no CSS export (`"./css"` not exported error)
- v3.x uses UPPERCASE view names (`SIGN_IN` not `sign-in`)
- v3.x uses `AuthView` instead of deprecated `AuthCard`

---

## 5. Authentication (Better Auth UI)

### Overview

This guide covers **Better Auth UI** (`@daveyplate/better-auth-ui`) for authentication interfaces. Better Auth UI provides pre-built shadcn/ui components that integrate with the Better Auth backend.

**Key Dependencies:**

- `@daveyplate/better-auth-ui` - UI components (v3.x recommended)
- `better-auth` - Backend authentication (Hono)
- `shadcn/ui` - Component library
- `TailwindCSS` - Styling

@@@section:auth-provider-setup

### Provider Setup

**REQUIRED:** Wrap your app with `<AuthUIProvider />` at the root level.

**CRITICAL SSR Pattern:** Use `isMounted` to prevent hydration errors.

```tsx
import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import "@daveyplate/better-auth-ui/css"; // Required CSS import
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // SSR-safe: Only render auth UI after client hydration
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR or before hydration, render children without auth context
  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={(path) => navigate(path)}
      replace={(path) => navigate(path, { replace: true })}
      onSessionChange={() => {
        // Refresh or invalidate queries if needed
      }}
      // v3.x: Use UPPERCASE view names
      viewPaths={{
        SIGN_IN: "login",
        SIGN_UP: "register",
        FORGOT_PASSWORD: "forgot-password",
        RESET_PASSWORD: "reset-password",
        SIGN_OUT: "logout",
      }}
      // Social providers configuration
      social={{
        providers: ["google"],
      }}
      // Image component for Cloudflare Workers (no Next.js Image)
      avatar={{
        Image: ({ src, alt, ...props }) => (
          <img src={src as string} alt={alt} {...props} />
        ),
      }}
    >
      {children}
    </AuthUIProvider>
  );
}
```

**Why `isMounted` Pattern?**

Better Auth UI components use React hooks that fail during SSR:
- `useContext` returns null during server render
- `useSession` throws "Cannot read properties of null"
- Components render differently between server and client

The `isMounted` pattern ensures auth UI only renders after client-side hydration.

**Provider Configuration Options:**

```tsx
<AuthUIProvider
  // Required
  authClient={authClient}
  navigate={navigate}

  // Optional - Features
  social={{ providers: ['google', 'github'] }}
  multiSession={false}
  magicLink={true}
  passkey={false}
  twoFactor={['otp', 'totp']}

  // Optional - UI Customization (v3.x uses UPPERCASE)
  viewPaths={{
    SIGN_IN: 'login',
    SIGN_UP: 'register',
    FORGOT_PASSWORD: 'forgot'
  }}

  // Optional - Avatar Management
  avatar={{
    upload: async (file) => uploadToStorage(file),
    delete: async (url) => deleteFromStorage(url),
    // Required for Cloudflare Workers (no Next.js Image)
    Image: ({ src, alt, ...props }) => <img src={src as string} alt={alt} {...props} />,
  }}

  // Optional - Localization
  localization={{
    SIGN_IN: 'Log in',
    SIGN_UP: 'Create Account',
    EMAIL_PLACEHOLDER: 'your-email@example.com'
  }}
  localizeErrors={false} // Use backend error messages
>
```

@@@/section:auth-provider-setup

@@@section:ssr-patterns

### SSR-Safe Component Patterns

**CRITICAL:** All components using Better Auth UI hooks MUST use the `isMounted` pattern.

#### Auth Page Pattern (Login, Register, etc.)

```tsx
// app/routes/auth/login.tsx
import { AuthView } from "@daveyplate/better-auth-ui";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Loading skeleton during SSR
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-4 p-6">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      {/* v3.x: Use view="SIGN_IN" (UPPERCASE), not pathname="login" */}
      <AuthView view="SIGN_IN" />
    </div>
  );
}
```

#### UserButton Pattern

```tsx
// app/components/user-button.tsx
import { UserButton as BetterAuthUserButton } from "@daveyplate/better-auth-ui";
import { useSession } from "@daveyplate/better-auth-ui";
import { Link } from "react-router";
import { useState, useEffect } from "react";

export function UserButton() {
  const [isMounted, setIsMounted] = useState(false);
  const { data: session, isPending } = useSession();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // SSR or loading: show placeholder
  if (!isMounted || isPending) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  // Not logged in: show sign in link
  if (!session) {
    return (
      <Link
        to="/login"
        className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
      >
        Sign In
      </Link>
    );
  }

  // Logged in: show user button
  return <BetterAuthUserButton />;
}
```

@@@/section:ssr-patterns

@@@section:auth-components

### Core Components

#### Authentication Views (v3.x API)

**IMPORTANT:** v3.x uses `view` prop with UPPERCASE values, not `pathname`.

```tsx
import { AuthView } from "@daveyplate/better-auth-ui";

// Sign In page - v3.x uses UPPERCASE
function SignInPage() {
  return <AuthView view="SIGN_IN" />;
}

// Sign Up page
function SignUpPage() {
  return <AuthView view="SIGN_UP" />;
}

// Forgot Password page
function ForgotPasswordPage() {
  return <AuthView view="FORGOT_PASSWORD" />;
}

// Reset Password page
function ResetPasswordPage() {
  return <AuthView view="RESET_PASSWORD" />;
}
```

**v3.x View Names:**
| v1.x (deprecated) | v3.x (current) |
|-------------------|----------------|
| `sign-in` | `SIGN_IN` |
| `sign-up` | `SIGN_UP` |
| `forgot-password` | `FORGOT_PASSWORD` |
| `reset-password` | `RESET_PASSWORD` |

#### Protected Routes Pattern

**REQUIRED:** Use the three-component pattern for protected routes:

```tsx
import {
  AuthLoading,
  RedirectToSignIn,
  SignedIn,
} from "@daveyplate/better-auth-ui";

function ProtectedPage() {
  return (
    <>
      {/* Show loading skeleton while checking auth */}
      <AuthLoading>
        <div className="animate-pulse">Loading...</div>
      </AuthLoading>

      {/* Redirect to sign in if not authenticated */}
      <RedirectToSignIn />

      {/* Only render content if authenticated */}
      <SignedIn>
        <YourProtectedContent />
      </SignedIn>
    </>
  );
}
```

#### User Interface Components

```tsx
import { UserButton, UserAvatar } from "@daveyplate/better-auth-ui";

// User dropdown menu with profile options
function Header() {
  return (
    <header>
      <UserButton />
    </header>
  );
}

// Just the avatar
function Sidebar() {
  return <UserAvatar />;
}
```

#### Account Settings

```tsx
import {
  AccountSettingsCards,
  SecuritySettingsCards,
  SettingsCards,
} from "@daveyplate/better-auth-ui";

// All account settings
function SettingsPage() {
  return <SettingsCards />;
}

// Or use individual card groups
function ProfilePage() {
  return <AccountSettingsCards />;
}

function SecurityPage() {
  return <SecuritySettingsCards />;
}
```

**Individual Setting Cards:**

```tsx
import {
  UpdateAvatarCard,
  UpdateNameCard,
  ChangeEmailCard,
  ChangePasswordCard,
} from "@daveyplate/better-auth-ui";

// Compose your own settings layout
function CustomSettings() {
  return (
    <>
      <UpdateAvatarCard />
      <UpdateNameCard />
      <ChangeEmailCard />
      <ChangePasswordCard />
    </>
  );
}
```

@@@/section:auth-components

@@@section:tailwind-v4

### Tailwind CSS v4 Gotchas

**CRITICAL:** Tailwind v4 has breaking changes with CSS variables.

#### Problem: `@apply` with CSS Variable Names

```css
/* FAILS in Tailwind v4 */
@layer base {
  body {
    @apply bg-background text-foreground;
  }
}
/* Error: Cannot apply unknown utility class: bg-background */
```

#### Solution: Use Bracket Syntax or Plain CSS

```css
/* Option 1: Bracket syntax */
@layer base {
  * {
    @apply border-[hsl(var(--border))];
  }
  body {
    @apply bg-[hsl(var(--background))] text-[hsl(var(--foreground))];
  }
}

/* Option 2: Plain CSS (recommended) */
@layer base {
  * {
    border-color: hsl(var(--border));
  }
  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
  }
}
```

@@@/section:tailwind-v4

@@@section:auth-custom-fields

### Custom Fields

Define additional fields for signup or settings:

```tsx
<AuthUIProvider
  additionalFields={{
    age: {
      label: "Age",
      placeholder: "Your age",
      required: true,
      type: "number",
      validate: (value) => {
        const age = parseInt(value);
        if (age < 18) return "Must be 18 or older";
        return true;
      },
    },
    company: {
      label: "Company",
      placeholder: "Your company name",
      required: false,
      type: "text",
    },
  }}
  // Show fields in account settings
  account={{
    fields: ["age", "company"],
  }}
/>
```

**Field Types:**

- `text` - Single line text
- `email` - Email input
- `password` - Password input
- `number` - Numeric input
- `tel` - Phone number
- `url` - URL input

@@@/section:auth-custom-fields

@@@section:auth-routing

### React Router Integration

**Route Configuration Example:**

```tsx
import { createBrowserRouter } from "react-router-dom";
import {
  AuthView,
  SignedIn,
  RedirectToSignIn,
} from "@daveyplate/better-auth-ui";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <AuthView view="SIGN_IN" />,  // v3.x: UPPERCASE
  },
  {
    path: "/register",
    element: <AuthView view="SIGN_UP" />,  // v3.x: UPPERCASE
  },
  {
    path: "/forgot-password",
    element: <AuthView view="FORGOT_PASSWORD" />,  // v3.x: UPPERCASE
  },
  {
    path: "/dashboard",
    element: (
      <>
        <RedirectToSignIn />
        <SignedIn>
          <Dashboard />
        </SignedIn>
      </>
    ),
  },
]);
```

**Custom Path Configuration:**

```tsx
<AuthUIProvider
  viewPaths={{
    SIGN_IN: "login",           // /login instead of /sign-in
    SIGN_UP: "register",        // /register instead of /sign-up
    FORGOT_PASSWORD: "forgot",  // /forgot instead of /forgot-password
  }}
  account={{
    basePath: "/settings",      // Account settings base path
    viewPaths: {
      PROFILE: "profile",
      SECURITY: "security",
    },
  }}
/>
```

@@@/section:auth-routing

@@@section:auth-cloudflare

### Cloudflare Workers Considerations

#### Static Asset Handling

Since the frontend is bundled as static assets in Workers:

**DO:**

- Use `authClient` from your Hono backend routes
- Configure CORS properly for API endpoints
- Use environment variables for auth configuration

```tsx
// lib/auth-client.ts
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "/",
});
```

**DON'T:**

- Don't use Next.js-specific features (server components, API routes)
- Don't rely on server-side rendering for auth state
- Don't use Next.js Image component (use regular `<img>` or custom solution)

#### Image Component Override

Better Auth UI expects an Image component. For Cloudflare Workers:

```tsx
<AuthUIProvider
  avatar={{
    Image: ({ src, alt, ...props }) => <img src={src as string} alt={alt} {...props} />,
  }}
/>
```

#### Session Management

Handle session changes appropriately:

```tsx
<AuthUIProvider
  onSessionChange={() => {
    // Invalidate React Query cache
    queryClient.invalidateQueries();

    // Or refresh current data
    queryClient.refetchQueries({ active: true });
  }}
/>
```

@@@/section:auth-cloudflare

@@@section:auth-styling

### Styling and Customization

All components support TailwindCSS customization:

```tsx
// Container styling
<AuthView
  view="SIGN_IN"
  className="max-w-md mx-auto"
/>

// Granular component styling
<UserButton
  classNames={{
    button: 'rounded-full',
    dropdown: 'w-64 shadow-lg',
    item: 'hover:bg-gray-100'
  }}
/>
```

**shadcn/ui Theming:**

Components automatically inherit your shadcn/ui theme configuration. Ensure your `tailwind.config.js` includes:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // ... other shadcn colors
      },
    },
  },
};
```

@@@/section:auth-styling

@@@section:auth-troubleshooting

### Troubleshooting

#### SSR Hydration Errors

**Problem:** `Cannot read properties of null (reading 'useContext')` or similar errors during SSR.

**Solution:** Use the `isMounted` pattern for all components using Better Auth UI hooks:

```tsx
const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
  setIsMounted(true);
}, []);

if (!isMounted) {
  return <LoadingSkeleton />;
}

return <AuthUIComponent />;
```

#### AuthView Shows Only "Go back" Link

**Problem:** AuthView renders but only shows a "Go back" link, no form fields.

**Cause:** Using v1.x view names with v3.x package.

**Solution:** Use UPPERCASE view names:

```tsx
// Wrong (v1.x)
<AuthView view="sign-in" />

// Correct (v3.x)
<AuthView view="SIGN_IN" />
```

#### CSS Not Loading / No Styles

**Problem:** Auth components render but have no styling.

**Solution:** Import the CSS file:

```tsx
// In your root component or app.tsx
import "@daveyplate/better-auth-ui/css";
```

#### UserButton Shows Broken Image

**Problem:** UserButton displays a broken image icon.

**Cause:** SSR rendering issue or missing Image component override.

**Solution:**
1. Use `isMounted` pattern for UserButton
2. Configure custom Image component:

```tsx
<AuthUIProvider
  avatar={{
    Image: ({ src, alt, ...props }) => (
      <img src={src as string} alt={alt} {...props} />
    ),
  }}
>
```

#### Radix UI Dropdown/Popover Layout Shift

**Problem:** When using `UserButton` or other Radix UI components (via better-auth-ui), clicking the dropdown/popover causes the page content to shift horizontally.

**Root Cause:**

- Radix UI's Dropdown Menu enables `modal` mode by default
- This triggers `react-remove-scroll` to lock background scrolling
- `react-remove-scroll` adds `data-scroll-locked` attribute to body and sets `margin-right` + `overflow: hidden`
- This margin compensates for the hidden scrollbar but causes visible layout shift

**Dependencies Chain:**

```
better-auth-ui
  -> @radix-ui/react-dropdown-menu
    -> @radix-ui/react-menu
      -> react-remove-scroll (root cause)
```

**Solution:** Add the following CSS to your global stylesheet:

```css
/* Fix layout shift when Radix Dropdown/Popover opens
 * react-remove-scroll adds margin-right and overflow:hidden to body
 * This causes layout shift. Override it completely.
 * Reference: https://github.com/radix-ui/primitives/discussions/1586
 */
html {
  scrollbar-gutter: stable;
}

/* Target the data-scroll-locked attribute that react-remove-scroll adds */
html body[data-scroll-locked] {
  overflow: visible !important;
  margin-right: 0 !important;
  padding-right: 0 !important;
}
```

**Why This Works:**

1. `scrollbar-gutter: stable` reserves space for the scrollbar area, eliminating the need for compensation
2. `html body[data-scroll-locked]` has high enough specificity to override inline styles
3. Overriding `margin-right`, `padding-right`, and `overflow` completely disables the scroll-locking side effects

**Alternative Solution:**
Set `modal={false}` on Radix components to disable scroll locking behavior entirely (if the component supports this prop).

@@@/section:auth-troubleshooting

@@@section:auth-organizations

### Organization Support (Optional)

Enable multi-tenant features:

```tsx
<AuthUIProvider
  organization={{
    enabled: true,
    logo: {
      upload: async (file) => uploadLogoToStorage(file),
      delete: async (url) => deleteLogoFromStorage(url),
      size: 256,
      extension: 'png'
    },
    customRoles: [
      { role: 'developer', label: 'Developer' },
      { role: 'viewer', label: 'Viewer' }
    ]
  }}
>
```

Use organization components:

```tsx
import {
  OrganizationSwitcher,
  OrganizationSettingsCards,
} from "@daveyplate/better-auth-ui";

function AppHeader() {
  return (
    <header>
      <OrganizationSwitcher />
      <UserButton />
    </header>
  );
}

function OrgSettingsPage() {
  return <OrganizationSettingsCards />;
}
```

@@@/section:auth-organizations

@@@section:auth-hooks

### Authentication Hooks

Use the `useAuthenticate()` hook for custom logic:

```tsx
import { useAuthenticate } from "@daveyplate/better-auth-ui";

function CustomComponent() {
  const { session, user, loading } = useAuthenticate();

  if (loading) return <div>Loading...</div>;
  if (!session) return <div>Not authenticated</div>;

  return <div>Welcome, {user?.name}</div>;
}
```

**Better Auth Client Hooks:**

```tsx
import { authClient } from "@/lib/auth-client";

function UserProfile() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <Skeleton />;
  if (!session) return <RedirectToSignIn />;

  return <div>Logged in as {session.user.email}</div>;
}
```

@@@/section:auth-hooks

@@@section:auth-best-practices

### Best Practices

#### 1. Provider Placement

**DO:** Place `<AuthUIProvider>` at the root, above React Router

```tsx
// main.tsx
<AuthUIProvider authClient={authClient} navigate={...}>
  <RouterProvider router={router} />
</AuthUIProvider>
```

#### 2. SSR Safety

**DO:** Always use `isMounted` pattern for auth components

```tsx
const [isMounted, setIsMounted] = useState(false);
useEffect(() => setIsMounted(true), []);
if (!isMounted) return <Skeleton />;
return <AuthComponent />;
```

#### 3. Protected Routes

**DO:** Use the three-component pattern consistently

```tsx
<AuthLoading>...</AuthLoading>
<RedirectToSignIn />
<SignedIn>...</SignedIn>
```

**DON'T:** Manually check session state for redirects

#### 4. Error Handling

**DO:** Let backend handle error translations

```tsx
<AuthUIProvider localizeErrors={false} />
```

**DON'T:** Duplicate error messages in frontend

#### 5. Custom Fields Validation

**DO:** Validate on both client and server

```tsx
additionalFields={{
  phone: {
    validate: (value) => {
      if (!/^\+?[1-9]\d{1,14}$/.test(value)) {
        return 'Invalid phone number';
      }
      return true;
    }
  }
}}
```

#### 6. Avatar Management

**DO:** Handle uploads with proper error handling

```tsx
avatar={{
  upload: async (file) => {
    try {
      const url = await uploadToR2(file);
      return url;
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error('Failed to upload avatar');
    }
  }
}}
```

#### 7. Session Refresh

**DO:** Invalidate caches on session change

```tsx
onSessionChange={() => {
  queryClient.invalidateQueries();
}
```

#### 8. Localization

**DO:** Keep localization keys consistent

```tsx
localization={{
  SIGN_IN: t('auth.signIn'),
  SIGN_UP: t('auth.signUp')
}}
```

#### 9. Type Safety

**DO:** Import types from better-auth

```tsx
import type { Session, User } from "better-auth/types";
```

@@@/section:auth-best-practices

@@@section:auth-checklist

### Implementation Checklist

**Setup:**

- [ ] Install `@daveyplate/better-auth-ui` (v3.x recommended)
- [ ] Import CSS: `import "@daveyplate/better-auth-ui/css"`
- [ ] Install and configure shadcn/ui
- [ ] Configure TailwindCSS (v4 with bracket syntax)
- [ ] Set up better-auth backend (Hono)
- [ ] Create auth client instance

**Integration:**

- [ ] Wrap app with `<AuthUIProvider>` using `isMounted` pattern
- [ ] Configure React Router integration
- [ ] Set up authentication routes (`/login`, `/register`, etc.)
- [ ] Use UPPERCASE view names (`SIGN_IN`, `SIGN_UP`)
- [ ] Implement protected route pattern
- [ ] Configure custom paths if needed

**SSR Safety:**

- [ ] AuthProvider uses `isMounted` pattern
- [ ] All auth pages use `isMounted` pattern
- [ ] UserButton uses `isMounted` pattern
- [ ] Loading skeletons for SSR fallback

**Features:**

- [ ] Add social providers (if needed)
- [ ] Configure avatar upload/delete with Image override
- [ ] Set up custom fields (if needed)
- [ ] Enable organization support (if needed)
- [ ] Configure two-factor auth (if needed)

**Testing:**

- [ ] Test sign up flow
- [ ] Test sign in flow
- [ ] Test password reset flow
- [ ] Test protected routes redirect
- [ ] Test session persistence
- [ ] Test logout functionality
- [ ] Test SSR (page refresh without hydration errors)

@@@/section:auth-checklist
