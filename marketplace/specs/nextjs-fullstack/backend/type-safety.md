# Type Safety Guidelines

This document covers TypeScript best practices and type safety patterns for backend development.

## Critical Rules

### 1. NO Non-null Assertions (`!`)

Never use the non-null assertion operator (`!`). It bypasses TypeScript's null checking and can lead to runtime errors.

```typescript
// BAD - Non-null assertion
const user = users.find(u => u.id === id);
await processUser(user!); // Dangerous!

// GOOD - Use local variable for type narrowing
const user = users.find(u => u.id === id);
if (!user) {
  return { success: false, reason: "User not found" };
}
// TypeScript now knows user is defined
await processUser(user);
```

**Why this matters:**

- Non-null assertions (`!`) tell TypeScript to trust you, but runtime doesn't care
- If the value is actually `null` or `undefined`, you get a runtime crash
- Local variable narrowing is verifiable at both compile-time and runtime

### 2. All Inputs/Outputs Must Have Zod Schemas

Every API endpoint must define explicit input and output schemas using Zod.

```typescript
// types.ts
import { z } from "zod";

// Input Schema
export const updateUserInputSchema = z.object({
  userId: z.string(),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  settings: z.object({
    notifications: z.boolean(),
    theme: z.enum(["light", "dark"]),
  }).optional(),
});

// Output Schema
export const updateUserOutputSchema = z.object({
  success: z.boolean(),
  reason: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }).optional(),
});

// Type exports (inferred from schemas)
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
export type UpdateUserOutput = z.infer<typeof updateUserOutputSchema>;
```

**Using schemas in procedures:**

```typescript
// procedures/update.ts
export const updateUser = protectedProcedure
  .route({
    method: "PATCH",
    path: "/users/:userId",
    tags: ["Users"],
    summary: "Update user profile",
  })
  .input(updateUserInputSchema)
  .output(updateUserOutputSchema)
  .handler(async ({ input, context }) => {
    // input is fully typed as UpdateUserInput
    const { userId, name, email, settings } = input;

    // ... implementation

    return {
      success: true,
      reason: "User updated successfully",
      user: { id: userId, name: updatedName, email: updatedEmail },
    };
  });
```

### 3. Import Enums from Shared Utils Package

**Never import enums directly from the database package.** The database package includes the PostgreSQL client, which can cause issues in certain environments (edge runtime, client-side code).

```typescript
// BAD - Imports database client as side effect
import { messageCategoryEnum } from "@your-app/database/drizzle/schema/postgres";

// GOOD - Import from utils (no database client dependency)
import {
  messageCategoryZodSchema,
  type MessageCategory,
  MESSAGE_CATEGORY_VALUES,
} from "@your-app/utils";
```

**How enums are organized in the utils package:**

```typescript
// packages/utils/lib/enum-types.ts
import { z } from "zod";

// Import enum values from schema (not the full database package)
import {
  statusEnum
} from "@your-app/database/drizzle/schema";

// Export as Zod schema and TypeScript type
export const ORDER_STATUS_VALUES = statusEnum.enumValues;
export const orderStatusZodSchema = z.enum(ORDER_STATUS_VALUES);
export type OrderStatus = z.infer<typeof orderStatusZodSchema>;
```

### 4. Standard Response Format

All API responses must include `success` and `reason` fields for consistent error handling.

```typescript
// Output schema pattern
export const operationResultSchema = z.object({
  success: z.boolean(),
  reason: z.string(),
  // Additional fields as needed
  data: z.unknown().optional(),
});

// Success response
return {
  success: true,
  reason: "Operation completed successfully",
  data: result,
};

// Error response
return {
  success: false,
  reason: "Insufficient permissions to perform this action",
};
```

**Batch operation response pattern:**

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

## Type Narrowing Patterns

### Array Operations

```typescript
// BAD - Assumes array has elements
const firstOrder = orders[0];
await processOrder(firstOrder!);

// GOOD - Check first
const firstOrder = orders[0];
if (!firstOrder) {
  return { success: false, reason: "No orders found" };
}
await processOrder(firstOrder);
```

### Optional Chaining with Fallback

```typescript
// BAD - Non-null assertion on optional property
const userName = user.profile!.name!;

// GOOD - Safe access with fallback
const userName = user.profile?.name ?? "Unknown";

// GOOD - When value is required, validate first
const profile = user.profile;
if (!profile?.name) {
  throw new ORPCError("BAD_REQUEST", { message: "Profile name is required" });
}
const userName = profile.name;
```

### Map/Find Operations

```typescript
// BAD - Assuming find always succeeds
const account = accounts.find(a => a.id === accountId)!;

// GOOD - Handle the undefined case
const account = accounts.find(a => a.id === accountId);
if (!account) {
  throw new ORPCError("NOT_FOUND", { message: "Account not found" });
}
// account is now guaranteed to be defined
```

## Zod Schema Best Practices

### Reusable Base Schemas

```typescript
// Define reusable schemas
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

export const orderSchema = z.object({
  id: z.string(),
  status: orderStatusZodSchema,
  total: z.number(),
}).merge(timestampSchema);
```

### Discriminated Unions

```typescript
// For polymorphic responses
export const notificationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("email"),
    recipient: z.string().email(),
    subject: z.string(),
  }),
  z.object({
    type: z.literal("sms"),
    phoneNumber: z.string(),
    message: z.string(),
  }),
  z.object({
    type: z.literal("push"),
    deviceToken: z.string(),
    title: z.string(),
    body: z.string(),
  }),
]);
```

### Transform and Refine

```typescript
// Transform input data
export const createProductInputSchema = z.object({
  name: z.string().transform(s => s.trim()),
  price: z.string().transform(s => parseFloat(s)),
  tags: z.string().transform(s => s.split(",").map(t => t.trim())),
});

// Add custom validation
export const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine(
  data => new Date(data.endDate) > new Date(data.startDate),
  { message: "End date must be after start date" }
);
```

## Error Handling Types

Use typed errors with oRPC:

```typescript
import { ORPCError } from "@orpc/server";

// Standard error codes
throw new ORPCError("NOT_FOUND", { message: "Resource not found" });
throw new ORPCError("FORBIDDEN", { message: "Access denied" });
throw new ORPCError("BAD_REQUEST", { message: "Invalid input" });
throw new ORPCError("UNAUTHORIZED", { message: "Authentication required" });
throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Unexpected error" });
```

## Type Inference Helpers

```typescript
// Infer types from Drizzle tables
type User = typeof userTable.$inferSelect;
type NewUser = typeof userTable.$inferInsert;

// Infer from Zod schemas
type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

// Utility types for partial updates
type UpdateOrderInput = Partial<Omit<CreateOrderInput, "id">>;
```
