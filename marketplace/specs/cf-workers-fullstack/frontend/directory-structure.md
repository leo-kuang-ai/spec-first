# Directory Structure

> Complete directory structure guide for a Cloudflare Workers + React Router v7 + Vite frontend.

---

## Project Tree

```
app/
├── entry.client.tsx              # Client-side entry point (hydration)
├── entry.server.tsx              # Server-side entry point (SSR)
├── root.tsx                      # Root layout (html, head, body, providers)
├── routes.ts                     # Explicit route configuration
├── app.css                       # Global styles (Tailwind directives, CSS variables)
│
├── routes/                       # Route page components
│   ├── home.tsx                  # Index route (/)
│   ├── login.tsx                 # Auth route (/login)
│   ├── register.tsx              # Auth route (/register)
│   ├── forgot-password.tsx       # Auth route (/forgot-password)
│   ├── dashboard.tsx             # Protected route (/dashboard)
│   ├── settings.tsx              # Protected route (/settings)
│   ├── settings.profile.tsx      # Nested route (/settings/profile)
│   ├── settings.security.tsx     # Nested route (/settings/security)
│   ├── items.tsx                 # Feature route (/items)
│   ├── items.$itemId.tsx         # Dynamic route (/items/:itemId)
│   └── $.tsx                     # Catch-all / 404 route
│
├── components/
│   ├── ui/                       # shadcn/ui primitives (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── skeleton.tsx
│   │   ├── table.tsx
│   │   ├── toast.tsx
│   │   └── toaster.tsx
│   │
│   └── layout/                   # App-wide layout components
│       ├── header.tsx            # Top navigation bar
│       ├── sidebar.tsx           # Side navigation (if applicable)
│       ├── footer.tsx            # Page footer
│       ├── page-container.tsx    # Standard page wrapper with max-width
│       └── user-button.tsx       # Auth-aware user menu
│
├── modules/                      # Feature modules (domain-specific)
│   ├── items/
│   │   ├── components/
│   │   │   ├── item-card.tsx
│   │   │   ├── item-list.tsx
│   │   │   ├── item-form.tsx
│   │   │   └── item-detail.tsx
│   │   ├── hooks/
│   │   │   ├── use-items.ts
│   │   │   ├── use-item.ts
│   │   │   ├── use-create-item.ts
│   │   │   └── use-update-item.ts
│   │   ├── context/
│   │   │   └── item-filter-context.tsx
│   │   └── types.ts
│   │
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── stats-card.tsx
│   │   │   ├── activity-feed.tsx
│   │   │   └── quick-actions.tsx
│   │   ├── hooks/
│   │   │   └── use-dashboard-stats.ts
│   │   └── types.ts
│   │
│   └── settings/
│       ├── components/
│       │   ├── profile-form.tsx
│       │   └── notification-preferences.tsx
│       ├── hooks/
│       │   └── use-update-profile.ts
│       └── types.ts
│
├── hooks/                        # Shared custom hooks (not feature-specific)
│   ├── use-debounce.ts
│   ├── use-local-storage.ts
│   ├── use-media-query.ts
│   └── use-mounted.ts
│
├── lib/                          # Shared utilities and configuration
│   ├── auth-client.ts            # Better Auth client instance
│   ├── query-client.ts           # React Query client configuration
│   ├── api.ts                    # Base API fetch wrapper
│   ├── utils.ts                  # General utility functions (cn, formatDate, etc.)
│   └── constants.ts              # App-wide constants
│
└── types/                        # Shared type definitions
    ├── api.ts                    # API response/request types
    └── common.ts                 # Shared UI types (e.g., SortDirection, PaginationParams)
```

---

## File Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files and directories | `kebab-case` | `item-card.tsx`, `use-items.ts` |
| React components (export) | `PascalCase` | `export function ItemCard()` |
| Hooks (export) | `camelCase` with `use` prefix | `export function useItems()` |
| Type files | `kebab-case` or `types.ts` | `types.ts`, `api-types.ts` |
| Route files | Match URL path with `.` separator | `settings.profile.tsx` |
| Dynamic route segments | `$` prefix | `items.$itemId.tsx` |
| CSS files | `kebab-case` | `app.css`, `animations.css` |

---

## Feature Module Pattern

Each feature module under `app/modules/` follows a consistent internal structure:

```
modules/{feature}/
├── components/     # UI components specific to this feature
├── hooks/          # Custom hooks for data fetching and mutations
├── context/        # React context providers (if needed)
└── types.ts        # Type definitions (or import from backend)
```

### Rules

1. **Components** in a feature module should only be used by that feature's routes or by other components within the same module.
2. **Hooks** encapsulate all data-fetching logic. Route components should never call `fetch` directly -- they call hooks.
3. **Context** is optional. Only create a context when multiple sibling components need to share state that does not belong in the URL or in React Query cache.
4. **types.ts** should re-export or reference backend types wherever possible, per [type-safety.md](./type-safety.md).

### When to Create a New Module

| Scenario | Action |
|----------|--------|
| New domain entity with its own routes (e.g., "projects") | Create `modules/projects/` |
| New set of CRUD operations on a distinct resource | Create a new module |
| Small utility component used across features | Place in `components/layout/` or `components/ui/` |
| A hook used by multiple features | Place in `hooks/` (shared) |
| A single new page with no reusable parts | Keep logic in the route file; create a module later if it grows |

### When to Extend an Existing Module

| Scenario | Action |
|----------|--------|
| Adding a detail view for an existing entity | Add component to existing module's `components/` |
| Adding a new mutation for an existing entity | Add hook to existing module's `hooks/` |
| Adding filters/sorting to a list | Add context to existing module's `context/` |

---

## Route File Conventions

This project uses **React Router v7 with explicit route configuration** (not filesystem-based routing). All routes must be registered in `app/routes.ts`.

### Route Registration

```typescript
// app/routes.ts
import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

const routes: RouteConfig = [
  // Index route
  index("routes/home.tsx"),

  // Auth routes (public)
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),

  // Feature routes
  route("items", "routes/items.tsx"),
  route("items/:itemId", "routes/items.$itemId.tsx"),

  // Nested routes with shared layout
  layout("routes/settings.tsx", [
    route("settings/profile", "routes/settings.profile.tsx"),
    route("settings/security", "routes/settings.security.tsx"),
  ]),

  // Catch-all 404
  route("*", "routes/$.tsx"),
];

export default routes;
```

### Route File Structure

Each route file should follow this order:

```tsx
// 1. Imports
import { useParams } from "react-router";
import { ItemDetail } from "@/modules/items/components/item-detail";
import { useItem } from "@/modules/items/hooks/use-item";

// 2. Meta function (for page title and description)
export function meta() {
  return [
    { title: "Item Details" },
    { name: "description", content: "View item details" },
  ];
}

// 3. Loader (if server-side data is needed)
export async function loader({ params }: { params: { itemId: string } }) {
  // ...
}

// 4. Default export: the page component
export default function ItemPage() {
  const { itemId } = useParams();
  const { data: item, isLoading } = useItem(itemId!);

  if (isLoading) return <div>Loading...</div>;
  if (!item) return <div>Not found</div>;

  return <ItemDetail item={item} />;
}
```

### Route Naming Convention

| URL Pattern | File Name | Notes |
|-------------|-----------|-------|
| `/` | `home.tsx` | Index route |
| `/login` | `login.tsx` | Flat route |
| `/settings/profile` | `settings.profile.tsx` | Dot-separated for nested paths |
| `/items/:itemId` | `items.$itemId.tsx` | `$` for dynamic segments |
| `/items/:itemId/edit` | `items.$itemId.edit.tsx` | Combined dynamic + nested |
| `/*` (404) | `$.tsx` | Catch-all splat route |

---

## Import Alias Conventions

The project uses `@/` as an alias for the `app/` directory, configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./app/*"]
    }
  }
}
```

### Import Order Convention

Maintain a consistent import order in all files:

```tsx
// 1. React and framework imports
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";

// 2. Third-party library imports
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// 3. Internal absolute imports (using @/ alias)
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";

// 4. Feature module imports
import { ItemCard } from "@/modules/items/components/item-card";
import { useItems } from "@/modules/items/hooks/use-items";

// 5. Relative imports (within the same module)
import { formatItemDate } from "./utils";

// 6. Type-only imports
import type { Item } from "@/modules/items/types";
```

---

## Static Assets

For Cloudflare Workers deployments, static assets are served from the `public/` directory at the project root:

```
public/
├── favicon.ico
├── robots.txt
├── og-image.png
└── fonts/
    └── custom-font.woff2
```

Assets in `public/` are available at the root URL (e.g., `/favicon.ico`). Vite handles bundling for assets imported in code (images, SVGs, etc.).

---

## Summary Checklist

- [ ] Route files live in `app/routes/` and are registered in `app/routes.ts`
- [ ] Feature logic is organized in `app/modules/{feature}/`
- [ ] Shared hooks live in `app/hooks/`
- [ ] shadcn/ui components live in `app/components/ui/`
- [ ] Layout components live in `app/components/layout/`
- [ ] All imports use the `@/` alias for `app/`
- [ ] Files use `kebab-case`, exports use `PascalCase` (components) or `camelCase` (hooks/utils)
