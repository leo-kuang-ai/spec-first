# oRPC Backend Usage Guidelines

## 1. Overview

### What is oRPC

oRPC (OpenAPI RPC) is a type-safe RPC framework for TypeScript that provides end-to-end type safety from your backend to frontend. It combines the best aspects of REST APIs and RPC frameworks while generating OpenAPI specifications automatically.

### Why oRPC over tRPC or plain REST

| Feature | oRPC | tRPC | REST |
|---------|------|------|------|
| Type Safety | End-to-end | End-to-end | Manual |
| OpenAPI Generation | Built-in | Plugin required | Manual |
| HTTP Method Control | Full control | Limited | Full control |
| Learning Curve | Low | Low | Medium |
| Middleware Support | Native | Native | Framework-dependent |
| Schema Validation | Zod native | Zod native | Manual |

Key advantages of oRPC:
- **OpenAPI-first**: Automatic OpenAPI spec generation for documentation and client generation
- **HTTP semantics**: Full control over HTTP methods, paths, and tags
- **Type inference**: Automatic TypeScript types from Zod schemas
- **Middleware composition**: Chainable middleware for auth, logging, etc.

### Project Structure with oRPC

```
packages/api/
├── orpc/
│   ├── router.ts           # Main router composition
│   ├── procedures.ts       # Base procedure definitions
│   └── middleware/         # Reusable middleware
│       ├── log-id-middleware.ts
│       └── locale-middleware.ts
├── modules/
│   └── [module]/
│       ├── router.ts       # Module router exports
│       ├── types.ts        # Zod schemas and TypeScript types
│       └── procedures/     # Individual procedure implementations
│           ├── create-item.ts
│           ├── list-items.ts
│           └── update-item.ts
└── lib/                    # Shared utilities
```

## 2. Router Setup

### Main Router Structure

The main router composes all module routers under a common prefix:

```typescript
// orpc/router.ts
import type { RouterClient } from "@orpc/server";
import { usersRouter } from "../modules/users/router";
import { itemsRouter } from "../modules/items/router";
import { publicProcedure } from "./procedures";

export const router = publicProcedure
  // Prefix for OpenAPI paths
  .prefix("/api")
  .router({
    users: usersRouter,
    items: itemsRouter,
    // Add more module routers here
  });

// Export type for frontend client
export type ApiRouterClient = RouterClient<typeof router>;
```

### Module Router Composition

Each module exports a router object that groups related procedures:

```typescript
// modules/items/router.ts
import { createItem } from "./procedures/create-item";
import { deleteItem } from "./procedures/delete-item";
import { findItem } from "./procedures/find-item";
import { listItems } from "./procedures/list-items";
import { updateItem } from "./procedures/update-item";

export const itemsRouter = {
  list: listItems,
  find: findItem,
  create: createItem,
  update: updateItem,
  delete: deleteItem,
  // Nested routes are supported
  drafts: {
    list: listDrafts,
    save: saveDraft,
  },
};
```

### Base Procedures with Middleware

Define base procedures with common middleware:

```typescript
// orpc/procedures.ts
import { ORPCError, os } from "@orpc/server";
import { logIdMiddleware } from "./middleware/log-id-middleware";

// Public procedure - no authentication required
export const publicProcedure = os
  .$context<{
    headers: Headers;
  }>()
  .use(logIdMiddleware);

// Protected procedure - requires authentication
export const protectedProcedure = publicProcedure.use(
  async ({ context, next }) => {
    const session = await getSession(context.headers);

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

## 3. Procedure Definition

### Query Procedures (GET-like)

Use GET method for read operations that don't modify data:

```typescript
// modules/items/procedures/list-items.ts
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

// Define input schema
const listItemsInputSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  cursor: z.object({
    createdAt: z.string(),
    id: z.string(),
  }).optional(),
  filters: z.object({
    status: z.enum(["active", "archived"]).optional(),
    category: z.string().optional(),
  }).optional(),
});

// Define output schema
const listItemsOutputSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    status: z.string(),
    createdAt: z.date(),
  })),
  nextCursor: z.object({
    createdAt: z.string(),
    id: z.string(),
  }).nullable(),
  hasMore: z.boolean(),
});

export const listItems = protectedProcedure
  .route({
    method: "GET",
    path: "/items",
    tags: ["Items"],
    summary: "List items with cursor pagination",
    description: "Retrieve a paginated list of items for the current user",
  })
  .input(listItemsInputSchema)
  .output(listItemsOutputSchema)
  .handler(async ({ input, context }) => {
    const { limit, cursor, filters } = input;
    const { user } = context;

    // Query implementation
    const items = await db.query.items.findMany({
      where: { userId: user.id, ...filters },
      limit: limit + 1, // Fetch one extra to check hasMore
      orderBy: [desc(items.createdAt), desc(items.id)],
    });

    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;

    return {
      items: resultItems,
      nextCursor: hasMore && resultItems.length > 0
        ? {
            createdAt: resultItems[resultItems.length - 1].createdAt.toISOString(),
            id: resultItems[resultItems.length - 1].id,
          }
        : null,
      hasMore,
    };
  });
```

### Mutation Procedures (POST/PUT/DELETE-like)

Use POST for create operations, PUT/PATCH for updates, DELETE for removals:

```typescript
// modules/items/procedures/create-item.ts
import { ORPCError } from "@orpc/client";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

const createItemInputSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  categoryId: z.string().optional(),
});

const createItemOutputSchema = z.object({
  item: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    createdAt: z.date(),
  }),
});

export const createItem = protectedProcedure
  .route({
    method: "POST",
    path: "/items",
    tags: ["Items"],
    summary: "Create a new item",
  })
  .input(createItemInputSchema)
  .output(createItemOutputSchema)
  .handler(async ({ input, context }) => {
    const { name, description, categoryId } = input;
    const { user } = context;

    // Validate category if provided
    if (categoryId) {
      const category = await db.query.categories.findFirst({
        where: { id: categoryId, userId: user.id },
      });
      if (!category) {
        throw new ORPCError("NOT_FOUND", {
          message: "Category not found",
        });
      }
    }

    const item = await db.insert(items).values({
      name,
      description,
      categoryId,
      userId: user.id,
    }).returning();

    return { item: item[0] };
  });
```

### Update Procedure Example

```typescript
// modules/items/procedures/update-item.ts
import { ORPCError } from "@orpc/client";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

const updateItemInputSchema = z.object({
  itemId: z.string(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(["active", "archived"]).optional(),
});

export const updateItem = protectedProcedure
  .route({
    method: "PUT",
    path: "/items/{itemId}",
    tags: ["Items"],
    summary: "Update an item",
  })
  .input(updateItemInputSchema)
  .handler(async ({ input, context }) => {
    const { itemId, ...updates } = input;
    const { user } = context;

    // Verify ownership
    const existingItem = await db.query.items.findFirst({
      where: { id: itemId },
    });

    if (!existingItem) {
      throw new ORPCError("NOT_FOUND", { message: "Item not found" });
    }

    if (existingItem.userId !== user.id) {
      throw new ORPCError("FORBIDDEN", {
        message: "You don't have permission to modify this item",
      });
    }

    const updated = await db.update(items)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(items.id, itemId))
      .returning();

    return { item: updated[0] };
  });
```

### Input Validation with Zod

oRPC uses Zod for input validation. Define schemas in a separate `types.ts` file for reusability:

```typescript
// modules/items/types.ts
import { z } from "zod";

// Input Schemas
export const createItemInputSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export const updateItemInputSchema = z.object({
  itemId: z.string(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
});

export const listItemsInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.object({
    createdAt: z.string(),
    id: z.string(),
  }).optional(),
});

// Output Schemas
export const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(["active", "archived"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const operationResultSchema = z.object({
  success: z.boolean(),
});

export const batchOperationResultSchema = z.object({
  success: z.boolean(),
  successCount: z.number(),
  failedCount: z.number(),
  failedIds: z.array(z.string()).optional(),
});

// Type exports (inferred from schemas)
export type CreateItemInput = z.infer<typeof createItemInputSchema>;
export type UpdateItemInput = z.infer<typeof updateItemInputSchema>;
export type ListItemsInput = z.infer<typeof listItemsInputSchema>;
export type Item = z.infer<typeof itemSchema>;
export type OperationResult = z.infer<typeof operationResultSchema>;
```

## 4. Middleware

### Authentication Middleware

Built into `protectedProcedure`:

```typescript
// orpc/procedures.ts
export const protectedProcedure = publicProcedure.use(
  async ({ context, next }) => {
    const session = await getSession(context.headers);

    if (!session) {
      throw new ORPCError("UNAUTHORIZED");
    }

    // Add user info to context for downstream handlers
    return await next({
      context: {
        session: session.session,
        user: session.user,
      },
    });
  },
);
```

### Logging Middleware

Generate and propagate request IDs for tracing:

```typescript
// orpc/middleware/log-id-middleware.ts
import { os } from "@orpc/server";

function generateLogId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

function getOrGenerateLogId(headers: Headers): string {
  // Prefer client-provided x-log-id for distributed tracing
  const existingLogId = headers.get("x-log-id");
  if (existingLogId) {
    return existingLogId;
  }
  return generateLogId();
}

export const logIdMiddleware = os
  .$context<{
    headers: Headers;
  }>()
  .middleware(async ({ context, next }) => {
    const logId = getOrGenerateLogId(context.headers);

    // Run with tracing context
    return await runWithTrace(logId, async () => {
      return await next({
        context: {
          logId,
        },
      });
    });
  });
```

### Locale Middleware

Extract locale from cookies for i18n:

```typescript
// orpc/middleware/locale-middleware.ts
import { os } from "@orpc/server";
import { getCookie } from "@orpc/server/helpers";
import { config } from "@your-app/config";
import type { Locale } from "@your-app/i18n";

export const localeMiddleware = os
  .$context<{
    headers: Headers;
  }>()
  .middleware(async ({ context, next }) => {
    const locale = (getCookie(
      context.headers,
      config.i18n.localeCookieName,
    ) as Locale) ?? config.i18n.defaultLocale;

    return await next({
      context: {
        locale,
      },
    });
  });
```

### Using Middleware in Procedures

Apply middleware to specific procedures:

```typescript
// modules/contact/procedures/submit-contact-form.ts
import { localeMiddleware } from "../../../orpc/middleware/locale-middleware";
import { publicProcedure } from "../../../orpc/procedures";

export const submitContactForm = publicProcedure
  .route({
    method: "POST",
    path: "/contact",
    tags: ["Contact"],
    summary: "Submit contact form",
  })
  .input(contactFormSchema)
  .use(localeMiddleware) // Apply locale middleware
  .handler(async ({ input, context: { locale } }) => {
    // locale is now available in context
    await sendEmail({
      to: config.contactForm.to,
      locale,
      subject: config.contactForm.subject,
      text: `Name: ${input.name}\n\nEmail: ${input.email}\n\nMessage: ${input.message}`,
    });
  });
```

### Error Handling Middleware

Create custom error handling:

```typescript
// orpc/middleware/error-middleware.ts
import { ORPCError, os } from "@orpc/server";
import { logger } from "@your-app/logs";

export const errorMiddleware = os.middleware(async ({ next, path }) => {
  try {
    return await next();
  } catch (error) {
    // Log error with context
    logger.error("Procedure error", {
      path,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Re-throw oRPC errors as-is
    if (error instanceof ORPCError) {
      throw error;
    }

    // Wrap unknown errors
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "An unexpected error occurred",
    });
  }
});
```

## 5. Context

### How to Access User Session

The session is available in context after `protectedProcedure`:

```typescript
export const getProfile = protectedProcedure
  .route({ method: "GET", path: "/users/profile", tags: ["Users"] })
  .handler(async ({ context }) => {
    // context.user contains the authenticated user
    const { user, session } = context;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sessionId: session.id,
    };
  });
```

### How to Access Logger

Use the logger from the shared logs package:

```typescript
import { logger } from "@your-app/logs";

export const createItem = protectedProcedure
  .route({ method: "POST", path: "/items", tags: ["Items"] })
  .input(createItemInputSchema)
  .handler(async ({ input, context }) => {
    logger.info("Creating item", {
      userId: context.user.id,
      itemName: input.name,
    });

    try {
      const item = await db.insert(items).values({
        ...input,
        userId: context.user.id,
      }).returning();

      logger.info("Item created successfully", { itemId: item[0].id });
      return { item: item[0] };
    } catch (error) {
      logger.error("Failed to create item", {
        userId: context.user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create item",
      });
    }
  });
```

### How to Access Database

Import the database client and use it directly:

```typescript
import { db } from "@your-app/database";
import { items, categories } from "@your-app/database/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const listItems = protectedProcedure
  .route({ method: "GET", path: "/items", tags: ["Items"] })
  .handler(async ({ context }) => {
    // Using Drizzle query builder
    const userItems = await db.query.items.findMany({
      where: eq(items.userId, context.user.id),
      orderBy: desc(items.createdAt),
      with: {
        category: true, // Include relations
      },
    });

    // Or using raw select
    const itemsWithCategory = await db
      .select({
        id: items.id,
        name: items.name,
        categoryName: categories.name,
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(eq(items.userId, context.user.id));

    return { items: userItems };
  });
```

## 6. Best Practices

### Input/Output Schema Naming Conventions

Follow consistent naming patterns:

```typescript
// Input schemas: [action][Entity]InputSchema
export const createItemInputSchema = z.object({ ... });
export const updateItemInputSchema = z.object({ ... });
export const listItemsInputSchema = z.object({ ... });
export const deleteItemInputSchema = z.object({ ... });

// Output schemas: [action][Entity]OutputSchema or [entity]Schema
export const itemSchema = z.object({ ... });
export const listItemsOutputSchema = z.object({ ... });
export const operationResultSchema = z.object({ ... });

// Shared/reusable schemas: [entity]Schema or [concept]Schema
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.object({
    createdAt: z.string(),
    id: z.string(),
  }).optional(),
});
```

### Error Handling Patterns

Use appropriate error codes and messages:

```typescript
import { ORPCError } from "@orpc/client";

// Resource not found
throw new ORPCError("NOT_FOUND", {
  message: "Item not found",
});

// Permission denied
throw new ORPCError("FORBIDDEN", {
  message: "You don't have permission to access this resource",
});

// Authentication required
throw new ORPCError("UNAUTHORIZED", {
  message: "Please sign in to continue",
});

// Validation error (usually handled by Zod, but for custom validation)
throw new ORPCError("BAD_REQUEST", {
  message: "Invalid email format",
});

// Conflict (e.g., duplicate entry)
throw new ORPCError("CONFLICT", {
  message: "An item with this name already exists",
});

// Server error (wrap internal errors)
try {
  await externalService.call();
} catch (error) {
  logger.error("External service failed", { error });
  throw new ORPCError("INTERNAL_SERVER_ERROR", {
    message: "Service temporarily unavailable",
  });
}
```

### Procedure Organization

1. **One procedure per file**: Keep procedures focused and testable
2. **Group related procedures**: Use module routers to organize by domain
3. **Reuse schemas**: Define common schemas in `types.ts`
4. **Consistent file naming**: Use kebab-case matching the procedure name

```
modules/items/
├── router.ts              # Exports all procedures
├── types.ts               # Shared schemas and types
└── procedures/
    ├── create-item.ts     # createItem procedure
    ├── delete-item.ts     # deleteItem procedure
    ├── find-item.ts       # findItem procedure
    ├── list-items.ts      # listItems procedure
    └── update-item.ts     # updateItem procedure
```

### Performance Tips

1. **Use cursor pagination** instead of offset for large datasets
2. **Batch database queries** to avoid N+1 problems
3. **Add appropriate indexes** for filtered/sorted columns
4. **Use select** to fetch only needed columns

```typescript
// Avoid N+1 queries - fetch related data in batch
const items = await db.query.items.findMany({
  where: eq(items.userId, user.id),
  limit,
});

// Batch fetch labels for all items
const itemIds = items.map(i => i.id);
const labels = await db.query.itemLabels.findMany({
  where: inArray(itemLabels.itemId, itemIds),
});

// Group labels by itemId
const labelsByItemId = new Map();
for (const label of labels) {
  const existing = labelsByItemId.get(label.itemId) || [];
  existing.push(label);
  labelsByItemId.set(label.itemId, existing);
}

// Combine results
const itemsWithLabels = items.map(item => ({
  ...item,
  labels: labelsByItemId.get(item.id) || [],
}));
```

### Testing Procedures

Structure tests to cover various scenarios:

```typescript
import { describe, expect, it } from "vitest";
import { createCaller } from "../test-utils";

describe("createItem", () => {
  it("creates an item successfully", async () => {
    const caller = createCaller({ user: testUser });

    const result = await caller.items.create({
      name: "Test Item",
      description: "A test item",
    });

    expect(result.item.name).toBe("Test Item");
    expect(result.item.id).toBeDefined();
  });

  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const caller = createCaller({ user: null });

    await expect(
      caller.items.create({ name: "Test" })
    ).rejects.toThrow("UNAUTHORIZED");
  });

  it("validates input schema", async () => {
    const caller = createCaller({ user: testUser });

    await expect(
      caller.items.create({ name: "" }) // Empty name
    ).rejects.toThrow();
  });
});
```
