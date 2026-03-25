# Type Safety Guidelines

This document covers TypeScript best practices for maintaining type safety across the frontend application.

## Core Principles

1. **Import types from backend, never redefine them**
2. **Use type inference wherever possible**
3. **Avoid type assertions and escape hatches**
4. **Leverage oRPC for end-to-end type safety**

## Importing Backend Types

### DO: Import from API Package

```typescript
// Good: Import types from the API package
import type { User, Order, Product } from '@your-app/api/modules/users/types'; // Replace with your monorepo package path
import type { OrderStatus } from '@your-app/api/modules/orders/types'; // Replace with your monorepo package path
```

### DON'T: Redefine Backend Types

```typescript
// Bad: Redefining types that exist in backend
interface User {
  id: string;
  name: string;
  email: string;
}

// Bad: Creating parallel type definitions
type OrderStatus = 'pending' | 'processing' | 'completed';
```

## Type Inference from API Client

### Using `Awaited<ReturnType>` Pattern

Infer types directly from API client calls to ensure frontend types stay in sync with backend:

```typescript
import { orpcClient } from '@/lib/orpc';

// Infer the response type from the API client
type UsersResponse = Awaited<ReturnType<typeof orpcClient.users.list>>;

// Infer a single item type from array response
type User = UsersResponse['items'][number];

// Infer input types
type CreateUserInput = Parameters<typeof orpcClient.users.create>[0];
```

### Type Inference in Hooks

```typescript
import { useQuery } from '@tanstack/react-query';
import { orpcClient } from '@/lib/orpc';

// The return type is automatically inferred
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => orpcClient.users.list(),
  });
}

// For complex transformations, use explicit inference
type UserListData = Awaited<ReturnType<typeof orpcClient.users.list>>;

export function useFormattedUsers() {
  return useQuery({
    queryKey: ['users', 'formatted'],
    queryFn: async () => {
      const data = await orpcClient.users.list();
      return transformUsers(data);
    },
  });
}
```

## Forbidden Patterns

### NO @ts-expect-error for Custom Fields

Never use type suppression to access fields that don't exist in the type:

```typescript
// Bad: Suppressing type errors
// @ts-expect-error - customField exists at runtime
const value = user.customField;

// Bad: Using any to bypass type checking
const value = (user as any).customField;
```

**Solution**: If a field exists at runtime but not in types, update the backend type definition.

### NO `any` Type in Cache Updates

React Query cache updates must maintain type safety:

```typescript
// Bad: Using any in cache updates
queryClient.setQueryData(['users'], (old: any) => {
  return old.map((user: any) => /* ... */);
});

// Good: Properly typed cache updates
queryClient.setQueryData<UserListData>(['users'], (old) => {
  if (!old) return old;
  return {
    ...old,
    items: old.items.map((user) => /* ... */),
  };
});
```

### NO Type Assertions Without Validation

```typescript
// Bad: Blind type assertion
const user = data as User;

// Good: Runtime validation with Zod
import { userSchema } from '@your-app/api/modules/users/types'; // Replace with your monorepo package path
const user = userSchema.parse(data);

// Good: Type guard
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'email' in data
  );
}
```

## View Model Types

When the frontend needs additional computed properties, create view models that extend backend types:

```typescript
// types/index.ts
import type { Order } from '@your-app/api/modules/orders/types'; // Replace with your monorepo package path

// Extend backend type with frontend-specific computed properties
export interface OrderViewModel extends Order {
  formattedTotal: string;
  statusLabel: string;
  isEditable: boolean;
}

// Transform function
export function toOrderViewModel(order: Order): OrderViewModel {
  return {
    ...order,
    formattedTotal: formatCurrency(order.total),
    statusLabel: getStatusLabel(order.status),
    isEditable: order.status === 'draft',
  };
}
```

## Generic Type Patterns

### API Response Wrapper

```typescript
// Generic paginated response type
type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

// Usage with inference
type UserListResponse = PaginatedResponse<User>;
```

### Hook Return Types

```typescript
// Explicit return type for complex hooks
interface UseOrderActionsReturn {
  updateOrder: (id: string, data: UpdateOrderInput) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function useOrderActions(): UseOrderActionsReturn {
  // Implementation
}
```

## Working with External Data

### API Responses

```typescript
// Always validate external data
import { z } from 'zod';

const externalDataSchema = z.object({
  id: z.string(),
  value: z.number(),
});

async function fetchExternalData() {
  const response = await fetch('/api/external');
  const data = await response.json();
  return externalDataSchema.parse(data);
}
```

### Local Storage

```typescript
// Type-safe local storage wrapper
function getStoredValue<T>(key: string, schema: z.ZodType<T>): T | null {
  const stored = localStorage.getItem(key);
  if (!stored) return null;

  try {
    return schema.parse(JSON.parse(stored));
  } catch {
    return null;
  }
}
```

## TypeScript Configuration

Ensure strict mode is enabled in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Common Type Utilities

```typescript
// Extract array element type
type ArrayElement<T> = T extends (infer E)[] ? E : never;

// Make specific properties optional
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific properties required
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Non-nullable
type NonNullableFields<T> = {
  [K in keyof T]: NonNullable<T[K]>;
};
```

## Checklist

Before committing, verify:

- [ ] No `@ts-expect-error` or `@ts-ignore` comments added
- [ ] No `any` types in new code
- [ ] All API response types are inferred or imported from backend
- [ ] Cache updates are properly typed
- [ ] External data is validated with Zod schemas
