# Cross-Layer Contract Design Guide

> **Severity**: P1 - Data loss / silent failures

## Problem

A new module is added to the system. It performs write operations that appear successful:

- API returns success
- Database shows the data
- No errors in logs

But downstream consumers (clients, other services) never receive the data. The data effectively "disappears" from the user's perspective.

## Example Scenario

```
New Module writes to Business Tables (users, documents, etc.)
                    |
              [GAP: Missing event/notification]
                    |
Sync/Event Layer has nothing to consume
                    |
Downstream clients never see the data
```

## Initial Attempts (All Failed)

### 1. Check the new module's return values

```typescript
const result = await newModule.createItem(data);
console.log(result); // { success: true, id: "123" }
```

**Why it fails**: The module's local success doesn't guarantee system-wide success.

### 2. Check the database directly

```sql
SELECT * FROM business_table WHERE id = '123';
-- Row exists!
```

**Why it fails**: Data exists in one table, but the cross-layer contract requires entries in multiple tables.

### 3. Check client-side code

```typescript
// Client polling/subscribing...
const events = await fetchEvents();
// Returns empty array - no new events
```

**Why it fails**: The problem isn't in the client. The events were never created server-side.

## Root Cause

The bug is not in any single layer - **each layer is "correct" in isolation**. The bug exists in the **interface between layers**:

| Layer         | Status     | Reality                      |
| ------------- | ---------- | ---------------------------- |
| New Module    | Working    | Writes to business table     |
| Event Layer   | Working    | Processes events correctly   |
| Client        | Working    | Fetches events correctly     |
| **Interface** | **BROKEN** | No events created for writes |

## Solution

### 1. Document Cross-Layer Contracts

Before implementing any new module that writes data, answer these questions:

```markdown
## Cross-Layer Contract Checklist

1. What tables does this module write to?
2. What other systems need to know about these writes?
3. What is the mechanism for notification? (events, webhooks, etc.)
4. Who is responsible for creating the notification?
5. How do we verify the notification was created?
```

### 2. Classify Operations

Explicitly categorize operations by their cross-layer requirements:

```typescript
/**
 * Operation classification:
 * - READ: No cross-layer notification needed
 * - WRITE: Must create event for downstream consumers
 * - METADATA: Define explicitly per operation
 */
type OperationType = "read" | "write" | "metadata";

const operationRegistry: Record<string, OperationType> = {
  listItems: "read",
  getItem: "read",
  createItem: "write", // Must notify!
  updateItem: "write", // Must notify!
  deleteItem: "write", // Must notify!
  getStats: "metadata",
};
```

### 3. Enforce Contracts Architecturally

Make it impossible to forget the cross-layer notification:

**Option A: Wrapper Functions**

```typescript
async function writeWithNotification<T>(
  db: Database,
  writeOperation: () => Promise<T>,
  createNotification: (result: T) => NotificationData,
): Promise<T> {
  const result = await writeOperation();
  await createNotification(result);
  return result;
}
```

**Option B: Database Triggers** (if supported)

```sql
CREATE TRIGGER after_business_insert
AFTER INSERT ON business_table
BEGIN
  INSERT INTO event_table (table_name, operation, row_id, timestamp)
  VALUES ('business_table', 'INSERT', NEW.id, unixepoch() * 1000);
END;
```

**Option C: Middleware/Interceptor**

```typescript
const syncAwareDb = new Proxy(db, {
  get(target, prop) {
    if (prop === "insert" || prop === "update" || prop === "delete") {
      return (...args) => {
        const result = target[prop](...args);
        // Automatically create event
        return result;
      };
    }
    return target[prop];
  },
});
```

### 4. Add End-to-End Tests

Unit tests cover individual layers. Cross-layer bugs require E2E tests:

```typescript
test("new module write flows to client", async () => {
  // 1. Perform write operation
  const item = await newModule.createItem({ name: "test" });

  // 2. Verify event was created
  const events = await db.query.events.findMany({
    where: eq(events.rowId, item.id),
  });
  expect(events).toHaveLength(1);

  // 3. Verify client can receive
  const clientData = await clientApi.sync();
  expect(clientData.items).toContainEqual(
    expect.objectContaining({ id: item.id }),
  );
});
```

### 5. Add Runtime Monitoring

Even with all safeguards, verify in production:

```sql
-- Find orphan records: business data without corresponding events
SELECT b.id, b.created_at
FROM business_table b
LEFT JOIN event_table e ON e.row_id = b.id
WHERE e.id IS NULL
  AND b.created_at > datetime('now', '-1 day');
```

## Key Insights

### 1. Three Questions for New Modules

When adding any new module that interacts with existing systems:

1. **Which existing layers does it touch?**
2. **What is the contract at each interaction point?**
3. **How do we verify contracts are followed?**

### 2. Cross-Layer Bug Characteristics

- Each layer appears "correct" when tested in isolation
- Bug manifests only in the full system flow
- Traditional unit tests don't catch it
- Requires E2E tests or contract tests

### 3. Function Signature Changes are Dangerous

When modifying shared functions:

```typescript
// Before
async function doOperation(db: Database, data: Data) {}

// After - added context parameter
async function doOperation(db: Database, ctx: Context, data: Data) {}
```

**Always grep all call sites** when changing function signatures. Missing a call site can cause silent data corruption.

## Prevention Checklist

- [ ] Document cross-layer contracts before implementation
- [ ] Classify all operations (read/write/metadata)
- [ ] Enforce notifications architecturally (not by convention)
- [ ] Add E2E tests covering full data flow
- [ ] Set up monitoring for orphan records
- [ ] Code review checklist: "Does this write operation notify downstream?"

## References

- [Contract Testing Patterns](https://martinfowler.com/bliki/ContractTest.html)
- [End-to-End Testing Best Practices](https://testing-library.com/docs/guide-disappearing-elements/)
