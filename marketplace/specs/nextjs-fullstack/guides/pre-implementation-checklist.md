# Pre-Implementation Checklist

> **Purpose**: Ask the right questions **before** writing code to avoid common architectural mistakes.

---

## Why This Checklist?

Most code quality issues aren't caught during implementation--they're **designed in** from the start:

| Problem                                | Root Cause                                    | Cost                       |
| -------------------------------------- | --------------------------------------------- | -------------------------- |
| Constants duplicated across 5 files    | Didn't ask "will this be used elsewhere?"     | Refactoring + testing      |
| Same logic repeated in multiple hooks  | Didn't ask "does this pattern exist?"         | Creating abstraction later |
| Cross-layer type mismatches            | Didn't ask "who else consumes this?"          | Debugging + fixing         |
| Zod schema redefined in frontend       | Didn't ask "is this type already exported?"   | Inconsistent validation    |
| oRPC procedure duplicates existing one | Didn't ask "does a similar endpoint exist?"   | API surface bloat          |

**This checklist catches these issues before they become code.**

---

## The Checklist

### 1. Constants & Configuration

Before adding any constant or config value:

- [ ] **Cross-package usage?** Will this value be used in both frontend app and API package?
  - If yes -> Put in a shared package (e.g., `@your-app/utils` or `@your-app/config`)
  - Example: `MAX_UPLOAD_SIZE` used by both file upload UI and oRPC validation

- [ ] **Multiple consumers?** Will this value be used in 2+ files within the same package?
  - If yes -> Put in a shared constants file for that package
  - Example: Don't define `DEBOUNCE_MS = 300` in each hook file

- [ ] **Magic number?** Is this a hardcoded value that could change?
  - If yes -> Extract to named constant with comment explaining why
  - Example: `PAGINATION_LIMIT: 50  // oRPC default page size`

- [ ] **Environment-dependent?** Does this differ between dev/staging/production?
  - If yes -> Use environment variables with proper validation
  - Example: API URLs, feature flags, third-party API keys

### 2. Logic & Patterns

Before implementing any logic:

- [ ] **Pattern exists?** Search for similar patterns in the codebase first

  ```bash
  # Example: Before implementing debounced search
  rg "debounce" src/ packages/
  rg "useDebounce" src/ packages/
  ```

- [ ] **Will repeat?** Will this exact logic be needed in 2+ places?
  - If yes -> Create a shared hook/utility **first**, then use it
  - Example: `useDebounce` instead of repeating debounce logic in 5 hooks

- [ ] **React Query pattern?** Is there an existing query/mutation hook for this data?
  - Search before creating: `rg "orpc.items" src/`
  - Check if you can extend an existing hook rather than creating a new one

- [ ] **Server or client?** Does this logic need interactivity?
  - If no -> Keep it in a Server Component (default)
  - If yes -> Extract only the interactive part into a Client Component

### 3. Types & Schemas

Before defining types:

- [ ] **Zod schema exists?** Is there already a Zod schema for this data shape?
  - Check the API module's `types.ts`: `rg "Schema = z.object" packages/api/`
  - Derive TypeScript types from Zod schemas with `z.infer<typeof schema>`
  - Never manually define a TypeScript interface that duplicates a Zod schema

- [ ] **Existing type?** Does a similar type already exist?
  - Search before creating: `rg "interface.*YourTypeName\|type.*YourTypeName" src/ packages/`

- [ ] **Cross-layer type?** Is this type used across the oRPC boundary?
  - If yes -> Define the Zod schema in the API module's `types.ts`, export the inferred type
  - Frontend should import types from the API package, not redefine them

- [ ] **Derived from client?** Can you infer the type from the oRPC client?
  ```typescript
  // Prefer this over manually defining types
  type ItemResult = Awaited<ReturnType<(typeof orpcClient)["items"]["get"]>>;
  ```

### 4. UI Components

Before creating UI components:

- [ ] **Server or Client Component?** Does this component need:
  - Event handlers (onClick, onChange)? -> `'use client'`
  - React hooks (useState, useEffect)? -> `'use client'`
  - Browser APIs (window, document)? -> `'use client'`
  - None of the above? -> Keep as Server Component (default)

- [ ] **Similar component exists?** Search before creating
  - `rg "function.*YourComponent\|export.*YourComponent" src/`

- [ ] **Visual-logic consistency?** If there's already a visual distinction (icon, color, label) for a concept, does your logic match?

- [ ] **State lifecycle?** Will this component unmount during normal user flow?
  - If yes -> Consider where state should persist (URL params with nuqs, parent, context)

### 5. API Routes & oRPC Procedures

Before writing an API route or oRPC procedure:

- [ ] **Existing procedure?** Does a similar oRPC procedure already exist?
  - Check the module's `router.ts`: `rg "Router = {" packages/api/`
  - Can you extend an existing procedure rather than creating a new one?

- [ ] **Correct HTTP method?**
  - GET for read operations (queries)
  - POST for create operations (mutations)
  - PUT/PATCH for update operations
  - DELETE for removal operations

- [ ] **Authentication level?** Which base procedure to use?
  - Public data -> `publicProcedure`
  - User-specific data -> `protectedProcedure`
  - Admin operations -> `adminProcedure`

- [ ] **Input/output schemas defined?** Both should be Zod schemas in `types.ts`

### 6. Dependencies

Before adding a dependency:

- [ ] **Already installed?** Check `package.json` across all packages
  ```bash
  rg "\"dependency-name\"" package.json packages/*/package.json
  ```

- [ ] **Built-in alternative?** Can you use a native API or existing utility instead?
  - Example: `structuredClone()` instead of `lodash.cloneDeep`

- [ ] **Bundle impact?** Will this significantly increase the client bundle?
  - If yes -> Consider dynamic import or server-only usage

---

## Quick Decision Tree

```
Adding a value/constant?
|-- Used in both app AND api package? -> shared package (@your-app/utils)
|-- Used in 2+ files within same package? -> shared constants file
+-- Single file only? -> Local constant is fine

Adding logic/behavior?
|-- Similar pattern exists? -> Extend or reuse existing
|-- Will be used in 2+ places? -> Create shared hook/utility first
+-- Single use only? -> Implement directly (but document pattern)

Adding a type?
|-- Zod schema exists? -> Use z.infer<typeof schema>
|-- Crosses oRPC boundary? -> Define in API types.ts, import elsewhere
|-- Can derive from client? -> Use Awaited<ReturnType<...>>
+-- Local only? -> Define locally

Adding a component?
|-- Needs interactivity? -> 'use client'
|-- Pure display? -> Server Component (default)
+-- Mix of both? -> Split into Server wrapper + Client interactive part
```

---

## What to Verify Across Layers

When implementing a feature that spans Server Component -> API -> Database, verify:

| Layer            | Check                                                              |
| ---------------- | ------------------------------------------------------------------ |
| Server Component | Data fetched correctly? Props serializable? No client-only APIs?   |
| Client Component | Loading/error states handled? React Query cache invalidated?       |
| oRPC Procedure   | Input validated? Auth checked? Output schema matches?              |
| Database Query   | No N+1 queries? Proper indexes? Transactions where needed?         |
| Zod Schemas      | Input and output schemas consistent? Date/null handling correct?   |

---

## Anti-Patterns to Avoid

### Redefining Backend Types

```typescript
// DON'T: Manually define types that mirror Zod schemas
interface Item {
  id: string;
  name: string;
  createdAt: Date;
}

// DO: Import or infer from the source of truth
import type { Item } from "@your-app/api/modules/items/types";
// or
type Item = Awaited<ReturnType<(typeof orpcClient)["items"]["get"]>>["item"];
```

### Manual Query Keys

```typescript
// DON'T: Manually construct query keys
queryClient.invalidateQueries({ queryKey: ["items", "list"] });

// DO: Use oRPC generated keys
queryClient.invalidateQueries({ queryKey: orpc.items.list.key() });
```

### Unnecessary Client Components

```typescript
// DON'T: Mark everything as 'use client'
'use client';
export function ItemCard({ item }) {
  return <div>{item.name}</div>; // No interactivity needed!
}

// DO: Keep as Server Component when possible
export function ItemCard({ item }) {
  return <div>{item.name}</div>;
}
```

### Fetch in Client Components When Server Would Work

```typescript
// DON'T: Fetch in Client Component when data could come from Server Component
'use client';
export function ItemList() {
  const { data } = useQuery(orpc.items.list.queryOptions({ input: {} }));
  return <ul>{data?.items.map(...)}</ul>;
}

// DO: Fetch in Server Component, pass as props (when no interactivity needed)
export async function ItemList() {
  const data = await orpcClient.items.list({});
  return <ul>{data.items.map(...)}</ul>;
}
```

---

## When to Use This Checklist

| Trigger                                    | Action                    |
| ------------------------------------------ | ------------------------- |
| About to add a constant                    | Run through Section 1     |
| About to implement logic                   | Run through Section 2     |
| About to define a type or schema           | Run through Section 3     |
| About to create a component                | Run through Section 4     |
| About to add an oRPC procedure             | Run through Section 5     |
| About to add a dependency                  | Run through Section 6     |
| Feels like you've seen similar code before | **STOP** and search first |

---

## Relationship to Other Guides

| Guide                                                         | Focus                     | Timing                      |
| ------------------------------------------------------------- | ------------------------- | --------------------------- |
| **Pre-Implementation Checklist** (this)                       | Questions before coding   | Before writing code         |
| [Cross-Layer Thinking Guide](./cross-layer-thinking-guide.md) | Data flow across layers   | Complex feature planning    |

**Ideal workflow:**

1. Read this checklist before coding
2. Use Cross-Layer guide for features spanning multiple layers

---

## Lessons Learned

| Date | Issue                                          | Lesson                                                                |
| ---- | ---------------------------------------------- | --------------------------------------------------------------------- |
| -    | Zod schema redefined in frontend and backend   | Always derive frontend types from the API package's Zod schemas       |
| -    | `useQuery` used where Server Component sufficed | Ask "does this need interactivity?" before reaching for React Query   |
| -    | Manual query keys diverged from oRPC keys      | Always use `orpc.xxx.key()` or `orpc.xxx.queryKey()` for cache ops   |
| -    | Type defined in both app and api package       | Cross-boundary types must be defined once in the API module           |

---

**Core Principle**: 5 minutes of checklist thinking saves 50 minutes of refactoring.
