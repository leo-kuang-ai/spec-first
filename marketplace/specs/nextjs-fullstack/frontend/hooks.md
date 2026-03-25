# Hook Development Patterns

This document covers React hook patterns for data fetching, mutations, and state management using React Query with oRPC.

## Query Hooks

### Basic Query Pattern

```typescript
import { useQuery } from '@tanstack/react-query';
import { orpcClient } from '@/lib/orpc';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => orpcClient.users.list(),
  });
}
```

### Query with Parameters

```typescript
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => orpcClient.users.get({ id: userId }),
    enabled: !!userId, // Only fetch when userId is available
  });
}
```

### Query with Filters

```typescript
interface UseOrdersOptions {
  status?: string;
  page?: number;
  pageSize?: number;
}

export function useOrders(options: UseOrdersOptions = {}) {
  const { status, page = 1, pageSize = 20 } = options;

  return useQuery({
    queryKey: ['orders', { status, page, pageSize }],
    queryFn: () => orpcClient.orders.list({ status, page, pageSize }),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });
}
```

## Mutation Hooks

### Basic Mutation Pattern

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orpcClient } from '@/lib/orpc';

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserInput) => orpcClient.users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

### Mutation with Optimistic Updates

```typescript
type OrderListData = Awaited<ReturnType<typeof orpcClient.orders.list>>;

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      orpcClient.orders.updateStatus({ id, status }),

    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['orders'] });

      // Snapshot previous value
      const previousOrders = queryClient.getQueryData<OrderListData>(['orders']);

      // Optimistically update
      queryClient.setQueryData<OrderListData>(['orders'], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((order) =>
            order.id === id ? { ...order, status } : order
          ),
        };
      });

      return { previousOrders };
    },

    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders'], context.previousOrders);
      }
    },

    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
```

## Overriding Mutation Callbacks

When overriding mutation callbacks at the call site, you MUST add explicit generics to maintain type safety:

### Problem: Lost Type Safety

```typescript
// Hook definition
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => orpcClient.users.delete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Bad: Overriding without generics loses type safety
const deleteUser = useDeleteUser();
deleteUser.mutate(userId, {
  onSuccess: (data) => {
    // 'data' is typed as 'unknown' here!
    console.log(data.id); // TypeScript error or runtime error
  },
});
```

### Solution: Explicit Generics

```typescript
// Infer types for the mutation
type DeleteUserData = Awaited<ReturnType<typeof orpcClient.users.delete>>;
type DeleteUserVariables = string;

// Good: Add explicit generics when overriding callbacks
deleteUser.mutate<DeleteUserData, Error, DeleteUserVariables>(userId, {
  onSuccess: (data) => {
    // 'data' is properly typed
    console.log(data.id); // Works correctly
  },
});
```

### Alternative: Define Types in Hook

```typescript
// Export types from the hook file
export type DeleteUserMutationData = Awaited<
  ReturnType<typeof orpcClient.users.delete>
>;

// Usage with exported types
deleteUser.mutate(userId, {
  onSuccess: (data: DeleteUserMutationData) => {
    console.log(data.id);
  },
});
```

## Using orpcClient Directly in Hooks

Inside hooks, use `orpcClient` directly instead of wrapping with `useMutation`:

### DO: Direct orpcClient Usage

```typescript
export function useOrderActions() {
  const queryClient = useQueryClient();

  const updateOrder = useMutation({
    mutationFn: (data: UpdateOrderInput) => orpcClient.orders.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const deleteOrder = useMutation({
    mutationFn: (id: string) => orpcClient.orders.delete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return {
    updateOrder: updateOrder.mutate,
    deleteOrder: deleteOrder.mutate,
    isUpdating: updateOrder.isPending,
    isDeleting: deleteOrder.isPending,
  };
}
```

### DON'T: Nested Hooks

```typescript
// Bad: Don't create hooks that use other mutation hooks
export function useOrderActions() {
  // Don't do this - creates unnecessary abstraction
  const updateMutation = useUpdateOrder();
  const deleteMutation = useDeleteOrder();

  return {
    updateOrder: updateMutation.mutate,
    deleteOrder: deleteMutation.mutate,
  };
}
```

## Compound Hooks

Combine related queries and mutations into a single hook:

```typescript
export function useProduct(productId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['products', productId],
    queryFn: () => orpcClient.products.get({ id: productId }),
    enabled: !!productId,
  });

  const update = useMutation({
    mutationFn: (data: UpdateProductInput) =>
      orpcClient.products.update({ id: productId, ...data }),
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData(['products', productId], updatedProduct);
    },
  });

  const remove = useMutation({
    mutationFn: () => orpcClient.products.delete({ id: productId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    product: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateProduct: update.mutate,
    deleteProduct: remove.mutate,
    isUpdating: update.isPending,
    isDeleting: remove.isPending,
  };
}
```

## Infinite Query Pattern

```typescript
export function useInfiniteOrders() {
  return useInfiniteQuery({
    queryKey: ['orders', 'infinite'],
    queryFn: ({ pageParam = 1 }) =>
      orpcClient.orders.list({ page: pageParam, pageSize: 20 }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
}
```

## Dependent Queries

```typescript
export function useUserOrders(userId: string) {
  // First query: get user
  const userQuery = useQuery({
    queryKey: ['users', userId],
    queryFn: () => orpcClient.users.get({ id: userId }),
    enabled: !!userId,
  });

  // Second query: depends on user data
  const ordersQuery = useQuery({
    queryKey: ['orders', { userId }],
    queryFn: () => orpcClient.orders.list({ userId }),
    enabled: !!userQuery.data, // Only run when user is loaded
  });

  return {
    user: userQuery.data,
    orders: ordersQuery.data,
    isLoading: userQuery.isLoading || ordersQuery.isLoading,
  };
}
```

## Best Practices

1. **Single Responsibility**: Each hook should have one clear purpose
2. **Consistent Naming**: `useXxx` for hooks, `useXxxQuery` for queries, `useXxxMutation` for mutations
3. **Error Handling**: Always consider error states in your hooks
4. **Loading States**: Expose loading states for UI feedback
5. **Cache Keys**: Use consistent, hierarchical query keys
6. **Type Safety**: Always maintain proper TypeScript types

## Common Pitfalls

- Forgetting to invalidate related queries after mutations
- Not handling race conditions with `cancelQueries`
- Missing `enabled` flag for conditional queries
- Not providing explicit generics when overriding callbacks
- Creating too many small hooks instead of compound hooks
