# Code Quality Guidelines

> Quality checks and standards for Cloudflare Worker backends.

---

## Before Every Commit

- [ ] `pnpm lint` - 0 errors
- [ ] `pnpm typecheck` - No type errors
- [ ] Manual testing of changed features
- [ ] API documentation updated (if applicable)

---

## Forbidden Patterns

| Pattern                   | Why                           | Alternative                        |
| ------------------------- | ----------------------------- | ---------------------------------- |
| Non-null assertions (`!`) | Runtime errors                | Use proper null checks             |
| `console.log`             | No structure, no context      | Use logger                         |
| `await` in loops          | N+1 queries, poor performance | Use `Promise.all` or batch queries |
| `any` type                | Defeats type safety           | Use proper types or `unknown`      |
| Global state              | Workers are stateless         | Use context variables              |

---

## Code Quality Checklist

### TypeScript

- [ ] No `any` types (use `unknown` if needed)
- [ ] No non-null assertions (`!`)
- [ ] Explicit return types on exported functions
- [ ] All API inputs/outputs have Zod schemas

### Database

- [ ] No `await` in loops
- [ ] Use `inArray` for batch lookups
- [ ] Indexes on frequently queried columns
- [ ] Transactions for multi-table operations

### API Design

- [ ] Consistent response format (`{ success, ... }`)
- [ ] Proper HTTP status codes
- [ ] Input validation with Zod
- [ ] Error responses include helpful messages

### Security

- [ ] No secrets in code or `wrangler.toml`
- [ ] Token hashing before storage
- [ ] Input validation on all endpoints
- [ ] Rate limiting on auth endpoints

### Logging

- [ ] Use structured logger, not `console.log`
- [ ] Include `requestId` in logs
- [ ] No sensitive data in logs
- [ ] Appropriate log levels

---

## Recommended ESLint Rules

```json
{
  "rules": {
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "no-console": "error",
    "no-await-in-loop": "error"
  }
}
```

---

## Code Review Checklist

When reviewing PRs:

1. **Types**: Are all types explicit? Any `any` or `!`?
2. **Validation**: Are inputs validated with Zod?
3. **Errors**: Are errors handled properly?
4. **Logging**: Is logging appropriate?
5. **Security**: Any security concerns?
6. **Performance**: Any N+1 queries or inefficient patterns?
7. **Tests**: Are changes tested?

---

## Quick Quality Commands

```bash
# Run all checks
pnpm lint && pnpm typecheck

# Fix auto-fixable lint issues
pnpm lint --fix

# Type check with verbose output
pnpm typecheck --verbose
```
