# PostgreSQL JSON vs JSONB Type Issues with Drizzle ORM

## Problem

Database queries using PostgreSQL's `jsonb_*` functions fail with type errors, even though the column appears to store JSON data correctly.

**Error message:**
```
function jsonb_array_elements(json) does not exist
HINT: No function matches the given name and argument types.
You might need to add explicit type casts.
```

**Additional symptoms:**
- Raw SQL queries fail to find columns with camelCase names
- JSON aggregation functions return unexpected results

## Root Cause

### Issue 1: Drizzle's `json()` Maps to PostgreSQL `json`, Not `jsonb`

When defining a JSON column in Drizzle ORM:

```typescript
// Drizzle schema definition
export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  metadata: json("metadata"), // Creates PostgreSQL 'json' type, NOT 'jsonb'
});
```

PostgreSQL has two JSON types with different characteristics:

| Feature | `json` | `jsonb` |
|---------|--------|---------|
| Storage | Text (preserves whitespace, key order) | Binary (normalized) |
| Functions | `json_*` functions only | `jsonb_*` functions only |
| Indexing | Limited | GIN indexes supported |
| Performance | Slower for operations | Faster for operations |

The `jsonb_*` functions (like `jsonb_array_elements`, `jsonb_extract_path`) **only work with `jsonb` type**.

### Issue 2: Column Name Case Sensitivity

PostgreSQL treats unquoted identifiers as lowercase. If your column uses camelCase:

```sql
-- This fails (looks for column named 'metadata' in lowercase)
SELECT metadata->>'userId' FROM orders;

-- Column is actually named "metaData" with exact case
SELECT "metaData"->>'userId' FROM orders;
```

## Solution

### Solution 1: Use Type Cast for jsonb Functions

Add `::jsonb` type cast before using jsonb functions:

```typescript
// Before (fails)
const result = await db.execute(sql`
  SELECT jsonb_array_elements(items) as item
  FROM orders
  WHERE id = ${orderId}
`);

// After (works)
const result = await db.execute(sql`
  SELECT jsonb_array_elements(items::jsonb) as item
  FROM orders
  WHERE id = ${orderId}
`);
```

### Solution 2: Define Column as `jsonb` in Schema

If you need jsonb functionality frequently, define the column as jsonb:

```typescript
import { pgTable, text, jsonb } from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  metadata: jsonb("metadata"), // Now uses PostgreSQL 'jsonb' type
});
```

**Note:** This requires a migration if the column already exists.

### Solution 3: Quote camelCase Column Names in Raw SQL

Always use double quotes for camelCase column names:

```typescript
// Before (fails - column not found)
const result = await db.execute(sql`
  SELECT "userId", createdAt
  FROM orders
`);

// After (works)
const result = await db.execute(sql`
  SELECT "userId", "createdAt"
  FROM orders
`);
```

### Complete Example: Querying JSON Array Data

```typescript
import { sql } from "drizzle-orm";

// Table with json column storing an array of items
// items: [{ "productId": "123", "quantity": 2 }, ...]

// Query to find orders containing a specific product
async function findOrdersWithProduct(productId: string) {
  const result = await db.execute(sql`
    SELECT
      o.id,
      o."createdAt",
      item->>'productId' as "productId",
      (item->>'quantity')::int as quantity
    FROM orders o,
    jsonb_array_elements(o.items::jsonb) as item
    WHERE item->>'productId' = ${productId}
  `);

  return result.rows;
}

// Query to aggregate JSON array data
async function getOrderItemStats(orderId: string) {
  const result = await db.execute(sql`
    SELECT
      COUNT(*) as "itemCount",
      SUM((item->>'quantity')::int) as "totalQuantity"
    FROM orders o,
    jsonb_array_elements(o.items::jsonb) as item
    WHERE o.id = ${orderId}
  `);

  return result.rows[0];
}
```

### Best Practice: Create a Helper for JSON Queries

```typescript
// utils/db-helpers.ts
import { sql, SQL } from "drizzle-orm";

/**
 * Wraps a column reference with ::jsonb cast for use with jsonb functions
 */
export function asJsonb(column: SQL | string): SQL {
  if (typeof column === "string") {
    return sql.raw(`"${column}"::jsonb`);
  }
  return sql`${column}::jsonb`;
}

// Usage
const result = await db.execute(sql`
  SELECT jsonb_array_elements(${asJsonb("items")}) as item
  FROM orders
`);
```

## Key Takeaways

1. **Know the difference between `json` and `jsonb`**
   - `json`: Text storage, use `json_*` functions
   - `jsonb`: Binary storage, use `jsonb_*` functions, better performance

2. **Drizzle's `json()` creates PostgreSQL `json` type** - use `jsonb()` if you need jsonb functionality

3. **Always add `::jsonb` cast** when using jsonb functions with json columns

4. **Quote camelCase identifiers** in raw SQL queries with double quotes

5. **Prefer Drizzle's query builder** over raw SQL when possible to avoid these issues

6. **Test raw SQL queries** directly in a PostgreSQL client before using in code

## Related Resources

- [PostgreSQL JSON Types Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
- [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)
- [Drizzle ORM PostgreSQL Column Types](https://orm.drizzle.team/docs/column-types/pg)
