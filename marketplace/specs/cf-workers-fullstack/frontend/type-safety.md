# Type Safety Guidelines

## 2. Type Safety

### Import Types from Backend

Always import types from the API package instead of redefining them:

```typescript
// Good - Import from backend route types
import type {
  ListItemsOutput,
  ItemWithRole,
} from "../../server/routes/{feature}/types";

// Bad - don't redefine
interface Item {
  id: string;
  name: string;
}
```

### Fetch Response Typing

`response.json()` returns `unknown` in strict TypeScript. Always use type assertions:

```typescript
// Good - Type assertion
const data = (await response.json()) as ListItemsOutput;

// Good - Error responses
const errorData = (await response.json()) as {
  error?: string;
  error_description?: string;
};

// Bad - No type assertion
const data = await response.json();
setItems(data.items); // Error: 'data' is of type 'unknown'
```
