# Type Safety Guidelines

> Zod schemas, type patterns, and Hono header types.

---

## Timestamp Format in API Responses

**Rule**: All timestamps in API responses should use a consistent format. Common choices:

- Unix milliseconds (number): `1766046445195`
- ISO strings: `"2025-12-18T08:27:25.195Z"`

Choose one format and stick to it across your API.

```typescript
// Example: Using Unix milliseconds
return {
  success: true,
  entity: {
    id: result.id,
    createdAt: result.createdAt.getTime(), // -> 1766046445195
    updatedAt: result.updatedAt.getTime(),
  },
};

// Example: Using ISO strings
return {
  entity: {
    createdAt: result.createdAt.toISOString(), // -> "2025-12-18T08:27:25.195Z"
  },
};
```

**Why consistent format matters**:

- Clients can reliably parse timestamps
- Simplifies frontend date handling
- Matches API contract schema

---

## No Non-Null Assertions

```typescript
// Good - use local variable
const user = await getUser(id);
if (!user) {
  throw new Error("User not found");
}
const userName = user.name; // Safe access

// Bad - non-null assertion
const userName = user!.name;
```

---

## Zod Schema

```typescript
// All inputs and outputs need Zod schemas
const inputSchema = z.object({
  id: z.string(),
});

const outputSchema = z.object({
  success: z.boolean(),
  data: z.object({...}),
});
```

### Zod v4 Notes

If your project uses **Zod v4**, be aware of these API differences from v3:

**1. `z.record()` requires two arguments:**

```typescript
// Zod v4 - correct
z.record(z.string(), z.unknown()); // key schema + value schema

// Zod v3 style - will cause TypeScript error
z.record(z.unknown()); // missing key schema
```

**2. Error property renamed from `errors` to `issues`:**

```typescript
const result = schema.safeParse(data);

if (!result.success) {
  // Zod v4 - correct
  console.log(result.error.issues);

  // Zod v3 style - property doesn't exist
  console.log(result.error.errors);
}
```

**3. Logging Zod errors:**

```typescript
// Recommended pattern
if (!parseResult.success) {
  logger.warn("validation_failed", {
    errors: parseResult.error.issues, // Use .issues not .errors
  });
  return c.json({ error: "invalid_request" }, 400);
}
```

---

## Hono Header Types

`c.req.header()` returns `string | undefined`, but some functions expect `string | null`:

```typescript
// Convert undefined to null when needed
const authHeader = c.req.header("Authorization") ?? null;
parseBasicAuth(authHeader); // Function expects string | null

// May cause TypeScript error
parseBasicAuth(c.req.header("Authorization")); // Type 'undefined' not assignable to 'null'
```

**Common pattern for optional headers:**

```typescript
// Check before use
const auth = c.req.header("Authorization");
if (auth?.startsWith("Bearer ")) {
  const token = auth.slice(7);
  // ...
}
```

---

## Type Assertions for Enum Columns

Drizzle returns `text` columns as `string` type, but API contracts often use stricter literal union types. Use type assertions when converting DB results to API responses.

**Problem:**

```typescript
// DB layer (Drizzle schema)
role: text("role").notNull(); // TypeScript infers as string

// API layer (contract types)
export type MemberRole = "owner" | "admin" | "member";
```

**Solution:**

```typescript
import { type MemberRole } from "./types";

// In conversion functions
function toApiResponse(member: DbMember) {
  return {
    id: member.userId,
    role: member.role as MemberRole, // Type assertion
    // ...
  };
}
```

**Best practice:** Centralize type assertions in conversion utility functions, not scattered throughout handlers.

---

## Best Practices Summary

| Rule                          | Description                               |
| ----------------------------- | ----------------------------------------- |
| No non-null assertions (`!`)  | Use proper null checks                    |
| All inputs validated with Zod | Never trust raw input                     |
| All outputs typed             | Use explicit return types                 |
| Consistent timestamp format   | Choose one format for all APIs            |
| Type assertions in utilities  | Centralize DB-to-API conversions          |
| Handle header types           | Convert `undefined` to `null` when needed |
