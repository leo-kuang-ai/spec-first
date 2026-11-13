**A.** Continuing under `spec-work`: `total(undefined)` fails because `undefined` has no `.reduce()` method. The smallest change is to default missing items to an empty array:

```js
function total(items = []) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

For `total(undefined)`, the empty array reduces to `0`, matching the settled requirement. This is a proposed change; I have not applied or tested it.

**B.** It means a bug affecting password reset when the reset link has expired was fixed.

**C.** Entering `spec-plan`: the behavior and acceptance criteria are settled, and you need a concrete implementation outline.

1. Add a monthly CSV download handler to the existing Express router, protected by `requireSupportManager`.
2. Accept a month in `YYYY-MM` format. Validate the year and month before constructing dates; reject invalid input with HTTP `400`.
3. Calculate `closedFrom` as midnight UTC on the first day of that month and `closedBefore` as midnight UTC on the first day of the next month. Use an inclusive lower bound and exclusive upper bound.
4. Read tickets with:
   ```js
   listTickets({
     tenantId: req.tenantId,
     closedFrom,
     closedBefore
   });
   ```
   Use the authenticated tenant context exclusively. Confirm that the existing query restricts results to closed tickets and applies these boundary semantics.
5. Map tickets to the timestamp and public reference columns. For this outline, interpret “timestamp” as the ticket’s closure time and serialize it as a UTC ISO timestamp; use the existing model fields for closure time and public reference.
6. Pass the mapped rows and column definitions to `writeCsv(rows, columns)`. Return its output with `Content-Type: text/csv; charset=utf-8` and an attachment filename such as `closed-tickets-2026-10.csv`. Return a header-only CSV when no tickets match.
7. Verify authorization, tenant isolation, exclusion of open tickets, inclusion at the exact month start, exclusion at the next month start, December rollover, invalid input, empty results, and correct CSV escaping.

This outline is based on the supplied interfaces; no repository changes or checks have been performed.

**D.** For `null`, it returns `'(missing)'` because `value == null` is true. For an empty string, it returns `''` because the condition is false and `String('')` remains empty. The snippet is sufficient to determine both results; Graphify is unnecessary.
