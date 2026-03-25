# Timestamp Specification

> **Rule**: All timestamps use **Unix milliseconds (integer)** throughout the entire stack.

---

## Full-Stack Timestamp Flow

```
[Edge Database]
    | INTEGER (Unix milliseconds)
    v
[Drizzle ORM]
    | mode: 'timestamp_ms' -> Date object
    v
[Application Logic]
    | Date.getTime() -> number
    v
[API Response / Storage]
    | number (Unix milliseconds)
```

---

## Layer-by-Layer Specification

### 1. Database Schema

#### SQLite / Turso (default for this stack)

```typescript
// Use mode: 'timestamp_ms' for Drizzle to handle Date conversion
createdAt: integer("createdAt", { mode: "timestamp_ms" })
  .notNull()
  .default(sql`(unixepoch() * 1000)`),

updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
  .notNull()
  .default(sql`(unixepoch() * 1000)`),
```

**Key points**:

- Store as INTEGER in SQLite/Turso (milliseconds since epoch)
- `mode: 'timestamp_ms'` makes Drizzle return `Date` objects when reading
- Default value uses `unixepoch() * 1000` SQL expression to generate current time in milliseconds
- `unixepoch()` is a SQLite function that returns seconds since epoch; multiply by 1000 for milliseconds

#### PostgreSQL alternative

If using PostgreSQL instead of SQLite/Turso, use `timestamp` columns with Drizzle:

```typescript
import { timestamp } from "drizzle-orm/pg-core";

createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
  .notNull()
  .defaultNow(),

updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
  .notNull()
  .defaultNow(),
```

With PostgreSQL, Drizzle returns `Date` objects natively. The application logic layer (`.getTime()`) remains the same regardless of database engine.

### 2. Application Logic

```typescript
// date-utils.ts

/** Current time in milliseconds */
export function nowMillis(): number {
  return Date.now();
}

/** Convert Date to Unix milliseconds */
export function toUnixMillis(date: Date): number {
  return date.getTime();
}

/** Convert Unix milliseconds to Date */
export function fromUnixMillis(millis: number): Date {
  return new Date(millis);
}
```

**Note**: `Date.now()` works correctly in Cloudflare Workers environment.

### 3. Type Schemas

```typescript
// Zod schemas for timestamps
export const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  // Use z.number() for timestamps
  createdAt: z.number(), // Unix milliseconds
  updatedAt: z.number(), // Unix milliseconds
});

// Nullable timestamps
export const scheduleSchema = z.object({
  scheduledAt: z.number().nullable(), // Unix milliseconds or null
  createdAt: z.number(),
});
```

### 4. Response Formatting

```typescript
// In procedure handlers

// CORRECT - Use .getTime()
return {
  success: true,
  item: {
    id: result.id,
    name: result.name,
    createdAt: result.createdAt.getTime(), // number
    updatedAt: result.updatedAt.getTime(), // number
  },
};

// WRONG - Never use .toISOString() in data responses
return {
  item: {
    createdAt: result.createdAt.toISOString(), // string - FORBIDDEN
  },
};
```

---

## Prohibited Patterns

### Using toISOString() in Data

```typescript
// FORBIDDEN
createdAt: item.createdAt.toISOString();
```

### Using z.string().datetime() in Schemas

```typescript
// FORBIDDEN
createdAt: z.string().datetime();
```

### Mixing Seconds and Milliseconds

```typescript
// FORBIDDEN - inconsistent units
{
  createdAt: Math.floor(Date.now() / 1000),  // seconds
  updatedAt: Date.now(),                      // milliseconds
}
```

---

## Exceptions

These scenarios may use non-numeric formats:

| Scenario      | Format           | Reason          |
| ------------- | ---------------- | --------------- |
| Log output    | ISO string       | Human readable  |
| Display in UI | Formatted string | User experience |
| Debug output  | ISO string       | Debugging       |

---

## Checklist for New Features

When adding timestamps:

- [ ] Schema uses `z.number()` for timestamps
- [ ] Database uses `{ mode: 'timestamp_ms' }`
- [ ] Response uses `.getTime()` not `.toISOString()`
- [ ] SQL default uses `(unixepoch() * 1000)` for SQLite/Turso or `defaultNow()` for PostgreSQL

---

## Why Milliseconds?

1. **JavaScript native** - `Date.now()` returns milliseconds
2. **No conversion needed** - `new Date(millis)` works directly
3. **Precision** - Sub-second accuracy when needed
4. **Consistency** - Same format everywhere

### Common Bug Scenario (with seconds)

```
1. Client stores timestamp in seconds: 1734019200
2. Code calls new Date(1734019200)
3. Result: 1970-01-21T01:40:19.200Z (wrong year!)
4. Application logic fails
```

Using milliseconds prevents this class of bugs.

---

## Summary

| Layer    | Format     | Method                 |
| -------- | ---------- | ---------------------- |
| Database | INTEGER    | Store as milliseconds  |
| Drizzle  | Date       | `mode: 'timestamp_ms'` |
| Logic    | number     | `Date.getTime()`       |
| Schema   | z.number() | Unix milliseconds      |
| Display  | string     | Format for UI only     |
