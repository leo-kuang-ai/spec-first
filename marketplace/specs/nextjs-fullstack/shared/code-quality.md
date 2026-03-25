# Code Quality Guidelines

> Mandatory code quality rules for all Next.js full-stack applications.

---

## No Non-Null Assertions

**NEVER** use non-null assertions (`!`). They bypass TypeScript's null checking and lead to runtime errors.

```typescript
// FORBIDDEN
const name = user!.name;
const value = data!.items![0]!;

// REQUIRED - Use explicit checks
const user = getUser();
if (!user) {
  throw new Error('User not found');
}
const name = user.name;

// REQUIRED - Use optional chaining with fallback
const value = data?.items?.[0] ?? defaultValue;

// REQUIRED - Use local variable after null check
const project = getProject(id);
if (!project) {
  return { success: false, reason: 'Project not found' };
}
const projectName = project.name;
```

---

## No `any` Type

```typescript
// BAD
function process(data: any) { ... }

// GOOD - Use proper types
function process(data: ProcessInput) { ... }

// GOOD - Use unknown for truly unknown data
function parseJSON(input: string): unknown {
  return JSON.parse(input);
}

// BAD - any in cache updates
queryClient.setQueryData(['users'], (old: any) => ...);

// GOOD - Properly typed cache updates
queryClient.setQueryData<UserListData>(['users'], (old) => {
  if (!old) return old;
  return { ...old, items: old.items.filter((u) => u.id !== deletedId) };
});
```

---

## No `@ts-expect-error` / `@ts-ignore`

```typescript
// FORBIDDEN
// @ts-expect-error - field exists at runtime
const value = user.customField;

// @ts-ignore
doSomething(invalidArg);

// REQUIRED - Fix the type issue at the source
// If a field exists at runtime but not in types, update the type definition.
doSomething(validArg);
```

---

## No `console.log`

Use structured logging instead of `console.log`. This applies to both frontend and backend code.

```typescript
// BAD
console.log('User created:', userId);
console.log('Error:', error);

// GOOD - Backend: use structured logger
logger.info('user_created', { userId });
logger.error('operation_failed', { error, operationId });

// GOOD - Frontend: remove debug logs before commit
// Use browser dev tools for debugging, not console.log
```

**Exception**: `console.warn` and `console.error` are acceptable in frontend code for development-time warnings that will not appear in production.

---

## Import Ordering

Organize imports in this order, separated by blank lines:

```typescript
// 1. Node built-ins
import path from 'node:path';

// 2. External packages
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

// 3. Internal workspace packages
import type { User } from '@your-app/api/modules/users/types';

// 4. Local imports (relative paths)
import { formatDate } from './utils';
import type { Props } from './types';
```

Always use `import type` for type-only imports:

```typescript
// GOOD
import type { User, Project } from './types';
import { createUser } from './procedures';

// BAD - Mixed imports without type annotation
import { User, createUser } from './types';
```

---

## Naming Conventions

### Files and Directories

| Type            | Convention                  | Example                     |
| --------------- | --------------------------- | --------------------------- |
| React Component | PascalCase                  | `UserProfile.tsx`           |
| Hook            | camelCase with `use` prefix | `useProject.ts`             |
| Utility         | kebab-case                  | `date-utils.ts`             |
| Type file       | kebab-case or `types.ts`    | `types.ts`, `user-types.ts` |
| Test file       | Same name + `.test`         | `date-utils.test.ts`        |
| Directory       | kebab-case                  | `user-profile/`             |

### Variables and Functions

| Type           | Convention                                  | Example                            |
| -------------- | ------------------------------------------- | ---------------------------------- |
| Variable       | camelCase                                   | `userName`, `isActive`             |
| Constant       | SCREAMING_SNAKE_CASE                        | `MAX_RETRY_COUNT`                  |
| Function       | camelCase                                   | `getUserById`                      |
| Class          | PascalCase                                  | `UserService`                      |
| Type/Interface | PascalCase                                  | `UserInput`, `ProjectOutput`       |
| Enum           | PascalCase (type), SCREAMING_SNAKE (values) | `enum Status { ACTIVE, INACTIVE }` |

### Boolean Variables

Use `is`, `has`, `should`, `can` prefixes:

```typescript
// GOOD
const isLoading = true;
const hasPermission = user.role === 'admin';
const shouldRefresh = Date.now() > expiresAt;
const canEdit = isOwner || hasPermission;

// BAD
const loading = true;
const permission = user.role === 'admin';
```

---

## Error Handling

### Never Swallow Errors

```typescript
// BAD - Silent failure
try {
  await dangerousOperation();
} catch (e) {
  // nothing
}

// GOOD - Log and handle
try {
  await dangerousOperation();
} catch (error) {
  logger.error('operation_failed', { error });
  throw new AppError('Operation failed', 'OPERATION_FAILED');
}
```

### Consistent Error Response Format

All API responses must use the standard `success` + `reason` format:

```typescript
// Success
return {
  success: true,
  reason: 'Operation completed successfully',
  data: result,
};

// Error
return {
  success: false,
  reason: 'Insufficient permissions to perform this action',
};
```

---

## Dead Code Elimination

- Remove unused imports (Biome enforces this automatically)
- Remove commented-out code blocks
- Remove unused variables, functions, and types
- Remove unreachable code after `return`, `throw`, `break`, `continue`

```typescript
// BAD - Dead code
function processOrder(order: Order) {
  // const oldLogic = order.items.map(...);
  const result = newLogic(order);
  return result;
  cleanup(); // unreachable
}

// GOOD - Clean
function processOrder(order: Order) {
  return newLogic(order);
}
```

---

## Lint and Type Check Before Commit

```bash
# MUST pass before every commit
pnpm lint
pnpm type-check

# Production build check (catches additional issues)
pnpm build

# Or combined
pnpm lint && pnpm type-check && pnpm build
```

---

## Testing Guidelines

### Test File Location

```
src/
  __tests__/              # Integration tests
    api.test.ts
app/
  feature/
    page.tsx
    page.test.tsx         # Co-located test (when appropriate)
```

### Test Structure (AAA Pattern)

```typescript
describe('OrderService', () => {
  describe('createOrder', () => {
    it('should create an order with valid input', async () => {
      // Arrange
      const input = { items: [{ productId: '1', quantity: 2 }] };

      // Act
      const result = await createOrder(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.order.items).toHaveLength(1);
    });

    it('should reject empty order', async () => {
      // Arrange
      const input = { items: [] };

      // Act
      const result = await createOrder(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});
```

---

## Summary

| Rule                           | Reason              |
| ------------------------------ | ------------------- |
| No `!` assertions              | Runtime errors      |
| No `any` type                  | Type safety         |
| No `@ts-expect-error`          | Masks real issues   |
| No `console.log`               | Use structured logs |
| Lint + typecheck before commit | Consistent code     |
| Structured errors              | Consistent handling |
| Never swallow errors           | Debuggability       |
| Remove dead code               | Maintainability     |
