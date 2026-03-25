# API Module Patterns

> Best practices, common patterns, and anti-patterns.

---

## Best Practices

**DO**:

```typescript
// 1. Always validate inputs with Zod
const input = createWorkspaceInputSchema.parse(await c.req.json());

// 2. Use typed return values
export const createWorkspace: MiddlewareHandler<AppEnv> = async (c) => {
  // ...
  const output: CreateWorkspaceOutput = { success: true, workspace };
  return c.json(output);
};

// 3. Extract reusable logic to lib/
const workspace = await getWorkspaceWithAuth(db, workspaceId, userId);

// 4. Use structured logging
const logger = c.get("logger");
logger.info("workspace_created", { workspaceId });

// 5. Return consistent response format
return c.json({ success: true, workspace });
return c.json({ success: false, reason: "Already exists" }, 409);

// 6. Import types from types.ts
import type { Workspace, CreateWorkspaceInput } from "../types";
```

**DON'T**:

```typescript
// 1. Don't skip validation
export const createWorkspace = async (c) => {
  const body = await c.req.json();  // No validation
  await db.insert(workspaces).values(body);  // Unvalidated input
};

// 2. Don't define types inline
export const createWorkspace = async (
  c,
  input: { name: string; description?: string }  // Define in types.ts
) => { /* ... */ };

// 3. Don't duplicate logic
// Same auth check in every procedure
const workspace = await db.query.workspaces.findFirst(...);
if (!workspace) throw new Error("Not found");
// Check membership...

// Extract to lib/workspace-utils.ts
const workspace = await getWorkspaceWithAuth(db, workspaceId, userId);

// 4. Don't use console.log
console.log("Workspace created");  // Use logger
logger.info("workspace_created", { workspaceId });  // Good

// 5. Don't return inconsistent formats
return workspace;  // Inconsistent
return { success: true, workspace };  // Consistent
```

---

## Common Patterns

### 1. Create Operation

```typescript
export const createEntity: MiddlewareHandler<AppEnv> = async (c) => {
  // 1. Validate
  const data = createInputSchema.parse(await c.req.json());

  // 2. Check duplicates
  const existing = await findExisting(db, data);
  if (existing)
    return c.json({ success: false, reason: "Already exists" }, 409);

  // 3. Create
  const [entity] = await db.insert(table).values(data).returning();

  // 4. Log
  logger.info("entity_created", { id: entity.id });

  // 5. Return
  return c.json({ success: true, entity });
};
```

### 2. List with Filters

```typescript
export const listEntities: MiddlewareHandler<AppEnv> = async (c) => {
  const filters = listInputSchema.parse(c.req.query());

  const whereCondition = getEntitiesWhereCondition(filters);

  const entities = await db.query.entities.findMany({
    where: whereCondition,
    limit: filters.limit,
    offset: filters.offset,
    orderBy: (entities, { desc }) => [desc(entities.createdAt)],
  });

  const total = await db.$count(entitiesTable, whereCondition);

  return c.json({
    success: true,
    entities,
    total,
    limit: filters.limit,
    offset: filters.offset,
  });
};
```

### 3. Update with Authorization

```typescript
export const updateEntity: MiddlewareHandler<AppEnv> = async (c) => {
  const data = updateInputSchema.parse(await c.req.json());
  const user = c.get("user");

  // Verify ownership
  const entity = await getEntityWithAuth(db, data.entityId, user!.id);

  // Update
  const [updated] = await db
    .update(entitiesTable)
    .set(data)
    .where(eq(entitiesTable.id, entity.id))
    .returning();

  return c.json({ success: true, entity: updated });
};
```

### 4. Batch Operation

```typescript
export const batchDelete: MiddlewareHandler<AppEnv> = async (c) => {
  const { entityIds } = batchDeleteInputSchema.parse(await c.req.json());
  const user = c.get("user");

  // Fetch and authorize
  const { authorized, unauthorizedIds } = await fetchAuthorizedEntities(
    db,
    entityIds,
    user!.id,
  );

  // Delete in parallel
  const results = await Promise.allSettled(
    authorized.map((entity) =>
      db.delete(entitiesTable).where(eq(entitiesTable.id, entity.id)),
    ),
  );

  const processed = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - processed;

  return c.json({
    success: true,
    total: entityIds.length,
    processed,
    failed,
    unauthorizedIds,
  });
};
```

---

## Anti-Patterns

### Anti-Pattern 1: Fat Procedures

**Problem**: All logic in procedure, hard to test and reuse.

```typescript
// BAD: 200 lines of logic in procedure
export const createOrder = async (c) => {
  const data = createOrderInputSchema.parse(await c.req.json());

  // 50 lines of validation logic
  if (!validateStock(data.items)) { /* ... */ }
  if (!validatePayment(data.payment)) { /* ... */ }
  if (!validateAddress(data.address)) { /* ... */ }

  // 50 lines of calculation logic
  const subtotal = calculateSubtotal(data.items);
  const tax = calculateTax(subtotal, data.address);
  const shipping = calculateShipping(data.items, data.address);

  // 50 lines of database operations
  const order = await db.insert(ordersTable).values(...);
  await db.insert(orderItemsTable).values(...);
  await db.update(productsTable).set(...);

  // 50 lines of notification logic
  await sendEmailToCustomer(...);
  await sendNotificationToWarehouse(...);

  return c.json({ success: true, order });
};
```

**Solution**: Extract to lib/

```typescript
// GOOD: Procedure orchestrates, lib implements
export const createOrder: MiddlewareHandler<AppEnv> = async (c) => {
  const data = createOrderInputSchema.parse(await c.req.json());

  // Validate (extracted)
  await validateOrderData(data);

  // Calculate (extracted)
  const totals = calculateOrderTotals(data);

  // Create (extracted)
  const order = await createOrderWithItems(db, data, totals);

  // Notify (extracted)
  await notifyOrderCreated(order);

  return c.json({ success: true, order });
};
```

### Anti-Pattern 2: Scattered Types

**Problem**: Types defined in multiple files, hard to maintain.

```typescript
// BAD: Types in procedures
// procedures/create.ts
interface CreateWorkspaceInput {
  name: string;
  description?: string;
}

// procedures/update.ts
interface UpdateWorkspaceInput {
  id: string;
  name: string;
}

// procedures/list.ts
interface ListWorkspacesInput {
  limit: number;
  offset: number;
}
```

**Solution**: Centralize in types.ts

```typescript
// GOOD: All types in types.ts
// types.ts
export const createWorkspaceInputSchema = z.object({ ... });
export const updateWorkspaceInputSchema = z.object({ ... });
export const listWorkspacesInputSchema = z.object({ ... });

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceInputSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceInputSchema>;
export type ListWorkspacesInput = z.infer<typeof listWorkspacesInputSchema>;
```

### Anti-Pattern 3: Missing Validation

**Problem**: Directly use unvalidated input.

```typescript
// BAD: No validation
export const createWorkspace = async (c) => {
  const body = await c.req.json();
  await db.insert(workspaces).values({
    name: body.name, // What if name is missing?
    description: body.description,
  });
};
```

**Solution**: Always validate with Zod

```typescript
// GOOD: Validate first
export const createWorkspace: MiddlewareHandler<AppEnv> = async (c) => {
  const data = createWorkspaceInputSchema.parse(await c.req.json()); // Throws if invalid

  await db.insert(workspaces).values({
    name: data.name, // Guaranteed valid
    description: data.description, // Type-safe
  });
};
```

---

## Quick Reference

### Response Formats

| Operation | Success Response                                       | Error Response                            |
| --------- | ------------------------------------------------------ | ----------------------------------------- |
| Create    | `{ success: true, entity: {...} }`                     | `{ success: false, reason: "..." }`       |
| Get       | `{ success: true, entity: {...} }`                     | `{ success: false, reason: "Not found" }` |
| List      | `{ success: true, entities: [...], total: N }`         | `{ success: false, reason: "..." }`       |
| Update    | `{ success: true, entity: {...} }`                     | `{ success: false, reason: "..." }`       |
| Delete    | `{ success: true }`                                    | `{ success: false, reason: "..." }`       |
| Batch     | `{ success: true, total: N, processed: N, failed: N }` | `{ success: false, reason: "..." }`       |

### HTTP Status Codes

| Status | Use Case                         |
| ------ | -------------------------------- |
| 200    | Successful operation             |
| 201    | Resource created                 |
| 400    | Invalid input (validation error) |
| 401    | Unauthorized (not logged in)     |
| 403    | Forbidden (no permission)        |
| 404    | Resource not found               |
| 409    | Conflict (duplicate)             |
| 500    | Internal server error            |
