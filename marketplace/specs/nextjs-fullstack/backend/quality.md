# Pre-commit Checklist

Run through this checklist before committing backend code.

## Type Safety

- [ ] **No non-null assertions (`!`)** - Use local variables and conditionals for type narrowing
- [ ] **All API inputs have Zod schemas** - Defined in `types.ts`
- [ ] **All API outputs have Zod schemas** - Including `success` and `reason` fields
- [ ] **Enums imported from `@your-app/utils`** - Not from database package

## Database Operations

- [ ] **No `await` in loops** - Use `inArray` for batch queries
- [ ] **Batch inserts used** - Not individual inserts in loops
- [ ] **Conflict handling considered** - Use `onConflictDoUpdate` when appropriate
- [ ] **JSON columns cast properly** - `::jsonb` for jsonb functions
- [ ] **Raw SQL column names quoted** - Double quotes for camelCase columns

## Logging

- [ ] **No `console.log`** - Use `logger` from `@your-app/logs`
- [ ] **Structured logging used** - Pass objects, not string interpolation
- [ ] **Errors logged with context** - Include relevant IDs and stack traces
- [ ] **Sensitive data excluded** - No passwords, tokens, or PII in logs

## Performance

- [ ] **Parallel execution where possible** - Use `Promise.all` for independent operations
- [ ] **Concurrency control for external APIs** - Use `p-limit` for rate-limited APIs
- [ ] **Retry logic for rate limits** - Exponential backoff implemented
- [ ] **Caching considered** - For expensive or frequently accessed data

## Error Handling

- [ ] **Errors properly caught and logged** - With Sentry context when applicable
- [ ] **Appropriate error codes returned** - `NOT_FOUND`, `FORBIDDEN`, `BAD_REQUEST`, etc.
- [ ] **Batch operations handle partial failures** - Return detailed error information

## Code Organization

- [ ] **Code in correct location** - Procedures, lib, types in right directories
- [ ] **Reusable logic extracted** - Shared code in `lib/` directory
- [ ] **Naming conventions followed** - Schemas, types, functions named correctly

## Quick Reference

### Response Format
```typescript
return {
  success: true,
  reason: "Operation completed successfully",
  // additional fields
};
```

### Batch Query Pattern
```typescript
const items = await db
  .select()
  .from(itemTable)
  .where(inArray(itemTable.parentId, parentIds));

const itemsByParent = groupBy(items, "parentId");
```

### Logging Pattern
```typescript
logger.info("Operation completed", {
  operationId,
  userId,
  itemCount: items.length,
});
```

### Error Pattern
```typescript
if (!resource) {
  throw new ORPCError("NOT_FOUND", { message: "Resource not found" });
}
```
