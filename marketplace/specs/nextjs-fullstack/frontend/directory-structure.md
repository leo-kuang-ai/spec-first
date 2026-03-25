# Directory Structure

This document describes the module organization and folder conventions for the frontend application.

## Overview

```
app/                          # Next.js App Router
├── (marketing)/              # Public marketing pages (i18n)
│   └── [locale]/             # Locale-based routing
└── (app)/                    # Protected application routes
    └── app/                  # Main application routes
modules/                      # Feature modules
├── [feature]/                # Feature module
│   ├── components/           # UI components
│   ├── hooks/                # Custom hooks
│   ├── context/              # React Context
│   ├── lib/                  # Utilities and data transforms
│   └── types/                # Frontend view model types
├── shared/                   # Shared components across features
└── ui/                       # UI component library
middleware.ts                 # Authentication & routing middleware
```

## Module Structure

### Feature Module Pattern

Each feature module should follow this structure:

```
modules/dashboard/
├── components/
│   ├── DashboardHeader.tsx
│   ├── StatsCard.tsx
│   ├── ActivityFeed.tsx
│   └── index.ts              # Barrel export
├── hooks/
│   ├── useDashboardStats.ts
│   ├── useActivityFeed.ts
│   └── index.ts
├── context/
│   ├── DashboardContext.tsx
│   └── index.ts
├── lib/
│   ├── formatters.ts         # Data formatting utilities
│   ├── transformers.ts       # API response transformers
│   └── constants.ts          # Feature-specific constants
├── types/
│   └── index.ts              # View model types
└── index.ts                  # Public API of the module
```

### Component Organization

```
components/
├── [ComponentName].tsx       # Main component file
├── [ComponentName].test.tsx  # Unit tests (if applicable)
└── index.ts                  # Barrel export
```

### Hooks Organization

```
hooks/
├── useFeatureData.ts         # Data fetching hooks
├── useFeatureActions.ts      # Mutation hooks
├── useFeatureState.ts        # Local state hooks
└── index.ts
```

## Shared Modules

### `modules/shared/`

Components and utilities shared across multiple features:

```
shared/
├── components/
│   ├── Layout/               # Layout components
│   ├── Navigation/           # Navigation components
│   ├── DataTable/            # Reusable data tables
│   └── Forms/                # Form components
├── hooks/
│   ├── useUser.ts            # Current user hook
│   ├── useOrganization.ts    # Organization context
│   └── usePermissions.ts     # Permission checks
└── lib/
    ├── api.ts                # API client configuration
    └── utils.ts              # Shared utilities
```

### `modules/ui/`

Low-level UI components (design system):

```
ui/
├── Button/
├── Input/
├── Select/
├── Dialog/
├── Toast/
└── ...
```

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase with `use` prefix | `useUserProfile.ts` |
| Context | PascalCase with `Context` suffix | `UserContext.tsx` |
| Utilities | camelCase | `formatDate.ts` |
| Constants | camelCase or SCREAMING_SNAKE_CASE | `constants.ts` |
| Types | PascalCase | `types.ts` or `UserTypes.ts` |

### Exports

Use barrel exports (`index.ts`) for clean imports:

```typescript
// modules/dashboard/components/index.ts
export { DashboardHeader } from './DashboardHeader';
export { StatsCard } from './StatsCard';
export { ActivityFeed } from './ActivityFeed';
```

```typescript
// Usage
import { DashboardHeader, StatsCard } from '@/modules/dashboard/components';
```

## Route-Module Mapping

Routes in `app/(app)/` should map to modules in `modules/`:

```
app/(app)/
├── dashboard/
│   └── page.tsx          -> modules/dashboard/
├── users/
│   ├── page.tsx          -> modules/users/
│   └── [id]/
│       └── page.tsx      -> modules/users/ (detail view)
├── settings/
│   └── page.tsx          -> modules/settings/
└── orders/
    ├── page.tsx          -> modules/orders/
    └── [id]/
        └── page.tsx      -> modules/orders/ (detail view)
```

## Import Path Aliases

Configure in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/modules/*": ["./modules/*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"]
    }
  }
}
```

## Best Practices

1. **Colocation**: Keep related files close together
2. **Single Responsibility**: Each module should have one clear purpose
3. **Explicit Dependencies**: Import what you need, avoid implicit globals
4. **Barrel Exports**: Use `index.ts` for public APIs
5. **Private by Default**: Only export what needs to be shared

## Anti-Patterns to Avoid

- Deeply nested folder structures (max 3-4 levels)
- Circular dependencies between modules
- Mixing feature code with shared utilities
- Importing internal module files directly (use barrel exports)
- Creating "utils" folders that become dumping grounds
