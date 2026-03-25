# Pre-commit Checklist

Complete this checklist before committing frontend code changes.

## Type Safety

- [ ] No `@ts-expect-error` or `@ts-ignore` comments added
- [ ] No `any` types in new code
- [ ] API response types are inferred or imported from backend (not redefined)
- [ ] Cache updates in React Query are properly typed
- [ ] When overriding mutation callbacks, explicit generics are provided

## Component Development

- [ ] Server Components used by default; `'use client'` only when necessary
- [ ] Semantic HTML elements used (button, not div for clicks)
- [ ] `next/image` used instead of `<img>` tags
- [ ] Proper ARIA labels and accessibility attributes added
- [ ] Props have TypeScript interfaces defined

## API Integration

- [ ] API calls use oRPC client (not raw fetch for internal APIs)
- [ ] React Query hooks follow established patterns
- [ ] Loading and error states handled
- [ ] Optimistic updates include rollback logic
- [ ] Real-time subscriptions cleaned up on unmount

## State Management

- [ ] Shareable state stored in URL with nuqs
- [ ] Context used sparingly (not for server data)
- [ ] URL and Context synchronized where necessary
- [ ] No duplicate state across different systems

## CSS & Layout

- [ ] `items-stretch` used on main flex containers (not `items-center`)
- [ ] Parent provides external styles; child provides internal layout
- [ ] Mobile touch: `WebkitTapHighlightColor: "transparent"` applied
- [ ] Touch targets are minimum 44x44px
- [ ] Responsive breakpoints tested

## Cross-Environment Testing

- [ ] Tested in development mode (`pnpm dev`)
- [ ] Tested in production mode (`pnpm build && pnpm start`)
- [ ] No visual differences between dev and prod
- [ ] Animations respect `prefers-reduced-motion`

## Code Quality

- [ ] No console.log statements left in code
- [ ] Unused imports removed
- [ ] Components follow single responsibility principle
- [ ] File and function names follow conventions
- [ ] Barrel exports updated if new files added

## Documentation

- [ ] Complex logic has inline comments
- [ ] New hooks have JSDoc comments
- [ ] API changes reflected in backend documentation

---

## Quick Commands

```bash
# Type check
pnpm type-check

# Lint
pnpm lint

# Format
pnpm format

# Build (catches production-only issues)
pnpm build

# Run all checks
pnpm lint && pnpm type-check && pnpm build
```

## Common Issues to Watch

### Type Safety
```typescript
// Bad
queryClient.setQueryData(['users'], (old: any) => ...)

// Good
queryClient.setQueryData<UserListData>(['users'], (old) => ...)
```

### Components
```typescript
// Bad
<div onClick={handleClick}>Click me</div>

// Good
<button onClick={handleClick}>Click me</button>
```

### Images
```typescript
// Bad
<img src="/hero.jpg" alt="Hero" />

// Good
import Image from 'next/image';
<Image src="/hero.jpg" alt="Hero" width={1200} height={600} />
```

### Layout
```typescript
// Bad - children won't fill height
<div className="flex h-screen items-center">

// Good - children fill available height
<div className="flex h-screen">
```

### Mobile Touch
```typescript
// Bad - shows tap highlight on mobile
<button onClick={handleClick}>Tap</button>

// Good - no tap highlight
<button
  onClick={handleClick}
  style={{ WebkitTapHighlightColor: 'transparent' }}
>
  Tap
</button>
```
