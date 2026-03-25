# Cross-Layer Thinking Guide

> **Purpose**: Pre-implementation checklist for features that span multiple layers.
>
> **Core Principle**: 30 minutes of thinking saves 3 hours of debugging.

---

## When to Use This Guide

Use this guide when your feature:

- Touches 3+ layers (Server Component, Client Component, oRPC, Database)
- Involves data transformation between layers
- Has real-time or event-driven components
- Receives data from external sources (APIs, webhooks, file uploads)

---

## Pre-Implementation Checklist

Before writing code, answer these questions:

### 1. Layer Identification

**Which layers does this feature touch?**

- [ ] Server Components (RSC - data fetching, static rendering)
- [ ] Client Components (interactivity, browser APIs, React hooks)
- [ ] API Routes / oRPC Procedures (validation, business logic)
- [ ] Middleware (auth checks, redirects, header manipulation)
- [ ] Database (Drizzle ORM queries, migrations)
- [ ] Server Actions (form handling, progressive enhancement)
- [ ] External Services (third-party APIs, webhooks)

### 2. Data Flow Direction

**How does data flow?**

```
Read Flow:  DB -> Drizzle -> oRPC Handler -> API Response -> React Query -> Component -> UI
Write Flow: UI -> Form/Action -> oRPC Mutation -> Handler -> Drizzle -> DB
SSR Flow:   DB -> Drizzle -> oRPC Handler -> Server Component -> HTML -> Client Hydration
```

- [ ] Read-only (data flows from DB to UI)
- [ ] Write-only (data flows from UI to DB)
- [ ] Bidirectional (both directions)
- [ ] Server-rendered (data fetched in Server Components)
- [ ] Client-fetched (data fetched via React Query in Client Components)

### 3. Data Format at Each Layer

**What format is the data at each boundary?**

| Layer            | Format                  | Example                                         |
| ---------------- | ----------------------- | ----------------------------------------------- |
| Database         | SQL types               | `TEXT`, `INTEGER`, `TIMESTAMP`, `JSONB`          |
| Drizzle ORM      | TypeScript types        | `string`, `number`, `Date`, `Record<>`           |
| oRPC Handler     | Zod-validated objects   | `{ id: string, createdAt: Date }`                |
| oRPC Response    | Serialized JSON         | `{ id: "abc", createdAt: "2024-01-01T..." }`    |
| React Query      | Cached response         | Same as oRPC response (deserialized)             |
| Server Component | Props (must serialize)  | No functions, no Date objects, no class instances |
| Client Component | React state             | Component props, hook return values              |
| UI               | Rendered output         | HTML, Tailwind-styled elements                   |

### 3.1 Serialization Boundary (CRITICAL!)

**Design Principle**: Data crossing the Server/Client Component boundary must be serializable.

| Serializable (OK)       | NOT Serializable (WILL BREAK)     |
| ----------------------- | --------------------------------- |
| `string`, `number`      | `Date` objects                    |
| `boolean`, `null`       | `Map`, `Set`                      |
| Plain objects, arrays   | Functions, class instances        |
| `undefined` (as absent) | `BigInt`, `Symbol`                |

**Common serialization trap**:

```typescript
// BAD - Date objects don't serialize across RSC boundary
async function ItemPage() {
  const item = await orpcClient.items.get({ itemId: "123" });
  // item.createdAt might be a Date object from Drizzle
  return <ClientItem item={item} />; // Date becomes string or breaks!
}

// GOOD - Convert to serializable format before passing to Client Component
async function ItemPage() {
  const item = await orpcClient.items.get({ itemId: "123" });
  return <ClientItem item={{
    ...item,
    createdAt: item.createdAt.toISOString(), // Explicit string conversion
  }} />;
}
```

### 4. Data Transformation Points

**Where does format change? Who is responsible?**

| From              | To                  | Transformer         | Location                   |
| ----------------- | ------------------- | ------------------- | -------------------------- |
| DB timestamp      | JS Date             | Drizzle ORM         | Automatic                  |
| JS Date           | ISO string          | oRPC serialization  | API response               |
| ISO string        | Display string      | React component     | UI layer                   |
| User input        | Validated data      | Zod schema          | oRPC input validation      |
| JSONB column      | TypeScript object   | Drizzle + cast      | Query layer                |

### 5. Boundary Questions (Critical!)

For each layer boundary, ask:

**RSC / Client Component Boundary:**

- What data is the Server Component passing as props?
- Is all of it serializable? (no functions, no Date objects, no Maps)
- Could this data be fetched directly in the Client Component via React Query instead?
- Does the Client Component need to refetch or mutate this data?

**Client Component / oRPC Boundary:**

- What format does the oRPC response return?
- How does React Query cache and deserialize it?
- What happens if the response format changes?
- Are query keys consistent for cache invalidation?

**oRPC Handler / Database Boundary:**

- Are timestamps handled consistently? (ISO strings vs Date objects)
- Are IDs strings or numbers?
- What about null vs undefined?
- Does Drizzle transform types automatically?
- Are JSONB columns properly cast?

**Middleware / Route Boundary:**

- Is auth checked in middleware, oRPC procedure, or both?
- What happens if middleware redirects but the API call continues?
- Are headers properly forwarded in SSR context?

### 6. Authentication Context

**Where is auth available?**

| Layer            | Auth Method                            | Notes                                   |
| ---------------- | -------------------------------------- | --------------------------------------- |
| Middleware       | `getSession()` from headers/cookies    | Runs before route handler               |
| Server Component | `getSession()` or `auth()` helper      | Can redirect on the server              |
| Client Component | `useSession()` hook                    | May need loading state                  |
| oRPC Procedure   | `protectedProcedure` middleware        | Throws UNAUTHORIZED if no session       |
| API Route        | `getSession()` from request headers    | Manual check needed                     |

**Common auth pitfall**:

```typescript
// BAD - Auth checked in middleware but not in oRPC procedure
// If someone calls the API directly, auth is bypassed!
export const middleware = NextResponse.next(); // auth check here
export const getSecret = publicProcedure.handler(...); // no auth check!

// GOOD - Auth in oRPC procedure (always enforced)
export const getSecret = protectedProcedure.handler(...);
```

### 7. Edge Cases

- [ ] What if the data is empty/null?
- [ ] What if the database query fails?
- [ ] What if the oRPC call times out?
- [ ] What if a referenced entity doesn't exist?
- [ ] What if the user navigates away mid-mutation?
- [ ] What if React Query returns stale data?
- [ ] What if the user's session expires mid-operation?
- [ ] What if the same mutation fires twice (double-click)?

---

## Common Patterns

### Pattern A: Server Component Data Fetch

**Layers**: Server Component -> oRPC Client -> Handler -> Database

**Data Flow**:

```
1. Server Component: Calls oRPC client directly (server-side)
2. oRPC Handler: Validates auth, queries database
3. Drizzle: Returns typed results
4. Server Component: Renders HTML with data
5. Client: Receives pre-rendered HTML
```

**Common Issues**:

- **Serialization**: Server Components can render Date objects directly, but cannot pass them as props to Client Components
- **No cache**: Server-side oRPC calls bypass React Query cache; consider prefetching
- **Waterfall**: Sequential server-side calls create request waterfalls; use `Promise.all` for parallel fetching

### Pattern B: Client Component with React Query

**Layers**: Client Component -> React Query -> oRPC Client -> Handler -> Database

**Data Flow**:

```
1. Client Component: Mounts, triggers useQuery
2. React Query: Checks cache, calls oRPC client if stale
3. oRPC Client: Sends HTTP request to API route
4. oRPC Handler: Validates input/auth, queries DB
5. Response: JSON back through React Query
6. Client Component: Re-renders with data
```

**Common Issues**:

- **Loading states**: Must handle `isLoading`, `isError`, `isPending` properly
- **Stale data**: Configure `staleTime` and `gcTime` appropriately
- **Cache invalidation**: Use `orpc.xxx.key()` for consistent invalidation after mutations
- **Enabled flag**: Disable queries when required parameters are missing

### Pattern C: Mutation with Optimistic Update

**Layers**: Client Component -> useMutation -> oRPC Client -> Handler -> Database

**Data Flow**:

```
1. User: Triggers action (click, form submit)
2. onMutate: Optimistically update React Query cache
3. oRPC Client: Sends mutation request
4. Handler: Validates, writes to DB
5. onSuccess: Invalidate related queries
6. onError: Rollback optimistic update from snapshot
```

**Common Issues**:

- **Rollback complexity**: Must snapshot all affected queries before optimistic update
- **Type safety**: Cache manipulation needs explicit type annotations
- **Race conditions**: Cancel outgoing refetches before optimistic update (`cancelQueries`)
- **Partial failures**: Batch operations may partially succeed

### Pattern D: Server Action (Form Handling)

**Layers**: Form -> Server Action -> oRPC Client / DB -> Revalidate

**Data Flow**:

```
1. User: Submits form
2. Server Action: Receives FormData, validates
3. Action: Calls oRPC client or DB directly
4. Action: Calls revalidatePath/revalidateTag
5. Page: Re-renders with updated data
```

**Common Issues**:

- **Progressive enhancement**: Forms work without JS when using Server Actions
- **Validation**: Validate on both client (UX) and server (security)
- **Redirect vs revalidate**: Choose the right post-action behavior
- **Error handling**: Server Action errors need proper error boundaries

### Pattern E: Middleware + API Route Auth

**Layers**: Request -> Middleware -> API Route / oRPC -> Handler

**Data Flow**:

```
1. Request: Arrives at Next.js server
2. Middleware: Checks auth, may redirect to login
3. API Route: Handles oRPC request
4. oRPC Middleware: Validates session (protectedProcedure)
5. Handler: Executes business logic
```

**Common Issues**:

- **Double auth check**: Middleware protects pages, oRPC protects API; both are needed
- **Header forwarding**: SSR requests must forward cookies/headers to oRPC client
- **Middleware scope**: Don't run auth middleware on public assets or API routes that handle their own auth

---

## Lessons from Common Bugs

| Bug                             | Root Cause                                                | Prevention                                          |
| ------------------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| `Date` props break hydration    | Date objects passed from Server to Client Component       | Convert to ISO string before passing as props        |
| Stale data after mutation       | Forgot to invalidate React Query cache                    | Always invalidate with `orpc.xxx.key()` in onSuccess |
| Auth bypass on API              | Auth only in middleware, not in oRPC procedure             | Always use `protectedProcedure` for protected data   |
| `BigInt` serialization error    | Database returns BigInt, JSON.stringify fails              | Cast to number or string before response             |
| Query fires with null ID        | `enabled` flag not set on conditional queries              | Always guard with `enabled: !!requiredParam`         |
| Cache key mismatch              | Manual query key doesn't match oRPC generated key          | Always use `orpc.xxx.key()` or `orpc.xxx.queryKey()` |
| N+1 queries in handler          | Fetching related data in a loop                            | Use `inArray()` for batch queries                    |
| Hydration mismatch              | Server and client render different output (e.g., locale)   | Ensure consistent data between server and client     |
| Headers not forwarded in SSR    | oRPC client doesn't forward cookies in server context      | Configure client to forward headers in SSR mode      |

---

## Checklist Template

Copy this for your feature:

```markdown
## Feature: [Name]

### Layers Involved

- [ ] Server Component
- [ ] Client Component
- [ ] oRPC Procedure
- [ ] Middleware
- [ ] Database
- [ ] Server Action
- [ ] External Service

### Data Flow

[Describe the flow]

### Format at Each Layer

| Layer | Format |
| ----- | ------ |
| ...   | ...    |

### Transformation Points

| From | To  | Who |
| ---- | --- | --- |
| ...  | ... | ... |

### Auth Strategy

- Middleware: [yes/no, what it checks]
- oRPC: [publicProcedure/protectedProcedure/adminProcedure]

### Edge Cases Considered

- [ ] Empty/null data
- [ ] Invalid format / serialization
- [ ] Operation failure / timeout
- [ ] User cancellation / navigation
- [ ] Session expiry mid-operation
- [ ] Double submission
```

---

## Cross-Layer Review Mindset

### The Comparison Trap

**Wrong thinking**: "This line wasn't changed, so it must be correct."

```
Comparison thinking (surface level):
  Before: new Date() -> After: new Date() -> "No change, must be fine"

Global thinking (design level):
  Design intent: ISO strings across RSC boundary -> Current: Date object -> "This is a bug"
```

**Key insight**: Review validates "system state is correct", not just "change is correct".

### Data Outlet Checklist

Every review must cover ALL data outlets:

```
Data Outlets:
|-- oRPC Response (handler -> client)
|-- Server Component Props (RSC -> Client Component)
|-- React Query Cache (shared across components)
|-- URL State (nuqs, searchParams)
|-- Server Action Return (action -> form)
|-- Any external interface
```

Ask: **"Is the format correct at EACH outlet?"**

### Review Three Questions

Before finishing any cross-layer review:

1. **Outlet Question**: Have I checked ALL data outlets, not just the "core" one?
2. **Design Question**: Does existing code match design principles? (Not "is the change correct?")
3. **Checklist Question**: Could my checklist itself be wrong?

### Validation vs Verification

| Approach        | Focus                        | Risk                                 |
| --------------- | ---------------------------- | ------------------------------------ |
| **Incremental** | "Is this change correct?"    | Misses pre-existing bugs             |
| **Global**      | "Is the system correct now?" | More thorough, catches legacy issues |

Always prefer global verification for cross-layer features.

---

## When Things Go Wrong

If you encounter a cross-layer bug:

1. **Identify the boundary** - Where exactly does it fail?
2. **Log at boundaries** - Add logging before and after each transformation
3. **Check assumptions** - What format did you expect vs what you got?
4. **Test in isolation** - Can you reproduce with a simple test case?
5. **Document the fix** - Add to "Lessons from Common Bugs" table

---

**Language**: All documentation should be written in **English**.
