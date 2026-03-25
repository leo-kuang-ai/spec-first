# Database Guidelines (Drizzle + Edge SQLite)

> Database patterns for Cloudflare Workers with edge-compatible SQLite databases.

---

## Critical Version Requirements

> **CRITICAL**: These version constraints MUST be followed to avoid runtime errors. Always check the latest compatibility notes for your chosen database provider before pinning versions.

| Package | Recommended | Notes |
|---------|-------------|-------|
| `@libsql/client` | Latest compatible version | Check compatibility with your Vite/bundler setup; some versions use Node.js `https.request` which fails with Vite+unenv (e.g., Turso, PlanetScale, or other edge DB) |
| `drizzle-orm` | `^0.38.0` | Stable with libsql |
| `drizzle-kit` | `^0.30.0` | Compatible with drizzle-orm |

**Why check @libsql/client compatibility?**

Some versions of `@libsql/client` use Node.js `https` module internally, which is not fully implemented in Vite's `unenv` polyfills. This causes the error:

```
[unenv] https.request is not implemented yet!
```

This error occurs during local development with `vite dev` when using Cloudflare Workers mode.

**Connection Pattern:**

```typescript
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export function createDb(env: DatabaseEnv): LibSQLDatabase<typeof schema> {
  // Embed authToken in URL for compatibility with certain @libsql/client versions
  const url = `${env.DATABASE_URL}?authToken=${env.DATABASE_AUTH_TOKEN}`;
  const client: Client = createClient({ url });
  return drizzle(client, { schema });
}
```

---

## Overview

Drizzle ORM is a TypeScript ORM that provides type-safe database access with a SQL-like syntax. When paired with an edge-compatible SQLite database (e.g., Turso, PlanetScale, or other libSQL-powered services), it provides an excellent serverless database solution for Cloudflare Workers.

## No Await in Loops

```typescript
// Good - parallel execution
const results = await Promise.all(
  ids.map((id) => db.query.users.findFirst({ where: eq(users.id, id) })),
);

// Bad - sequential execution
for (const id of ids) {
  await db.query.users.findFirst({ where: eq(users.id, id) });
}
```

## Batch Operations

```typescript
// Use batch insert with conflict handling
await db
  .insert(users)
  .values(data)
  .onConflictDoUpdate({
    target: users.id,
    set: { updatedAt: new Date() },
  });
```

## Installation

```bash
# Install dependencies
# NOTE: Check @libsql/client version compatibility with your bundler before installing
pnpm add drizzle-orm @libsql/client
pnpm add -D drizzle-kit
```

## Environment Variables

```bash
# .dev.vars (local development)
# DATABASE_URL supports various edge DB providers (e.g., Turso, PlanetScale, or other edge DB)
DATABASE_URL=libsql://your-database-url
DATABASE_AUTH_TOKEN=your-auth-token
```

## Drizzle Configuration

```typescript
// drizzle.config.ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN!,
  },
});
```

## Database Connection (Cloudflare Workers)

```typescript
// src/db/index.ts
import { drizzle } from "drizzle-orm/libsql";
import { createClient, type Client } from "@libsql/client";
import * as schema from "./schema";

interface DatabaseEnv {
  DATABASE_URL: string;
  DATABASE_AUTH_TOKEN: string;
}

// For Cloudflare Workers - create db instance per request
// NOTE: Use URL with embedded authToken for @libsql/client compatibility
export function createDb(env: DatabaseEnv) {
  const url = `${env.DATABASE_URL}?authToken=${env.DATABASE_AUTH_TOKEN}`;
  const client: Client = createClient({ url });
  return drizzle(client, { schema });
}
```

Alternative: Use `drizzle-orm/libsql/web` for edge environments:

```typescript
import { drizzle } from "drizzle-orm/libsql/web";

const db = drizzle({
  connection: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
});
```

## Schema Definition

```typescript
// src/db/schema.ts
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

// Use snake_case for database columns
export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("users_email_idx").on(table.email)],
);

// Type inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

## Reusable Timestamp Columns

```typescript
// src/db/columns.ts
import { integer } from "drizzle-orm/sqlite-core";

export const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
};

// Usage in schema
export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  ...timestamps,
});
```

## Basic Queries

```typescript
import { eq, and, or, like, desc, asc } from "drizzle-orm";
import { users } from "./schema";

// Select all
const allUsers = await db.select().from(users);

// Select with filter
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, "user@example.com"))
  .get();

// Select specific columns
const names = await db.select({ name: users.name }).from(users);

// Insert single
const newUser = await db
  .insert(users)
  .values({ name: "John", email: "john@example.com" })
  .returning();

// Insert multiple
await db.insert(users).values([
  { name: "Alice", email: "alice@example.com" },
  { name: "Bob", email: "bob@example.com" },
]);

// Update
await db.update(users).set({ name: "Updated Name" }).where(eq(users.id, 1));

// Delete
await db.delete(users).where(eq(users.id, 1));
```

## Conflict Handling (Upsert)

```typescript
// Insert or update on conflict
await db
  .insert(users)
  .values({ id: 1, name: "John", email: "john@example.com" })
  .onConflictDoUpdate({
    target: users.id,
    set: { name: "John Updated", updatedAt: new Date() },
  });

// Insert or ignore
await db
  .insert(users)
  .values({ email: "existing@example.com", name: "Test" })
  .onConflictDoNothing();
```

## Transactions

```typescript
// Basic transaction
const result = await db.transaction(async (tx) => {
  const user = await tx
    .insert(users)
    .values({ name: "Alice", email: "alice@example.com" })
    .returning()
    .get();

  await tx.insert(posts).values({ title: "First Post", userId: user.id });

  return user;
});

// Transaction with rollback
await db.transaction(async (tx) => {
  await tx.insert(users).values({ name: "Test", email: "test@example.com" });

  // Rollback if condition fails
  if (someConditionFails) {
    tx.rollback();
  }
});
```

## Aggregations

```typescript
import { count, sum, avg, min, max } from "drizzle-orm";

// Count
const userCount = await db.select({ count: count() }).from(users);

// Group by with aggregation
const stats = await db
  .select({
    status: users.status,
    count: count(),
  })
  .from(users)
  .groupBy(users.status);
```

## Type-Safe Filters

```typescript
import {
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  like,
  between,
  inArray,
  isNull,
  isNotNull,
  and,
  or,
  not,
} from "drizzle-orm";

// Multiple conditions
const results = await db
  .select()
  .from(users)
  .where(
    and(
      eq(users.status, "active"),
      gte(users.age, 18),
      or(like(users.name, "%John%"), like(users.name, "%Jane%")),
    ),
  );

// In array
const selectedUsers = await db
  .select()
  .from(users)
  .where(inArray(users.id, [1, 2, 3]));
```

## Ordering and Pagination

```typescript
// Order by
const sorted = await db
  .select()
  .from(users)
  .orderBy(desc(users.createdAt), asc(users.name));

// Pagination
const page = 1;
const pageSize = 10;
const paginated = await db
  .select()
  .from(users)
  .limit(pageSize)
  .offset((page - 1) * pageSize);
```

## CLI Commands

```bash
# Generate migration files
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit migrate

# Push schema changes directly (dev only)
npx drizzle-kit push

# Pull schema from database
npx drizzle-kit pull

# Open Drizzle Studio (database viewer)
npx drizzle-kit studio
```

## Recommended Scripts

```json
// package.json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## Cloudflare Workers Pitfalls & Solutions

> **Critical**: Drizzle + edge SQLite + Cloudflare Workers is officially supported, but has specific pitfalls that require careful handling.

### Pitfall 0: @libsql/client Version Compatibility (MOST COMMON)

**Problem:** `[unenv] https.request is not implemented yet!` error during local development.

**Cause:** Some `@libsql/client` versions use Node.js `https` module which isn't implemented in Vite's `unenv` polyfills.

**Solution:**

```bash
# Check compatibility with your bundler before installing
# Pin to a known working version if you encounter the unenv error
pnpm add @libsql/client
```

```typescript
// Use URL with embedded authToken for compatibility
const url = `${env.DATABASE_URL}?authToken=${env.DATABASE_AUTH_TOKEN}`;
const client = createClient({ url });
```

### Pitfall 1: Workers Has No TCP - Use Correct Driver

Cloudflare Workers don't have traditional TCP. The default `@libsql/client` auto-detects the environment, but it's safer to be explicit.

**Solution:**

```typescript
// Good - Explicit edge-compatible driver
import { drizzle } from "drizzle-orm/libsql/http";
import { createClient } from "@libsql/client/http";

// OR use the /web variant
import { drizzle } from "drizzle-orm/libsql/web";
import { createClient } from "@libsql/client/web";

// Bad - Relying on auto-detection
import { createClient } from "@libsql/client"; // May pick wrong driver
```

### Pitfall 2: drizzle-kit Runs in Node - No import.meta.env

`drizzle-kit generate/migrate` runs in Node.js, not your bundler. Using `import.meta.env` will fail with:

> `"import.meta" is not available with the "cjs" output format`

**Solution:**

```typescript
// drizzle.config.ts - Always use dotenv + process.env
import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
    authToken: process.env.DATABASE_AUTH_TOKEN ?? "",
  },
});
```

**Key Rule**: Treat migrations as a Node-only toolchain, completely separate from Workers runtime code.

### Pitfall 3: Drizzle Migrations Can't Rollback

Drizzle has no official rollback mechanism. If a migration goes wrong, you must manually write SQL to fix it.

**Solution:**

- Test migrations thoroughly on `dev` database first
- Use environment separation: `dev -> staging -> prod`
- Never modify committed migration files (create new migrations instead)
- Freeze migrations before merging to main branch
- Keep migrations small and atomic

```bash
# Migration workflow
drizzle-kit generate  # Create migration
drizzle-kit push      # Test on dev (quick iteration)
drizzle-kit migrate   # Apply to staging/prod (via CI)
```

### Pitfall 4: Cold Start Latency (Workers + Edge DB)

First request may take 5-10 seconds due to combined cold starts:

- Cloudflare Workers cold start
- Edge database cold start

**Solution:**

- Keep first-screen database queries minimal
- Use client-side caching where possible
- Consider multi-region replication for lower latency

```typescript
// Good - Minimize cold start impact
app.get("/api/health", (c) => c.json({ ok: true })); // No DB call

// Bad - Heavy DB query on first request
app.get("/", async (c) => {
  const allData = await db.select().from(hugeTable); // Cold start + large query
});
```

### Pitfall 5: Workers Runtime Limits

Cloudflare Workers has strict limits:

- CPU time per request (10-50ms on free, 30s on paid)
- Request body size (100MB max)
- **Subrequest limit: 50 per request (Free tier)**

**Subrequest Limit Details:**

Each of these counts as 1 subrequest:

- Database query (HTTP-based like libsql)
- Fetch to external API
- KV read/write
- R2 read/write

**Critical for SSE/Long Connections:**

SSE connections with DB polling will hit the 50 subrequest limit:

- 3s polling -> 50 queries in ~2.5 minutes -> all subsequent queries FAIL
- 5s polling -> 50 queries in ~4 minutes -> all subsequent queries FAIL

**Pattern: Force SSE Reconnection Before Limit**

```typescript
const POLL_INTERVAL_MS = 5000;           // 5s between polls
const MAX_CONNECTION_MS = 2 * 60 * 1000; // 2 min max connection
const MAX_POLLS = 40;                    // Stay under 50 limit

app.get('/api/sse', async (c) => {
  return streamSSE(c, async (stream) => {
    let pollCount = 0;

    while (isRunning) {
      pollCount++;

      // Force reconnection before hitting limit
      if (pollCount >= MAX_POLLS) {
        logger.info("sse_max_polls_reached");
        break;  // Client will auto-reconnect
      }

      // DB query (1 subrequest)
      const db = getDb(c.env);  // Fresh connection each poll
      const events = await db.query.events.findMany({ ... });

      await stream.sleep(POLL_INTERVAL_MS);
    }
  });
});
```

**Solution:**

```typescript
// Good - Paginated queries
const getItems = async (page: number, pageSize = 50) => {
  return db
    .select()
    .from(items)
    .limit(pageSize)
    .offset((page - 1) * pageSize);
};

// Bad - Fetching entire table
const getAllItems = async () => {
  return db.select().from(items); // May exceed limits
};

// Good - Parallel queries
const [users, posts] = await Promise.all([
  db.select().from(usersTable),
  db.select().from(postsTable),
]);

// Bad - Sequential queries in loop
for (const id of ids) {
  await db.select().from(users).where(eq(users.id, id)); // N+1 problem
}
```

### Pitfall 6: Build Environment Mismatch

Local Node/pnpm versions may differ from Cloudflare's build environment, causing failures.

**Solution:**

```json
// package.json - Pin versions
{
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

```toml
# wrangler.toml or Cloudflare Dashboard
# Set environment variables:
# NODE_VERSION=20.17.0
# PNPM_VERSION=9.9.0
```

### Pitfall 7: Version Compatibility

Drizzle ORM, drizzle-kit, and @libsql/client versions must be compatible. Breaking changes happen frequently.

**Solution:**

```json
// package.json - Lock exact versions
{
  "dependencies": {
    "drizzle-orm": "0.38.0",
    "@libsql/client": "0.15.15"
  },
  "devDependencies": {
    "drizzle-kit": "0.30.0"
  }
}
```

- Don't use `^` or `~` for these packages
- Test upgrades on dev environment first
- Check Drizzle changelog before upgrading

---

## DB Operations Best Practices

> **Critical**: Following these patterns will prevent performance issues and ensure clean, maintainable code.

### 1. Batch API - Execute Multiple Queries in Single Round-Trip

Drizzle supports batch operations for SQLite/libSQL drivers. Use `db.batch()` to execute multiple queries atomically:

```typescript
import { eq } from "drizzle-orm";

// Good - Single round-trip for multiple operations
const results = await db.batch([
  db.insert(users).values({ name: "Alice", email: "alice@example.com" }),
  db.insert(users).values({ name: "Bob", email: "bob@example.com" }),
  db.update(users).set({ status: "active" }).where(eq(users.id, 1)),
  db.select().from(users).where(eq(users.status, "active")),
]);

// results is typed as tuple matching the queries
const [insertResult1, insertResult2, updateResult, selectResult] = results;
```

### 2. Avoid N+1 Queries - Use inArray Instead of Loop

The most common performance killer in ORMs. Never query in a loop:

```typescript
import { inArray, eq } from "drizzle-orm";

// Bad - N+1 problem (100 queries for 100 IDs)
for (const id of userIds) {
  const user = await db.select().from(users).where(eq(users.id, id)).get();
  // Process user...
}

// Good - Single query with inArray
const allUsers = await db
  .select()
  .from(users)
  .where(inArray(users.id, userIds));

// Good - Use Map for O(1) lookup
const userMap = new Map(allUsers.map((u) => [u.id, u]));
for (const id of userIds) {
  const user = userMap.get(id);
  // Process user...
}
```

### 2.1. Avoid Promise.all with N Concurrent Queries (Cloudflare Workers)

**CRITICAL for Cloudflare Workers**: Workers have a **6 concurrent connection limit**. Using `Promise.all` with many parallel queries will fail silently or throw connection errors.

```typescript
// BAD - Promise.all creates N concurrent connections (FAILS in Workers when N > ~20)
const entries = await Promise.all(
  children.map(async (child) => {
    const row = await db.query.items.findFirst({...}); // Query 1
    return { isDirectory: row?.type === "folder" };
  })
);
// With 25 children = 25 concurrent queries -> exceeds Workers limit -> CRASH

// GOOD - Batch query using inArray (1 query)
const childIds = children.map((c) => c.id);

// Query: Fetch types for all children
const childTypes = await db.query.items.findMany({
  where: inArray(items.id, childIds),
  columns: { id: true, type: true },
});
const folderIds = new Set(
  childTypes.filter((row) => row.type === "folder").map((row) => row.id),
);

// Build result using Set (O(1) lookup)
const entries = children.map((child) => ({
  isDirectory: folderIds.has(child.id),
}));
```

**Key Insight**: `Promise.all` with N queries is just as bad as N queries in a loop - both create N database round-trips. The solution is always to batch into fewer queries using `inArray`.

**When you see this pattern, refactor it**:

- `Promise.all(items.map(async (item) => db.query.*.findFirst({...})))`
- `for (const item of items) { await db.query... }`

### 3. Bulk Insert - Insert Multiple Rows in Single Query

```typescript
// Bad - Multiple insert queries
for (const userData of usersData) {
  await db.insert(users).values(userData);
}

// Good - Single insert with array of values
await db.insert(users).values(usersData);

// Good - Chunked insert for large datasets
async function batchInsert<T>(table: any, data: T[], chunkSize = 500) {
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    await db.insert(table).values(chunk);
  }
}

await batchInsert(users, largeUserArray, 500);
```

### 4. Bulk Update - Update Multiple Rows Efficiently

```typescript
import { SQL, inArray, sql } from "drizzle-orm";

// Bad - Multiple update queries
for (const update of updates) {
  await db
    .update(users)
    .set({ city: update.city })
    .where(eq(users.id, update.id));
}

// Good - Use Promise.all with concurrency control
async function batchUpdate(updates: Array<{ id: number; city: string }>) {
  const CONCURRENCY = 10;
  for (let i = 0; i < updates.length; i += CONCURRENCY) {
    const batch = updates.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(({ id, city }) =>
        db.update(users).set({ city }).where(eq(users.id, id)),
      ),
    );
  }
}

// Best - Single SQL with CASE statement (most efficient)
const updates = [
  { id: 1, city: "New York" },
  { id: 2, city: "Los Angeles" },
  { id: 3, city: "Chicago" },
];

if (updates.length > 0) {
  const sqlChunks: SQL[] = [];
  const ids: number[] = [];

  sqlChunks.push(sql`(case`);
  for (const { id, city } of updates) {
    sqlChunks.push(sql`when ${users.id} = ${id} then ${city}`);
    ids.push(id);
  }
  sqlChunks.push(sql`end)`);

  const caseStatement = sql.join(sqlChunks, sql.raw(" "));
  await db
    .update(users)
    .set({ city: caseStatement, updatedAt: new Date() })
    .where(inArray(users.id, ids));
}
```

### 5. Prepared Statements - Reuse Query Plans

For frequently executed queries, use prepared statements to skip query parsing:

```typescript
import { sql } from "drizzle-orm";

// Good - Prepare once, execute many times
const getUserById = db
  .select()
  .from(users)
  .where(eq(users.id, sql.placeholder("id")))
  .prepare();

// Reuse the prepared statement
await getUserById.execute({ id: 10 });
await getUserById.execute({ id: 20 });
await getUserById.execute({ id: 30 });

// Good - Prepared statement with multiple placeholders
const searchUsers = db
  .select()
  .from(users)
  .where(sql`lower(${users.name}) like ${sql.placeholder("name")}`)
  .prepare();

await searchUsers.execute({ name: "%john%" });
```

### 6. Transactions - Atomic Operations

Use transactions for operations that must succeed or fail together:

```typescript
// Good - Atomic balance transfer
await db.transaction(async (tx) => {
  await tx
    .update(accounts)
    .set({ balance: sql`${accounts.balance} - 100` })
    .where(eq(accounts.userId, fromUserId));

  await tx
    .update(accounts)
    .set({ balance: sql`${accounts.balance} + 100` })
    .where(eq(accounts.userId, toUserId));
});

// Good - Transaction with rollback on error
await db.transaction(async (tx) => {
  const user = await tx
    .insert(users)
    .values({ name: "Alice", email: "alice@example.com" })
    .returning()
    .get();

  // If this fails, user insert is also rolled back
  await tx.insert(profiles).values({ userId: user.id, bio: "Hello!" });

  return user;
});

// Good - Manual rollback on business logic failure
await db.transaction(async (tx) => {
  const balance = await tx
    .select({ balance: accounts.balance })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .get();

  if (!balance || balance.balance < 100) {
    tx.rollback(); // Explicitly rollback
    return;
  }

  await tx
    .update(accounts)
    .set({ balance: sql`${accounts.balance} - 100` })
    .where(eq(accounts.id, accountId));
});
```

### 7. Use JOINs Instead of Multiple Queries

```typescript
// Bad - Two separate queries
const users = await db.select().from(usersTable);
const posts = await db.select().from(postsTable);
// Then manually join in JS...

// Good - Single query with JOIN
const usersWithPosts = await db
  .select()
  .from(usersTable)
  .leftJoin(postsTable, eq(postsTable.userId, usersTable.id));

// Good - Select specific columns from join
const userPostData = await db
  .select({
    userName: usersTable.name,
    postTitle: postsTable.title,
    postCreatedAt: postsTable.createdAt,
  })
  .from(usersTable)
  .leftJoin(postsTable, eq(postsTable.userId, usersTable.id));
```

### 8. Use SQL Expressions for Server-Side Computation

```typescript
import { sql } from "drizzle-orm";

// Bad - Fetch all, compute in JS
const allOrders = await db.select().from(orders);
const total = allOrders.reduce((sum, o) => sum + o.amount, 0);

// Good - Compute on database server
const [{ total }] = await db
  .select({ total: sql<number>`sum(${orders.amount})` })
  .from(orders);

// Good - Use database functions
await db
  .update(users)
  .set({
    updatedAt: sql`CURRENT_TIMESTAMP`,
    loginCount: sql`${users.loginCount} + 1`,
  })
  .where(eq(users.id, userId));
```

### 9. Pagination Best Practices

```typescript
// Good - Offset pagination (simple, good for small datasets)
const page = 2;
const pageSize = 20;
const users = await db
  .select()
  .from(usersTable)
  .orderBy(desc(usersTable.createdAt))
  .limit(pageSize)
  .offset((page - 1) * pageSize);

// Better - Cursor pagination (more efficient for large datasets)
const getUsersAfterCursor = async (cursor: Date | null, limit = 20) => {
  return db
    .select()
    .from(usersTable)
    .where(cursor ? lt(usersTable.createdAt, cursor) : undefined)
    .orderBy(desc(usersTable.createdAt))
    .limit(limit);
};

// Usage
const firstPage = await getUsersAfterCursor(null);
const lastCreatedAt = firstPage[firstPage.length - 1]?.createdAt;
const secondPage = await getUsersAfterCursor(lastCreatedAt);
```

### 10. Index Your Queries

Always define indexes on columns used in WHERE, JOIN, and ORDER BY clauses:

```typescript
import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull().unique(),
    status: text("status").notNull().default("active"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    // Single column index
    index("users_status_idx").on(table.status),
    // Composite index for common query pattern
    index("users_status_created_idx").on(table.status, table.createdAt),
    // Unique index
    uniqueIndex("users_email_unique_idx").on(table.email),
  ],
);
```

---

## Avoid

**Cloudflare Workers Specific:**

- Using incompatible `@libsql/client` versions (check bundler compatibility)
- Creating global db instance in Cloudflare Workers (env not available)
- Using `import.meta.env` in `drizzle.config.ts` (use dotenv)
- Relying on auto-detected libsql driver (be explicit: use `/http` or `/web`)
- Fetching large datasets in single request (paginate, Workers has limits)

**Query Anti-Patterns:**

- Using `await` in loops for database operations (N+1 problem)
- Multiple individual inserts (use bulk insert with `.values([...])`)
- Multiple individual updates (use batch API or CASE statement)
- Fetching all data then filtering in JS (use WHERE clause)
- Computing aggregates in JS (use SQL SUM/COUNT/AVG)
- Multiple queries when JOIN would work
- Using offset pagination for large datasets (use cursor pagination)
- Missing indexes on frequently queried columns

**General:**

- Forgetting to handle null values from `.get()` method
- Using `.all()` when expecting single result (use `.get()`)
- Hardcoding database credentials (use environment variables)
- Skipping migrations in production (use `drizzle-kit migrate`)
- Modifying committed migration files (create new ones)

## libSQL Client Variants

| Module                | Use Case                   | Workers Compatible |
| --------------------- | -------------------------- | ------------------ |
| `@libsql/client`      | Auto-detect (node/web)     | May fail           |
| `@libsql/client/web`  | Edge/serverless            | Recommended        |
| `@libsql/client/http` | HTTP/HTTPS connections     | Recommended        |
| `@libsql/client/node` | Node.js with all protocols | Not for Workers    |

## Reference

- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Turso Docs](https://docs.turso.tech)
- [libSQL Client](https://github.com/libsql/libsql-client-ts)
- [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)
- [Cloudflare Workers + Turso Tutorial](https://developers.cloudflare.com/workers/tutorials/connect-to-turso-using-workers/)
