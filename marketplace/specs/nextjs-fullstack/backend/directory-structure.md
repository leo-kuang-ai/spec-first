# Directory Structure

This document describes the module organization pattern for backend API development.

## Module Structure

Each API module follows a consistent directory structure:

```
packages/api/modules/[module]/
├── types.ts          # Zod schemas and TypeScript types
├── router.ts         # Hono router with route definitions
├── lib/              # Core business logic (shared across procedures)
│   ├── client.ts     # External service clients
│   └── helpers.ts    # Helper functions
├── procedures/       # HTTP endpoint handlers
│   ├── create.ts
│   ├── update.ts
│   ├── delete.ts
│   └── list.ts
└── api/              # API documentation (optional)
    ├── create.md
    └── list.md
```

## File Responsibilities

### `types.ts` - Schemas and Types

Define all Zod schemas and TypeScript types for the module.

```typescript
// types.ts
import { z } from "zod";

// Input Schemas
export const createOrderInputSchema = z.object({
  customerId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
  })).min(1),
});

// Output Schemas
export const orderResponseSchema = z.object({
  success: z.boolean(),
  reason: z.string(),
  order: z.object({
    id: z.string(),
    status: z.string(),
    total: z.number(),
  }).optional(),
});

// Type exports
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
export type OrderResponse = z.infer<typeof orderResponseSchema>;
```

### `router.ts` - Route Definitions

The router aggregates all procedures and defines the API routes.

```typescript
// router.ts
import { Hono } from "hono";
import { createOrder } from "./procedures/create";
import { listOrders } from "./procedures/list";
import { updateOrderStatus } from "./procedures/update";

export const ordersRouter = new Hono()
  .basePath("/orders")
  .post("/", createOrder)
  .get("/", listOrders)
  .patch("/:id/status", updateOrderStatus);
```

### `lib/` - Business Logic

Contains reusable business logic shared across procedures.

```
lib/
├── client.ts       # External API clients (payment gateway, etc.)
├── helpers.ts      # Pure helper functions
├── validators.ts   # Business rule validators
└── transformers.ts # Data transformation utilities
```

**Example: `lib/helpers.ts`**

```typescript
// lib/helpers.ts
import type { Order } from "../types";

/**
 * Calculate order total with tax
 */
export function calculateOrderTotal(
  items: Array<{ price: number; quantity: number }>,
  taxRate: number = 0.1,
): number {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return subtotal * (1 + taxRate);
}

/**
 * Generate order reference number
 */
export function generateOrderReference(timestamp: Date): string {
  const year = timestamp.getFullYear();
  const month = String(timestamp.getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${year}${month}-${random}`;
}
```

### `procedures/` - Endpoint Handlers

Each procedure handles a single API endpoint with clear responsibilities.

```typescript
// procedures/create.ts
import { db } from "@your-app/database";
import { order as orderTable } from "@your-app/database/drizzle/schema/postgres";
import { logger } from "@your-app/logs";
import { protectedProcedure } from "../../../orpc/procedures";
import { calculateOrderTotal, generateOrderReference } from "../lib/helpers";
import { createOrderInputSchema, orderResponseSchema } from "../types";

export const createOrder = protectedProcedure
  .route({
    method: "POST",
    path: "/orders",
    tags: ["Orders"],
    summary: "Create a new order",
  })
  .input(createOrderInputSchema)
  .output(orderResponseSchema)
  .handler(async ({ input, context: { user } }) => {
    const { customerId, items } = input;

    // Business logic
    const total = calculateOrderTotal(items);
    const reference = generateOrderReference(new Date());

    // Database operation
    const [newOrder] = await db
      .insert(orderTable)
      .values({
        userId: user.id,
        customerId,
        reference,
        total,
        status: "PENDING",
      })
      .returning();

    logger.info("Order created", {
      orderId: newOrder.id,
      userId: user.id,
      total,
    });

    return {
      success: true,
      reason: "Order created successfully",
      order: {
        id: newOrder.id,
        status: newOrder.status,
        total: newOrder.total,
      },
    };
  });
```

### `api/` - Documentation (Optional)

Markdown documentation for each endpoint, useful for complex APIs.

```markdown
<!-- api/create.md -->
# Create Order

## Schema

### Input
- `customerId`: string - Customer identifier
- `items`: array - Order items
  - `productId`: string - Product identifier
  - `quantity`: number - Quantity (min: 1)

### Output
- `success`: boolean
- `reason`: string
- `order`: object (optional)

## Logic

1. Validate user has permission to create orders for the customer
2. Verify all products exist and are in stock
3. Calculate total with applicable discounts
4. Create order record
5. Reserve inventory
6. Return order details

## Usage Example

```typescript
const result = await api.orders.create({
  customerId: "cust_123",
  items: [
    { productId: "prod_456", quantity: 2 },
  ],
});
```
```

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| Procedures | Verb-based | `create.ts`, `list.ts`, `update-status.ts` |
| Lib files | Noun-based | `helpers.ts`, `validators.ts`, `client.ts` |
| Types | Always `types.ts` | `types.ts` |
| Router | Always `router.ts` | `router.ts` |

### Exports

| Type | Convention | Example |
|------|------------|---------|
| Schemas | `{name}Schema` suffix | `createOrderInputSchema` |
| Types | PascalCase | `CreateOrderInput` |
| Procedures | camelCase verb | `createOrder`, `listOrders` |
| Helpers | camelCase verb | `calculateTotal`, `generateReference` |

## When to Create New Modules

Create a new module when:

1. The feature represents a distinct domain entity (users, orders, products)
2. The feature has multiple related operations (CRUD + custom actions)
3. The feature will be reused across multiple routes

Avoid creating modules for:

1. Single-use utility functions (place in existing `lib/`)
2. Simple helpers (place in `@your-app/utils`)
3. Database queries only (place in `packages/database/drizzle/queries/`)
