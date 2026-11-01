**A.** Continuing with `spec-work`: `items` is `undefined`, so accessing `items.reduce` throws. Since missing items means an empty invoice, the smallest change is to default the parameter to an empty array:

```js
function total(items = []) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

`total(undefined)` will return `0`; supplied arrays retain their existing behavior. This is the proposed change; I haven’t applied it or run checks.

**B.** It means a bug affecting password resets when the reset link has expired was fixed.

**C.** Entering `spec-plan`: the behavior and acceptance criteria are settled, and the remaining task is a concrete implementation outline.

1. Add the monthly CSV download handler behind `requireSupportManager`, using the project’s existing route conventions.
2. Accept a month in `YYYY-MM` format. Validate its format and calendar range before querying; return the existing invalid-input response for malformed values.
3. Compute `closedFrom` as midnight UTC on the month’s first day and `closedBefore` as midnight UTC on the next month’s first day. Use the half-open interval `closedFrom <= closedAt < closedBefore`, including December’s transition into January.
4. Query using the authenticated tenant context:

   ```js
   const tickets = await listTickets({
     tenantId: req.tenantId,
     closedFrom,
     closedBefore,
   });
   ```

   Confirm that `listTickets` enforces the tenant filter, closed-ticket restriction, and those boundary semantics. Never take the tenant ID from download parameters.

5. Map tickets to the two required columns, timestamp and public reference, using the existing ticket field names and the timestamp meaning defined by the settled criteria. Serialize with `writeCsv(rows, columns)` and its existing escaping behavior.
6. Return the CSV with `Content-Type: text/csv; charset=utf-8` and an attachment filename such as `closed-tickets-2026-10.csv`. For a month with no matching tickets, return a CSV containing the column headers.
7. Verify authorization, tenant isolation, exclusion of open tickets, inclusive start and exclusive end boundaries, December rollover, invalid month handling, empty results, and CSV escaping.

This is a chat-only implementation outline; no code changes or checks have been performed.

**D.** For `null`, the function returns `'(missing)'` because `null == null` is true. For an empty string, it returns `''` because `'' == null` is false and `String('')` remains empty. The snippet is sufficient to determine both results; Graphify’s unavailability does not affect this explanation.
