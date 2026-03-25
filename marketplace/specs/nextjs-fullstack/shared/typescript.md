# TypeScript Best Practices

> TypeScript guidelines for Next.js full-stack applications.

---

## Zod-First Type Definitions

Define Zod schemas first, then infer TypeScript types from them. Never define types manually when a Zod schema exists.

```typescript
import { z } from 'zod';

// 1. Define the schema (single source of truth)
export const createUserInputSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']),
});

export const createUserOutputSchema = z.object({
  success: z.boolean(),
  reason: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }).optional(),
});

// 2. Derive types from schemas
export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type CreateUserOutput = z.infer<typeof createUserOutputSchema>;

// BAD - Manual type that duplicates schema
interface CreateUserInput {
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
}
```

### Reusable Base Schemas

```typescript
const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const timestampSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Compose into larger schemas
export const listOrdersInputSchema = paginationSchema.extend({
  status: orderStatusZodSchema.optional(),
  customerId: z.string().optional(),
});
```

---

## Type Inference from API

Import types from the backend or infer them from the API client. Never redefine backend types on the frontend.

### Import from Backend Package

```typescript
// GOOD - Import from the API package
import type { User, Order } from '@your-app/api/modules/users/types';
import type { OrderStatus } from '@your-app/api/modules/orders/types';

// BAD - Redefining types that exist in backend
interface User {
  id: string;
  name: string;
  email: string;
}
```

### Infer from API Client

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
// The return type is automatically inferred from oRPC
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

---

## Discriminated Unions

Use discriminated unions for types that can be one of several shapes. Use strict equality (`=== true`) for narrowing.

### TypeScript Discriminated Union

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const result: Result<User> = doSomething();

// CORRECT: Use === true for narrowing
if (result.success === true) {
  console.log(result.data); // TypeScript knows data exists
} else {
  console.log(result.error); // TypeScript knows error exists
}
```

### Zod Discriminated Union

```typescript
export const notificationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('email'),
    recipient: z.string().email(),
    subject: z.string(),
  }),
  z.object({
    type: z.literal('sms'),
    phoneNumber: z.string(),
    message: z.string(),
  }),
  z.object({
    type: z.literal('push'),
    deviceToken: z.string(),
    title: z.string(),
    body: z.string(),
  }),
]);

type Notification = z.infer<typeof notificationSchema>;
```

---

## Generic Patterns

### Generic Result Type

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function createResult<T>(data: T): Result<T> {
  return { success: true, data };
}
```

### Generic Paginated Response

```typescript
type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

type UserListResponse = PaginatedResponse<User>;
```

### Generic with Constraints

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

### Common Utility Types

```typescript
// Extract array element type
type ArrayElement<T> = T extends (infer E)[] ? E : never;

// Make specific properties optional
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific properties required
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
```

---

## Standard Response Format

All API responses must include `success` and `reason` fields.

```typescript
// Output schema pattern
export const operationResultSchema = z.object({
  success: z.boolean(),
  reason: z.string(),
  data: z.unknown().optional(),
});

// Success response
return {
  success: true,
  reason: 'User created successfully',
  user: { id, name, email },
};

// Error response
return {
  success: false,
  reason: 'Email address is already in use',
};
```

### Batch Operation Response

```typescript
export const batchOperationResultSchema = z.object({
  success: z.boolean(),
  total: z.number(),
  processed: z.number(),
  failed: z.number(),
  errors: z.array(z.object({
    itemId: z.string(),
    error: z.string(),
  })).optional(),
});
```

---

## Forbidden Patterns

### No `any`

```typescript
// BAD
function process(data: any) { ... }

// GOOD
function process(data: unknown) { ... }
function process(data: ProcessInput) { ... }
```

### No Non-null Assertion

```typescript
// BAD
const name = user!.name;
const first = items[0]!;

// GOOD
if (user) {
  const name = user.name;
}

const first = items[0];
if (!first) {
  return { success: false, reason: 'No items found' };
}
```

### No `@ts-expect-error` / `@ts-ignore`

```typescript
// BAD
// @ts-expect-error - customField exists at runtime
const value = user.customField;

// GOOD - Update the type definition instead
interface User {
  customField: string;
  // ...
}
```

### No Type Assertions Without Validation

```typescript
// BAD - Blind assertion
const user = data as User;

// GOOD - Runtime validation with Zod
const user = userSchema.parse(data);

// GOOD - Type guard
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'email' in data
  );
}
```

---

## Type Imports

Always use `import type` for type-only imports:

```typescript
// GOOD
import type { User, Project } from './types';
import { createUser } from './procedures';

// Also acceptable
import { type User, createUser } from './types';

// BAD
import { User, createUser } from './types';
```

---

## Explicit Return Types for Exports

Always annotate explicit return types on exported functions:

```typescript
// BAD - Implicit return type
export function getUser(id: string) {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}

// GOOD - Explicit return type
export function getUser(id: string): Promise<User | undefined> {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}
```

---

## TypeScript Configuration

Ensure strict mode is enabled:

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

---

## Drizzle Type Inference

```typescript
// Infer types from Drizzle tables
type User = typeof userTable.$inferSelect;
type NewUser = typeof userTable.$inferInsert;

// Combine with Zod via drizzle-zod
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
const userSelectSchema = createSelectSchema(userTable);
const userInsertSchema = createInsertSchema(userTable);
```

---

## View Model Types

When the frontend needs computed properties, extend backend types rather than redefining them:

```typescript
import type { Order } from '@your-app/api/modules/orders/types';

export interface OrderViewModel extends Order {
  formattedTotal: string;
  statusLabel: string;
  isEditable: boolean;
}

export function toOrderViewModel(order: Order): OrderViewModel {
  return {
    ...order,
    formattedTotal: formatCurrency(order.total),
    statusLabel: getStatusLabel(order.status),
    isEditable: order.status === 'draft',
  };
}
```

---

## Summary

| Practice                    | Reason                        |
| --------------------------- | ----------------------------- |
| Zod-first types             | Single source of truth        |
| Import, don't redefine      | No type drift                 |
| `=== true` for unions       | Proper narrowing              |
| Generics for reuse          | DRY, type-safe                |
| `success` + `reason` format | Consistent API responses      |
| No `any`                    | Type safety                   |
| No `!` assertions           | Runtime safety                |
| No `@ts-expect-error`       | Masks real issues             |
| `import type`               | Clear separation, tree-shake  |
| Explicit return types       | Documentation, catch errors   |
