# oRPC Frontend Usage Guidelines

This document provides comprehensive guidelines for using oRPC in frontend applications, covering client setup, React Query integration, and best practices.

## 1. Overview

oRPC (OpenAPI RPC) provides type-safe RPC-style API calls with automatic TypeScript type inference. When combined with React Query (TanStack Query), it offers a powerful solution for data fetching, caching, and state synchronization.

**Key Benefits:**
- End-to-end type safety from backend to frontend
- Automatic query key generation
- Seamless React Query integration
- Built-in error handling

## 2. Client Setup

### Basic Client Configuration

```typescript
// lib/orpc-client.ts
import { createORPCClient, onError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ApiRouterClient } from "@your-app/api/orpc/router"; // Replace with your monorepo package path

const link = new RPCLink({
  url: "/api/rpc",
  headers: async () => {
    // Client-side: return empty headers (cookies handled automatically)
    if (typeof window !== "undefined") {
      return {};
    }
    // Server-side: forward request headers for SSR
    const { headers } = await import("next/headers");
    return Object.fromEntries(await headers());
  },
  interceptors: [
    onError((error) => {
      // Ignore abort errors (e.g., from React strict mode)
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error(error);
    }),
  ],
});

export const orpcClient: ApiRouterClient = createORPCClient(link);
```

**Key Points:**
- The `ApiRouterClient` type ensures full type safety
- Headers handling differs between client and server environments
- Error interceptors provide centralized error logging

## 3. React Query Integration

### Creating Query Utilities

```typescript
// lib/orpc-query-utils.ts
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { orpcClient } from "./orpc-client";

export const orpc = createTanstackQueryUtils(orpcClient);
```

The `orpc` object provides utilities for generating query options and keys that integrate seamlessly with React Query.

## 4. Query Patterns

### 4.1 Basic Query with useQuery

```typescript
import { orpc } from "@/lib/orpc-query-utils";
import { orpcClient } from "@/lib/orpc-client";
import { useQuery } from "@tanstack/react-query";

// Derive types from the client
type ItemResult = Awaited<ReturnType<(typeof orpcClient)["items"]["get"]>>;

export function useItem(itemId: string | null) {
  const hasItemId = typeof itemId === "string" && itemId.trim().length > 0;

  const { data, isLoading, error, refetch } = useQuery<ItemResult | undefined>({
    ...orpc.items.get.queryOptions({
      input: { itemId: itemId ?? "" },
    }),
    enabled: hasItemId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,   // Keep in garbage collection for 10 minutes
  });

  return {
    item: data?.item ?? null,
    isLoading,
    error,
    refetch,
  };
}
```

### 4.2 Infinite Query with Cursor Pagination

```typescript
import { orpc } from "@/lib/orpc-query-utils";
import { orpcClient } from "@/lib/orpc-client";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";

type ListResult = Awaited<ReturnType<(typeof orpcClient)["items"]["list"]>>;
type ListCursor = { lastUpdatedAt: string; id: string } | undefined;
type ListQueryKey = ReturnType<typeof orpc.items.list.queryKey>;

interface UseItemListOptions {
  categoryId: string | null;
  filters?: {
    isActive?: boolean;
    search?: string;
  };
  enabled?: boolean;
}

export function useItemList(options: UseItemListOptions) {
  const { categoryId, filters, enabled = true } = options;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery<
    ListResult,
    Error,
    InfiniteData<ListResult, ListCursor>,
    ListQueryKey,
    ListCursor
  >({
    queryKey: orpc.items.list.queryKey({
      input: {
        categoryId: categoryId ?? "",
        filters,
      },
    }),
    queryFn: async ({ pageParam }): Promise<ListResult> => {
      if (!categoryId) {
        throw new Error("Category ID is required");
      }
      return await orpcClient.items.list({
        categoryId,
        limit: 20,
        cursor: pageParam,
        filters,
      });
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage): ListCursor =>
      lastPage.nextCursor ?? undefined,
    enabled: enabled && !!categoryId,
  });

  // Flatten all pages into a single array
  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return {
    items,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  };
}
```

### 4.3 Batch Queries with useQueries

```typescript
import { orpc } from "@/lib/orpc-query-utils";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

interface UseBatchItemsOptions {
  itemIds: string[];
  enabled?: boolean;
  staleTime?: number;
}

export function useBatchItems(options: UseBatchItemsOptions) {
  const { itemIds, enabled = true, staleTime = 5 * 60 * 1000 } = options;

  const queries = useQueries({
    queries: itemIds.map((itemId) => ({
      ...orpc.items.get.queryOptions({
        input: { itemId },
      }),
      enabled: enabled && !!itemId,
      staleTime,
    })),
  });

  // Build a map for easy lookup
  const itemsMap = useMemo(() => {
    const map = new Map();
    queries.forEach((query, index) => {
      const itemId = itemIds[index];
      if (itemId && query.data) {
        map.set(itemId, {
          data: query.data,
          isLoading: query.isLoading,
          error: query.error,
        });
      }
    });
    return map;
  }, [queries, itemIds]);

  return {
    itemsMap,
    isLoading: queries.some((q) => q.isLoading),
    isAllLoaded: queries.every((q) => q.isSuccess || q.isError),
  };
}
```

### 4.4 Query Key Management

oRPC provides automatic query key generation:

```typescript
// Get query key with input parameters
const queryKey = orpc.items.list.queryKey({
  input: { categoryId: "123", filters: { isActive: true } },
});

// Get base key (without input) for broader invalidation
const baseKey = orpc.items.list.key();

// Usage in cache invalidation
queryClient.invalidateQueries({
  queryKey: orpc.items.list.key(), // Invalidates all items.list queries
});

queryClient.invalidateQueries({
  queryKey: orpc.items.list.queryKey({
    input: { categoryId: "123" },
  }), // Invalidates specific query
});
```

## 5. Mutation Patterns

### 5.1 Basic Mutation

```typescript
import { orpc } from "@/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UseConnectServiceOptions {
  onSuccess?: (data: ConnectOutput) => void;
  onError?: (error: Error) => void;
}

export function useConnectService(options: UseConnectServiceOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation<ConnectOutput, Error, ConnectInput>({
    ...orpc.services.connect.mutationOptions(),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: orpc.services.default.key(),
      });
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error("Connection failed", {
        description: error.message,
      });
      options.onError?.(error);
    },
  });
}
```

### 5.2 Mutation with Optimistic Updates

```typescript
import { orpc } from "@/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean },
    Error,
    { itemId: string; isActive: boolean },
    { previousQueries: [readonly unknown[], unknown][] }
  >({
    ...orpc.items.update.mutationOptions(),
    onMutate: async ({ itemId, isActive }) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: orpc.items.list.key(),
      });

      // Snapshot current data for rollback
      const previousQueries = queryClient.getQueriesData({
        queryKey: orpc.items.list.key(),
      });

      // Optimistically update the cache
      queryClient.setQueriesData(
        { queryKey: orpc.items.list.key() },
        (old: unknown) => {
          const data = old as {
            pages?: Array<{
              items: Array<{ id: string; isActive: boolean }>;
            }>;
          };
          if (!data?.pages) return old;

          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === itemId ? { ...item, isActive } : item
              ),
            })),
          };
        }
      );

      return { previousQueries };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error("Failed to update item");
    },
    onSuccess: () => {
      // Optionally invalidate related queries
      queryClient.invalidateQueries({
        queryKey: orpc.items.counts.key(),
      });
    },
  });
}
```

### 5.3 Optimistic Delete (Remove from List)

```typescript
export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean },
    Error,
    { itemId: string },
    { previousQueries: [readonly unknown[], unknown][] }
  >({
    ...orpc.items.delete.mutationOptions(),
    onMutate: async ({ itemId }) => {
      await queryClient.cancelQueries({
        queryKey: orpc.items.list.key(),
      });

      const previousQueries = queryClient.getQueriesData({
        queryKey: orpc.items.list.key(),
      });

      // Optimistically remove from all lists
      queryClient.setQueriesData(
        { queryKey: orpc.items.list.key() },
        (old: unknown) => {
          const data = old as {
            pages?: Array<{
              items: Array<{ id: string }>;
              nextCursor: unknown;
              hasMore: boolean;
            }>;
          };
          if (!data?.pages) return old;

          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.filter((item) => item.id !== itemId),
            })),
          };
        }
      );

      return { previousQueries };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error("Failed to delete item");
    },
    onSuccess: () => {
      toast.success("Item deleted");
      queryClient.invalidateQueries({
        queryKey: orpc.items.counts.key(),
      });
    },
  });
}
```

## 6. Direct Client Calls

### 6.1 When to Use Direct Client vs useMutation

**Use `useMutation` when:**
- You need loading/error states in UI
- You want automatic retry behavior
- You need optimistic updates
- You want built-in cache invalidation hooks

**Use direct `orpcClient` calls when:**
- Inside `mutationFn` for custom logic (see 6.2)
- In event handlers where you need sequential operations
- When you need to transform input before calling API
- In server components or API routes

### 6.2 Custom Mutation Function

When you need to add custom logic, transform inputs, or handle complex scenarios:

```typescript
import { orpcClient } from "@/lib/orpc-client";
import { orpc } from "@/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateItem(options = {}) {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return useMutation<
    CreateItemOutput,
    Error,
    Omit<CreateItemInput, "userId">  // userId will be added automatically
  >({
    mutationKey: orpc.items.create.mutationKey(),
    mutationFn: async (input) => {
      // Add authentication
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Transform input before calling API
      const fullInput: CreateItemInput = {
        ...input,
        userId: user.id,
      };

      // Direct client call with transformed input
      return orpcClient.items.create(fullInput);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Item created successfully");
        queryClient.invalidateQueries({
          queryKey: orpc.items.list.key(),
        });
        options.onSuccess?.(data);
      } else {
        // Handle API-level errors
        const errorMessage = data.error || "Failed to create item";
        toast.error("Failed to create item", {
          description: errorMessage,
        });
        options.onError?.(new Error(errorMessage));
      }
    },
    onError: (error) => {
      toast.error("Failed to create item", {
        description: error.message,
      });
      options.onError?.(error);
    },
  });
}
```

### 6.3 Type Inference

Derive types directly from the client for maximum type safety:

```typescript
import type { orpcClient } from "@/lib/orpc-client";

// Infer return type from client method
type ItemResult = Awaited<ReturnType<(typeof orpcClient)["items"]["get"]>>;

// Infer input type from client method
type CreateItemInput = Parameters<(typeof orpcClient)["items"]["create"]>[0];
```

## 7. Best Practices

### 7.1 Query Key Consistency

Always use oRPC's generated query keys for consistency:

```typescript
// GOOD: Use generated query keys
queryClient.invalidateQueries({
  queryKey: orpc.items.list.key(),
});

// GOOD: Use specific query key with input
queryClient.invalidateQueries({
  queryKey: orpc.items.list.queryKey({ input: { categoryId: "123" } }),
});

// BAD: Manually constructed keys
queryClient.invalidateQueries({
  queryKey: ["items", "list"],  // Don't do this
});
```

### 7.2 Error Handling

Implement consistent error handling with toast notifications:

```typescript
import { toast } from "sonner";

// In mutation hooks
onError: (error) => {
  toast.error("Operation failed", {
    description: error.message,
  });
},

// Handle API-level errors in onSuccess
onSuccess: (data) => {
  if (!data.success) {
    toast.error("Operation failed", {
      description: data.error || "Unknown error",
    });
    return;
  }
  // Handle success...
},
```

### 7.3 Loading States

Use appropriate loading state properties:

```typescript
const { isLoading, isFetching, isPending } = useQuery(...);
const { isPending, isSuccess, isError } = useMutation(...);
const { isFetchingNextPage, hasNextPage } = useInfiniteQuery(...);

// In components
{isLoading && <Skeleton />}
{isPending && <Button disabled>Saving...</Button>}
{isFetchingNextPage && <LoadingSpinner />}
```

### 7.4 Cache Configuration

Set appropriate cache times based on data characteristics:

```typescript
// Frequently changing data
staleTime: 30 * 1000,      // 30 seconds
gcTime: 60 * 1000,         // 1 minute

// Moderately stable data
staleTime: 5 * 60 * 1000,  // 5 minutes
gcTime: 10 * 60 * 1000,    // 10 minutes

// Stable/static data
staleTime: 30 * 60 * 1000, // 30 minutes
gcTime: 60 * 60 * 1000,    // 1 hour
```

### 7.5 Input Validation in Hooks

Always validate inputs before making API calls:

```typescript
export function useItem(itemId: string | null) {
  const hasItemId = typeof itemId === "string" && itemId.trim().length > 0;

  useEffect(() => {
    if (!hasItemId) {
      console.warn("[useItem] Invalid itemId provided. Request skipped.");
    }
  }, [hasItemId]);

  return useQuery({
    ...orpc.items.get.queryOptions({
      input: { itemId: itemId ?? "" },
    }),
    enabled: hasItemId,  // Prevent invalid requests
  });
}
```

### 7.6 Partial Success Handling

Handle batch operations that may partially succeed:

```typescript
onSuccess: (result) => {
  if (result.failed === 0) {
    toast.success(`${result.processed} items updated`);
  } else if (result.processed > 0) {
    toast.warning(
      `${result.processed} of ${result.total} items updated, ${result.failed} failed`
    );
    // Refresh to get correct state for failed items
    queryClient.invalidateQueries({
      queryKey: orpc.items.list.key(),
    });
  } else {
    toast.error("Failed to update items");
  }
},
```

## 8. Common Patterns Summary

| Pattern | Hook | Use Case |
|---------|------|----------|
| Single item fetch | `useQuery` | Detail pages, single record |
| List with pagination | `useInfiniteQuery` | Lists, feeds, search results |
| Multiple items | `useQueries` | Batch preloading, related items |
| Create/Update/Delete | `useMutation` | Form submissions, actions |
| Optimistic updates | `useMutation` + `onMutate` | Real-time UI updates |
| Custom mutation logic | `useMutation` + `mutationFn` | Auth injection, input transformation |

## 9. Migration Notes

When migrating from other data fetching approaches:

1. Replace manual fetch calls with `orpcClient` methods
2. Replace manual query keys with `orpc.xxx.queryKey()`
3. Use `orpc.xxx.queryOptions()` and `mutationOptions()` for React Query integration
4. Leverage TypeScript inference from the client types
