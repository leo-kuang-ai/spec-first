# Hook Guidelines

> Complete guide for custom React hooks in a Cloudflare Workers + React Router v7 application with React Query (TanStack Query).

---

## Naming Conventions

Follow the `use{Feature}{Action}` pattern:

| Hook Name | Purpose |
|-----------|---------|
| `useItems` | Fetch a list of items |
| `useItem` | Fetch a single item by ID |
| `useCreateItem` | Create a new item (mutation) |
| `useUpdateItem` | Update an existing item (mutation) |
| `useDeleteItem` | Delete an item (mutation) |
| `useUserProfile` | Fetch current user's profile |
| `useCreateProject` | Create a new project (mutation) |
| `useInfiniteItems` | Paginated/infinite list of items |
| `useDashboardStats` | Fetch dashboard statistics |

**Rules:**

- Prefix with `use` (React convention)
- Feature name comes first (`Item`, `User`, `Project`)
- Action comes last (`Create`, `Update`, `Delete`)
- Query hooks (read) omit the action: `useItems`, `useItem`
- Mutation hooks (write) include the action: `useCreateItem`, `useUpdateItem`

---

## Query Hook Pattern

@@@section:query-hook

### Basic Query Hook

```typescript
import { useQuery } from "@tanstack/react-query";
import type { ListItemsOutput } from "../../server/routes/{feature}/types";

export function useItems() {
  return useQuery({
    queryKey: ["items"],
    queryFn: async (): Promise<ListItemsOutput> => {
      const response = await fetch("/api/items");
      if (!response.ok) {
        throw new Error(`Failed to fetch items: ${response.status}`);
      }
      return (await response.json()) as ListItemsOutput;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Parameterized Query Hook

```typescript
import { useQuery } from "@tanstack/react-query";
import type { ItemDetail } from "../../server/routes/{feature}/types";

export function useItem(itemId: string | undefined) {
  return useQuery({
    queryKey: ["items", itemId],
    queryFn: async (): Promise<ItemDetail> => {
      const response = await fetch(`/api/items/${itemId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch item: ${response.status}`);
      }
      return (await response.json()) as ItemDetail;
    },
    // Only fetch when itemId is available
    enabled: !!itemId,
    staleTime: 5 * 60 * 1000,
  });
}
```

### Query Key Conventions

Use a consistent, hierarchical key structure:

```typescript
// List queries
queryKey: ["items"]
queryKey: ["items", { status: "active", page: 1 }]

// Detail queries
queryKey: ["items", itemId]
queryKey: ["items", itemId, "comments"]

// User-scoped queries
queryKey: ["users", userId, "projects"]

// Dashboard / aggregate queries
queryKey: ["dashboard", "stats"]
```

**Rules:**

- First element is the resource name (plural)
- Second element is the ID (for detail queries) or filter object (for list queries)
- Nested resources append additional path segments
- Filter objects should be serializable and stable (avoid inline object creation)

### staleTime Guidelines

| Data Type | staleTime | Rationale |
|-----------|-----------|-----------|
| User session | `Infinity` | Managed by auth provider |
| Dashboard stats | `30 * 1000` (30s) | Frequently changing aggregate data |
| List data | `5 * 60 * 1000` (5min) | Moderate change frequency |
| Detail data | `5 * 60 * 1000` (5min) | Moderate change frequency |
| Static config | `60 * 60 * 1000` (1hr) | Rarely changes |

@@@/section:query-hook

---

## Mutation Hook Pattern

@@@section:mutation-hook

### Basic Mutation Hook

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateItemInput, ItemDetail } from "../../server/routes/{feature}/types";

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateItemInput): Promise<ItemDetail> => {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error ?? "Failed to create item");
      }
      return (await response.json()) as ItemDetail;
    },
    onSuccess: () => {
      // Invalidate the items list so it refetches
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
```

### Update Mutation with Optimistic Updates

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateItemInput, ItemDetail } from "../../server/routes/{feature}/types";

export function useUpdateItem(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateItemInput): Promise<ItemDetail> => {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error ?? "Failed to update item");
      }
      return (await response.json()) as ItemDetail;
    },

    // Optimistic update: update cache immediately before server responds
    onMutate: async (newData) => {
      // Cancel outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ["items", itemId] });

      // Snapshot the previous value
      const previousItem = queryClient.getQueryData<ItemDetail>(["items", itemId]);

      // Optimistically update the cache
      if (previousItem) {
        queryClient.setQueryData<ItemDetail>(["items", itemId], {
          ...previousItem,
          ...newData,
        });
      }

      // Return context with the snapshot for rollback
      return { previousItem };
    },

    // On error, roll back to the previous value
    onError: (_error, _newData, context) => {
      if (context?.previousItem) {
        queryClient.setQueryData(["items", itemId], context.previousItem);
      }
    },

    // After success or error, refetch to ensure server state is in sync
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items", itemId] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
```

### Delete Mutation

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string): Promise<void> => {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete item");
      }
    },
    onSuccess: (_data, itemId) => {
      // Remove the item from detail cache
      queryClient.removeQueries({ queryKey: ["items", itemId] });
      // Invalidate the list
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
```

### Mutation Usage in Components

```tsx
import { useCreateItem } from "@/modules/items/hooks/use-create-item";
import { toast } from "sonner";

function CreateItemForm() {
  const createItem = useCreateItem();

  const handleSubmit = (formData: CreateItemInput) => {
    createItem.mutate(formData, {
      onSuccess: (newItem) => {
        toast.success("Item created successfully");
        navigate(`/items/${newItem.id}`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={createItem.isPending}>
        {createItem.isPending ? "Creating..." : "Create Item"}
      </button>
    </form>
  );
}
```

@@@/section:mutation-hook

---

## Custom Hook Composition

Combine query and mutation hooks into a higher-level hook when a component needs both:

```typescript
import { useItem } from "./use-item";
import { useUpdateItem } from "./use-update-item";
import { useDeleteItem } from "./use-delete-item";

export function useItemActions(itemId: string) {
  const query = useItem(itemId);
  const updateMutation = useUpdateItem(itemId);
  const deleteMutation = useDeleteItem();

  return {
    // Query data
    item: query.data,
    isLoading: query.isLoading,
    error: query.error,

    // Mutations
    updateItem: updateMutation.mutate,
    isUpdating: updateMutation.isPending,

    deleteItem: () => deleteMutation.mutate(itemId),
    isDeleting: deleteMutation.isPending,
  };
}
```

**When to compose:**

- A component needs the same entity's query + mutation(s)
- You want to simplify the component's interface
- Multiple components need the same combination

**When NOT to compose:**

- Only a query or only a mutation is needed
- The composition adds no clarity (just wrapping for the sake of it)

---

## Error Handling in Hooks

### Error Boundaries

Wrap major sections in error boundaries so a failed query does not crash the entire page:

```tsx
import { ErrorBoundary } from "react-error-boundary";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";

function ItemsPageWrapper() {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ resetErrorBoundary }) => (
        <div className="p-8 text-center">
          <p className="text-red-600 mb-4">Failed to load items.</p>
          <button onClick={resetErrorBoundary}>Try Again</button>
        </div>
      )}
    >
      <ItemsList />
    </ErrorBoundary>
  );
}
```

### Toast Notifications for Mutations

Use toast notifications for mutation results:

```typescript
export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateItemInput) => {
      // ... fetch logic
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create item");
    },
  });
}
```

### Error Response Typing

Always type error responses from the API:

```typescript
interface ApiError {
  error: string;
  details?: string;
  statusCode: number;
}

async function handleApiError(response: Response): Promise<never> {
  const body = (await response.json()) as ApiError;
  throw new Error(body.error || `Request failed with status ${response.status}`);
}
```

---

## Cache Invalidation Strategies

### Strategy 1: Invalidate Related Queries

The simplest and most reliable approach. After a mutation, invalidate all queries that might be affected:

```typescript
onSuccess: () => {
  // Invalidate the list (will refetch)
  queryClient.invalidateQueries({ queryKey: ["items"] });
  // Invalidate the specific item detail
  queryClient.invalidateQueries({ queryKey: ["items", itemId] });
}
```

### Strategy 2: Direct Cache Update with setQueryData

For immediate UI updates without a network round-trip:

```typescript
onSuccess: (updatedItem: ItemDetail) => {
  // Update the detail cache directly
  queryClient.setQueryData(["items", updatedItem.id], updatedItem);

  // Update the item within the list cache
  queryClient.setQueryData<ListItemsOutput>(["items"], (old) => {
    if (!old) return old;
    return {
      ...old,
      items: old.items.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      ),
    };
  });
}
```

### Strategy 3: Optimistic Update + Rollback

For the best perceived performance (see the Update Mutation example above).

### When to Use Each Strategy

| Strategy | Use When |
|----------|----------|
| **Invalidate** | Default choice; simple and correct |
| **setQueryData** | You have the full updated object from the server response |
| **Optimistic** | Low-latency UX is critical (e.g., toggling a favorite, reordering) |

---

## Pagination Hooks

### useInfiniteQuery Pattern

For infinite scroll or "Load More" pagination:

```typescript
import { useInfiniteQuery } from "@tanstack/react-query";

interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function useInfiniteItems() {
  return useInfiniteQuery({
    queryKey: ["items", "infinite"],
    queryFn: async ({ pageParam }): Promise<PaginatedResponse<Item>> => {
      const url = new URL("/api/items", window.location.origin);
      url.searchParams.set("limit", "20");
      if (pageParam) {
        url.searchParams.set("cursor", pageParam);
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Failed to fetch items");
      return (await response.json()) as PaginatedResponse<Item>;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 5 * 60 * 1000,
  });
}
```

### Usage in Component

```tsx
function InfiniteItemsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteItems();

  if (isLoading) return <Skeleton />;

  const allItems = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div>
      {allItems.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Loading more..." : "Load More"}
        </button>
      )}
    </div>
  );
}
```

### Offset-Based Pagination Hook

For traditional page-number pagination:

```typescript
import { useQuery, keepPreviousData } from "@tanstack/react-query";

export function usePaginatedItems(page: number, pageSize: number = 20) {
  return useQuery({
    queryKey: ["items", { page, pageSize }],
    queryFn: async () => {
      const response = await fetch(
        `/api/items?page=${page}&pageSize=${pageSize}`
      );
      if (!response.ok) throw new Error("Failed to fetch items");
      return (await response.json()) as {
        items: Item[];
        totalCount: number;
        totalPages: number;
      };
    },
    // Keep showing previous page data while the next page loads
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}
```

---

## Auth-Aware Hooks

Hooks that depend on the current user's authentication status:

```typescript
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export function useUserProjects() {
  const { data: session } = authClient.useSession();

  return useQuery({
    queryKey: ["users", session?.user.id, "projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects", {
        credentials: "include", // Send session cookies
      });
      if (!response.ok) throw new Error("Failed to fetch projects");
      return (await response.json()) as { projects: Project[] };
    },
    // Only fetch when user is authenticated
    enabled: !!session?.user.id,
    staleTime: 5 * 60 * 1000,
  });
}
```

### Session-Dependent Cache Keys

Include the user ID in cache keys for user-scoped data to prevent cross-user cache leaks:

```typescript
// Good - cache is scoped to the user
queryKey: ["users", session?.user.id, "notifications"]

// Bad - all users share the same cache entry
queryKey: ["notifications"]
```

### Invalidate on Auth Change

When the session changes (login/logout), invalidate all user-scoped caches:

```tsx
// In your AuthProvider or root layout
<AuthUIProvider
  onSessionChange={() => {
    queryClient.invalidateQueries();
    // Or more targeted:
    // queryClient.invalidateQueries({ queryKey: ["users"] });
  }}
/>
```

---

## Summary

| Pattern | When to Use |
|---------|-------------|
| `useQuery` | Read data from API |
| `useMutation` | Create, update, or delete data |
| `useInfiniteQuery` | Paginated lists with "load more" / infinite scroll |
| Optimistic updates | Toggle, reorder, or other instant-feedback actions |
| Cache invalidation | After every successful mutation |
| Auth-aware hooks | User-scoped data that requires authentication |
| Hook composition | When a component needs query + mutation for the same entity |
